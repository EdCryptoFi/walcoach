# Walrus Memory friction log

Observed while building this bot against `https://relayer.memory.walrus.xyz`
(SDK `@mysten-incubation/memwal@0.1.7`, Node 22, macOS). Each item is a
candidate GitHub issue at https://github.com/MystenLabs/MemWal/issues.

## 1. `POST /api/analyze` returns transient 500 *and* 503 for the same failure

- Repro: `scripts/repro-500.ts` — same input fails on attempt 1 with
  `500 {"error":"Internal server error (traceId: …)"}` or
  `503 {"error":"Upstream temporarily unavailable (traceId: …)"}`, then succeeds on retry.
- Expected: a consistent retryable status (503 + `Retry-After`), and/or the SDK
  retrying transient upstream failures itself. Today the SDK surfaces both as a
  generic `Walrus Memory server error (5xx)` with no `retryable` hint.
- Impact: ~30% of `analyzeAndWait` calls failed during a 15-message run.
- Trace IDs: a5ba4ea5-3ae6-49bc-92bb-531f9d78bea2, c45452f3-0d1b-49d5-9e6a-8870c5961…

## 2. `remember` job fails with `seal encrypt failed … RpcError: Too Many Requests`

- Repro: ~15 sequential `rememberAndWait` calls from one delegate key over ~2 minutes.
- Error: `remember job failed: Internal Error: seal encrypt failed: seal/encrypt failed during read_account_identity: RpcError: Too Many Requests (traceId=…, timeoutMs=25000)`
- Expected: the relayer should cache the account identity read (it does not change
  between calls) or back off on its own Sui RPC rate limit, instead of failing the
  user's job. Also the job reports `failed` rather than `pending`, so the SDK's
  `waitForRememberJob` gives up although the write was never attempted.
- Trace IDs: ffa3ee7e-865d-4f61-9ad7-66d4ea24dc4c, 7194b66c-87be-432d-ac43-93df54ba4204

## 3. `analyze` leaks prompt template into extracted facts

- Input (Carol, EN): "Goal: zero added sugar for 30 days, started this Monday."
- Extracted fact stored on Walrus: `standard>User started the zero added sugar goal on Monday.`
- Expected: clean fact text. Looks like a closing tag fragment from the extractor prompt.

## 4. `analyze` alternates output language for the same user

- PT input produced EN facts ("User only trains Tuesday and Thursday…") in one call and
  PT facts ("User tem dois filhos pequenos") in the next. Mixed-language memories get
  noticeably worse recall distances (0.55–0.70) for a user who always writes in PT.
- Suggestion: an `outputLanguage` option on `analyze`, or "same language as input" by default.

## 5. No relevance threshold + cross-language distances

- With no `maxDistance`, short namespaces return filler. With the documented `0.7` cutoff,
  clearly related PT question / EN fact pairs (distance 0.55–0.70) were often dropped.
  Documenting typical cross-lingual distances, or exposing the embedding model name in
  `health()`, would help people tune this.

## 6. Retrying `rememberAndWait` after a timeout returned the *same* `job_id`

- Three consecutive `rememberAndWait(sameText, sameNamespace)` calls reported
  `job_id=441d8509-…` each time. Docs say `remember()` is always append-never-upsert,
  so either there is undocumented idempotency, or the SDK re-polled the old job.
  Worth clarifying.
