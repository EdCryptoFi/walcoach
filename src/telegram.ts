import { Bot } from "grammy";
import { config } from "./config.js";
import { log } from "./log.js";
import { chat, resetHistory } from "./chat.js";
import { generateReply } from "./llm.js";
import { listMemories, memwal, recallForUser, rememberExplicit } from "./memory.js";
import { stats } from "./stats.js";

if (!config.telegramToken) {
  console.error("TELEGRAM_BOT_TOKEN is not set. Use `npm run web` for the website, or add a token from @BotFather.");
  process.exit(1);
}
const bot = new Bot(config.telegramToken);

// Per-user switch to demo the "before" behaviour (no recall, no learning).
const memoryDisabled = new Set<number>();

function nameOf(ctx: { from?: { first_name?: string; username?: string } }): string {
  return ctx.from?.first_name || ctx.from?.username || "friend";
}

bot.command("start", async (ctx) => {
  const userId = ctx.from!.id;
  const name = nameOf(ctx);
  const known = memoryDisabled.has(userId) ? [] : (await recallForUser(userId, `who is ${name}, their goals and current focus`, 5)).memories;
  if (known.length > 0) {
    const reply = await generateReply(name, known, [{ role: "user", content: "Hi, I'm back. Greet me briefly and pick up where we left off." }]);
    await ctx.reply(reply.text);
  } else {
    await ctx.reply(
      `Hey ${name}! I'm ${config.botName}, a coach that actually remembers you between conversations (memories are encrypted and stored on Walrus).\n\nTell me what you're working on — a habit, a goal, something you keep putting off.`,
    );
  }
});

bot.command("memories", async (ctx) => {
  const userId = ctx.from!.id;
  const memories = await listMemories(userId);
  if (memories.length === 0) return ctx.reply("I don't have any memories about you yet. Let's talk!");
  const lines = memories.map((m, i) => `${i + 1}. ${m.text}`).join("\n");
  await ctx.reply(`🧠 What I remember about you (${memories.length}, stored on Walrus):\n\n${lines}`);
});

bot.command("remember", async (ctx) => {
  const fact = ctx.match?.trim();
  if (!fact) return ctx.reply("Usage: /remember I run every Tuesday and Thursday at 7am");
  const result = await rememberExplicit(ctx.from!.id, nameOf(ctx), fact);
  await ctx.reply(`Got it, saved.\nblob: ${result.blob_id}`);
});

bot.command("memory", async (ctx) => {
  const userId = ctx.from!.id;
  const arg = ctx.match?.trim().toLowerCase();
  if (arg === "off") {
    memoryDisabled.add(userId);
    return ctx.reply("Memory OFF — I'll answer like a bot that forgets you (nothing recalled, nothing stored).");
  }
  if (arg === "on") {
    memoryDisabled.delete(userId);
    return ctx.reply("Memory ON — recall + learning enabled again.");
  }
  await ctx.reply(`Memory is ${memoryDisabled.has(userId) ? "OFF" : "ON"}. Use /memory on or /memory off.`);
});

bot.command("help", (ctx) =>
  ctx.reply(
    [
      "Just talk to me. Commands:",
      "/memories — what I remember about you",
      "/remember <fact> — store something explicitly",
      "/memory on|off — toggle long-term memory (demo the difference)",
      "/reset — clear short-term chat context (long-term memory stays)",
    ].join("\n"),
  ),
);

bot.command("reset", (ctx) => {
  resetHistory(ctx.from!.id);
  return ctx.reply("Short-term context cleared. I still remember the long-term stuff.");
});

bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const name = nameOf(ctx);
  const text = ctx.message.text;
  const useMemory = !memoryDisabled.has(userId);

  stats.recordMessage(userId, name);
  await ctx.replyWithChatAction("typing");

  try {
    // recall → generate → learn (see src/chat.ts). Learning runs in the background.
    const { reply, sources } = await chat(userId, name, text, useMemory);
    await ctx.reply(sources.length ? `${reply}\n\n${sources.map((s, i) => `[${i + 1}] ${s.url}`).join("\n")}` : reply);
  } catch (err) {
    log.error("telegram.chat.failed", err, { user: userId });
    await ctx.reply("Something broke on my side — try again in a moment.");
  }
});

bot.catch((err) => log.error("telegram.bot", err));

async function main() {
  const health = await memwal.health();
  console.log(`Walrus Memory relayer: ${health.status} v${health.version} (${config.memwalServerUrl})`);
  console.log(`LLM: ${config.groqModel} via Groq`);
  await bot.api.setMyCommands([
    { command: "start", description: "Say hi (I'll pick up where we left off)" },
    { command: "memories", description: "See what I remember about you" },
    { command: "remember", description: "Store a fact explicitly" },
    { command: "memory", description: "Toggle memory on/off" },
    { command: "reset", description: "Clear short-term context" },
    { command: "help", description: "Commands" },
  ]);
  console.log("Bot is running (long polling). Press Ctrl+C to stop.");
  await bot.start();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
