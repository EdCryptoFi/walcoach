# Submission checklist — Walrus Session 8: Chatbots That Remember

Official rules (binding): https://thewalrussessions.wal.app/chatbots/index.html
Hackathon page: https://www.deepsurge.xyz/hackathons/c0141a4a-21be-4009-bc63-7c168608c849
Deadline: **October 9, 2026, 14:00 UTC** · Results: October 16 · Prizes paid in **WAL**

See [RULES-GAP.md](RULES-GAP.md) for the official requirements and what is still missing.

Fill in the `→` lines once the build is final. Nothing here is submitted yet.

---

## 1. DeepSurge — Register (builder registration, mandatory)

| Field | Answer |
|---|---|
| Registration questions (two Yes/No) | → |
| "Select all that apply" | → |
| Special Prizes (multi-select) | → Beyond the Big Two · Best Article · Bug Bounty · Promo Prize |
| Terms and Conditions | → accept |

## 2. DeepSurge — Create Project

| Field | Answer |
|---|---|
| Cover image (jpg/png) | → `docs/screenshot-landing.png` or a cropped hero |
| Project Name | → Walrus Coach |
| Description (rich text) | → 2–3 paragraphs: what it is, who it's for, how Walrus Memory is used (recall → generate → learn, per-user namespaces, tagged facts, daily nudges, outbox when the relayer is down), which model (Qwen 3.8 27B via Groq — not Anthropic/OpenAI). Link to the article. |
| Track | → `[Bugbounty 5x$100], [Best article 3x$100], [Beyond the Big Two 2x$150], [Promo Prize 5x$100]` (the only track listed; main prize is judged on all submissions) |
| Deployment network (`0x...`) | ✓ `0xf059b5c5b2429903359263c84c78190f6ac70063182d3b44eccb91e31bff7f3d` (Walrus Memory account / agent id, Sui mainnet) |
| Agent ID + blob count (proof, ≥10 blobs required) | ✓ agent id above; count with `npm run blobs` |
| Dedicated wallet address created for Sessions | → **create a fresh Sui wallet that can receive WAL** |
| Public projects page | → yes |
| Team | → Ed CryptoFi (@edcriptofi) |
| **Project Repo\*** (GitHub) | → https://github.com/<user>/walrus-coach — **must be created and pushed** (public, MIT, README has setup) |
| Website | ✓ https://walcoach.vercel.app |
| **Demo Video\*** (YouTube) | → 1–2 min screen recording: day-1 conversation, close tab, "new session" / another device with the memory key, coach picks up where it left off; show the "Recalled for the last reply" panel and Memory OFF vs ON. Optionally the daily nudge notification. |
| Extra links | → Article (Medium/Inkray), X post, GitHub issues filed |
| Media (jpg/png/gif) | → `docs/screenshot-landing.png`, `docs/screenshot-chat.png`, a mobile screenshot, a GIF of the before/after |

## 3. Airtable — official submission form

https://airtable.com/appoDAKpC74UOqoDa/shro5iVzzjoWfZlPK

| Field | Answer |
|---|---|
| LLM / runtime | → Qwen 3.8 27B (`qwen/qwen3.8-27b`) via Groq, OpenAI-compatible API. Node.js 22 + TypeScript, Hono on Vercel. |
| Public GitHub repo | → same as above |
| Bug / friction / improvement idea for Walrus Memory | → summarize `FRICTION.md` (8 items) + links to the GitHub issues filed at https://github.com/MystenLabs/MemWal/issues |
| Published article (Medium or Inkray) | → |
| X post (tag @WalrusProtocol, #WalrusMemory, under the session announcement) | → |
| Promo link (community outside Walrus/Sui: subreddit, dev forum…) | → e.g. r/SideProject, r/ChatGPTCoding, dev.to, Hacker News "Show HN" |
| Evidence of ≥3 users with ≥10 memories each | → `npm run stats` table + screenshots of each user's "Everything it remembers" panel |

## 4. The article (500–800 words) — must cover

- [ ] What the chatbot does, who it's for, the problem it solves
- [ ] How Walrus Memory is integrated: what gets stored, when it's recalled, how it shapes responses
- [ ] Before/after: bot without memory vs with it — what changed for the people talking to it
- [ ] Evidence of real use: screenshots, logs, video or live link showing recall across sessions
- [ ] Which model/runtime (for "Beyond the Big Two") and the integration friction hit
- [ ] Title/opening written for someone searching "how to add memory to a chatbot"
- [ ] Honest over polished: what broke (rate limits, empty recalls, 5xx) and how it was handled

## 5. Bug bounty — GitHub issues to open at MystenLabs/MemWal

From `FRICTION.md`, each with steps to reproduce, expected vs actual, environment (model, runtime, OS, SDK version):
- [ ] #1 transient 500/503 on `/api/analyze`
- [ ] #2 `seal encrypt failed … Too Many Requests` (relayer's own Sui RPC throttling surfaces as a failed job)
- [ ] #3 prompt template leak (`standard>`) in extracted fact
- [ ] #4 `analyze` flips output language for the same user
- [ ] #5 cross-language recall distances vs the documented 0.7 cutoff
- [ ] #6 same `job_id` returned on retried `rememberAndWait`
- [ ] #7 `recall` returns empty with HTTP 200 for a namespace that has memories
- [ ] #8 rate limits per delegate key/account undocumented; no weights/headers

## 6. Before submitting — run through

- [x] `vercel deploy --prod` → https://walcoach.vercel.app live, cron active
- [x] GitHub repo public: https://github.com/EdCryptoFi/walcoach
- [ ] 3+ real users × 10+ memories, for at least a few days
- [ ] Demo video uploaded (unlisted is fine)
- [ ] Article published, X post up, promo post up
- [ ] Issues filed
- [ ] DeepSurge project created + Airtable form sent
