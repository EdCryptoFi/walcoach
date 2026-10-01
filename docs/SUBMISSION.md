# Submission pack, Walrus Session 8: Chatbots That Remember

Official rules (binding): https://thewalrussessions.wal.app/chatbots/index.html
Hackathon page: https://www.deepsurge.xyz/hackathons/c0141a4a-21be-4009-bc63-7c168608c849
Deadline **October 9, 2026, 14:00 UTC** · Results October 16 · Prizes paid in **WAL**

Everything below is either verified or marked ✏️ because only Ed can supply it.
Last verified on chain: **2026-10-01**.

---

## The numbers, verified today

| | |
|---|---|
| Site | https://walcoach.vercel.app (200) |
| Repo | https://github.com/EdCryptoFi/walcoach (public, MIT) |
| Agent ID (delegate public key) | `813aa47d09ee950eea12b0acf6fb2fe45c97b5b6b8db9cf1ecefc64f19a0b7fe` |
| Project Walrus Memory account | `0xf059b5c5b2429903359263c84c78190f6ac70063182d3b44eccb91e31bff7f3d` |
| Blobs on that account | **1,088**, of which **157** touched on or after Sep 18 (requirement: 10) |
| User-owned accounts created | **24**, by sponsored transaction, owner is the user's browser key |
| Of those, accounts holding memories | **8**, holding **13** blobs owned by the users themselves |
| Model | `qwen/qwen3.8-27b` via Groq, open weights |
| Article | https://medium.com/@cryptolairbr/walcoach-remebers-you-b2f3b5596868 |
| X thread | https://x.com/EdCriptoFi/status/2105602374333050996 |
| Friction points documented | 9, in `FRICTION.md` |

Commands that reproduce the counts: `python3 scripts/count-blobs.py`,
`python3 scripts/count-blobs-window.py`. Note that `npm run stats` is a **local** counter and says
nothing about production, because the API is stateless on Vercel. The on-chain numbers are the evidence.

---

## 1. DeepSurge, builder registration

| Field | Answer |
|---|---|
| Registration questions (two Yes/No) | ✏️ |
| "Select all that apply" | ✏️ |
| Special Prizes (multi-select) | **Beyond the Big Two · Best Article · Bug Bounty · Promo Prize** |
| Terms and Conditions | ✏️ accept |

## 2. DeepSurge, create project

