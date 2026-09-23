# Demo video script, about 2 minutes

Built around the real session of **ED**: acoustic guitar from zero, wants the notes on the staff,
**prefers chords in tab format**, learning English at intermediate level. Two areas lit, Music and Study.

The video has two jobs: fill the required `Demo Video*` field on DeepSurge, and serve as the
"evidence of real use ... showing the chatbot remembering across sessions" the rules ask for.
It hits the four beats the hackathon names, across **conversations**, **sessions**, **users** and
**devices**, and one beat the hackathon does not ask for but the judges will care about: the memories
are in an account the user owns, provable on chain.

Upload unlisted to YouTube, 1080p, 16:9. Title: *WalCoach, a chatbot that remembers you (Walrus Session 8)*.

## Do this before you record: migrate ED

ED's key is a legacy `web-…` one, so his 9 facts still sit in the shared account and the panel will
say "Walrus Memory namespace". Open the chat as ED, open the **You** dialog, and click **Move my
memories** under "Claim your own account". It takes a few seconds to create the account and about a
minute for the facts to reappear on the left.

Two things to get right, because they are irreversible:

1. **Save the new memory key** (`wal_…`) the moment it is shown. It replaces the old one.
2. Wait until the left panel lists the facts again before you record anything.

After that ED has real memories **and** an account of his own, which is what makes the ownership
shots at 1:06 possible. Do the same for a second person, so the isolation shot at 1:30 shows two
different account ids.

## Before pressing record

1. Open the chat with **ED's new memory key**, let the left panel load the facts with their explorer links.
2. Click **New session** in the "You" dialog. This clears the on-screen transcript but keeps the
   Walrus memories, which is exactly the story: *the conversation is gone, the memory is not.*
3. Have the **second memory key** ready, a different person with different memories.
4. Browser at 125% zoom, no bookmarks bar, light mode, 1920x1080 window. A private window open and
   ready for the cross-device shot. A tab already open on Suiscan, logged out, so it loads fast.

## Shot list

| Time | On screen | Voiceover / caption |
|---|---|---|
| 0:00–0:10 | Home page, slow scroll across the seven mentors | "WalCoach is a coaching companion with seven mentors that share one memory of you. No sign-up, no wallet, and that memory is not in a database of mine." |
| 0:10–0:18 | Click **Music**. Chat opens with an empty conversation, but the left panel already lists the facts | "New conversation, nothing on screen. The memory is on Walrus." |
| 0:18–0:32 | Type **"qual a próxima coisa que eu devia treinar?"** and send | "I do not say what I am learning, or at what level." |
| 0:32–0:44 | Reply names the guitar, the G to C transition, the open strings. Hover the **"Memories used in this reply"** chips | "It answers from what it learned days ago, and shows exactly which memories it used." |
| 0:44–0:54 | Type **"me mostra o acorde de Ré"**. The reply comes back **in tab format**, unprompted | "It also remembered how I like to receive chords: always in tab." |
| 0:54–1:06 | Left panel, click the **↗** on *"ED prefers that guitar chords are always displayed in tab format"* → Walruscan opens on that blob | "That preference is not a row in my database. It is an encrypted blob on Walrus mainnet, and anyone can check it." |
| 1:06–1:22 | Open the **You** dialog: it reads *"Your Walrus Memory account, owned by your memory key"*. Click the account link → Suiscan shows `owner` = ED's key and **one** delegate key labelled WalCoach | "And the account holding it belongs to me, not to the app. WalCoach is one guest key in it, which I can remove whenever I want." |
| 1:22–1:32 | Private window, paste **ED's memory key**, the same facts load | "Same key, different browser. The memory follows the person, not the device." |
| 1:32–1:40 | Switch to the **second memory key**: a different panel, and a **different account id** in the You dialog | "Another person, another account on Sui. Neither can read the other." |
| 1:40–1:50 | Back to ED, turn the **Memory** switch off, send the same question again | "Same question, memory off." → generic answer, no guitar, no tab |
| 1:50–2:02 | Memory back on, click the **Study** mentor: the handover line appears with its badge, then scroll to **Your week** | "Switch mentor and the new one already knows, connecting the guitar practice to the English routine." |
| 2:02–2:08 | End card | Open-weight Qwen 3.8 27B · memory on Walrus mainnet · `walcoach.vercel.app` · `github.com/EdCryptoFi/walcoach` |

## What each shot is there to prove

| Shot | Hackathon requirement it answers |
|---|---|
| 0:00 | What it does, who it is for, the problem |
| 0:18–0:44 | Criterion 1: memory doing real work, recalled at the right time |
| 0:44–0:54 | The strongest proof: a preference honoured without being reminded |
| 0:54 | Memory stored on **Walrus mainnet**, verifiable on chain |
| 1:06 | User-owned memory, the thing most "decentralised" demos only claim |
| 1:22 | Across **devices**, portable memory |
| 1:32 | Across **users**, isolation is a separate account on Sui, not a string |
| 1:40 | The **before/after** the rules require, live, in one click |
| 1:50 | Across **conversations** and mentors |
| 2:02 | The model, for Beyond the Big Two |

If it has to be shorter, cut the handover and Your week: they appear in the article screenshots.
Never cut the tab-format moment, the explorer click, the **account ownership shot**, the cross-device
shot or memory off.

## Practical notes

- Replies take 3 to 8 seconds. Cut those gaps or speed them 2x. No judge wants to watch a spinner.
- Do not write a new fact during the recording and expect to recall it seconds later: writes take
  5 to 30 seconds to become recallable. Everything shown here is already stored.
- Suiscan can take a few seconds on first load. Open that tab before recording and just switch to it.
- If a reply comes out weaker than the previous take, record it again. The memories do not change,
  so every scene is repeatable.
- No narration is fine: put the same lines as large captions at the bottom. Most people watch muted.
- QuickTime records the screen for free; any editor cuts it. Screen Studio, if you have it, adds the
  zoom-on-click that makes the left panel readable.

## Captions, if you record without voice

1. WalCoach: seven mentors, one memory of you.
2. No sign-up, no wallet. The memory is not in my database.
3. New conversation. Nothing on screen.
4. I never say what I am learning.
5. It answers from memories stored days ago, and shows which ones it used.
6. It even remembered I want chords in tab format.
7. That memory is an encrypted blob on Walrus mainnet. Here it is in the explorer.
8. And the account holding it is mine. WalCoach is just a guest key I can remove.
9. Same key, different browser. Memory follows the person.
10. Another person, another account on Sui. Neither sees the other.
11. Same question, memory off.
12. Different mentor, same memory: guitar practice meets the English routine.
13. Open-weight Qwen 3.8 27B. Memory on Walrus mainnet. No database.
