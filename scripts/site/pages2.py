# ------------------------------------------------------------------ HOW IT WORKS + SECURITY (imported by build.py)
from shell import icon

def step(n, ic, title, text, tag_icon, tag):
    return f"""
      <article class="glass rounded-3xl p-6 relative overflow-hidden">
        <div class="flex items-start justify-between"><span class="font-display text-5xl font-bold text-primary-container/40 leading-none">{n}</span><span class="w-10 h-10 rounded-xl bg-white grid place-items-center text-primary">{icon(ic)}</span></div>
        <h3 class="font-display text-lg font-semibold mt-4">{title}</h3>
        <p class="text-sm text-on-surface-variant mt-2 leading-relaxed">{text}</p>
        <div class="text-xs font-semibold text-secondary mt-4 inline-flex items-center gap-1">{icon(tag_icon,'text-[16px]')} {tag}</div>
      </article>"""

def how_page():
    return f'''
<main class="relative z-10 pt-28 max-w-[1440px] mx-auto px-4 lg:px-8">
  <section class="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
    <div>
      <span class="chip">{icon('memory','text-[14px]')} Memory architecture</span>
      <h1 class="font-display text-[36px] leading-[44px] lg:text-[44px] lg:leading-[52px] font-bold tracking-tight mt-4 max-w-[22ch]">How WalCoach works: an AI with its own encrypted memory</h1>
      <p class="text-on-surface-variant mt-4 max-w-[60ch]">Most AIs forget who you are the moment you close the tab. WalCoach remembers, and the memory lives on the Walrus network, not in a database of ours.</p>
    </div>
    <div class="glass rounded-2xl px-5 py-3 text-xs"><div class="text-on-surface-variant">Sui / Walrus status</div><div class="inline-flex items-center gap-2 font-semibold text-primary mt-1"><span class="pulse"></span> Mainnet · relayer healthy</div></div>
  </section>

  <section class="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mt-10">
    {step("01","forum","1. You talk","In any language. Replies in the style of a real mentor: direct, focused on one key question at a time, challenging your routine.","psychology","Socratic, not sycophantic")}
    {step("02","data_thresholding","2. It learns & extracts facts","With every message, the open-weight model extracts goals, deadlines, blockers, preferences and progress, and tags each with a life area.","filter_alt","Semantic indexing")}
    {step("03","lock","3. Blobs on Walrus","Each fact is sent to the Walrus Memory relayer, which encrypts it (SEAL) and stores it as a blob on Walrus mainnet, owned by an account on Sui.","enhanced_encryption","Encrypted at rest, owned on-chain")}
    {step("04","history_edu","4. Smart recall","Next session, your message is matched against your memory vectors. Every reply shows exactly which facts were used to build it.","visibility","Context transparency")}
  </section>

  <section class="glass rounded-[2rem] p-6 lg:p-8 mt-12">
    <span class="eyebrow">Data flow</span>
    <h2 class="font-display text-[28px] leading-[36px] lg:text-[36px] lg:leading-[44px] font-semibold tracking-tight mt-2">How your words travel end to end</h2>
    <p class="text-on-surface-variant mt-2 max-w-[70ch]">Honest version, no magic: here is who sees what, and where it ends up.</p>
    <div class="grid md:grid-cols-3 gap-4 mt-6">
      <div class="glass-hi rounded-2xl p-5"><span class="chip">Input</span><h3 class="font-semibold mt-3">Prompt &amp; fact extraction</h3><p class="text-sm text-on-surface-variant mt-2">You share your routine and obstacles. The model (Qwen 3.8 27B, served by Groq) writes the reply and, in parallel, distils the durable facts. Groq's API sees the conversation text; it does not train on it.</p><div class="mt-3 text-xs font-mono bg-white rounded-xl p-3 border border-white">"[training] Ana runs Tue &amp; Thu at 6am, 5k race on 12 Nov."</div></div>
      <div class="glass-hi rounded-2xl p-5"><span class="chip">Relayer · SEAL encryption</span><h3 class="font-semibold mt-3">Encrypted packaging</h3><p class="text-sm text-on-surface-variant mt-2">The Walrus Memory relayer embeds each fact for search, encrypts it with SEAL (threshold encryption tied to the account) and uploads it. The relayer processes the text in clear; our servers keep nothing.</p><div class="mt-3 text-xs font-mono bg-white rounded-xl p-3 border border-white">{icon('key','text-[14px] align-middle')} namespace: coach-&lt;your key&gt;</div></div>
      <div class="glass-hi rounded-2xl p-5"><span class="chip">Walrus network</span><h3 class="font-semibold mt-3">Decentralised persistence</h3><p class="text-sm text-on-surface-variant mt-2">The blob is spread across Walrus storage nodes with erasure coding, and its ownership is recorded on Sui. You can open any memory in the Walrus explorer from the chat.</p><div class="mt-3 text-xs flex justify-between"><span class="text-on-surface-variant">Sui / Walrus availability</span><span class="font-semibold text-primary">Mainnet · verifiable</span></div></div>
    </div>
  </section>

  <section class="mt-16">
    <div class="text-center"><span class="eyebrow">Sovereignty vs. central control</span><h2 class="font-display text-[28px] leading-[36px] lg:text-[36px] lg:leading-[44px] font-semibold tracking-tight mt-2">Why the decentralised architecture changes everything</h2></div>
    <div class="grid lg:grid-cols-2 gap-5 mt-8">
      <div class="glass rounded-3xl p-6">
        <div class="flex items-center justify-between"><h3 class="font-display text-lg font-semibold inline-flex items-center gap-2">{icon('corporate_fare','text-error')} Ordinary chatbots</h3><span class="chip !text-error !bg-error-container/50 !border-error/20">Traditional</span></div>
        <ul class="mt-4 space-y-3 text-sm">
          <li class="flex gap-3">{icon('cancel','text-error text-[20px]')}<div><b>History locked in corporate servers</b><div class="text-on-surface-variant">Your personal-development notes sit in a conventional SQL database.</div></div></li>
          <li class="flex gap-3">{icon('cancel','text-error text-[20px]')}<div><b>Used for training</b><div class="text-on-surface-variant">Your most intimate reflections may retrain proprietary models.</div></div></li>
          <li class="flex gap-3">{icon('cancel','text-error text-[20px]')}<div><b>Sudden context loss</b><div class="text-on-surface-variant">Short context windows make the AI forget the goal you set two weeks ago.</div></div></li>
          <li class="flex gap-3">{icon('cancel','text-error text-[20px]')}<div><b>Trackers, mandatory login and ads</b><div class="text-on-surface-variant">Sessions monitored by third-party cookies and behavioural profiles.</div></div></li>
        </ul>
        <div class="flex justify-between text-xs mt-5 pt-4 border-t border-white/60"><span class="text-on-surface-variant">Privacy risk</span><span class="font-semibold text-error">Critical / centralised</span></div>
      </div>
      <div class="glass-hi rounded-3xl p-6 border-primary-container/30">
        <div class="flex items-center justify-between"><h3 class="font-display text-lg font-semibold inline-flex items-center gap-2">{icon('verified_user','text-primary')} WalCoach, decentralised</h3><span class="chip">Web3 · Walrus protocol</span></div>
        <ul class="mt-4 space-y-3 text-sm">
          <li class="flex gap-3">{icon('check_circle','text-primary text-[20px]')}<div><b>No login, no password</b><div class="text-on-surface-variant">A memory key generated in your browser is your identity. No wallet required.</div></div></li>
          <li class="flex gap-3">{icon('check_circle','text-primary text-[20px]')}<div><b>Encrypted blobs, owned on-chain</b><div class="text-on-surface-variant">Facts are SEAL-encrypted by the Walrus Memory relayer and stored on Walrus; ownership lives on Sui.</div></div></li>
          <li class="flex gap-3">{icon('check_circle','text-primary text-[20px]')}<div><b>Decentralised persistence</b><div class="text-on-surface-variant">Memory is distributed across Walrus nodes. It doesn't depend on a single startup's server.</div></div></li>
          <li class="flex gap-3">{icon('check_circle','text-primary text-[20px]')}<div><b>Full transparency of what was recalled</b><div class="text-on-surface-variant">Every reply lists the exact memories it used, each linked to its blob.</div></div></li>
        </ul>
        <div class="flex justify-between text-xs mt-5 pt-4 border-t border-white/60"><span class="text-on-surface-variant">Data custody</span><span class="font-semibold text-primary">Your namespace, your key</span></div>
      </div>
    </div>
  </section>

  <section class="glass rounded-[2rem] p-6 lg:p-8 mt-16">
    <span class="eyebrow">Open engineering</span>
    <h2 class="font-display text-[28px] leading-[36px] font-semibold tracking-tight mt-2">Transparent tech stack</h2>
    <p class="text-on-surface-variant mt-2 max-w-[70ch]">Built to answer in seconds without compromising the Web3 philosophy, and small enough to read in an afternoon.</p>
    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
      <div class="glass-hi rounded-2xl p-5"><span class="w-9 h-9 rounded-xl bg-white grid place-items-center text-primary">{icon('neurology')}</span><h3 class="font-semibold mt-3">Qwen 3.8 27B</h3><div class="text-xs text-secondary font-semibold">via Groq</div><p class="text-sm text-on-surface-variant mt-2">Open-weight model, not from Anthropic or OpenAI. Fast, direct, and used for replies, fact extraction and daily nudges.</p></div>
      <div class="glass-hi rounded-2xl p-5"><span class="w-9 h-9 rounded-xl bg-white grid place-items-center text-primary">{icon('deployed_code')}</span><h3 class="font-semibold mt-3">Walrus Memory</h3><div class="text-xs text-secondary font-semibold">by Mysten Labs</div><p class="text-sm text-on-surface-variant mt-2">SDK <code>@mysten-incubation/memwal</code>: recall, remember, per-user namespaces, SEAL encryption, Walrus storage.</p></div>
      <div class="glass-hi rounded-2xl p-5"><span class="w-9 h-9 rounded-xl bg-white grid place-items-center text-primary">{icon('travel_explore')}</span><h3 class="font-semibold mt-3">Search with citations</h3><div class="text-xs text-secondary font-semibold">Tavily</div><p class="text-sm text-on-surface-variant mt-2">When you need current facts (a race, a price, a place), the coach searches the web and cites sources. Never for coaching itself.</p></div>
      <div class="glass-hi rounded-2xl p-5"><span class="w-9 h-9 rounded-xl bg-white grid place-items-center text-primary">{icon('code')}</span><h3 class="font-semibold mt-3">MIT open source</h3><div class="text-xs text-secondary font-semibold">Auditable &amp; free</div><p class="text-sm text-on-surface-variant mt-2">The whole integration, prompts, memory logic, this site, is public. Clone it and run your own.</p></div>
    </div>
  </section>

  <section class="mt-16 rounded-[2rem] p-8 lg:p-12 text-center text-white bg-gradient-to-br from-primary-container via-secondary to-primary shadow-glass-lg">
    <span class="chip !bg-white/15 !border-white/30 !text-white">{icon('verified','text-[14px]')} Persistent memory, no central server</span>
    <h2 class="font-display text-[32px] leading-[40px] lg:text-[40px] lg:leading-[48px] font-bold tracking-tight mt-4">Ready for a coach that doesn't forget you?</h2>
    <p class="text-white/80 mt-3 max-w-[50ch] mx-auto">Start today. Your goals, habits and wins preserved, and yours.</p>
    <div class="flex flex-wrap justify-center gap-3 mt-6"><a class="btn-glass" href="/chat">Start chatting {icon('arrow_forward','text-[18px]')}</a><a class="btn-glass" href="/#key">{icon('vpn_key','text-[18px]')} Create a memory key</a></div>
  </section>
</main>
'''

