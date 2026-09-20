"""Shared header/footer for the static pages. Run: python3 scripts/site/build.py"""
HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="icon" href="/icon.png" type="image/webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/app.css">
<script>try{{const t=localStorage.getItem("walcoach-theme");if(t==="dark")document.documentElement.dataset.theme="dark";}}catch{{}}</script>
</head>
<body class="relative min-h-screen overflow-x-hidden">
<canvas id="liquid" aria-hidden="true"></canvas>
<div class="blooms" aria-hidden="true"><i></i></div>
'''

def header(active):
    links = [("/", "Home / Mentors", "home"), ("/how", "How it works", "how"), ("/chat", "Chat with the coach", "chat"), ("/security", "Security & Walrus", "security"), ("/privacy", "Privacy", "privacy")]
    nav = "".join(f'<a class="nav-link{" active" if key == active else ""}" href="{href}">{label}</a>' for href, label, key in links)
    return f'''<header class="fixed top-0 left-0 right-0 z-50 glass-nav">
  <div class="h-20 max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-6">
    <div class="flex items-center gap-4">
      <a class="flex items-center gap-2 group" href="/">
        <img alt="" class="h-9 w-9 object-contain transition-transform group-hover:scale-105" src="/characters/mascot.webp">
        <span class="font-display text-xl font-bold tracking-tight text-on-surface">WalCoach</span>
      </a>
      <span class="hidden sm:inline-flex chip">Beta / Web3 AI</span>
    </div>
    <nav class="hidden xl:flex items-center gap-1 p-1.5 rounded-full bg-white/50 border border-white/70">{nav}</nav>
    <div class="flex items-center gap-2">
      <a class="hidden md:inline-flex btn-ghost" href="/#key"><span class="material-symbols-outlined text-[18px]">key</span> Memory key</a>
      <a class="btn-primary !py-2.5 !px-5 text-sm" href="/chat">Open coach <span class="material-symbols-outlined text-[18px]">arrow_forward</span></a>
      <button class="w-10 h-10 rounded-full glass grid place-items-center" id="themeBtn" type="button" aria-label="Toggle dark mode" title="Light / dark"><span class="material-symbols-outlined" id="themeIcon">dark_mode</span></button>
      <button class="xl:hidden w-10 h-10 rounded-full glass grid place-items-center" id="menuBtn" aria-label="Menu" aria-expanded="false"><span class="material-symbols-outlined">menu</span></button>
    </div>
  </div>
  <nav class="xl:hidden hidden flex-col gap-1 px-4 pb-4" id="mobileNav">{nav}</nav>
</header>
<script src="/liquid.js" defer></script>
<script>(()=>{{const b=document.getElementById("themeBtn"),i=document.getElementById("themeIcon");const paint=()=>{{i.textContent=document.documentElement.dataset.theme==="dark"?"light_mode":"dark_mode";}};b.addEventListener("click",()=>{{const d=document.documentElement.dataset.theme==="dark";if(d)delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme="dark";try{{localStorage.setItem("walcoach-theme",d?"light":"dark");}}catch{{}}paint();}});paint();}})();
document.getElementById("menuBtn").addEventListener("click",()=>{{const n=document.getElementById("mobileNav");const o=n.classList.toggle("hidden");n.classList.toggle("flex",o);document.getElementById("menuBtn").setAttribute("aria-expanded",String(o));}});</script>
'''

FOOTER = '''<footer class="relative z-10 mt-16">
  <div class="max-w-[1440px] mx-auto px-4 lg:px-8">
    <div class="glass rounded-3xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant">
      <span class="chip"><span class="pulse"></span> Network: Walrus mainnet · memory active</span>
      <div class="flex flex-wrap gap-4">
        <span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">neurology</span> Open-weight Qwen 3.8 27B</span>
        <span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">database_off</span> No database of you</span>
        <span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">lock</span> Encrypted Walrus Memory</span>
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 px-2 py-6 text-xs text-on-surface-variant">
      <span>Built for <a class="underline" href="https://www.deepsurge.xyz/hackathons/c0141a4a-21be-4009-bc63-7c168608c849" target="_blank" rel="noopener">Walrus Session 8: Chatbots That Remember</a>. MIT open source. An AI coach, not a professional, it can be wrong.</span>
      <nav class="flex flex-wrap gap-4"><a href="/">Home</a><a href="/how">How it works</a><a href="/security">Security &amp; Walrus</a><a href="/privacy">Privacy</a><a href="https://x.com/EdCriptoFi" target="_blank" rel="noopener">Created by Ed</a><span>© 2026 WalCoach</span></nav>
    </div>
  </div>
</footer>
</body>
</html>
'''

def icon(name, cls=""):
    return f'<span class="material-symbols-outlined {cls}">{name}</span>'
