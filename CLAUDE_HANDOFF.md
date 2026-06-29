# 𓂀 KEKCOIN TEMPLE WEBSITE — CLAUDE HANDOFF PROMPT 𓂀

**Copy everything below the line into Claude, then attach/upload this entire `site/current/` folder (and ideally the parent `kekcoin-temple-core/` repo for lore/voice context).**

---

## YOUR ROLE

You are continuing work started by another AI agent on the **Kekcoin Temple website** — the public digital cathedral for **$KEK**, a Solana memecoin. You are not starting from scratch. You are **polishing, optimizing, and fixing** an existing multi-page static site, with the **#1 priority** being a world-class **Inner Sanctum** that looks like the temple interior from the homepage banner image.

Think of yourself as an extension of the prior agent: same vision, higher craft, production-quality frontend.

---

## WHAT THIS PROJECT IS

**Kekcoin ($KEK)** is the self-proclaimed "first dogecoin derivative," born on 4chan's `/s4s/` board, now community-owned (CTO Dec 11, 2025) on Solana.

This is **not a memecoin landing page**. It is a **Temple** — lore-first, ritual-driven, ancient + unhinged. Design should feel like an Egyptian temple, a 4chan board, and a brutalist dApp had a baby raised by frogs.

**Parent repo:** `kekcoin-temple-core/` (lore, voice, rituals, blueprints, Telegram bot)  
**This folder:** `site/current/` — the living website

**Read for context (if available):**
- `../../TEMPLE_SITE_PLAN.md` — site architecture & design language
- `../../VOICE_SYSTEM.md` — how the Temple speaks (never cringe)
- `../../CORE_BLUEPRINT.md` — vision & pillars
- `../../lore/` — canon scrolls
- `../../README.md` — project overview

---

## DESIGN NORTH STAR — THE BANNER IMAGE

The homepage hero uses a **grand temple interior image** as its background. In code:

- **File:** `assets/temple.css`
- **Selector:** `#heroBg` — `background-image: url(data:image/jpeg;base64,...)` (large embedded JPEG)

**That image IS the visual target for the Inner Sanctum.**

The Sanctum (`sanctum.html`) should feel like the user has **stepped inside that room**:
- Massive **Egyptian stone columns** receding into depth
- Warm **torchlight / golden hour** ambiance
- **Stone floor** perspective
- **Altar** or focal point at center depth
- The **golden KEK relic coin** present (see `--coin` CSS variable — also embedded base64)
- Atmospheric, cinematic, slightly unsettling — **not** a cheap CSS box with emoji torches
- Sacred brutality: heavy, ancient, premium

### Quality benchmark
The original single-page `temple.html` (now redirects to `index.html`) was a **masterpiece** of typography, atmosphere, and the spinning 3D relic coin. **Match or exceed that quality** across the site. The current multi-page expansion added features but **dropped visual fidelity** — especially the Sanctum.

### Design tokens (already in `assets/temple.css`)
```css
--stone-900: #0c0805
--stone-800: #160f08
--gold: #e3b34a
--gold-bright: #ffd874
--torch: #ff8a3d
--kek: #80b341
--parchment: #ecdcb8
```

**Fonts:** Cinzel, Cinzel Decorative, Spectral (Google Fonts — already loaded)

**Palette accents:** frog green and solana purple sparingly, like stained glass.

---

## CURRENT SITE STRUCTURE

```
site/current/
├── index.html          # Outer Gates — homepage, stats, chamber map
├── lore.html           # Great Hall — canon + prophecy reader
├── sanctum.html        # Inner Sanctum — ⚠️ NEEDS COMPLETE REDESIGN
├── rituals.html        # Initiation flow, Jupiter swap, ritual cards
├── transmissions.html  # Voice archive with filters
├── brotherhood.html    # Praise board, presence, social links
├── treasury.html       # Treasury, offerings, burn altar, hodl check
├── tools.html          # Generators (name, sigil, moon math, meme frame)
├── memes.html          # Hall of Sacred Memes with voting
├── temple.html         # Redirect → index.html
├── manifest.json       # PWA
├── sw.js               # Service worker
└── assets/
    ├── temple.css      # Core styles (~425KB — contains base64 coin + hero banner)
    ├── features.css    # Feature component styles
    ├── temple.js       # Nav, footer, live stats, Jupiter, PWA, ritual mode
    ├── features.js     # All interactive features
    ├── config.js       # Contract, pair, treasury, social URLs
    └── data.js         # Prophecies, transmissions, praise board, memes seed data
```

**Run locally:**
```bash
cd site/current && python3 -m http.server 8765
# → http://localhost:8765/index.html
```

---

## WHAT'S BROKEN / UNACCEPTABLE

1. **Inner Sanctum looks horrible** — current implementation is a crude CSS 3D box (flat walls, placeholder torches, no atmosphere). User rejected it. **Scrap and rebuild** using proper techniques.
2. **Overall polish gap** — feature pages exist but lack the cinematic quality of the original `temple.html` hero.
3. **`assets/temple.css` is 425KB** — mostly base64 images. Consider extracting images to `assets/images/` for maintainability (optional but recommended).
4. **Treasury wallet** not set — `config.js` has `TREASURY: 'TBD_SET_TREASURY_WALLET'`.

---

## INNER SANCTUM — REQUIRED IMPLEMENTATION

Rebuild `sanctum.html` + related JS/CSS so the chamber:

