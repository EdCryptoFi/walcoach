# Official rules vs. where we stand

Source: **https://thewalrussessions.wal.app/chatbots/index.html** (Walrus Foundation, Event Rules).
This page, not the DeepSurge description, is the binding document. Checked 2026-09-23.

## Dates
- Submission closes **October 9, 2026 at 14:00 UTC** (not end of day). Results October 16.
- Two weeks and change left from today.

## Differences from what we had written down
| Item | DeepSurge description said | Official rules say |
|---|---|---|
| Prize currency | "stablecoin" | **WAL**, into a wallet that can receive WAL |
| Proof of memory use | "3 users with 10+ memories each" | **agent has written ≥10 blobs on mainnet**, and you submit **agent ID (delegate public key) + account id + blob count + explorer link** |
| Wallet | not mentioned | **a dedicated wallet address created for Sessions** is required |
| Feedback | "a bug or friction point and/or improvement idea" | the **Walrus Memory feedback form** with **at least one bug AND one improvement idea** |
| Discord | listed as a resource | **joining the Walrus Discord is required** |
| Promo prize | "outside Walrus and Sui ecosystem" | same, and **X posts are explicitly not eligible** (nor r/sui, r/walrus, any Walrus/Sui channel) |
| Network | "Walrus Memory integrated" | **must be on mainnet**, all memory stored on Walrus mainnet |

The "3 users x 10 memories" line is only on the DeepSurge page, so it is not strictly binding, but
judging criterion 2 is "was the chatbot deployed and used by real people", so real users still decide
the Best Chatbot placement. Satisfy the stricter version.

## Where WalCoach stands

### Done
- Working chatbot integrating Walrus Memory to store and recall between conversations ✓
- Deployed and reachable by real users through a channel: https://walcoach.vercel.app ✓
- All memory on Walrus **mainnet** (relayer `relayer.memory.walrus.xyz`) ✓
- **One Walrus Memory account per user**, created by a sponsored transaction and owned by the
  user's browser key, with a delegate key derived per account so the relayer really does isolate
  them ✓ (answers the Walrus team's review; verified example `0x9602dff0…20fe`, owner
  `0xdac643e9…0ca5`, whose address holds the Blob object; see `docs/WALRUS-REPLY.md` and
  `docs/RELAYER-ACCOUNT-SCOPING.md`)
- Legacy `web-` users can move into an account of their own from the key panel ✓ (`/api/migrate`,
  tested end to end in production)
- Public GitHub repo with setup instructions: https://github.com/EdCryptoFi/walcoach ✓ (MIT)
- LLM stated everywhere: Qwen 3.8 27B via Groq (qualifies for Beyond the Big Two) ✓
- Integration friction documented (`FRICTION.md`, 8 items) ✓, required for Beyond the Big Two
- Article drafted (`docs/ARTICLE.md`), X post drafted (`docs/X-POST.md`) ✓
- The form asks for two different ids, do not mix them up:
  - **MEMWAL_AGENT_ID** = the delegate key's **public key**: `813aa47d09ee950eea12b0acf6fb2fe45c97b5b6b8db9cf1ecefc64f19a0b7fe`
  - **Account ID** = the MemWalAccount object on Sui: `0xf059b5c5b2429903359263c84c78190f6ac70063182d3b44eccb91e31bff7f3d`
    (verified on-chain as `0xe7c16fbe…::account::MemWalAccount`)
- Blob count: **1,068 blobs on Sui mainnet** for this account, **137 written during the session window** (needs 10). Counted on-chain with `scripts/count-blobs.py`; `restore()` is not a reliable counter because its `total` is capped by the sidecar.

### Missing, in order of risk
1. **Dedicated wallet for Sessions.** New requirement, blocks the prize payment. Create a fresh Sui
   wallet, confirm it accepts WAL, use it only for this.
2. **Real users.** Criterion 2 of the judging. Nothing else substitutes for it.
3. **Register on DeepSurge** (project name, chatbot description, primary contact, GitHub) and create
   the project entry, then the Airtable submission form.
4. **Walrus Memory feedback form**: one bug + one improvement idea (separate from GitHub issues).
   The bug to submit is now the `accountId` routing one, which is the strongest we found.
5. **GitHub issues** at MystenLabs/MemWal from `FRICTION.md` (bug bounty, 5 x $100, judged separately).
6. **Join the Walrus Discord.**
7. ✓ **Article published**: https://medium.com/@cryptolairbr/walcoach-remebers-you-b2f3b5596868
   Still to do: share it on X tagging @WalrusProtocol with #WalrusMemory, under the session announcement.
8. **Promo post in a third-party community.** A Reddit **profile** post exists
   (https://www.reddit.com/user/CryptoLairBR/comments/1wofdud/walcoach_remembers_you/) but a profile
   is not a community and the prize is judged on reach, so cross-post it into an actual subreddit
   (r/SideProject, r/selfhosted, r/LocalLLaMA, r/artificial), a dev forum or a newsletter.
9. **Demo video** (DeepSurge project form marks it required).

## Judging criteria, and our honest read
1. **Does it actually remember?** Strong: recall before every reply, memories shown per answer,
   mentor handover, weekly summary, every fact linking to its blob on Walruscan
   Since 2026-09-23 each user owns the account their memories live in, which is the strongest
   version of the "user-owned memory" claim we can make without client-side SEAL.
2. **Real-world use.** Weakest point. Simulated eval only, so far.
3. **Build quality.** Strong: clean repo, README, eval harness, audit doc, MIT.
4. **Best article.** Draft is honest and specific, needs the real screenshots to land.
