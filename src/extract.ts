/**
 * LLM-side fact extraction (used when MEMORY_EXTRACTOR=llm, the default).
 *
 * The relayer's built-in `analyze` works, but we found two rough edges during
 * evaluation: it alternates languages for the same user (hurts recall) and
 * the upstream extractor returns transient 5xx. Doing extraction with our own
 * model gives us a stable language, a consistent "<Name> ..." subject and
 * cheap dedup before anything hits Walrus.
 */
import OpenAI from "openai";
import { config } from "./config.js";

const groq = new OpenAI({ apiKey: config.groqApiKey, baseURL: "https://api.groq.com/openai/v1" });

const PROMPT = `You extract durable facts about a person from one exchange between them and their coach.

Rules:
- Only facts about the USER that will still matter in future conversations: goals, deadlines, schedule, constraints, health notes, preferences, habits, struggles, progress, life context.
- Ignore small talk, questions, and anything the coach said.
- Each fact is one short, self-contained sentence starting with the user's name.
- Write facts in the same language the user wrote in.
- Include concrete details (days, times, dates, numbers, names) when present.
- Do NOT repeat or rephrase anything already in "Already known". Only genuinely new information or a real update (e.g. a changed date, progress made).
- Return 0 to 4 facts. Return an empty list if there is nothing new.

Respond with JSON only: {"facts": ["...", "..."]}`;

export async function extractFacts(userName: string, userMessage: string, assistantReply: string, known: string[] = []): Promise<string[]> {
  const knownBlock = known.length > 0 ? `Already known:\n${known.map((k) => `- ${k}`).join("\n")}\n\n` : "";
  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    temperature: 0,
    max_tokens: 400,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: `User name: ${userName}\n\n${knownBlock}User: ${userMessage}\n\nCoach: ${assistantReply}` },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { facts?: unknown };
    if (!Array.isArray(parsed.facts)) return [];
    return parsed.facts.filter((f): f is string => typeof f === "string" && f.trim().length > 0).map((f) => f.trim());
  } catch {
    console.error("[extract] could not parse model output:", raw.slice(0, 200));
    return [];
  }
}
