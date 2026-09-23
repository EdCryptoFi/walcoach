# Submission form, field by field

Form: https://airtable.com/appoDAKpC74UOqoDa/shro5iVzzjoWfZlPK
Rules: https://thewalrussessions.wal.app/chatbots/index.html · Deadline **Oct 9, 2026, 14:00 UTC**

`✏️` = only you can answer. Everything else is ready to paste.

| Field | Answer |
|---|---|
| Project name | **WalCoach** |
| Session | Session 8: Chatbot |
| Primary contact name | ✏️ |
| Email | ✏️ (cryptolairbr@gmail.com?) |
| Newsletter | ✏️ |
| Telegram handle | ✏️ |
| Discord handle | ✏️ **join https://discord.gg/walrusprotocol first, it is required** |
| Country | ✏️ Brazil |
| DeepSurge link | ✏️ after creating the project on DeepSurge |

### What does your chatbot do and who is it for?
> WalCoach is a personal coaching companion for anyone with a goal they keep dropping: a habit, a training plan, an exam, a pet routine. You pick one of seven mentors (Work, Fitness, Study, Pets, Cooking, Zen, Music) and they all share one memory of you, so the fitness coach knows about your sleep and the work coach knows about your stress. There is no sign-up, no password and no wallet: the browser creates a memory key that is your identity, that key opens a Walrus Memory account **owned by you** (we pay the gas through a sponsored transaction), and every fact the coach learns is stored encrypted on Walrus in that account. It answers in English, Portuguese or Spanish, whichever you write in.

### What does your chatbot store in memory and how does it use it?
> It stores durable facts about the person and the concrete advice the coach gave them: goals and deadlines, weekly schedule, constraints and injuries, preferences, progress, and lines like "Coach suggested a sheet pan dinner with chicken thighs, potatoes and broccoli". Each fact is tagged with a life area and written as one SEAL-encrypted blob on Walrus mainnet, in the Walrus Memory account that user owns. WalCoach holds a revocable delegate key on each account, so one server key serves many accounts rather than many keys crowding one.
> Before every reply it runs two recalls in that account: one driven by the message and one fixed "core profile" query for goals, schedule and constraints, so even "hi, I'm back" surfaces what matters. The recalled facts go into the system prompt, and the reply shows exactly which memories it used. After the reply, new facts are extracted and written back. Memory also drives three things outside the chat: a mentor handover when you switch coaches, a "Your week" summary built only from stored facts, and a daily push nudge.

### Chatbot use case
> Personal coaching and habit companion, with seven specialised mentors sharing one memory.

### Where is the chatbot deployed and how can judges access it?
> Website, open and free, no signup: **https://walcoach.vercel.app**
> Click any mentor, type a name, and the coach starts. To see memory working across sessions: send a message with a goal or a constraint, wait about a minute for the blob to land on Walrus, close the tab, reopen the page and ask about it. The left panel lists every stored fact with a link to its blob on Walruscan, and each reply shows which memories it used. The "Memory" switch in the header turns recall and learning off, which is the before/after in one click.

| Field | Answer |
|---|---|
| Which LLM did you build with? | Qwen (open-weight, via Groq) |
| Model name and version | `qwen/qwen3.8-27b` served by Groq, OpenAI-compatible API |
| How many agents wrote blobs on mainnet? | **1** |
| Blob count (asked on the DeepSurge form) | **1,068 blobs** owned on Sui mainnet by this account, **137 of them written during the session window** (from Sep 18). Counted from chain: `python3 scripts/count-blobs.py` and `scripts/count-blobs-window.py`. Requirement is 10. |
| MEMWAL_AGENT_ID (delegate public key) | `813aa47d09ee950eea12b0acf6fb2fe45c97b5b6b8db9cf1ecefc64f19a0b7fe` |
| Account ID (MemWalAccount object on Sui) | `0xf059b5c5b2429903359263c84c78190f6ac70063182d3b44eccb91e31bff7f3d` (the project account, where the session blobs were written). Since 2026-09-23 **each new user also gets their own account**, created by a sponsored transaction and owned by their browser key, with WalCoach as a revocable delegate. Example created from the live site: `0xd91cdff1d79e258a92df9ae9a7b57a20e5c6fac683f033d6db48a85746cb8734`, owner `0x713a0025…48a4`. |
| Confirm agents wrote blobs on mainnet | Yes, verified on-chain: type `0xe7c16fbe…::account::MemWalAccount`, Sui mainnet |
| Explorer link to the MemWalAccount object | https://suiscan.xyz/mainnet/object/0xf059b5c5b2429903359263c84c78190f6ac70063182d3b44eccb91e31bff7f3d<br>A per-user account: https://suiscan.xyz/mainnet/object/0xd91cdff1d79e258a92df9ae9a7b57a20e5c6fac683f033d6db48a85746cb8734 |
| Which tool did you use to connect with Walrus Memory? | TypeScript SDK `@mysten-incubation/memwal` (default relayer client), plus the memwal MCP server for development, plus `@mysten/sui` to create each user's account on chain with a sponsored transaction |
| X account | https://x.com/EdCriptoFi |
| SUI address (reward) | ✏️ **create a dedicated wallet for Sessions** at https://slush.app/get-started and send a WAL test transaction |
| GitHub | https://github.com/EdCryptoFi and https://github.com/EdCryptoFi/walcoach |
| Link to Article | ✓ https://medium.com/@cryptolairbr/walcoach-remebers-you-b2f3b5596868 |
| Link to article tweet | ✏️ reply under the @WalrusProtocol Session 8 announcement, tagging @WalrusProtocol, #WalrusMemory |
| Link to promo post | ⚠️ https://www.reddit.com/user/CryptoLairBR/comments/1wofdud/walcoach_remembers_you/ is a **profile post, not a community**. The prize asks for a post *in* a community and is judged on reach. Cross-post it to a real subreddit before submitting. |

