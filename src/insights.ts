/**
 * Two small features built purely on recalled memories:
 *  - weekSummary: "your week" card (wins, stuck, next) from the user's facts.
 *  - handover: when the user switches mentor, the new mentor opens with one
 *    line that shows it shares the same memory (e.g. Zen mentions the training).
 */
import { OpenAI } from "openai";
import { AREAS, VOICES } from "./areas.js";
import { config } from "./config.js";
import { listMemories, type Identity, type Memory } from "./memory.js";
import { log } from "./log.js";

const groq = new OpenAI({ apiKey: config.groqApiKey, baseURL: "https://api.groq.com/openai/v1" });
const lines = (m: Memory[]) => m.map((x) => `- ${x.text}`).join("\n");

export interface WeekSummary { headline: string; wins: string[]; stuck: string[]; next: string[]; facts: number }

export async function weekSummary(who: Identity, userName: string): Promise<WeekSummary> {
  const memories = await listMemories(who, 30);
  if (memories.length === 0) return { headline: "Nothing here yet. Tell the coach what you're working on.", wins: [], stuck: [], next: [], facts: 0 };
  const completion = await groq.chat.completions.create({
    model: config.groqModel, temperature: 0.4, max_tokens: 400, response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `You summarise what a coach remembers about ${userName} into a short progress card. Use only the facts given; never invent. Write in the same language as the facts. No em dashes. Return JSON: {"headline": one warm sentence (max 90 chars), "wins": up to 3 short items (progress, decisions, things going well), "stuck": up to 3 short items (recurring blockers, risks), "next": up to 3 concrete next steps the coach would suggest}. Items are short phrases, not sentences.` },
      { role: "user", content: lines(memories) },
    ],
  });
  try {
    const j = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as Partial<WeekSummary>;
    const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 3) : []);
    return { headline: String(j.headline ?? "").slice(0, 140), wins: arr(j.wins), stuck: arr(j.stuck), next: arr(j.next), facts: memories.length };
  } catch (err) {
    log.warn("summary.unparseable", { user: who.id });
    return { headline: "Could not build the summary right now.", wins: [], stuck: [], next: [], facts: memories.length };
  }
}

export async function handover(who: Identity, userName: string, fromId: string | undefined, toId: string, voice: "character" | "neutral", pending: string[] = []): Promise<string | null> {
  const to = AREAS.find((a) => a.id === toId);
  if (!to) return null;
  const from = AREAS.find((a) => a.id === fromId);
  const stored = await listMemories(who, 20);
  // Facts still being indexed on Walrus count here too, so switching mentors right
  // after a message still produces a grounded greeting.
  const memories = [...stored, ...pending.filter((t) => !stored.some((m) => m.text === t)).map((text) => ({ text, distance: 0.3, blobId: "" }))];
  if (memories.length === 0) return null;
  const persona = voice === "character" && VOICES[to.id] ? ` Voice: ${VOICES[to.id]}` : "";
  const completion = await groq.chat.completions.create({
    model: config.groqModel, temperature: 0.7, max_tokens: 120,
    messages: [
      { role: "system", content: `You are the ${to.label} mentor of WalCoach, greeting ${userName} who just switched to you${from ? ` from the ${from.label} mentor` : ""}. All mentors share one memory of the user. Write ONE or TWO short sentences (max 220 characters total) that: greet them, mention one concrete thing you remember, preferably from another area of their life that matters for ${to.label} (e.g. sleep affecting training), and end with a question. Same language as the memories. No em dashes, no emojis, no list. If nothing in the memories is relevant, just greet warmly and ask what they want to work on in ${to.label}.${persona}` },
      { role: "user", content: lines(memories) },
    ],
  });
  return completion.choices[0]?.message?.content?.trim().slice(0, 300) || null;
}
