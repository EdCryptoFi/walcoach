# WalCoach: how I built a chatbot that actually remembers you, and what broke along the way

*Seven mentors, one memory of you, stored encrypted on Walrus. Built with an open-weight model and no database.*

> **Cover image overlay:** WalCoach / A chatbot that remembers you / Walrus Memory · Qwen 3.8 27B · no database
> **Caption:** WalCoach remembers your goals, your routine and the thing that trips you up. Every memory is an encrypted blob on Walrus.
> **Alt text:** The WalCoach walrus mascot in a navy tracksuit beside the words "a chatbot that remembers you", with glowing cyan cubes representing encrypted memories stored on Walrus.

Most chatbots forget you the moment you close the tab. You explain your knee injury, your night shift, the exam in three weeks, and next session you explain it all again. I wanted to know how much of a coach's usefulness is locked in that forgetting. So I built **WalCoach**: a coaching companion with seven mentors that share one memory of you, stored encrypted on Walrus.

Live: **walcoach.vercel.app** · Code: **github.com/EdCryptoFi/walcoach** (MIT)

## Who it's for and what it does

Anyone with a goal they keep dropping. Write in English, Portuguese or Spanish and the coach answers in the same language, short and direct, and stores your memories in it too. No password and no wallet: on your first visit the browser generates a **memory key**, and that key both identifies you and owns the Walrus Memory account your facts are written to. Paste it on another device and your memories follow you. Lose it and they are gone, the honest trade for having no user database.

## Seven mentors, one memory

You do not talk to a generic assistant. You pick a mentor, and each one leads with its own area and its own way of talking:

| Mentor | What it follows |
|---|---|
| **Work & Career** | deadlines, meeting prep, the task you keep avoiding |
| **Fitness & Performance** | sessions, progressive load, old injuries |
| **Study & Academics** | exams, spaced revision, where you got stuck |
| **Pets & Companionship** | routines, vaccines, training your dog or cat |
| **Cooking & Nutrition** | meal prep, swaps, what is in your fridge |
| **Mindfulness & Zen** | stress, sleep hygiene, one small practice at a time |
| **Music & Creativity** | practice, unfinished songs, creative momentum |

The point is the shared memory. Switch from Cooking to Fitness and the new mentor opens with what the other one learned: *"I remember you were working on shakshuka with toast, that sounds like a great pre-workout meal. How is your training going?"* Every fact is tagged with its area, so the panel lights up what the coach already knows and nudges you to bring more of your life in, because sleep is what wrecks training and stress is what wrecks sleep. A toggle turns each mentor's persona off for people who just want the coaching.

## How Walrus Memory is wired in

