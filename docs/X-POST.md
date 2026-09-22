# X post (reply under the @WalrusProtocol Session 8 announcement)

Requirements from the hackathon: post on X, tag **@WalrusProtocol**, use **#WalrusMemory**, and post it
**under the session announcement**. Attach the article link. Images: 1) the chat with "Memories used in
this reply" chips, 2) the memory panel with the explorer link, 3) the eval table or the Your week card.

---

## Main post

Most chatbots forget you the second you close the tab.

I built WalCoach: an AI coach with 7 mentors that share one memory of you, stored as encrypted blobs on Walrus. No account, no wallet, no database of mine.

Without memory it answered 0/9 recall probes. With @WalrusProtocol memory: 6/9.

#WalrusMemory
walcoach.vercel.app

---

## Thread (optional, 4 replies)

**1/**
How it works, per message:
· recall your namespace (message query + profile query)
· generate with those facts in the prompt
· extract new facts, tag them by life area, write one SEAL-encrypted blob each to Walrus mainnet

Every memory links to its blob on Walruscan. Click and verify.

**2/**
Model is Qwen 3.8 27B on Groq. Open weights, nothing from the big two.
It does four jobs: reply, extract facts, write the weekly summary, compose the daily push nudge.

**3/**
What broke, honestly:
· writes take 5 to 30s, so I bridge them with pending facts from the browser
· recall sometimes returns empty with HTTP 200, so I retry
· rate limits are per delegate key, surfacing as "seal encrypt failed: Too Many Requests"
All 8 friction points are in the repo.

**4/**
Biggest bug was mine: the coach stored facts about you but ignored its own advice, so "what did you tell me to cook?" came back blank. Now it stores its suggestions too.

Code (MIT): github.com/EdCryptoFi/walcoach
Full write-up: <ARTICLE LINK>

---

## Notes before posting

- Replace `<ARTICLE LINK>` with the Medium/Inkray URL once published.
- Post as a **reply** to the Session 8 announcement tweet so it counts for the session.
- The promo prize needs a **separate** post in a community outside Walrus/Sui (a subreddit, a dev
  forum, Hacker News). X, r/sui and Walrus/Sui channels do not count for that one.
