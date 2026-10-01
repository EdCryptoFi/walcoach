# Audit

## 2026-09-20, first pass

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

---

## 2026-10-01, pre-submission pass

Run against the current build and against production. Two real problems, both fixed in this pass.

### Critical: the sponsor co-signed anything it was handed

`POST /api/account/execute` took `txBytes` plus a user signature, signed those bytes with the sponsor
key and submitted them. It never checked what the transaction did. Because the sponsor owns the gas
coin, a transaction whose only command is `transferObjects([tx.gas], attacker)` drains the sponsor
wallet, and the browser gets the gas owner's address from `/api/account/prepare` for free.

Confirmed with a **dry run**, nothing executed:

```
attacker transaction built, bytes: 183
dry run status: {"success":true,"error":null}
```

Fixed with `assertSponsorable()` in [../src/accounts.ts](../src/accounts.ts), called before the key is
used. It parses the transaction and requires: gas owner is the sponsor, gas budget at or below the
20,000,000 MIST we set, exactly one command, a MoveCall into our package's `account` module, the
function one of `create_account` or `add_delegate_key`, no type arguments, and for `add_delegate_key`
that the public key argument is exactly the key derived for that account id, so a crafted transaction
cannot place a foreign key inside a user's account.

Verified by `npm run test:guard`, which builds each case for real and checks the verdict:

```
PASS  legit create_account                       accepted
PASS  legit add_delegate_key                     accepted
PASS  gas drain: transfer the gas coin           refused: expected a single move call
PASS  gas drain with a huge budget               refused: gas budget above the allowed maximum
PASS  someone else's delegate key                refused: delegate key is not the one derived for this account
PASS  our call plus a gas transfer               refused: expected exactly one command
PASS  a call to another package                  refused: move call is not the Walrus Memory package
PASS  gas owner is not the sponsor               refused: gas owner is not the sponsor
```

### Rate limits: four endpoints had none

| Endpoint | Was | Now |
|---|---|---|
| `POST /api/account/execute` | unlimited, and it spends gas | 6/min per IP, 80/min global |
| `POST /api/account/status` | unlimited, calls a public indexer | 20/min per IP, 200/min global |
| `POST /api/account/lookup` | unlimited, calls a public indexer | same bucket as status |
| `GET /api/health` | unlimited, and **each call hits the relayer**, whose quota every user shares | 10/min per IP, 120/min global, answer cached 20s |

Health was the quiet one: a loop on a single unauthenticated path could exhaust the relayer quota the
whole product depends on.

### Secrets

Every value in `.env` was searched for across **all 80 commits**, not just the working tree. The only
matches are values that are meant to be public: the model name, the relayer URL, the Walrus Memory
account id, the package and registry ids, and the agent **public** key. No private key, API key, seed
or cron secret appears anywhere in history.

| Secret | Length | In git history |
|---|---|---|
| `GROQ_API_KEY`, `TAVILY_API_KEY` | 56, 58 | no |
| `MEMWAL_PRIVATE_KEY` | 64 | no |
| `SUI_SPONSOR_KEY` | 70 | no |
| `DELEGATE_KEY_SEED` | 64 | no |
| `VAPID_PRIVATE_KEY`, `CRON_SECRET` | 43, 43 | no |

`.gitignore` covers `.env`; `.env.example` holds names and public ids only.

### Headers

Added `Strict-Transport-Security: max-age=63072000; includeSubDomains`. Already present:
`Content-Security-Policy` with `script-src 'self'` (plus `unsafe-inline` and vercel.live for the
preview toolbar), `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`,
`Permissions-Policy`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`.

### Also checked, no change needed

- `GET /api/cron/nudge` requires `Authorization: Bearer $CRON_SECRET` and 401s without it.
- `/api/about` exposes only public ids, by design, so anyone can verify the blobs on chain.
- Memory texts are not logged unless `LOG_MEMORIES=1`, which is off in production.
- Every write path validates its user id against `/^(web-[a-z0-9-]{8,64}|0x[0-9a-f]{64})$/i`.
- The documentation pointed at `api/index.ts` for the Vercel entry point, which does not exist; the
  real one is `src/index.ts`, named in `vercel.json`. Fixed, along with a Telegram link that pointed
  at the wrong file and a missing `DELEGATE_KEY_SEED` in the setup instructions.