def pillar(n, ic, title, text, extra=""):
    return f"""
      <article class="glass rounded-3xl p-6">
        <div class="flex items-start justify-between"><span class="w-10 h-10 rounded-xl bg-white grid place-items-center text-primary">{icon(ic)}</span><span class="chip">Pillar {n}</span></div>
        <h3 class="font-display text-lg font-semibold mt-4">{title}</h3>
        <p class="text-sm text-on-surface-variant mt-2 leading-relaxed">{text}</p>{extra}
      </article>"""

def security_page():
    p1 = f'''<div class="mt-4 flex flex-wrap items-center gap-2 text-xs"><span class="chip">{icon('chat','text-[14px]')} plain text (reply)</span>{icon('arrow_forward','text-[16px] text-on-surface-variant')}<span class="chip">{icon('key','text-[14px]')} SEAL at the relayer</span>{icon('arrow_forward','text-[16px] text-on-surface-variant')}<span class="chip">{icon('encrypted','text-[14px]')} blob on Walrus</span></div><p class="text-xs text-on-surface-variant mt-3"><b>Limit:</b> encryption is <em>not</em> done in your browser. The model provider (Groq) and the relayer see the conversation text while processing it.</p>'''
    p2 = f'''<div class="grid grid-cols-2 gap-3 mt-4 text-xs"><div class="rounded-xl bg-white/70 p-3"><div class="text-on-surface-variant">Redundancy</div><b>Erasure coding across nodes</b></div><div class="rounded-xl bg-white/70 p-3"><div class="text-on-surface-variant">Ownership</div><b>Sui object, verifiable</b></div></div><p class="text-xs text-on-surface-variant mt-3"><b>Limit:</b> blobs persist for their storage period and cannot yet be individually deleted by us.</p>'''
    p3 = f'''<ul class="mt-4 space-y-1 text-sm"><li class="flex gap-2">{icon('check','text-primary text-[18px]')} No ad profile or behavioural telemetry</li><li class="flex gap-2">{icon('check','text-primary text-[18px]')} Host logs (Vercel) keep IP and timestamps briefly; memory texts are never logged</li></ul>'''
    p4 = f'''<div class="mt-4 rounded-2xl bg-inverse-surface text-inverse-on-surface p-4 text-xs font-mono leading-relaxed"><div class="text-white/50">src/memory.ts</div>const stored = await memwal.rememberBulkAndWait(<br>&nbsp;&nbsp;facts.map((text) =&gt; ({{ text, namespace }})));<br>const hits = await memwal.recall({{ query, namespace, maxDistance: 0.8 }});</div>'''
    return f'''
<main class="relative z-10 pt-28 max-w-[1440px] mx-auto px-4 lg:px-8">
  <div class="glass rounded-full px-5 py-2 text-xs flex flex-wrap items-center gap-4 text-on-surface-variant">
    <span class="inline-flex items-center gap-2 font-semibold text-primary"><span class="pulse"></span> Walrus mainnet · SEAL-encrypted blobs</span>
    <span class="inline-flex items-center gap-1">{icon('shield','text-[16px]')} No central database</span>
    <span class="inline-flex items-center gap-1">{icon('cookie_off','text-[16px]')} No cookies</span>
    <span class="inline-flex items-center gap-1">{icon('code','text-[16px]')} MIT open source</span>
  </div>

  <section class="glass-hi rounded-[2rem] p-6 lg:p-10 mt-6 grid lg:grid-cols-[1.2fr_.8fr] gap-8 items-center">
    <div>
      <span class="chip">{icon('verified_user','text-[14px]')} Honest security · no marketing claims</span>
      <h1 class="font-display text-[36px] leading-[44px] lg:text-[44px] lg:leading-[52px] font-bold tracking-tight mt-4">Radical privacy: <span class="bg-gradient-to-r from-primary-container to-secondary bg-clip-text text-transparent">your memories belong to you</span></h1>
      <p class="text-on-surface-variant mt-4 max-w-[60ch]">WalCoach never sells your data, builds no ad profile and keeps no database of your conversations. Every fact the coach learns is encrypted and stored on the Walrus network under a namespace only your memory key points to. Below is exactly how, including the parts we don't control.</p>
      <div class="flex flex-wrap gap-3 mt-6"><a class="btn-primary" href="/chat">{icon('enhanced_encryption','text-[20px]')} Open the coach</a><a class="btn-glass" href="/how">{icon('account_tree','text-[20px]')} See the data flow</a></div>
    </div>
    <div class="glass rounded-3xl p-5 text-sm">
      <div class="text-xs font-semibold text-on-surface-variant">STATE OF YOUR KEY</div>
      <div class="flex items-center gap-3 mt-3 p-3 rounded-2xl bg-white/70">{icon('key','text-primary')}<div><b>Stored in this browser only</b><div class="text-xs text-on-surface-variant">localStorage · never in a server database</div></div></div>
      <div class="text-xs text-on-surface-variant mt-3">Encryption &amp; storage provider</div>
      <div class="flex items-center gap-3 mt-1 p-3 rounded-2xl bg-white/70">{icon('cloud_done','text-primary')}<div><b>Walrus Memory relayer + Walrus</b><div class="text-xs text-on-surface-variant">by Mysten Labs · SEAL threshold encryption</div></div></div>
    </div>
  </section>

  <section class="mt-16">
    <span class="eyebrow">What actually protects you</span>
    <h2 class="font-display text-[28px] leading-[36px] lg:text-[36px] lg:leading-[44px] font-semibold tracking-tight mt-2">The four pillars, and their limits</h2>
    <p class="text-on-surface-variant mt-2 max-w-[70ch]">Security here is not a contract promise; it is code you can read. We also say plainly what is <em>not</em> covered.</p>
    <div class="grid lg:grid-cols-2 gap-5 mt-8">
      {pillar("01","lock","Encryption at rest on Walrus","Each fact is encrypted with SEAL by the Walrus Memory relayer before it is written to Walrus, and can only be decrypted for the account that owns the namespace. Blobs on the network are unreadable to storage nodes.", p1)}
      {pillar("02","hub","Decentralised storage on Walrus","Built on Walrus Memory (Mysten Labs): blobs are erasure-coded across storage nodes, and ownership is an object on Sui mainnet. No single server of ours holds your history, we have no database at all.", p2)}
      {pillar("03","cookie_off","Zero tracking, no cookies","No third-party cookies, no Google Analytics or Meta Pixel, no fingerprinting. The only thing kept in your browser is your memory key and name (localStorage), which the service needs to work.", p3)}
      {pillar("04","terminal","Open audit, MIT code","Public repository under the MIT licence. Any developer can inspect exactly how memories are extracted, tagged, sent to the relayer and recalled, and run their own copy with their own keys.", p4)}
    </div>
  </section>

  <section class="glass rounded-[2rem] p-6 lg:p-8 mt-16">
    <div class="text-center"><span class="eyebrow justify-center">Data path</span><h2 class="font-display text-[28px] leading-[36px] font-semibold tracking-tight mt-2">How a message travels from you to Walrus</h2></div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 text-center text-sm">
      <div><span class="w-12 h-12 rounded-full bg-white grid place-items-center text-primary mx-auto">{icon('record_voice_over')}</span><div class="text-xs text-on-surface-variant mt-3">Step 1</div><b>You send a message</b><p class="text-on-surface-variant mt-1">Plans, setbacks, goals, in your language.</p></div>
      <div><span class="w-12 h-12 rounded-full bg-white grid place-items-center text-primary mx-auto">{icon('psychology')}</span><div class="text-xs text-on-surface-variant mt-3">Step 2</div><b>Model replies &amp; extracts facts</b><p class="text-on-surface-variant mt-1">Qwen on Groq. Groq does not train on API data.</p></div>
      <div><span class="w-12 h-12 rounded-full bg-white grid place-items-center text-primary mx-auto">{icon('shield_locked')}</span><div class="text-xs text-on-surface-variant mt-3">Step 3</div><b>Relayer encrypts (SEAL)</b><p class="text-on-surface-variant mt-1">Embeds for search, encrypts, uploads.</p></div>
      <div><span class="w-12 h-12 rounded-full bg-white grid place-items-center text-primary mx-auto">{icon('scatter_plot')}</span><div class="text-xs text-on-surface-variant mt-3">Step 4</div><b>Blob on Walrus mainnet</b><p class="text-on-surface-variant mt-1">Spread across nodes, owned on Sui, linked from the chat.</p></div>
    </div>
  </section>

  <section class="mt-16">
    <span class="eyebrow">Your key, your responsibility</span>
    <h2 class="font-display text-[28px] leading-[36px] lg:text-[36px] lg:leading-[44px] font-semibold tracking-tight mt-2">Memory key guide &amp; recovery</h2>
    <div class="grid md:grid-cols-3 gap-5 mt-8">
      <article class="glass rounded-3xl p-6"><span class="w-10 h-10 rounded-xl bg-error-container grid place-items-center text-on-error-container">{icon('warning')}</span><h3 class="font-semibold mt-4">What if I lose my key?</h3><p class="text-sm text-on-surface-variant mt-2">There is no account to recover from. Without the key nobody, including us, can find your namespace. Start again with a new key.</p><ul class="text-xs mt-3 space-y-1"><li class="flex gap-2">{icon('check_small','text-[16px] text-primary')} Keep it in a password manager or notes app</li><li class="flex gap-2">{icon('check_small','text-[16px] text-primary')} Or in <a class="underline" href="https://walnotes.xyz" target="_blank" rel="noopener">Walnotes</a> (encrypted notes on Walrus)</li></ul></article>
      <article class="glass rounded-3xl p-6"><span class="w-10 h-10 rounded-xl bg-white grid place-items-center text-primary">{icon('ios_share')}</span><h3 class="font-semibold mt-4">Use it on another device</h3><p class="text-sm text-on-surface-variant mt-2">Open the site, choose "I already have a memory key", paste it. The coach loads your memories from Walrus and picks up where you left off.</p></article>
      <article class="glass rounded-3xl p-6"><span class="w-10 h-10 rounded-xl bg-white grid place-items-center text-primary">{icon('delete_forever')}</span><h3 class="font-semibold mt-4">Deleting memories</h3><p class="text-sm text-on-surface-variant mt-2">Clearing site data forgets the key on this device. Blobs already on Walrus persist for their storage period; they are encrypted and cannot be found without the key. Per-memory deletion is on the Walrus Memory roadmap.</p></article>
    </div>
  </section>

  <section class="mt-16 max-w-3xl mx-auto">
    <div class="text-center"><span class="eyebrow justify-center">No legalese</span><h2 class="font-display text-[28px] leading-[36px] font-semibold tracking-tight mt-2">Plain-language FAQ</h2></div>
    <div class="mt-6 space-y-3">
      <details class="glass rounded-2xl p-5 group"><summary class="cursor-pointer font-semibold flex items-center justify-between">{icon('smart_toy','text-primary')}<span class="flex-1 ml-3">How does the model process my messages?</span>{icon('expand_more','group-open:rotate-180 transition')}</summary><p class="text-sm text-on-surface-variant mt-3">Each reply is generated by Qwen 3.8 27B on Groq's API from your message, the short-term history your browser sends, and the memories recalled for that message. Groq's API terms state prompts are not used for training. Nothing is kept on our side between requests.</p></details>
      <details class="glass rounded-2xl p-5 group"><summary class="cursor-pointer font-semibold flex items-center justify-between">{icon('cloud_off','text-primary')}<span class="flex-1 ml-3">Where are the servers?</span>{icon('expand_more','group-open:rotate-180 transition')}</summary><p class="text-sm text-on-surface-variant mt-3">The site runs as stateless functions on Vercel. Memories are on the Walrus network via the Walrus Memory relayer (Mysten Labs). Web search, when used, goes to Tavily. See the Privacy page for the full table.</p></details>
      <details class="glass rounded-2xl p-5 group"><summary class="cursor-pointer font-semibold flex items-center justify-between">{icon('payments','text-primary')}<span class="flex-1 ml-3">Do I pay gas or need a wallet?</span>{icon('expand_more','group-open:rotate-180 transition')}</summary><p class="text-sm text-on-surface-variant mt-3">No. Storage is handled by the project's Walrus Memory account; you never sign a transaction or hold tokens. Your identity is the memory key.</p></details>
      <details class="glass rounded-2xl p-5 group"><summary class="cursor-pointer font-semibold flex items-center justify-between">{icon('gavel','text-primary')}<span class="flex-1 ml-3">Is this medical, legal or financial advice?</span>{icon('expand_more','group-open:rotate-180 transition')}</summary><p class="text-sm text-on-surface-variant mt-3">No. It is an AI coach and it can be wrong. For injuries, medication, mental-health crises or money decisions, talk to a professional.</p></details>
    </div>
  </section>

  <section class="mt-16 rounded-[2rem] p-8 lg:p-12 text-white bg-gradient-to-br from-primary-container via-secondary to-primary shadow-glass-lg flex flex-col lg:flex-row items-center justify-between gap-6">
    <div><span class="chip !bg-white/15 !border-white/30 !text-white">{icon('shield','text-[14px]')} Encrypted · verifiable · yours</span><h2 class="font-display text-[28px] leading-[36px] lg:text-[36px] lg:leading-[44px] font-bold tracking-tight mt-3">Your goals deserve a coach that keeps them private.</h2><p class="text-white/80 mt-2 max-w-[50ch]">Start now: no account, memory on Walrus, everything it knows visible to you.</p></div>
    <a class="btn-glass flex-none" href="/chat">{icon('lock','text-[18px]')} Open the coach</a>
  </section>
</main>
'''
