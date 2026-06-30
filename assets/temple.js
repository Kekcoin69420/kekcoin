(function () {
  'use strict';
  const C = window.KEK_CONFIG;
  const PAGES = [
    { href: 'memes.html', label: 'Memes' },
    { href: 'treasury.html', label: 'Treasury' },
    { href: 'index.html', label: 'Gates' },
    { href: 'lore.html', label: 'Lore' },
    { href: 'rituals.html', label: 'Rituals' },
    { href: 'brotherhood.html', label: 'Brotherhood' }
  ];

  function currentPage() {
    const p = location.pathname.split('/').pop() || 'index.html';
    return p === 'temple.html' ? 'index.html' : p;
  }

  function navHtml() {
    const cur = currentPage();
    const main = PAGES.slice(0, 5);
    const more = PAGES.slice(5);
    const links = main.map(p =>
      `<a href="${p.href}" class="${cur === p.href ? 'active' : ''}">${p.label}</a>`
    ).join('');
    const moreLinks = more.map(p =>
      `<a href="${p.href}" class="${cur === p.href ? 'active' : ''}">${p.label}</a>`
    ).join('');
    return `
<nav>
  <div class="nav-inner">
    <a href="index.html" class="brand"><span class="brand-coin coin-bg" aria-hidden="true"></span>KEKCOIN</a>
    <div class="nav-links">${links}
      <div class="nav-more"><a href="#">Chambers ▾</a><div class="nav-more-menu">${moreLinks}</div></div>
    </div>
    <div class="nav-price-wrap">
      <span class="nav-price-val skel" id="nav-price-val">loading</span>
      <span class="nav-price-chg chg-neutral" id="nav-price-chg"></span>
    </div>
    <button class="hamburger" id="hamburger" aria-label="Open menu"><span></span><span></span><span></span></button>
    <a href="rituals.html" class="nav-cta">Buy $KEK</a>
  </div>
</nav>
<div class="ritual-banner" id="ritual-banner">𓂀 THE ALTAR IS OPEN — LIVE RITUAL IN PROGRESS 𓂀</div>
<div class="ritual-particles" aria-hidden="true"></div>
<div class="mobile-menu" id="mobile-menu" role="dialog" aria-label="Navigation">
  ${PAGES.map(p => `<a href="${p.href}">${p.label}</a>`).join('')}
  <a href="rituals.html" class="btn btn-gold" style="margin-top:8px;justify-content:center;font-size:14px;">⚡ Buy $KEK</a>
</div>`;
  }

  function footerHtml() {
    return `
<footer>
  <div class="wrap">
    <span class="coin-foot coin-bg" aria-hidden="true"></span>
    <div class="ca2">${C.CA}</div>
    <p class="disclaimer">$KEK is a meme coin created for entertainment and community. It has no intrinsic value, no formal team, no roadmap, and no expectation of financial return. Nothing here is financial advice. Crypto is highly volatile and you may lose everything. Always do your own research and verify the contract address before buying.</p>
    <div class="ft">𓂀 Praise Kek 𓂀</div>
  </div>
</footer>
<div class="toast" id="toast"></div>`;
  }

  window.KEK = window.KEK || {};

  KEK.copyCA = function () {
    navigator.clipboard.writeText(C.CA).then(() => KEK.toast('Address copied to the scroll ✔'));
  };

  KEK.toast = function (msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
  };

  KEK.money = function (n) {
    if (n === undefined || n === null || isNaN(n)) return '—';
    n = Number(n);
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    if (n >= 1) return '$' + n.toFixed(2);
    const s = n.toExponential(4).split('e');
    const exp = parseInt(s[1], 10);
    if (exp < 0) {
      const zeros = Math.abs(exp) - 1;
      const digits = s[0].replace('.', '').replace('-', '');
      return '$0.0' + (zeros > 0 ? '(' + zeros + ')' : '') + digits.slice(0, 4);
    }
    return '$' + n.toPrecision(3);
  };

  KEK.playKekSound = function () {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(1100, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(460, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.35);
    } catch (e) { /* silent */ }
  };

  var MARQUEE_BASE = [
    '\u{13000} Praise Kek \u{13000}', '$KEK on Solana', 'Born on 4chan /s4s/', 'The First Dogecoin Derivative',
    'Community Owned \u00b7 CTO Dec 2025', '0% Buy \u00b7 0% Sell Tax', 'One Ounce of Comedy Gold',
    'There Is Dogecoin. Now There Is Kekcoin.', 'Graduated from Pump.fun', C.CA,
    '\u{13000} The Temple of Kek \u{13000}', 'The Faithful Have Reclaimed the Temple'
  ];

  KEK.buildMarquee = function (priceStr, chg) {
    const track = document.getElementById('marquee-track');
    if (!track) return;
    const items = MARQUEE_BASE.slice();
    if (priceStr) {
      const arrow = chg !== null ? (chg >= 0 ? ' \u25b2' : ' \u25bc') : '';
      const pct = chg !== null ? Math.abs(chg).toFixed(2) + '%' : '';
      items.unshift('$KEK \u00b7 ' + priceStr + (arrow ? arrow + pct : ''));
    }
    const all = items.concat(items);
    const frag = document.createDocumentFragment();
    all.forEach(function (t, i) {
      const span = document.createElement('span');
      span.className = 'marquee-item' + (i === 0 && priceStr ? ' live' : '');
      span.textContent = t;
      frag.appendChild(span);
    });
    track.replaceChildren(frag);
    track.classList.remove('running');
    void track.offsetWidth;
    track.classList.add('running');
  };

  KEK.loadStats = async function () {
    try {
      const r = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana/' + C.PAIR);
      const d = await r.json();
      const p = d.pairs && d.pairs[0] ? d.pairs[0] : (d.pair || null);
      if (!p) throw 0;
      const price = parseFloat(p.priceUsd);
      const chg = p.priceChange && p.priceChange.h24 != null ? parseFloat(p.priceChange.h24) : null;
      const txns = p.txns && p.txns.h24 ? (p.txns.h24.buys + p.txns.h24.sells) : null;
      const priceStr = KEK.money(price);

      function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) { el.textContent = val; el.classList.remove('skel'); }
      }
      setVal('s-price', priceStr);
      setVal('s-mc', KEK.money(p.marketCap || p.fdv));
      setVal('s-liq', KEK.money(p.liquidity && p.liquidity.usd));
      setVal('s-vol', KEK.money(p.volume && p.volume.h24));
      setVal('s-txns', txns !== null ? txns.toLocaleString() : '\u2014');

      const chgEl = document.getElementById('s-chg');
      if (chgEl) {
        chgEl.textContent = chg !== null ? (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%' : '\u2014';
        chgEl.className = 'v ' + (chg !== null && chg > 0 ? 'chg-up' : chg !== null && chg < 0 ? 'chg-down' : 'chg-neutral');
      }
      const navVal = document.getElementById('nav-price-val');
      const navChg = document.getElementById('nav-price-chg');
      if (navVal) { navVal.textContent = priceStr; navVal.classList.remove('skel'); }
      if (navChg) {
        navChg.textContent = chg !== null ? (chg >= 0 ? '\u25b2' : '\u25bc') + Math.abs(chg).toFixed(2) + '%' : '';
        navChg.className = 'nav-price-chg ' + (chg !== null && chg > 0 ? 'chg-up' : chg !== null && chg < 0 ? 'chg-down' : 'chg-neutral');
      }
      KEK.buildMarquee(priceStr, chg);
      window._kekLastChg = chg;
      document.dispatchEvent(new CustomEvent('kek:stats', { detail: { price, chg, pair: p } }));
    } catch (e) {
      ['s-price', 's-mc', 's-liq', 's-vol', 's-chg', 's-txns'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) { el.textContent = '\u2014'; el.classList.remove('skel'); }
      });
    }
  };

  KEK.initNav = function () {
    const mount = document.getElementById('temple-nav');
    const foot = document.getElementById('temple-footer');
    if (mount) mount.innerHTML = navHtml();
    if (foot) foot.innerHTML = footerHtml();

    const ham = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (ham && menu) {
      ham.addEventListener('click', () => {
        ham.classList.toggle('open');
        menu.classList.toggle('open');
        document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
      });
      menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        ham.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      }));
    }
  };

  KEK.initReveal = function () {
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  };

  KEK.initRitualMode = function () {
    const ritual = localStorage.getItem('kek_ritual_active') === '1';
    const ritualDate = localStorage.getItem('kek_ritual_until');
    const until = ritualDate ? parseInt(ritualDate, 10) : 0;
    if (ritual && until > Date.now()) {
      document.body.classList.add('ritual-active');
    } else if (ritual) {
      localStorage.removeItem('kek_ritual_active');
    }
  };

  KEK.setRitualMode = function (on, hours) {
    if (on) {
      localStorage.setItem('kek_ritual_active', '1');
      localStorage.setItem('kek_ritual_until', String(Date.now() + (hours || 4) * 3600000));
      document.body.classList.add('ritual-active');
    } else {
      localStorage.removeItem('kek_ritual_active');
      localStorage.removeItem('kek_ritual_until');
      document.body.classList.remove('ritual-active');
    }
  };

  KEK.initJupiter = function (targetId) {
    const id = targetId || 'jupiter-plugin';
    function go() {
      if (window.Jupiter && window.Jupiter.init) {
        try {
          window.Jupiter.init({
            displayMode: 'integrated',
            integratedTargetId: id,
            formProps: {
              initialInputMint: 'So11111111111111111111111111111111111111112',
              initialOutputMint: C.CA,
              fixedMint: C.CA
            }
          });
        } catch (e) { console.warn('Jupiter init failed', e); }
      } else setTimeout(go, 300);
    }
    if (document.getElementById(id)) go();
  };

  KEK.buildCoinEdge = function () {
    document.querySelectorAll('.coin3d .edge').forEach(edge => {
      if (edge.children.length) return;
      const N = 34, half = 15;
      for (let i = 0; i < N; i++) {
        const z = (-half + i * (2 * half) / (N - 1)).toFixed(2);
        const s = document.createElement('div');
        s.className = 'slice';
        s.style.transform = 'translateZ(' + z + 'px)';
        s.style.background = (i % 2) ? '#9c7820' : '#d9b347';
        edge.appendChild(s);
      }
    });
  };

  KEK.registerSW = function () {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    KEK.initNav();
    KEK.initReveal();
    KEK.initRitualMode();
    KEK.loadStats();
    setInterval(KEK.loadStats, 30000);
    KEK.buildCoinEdge();
    KEK.registerSW();
    document.body.classList.add('veil-transition');
  });
})();