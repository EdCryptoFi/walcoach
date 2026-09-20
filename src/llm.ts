import { OpenAI } from "openai";
import { config } from "./config.js";
import type { Memory } from "./memory.js";
import { searchEnabled, searchTool, webSearch, type Source } from "./search.js";

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
You can call web_search when the user needs current, local or factual information (an event, a race, a price, a place, a product, a how-to you are unsure of). Use it sparingly, at most twice. When you use it, weave the findings into a short answer and cite sources as [1], [2]. Never search for coaching, motivation or habit questions.` : `
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

  for (let round = 0; round < MAX_SEARCHES + 1; round++) {
    const completion = await groq.chat.completions.create({
      model: config.groqModel,
      temperature: 0.7,
      max_tokens: 500,
      messages,
      ...(searchEnabled && searches < MAX_SEARCHES ? { tools: [searchTool], tool_choice: "auto" as const } : {}),
    });
    const msg = completion.choices[0]?.message;
    const calls = msg?.tool_calls?.filter((t) => t.type === "function" && t.function.name === "web_search") ?? [];
    if (!msg || calls.length === 0) return { text: msg?.content?.trim() || "…", sources };

    messages.push(msg);
    for (const call of calls) {
      let query = "";
      try { query = String((JSON.parse(call.function.arguments || "{}") as { query?: string }).query ?? ""); } catch { /* ignore */ }
      searches++;
      let content = "Search unavailable.";
      if (query) {
        try {
          const result = await webSearch(query);
          content = result.context;
          for (const src of result.sources) if (!sources.some((x) => x.url === src.url)) sources.push(src);
          console.log(`[search] q="${query.slice(0, 60)}" results=${result.sources.length}`);
        } catch (err) {
          console.error("[search] failed:", (err as Error).message);
        }
      }
      messages.push({ role: "tool", tool_call_id: call.id, content });
    }
  }
  // Ran out of rounds: answer with what we have.
  const final = await groq.chat.completions.create({ model: config.groqModel, temperature: 0.7, max_tokens: 500, messages });
  return { text: final.choices[0]?.message?.content?.trim() || "…", sources };
}