Three steps per message, all in [`src/memory.ts`](https://github.com/EdCryptoFi/walcoach/blob/main/src/memory.ts):

1. **Recall.** Two semantic queries against the user's own namespace: the message itself (cosine distance < 0.8) plus a fixed "core profile" query for goals, schedule and constraints, so even "hi, I'm back" surfaces what matters.
2. **Generate.** The recalled facts go into the system prompt. The reply shows the exact memories it used as chips, so nothing is hand-wavy.
3. **Learn.** After the reply, the model extracts durable facts, tags each with a life area (`[training] Ana runs Tuesdays and Thursdays at 6am`), and `rememberBulkAndWait` writes them. Each fact becomes one SEAL-encrypted blob on Walrus mainnet, owned by that user's own account object on Sui. Every memory in the UI links to its blob on Walruscan, so a skeptic can click and verify.

Model: **Qwen 3.8 27B via Groq**, open-weight, nothing from Anthropic or OpenAI. It does four jobs: reply, extract facts, write the weekly summary, and compose the daily push nudge.

Memory also works outside the chat: a **Your week** card summarises wins and blockers from stored facts alone, and a daily cron pushes one line grounded in them. Even the push subscriptions live in a Walrus namespace, because there is still no database.

## Whose account is it, anyway?

The Walrus team reviewed an early version and asked a question I did not have a good answer to: every
memory sat under **one** account, mine. Users were separated by a namespace string and nothing else.
Walrus Memory allows 20 delegate keys per account, so the obvious plan, a key per user, stopped at 20
users. Worse, "your memories are yours" was not true in the sense that matters on chain.

So each user now gets **their own Walrus Memory account**, and still never sees a wallet.

The browser generates an Ed25519 keypair. The server builds a **sponsored transaction**: the sender
is the user's address, the gas owner is the project treasury. The browser signs the bytes, the server
adds the second signature and executes, and `create_account` runs with the user as owner. A second
sponsored transaction adds WalCoach as a **delegate key** on that account, so the coach can read and
write there, and the user can revoke it.

The user holds no SUI, installs nothing and approves nothing, because there is no wallet UI to
approve in. A Sui signature is `flag(0x00) || sig(64) || pubkey(32)` over `blake2b256(intent || txBytes)`,
which is all the browser has to implement: 18 KB of vendored crypto, self-hosted so the Content
Security Policy stays `script-src 'self'`. Cost measured on mainnet: **0.004774 SUI per user**, about
two cents, paid by me.

Here is an account created by a real browser on the live site:

| | |
|---|---|
| account | `0xd91cdff1…cb8734` |
| owner | `0x713a0025…48a4`, the user's key, not mine |
| delegate keys | one, labelled WalCoach |

The private key stops travelling to the server entirely. Before, the memory key was the identifier on
every request. Now the server only ever sees the account id, which is public anyway.

What I did **not** achieve: this is not fully non-custodial. The coach holds a delegate key on each
account, because it has to read your memories to answer you. The difference is that the account is
yours, the access is explicit and labelled, and you can remove it. Cutting me out completely means the
browser talking to the relayer directly, which needs client-side SEAL, and that is the next step, not
this one.

## Before and after

I built an eval harness (`npm run eval`): three personas share facts in session one, then session two wipes the short-term context and asks questions only a remembering bot can answer.

| | Probes answered correctly |
|---|---|
| Without memory | **0 / 9** |
| With Walrus Memory | **6 / 9** |

The first version scored 1/9. The jump came from two fixes: the second "profile" recall query, and doing fact extraction with my own model instead of the relayer's `analyze`, which was flipping languages mid-user and hurting recall distances.

## What broke

**The coach didn't remember its own advice.** A tester asked for a meal, got a good one, refreshed, asked "what did you tell me to cook?" and got nothing. My extractor was storing only facts *about the user* and explicitly ignoring the coach's words. Fixed by storing concrete suggestions as `Coach suggested <thing> to <name>`. Now: *"Last time I suggested a sheet pan dinner: chicken thighs, potatoes, broccoli at 425°F."*

**Writes take 5 to 30 seconds.** A question asked right after an answer arrives before the blob exists. The browser now keeps recently extracted facts and sends them back as `pending` until they show up in recall.

**Recall sometimes returns an empty set with HTTP 200** for a namespace that has memories; the same call seconds later returns six hits. The fix is a retry when a user known to have facts gets zero.

**Rate limits are per delegate key**, not per user: 60 weighted requests/min, 1000/hour. One backend serving many users hits that fast, and it surfaces as `seal encrypt failed: RpcError: Too Many Requests`, which reads like a crypto bug and is really a quota. Per-user accounts split the 1000/hour account limit, but the per-minute key limit is still shared, so the retries stayed. All eight friction points are in [FRICTION.md](https://github.com/EdCryptoFi/walcoach/blob/main/FRICTION.md).

When the relayer is unreachable the coach still answers, says so in a banner, and queues the unsaved facts for retry. Degrading well is part of the design.

## See it for yourself

The screenshots below are real sessions, nothing staged: on the left, the facts the coach has stored for that person, each one linking to its blob on Walrus; on the right, the reply and the exact memories it used to write it. Or skip them and check it yourself at **walcoach.vercel.app**: tell it something worth remembering, close the tab, and come back tomorrow.

## Would I do it again

Yes, with one expectation set: Walrus Memory gives you portable, verifiable, user-owned memory, and in exchange you handle latency, quotas and the occasional empty read. “User-owned” is the part worth working for rather than assuming: it took sponsored transactions and an account per person to make the phrase literally true. For a coach that trade is worth it, and the payoff is small and specific: it's Thursday, the user says "no motivation today", and the bot answers *"it's run day, how's the knee since Tuesday?"* Nobody re-explains anything.

---

*Built for Walrus Session 8: Chatbots That Remember. Qwen 3.8 27B via Groq, `@mysten-incubation/memwal`, Hono on Vercel, MIT licensed.*
