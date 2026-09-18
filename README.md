# Walrus Coach Bot

A Telegram coaching companion that actually remembers you between conversations.
Long-term memory is stored encrypted on [Walrus](https://walrus.xyz) via
[Walrus Memory](https://memory.walrus.xyz); the LLM is **Llama 3.3 70B running on Groq**
(no Anthropic/OpenAI in the loop).

Built for [Walrus Session 8: Chatbots That Remember](https://www.deepsurge.xyz/hackathons/c0141a4a-21be-4009-bc63-7c168608c849).

## How memory works

Every message goes through three steps ([src/index.ts](src/index.ts)):

1. **Recall** — the user's message is used as a semantic query against their own
   Walrus Memory namespace (`coach-<telegram user id>`). Only hits with cosine
   distance `< 0.7` are kept. ([src/memory.ts](src/memory.ts) → `recallForUser`)
2. **Generate** — the recalled facts are injected into the system prompt and Llama
   answers with the short-term chat history. ([src/llm.ts](src/llm.ts))
3. **Learn** — after the reply is sent, the exchange is passed to `analyzeAndWait`,
   which extracts durable facts (goals, habits, constraints, progress) and stores
   each one as its own encrypted blob on Walrus. The user never waits on storage.

Short-term context (last 12 turns) lives in RAM. Everything long-term lives on Walrus,
so restarting the bot, switching devices, or coming back a week later changes nothing.

Namespaces are the isolation boundary: user A's recall can never surface user B's
memories, even though both are written by the same delegate key.

## Commands

| Command | What it does |
|---|---|
| `/start` | Greets you — and if it knows you, picks up where you left off |
| `/memories` | Lists what the bot remembers about you (straight from Walrus) |
| `/remember <fact>` | Stores a fact explicitly |
| `/memory on\|off` | Toggles long-term memory — `off` shows the "before" behaviour |
| `/reset` | Clears short-term context only |

## Setup

Requirements: Node.js ≥ 18.

```bash
git clone <this repo>
cd walrus-coach-bot
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Where to get it |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram → [@BotFather](https://t.me/BotFather) → `/newbot` |
| `GROQ_API_KEY` | https://console.groq.com (free tier) |
| `MEMWAL_PRIVATE_KEY`, `MEMWAL_ACCOUNT_ID` | https://memory.walrus.xyz → create account → delegate key |
| `MEMWAL_SERVER_URL` | `https://relayer.memory.walrus.xyz` (mainnet) or `https://relayer-staging.memory.walrus.xyz` (testnet) |

Verify credentials with a real write + recall round-trip:

```bash
npm run check
```

Run the bot (long polling — no public URL needed):

```bash
npm run dev      # with reload
npm start        # plain
```

Usage evidence for the write-up (messages and facts stored per user):

```bash
npm run stats
```

## Project layout

```
src/index.ts    Telegram bot, commands, recall → generate → learn loop
src/memory.ts   Walrus Memory SDK wrapper (per-user namespaces)
src/llm.ts      Groq / Llama client and system prompt
src/stats.ts    Local per-user counters (evidence only; Walrus is the source of truth)
scripts/check.ts  Credential + round-trip check
scripts/stats.ts  Prints the usage table
```

## Stack

- Runtime: Node.js + TypeScript (`tsx`)
- Telegram: [grammY](https://grammy.dev)
- LLM: `llama-3.3-70b-versatile` via Groq's OpenAI-compatible API
- Memory: `@mysten-incubation/memwal` (Walrus + SEAL encryption + Sui ownership)

## License

MIT
