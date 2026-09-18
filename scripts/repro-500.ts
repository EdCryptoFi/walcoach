process.env.TELEGRAM_BOT_TOKEN ||= "unused";
const { memwal } = await import("../src/memory.js");
const ns = "repro-500";
const inputs = [
  "Trabalho em turno noturno num hospital, então só consigo treinar terça e quinta de manhã, tipo 6h.",
  "Ah, e tenho uma dor chata no joelho esquerdo, um fisioterapeuta disse pra não forçar.",
  "Odeio academia, quero correr na rua mesmo, no parque perto de casa.",
  "Tem uma corrida de 5k no dia 12 de novembro que eu queria fazer.",
  "Conversation with Ana. Extract only durable facts about the user.\nUser: Odeio academia, quero correr na rua mesmo, no parque perto de casa.\nCoach: Entendo! Correr no parque é ótimo.",
  "I hate the gym, I want to run outside in the park near my house.",
];
for (const text of inputs) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const t = Date.now();
    try {
      const r = await memwal.analyze(text, ns);
      console.log(`OK   attempt=${attempt} ${Date.now() - t}ms facts=${r.fact_count} :: ${text.slice(0, 50)}`);
      for (const f of r.facts) console.log(`       + ${f.text}`);
      break;
    } catch (e) {
      console.log(`FAIL attempt=${attempt} ${Date.now() - t}ms :: ${text.slice(0, 50)} :: ${(e as Error).message.slice(0, 120)}`);
    }
  }
}
