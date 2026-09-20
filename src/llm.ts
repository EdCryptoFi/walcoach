import { OpenAI } from "openai";
import { config } from "./config.js";
import type { Memory } from "./memory.js";
import { extractPage, extractTool, searchEnabled, searchTool, webSearch, type Source, type TimeRange } from "./search.js";

// Groq exposes an OpenAI-compatible API, so the official openai client works as-is.
const groq = new OpenAI({ apiKey: config.groqApiKey, baseURL: "https://api.groq.com/openai/v1" });

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

function systemPrompt(userName: string, memories: Memory[]): string {
  const base = `You are ${config.botName}, a warm, direct personal coach chatting on Telegram with ${userName}.
Help them with habits, goals, routines, motivation and follow-through.
Keep replies short (2-5 sentences), conversational, plain text (bold sparingly, no headings, no bullet lists unless asked). Reply in the same language the user writes in.
Ask at most one question per reply. Never invent facts about the user.
You are a coach, not a doctor, therapist or financial advisor: for health, injury, medication, mental-health crises or money decisions, give general guidance and point to a professional.${searchEnabled ? `
You can call web_search when the user needs current, local or factual information (an event, a race, a price, a place, a product, a how-to you are unsure of), and read_page when they paste a link they want you to look at. Use tools sparingly, at most twice per reply. Weave the findings into a short answer, relate them to what you remember about the user, and cite sources as [1], [2]. Never search for coaching, motivation or habit questions.` : `
You have no web access: if a question depends on current or local information, say so plainly and suggest where to check.`}`;

  if (memories.length === 0) {
    return `${base}\n\nYou have no stored memories about this person yet. Get to know them.`;
  }

  const lines = memories.map((m) => `- ${m.text}`).join("\n");
  return `${base}

What you remember about ${userName} from previous conversations (retrieved from Walrus Memory, most relevant first; the [tag] is the life area):
${lines}

Use these memories naturally when they matter: follow up on goals, reference past struggles, notice progress, respect stated preferences. Do not recite the list or say "according to my memory" — just act like someone who remembers.`;
}

export interface Reply { text: string; sources: Source[] }

const MAX_SEARCHES = 2;

export async function generateReply(userName: string, memories: Memory[], history: Turn[]): Promise<Reply> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [{ role: "system", content: systemPrompt(userName, memories) }, ...history];
  const sources: Source[] = [];
  let searches = 0;
  const lastUser = [...history].reverse().find((t) => t.role === "user")?.content ?? "";
  const pastedUrls = lastUser.match(/https?:\/\/[^\s<>"']+/g) ?? [];
  const tools = searchEnabled ? [searchTool, ...(pastedUrls.length ? [extractTool] : [])] : [];

  for (let round = 0; round < MAX_SEARCHES + 1; round++) {
    const completion = await groq.chat.completions.create({
      model: config.groqModel,
      temperature: 0.7,
      max_tokens: 500,
      messages,
      ...(tools.length && searches < MAX_SEARCHES ? { tools, tool_choice: "auto" as const } : {}),
    });
    const msg = completion.choices[0]?.message;
    const calls = msg?.tool_calls?.filter((t) => t.type === "function" && (t.function.name === "web_search" || t.function.name === "read_page")) ?? [];
    if (!msg || calls.length === 0) return { text: msg?.content?.trim() || "…", sources };

    messages.push(msg);
    for (const call of calls) {
      let args: { query?: string; time_range?: TimeRange; url?: string } = {};
      try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* ignore */ }
      searches++;
      let content = "Tool unavailable.";
      try {
        if (call.function.name === "read_page") {
          // Only pages the user actually pasted — the model must not browse on its own.
          const url = pastedUrls.find((u) => u === args.url) ?? pastedUrls[0];
          if (url) { const r = await extractPage(url); content = r.context; for (const src of r.sources) if (!sources.some((x) => x.url === src.url)) sources.push(src); console.log(`[read] ${url.slice(0, 60)}`); }
        } else if (args.query) {
          const r = await webSearch(String(args.query), args.time_range);
          content = r.context;
          for (const src of r.sources) if (!sources.some((x) => x.url === src.url)) sources.push(src);
          console.log(`[search] q="${String(args.query).slice(0, 60)}"${args.time_range ? ` range=${args.time_range}` : ""} results=${r.sources.length}`);
        }
      } catch (err) {
        console.error(`[${call.function.name}] failed:`, (err as Error).message);
      }
      messages.push({ role: "tool", tool_call_id: call.id, content });
    }
  }
  // Ran out of rounds: answer with what we have.
  const final = await groq.chat.completions.create({ model: config.groqModel, temperature: 0.7, max_tokens: 500, messages });
  return { text: final.choices[0]?.message?.content?.trim() || "…", sources };
}
