/**
 * LLM-side fact extraction (used when MEMORY_EXTRACTOR=llm, the default).
 *
 * The relayer's built-in `analyze` works, but we found two rough edges during
 * evaluation: it alternates languages for the same user (hurts recall) and
 * the upstream extractor returns transient 5xx. Doing extraction with our own
 * model gives us a stable language, a consistent "<Name> ..." subject and
 * cheap dedup before anything hits Walrus.
 */
import { OpenAI } from "openai";
import { AREAS, AREA_IDS } from "./areas.js";
import { config } from "./config.js";
import { log } from "./log.js";

const groq = new OpenAI({ apiKey: config.groqApiKey, baseURL: "https://api.groq.com/openai/v1" });

const PROMPT = `You extract durable facts about a person from their latest message to their coach (earlier turns are given only as context).

Rules:
- Facts about the USER that will still matter in future conversations: goals, deadlines, schedule, constraints, health notes, preferences, habits, struggles, progress, life context.
- ALSO keep concrete things the COACH gave the user that they may refer back to: a specific recipe or meal, a workout or study plan, a routine, a rule, a next step the user agreed to. Phrase these as "Coach suggested <specific thing> to <name>" with the concrete details (dish, ingredients, days, durations). Do not store generic encouragement or questions.
- Ignore small talk and questions.
- Ignore transient states and one-off events ("no motivation today", "slept badly", "skipped the gym once") unless the user frames them as a pattern ("I never manage to…", "every week…"). Progress worth keeping is a milestone or a decision, not a mood.
- Each fact is one short, self-contained sentence starting with the user's name, prefixed with ONE life-area tag in square brackets from this list:
${AREAS.map((a) => `  [${a.id}], ${a.hint}`).join("\n")}
- Write facts in the same language the user wrote in.
- Include concrete details (days, times, dates, numbers, names) when present.
- Do NOT repeat or rephrase anything already in "Already known". Only genuinely new information or a real update (e.g. a changed date, progress made).
- Return 0 to 4 facts. Return an empty list if there is nothing new.

Respond with JSON only: {"facts": ["[training] Ana runs on Tuesdays and Thursdays at 6am", "[food] Coach suggested a one-pan sheet dinner (chicken thighs, potatoes, broccoli) to Ana", "..."]}`;

export async function extractFacts(userName: string, userMessage: string, context: string, known: string[] = [], coachReply = ""): Promise<string[]> {
  const knownBlock = known.length > 0 ? `Already known:\n${known.map((k) => `- ${k}`).join("\n")}\n\n` : "";
  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    temperature: 0,
    max_tokens: 400,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: `User name: ${userName}\n\n${knownBlock}${context}\n\nUser (latest message): ${userMessage}\n\nCoach (reply to that message): ${coachReply}` },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { facts?: unknown };
    if (!Array.isArray(parsed.facts)) return [];
    return parsed.facts
      .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
      .map((f) => f.trim())
      .map((f) => (AREA_IDS.some((id) => f.toLowerCase().startsWith(`[${id}]`)) ? f : `[life] ${f}`));
  } catch {
    log.warn("extract.unparseable", { raw: raw.slice(0, 200) });
    return [];
  }
}