### One bug or friction point you hit with Walrus Memory *(pick one, the rest go in the GitHub tickets field)*
> `recall()` intermittently returns an empty result set with HTTP 200 for a namespace that has indexed memories. The same query seconds later returns the expected hits. For a chatbot this is the worst possible failure mode, because the bot answers as if it had never met the user instead of surfacing an error. I had to work around it by retrying a recall when a user I know has stored facts comes back with zero results. Environment: `@mysten-incubation/memwal` 0.1.7, Node 22 on Vercel functions, relayer.memory.walrus.xyz (mainnet).

### One improvement idea for Walrus Memory
> Make write latency and quota observable, and make updates possible. Three concrete pieces: (1) a `waitForIndexed` option or an `indexed_at` field so a client knows when a written blob is actually recallable, instead of guessing between 5 and 30 seconds; (2) rate-limit headers (`X-RateLimit-Remaining`, documented per-endpoint weights) since limits are per delegate key and a multi-user chatbot backend shares one key, and today exhaustion surfaces as `seal encrypt failed: RpcError: Too Many Requests`, which reads like a crypto bug; (3) an upsert or supersede API, because `remember()` is append-only, so when a user changes a deadline the old fact keeps competing with the new one in recall.

### Feedback on Walrus Memory (GitHub tickets)
> ✏️ Open the issues from [FRICTION.md](https://github.com/EdCryptoFi/walcoach/blob/main/FRICTION.md) at https://github.com/MystenLabs/MemWal/issues, then list them here as "short description, link". The eight documented points: transient 500/503 on `/api/analyze`; `seal encrypt failed: Too Many Requests` from the relayer's own Sui RPC; prompt template leaking into an extracted fact; `analyze` flipping output language for the same user; no relevance threshold and undocumented cross-language distances; same `job_id` returned on a retried `rememberAndWait`; empty recall with HTTP 200; rate limits per delegate key undocumented.

| Field | Answer |
|---|---|
| Communities outside Web3 worth engaging | ✏️ suggestion: r/selfhosted, r/LocalLLaMA and r/SideProject (builders who already care about owning their data and running open models), plus dev.to and Hacker News. Say honestly whether you are part of them and could introduce. |
| How did you find out about the session? | ✏️ |
| Participated in sessions before? | ✏️ yes, Walrus Sessions 6 and the Prompt Jam |
| Used Walrus Memory before? | ✏️ yes |
| Session feedback | ✏️ optional |
| Confirm rules | ✏️ |

## Two things to decide before submitting

1. **Dedicated wallet.** The rules require "a dedicated wallet address created for Sessions", and prizes are paid in WAL. The address in your memwal credentials is your existing wallet, not a dedicated one.
2. **Dedicated delegate key (optional, cosmetic).** Your agent ID is labelled "MCP Client", created 2026-08-05: the same key your personal Claude memory uses, and WalCoach writes with it too. That is why the account holds 1,068 blobs while only 137 date from the session. A second delegate key labelled "WalCoach" on the same account would read the same memories and look cleaner on the form, but it would not separate the blob count, since both share the account's owner address. Only a brand new MemWalAccount would, and that would leave the app's existing memories behind. My advice: keep the account, and state the two numbers honestly as above.
