# The relayer scopes by delegate key, not by account id

Found on 2026-09-23, hours after shipping per-user accounts. It caused a real cross-user leak in
production, so this is the incident note as well as the API report.

## What we assumed

`MemWal.create({ key, accountId })` takes an account id, signs it into every request and sends it as
`x-account-id`. We read that as "this client talks to this account", so one server delegate key
authorised on many accounts could serve many users, one client per account.

## What actually happens

The account is resolved from the **delegate key**, by on-chain lookup of `MemWalAccount.delegate_keys`.
The `accountId` we pass is carried and signed but does not select anything. The SDK's own header says
so, in `memwal.d.ts`:

> The server derives the owner address from the public key via onchain lookup in
> `MemWalAccount.delegate_keys`.

Measured, with one delegate key registered on four different accounts, recalling the same namespace:

```
project  0xf059b5c5 -> 3 hits   (the same 3)
proto    0x93a30077 -> 3 hits
browser  0xd91cdff1 -> 3 hits
migrate  0x28ae2dc9 -> 3 hits
bogus    0xabababab -> 3 hits   <- an account id that does not exist
```

A **nonexistent** account id returns the same data. That is the tell: the field is not used for
routing or for authorisation.

## The impact on us

Every user who owned an account was reading and writing one shared pool, under one namespace, while
the UI told them the memories were in their own account. Legacy users were never affected, because
they are separated by namespace. No third party was exposed: per-user accounts had been live for a
few hours and the only accounts in existence were our own test ones. Fixed in two steps, a namespace
per user immediately, then the real fix below.

## The fix

**One delegate key per account, derived, never stored.**

```ts
const seed = createHmac("sha256", DELEGATE_KEY_SEED).update(`memwal-delegate:${accountId}`).digest();
const delegate = Ed25519Keypair.fromSecretKey(seed);
```

That key is what `add_delegate_key` registers on the user's account, and what `MemWal.create` uses
for that user. Because it exists on exactly one account, the relayer's lookup resolves it
unambiguously. No key storage, so still no database.

Verified through the API on mainnet:

```
A: 0x9602dff0…20fe   delegated=true   A sees: ["Alice is training for a 10k in November…"]
B: 0x81d9a680…a119   delegated=true   B sees: 0 memories        PASS
```

And the blob is genuinely the user's, not ours. The address that owns account A holds:

```
objects owned by the account owner: {'Blob': 1}
```

## Two good side effects

1. **Rate limits are per delegate key**, which used to mean every user shared one bucket. With a key
   per account, each user has their own. The friction point that hurt us most is gone.
2. The 20 delegate keys per account limit now has nothing to do with how many users we can serve.

## What we would ask the Walrus team for

1. **Make `accountId` authoritative, or reject it.** Silently accepting an account id that does not
   route anywhere, including one that does not exist, is what turned our wrong assumption into a
   leak. A 400 on a mismatch between the account id and the account the key resolves to would have
   caught this on the first request.
2. **Say it in the SDK types.** The constructor takes `{ key, accountId }` as equals. Something like
   `accountId` being documented as "informational, the delegate key selects the account" would have
   been enough.
3. **A way to list the accounts a delegate key is registered on**, so a server can detect that its
   key is authorised on more than one account and refuse to guess.
