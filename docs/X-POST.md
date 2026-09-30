# X thread (reply under the @WalrusProtocol Session 8 announcement)

Requirements from the rules: post on X, tag **@WalrusProtocol**, use **#WalrusMemory**, and post it
**under the session announcement**. The article link goes in the thread. The video is post 1.

Every post below is under 280 characters counting links as X counts them (23 each). No post needs
editing to fit.

**Before posting:** replace `<ARTICLE LINK>` in 9/ with the Medium URL, and check the published title,
the current one reads "remebers". Fix it on Medium first if the URL changes.

---

## 1/ The video

> Most chatbots forget you the second you close the tab.
>
> WalCoach is a coaching companion with 7 mentors that share one memory of you. That memory is not in my database: it lives on @WalrusProtocol, in an account you own.
>
> 2 minutes, real session:
>
> #WalrusMemory

Attach the video. No link in this post: the video is what should be watched, and the call to action
is at the end of the thread.

## 2/ What it stores and how it uses it

> What it remembers: your goals, your weekly routine, your constraints, how you like things explained, and the advice it already gave you.
>
> Before every reply it runs two recalls, one on your message and one fixed profile query, so even "hi, I'm back" surfaces what matters.

## 3/ Proof that the memory does work

> Does it actually remember? I measured it.
>
> An eval harness: 3 personas share facts in session one, then session two wipes the context and asks questions only a remembering bot can answer.
>
> Without memory: 0/9 probes.
> With Walrus Memory: 6/9.

Image: the eval table, or the "Memories used in this reply" chips.

## 4/ Verifiable, and the before/after in one click

> And you never have to take my word for it.
>
> Every fact in the panel links to its blob on Walruscan. Click a memory, see the encrypted blob on mainnet.
>
> The Memory switch in the header turns recall and learning off, which is the before and after in one click.

Image: the memory panel with a blob open on Walruscan.

## 5/ User-owned memory

> The @WalrusProtocol team reviewed an early version and caught that every memory sat under one account: mine.
>
> Now each user owns their own Walrus Memory account. Their browser signs a sponsored transaction, I pay the 0.005 SUI of gas, and they can revoke my access.

Image: the Suiscan page of a user's account, with `owner` and the single delegate key visible.

## 6/ The bug that cost the most

> That detour is worth sharing.
>
> MemWal.create takes an accountId and signs it into every request, but the relayer ignores it: it resolves the account from the delegate key. An accountId that does not exist returns data.
>
> Fix: one delegate key per account, derived.

## 7/ The model and the stack

> Model is Qwen 3.8 27B on Groq. Open weights, nothing from the big two. It does four jobs: reply, extract facts, write the weekly summary, compose the daily nudge.
>
> Hono on Vercel, and no database anywhere, not even for the push subscriptions. Those live on Walrus too.

## 8/ Friction, stated plainly

> What broke, honestly:
>
> writes take 5 to 30s to become recallable, so the browser bridges them
> recall sometimes returns empty with HTTP 200, so I retry
> rate limits are per delegate key, which a key per account finally fixed
>
> 9 friction points documented in the repo.

## 9/ Where to try it

> Try it, no sign-up and no wallet: walcoach.vercel.app
>
> Code (MIT): github.com/EdCryptoFi/walcoach
> Full write-up: <ARTICLE LINK>
>
> Built for @WalrusProtocol Session 8: Chatbots That Remember.
> #WalrusMemory

---

## What each post is there for

| Post | What the hackathon asks, and where it is answered |
|---|---|
| 1 | What the chatbot does and who it is for; the demo video the submission requires |
| 2 | What it stores in memory and how it uses it (a form field, almost word for word) |
| 3 | Judging criterion 1, does it actually remember, with a number instead of a claim |
| 4 | Memory on Walrus **mainnet**, verifiable, plus the before/after the rules ask for |
| 5 | Memory that belongs to the user, and the answer to the team's own review |
| 6 | Integration friction, required for Beyond the Big Two, and the strongest one we found |
| 7 | Which LLM, which is what qualifies the project for Beyond the Big Two |
| 8 | The rest of the friction, pointing at FRICTION.md for the bug bounty |
| 9 | Where judges access it, the repo, and the article link |

## If you want it shorter

Six posts still cover everything the rules ask: 1, 2, 3, 5, 7, 9. Post 4 folds into 3 and post 6 into
8 if you need to. Keep 5 whatever you cut: it is the only post that says something no other submission
can say.

## Notes

- Post as a **reply** to the Session 8 announcement tweet so it counts for the session.
- The promo prize needs a **separate** post in a community outside Walrus and Sui (a subreddit, a dev
  forum, Hacker News). X, r/sui and Walrus or Sui channels do not count for that one.
- Do not post all nine at once into an empty timeline. Post 1, wait for it to be live, then reply to
  your own post in order, so the thread threads.
