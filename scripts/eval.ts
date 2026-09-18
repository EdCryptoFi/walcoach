/**
 * Evaluation harness: 3 simulated users, 2 sessions each.
 *
 * Session 1 — the user shares facts about themselves (memory ON).
 * Session 2 — short-term history is wiped (a "new day"), and the user sends
 * probes whose good answer depends on remembering session 1. Each probe is
 * answered twice: with memory OFF (baseline) and ON, and checked against
 * keywords that only a bot with memory could produce.
 *
 * Run: npm run eval   (uses namespace prefix "eval-<run id>" so it never touches real users)
 */
process.env.MEMWAL_NAMESPACE_PREFIX = `eval-${Date.now().toString(36)}`;
process.env.TELEGRAM_BOT_TOKEN ||= "unused";

const { chat, resetHistory } = await import("../src/chat.js");
const { listMemories } = await import("../src/memory.js");
const { stats } = await import("../src/stats.js");
const { writeFileSync, mkdirSync } = await import("node:fs");

interface Probe { text: string; expectAny: string[] }
interface Persona { id: number; name: string; session1: string[]; session2: Probe[] }

const personas: Persona[] = [
  {
    id: 900001,
    name: "Ana",
    session1: [
      "Oi! Quero começar a correr, meta é fazer 5 km sem parar. Nunca corri na vida.",
      "Trabalho em turno noturno num hospital, então só consigo treinar terça e quinta de manhã, tipo 6h.",
      "Ah, e tenho uma dor chata no joelho esquerdo, um fisioterapeuta disse pra não forçar.",
      "Odeio academia, quero correr na rua mesmo, no parque perto de casa.",
      "Tem uma corrida de 5k no dia 12 de novembro que eu queria fazer.",
    ],
    session2: [
      { text: "Oi, voltei. Hoje tô sem vontade nenhuma de treinar.", expectAny: ["5", "novembro", "prova", "corrida", "joelho", "terça", "quinta", "parque"] },
      { text: "Corri hoje mas senti um incômodo. Continuo?", expectAny: ["joelho", "fisio"] },
      { text: "Que dias mesmo eu tinha combinado de treinar?", expectAny: ["terça", "quinta"] },
    ],
  },
  {
    id: 900002,
    name: "Bruno",
    session1: [
      "Fala! Tô estudando pra certificação AWS Solutions Architect, prova marcada pra 20 de outubro.",
      "Meu plano é estudar 1 hora por dia depois do jantar, mas acabo no celular e perco a hora.",
      "Tenho dois filhos pequenos, então de manhã é impossível estudar.",
      "O que mais tenho dificuldade é a parte de networking, VPC e essas coisas.",
      "Uso o curso do Stephane Maarek na Udemy e faço simulados no Tutorials Dojo.",
    ],
    session2: [
      { text: "E aí, voltei. Ontem não estudei de novo.", expectAny: ["celular", "jantar", "outubro", "aws", "prova", "20"] },
      { text: "Quer me sugerir o que revisar hoje?", expectAny: ["vpc", "networking", "rede"] },
      { text: "Por que eu não consigo estudar de manhã mesmo?", expectAny: ["filho", "criança"] },
    ],
  },
  {
    id: 900003,
    name: "Carol",
    session1: [
      "Hi! I want to cut sugar. I drink like 3 coffees a day, each with two sugars.",
      "I work at an early-stage startup and I'm pretty stressed, that's when I reach for sweets.",
      "I'm vegetarian, and I already meditate 10 minutes every morning, that part is going well.",
      "My weak spot is 4pm at the office, there's always cake in the kitchen.",
      "Goal: zero added sugar for 30 days, started this Monday.",
    ],
    session2: [
      { text: "Hey, I'm back. Rough day today.", expectAny: ["sugar", "sweet", "cake", "coffee", "stress", "meditat", "30"] },
      { text: "It's almost 4pm and I'm tempted.", expectAny: ["cake", "kitchen", "4", "office"] },
      { text: "Any snack ideas for me?", expectAny: ["vegetarian", "veggie", "plant", "sugar"] },
    ],
  },
];

function hit(reply: string, expectAny: string[]): boolean {
  const r = reply.toLowerCase();
  return expectAny.some((k) => r.includes(k.toLowerCase()));
}

const lines: string[] = [`# Eval report — ${new Date().toISOString()}`, "", `Namespace prefix: \`${process.env.MEMWAL_NAMESPACE_PREFIX}\``, ""];
let total = 0, withMemory = 0, withoutMemory = 0;

for (const p of personas) {
  lines.push(`## ${p.name}`, "", "### Session 1 (sharing)", "");
  for (const text of p.session1) {
    const { reply, learning } = await chat(p.id, p.name, text, true);
    await learning; // make sure facts are indexed before session 2
    lines.push(`**${p.name}:** ${text}`, "", `**Coach:** ${reply}`, "");
  }

  const memories = await listMemories(p.id);
  lines.push(`### Memories stored on Walrus (${memories.length})`, "", ...memories.map((m) => `- ${m.text}`), "");

  lines.push("### Session 2 (new day, short-term context wiped)", "", "| Probe | Memory OFF | Memory ON |", "|---|---|---|");
  for (const probe of p.session2) {
    resetHistory(p.id);
    const off = await chat(p.id, p.name, probe.text, false);
    resetHistory(p.id);
    const on = await chat(p.id, p.name, probe.text, true);
    await on.learning;
    const offOk = hit(off.reply, probe.expectAny);
    const onOk = hit(on.reply, probe.expectAny);
    total++; if (onOk) withMemory++; if (offOk) withoutMemory++;
    const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n+/g, " ");
    lines.push(`| ${cell(probe.text)} | ${offOk ? "✅" : "❌"} ${cell(off.reply)} | ${onOk ? "✅" : "❌"} ${cell(on.reply)}<br><sub>recalled: ${on.memories.length}</sub> |`);
    console.log(`[eval] ${p.name} "${probe.text}" off=${offOk ? "✅" : "❌"} on=${onOk ? "✅" : "❌"} recalled=${on.memories.length}`);
  }
  lines.push("");
}

const summary = `**Probes answered using the right memory:** without memory ${withoutMemory}/${total}, with Walrus Memory ${withMemory}/${total}`;
lines.push("## Summary", "", summary, "", "```", "Facts stored per user:");
for (const [id, s] of Object.entries(stats.all()).filter(([id]) => id.startsWith("9000"))) lines.push(`${s.name} (${id}): ${s.facts} facts, ${s.messages} messages`);
lines.push("```");

mkdirSync("eval", { recursive: true });
writeFileSync("eval/report.md", lines.join("\n"));
console.log("\n" + summary);
console.log("Report: eval/report.md");
