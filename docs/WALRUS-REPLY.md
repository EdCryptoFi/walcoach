# Reply to the Walrus team

Context: the team reviewed WalCoach and noted that every memory sat under one account
(`0xf059b5c5…7f3d`), so we would hit the 20 delegate key ceiling. They were right. This is the
answer, and the change is live.

Verified on chain before writing this, on 2026-09-23. Sponsor wallet is at 1.3704 SUI, so the
numbers below are measured, not estimated.

---

## Short version, for a Discord or Telegram reply

> You were right, and thanks for catching it. Every memory did sit under one account, and the 20
> delegate key ceiling would have stopped us at 20 users.
>
> It is fixed and deployed: **each user now owns their own Walrus Memory account**, and still never
> sees a wallet. The browser generates an Ed25519 keypair, the server builds a **sponsored
> transaction** (sender is the user's address, gas owner is our treasury), the browser signs it, and
> `create_account` runs with the user as owner. A second sponsored tx adds WalCoach as a delegate,
> so the coach can read and write in that account, and the user can revoke it with
> `remove_delegate_key`. One delegate key of ours, authorised on N accounts, instead of N keys on one
> account. Cost is about 0.005 SUI per user, paid by us.
>
> A real account created from the browser on mainnet:
> https://suiscan.xyz/mainnet/object/0xd91cdff1d79e258a92df9ae9a7b57a20e5c6fac683f033d6db48a85746cb8734
> `owner` is the user's own key (`0x713a0025…48a4`), `delegate_keys` has exactly one entry, labelled
> WalCoach. The private key never leaves the browser, the server only ever stores the account id.
>
> Existing users keep working on the old shared account, so nothing broke for them.
>
> One thing you should know, because it bit us hard. `MemWal.create({ key, accountId })` signs the
> account id into every request, but the relayer resolves the account from the **delegate key**, by
> on-chain lookup, and ignores the id. We assumed one server key could address many accounts, so for
> a few hours every account owner was reading one shared pool while our UI told them otherwise. An
> account id **that does not exist** returns data happily, which is what makes the mistake so easy to
> make. Our fix is one delegate key per account, derived with `HMAC-SHA256(seed, accountId)` so
> nothing has to be stored. Would you consider returning 400 when the signed account id is not the
> account the key resolves to? That single check would have caught it on the first request. Full
> measurements in `docs/RELAYER-ACCOUNT-SCOPING.md`.
>
> Two smaller ones: the account id is not discoverable from an owner address, because
> `MemWalAccount` is a shared object, so we had to embed it in the key string the user saves; and
> there is no documented example of creating an account from outside the dashboard, so the PTB shape
> had to be reverse engineered from the package.
>
> The good news in the same breath: with a key per account, your per-delegate-key rate limit is now
> per user for us, which was our single worst friction point.

---

## Long version, if they ask for detail

### What was wrong

One `MemWalAccount`, one delegate key, every user separated only by a namespace string. That made
three problems, not one:

1. **The ceiling.** 20 delegate keys per account. Our plan of a key per user stopped at 20 users.
2. **The custody story.** "Your memories are yours" was not true in the sense that matters on chain.
   The account was ours.
3. **The quota.** Rate limits are per delegate key, so every user shared one bucket. Under load it
   surfaced as `seal encrypt failed: RpcError: Too Many Requests`, which reads like a crypto bug.

### What we changed

| | Before | After |
|---|---|---|
| Account | one, ours, shared with other projects | **one per user, owned by the user** |
| Isolation | namespace string at the relayer | separate Sui object, plus namespace |
| Our access | one key that reads every user | a **derived key per account**, revocable |
| What the server stores | the memory key, as an identifier | the account id, which is public |
| 20 key limit | binding at 20 users | irrelevant, one slot used per account |
| Wallet for the user | none | still none |

### The part we got wrong first, in case it helps someone else

Our first version passed a per-user `accountId` to `MemWal.create` and kept one delegate key. That
does not isolate anything: the relayer routes by delegate key. Four different account ids, including
`0xabab…abab`, which does not exist, returned an identical result set. The fix is a delegate key per
account, derived from a server seed rather than stored:

```ts
const seed = createHmac("sha256", DELEGATE_KEY_SEED).update(`memwal-delegate:${accountId}`).digest();
```

Registered on exactly one account, the relayer's lookup is unambiguous. Verified: user A reads only
A's fact, user B reads nothing, and the address owning A's account holds the `Blob` object itself.

### How the user avoids a wallet

The browser generates an Ed25519 keypair with `@noble/ed25519`, about 18 KB vendored so our CSP stays
`script-src 'self'`. A Sui signature is `flag(0x00) || sig(64) || pubkey(32)` over
`blake2b256(intent || txBytes)`, which is the whole of what the browser has to implement. No wallet
library, no extension, no build step, no popup.

The server builds the PTB with `setSender(userAddress)` and `setGasOwner(treasury)`, returns the
bytes, the browser signs them, the server adds the sponsor signature and executes. The user holds no
SUI and approves nothing, because there is no wallet UI to approve in.

The private key is the same string the user already saved as their "memory key", now encoded as
`wal_<base64url>` carrying both the secret and the account id. We had to embed the account id because
`MemWalAccount` is a shared object, so there is no way to go from an owner address back to their
account. That is our one real API request.

### Evidence on mainnet

Prototype, `scripts/proto-account.ts`:

```
create_account     BDN8t1KxW5YFpvYPXBNSXFRoorZXwpszNjxW9sGayzrU   0.004031 SUI
accountId          0x93a30077df54250d3f13a75c256b4e7c679b92e684437c263e950669014617d2
add_delegate_key   CLHwKN9ZCwD9vExnK8PriNdMx24wdasGLXqMpYguMQRZ   0.000743 SUI
wrote blob         c6TJQVrGwxvh229mAbgGRlex9jl7qg3ktepN9E5N3TY
recall             0.395  "Prototype user owns this account and trains on Tuesdays."
```

Then the real thing, created by a browser on the deployed site, with no local script involved:

```
account   0x9602dff07a0953e6ffce2f435b74643f6deff6fcd65c981dcbabb772ae5320fe
owner     0xdac643e972b50b49e207d7ce9c7ba47ad2aa741f7df58c9c2b9e8cc1559b0ca5
delegates 1, derived for this account only, label "WalCoach"
reads     A sees A's fact; a second account B, same server, sees nothing
on chain  the owner address holds the Blob object: {'Blob': 1}
```

And the legacy path, end to end in production: a `web-` user's fact moved into an account they own,
`{"found":1,"accepted":1}`, readable there a minute later, blob owned by
`0x07c0228a…d0fb`. Read back from `0xe7c16fbe…::account::MemWalAccount` on mainnet.

### Cost, measured

0.004031 + 0.000743 = **0.004774 SUI per user**, about 0.02 USD. We funded the sponsor wallet with
1.4 SUI and have 1.3704 left after the prototypes and the first real account, so roughly 280 more
users at current gas. If the wallet drops below 0.05 SUI the app pauses account creation and falls
back to the old shared account rather than failing, and there are per IP and global rate limits on
the creation endpoints so nobody can drain it.

### What we did not do

Fully non-custodial. The coach still holds a delegate key on each account, because it needs to read
the user's memories in order to answer them. The honest difference is that the account belongs to the
user, the access is explicit and labelled, and it can be revoked. Removing our key entirely means the
browser talking to the relayer directly, which needs client-side SEAL and CORS on the relayer. We
would use that the day it exists.
