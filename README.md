# 𓂀 KEKCOIN — The Temple of Kek

> Official website for **kekcoin ($KEK)** — the first dogecoin derivative, born on 4chan's `/s4s/` and worshipped on Solana. Redeemable for one ounce of comedy gold.

A single-file, self-contained landing page with an ancient-Egyptian temple aesthetic, live on-chain stats, and a spinning 3D coin. Built to drop straight onto GitHub Pages with zero build step.

---

## 🪙 The Coin

| | |
|---|---|
| **Name** | kekcoin (KEK) |
| **Network** | Solana |
| **Launchpad** | Pump.fun → graduated to PumpSwap |
| **Contract** | `BY4ttYDiMWsyBebNNjNoSfA3krvZvUaPaaYdJsWmpump` |
| **Pair** | `CBW8oZUhbjSbMigGihC5Lh5g7NQEGxVTZ1ikVjH1HBt9` |
| **Status** | Community-owned (CTO — Dec 11, 2025) |
| **Taxes** | 0% buy / 0% sell (standard SPL token) |

**The lore:** There is dogecoin — so why no kekcoin? Formulated on 4chan's `/s4s/` board and proposed as the original "kek" meme coin, $KEK carries the ancient internet laughter of *kek* (the sacred translation of LOL). The first dev wandered into the desert; the faithful reclaimed the temple via Community Takeover. **Kekcoin is abandoned no longer.**

---

## 🔗 Links

- **Buy on Pump.fun** — https://pump.fun/coin/BY4ttYDiMWsyBebNNjNoSfA3krvZvUaPaaYdJsWmpump
- **Swap on Jupiter** — https://jup.ag/swap/SOL-BY4ttYDiMWsyBebNNjNoSfA3krvZvUaPaaYdJsWmpump
- **Chart (DexScreener)** — https://dexscreener.com/solana/cbw8ozuhbjsbmiggihc5lh5g7nqegxvtz1ikvjh1hbt9
- **Twitter / X** — https://x.com/kekcoin69420
- **Telegram** — https://t.me/kekcoincto_tg
- **X Community** — https://x.com/i/communities/1998607823685779782
- **OG /s4s/ Thread** — https://archive.4plebs.org/s4s/thread/1629335/#1629335

---

## ✨ Features

- **Hero banner** — the golden Cult-of-Kek temple art, blended into a dark-stone gradient
- **Live Oracle bar** — real-time price, market cap, liquidity, and 24h volume fetched directly from the [DexScreener API](https://docs.dexscreener.com/api/reference), auto-refreshing every 30 seconds (degrades gracefully to `—` if offline)
- **Spinning 3D coin** ("The Relic") — pure CSS 3D coin with two image faces and a 34-slice reeded gold edge; **hover to pause** the spin
- **The Prophecy** — project lore styled as ancient scripture on a stone tablet
- **Sacred Tokenomics** — network, launchpad, ticker, taxes, ownership, and audit flag
- **The Ritual** — a 4-step "how to buy" guide with Phantom → SOL → swap
- **The Temple** — community links (Twitter, Telegram, X Community, DexScreener, OG thread)
- **One-click copy** — copy the contract address with a confirmation toast
- **Coin everywhere** — the kekcoin logo serves as the nav mark, favicon, section dividers, and footer seal
- **Polish** — Cinzel / Cinzel Decorative + Spectral typography, torch-glow ambiance, film-grain overlay, hieroglyph dividers, and scroll-reveal animations
- **Accessible** — respects `prefers-reduced-motion`

---

## 🛠️ Tech

- **Plain HTML, CSS, and vanilla JS** — no framework, no build tools, no dependencies
- **Self-contained** — the banner and coin images are embedded as base64 data URIs, so `index.html` works on its own anywhere you open it
- Google Fonts (Cinzel, Cinzel Decorative, Spectral) loaded via CDN
- DexScreener public API for live stats (CORS-enabled, no key required)

---

## 📁 Structure

```
.
├── index.html          # the entire site (self-contained, images embedded)
├── kekcoin-logo.jpg     # coin logo — optional, for og:image social previews
├── kek-banner.jpg       # hero banner — optional, for og:image social previews
└── README.md
```

> `index.html` already contains the images inline, so the `.jpg` files are **optional**. Keep them only if you want separate assets for social-share previews.

---

## 🚀 Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Choose your branch (e.g. `main`) and the `/ (root)` folder, then **Save**.
5. Your site goes live at `https://<username>.github.io/<repo>/` within a minute or two.

To run it locally, just open `index.html` in any browser — that's it.

---

## 🎨 Customization

Everything theming-related lives in the `:root` CSS variables at the top of `index.html`:

```css
--gold:#e3b34a;        /* primary gold */
--gold-bright:#ffd874; /* highlight gold */
--torch:#ff8a3d;       /* torch-glow accent */
--kek:#80b341;         /* sacred Pepe-green accent */
--stone-900:#0c0805;   /* deepest background */
--coin:url(...);       /* the kekcoin logo, reused site-wide */
```

- **Swap the coin or banner:** replace the base64 data URIs (the `--coin` variable for the logo, and the `#heroBg` rule for the banner).
- **Live stats:** the `PAIR` constant in the `<script>` at the bottom controls which DexScreener pair the Oracle bar reads.
- **3D coin thickness/speed:** tweak the `half` value in the edge-builder script and the `spin3d` animation duration.

---

## ⚠️ Disclaimer

$KEK is a **meme coin** created for entertainment and community. It has no intrinsic value, no formal team, no roadmap, and no expectation of financial return. **Nothing in this repository is financial advice.** Cryptocurrency is highly volatile and you may lose everything. Always do your own research and **verify the contract address** before buying.

---

<p align="center"><b>𓂀 Praise Kek 𓂀</b></p>

