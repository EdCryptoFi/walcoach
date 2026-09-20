# Audit — 2026-09-20

Run locally against the current build (`npm run web`), then re-verified on the Vercel preview.

## Pages & links
| Check | Result |
|---|---|
| `/`, `/how`, `/security`, `/privacy`, `/chat` | 200 |
| All internal links on every page (mentor cards → `/chat?context=…`, nav, footer, key section) | 200 |
| External links (Walnotes, DeepSurge, Google Fonts CSS) | 200 |
| Static assets (`/app.css`, `/icon.png`, `/characters/*.webp`, `/sw.js`) | 200 |
| Unknown page → `404` text; unknown `/api/*` → `404` JSON | ✓ |

## API
| Endpoint | Validation | Happy path |
|---|---|---|
| `POST /api/chat` | 400 on missing/invalid `userId`/`text`; 429 after 10/min per user (verified: 10×200 then 429); other endpoints 40/min | 200 with `reply, memories, memoryAvailable, facts, sources` — neutral and character voices both verified |
| `POST /api/memories` | 400 on bad key | 200 `{memories, namespace}` (empty right after first write: indexing lag, expected) |
| `POST /api/remember` | 400 on empty fact; dedupes | 200 `{blobId}` |
| `POST /api/push/subscribe` | 400 on malformed subscription | 200 (verified earlier with a real registry write) |
| `GET /api/cron/nudge` | 401 without `CRON_SECRET` | report JSON (verified earlier end-to-end) |
| `GET /api/health`, `/about`, `/areas`, `/characters`, `/push/config` | — | 200 |

## Errors are visible
- Server: every API error returns JSON `{error, detail}` with a human sentence (rate-limited / timed out / generic), never an HTML stack.
- Chat UI: failed sends render as a red bubble **and** the top banner; memory-panel failures show in the panel header, the session subtitle and the banner; `window.onerror`/`unhandledrejection` surface in the banner; network loss says "No connection".
- Degraded memory (relayer down) still answers and says so; unsaved facts queue in the browser outbox and retry.

## Logs
- Structured JSON lines: `info` → stdout, `warn/error` → stderr (what Vercel collects; `vercel logs <url>`).
- Locally also appended to `logs/app.log` and `logs/error.log` (`npm run logs`, `npm run logs:errors`). Directory is git-ignored.
- Events: `request` (method, path, status, ms), `chat.failed`, `memories.failed`, `remember.failed`, `recall.unavailable`, `recall.empty_for_known_user`, `relayer.retry`, `learn.failed`, `extract.failed`, `tool.failed` (with args), `push.*`, `nudge.*`, `unhandled`.
- One real error caught during the audit: `tool.failed web_search Tavily 400` on a coaching message. Hardened: tool args validated (`time_range` enum, non-empty query) and the Tavily response body is now logged.

## Security (unchanged from previous audit, re-checked)
- No secrets in git history; `.env`/`.vercel`/`logs/`/`site sketch/` ignored; env vars encrypted on Vercel.
- CSP allows only self + Google Fonts; `X-Frame-Options: DENY`; nosniff; referrer none.
- Memory key only in POST bodies; throttles per user/IP/instance; memory texts not logged in production.

## Hackathon requirements → where they are met
| Requirement (DeepSurge / Airtable) | Status |
|---|---|
| Chatbot uses Walrus Memory to persist and recall across sessions, users, devices | ✓ per-user namespaces, recall before every reply, facts written after; memory key works across devices |
| Learns and adapts to the individual | ✓ tagged facts, badges per area, mentor context, character/neutral voice |
| Deployed somewhere real | ✓ Vercel (preview now; `walcoach.vercel.app` after `vercel deploy --prod`) |
| Used by ≥3 users with ≥10 memories each | ⏳ **pending real users** — `npm run stats` + "Durable facts" panel screenshots as evidence |
| Public GitHub repo with setup instructions | ⏳ repo not yet created; README complete |
| LLM/runtime stated (Beyond the Big Two) | ✓ Qwen 3.8 27B via Groq, stated on site, README, article checklist |
| Bug / friction report for Walrus Memory | ✓ `FRICTION.md` (8 items) — ⏳ file as GitHub issues |
| Article (Medium/Inkray, 500–800 words) with before/after + evidence | ⏳ after real use; eval data (0/9 vs 6/9) and screenshots ready |
| X post tagging @WalrusProtocol #WalrusMemory | ⏳ |
| Promo post outside Walrus/Sui channels | ⏳ optional prize |
| Demo video (DeepSurge "Demo Video*") | ⏳ |
| Proof on-chain | ✓ every memory links to its blob on Walruscan; account object linked on Suiscan |
| Honest claims | ✓ site copy corrected: SEAL at the relayer, Groq sees text, mainnet, no seed phrase |
