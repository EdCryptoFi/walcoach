# Discord post (Walrus Discord, showcase or Session 8 channel)

Short on purpose. Discord rewards a link plus one reason to click, not a thread.

---

## Short version

> **WalCoach**, my Session 8 submission: a coaching companion with 7 mentors that share one memory of you.
>
> No sign-up and no wallet, but every user still **owns** the Walrus Memory account their facts live in. Their browser signs a sponsored transaction, I pay the 0.005 SUI of gas, and they can revoke my delegate key. 24 accounts on mainnet so far, blobs owned by the users' own addresses.
>
> Without memory it answered 0 of 9 recall probes. With Walrus Memory, 6 of 9.
>
> Try it, no signup: https://walcoach.vercel.app
> Code (MIT): https://github.com/EdCryptoFi/walcoach
> Write-up: https://medium.com/@cryptolairbr/walcoach-remebers-you-b2f3b5596868
> Demo + thread: https://x.com/EdCriptoFi/status/2105602374333050996

## If there is a dev or feedback channel, add this as a second message

> One thing worth flagging for anyone building multi-user on Walrus Memory: `MemWal.create({ key, accountId })` signs the account id into every request, but the relayer resolves the account from the **delegate key** and ignores the id. An account id that does not exist returns data happily.
>
> I found it the hard way, by giving every user their own account and then watching them all read the same pool. Fix is one delegate key per account, derived so nothing has to be stored. Measurements and the patch are in the repo under `docs/RELAYER-ACCOUNT-SCOPING.md`.

## Notes

- Joining the Discord is a **requirement** of the rules, so this doubles as the proof you are in.
- Post the first block only, in the showcase or session channel. The second block belongs where
  developers talk, and it is also the bug to submit on the Walrus Memory feedback form.
- Do not paste all four links in a dev channel. There, the site and the repo are enough.
