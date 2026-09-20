# Walrus Coach Bot

A coaching companion that actually remembers you between conversations. Runs as a
website (primary) and optionally as a Telegram bot — both share the same pipeline.
Long-term memory is stored encrypted on [Walrus](https://walrus.xyz) via
[Walrus Memory](https://memory.walrus.xyz); the LLM is **Qwen 3.8 27B (open-weight) running on Groq**
(no Anthropic/OpenAI in the loop).

Built for [Walrus Session 8: Chatbots That Remember](https://www.deepsurge.xyz/hackathons/c0141a4a-21be-4009-bc63-7c168608c849).

## How memory works

Every message goes through three steps ([src/chat.ts](src/chat.ts)):

1. **Recall** — two semantic queries against the user's own Walrus Memory namespace
   (`coach-<telegram user id>`): the message itself (cosine distance `< 0.8`) and a
   fixed "core profile" query (goal, deadline, schedule, constraints), merged and
   deduped — so even "hi, I'm back" surfaces what matters. ([src/memory.ts](src/memory.ts) → `recallForUser`)
2. **Generate** — the recalled facts are injected into the system prompt and the
   model answers with the short-term chat history. ([src/llm.ts](src/llm.ts))
3. **Learn** — after the reply is sent, durable facts (goals, habits, constraints,
   progress) are extracted from the exchange, deduplicated against what is already
   stored (recall with distance `< 0.25`), and each one is written as its own
   encrypted blob with `rememberAndWait`. The user never waits on storage.
   Set `MEMORY_EXTRACTOR=relayer` to use Walrus Memory's built-in `analyze` API
   instead of our own model for extraction ([src/extract.ts](src/extract.ts)).

Short-term context (last 12 turns) lives in RAM. Everything long-term lives on Walrus,
so restarting the bot, switching devices, or coming back a week later changes nothing.

Namespaces are the isolation boundary: user A's recall can never surface user B's
memories, even though both are written by the same delegate key.

## The web UI

`/` is a landing page: title, then a "pick your context" grid of 11 life-area characters,
then how it works. Clicking a character on a first visit opens the onboarding dialog (name +
generated memory key + "I saved my key" checkbox), then lands in `/chat?context=<area>` with
that area's opening line prefilled. On desktop the chat has three columns: the chosen agent
(character, area, "change context"), the conversation, and the memory panel.

![Walrus Coach web UI](docs/screenshot-chat.png)

**Life areas.** Every stored fact is tagged with one of 11 life areas
([src/areas.ts](src/areas.ts)) chosen by the extractor — `[training] Ana runs on
Tuesdays`. The chat shows conversation starters per area on an empty screen and lights
up a badge for each area the user has memories in. It nudges people to bring more of
their life to the coach (which is where memory pays off: bad sleep ruins training), and
it costs no database — the badges are computed from the user's own memories.

[public/index.html](public/index.html) is a single-page chat served by [src/web.ts](src/web.ts).
Identity is deliberately Web2-flavoured: no wallet, no account. On first visit you type a
name; the browser generates a **memory key** (`web-xxxx-xxxx-xxxx-xxxx`), keeps it in `localStorage`, and
that key becomes the user's memory namespace on Walrus. The key is shown in the side panel
with a Copy button; pasting it on another device ("I have a memory key") restores the same
memories there. Right after the first start a one-time card asks the user to save the key
(notes app, email to self, or Walnotes for Web3 users). Under the hood every memory is still
an encrypted blob on Walrus with on-chain ownership — the user just never sees a wallet.

The side panel is the point of the UI: it shows **which memories were recalled for the last
reply** (with their cosine distance) and **everything stored for this user on Walrus**.
The "Memory" switch in the header turns recall + learning off so you can see the "before".

API (all JSON): `POST /api/chat {userId, name, text}` → `{reply, memories}`,
`GET /api/memories?userId=`, `POST /api/remember`, `POST /api/memory {enabled}`, `POST /api/reset`.

## Proof it's on Walrus

Every memory in the panel has an ↗ link to its blob on the Walrus explorer
(`walruscan.com/mainnet/blob/<blob_id>`), and the "You" dialog links the Walrus Memory
account object on Sui (`/api/about` exposes network, account id and explorer URLs — nothing
secret). Judges can click any memory and see the encrypted blob on mainnet.

## Web search (optional)

Set `TAVILY_API_KEY` and the model gets one tool, `web_search` ([src/search.ts](src/search.ts)).
It is instructed to use it only for current, local or factual questions (a race, a price, a
place) — never for coaching or habits — and to cite sources as [1], [2]. When the user pastes
a link, a second tool `read_page` (Tavily extract) lets the coach read that page and relate it
to what it remembers. Basic search = 1 credit, extract = 1 credit per 5 pages; keep Tavily's
"pay as you go" off and the free tier (1,000 credits/month) is plenty. The UI shows
"searched the web, N sources" with clickable chips. Search results are never stored as
memories; only facts about the user are. Without the key the coach says plainly when a
question needs information it doesn't have.

## Privacy & terms

`/privacy` explains in plain language what the service is, that it is an AI and can be wrong,
that there are no cookies or accounts (only a memory key in `localStorage`), and exactly where
each kind of data goes (Groq, Walrus Memory relayer/Walrus, Tavily, Vercel logs). Both pages
carry a one-line disclaimer.

## Daily nudges (Web Push)

Memory that only answers is half the story; the coach also **reaches out**. In the chat
panel, "Daily nudge → Turn on" asks for notification permission and registers a Web Push
subscription. Once a day a Vercel Cron hits `/api/cron/nudge`, which:

1. recalls the subscription registry (a Walrus Memory namespace — no database),
2. for each user recalls their core profile (goal, schedule, struggle),
3. asks the model for one line grounded in those memories and today's weekday
   (e.g. *"It's Thursday — run day. How's the knee since Tuesday?"*), or skips,
4. pushes it. Expired subscriptions are dropped.

Config: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (generate with
`npx web-push generate-vapid-keys`) and `CRON_SECRET`. Trigger manually with
`curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/nudge`.

## When Walrus Memory is down

- **Recall fails** → the coach still answers, without memories, and the UI shows a
  banner saying so (`memoryAvailable: false` in the API).
- **Write fails** → facts are extracted alongside the reply and returned to the browser,
  which keeps an *outbox* in `localStorage`. When the memory list refreshes and a fact still
  isn't on Walrus after 90 s, the browser resends it through `/api/remember`, which dedupes
  (distance < 0.15) so late-landing writes never double up.
- Transient relayer errors (500/503/429, `Too Many Requests` from its Sui RPC) are retried
  with backoff and honour `retry_after_seconds`.

## Security notes

- The only server secret is the Walrus Memory delegate key. It can read/write every user's
  namespace, so it lives in env vars only, never in the repo. Rotate it at memory.walrus.xyz
  if it leaks.
- A user's memory key (`web-<uuid>`) *is* their identity — unguessable, but anyone holding
  it is that user. It is sent in POST bodies only (never URLs) so it stays out of logs.
- Throttles per user (10/min), per IP (30/min) and per instance (200/min); message length
  caps; strict CSP and standard security headers; memory texts are not logged in production.

## Telegram (optional)

Same pipeline, different adapter ([src/index.ts](src/index.ts)). Set `TELEGRAM_BOT_TOKEN`
and run `npm run telegram`.

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
| `TELEGRAM_BOT_TOKEN` | optional — Telegram → [@BotFather](https://t.me/BotFather) → `/newbot` |
| `GROQ_API_KEY` | https://console.groq.com (free tier) |
| `MEMWAL_PRIVATE_KEY`, `MEMWAL_ACCOUNT_ID` | https://memory.walrus.xyz → create account → delegate key |
| `MEMWAL_SERVER_URL` | `https://relayer.memory.walrus.xyz` (mainnet) or `https://relayer-staging.memory.walrus.xyz` (testnet) |

Verify credentials with a real write + recall round-trip:

```bash
npm run check
```

Run the website (http://localhost:3000):

```bash
npm run web        # or: npm run web:dev (reload on change)
```

### Deploy to Vercel (no server to keep running)

The API is stateless (the browser sends its short-term history; long-term memory is on
Walrus), so it runs as a single Vercel function ([api/index.ts](api/index.ts)); background
learning is kept alive with `waitUntil`. From the project folder:

```bash
vercel deploy --prod \
  -e GROQ_API_KEY=... -e GROQ_MODEL=qwen/qwen3.8-27b \
  -e MEMWAL_PRIVATE_KEY=... -e MEMWAL_ACCOUNT_ID=... \
  -e MEMWAL_SERVER_URL=https://relayer.memory.walrus.xyz -e MEMWAL_NAMESPACE_PREFIX=coach
```

(or set the same variables in the Vercel dashboard and run `vercel deploy --prod`).

Run the Telegram bot instead (long polling — no public URL needed):

```bash
npm run telegram
```

Usage evidence for the write-up (messages and facts stored per user):

```bash
npm run stats
```

## Evaluation (before/after)

`npm run eval` simulates 3 users × 2 sessions in an isolated namespace prefix:
session 1 shares facts, session 2 wipes short-term context and sends probes whose
good answer depends on remembering session 1. Every probe is answered with memory
OFF and ON and checked against keywords only a remembering bot could produce.
Full transcripts land in `eval/report.md`.

The relayer allows ~1000 weighted requests per account per hour; one eval run uses
a good share of that, so run it at most once an hour or the writes start failing with 429.

## Project layout

```
src/app.ts      The JSON API (Hono, stateless) shared by local server and Vercel
src/push.ts     Web Push subscriptions (stored on Walrus) and the daily nudge job
src/areas.ts    Life areas used to tag facts and drive badges
public/sw.js    Service worker for push notifications
src/web.ts      Local Node server: static page + API

public/index.html  The chat UI (vanilla HTML/CSS/JS, light + dark)
src/telegram.ts Telegram adapter (optional)
src/index.ts    Vercel entrypoint (re-exports the app)
src/memory.ts   Walrus Memory SDK wrapper (per-user namespaces)
src/llm.ts      Groq client and coach system prompt
src/extract.ts  Fact extraction with our own model (JSON out)
src/chat.ts     recall → generate → learn pipeline shared by bot and eval
src/stats.ts    Local per-user counters (evidence only; Walrus is the source of truth)
scripts/check.ts  Credential + round-trip check
scripts/stats.ts  Prints the usage table
scripts/eval.ts   Before/after evaluation with 3 simulated users
```

## Stack

- Runtime: Node.js + TypeScript (`tsx`)
- Web: [Hono](https://hono.dev) on Node
- Telegram (optional): [grammY](https://grammy.dev)
- LLM: `qwen/qwen3.8-27b` via Groq's OpenAI-compatible API
- Memory: `@mysten-incubation/memwal` (Walrus + SEAL encryption + Sui ownership)

## License

MIT