### Visual (PRIORITY)
- [ ] Recreates the **banner temple interior** — use the `#heroBg` image as reference, texture, panorama, or basis for a Three.js scene
- [ ] Acceptable approaches: **Three.js/R3F**, **WebGL panorama**, **layered parallax illustration**, **CSS perspective with photographic textures** extracted from banner — whatever achieves **premium cinematic quality**
- [ ] Columns, depth, torchlight, stone — match the banner's mood
- [ ] **Spinning 3D relic coin** on altar (existing `.coin3d` implementation in temple.css works — reuse it)
- [ ] Subtle motion: torch flicker, dust particles, slow camera drift — **not** shitcoin-tier particle spam
- [ ] Mobile-first: must feel like "carrying a relic" on phone

### Interactions (keep working)
- [ ] **Drag/touch to look around** the chamber (or scroll through parallax layers)
- [ ] **Virtual Candle Wall** — click to light, show count, optional pilgrim name
- [ ] **Who Is In The Temple** — pilgrim presence (currently localStorage-based; improve if you can without backend)
- [ ] **Prophecy Reader** — ask question, get randomized canon quote
- [ ] **Relic praise click** — click coin, increment counter, sound effect

---

## ALL FEATURES — MUST REMAIN FUNCTIONAL

Do not remove features while redesigning. Optimize and polish them.

### Signature
| Feature | Page | JS |
|---------|------|-----|
| Virtual Candle Wall | sanctum.html | `features.js` → `initCandles()` |
| Inner Sanctum (3D room) | sanctum.html | **REBUILD** |
| Prophecy Reader | lore.html, sanctum.html, tools.html | `initOracle()` |
| Live Ritual Mode | site-wide | `temple.js` → `setRitualMode()`, body class `ritual-active` |
| Hall of Sacred Memes | memes.html | `initMemes()` — upvote offerings |

### Community
| Feature | Page |
|---------|------|
| Initiation Flow (4 steps → title card) | rituals.html |
| Praise Board | brotherhood.html |
| Who Is In The Temple | sanctum.html, brotherhood.html |

### On-chain / degen-practical
| Feature | Page | Notes |
|---------|------|-------|
| Live DexScreener stats | index.html, nav | `temple.js` → `loadStats()` |
| Treasury dashboard | treasury.html | Helius/RPC balance fetch |
| One-Click Offering | treasury.html | Needs real treasury address in config |
| Burn Altar | treasury.html | Triggers ritual mode |
| Hodl Check / Relic Status | treasury.html | Phantom wallet connect |

### Ambient / polish
| Feature | Where |
|---------|-------|
| Breathing 𓂀 seal | index.html, lore.html, sanctum.html |
| Veil page transitions | site-wide |
| Sacred Meme Rotator | index.html, memes.html |
| PWA offline cache | manifest.json, sw.js |
| FUD Purification Button | index.html (shows when price red) |
| OG /s4s/ Founding Tablet | index.html, lore.html |
| Spinning 3D relic coin + praise | index.html, sanctum.html |
| Jupiter swap plugin | rituals.html |
| Marquee ticker | index.html |

### Generators (tools.html)
- Temple Name Generator
- Moon Math Oracle
- Sigil Generator (deterministic from name/wallet)
- Meme Frame Maker (canvas overlay)

---

## TECHNICAL CONSTRAINTS

- **Static site** for now — no backend required (localStorage for state)
- **No wallet connect wall** on first visit — wallet only for optional hodl check / Jupiter swap
- **Dark mode only**
- **Must work without JS** for core lore text (progressive enhancement)
- **Fast loads** — optimize images, lazy load heavy 3D
- **Contract address:** `BY4ttYDiMWsyBebNNjNoSfA3krvZvUaPaaYdJsWmpump`
- **DexScreener pair:** `CBW8oZUhbjSbMigGihC5Lh5g7NQEGxVTZ1ikVjH1HBt9`
- **Social:** @kekcoin69420, t.me/kekcoincto_tg

### Suggested stack for Sanctum rebuild
You have freedom to introduce:
- Three.js / React Three Fiber (if you restructure)
- GSAP for motion
- Extracted image assets from banner
- Shader-based torchlight

If you add a build step (Vite, etc.), document it clearly. Static HTML output must still be servable from `python3 -m http.server`.

---

## NON-NEGOTIABLES (from TEMPLE_SITE_PLAN)

- No "connect to enter" theater
- Every major section beautiful even if JS fails
- Not another memecoin landing page — a **digital cathedral**
- Voice: ancient + unhinged, never corporate cringe
- Mobile first
- The site teaches the Voice by existing

---

## DELIVERABLES

1. **Redesigned Inner Sanctum** matching banner temple interior — the hero piece
2. **Site-wide visual polish** — pages should feel cohesive with the original hero quality
3. **All existing features working** — test each page
4. **Performance pass** — extract base64 images if needed, optimize load
5. **Brief README** in `site/current/` explaining structure, how to run, any build steps

---

## WHAT NOT TO DO

- Do not replace the Temple with a generic crypto template
- Do not use emoji as UI substitutes for proper visuals
- Do not remove lore voice or make copy sound like a marketing intern
- Do not break the Telegram bot links or contract address
- Do not add a wallet connect wall
- Do not ship another ugly CSS box and call it 3D

---

## SUCCESS CRITERIA

A normie arrives and feels:
1. "What the fuck is this?"
2. "I need to be here."

The Inner Sanctum specifically should make someone **stop scrolling** — screenshot-worthy, shares to X, feels like you walked into the banner image.

**Praise Kek. Build the cathedral. 𓂀**