| Field | Answer |
|---|---|
| Project Name | **WalCoach** |
| Cover image | `docs/screenshot-landing.png` |
| Track | `[Bugbounty 5x$100], [Best article 3x$100], [Beyond the Big Two 2x$150], [Promo Prize 5x$100]` |
| Deployment network / account | `0xf059b5c5b2429903359263c84c78190f6ac70063182d3b44eccb91e31bff7f3d`, Sui mainnet |
| Agent ID + blob count | `813aa47d…b7fe`, 1,088 blobs, 157 in the session window |
| Dedicated wallet for Sessions | ✏️ **create one, see step 5 below** |
| Public projects page | yes |
| Team | ✏️ Ed CryptoFi (https://x.com/EdCriptoFi) |
| Project Repo | https://github.com/EdCryptoFi/walcoach |
| Website | https://walcoach.vercel.app |
| Demo Video | ✏️ the YouTube URL of the video you just recorded |
| Extra links | the X thread above, the article, and the MemWal issues once filed |
| Media | `docs/screenshot-landing.png`, `docs/screenshot-chat.png`, plus a mobile screenshot |

### Description, ready to paste

> WalCoach is a coaching companion for anyone with a goal they keep dropping: a habit, a training
> plan, an exam, a pet routine. You pick one of seven mentors, Work, Fitness, Study, Pets, Cooking,
> Zen or Music, and they all share one memory of you, so the fitness coach knows about your sleep and
> the work coach knows about your stress. There is no sign-up, no password and no wallet. It answers
> in English, Portuguese or Spanish, whichever you write in.
>
> Memory is the product, not a feature. Before every reply it runs two recalls against the user's own
> Walrus Memory account, one driven by the message and one fixed "core profile" query for goals,
> schedule and constraints, so even "hi, I'm back" surfaces what matters. The recalled facts go into
> the prompt, and the reply shows exactly which memories it used. After the reply, a model extracts
> durable facts, tags each with a life area, and writes one SEAL-encrypted blob per fact to Walrus
> mainnet. Every fact in the UI links to its blob on Walruscan. Memory also drives three things
> outside the chat: a handover line when you switch mentors, a "Your week" summary built only from
> stored facts, and a daily push nudge. There is no database anywhere, not even for the push
> subscriptions.
>
> The memories belong to the user, literally. On first visit the browser generates an Ed25519 key,
> and that key creates a Walrus Memory account **it owns**, through a sponsored transaction the
> project pays for, so the user holds no SUI and never sees a wallet. WalCoach is added as one
> revocable delegate key on that account, derived per account so the relayer cannot confuse one user
> with another. 24 accounts exist on mainnet, owned by their users, and the blob objects are owned by
> those users' addresses. The model is Qwen 3.8 27B on Groq, open weights, doing four jobs: reply,
> extract facts, weekly summary, daily nudge. Without memory the bot answered 0 of 9 recall probes;
> with Walrus Memory, 6 of 9. Write-up, including the relayer bug that can leak data across accounts
> and how we fixed it: https://medium.com/@cryptolairbr/walcoach-remebers-you-b2f3b5596868

## 3. Airtable, official submission form

Field by field, ready to paste: **[FORM-ANSWERS.md](FORM-ANSWERS.md)**.

## 4. Walrus Memory feedback form

One bug and one improvement idea are required. Both are written out in
[FORM-ANSWERS.md](FORM-ANSWERS.md). Submit the **`accountId` routing bug** as the bug: it is the only
finding that can leak data across users, and it is reproducible in three lines.

## 5. What only Ed can do, in the order that matters

1. **Dedicated Sui wallet for Sessions.** Required by the rules, and prizes are paid in WAL. Create a
   fresh one at https://slush.app, confirm it can receive WAL, use it for nothing else. Do **not**
   reuse the sponsor wallet (`0x27d1cb12…56e4`), which holds gas money and whose key is in `.env`.
2. **Join the Walrus Discord**, https://discord.gg/walrusprotocol. Required, and it is a checkbox.
3. **Upload the demo video** to YouTube, unlisted is fine, and paste the URL into DeepSurge.
4. **Register on DeepSurge** and create the project with section 2 above.
5. **Send the Airtable form** with `FORM-ANSWERS.md`.
6. **Walrus Memory feedback form**, one bug plus one improvement, section 4.
7. **Open the 9 GitHub issues** at https://github.com/MystenLabs/MemWal/issues from `FRICTION.md`,
   starting with #9, the `accountId` routing one. Judged separately, 5 x $100.
8. **Promo post outside Walrus and Sui.** The existing Reddit post is on your profile, which is not a
   community. Cross-post it to a real subreddit (r/SideProject, r/selfhosted, r/LocalLLaMA) or a dev
   forum. X does not count for this prize.
9. **Repost the article on Medium.** The published text predates per-user accounts and the relayer
   bug, which is now the most interesting part of it. The title also reads "remebers".

## 6. Things to confirm before sending

- [ ] **Who the 8 accounts with memories belong to.** On chain they are real, 13 blobs owned by users.
      Only you know how many are other people rather than your own devices. Criterion 2 of the judging
      is "was it used by real people", so if some are strangers, say so and how you reached them.
- [x] Deployed and live, cron active
- [x] Repo public, MIT, README has setup
- [x] All memory on Walrus **mainnet**
- [x] Model stated everywhere (Beyond the Big Two)
- [x] Integration friction documented, 9 items
- [x] Article published, X thread up
- [ ] Video uploaded, DeepSurge project created, Airtable form sent
- [ ] Promo post in a real community
- [ ] Feedback form and GitHub issues
