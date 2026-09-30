# X thread (reply under the @WalrusProtocol Session 8 announcement)

Requirements from the rules: post on X, tag **@WalrusProtocol**, use **#WalrusMemory**, and post it
**under the session announcement**. The article link goes in the thread. The video is post 1.

Five posts. Every one is under 280 characters counting links the way X counts them (23 each), so
nothing needs trimming while you paste.

**Before posting:** replace `<ARTICLE LINK>` in 5/ with the Medium URL, and check the published title,
which currently reads "remebers". Fixing it on Medium may change the URL.

---

## 1/ The video

> Most chatbots forget you the second you close the tab.
>
> WalCoach is a coaching companion with 7 mentors that share one memory of you. That memory is not in my database: it lives on @WalrusProtocol, in an account you own.
>
> 2 minutes, real session:
>
> @SuiDevelopers #WalrusMemory

Attach the video. No link in this post: the video is what should be watched, and the call to action is
at the end of the thread.

## 2/ What it remembers, and whether it works

> It remembers your goals, your routine, your constraints and the advice it already gave you. Before every reply it recalls twice: your message, plus a fixed profile query, so even "hi, I'm back" surfaces what matters.
>
> Measured: 0/9 recall probes without memory, 6/9 with it.

Image: the "Memories used in this reply" chips, or the eval table.

## 3/ On mainnet, and checkable

> You never have to take my word for it.
>
> Every fact in the panel links to its encrypted blob on Walrus mainnet. Click one and see it.
>
> And the Memory switch turns recall and learning off, so the before and after is one click, same model, same question.

Image: the memory panel with a blob open on Walruscan.

## 4/ The memory is the user's, not mine

> @WalrusProtocol reviewed an early version and caught that every memory sat under one account: mine.
>
> Now each user owns theirs. Their browser signs a sponsored transaction, I pay the 0.005 SUI, they never see a wallet, and they can revoke my access whenever.

Image: the Suiscan page of a user's account, with `owner` and the single delegate key visible.

## 5/ Stack, friction, and where to try it

> Qwen 3.8 27B on Groq, open weights. Hono on Vercel, no database anywhere. 9 integration friction points documented, including a relayer one that can leak data across accounts.
>
> No sign-up: walcoach.vercel.app
> MIT: github.com/EdCryptoFi/walcoach
> Write-up: <ARTICLE LINK>

---

## What each post is there for

| Post | What the hackathon asks, and where it is answered |
|---|---|
| 1 | What the chatbot does and who it is for; the demo video the submission requires |
| 2 | What it stores in memory and how it uses it, plus judging criterion 1, with a number instead of a claim |
| 3 | Memory on Walrus **mainnet**, verifiable, plus the before and after the rules ask for |
| 4 | Memory that belongs to the user, and the answer to the team's own review |
| 5 | Which LLM (Beyond the Big Two), the integration friction that track requires, where judges access it, the repo and the article |

The detail that did not fit, the `accountId` routing bug in full, lives in the article and in
`FRICTION.md`. Post 5 points at it in one clause, which is enough for a thread and more honest than
hiding it.

## Notes

- Post as a **reply** to the Session 8 announcement tweet so it counts for the session.
- The promo prize needs a **separate** post in a community outside Walrus and Sui (a subreddit, a dev
  forum, Hacker News). X, r/sui and Walrus or Sui channels do not count for that one.
- Post 1 first, wait for it to be live, then reply to your own post in order, so the thread threads.
