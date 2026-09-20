import { OpenAI } from "openai";
import { config } from "./config.js";
import type { Memory } from "./memory.js";

// Groq exposes an OpenAI-compatible API, so the official openai client works as-is.
const groq = new OpenAI({ apiKey: config.groqApiKey, baseURL: "https://api.groq.com/openai/v1" });

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

function systemPrompt(userName: string, memories: Memory[]): string {
  const base = `You are ${config.botName}, a warm, direct personal coach chatting on Telegram with ${userName}.
Help them with habits, goals, routines, motivation and follow-through.
Keep replies short (2-5 sentences), conversational, no bullet lists unless asked. Reply in the same language the user writes in.
Ask at most one question per reply. Never invent facts about the user.`;

  if (memories.length === 0) {
    return `${base}\n\nYou have no stored memories about this person yet. Get to know them.`;
  }

  const lines = memories.map((m) => `- ${m.text}`).join("\n");
  return `${base}

What you remember about ${userName} from previous conversations (retrieved from Walrus Memory, most relevant first):
${lines}

Use these memories naturally when they matter: follow up on goals, reference past struggles, notice progress, respect stated preferences. Do not recite the list or say "according to my memory" — just act like someone who remembers.`;
}

export async function generateReply(userName: string, memories: Memory[], history: Turn[]): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    temperature: 0.7,
    max_tokens: 400,
    messages: [{ role: "system", content: systemPrompt(userName, memories) }, ...history],
  });
  return completion.choices[0]?.message?.content?.trim() || "…";
}
