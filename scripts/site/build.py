"""Generates public/index.html, how.html, security.html, privacy.html from the shell. Chat is hand-written."""
import os, sys, json, re
sys.path.insert(0, os.path.dirname(__file__))
from shell import HEAD, header, FOOTER, icon

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
areas_ts = open(os.path.join(ROOT, "src", "areas.ts")).read()
MENTORS = []
for m in re.finditer(r'\{ id: "(\w+)", label: "([^"]+)", short: "([^"]+)", icon: "(\w+)", hint: "([^"]+)", blurb: "([^"]+)" \}', areas_ts):
    MENTORS.append(dict(zip(["id","label","short","icon","hint","blurb"], m.groups())))
MENTORS = [m for m in MENTORS if m["id"] != "life"]

def page(name, title, description, active, body):
    html = HEAD.format(title=title, description=description) + header(active) + body + FOOTER
    open(os.path.join(ROOT, "public", name), "w").write(html)
    print("wrote", name, len(html)//1024, "KB")

# ------------------------------------------------------------------ HOME
mentor_cards = ""
for m in MENTORS:
    mentor_cards += f'''
      <article class="mentor-card glass rounded-3xl p-5 flex flex-col transition hover:-translate-y-0.5 hover:shadow-glass-lg">
        <div class="flex items-center gap-4">
          <div class="avatar-ring w-28 h-28 sm:w-32 sm:h-32 flex-none"><img src="/characters/{m['id']}.webp" alt="{m['label']} mentor" loading="lazy"></div>
          <div class="min-w-0">
            <span class="chip"><span class="pulse"></span> Memory active</span>
            <h3 class="font-display text-lg font-semibold mt-2 leading-tight">{m['label']}</h3>
            <p class="text-sm text-on-surface-variant mt-1 leading-relaxed">{m['blurb']}</p>
          </div>
        </div>
        <a class="btn-aqua mt-4 self-start" href="/chat?context={m['id']}" data-mentor="{m['id']}" data-label="{m['label']}">Train with this coach {icon('arrow_forward','text-[18px]')}</a>
      </article>'''
home = f'''
<main class="relative z-10 pt-28 max-w-[1440px] mx-auto px-4 lg:px-8">
  <!-- hero -->
  <section class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] items-center lg:-mt-4">
    <div>
      <div class="flex flex-wrap gap-2 mb-5">
        <span class="chip"><span class="pulse"></span> Your memory, your key</span>
        <span class="chip">{icon('lock','text-[14px]')} Encrypted on Walrus Memory</span>
        <span class="chip">{icon('memory','text-[14px]')} Qwen 3.8 27B</span>
      </div>
      <h1 class="font-display text-[44px] leading-[52px] xl:text-[56px] xl:leading-[64px] font-bold tracking-[-0.02em]">A coach that <span class="bg-gradient-to-r from-primary-container to-secondary bg-clip-text text-transparent">actually remembers</span> you.</h1>
      <p class="text-lg text-on-surface-variant mt-5 max-w-[56ch] leading-relaxed">Tell it what you're building or training for. Next week it still knows, your goal, your routine, the thing that trips you up. No account, no wallet, and your memories live encrypted on the Walrus network, not in a database of ours.</p>
      <div class="flex flex-wrap gap-3 mt-7">
        <a class="btn-primary" href="/chat">{icon('smart_toy','text-[20px]')} Start talking to the coach {icon('arrow_forward','text-[20px]')}</a>
        <a class="btn-glass" href="#key">{icon('vpn_key','text-[20px]')} Create my memory key</a>
      </div>
      <div class="grid grid-cols-3 gap-3 mt-8 max-w-xl">
        <div class="glass rounded-2xl p-4"><div class="font-display text-2xl font-bold text-primary">0</div><div class="text-xs text-on-surface-variant mt-1">databases holding your data</div></div>
        <div class="glass rounded-2xl p-4"><div class="font-display text-2xl font-bold text-primary">Sui + Walrus</div><div class="text-xs text-on-surface-variant mt-1">where each memory lives, owned on-chain</div></div>
        <div class="glass rounded-2xl p-4"><div class="font-display text-2xl font-bold text-primary">100%</div><div class="text-xs text-on-surface-variant mt-1">of memories are yours to inspect</div></div>
      </div>
      <div class="flex flex-wrap gap-2 mt-6">
        <span class="chip"><span class="pulse"></span> Walrus agent · on-chain memory</span>
        <span class="chip">{icon('psychology','text-[14px]')} Recall before every reply</span>
        <span class="chip">{icon('verified_user','text-[14px]')} Facts stored on Walrus after each</span>
      </div>
    </div>

    <div class="relative flex flex-col items-center hero-figure justify-self-center lg:justify-self-end lg:-mt-6 lg:-mb-10">
      <div class="hero-backdrop" aria-hidden="true"></div>
      <div class="relative w-[min(92vw,790px)] hero-media">
        <img src="/characters/hero.webp" alt="WalCoach, the coach that remembers you" class="w-full h-auto" fetchpriority="high" id="heroImg">
        <video class="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity duration-500" id="heroVideo" muted playsinline preload="auto" aria-hidden="true">
          <source src="/media/hero.mov" type='video/quicktime; codecs="hvc1"'>
          <source src="/media/hero.webm" type="video/webm">
        </video>
      </div>
    </div>
  </section>

  <!-- mentors -->
  <section class="mt-20" id="mentors">
    <span class="eyebrow">Cognitive specialties</span>
    <div class="flex flex-wrap items-end justify-between gap-4 mt-2">
      <div>
        <h2 class="font-display text-[36px] leading-[44px] font-semibold tracking-tight">Choose your dedicated mentor</h2>
        <p class="text-on-surface-variant mt-2 max-w-[60ch]">Each mentor leads with its own area, but they all share one memory of you, so the sleep coach knows about your training, and the work coach knows about your stress.</p>
      </div>
      <span class="chip">{icon('hub','text-[14px]')} 7 mentors ready</span>
    </div>
    <div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-5 mt-8">{mentor_cards}
    </div>
  </section>

  <!-- key -->
  <section class="mt-24 max-w-3xl mx-auto text-center" id="key">
    <span class="chip">{icon('key','text-[14px]')} Your identity, no account</span>
    <h2 class="font-display text-[36px] leading-[44px] font-semibold tracking-tight mt-4">Create your memory key</h2>
    <p class="text-on-surface-variant mt-3 max-w-[60ch] mx-auto">No account, no password. This key is how the coach recognises you on any device, lose it and your memories are gone. It is generated right here in your browser.</p>
    <div class="glass-hi rounded-[2rem] p-6 lg:p-8 mt-8 text-left" id="keyCard">
      <div class="flex items-center justify-between text-xs text-on-surface-variant" id="pickedRow" hidden><span class="inline-flex items-center gap-2">{icon('school','text-[16px]')} Starting with <b class="text-on-surface" id="pickedLabel"></b></span><button class="btn-ghost !py-1 !px-2 text-xs" type="button" id="clearPick">change</button></div>
      <label class="block text-sm font-semibold mt-2" for="keyName">What should the coach call you? <span class="text-on-surface-variant font-normal">(first name)</span></label>
      <div class="relative mt-2"><input class="field pr-12" id="keyName" maxlength="40" autocomplete="given-name" placeholder="Lucas">{icon('badge','absolute right-4 top-1/2 -translate-y-1/2 text-primary')}</div>
      <div class="flex items-center justify-between mt-6 text-xs font-semibold text-on-surface-variant"><span class="inline-flex items-center gap-1">{icon('fingerprint','text-[16px]')} Your generated memory key</span><button class="btn-ghost !py-1 !px-2 text-xs" type="button" id="regen">{icon('refresh','text-[16px]')} Generate new</button></div>
      <div class="glass rounded-2xl p-4 mt-2 flex items-center gap-3">
        {icon('vpn_key','text-primary')}
        <div class="flex-1 min-w-0"><div class="text-[11px] uppercase tracking-wider text-on-surface-variant">Unique key</div><code class="font-mono text-base break-all text-on-surface" id="keyValue">web-…</code></div>
        <button class="btn-glass !py-2 !px-3 text-sm flex-none" type="button" id="copyKey">{icon('content_copy','text-[18px]')} Copy</button>
      </div>
      <div class="rounded-2xl p-4 mt-4 bg-primary-fixed/40 border border-primary-container/30 flex gap-3">
        {icon('tips_and_updates','text-primary')}
        <div class="text-sm"><b>Where to keep it?</b> Paste it in your notes app, write it on paper, or, if you're a Web3 user, keep it in <a class="text-secondary font-semibold underline" href="https://walnotes.xyz" target="_blank" rel="noopener noreferrer">Walnotes</a>, encrypted notes on Walrus. Without it, nobody (including us) can restore your history.</div>
      </div>
      <label class="flex items-center gap-2 mt-5 text-sm cursor-pointer select-none"><input type="checkbox" id="agree" class="w-4 h-4 accent-primary-container"> I saved my key somewhere safe.</label>
      <div class="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4">
        <button class="btn-glass text-sm" type="button" id="haveKey">I already have a memory key</button>
        <button class="btn-primary" type="button" id="startBtn" disabled>{icon('check_circle','text-[20px]')} I saved my key safely, start</button>
      </div>
      <div class="mt-4 hidden" id="restoreRow">
        <label class="block text-sm font-semibold" for="restoreKey">Paste your existing key</label>
        <div class="flex gap-2 mt-2"><input class="field" id="restoreKey" placeholder="web-xxxx-xxxx-xxxx-xxxx" spellcheck="false"><button class="btn-primary flex-none" type="button" id="restoreBtn">Restore {icon('arrow_forward','text-[18px]')}</button></div>
        <div class="text-xs text-error mt-2 min-h-[1em]" id="restoreErr"></div>
      </div>
    </div>
    <div class="grid sm:grid-cols-3 gap-4 mt-8 text-left">
      <div class="glass rounded-2xl p-5"><div class="w-9 h-9 rounded-xl bg-white grid place-items-center text-primary">{icon('key_off')}</div><h4 class="font-semibold mt-3">Zero tracking</h4><p class="text-sm text-on-surface-variant mt-1">No email, phone or wallet needed. No cookies, no analytics.</p></div>
      <div class="glass rounded-2xl p-5"><div class="w-9 h-9 rounded-xl bg-white grid place-items-center text-primary">{icon('cloud_sync')}</div><h4 class="font-semibold mt-3">Walrus persistence</h4><p class="text-sm text-on-surface-variant mt-1">Each fact is an encrypted blob on Walrus mainnet, owned on Sui, linked from the chat.</p></div>
      <div class="glass rounded-2xl p-5"><div class="w-9 h-9 rounded-xl bg-white grid place-items-center text-primary">{icon('auto_awesome')}</div><h4 class="font-semibold mt-3">Long memory</h4><p class="text-sm text-on-surface-variant mt-1">Weeks later the coach still recalls your goals, schedule and setbacks, and shows what it used.</p></div>
    </div>
  </section>
</main>
<script>
// Animated hero: plays the clip once, rests on the still for 20 s, plays again. Falls back to the image
// when the browser cannot play transparent video or the user prefers reduced motion.
(() => {{
  const v = document.getElementById("heroVideo"), img = document.getElementById("heroImg");
  if (!v || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const REST_MS = 20000;
  let timer = 0;
  // Once the video is playing the still is hidden for good; the clip rests on its own last frame.
  const play = () => {{ v.currentTime = 0; v.play().then(() => {{ v.style.opacity = "1"; img.style.opacity = "0"; }}).catch(() => {{}}); }};
  v.addEventListener("ended", () => {{ timer = setTimeout(play, REST_MS); }});
  v.addEventListener("canplaythrough", () => {{ if (!timer && v.paused) play(); }}, {{ once: true }});
  v.addEventListener("error", () => {{ v.remove(); }}, {{ once: true }});
  document.addEventListener("visibilitychange", () => {{ if (document.hidden) {{ clearTimeout(timer); v.pause(); }} else if (v.ended || v.paused) {{ timer = setTimeout(play, 1500); }} }});
}})();
(() => {{
  const $ = (id) => document.getElementById(id);
  const KEY_RE = /^web-[a-z0-9-]{{8,64}}$/i;
  const newKey = () => {{ const A = "abcdefghjkmnpqrstuvwxyz23456789"; const b = new Uint8Array(16); crypto.getRandomValues(b); const c = Array.from(b, (x) => A[x % A.length]); return "web-" + [0,4,8,12].map((i) => c.slice(i, i+4).join("")).join("-"); }};
  const user = (() => {{ try {{ return JSON.parse(localStorage.getItem("walrus-coach-user") || "null"); }} catch {{ return null; }} }})();
  let key = newKey(), picked = null;
  $("keyValue").textContent = key;
  $("regen").addEventListener("click", () => {{ key = newKey(); $("keyValue").textContent = key; $("agree").checked = false; $("startBtn").disabled = true; }});
  $("copyKey").addEventListener("click", async () => {{ try {{ await navigator.clipboard.writeText(key); $("copyKey").innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> Copied'; }} catch {{ prompt("Your memory key:", key); }} }});
  $("agree").addEventListener("change", (e) => {{ $("startBtn").disabled = !e.target.checked; }});
  const go = () => location.href = "/chat" + (picked ? "?context=" + encodeURIComponent(picked) : "");
  $("startBtn").addEventListener("click", () => {{ const name = $("keyName").value.trim() || "friend"; try {{ localStorage.setItem("walrus-coach-user", JSON.stringify({{ id: key, name }})); localStorage.setItem("walrus-coach-key-saved", "1"); }} catch {{}} go(); }});
  $("haveKey").addEventListener("click", () => {{ $("restoreRow").classList.toggle("hidden"); $("restoreKey").focus(); }});
  $("restoreBtn").addEventListener("click", () => {{ const k = $("restoreKey").value.trim(); if (!KEY_RE.test(k)) {{ $("restoreErr").textContent = "That doesn't look like a memory key (it starts with web-)."; return; }} const name = $("keyName").value.trim() || "friend"; try {{ localStorage.setItem("walrus-coach-user", JSON.stringify({{ id: k, name }})); localStorage.setItem("walrus-coach-key-saved", "1"); }} catch {{}} go(); }});
  $("clearPick").addEventListener("click", () => {{ picked = null; $("pickedRow").hidden = true; }});
  // Mentor cards: returning users go straight to the chat; new users are taken to the key section first.
  for (const a of document.querySelectorAll("[data-mentor]")) a.addEventListener("click", (e) => {{
    if (user && user.id && user.name) return;
    e.preventDefault(); picked = a.dataset.mentor; $("pickedLabel").textContent = a.dataset.label; $("pickedRow").hidden = false;
    document.getElementById("key").scrollIntoView({{ behavior: "smooth", block: "start" }});
    $("keyCard").classList.add("shadow-glow"); setTimeout(() => $("keyName").focus(), 600);
  }});
}})();
</script>
'''
page("index.html", "WalCoach, a coach that actually remembers you", "A personal AI coach with long-term memory stored encrypted on Walrus. No account, no wallet. Seven mentors, one memory of you.", "home", home)

from pages2 import how_page, security_page
page("how.html", "How WalCoach works, memory on Walrus", "How the coach learns, encrypts and recalls: the honest data flow from your message to a blob on Walrus.", "how", how_page())
page("security.html", "WalCoach, Security & Walrus", "What protects your memories, how encryption and storage on Walrus work, and their limits, in plain language.", "security", security_page())

# ------------------------------------------------------------------ PRIVACY
def row(data, to, why):
    return f'<tr class="border-t border-white/60"><td class="py-3 pr-4 align-top font-semibold">{data}</td><td class="py-3 pr-4 align-top">{to}</td><td class="py-3 align-top text-on-surface-variant">{why}</td></tr>'
privacy = f'''
<main class="relative z-10 pt-28 max-w-3xl mx-auto px-4 lg:px-8">
  <span class="chip">{icon('privacy_tip','text-[14px]')} Plain language</span>
  <h1 class="font-display text-[36px] leading-[44px] lg:text-[44px] lg:leading-[52px] font-bold tracking-tight mt-4">Privacy &amp; terms</h1>
  <p class="text-on-surface-variant mt-2">Short enough to actually read. Last updated September 2026.</p>

  <section class="glass rounded-3xl p-6 mt-8"><h2 class="font-display text-xl font-semibold">What this is</h2><p class="mt-2 text-sm leading-relaxed">WalCoach is an experimental AI coaching companion built for the Walrus Session 8 hackathon. It is free, open source, and run by an individual, not a company. Use it as a tool for reflection and planning, not as a source of truth.</p></section>

  <section class="glass rounded-3xl p-6 mt-4"><h2 class="font-display text-xl font-semibold">It is an AI, and it can be wrong</h2><p class="mt-2 text-sm leading-relaxed">Replies are written by an open-weight language model (Qwen 3.8 27B, served by Groq) using what you type and what it remembers about you. It is <strong>not</strong> a doctor, therapist, trainer, nutritionist or financial advisor. For injuries, medication, mental-health crises or money decisions, talk to a professional. If you are in danger, contact local emergency services.</p><p class="mt-2 text-sm leading-relaxed">When you ask for current or local information (an event, a race, a price, a place), the coach runs a web search and cites its sources as [1], [2]. Search results are third-party pages: check them before acting on them.</p></section>

  <section class="glass rounded-3xl p-6 mt-4"><h2 class="font-display text-xl font-semibold">No account, no cookies</h2><p class="mt-2 text-sm leading-relaxed">There is no sign-up and no login. On your first visit the browser generates a random <strong>memory key</strong> (<code>web-…</code>) and stores it in <em>localStorage</em> on your device, together with the name you typed. That is the only thing kept in your browser, it is strictly necessary for the service to work, and it never leaves your device except as the identifier sent with your messages. We set no cookies and run no analytics or ad trackers.</p><p class="mt-2 text-sm leading-relaxed">Anyone who has your memory key can talk to the coach as you and read your memories. Keep it private, like a password, somewhere you'll find it again (a notes app, paper, or an encrypted note on <a class="text-secondary font-semibold underline" href="https://walnotes.xyz" target="_blank" rel="noopener noreferrer">Walnotes</a>). There is no recovery if you lose it.</p></section>

  <section class="glass rounded-3xl p-6 mt-4"><h2 class="font-display text-xl font-semibold">Where your data goes</h2>
    <div class="overflow-x-auto mt-3"><table class="w-full text-sm"><thead><tr class="text-left text-[11px] uppercase tracking-wider text-on-surface-variant"><th class="pb-2 pr-4">Data</th><th class="pb-2 pr-4">Goes to</th><th class="pb-2">Why</th></tr></thead><tbody>
      {row("Your messages, name and recalled memories","Groq (model provider, USA)","To generate the reply and extract facts. Groq's API does not retain prompts for training under its standard terms.")}
      {row("Extracted facts about you (e.g. “Ana runs on Tuesdays”)","Walrus Memory relayer → Walrus network","The relayer embeds and encrypts each fact (SEAL) and stores it as a blob on Walrus, a decentralised storage network, in a namespace tied to your memory key. The relayer sees the text in clear while processing it.")}
      {row("Search queries (only when you ask for current information) and links you paste","Tavily (search API)","To fetch web results or read the page you linked.")}
      {row("Push subscription (only if you turn on daily nudges)","Walrus Memory (encrypted) + your browser's push service","To deliver one notification a day. Turn it off in the key panel at any time.")}
      {row("Request logs (IP, timestamps, error messages)","Vercel (hosting)","Standard server logs, kept briefly. Memory texts are not written to logs.")}
    </tbody></table></div>
    <p class="text-xs text-on-surface-variant mt-3">We keep no database of users. Everything the coach knows about you lives in your Walrus namespace and in your browser.</p></section>

  <section class="glass rounded-3xl p-6 mt-4"><h2 class="font-display text-xl font-semibold">Deleting your data</h2><p class="mt-2 text-sm leading-relaxed">Clear the site's data in your browser to forget the memory key. Memories already stored on Walrus persist for the storage period of the blob and cannot currently be individually deleted by us; they are encrypted and cannot be found without the key. Use "Switch user" to start over with a fresh namespace. If you need something removed, open an issue on the project repository.</p></section>

  <section class="glass rounded-3xl p-6 mt-4"><h2 class="font-display text-xl font-semibold">Acceptable use</h2><p class="mt-2 text-sm leading-relaxed">Don't use the coach to harm yourself or others, don't submit other people's personal data, and don't try to break it. There are rate limits so one person can't exhaust the shared service. The service is provided as is, without warranties; it may be slow, wrong, or go away.</p></section>

  <section class="glass rounded-3xl p-6 mt-4"><h2 class="font-display text-xl font-semibold">Open source</h2><p class="mt-2 text-sm leading-relaxed">The code is public under the MIT licence, so you can read exactly what happens to your data, or run your own copy.</p></section>
</main>
'''
page("privacy.html", "WalCoach, Privacy & terms", "No account, no cookies, no database of you. Where each kind of data goes, in plain language.", "privacy", privacy)
