# Level 2: one Walrus Memory account per user, no wallet

Answer to the Walrus team's feedback that every memory today sits under one account
(`0xf059b5c5…`, which is also shared with five other projects and already uses 13 of its 20
delegate key slots).

Goal: **the user owns the account their memories live in, and never sees a wallet.**

## Facts established on chain (mainnet)

| | |
|---|---|
| Package | `0xe7c16fbea0560e7057e2bf7422feaa4fb313749fc69c9e9092fac7a33b81d7f5` |
| AccountRegistry (shared object) | `0x8bf82c9e09e36b8d1c38298f68b7cb68e7b8762887e7592add9986d5e9cf199f` |
| Gas, `create_account` | **0.004031 SUI** (measured on a real tx) |
| Gas, `add_delegate_key` | **0.000743 SUI** |
| Contract rule | one account per Sui address, enforced on chain |
| Delegate keys | max 20 per account (so: per-user accounts, not per-user keys) |

**Cost per user: about 0.005 SUI**, roughly 0.02 USD. One SUI covers ~200 users.

## How it works, with nothing for the user to install

1. **Browser generates an Ed25519 keypair.** The private key *is* the memory key the user already
   saves today, so the UX does not change: one string to keep, shown once, copyable.
2. **Server prepares a sponsored transaction**: sender is the user's address, gas owner is the
   project treasury. The user's browser signs the bytes, the server adds the sponsor signature and
   executes. The user never holds SUI and never approves anything in a wallet UI.
3. `create_account` runs, **the account is owned by the user's address**.
4. A second sponsored transaction runs `add_delegate_key` with WalCoach's public key, so the coach
   can read and write in that account. One server key authorised on N accounts, revocable by the
   user with `remove_delegate_key`.
5. From then on the server talks to the relayer with `MemWal.create({ key: serverDelegateKey,
   accountId: <the user's account> })`. The server stores only the account id, which is public.

What changes for the better: the memory key stops travelling to the server as an identifier. The
server receives the account id instead, and the private key stays in the browser.

What is still true, and we say it plainly: the coach holds a delegate key on each account, so it can
read that user's memories in order to answer. The difference from today is that the account belongs
to the user, the access is explicit, and it can be revoked. Fully non-custodial would mean the
browser talking to the relayer directly, which needs client-side SEAL and CORS, and is the next step,
not this one.

## What goes in the browser

No wallet library and no build step. Two small vendored modules, self-hosted so the CSP stays
`script-src 'self'`:

- `@noble/ed25519` (~10 KB) to generate the keypair and sign
- `@noble/hashes/blake2b` (~8 KB) for the Sui address and the intent message digest

A Sui signature is `flag(0x00) || signature(64) || publicKey(32)`, base64, over
`blake2b(intent || txBytes)`. That is all the browser needs to do.

## Server side

- `POST /api/account/prepare` → builds the PTB, returns `txBytes` for the browser to sign
- `POST /api/account/execute` → adds the sponsor signature, executes, returns the account id
- Same pair for `add_delegate_key`
- New env vars: `SUI_SPONSOR_KEY` (treasury private key), `MEMWAL_REGISTRY_ID`, `MEMWAL_PACKAGE_ID`
- `MemWal` client becomes per request: same delegate key, the caller's account id

## Prototype result: both unknowns cleared

`scripts/proto-account.ts`, run against mainnet on 2026-09-23:

```
create_account:    ok  BDN8t1KxW5YFpvYPXBNSXFRoorZXwpszNjxW9sGayzrU
accountId:             0x93a30077df54250d3f13a75c256b4e7c679b92e684437c263e950669014617d2
add_delegate_key:  ok  CLHwKN9ZCwD9vExnK8PriNdMx24wdasGLXqMpYguMQRZ
relayer health:    ok
wrote blob:            c6TJQVrGwxvh229mAbgGRlex9jl7qg3ktepN9E5N3TY
recall:                0.395  "Prototype user owns this account and trains on Tuesdays."
```

On chain, that account reads:

| | |
|---|---|
| owner | `0x694769051ee7c35a7136a9d35b956740ef8fb6328042a210ba837308dbbd6f40` (the user's key, not the sponsor) |
| delegate keys | one, labelled `WalCoach` |
| explorer | https://suiscan.xyz/mainnet/object/0x93a30077df54250d3f13a75c256b4e7c679b92e684437c263e950669014617d2 |

So: a sponsored transaction creates an account **owned by the user**, the user never holds SUI and
never sees a wallet, the existing WalCoach delegate key works on a brand new account, and the relayer
accepts an account created outside the dashboard. Measured cost for the pair of transactions,
including the failed attempts while getting the SDK call right: 0.0168 SUI for four runs, about
**0.005 SUI per user** in steady state.

## Rollout plan

| Step | What | Needs |
|---|---|---|
| 1 | ✓ Prototype with one test user, end to end | treasury key + ~0.05 SUI |
| 2 | ✓ **Done, live.** New users get their own account; existing users keep working | code |
| 3 | Optional migration for existing users: new account, re-write their facts into it | gas per user |
| 4 | ✓ Article section and reply drafted, see `docs/WALRUS-REPLY.md` | writing |

If step 1 fails on either unknown, the fallback is the dedicated app account plus "bring your own
account", and this document becomes the honest account of what was tried.

## What Ed needs to provide

A **sponsor wallet**, separate from the prize wallet, with about 1 SUI in it, and its private key
(bech32, `suiprivkey1…`) in `.env` as `SUI_SPONSOR_KEY`. That key signs only gas payments for
account creation. It never touches memories.

## Shipped, 2026-09-23

Live on https://walcoach.vercel.app. First account created by a real browser, not a script:

| | |
|---|---|
| account | `0xd91cdff1d79e258a92df9ae9a7b57a20e5c6fac683f033d6db48a85746cb8734` |
| owner | `0x713a002522062fba672ab978386a9a5a19150d28ede30bcd503245f837b848a4` |
| delegate keys | 1, labelled `WalCoach`, public key `813aa47d…b7fe` |
| blobs | 2 facts written and recalled, explorer links live in the panel |

Sponsor wallet after the prototypes and the first real account: **1.3704 SUI** of 1.4, so about
0.0296 SUI spent and roughly 280 users of headroom. Below 0.05 SUI the app pauses creation and falls
back to the shared account instead of failing.

Still open: migration for the users created before this change, who remain on the shared account.

## Correction, same day

The first shipped version did not isolate anything. `MemWal.create({ key, accountId })` signs the
account id into every request, but the relayer resolves the account from the **delegate key** and
ignores the id, so every account owner shared one pool. Fixed with a delegate key derived per
account, `HMAC-SHA256(DELEGATE_KEY_SEED, accountId)`, registered on that account alone. Accounts made
before the fix repair themselves on next load. The measurements, the impact and what we are asking
the Walrus team for are in `docs/RELAYER-ACCOUNT-SCOPING.md`.

Verified after the fix, in production: account `0x9602dff0…20fe` reads only its own fact, a second
account reads nothing, and the owner address holds the `Blob` object. Cost is unchanged, the delegate
transaction was already part of the flow.
