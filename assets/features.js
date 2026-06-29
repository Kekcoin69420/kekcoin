(function () {
  'use strict';
  const C = window.KEK_CONFIG;
  const D = window.KEK_DATA;

  function store(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* */ }
  }
  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }

  function pilgrimId() {
    let id = localStorage.getItem('kek_pilgrim_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('kek_pilgrim_id', id);
    }
    return id;
  }

  function randomSigil() {
    const glyphs = ['𓂀', '𓆏', '𓁹', '☥', '⚡', '🐸', '◎'];
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }

  function randomTempleName() {
    const n = D.templeNames;
    return n.prefixes[Math.floor(Math.random() * n.prefixes.length)] + ' ' +
      n.cores[Math.floor(Math.random() * n.cores.length)] + ' ' +
      n.suffixes[Math.floor(Math.random() * n.suffixes.length)];
  }

  /* ---- Sanctum Immersive Parallax ---- */
  function initSanctumImmersive() {
    const scene = document.getElementById('sanctumImmersive');
    if (!scene) return;

    const bg    = scene.querySelector('.si-bg');
    const colL  = scene.querySelector('.si-col-l');
    const colR  = scene.querySelector('.si-col-r');
    const altar = document.getElementById('siAltar');

    let tx = 0, ty = 0, cx = 0, cy = 0;

    function onMove(nx, ny) { tx = nx; ty = ny; }

    scene.addEventListener('mousemove', e => {
      const r = scene.getBoundingClientRect();
      onMove((e.clientX - r.left) / r.width * 2 - 1,
             (e.clientY - r.top)  / r.height * 2 - 1);
    });

    scene.addEventListener('touchmove', e => {
      const t = e.touches[0];
      const r = scene.getBoundingClientRect();
      onMove((t.clientX - r.left) / r.width * 2 - 1,
             (t.clientY - r.top)  / r.height * 2 - 1);
    }, { passive: true });

    if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', e => {
        onMove(
          Math.max(-1, Math.min(1, (e.gamma || 0) / 28)),
          Math.max(-1, Math.min(1, ((e.beta  || 45) - 45) / 28))
        );
      });
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      (function tick() {
        const ease = 0.055;
        cx += (tx - cx) * ease;
        cy += (ty - cy) * ease;
        if (bg)    bg.style.transform    = 'translate(' + (cx * -3.5) + '%, ' + (cy * -2) + '%)';
        if (colL)  colL.style.transform  = 'translateX(' + (cx * 10) + 'px)';
        if (colR)  colR.style.transform  = 'translateX(' + (cx * -10) + 'px)';
        if (altar) altar.style.transform = 'translateX(calc(-50% + ' + (cx * 14) + 'px)) translateY(' + (cy * 8) + 'px)';
        requestAnimationFrame(tick);
      })();
    }

    initSanctumParticles(scene);
  }

  function initSanctumParticles(scene) {
    const canvas = document.getElementById('siParticles');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = scene.offsetWidth  || window.innerWidth;
      canvas.height = scene.offsetHeight || window.innerHeight;
    }
    resize();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(scene);
    } else {
      window.addEventListener('resize', resize);
    }

    function makeParticle() {
      return {
        x:  Math.random() * (canvas.width  || 800),
        y:  (canvas.height || 600) * (0.2 + Math.random() * 0.8),
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(Math.random() * 0.42 + 0.08),
        r:  Math.random() * 1.5 + 0.4,
        op: Math.random() * 0.5 + 0.1,
        phase: Math.random() * Math.PI * 2
      };
    }

    const COUNT = 45;
    const pts = Array.from({ length: COUNT }, makeParticle);
    let frame = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      pts.forEach(p => {
        p.x += p.vx + Math.sin(frame * 0.009 + p.phase) * 0.18;
        p.y += p.vy;
        if (p.y < -12 || p.x < -25 || p.x > canvas.width + 25) {
          const np = makeParticle();
          np.y = canvas.height + 5;
          Object.assign(p, np);
        }
        const fade = Math.min(1, (canvas.height - p.y) / (canvas.height * 0.55));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(227,190,100,' + (p.op * fade) + ')';
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw();
    }
  }

  /* ---- Sanctum 3D room (legacy — returns early if new immersive is present) ---- */
  function initSanctumRoom() {
    const scene = document.getElementById('sanctum-scene');
    const room = document.getElementById('sanctum-room');
    if (!scene || !room) return;

    let rotX = -12, rotY = 22;
    let drag = false, lastX = 0, lastY = 0;
    let userMoved = false;

    function applyTransform() {
      room.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
    }

    function pauseAutoSpin() {
      room.classList.remove('auto-spin');
      userMoved = true;
    }

    function onPointerDown(e) {
      drag = true;
      pauseAutoSpin();
      scene.classList.add('dragging');
      lastX = e.clientX;
      lastY = e.clientY;
      scene.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!drag) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      rotY += dx * 0.35;
      rotX = Math.max(-38, Math.min(8, rotX - dy * 0.28));
      applyTransform();
    }

    function onPointerUp(e) {
      drag = false;
      scene.classList.remove('dragging');
      try { scene.releasePointerCapture(e.pointerId); } catch (err) { /* */ }
    }

    scene.addEventListener('pointerdown', onPointerDown);
    scene.addEventListener('pointermove', onPointerMove);
    scene.addEventListener('pointerup', onPointerUp);
    scene.addEventListener('pointercancel', onPointerUp);

    scene.addEventListener('wheel', e => {
      e.preventDefault();
      pauseAutoSpin();
      rotX = Math.max(-38, Math.min(8, rotX - e.deltaY * 0.04));
      applyTransform();
    }, { passive: false });

    setTimeout(() => {
      if (!userMoved) room.classList.add('auto-spin');
    }, 100);
  }

  /* ---- Presence ---- */
  function heartbeat() {
    const pilgrims = load('kek_pilgrims', {});
    const id = pilgrimId();
    const name = localStorage.getItem('kek_pilgrim_name') || 'Anonymous Pilgrim';
    const sigil = localStorage.getItem('kek_pilgrim_sigil') || randomSigil();
    localStorage.setItem('kek_pilgrim_sigil', sigil);
    pilgrims[id] = { name, sigil, ts: Date.now() };
    const cutoff = Date.now() - C.PRESENCE_TTL_MS;
    Object.keys(pilgrims).forEach(k => { if (pilgrims[k].ts < cutoff) delete pilgrims[k]; });
    store('kek_pilgrims', pilgrims);
    return pilgrims;
  }

  function initPresence() {
    const countEl = document.getElementById('presence-count');
    const gridEl = document.getElementById('pilgrim-grid');
    if (!countEl) return;

    function render() {
      const pilgrims = heartbeat();
      const list = Object.values(pilgrims);
      const base = 7;
      const count = Math.max(base, list.length + base - 1);
      if (countEl) countEl.textContent = count;
      const siCount = document.getElementById('si-presence-count');
      if (siCount) siCount.textContent = count;
      if (gridEl) {
        gridEl.innerHTML = list.slice(0, 24).map(p =>
          `<span class="pilgrim-chip"><span class="sigil">${p.sigil}</span>${p.name}</span>`
        ).join('');
      }
    }
    render();
    setInterval(render, C.PRESENCE_HEARTBEAT_MS);
  }

  /* ---- Candles ---- */
  function initCandles() {
    const grid = document.getElementById('candle-grid');
    const totalEl = document.getElementById('candle-total');
    const todayEl = document.getElementById('candle-today');
    if (!grid) return;

    const SLOTS = 48;
    let candles = load('kek_candles', []);
    const today = new Date().toDateString();

    function render() {
      grid.innerHTML = '';
      for (let i = 0; i < SLOTS; i++) {
        const c = candles[i];
        const el = document.createElement('div');
        el.className = 'candle' + (c ? ' lit' : '');
        el.textContent = c ? '🕯' : '';
        el.title = c ? c.name + ' — ' + new Date(c.ts).toLocaleString() : 'Click to light';
        el.addEventListener('click', () => lightCandle(i));
        grid.appendChild(el);
      }
      if (totalEl) totalEl.textContent = candles.filter(Boolean).length;
      if (todayEl) {
        todayEl.textContent = candles.filter(c => c && new Date(c.ts).toDateString() === today).length;
      }
    }

    function lightCandle(slot) {
      const nameInput = document.getElementById('candle-name');
      const name = (nameInput && nameInput.value.trim()) ||
        localStorage.getItem('kek_pilgrim_name') || 'A Faithful Pilgrim';
      candles[slot] = { name, ts: Date.now() };
      store('kek_candles', candles);
      if (window.KEK) KEK.playKekSound();
      render();
      if (window.KEK) KEK.toast('Candle lit for ' + name + ' 𓂀');
    }

    const btn = document.getElementById('light-candle-btn');
    if (btn) btn.addEventListener('click', () => {
      const empty = candles.findIndex(c => !c);
      lightCandle(empty >= 0 ? empty : Math.floor(Math.random() * SLOTS));
    });
    render();
  }

  /* ---- Prophecy reader ---- */
  function initOracle() {
    const btn = document.getElementById('oracle-btn');
    const result = document.getElementById('oracle-result');
    if (!btn || !result) return;
    btn.addEventListener('click', () => {
      const q = (document.getElementById('oracle-question') || {}).value || '';
      const p = D.prophecies[Math.floor(Math.random() * D.prophecies.length)];
      result.style.opacity = '0';
      setTimeout(() => {
        result.innerHTML = (q ? '<em>You asked: "' + q.replace(/</g, '') + '"</em><br><br>' : '') +
          '"' + p.text + '"<div class="register">— ' + p.register + '</div>';
        result.style.opacity = '1';
        if (window.KEK) KEK.playKekSound();
      }, 200);
    });
  }

  /* ---- Initiation ---- */
  function initInitiation() {
    const steps = document.querySelectorAll('.init-step');
    const card = document.getElementById('init-card');
    if (!steps.length) return;

    const saved = load('kek_initiation', {});
    steps.forEach((step, i) => {
      const key = 'step' + i;
      if (saved[key]) step.classList.add('done');
      step.addEventListener('click', () => {
        step.classList.toggle('done');
        saved[key] = step.classList.contains('done');
        store('kek_initiation', saved);
        checkComplete();
      });
    });

    function checkComplete() {
      const all = Array.from(steps).every(s => s.classList.contains('done'));
      if (all && card) {
        const name = randomTempleName();
        const sigil = randomSigil();
        card.querySelector('.title').textContent = name;
        card.querySelector('.sigil').textContent = sigil;
        card.classList.add('show');
        localStorage.setItem('kek_pilgrim_name', name.split(' ').slice(-2).join(' '));
        if (window.KEK) KEK.playKekSound();
      }
    }
    checkComplete();
  }

  /* ---- Praise board ---- */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderPraiseBoard(list, rows) {
    list.innerHTML = rows.map(function(p, i) {
      return '<div class="praise-row reveal">' +
        '<span class="praise-rank">' + (i + 1) + '</span>' +
        '<div class="praise-info">' +
          '<h4>' + escHtml(p.name) + '</h4>' +
          '<div class="role">' + escHtml(p.role) + '</div>' +
          (p.note ? '<p>' + escHtml(p.note) + '</p>' : '') +
        '</div>' +
        '<span class="praise-score">𓂀 ' + escHtml(p.praise) + '</span>' +
        '</div>';
    }).join('');
    if (window.KEK) KEK.initReveal();
  }

  function initPraiseBoard() {
    const list = document.getElementById('praise-list');
    if (!list) return;

    const SB_URL = 'https://vyrxqrqfznbpxyzhpmyw.supabase.co';
    const SB_KEY = 'sb_publishable_dCr2XwJ6ZVP2UYuXwYKmzQ_qcJiBOft';

    /* Show static seed while we fetch */
    renderPraiseBoard(list, D.praiseBoard);

    fetch(SB_URL + '/rest/v1/praise_board?select=display_name,role,praise_count,pinned&order=pinned.desc,praise_count.desc&limit=20', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    })
      .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function(rows) {
        if (!rows || !rows.length) return; /* keep seed data if board is empty */
        renderPraiseBoard(list, rows.map(function(r) {
          return { name: r.display_name, role: r.role || 'Pilgrim', praise: r.praise_count, note: '' };
        }));
      })
      .catch(function() { /* silently keep seed data on error */ });
  }

  /* ---- Sacred memes ---- */
  function initMemes() {
    const gallery = document.getElementById('meme-gallery');
    if (!gallery) return;
    let votes = load('kek_meme_votes', {});

    function render() {
      gallery.innerHTML = D.sacredMemes.map((m, i) => {
        const v = votes[i] !== undefined ? votes[i] : m.votes;
        return `<div class="meme-card reveal" data-idx="${i}">
          <div class="thumb">𓂀</div>
          <h4>${m.title}</h4>
          <div class="meta">by ${m.author}</div>
          <div class="votes">𓂀 ${v} offerings</div>
          <span class="tag">${m.tag}</span>
          <div class="mt-24"><button class="btn btn-ghost btn-sm vote-btn" data-idx="${i}">Offer Praise</button></div>
        </div>`;
      }).join('');
      gallery.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx, 10);
          votes[idx] = (votes[idx] !== undefined ? votes[idx] : D.sacredMemes[idx].votes) + 1;
          store('kek_meme_votes', votes);
          render();
          if (window.KEK) KEK.toast('Praise offered 𓂀');
        });
      });
    }
    render();
  }

  /* ---- Meme rotator ---- */
  function initMemeRotator() {
    const rotator = document.getElementById('meme-rotator');
    if (!rotator) return;
    const slides = D.sacredMemes.map((m, i) =>
      `<div class="meme-slide${i === 0 ? ' active' : ''}"><div class="glyph">𓂀</div><p>${m.title}</p><small style="color:var(--parchment-dim)">— ${m.author}</small></div>`
    ).join('');
    rotator.innerHTML = slides;
    let cur = 0;
    setInterval(() => {
      const els = rotator.querySelectorAll('.meme-slide');
      els[cur].classList.remove('active');
      cur = (cur + 1) % els.length;
      els[cur].classList.add('active');
    }, 5000);
  }

  /* ---- FUD purification ---- */
  function initFudPurify() {
    const box = document.getElementById('fud-purify');
    const btn = document.getElementById('fud-btn');
    const quote = document.getElementById('fud-quote');
    const counter = document.getElementById('fud-counter');
    if (!box) return;

    document.addEventListener('kek:stats', e => {
      if (e.detail.chg !== null && e.detail.chg < 0) box.classList.add('visible');
    });
    if (window._kekLastChg !== undefined && window._kekLastChg < 0) box.classList.add('visible');

    let count = load('kek_fud_survived', 0);
    if (counter) counter.textContent = count + ' FUD cycles purified';

    if (btn) btn.addEventListener('click', () => {
      const p = D.prophecies[Math.floor(Math.random() * D.prophecies.length)];
      if (quote) quote.textContent = '"' + p.text + '"';
      count++;
      store('kek_fud_survived', count);
      if (counter) counter.textContent = count + ' FUD cycles purified';
      document.body.classList.add('ritual-active');
      setTimeout(() => document.body.classList.remove('ritual-active'), 2000);
      if (window.KEK) { KEK.playKekSound(); KEK.toast('FUD purified 𓂀'); }
    });
  }

  /* ---- Generators ---- */
  function initGenerators() {
    const nameBtn = document.getElementById('gen-name-btn');
    const nameOut = document.getElementById('gen-name-out');
    if (nameBtn) nameBtn.addEventListener('click', () => {
      if (nameOut) nameOut.textContent = randomTempleName();
    });

    const moonBtn = document.getElementById('gen-moon-btn');
    const moonOut = document.getElementById('gen-moon-out');
    if (moonBtn) moonBtn.addEventListener('click', () => {
      if (moonOut) moonOut.textContent = D.moonMath[Math.floor(Math.random() * D.moonMath.length)];
    });

    const sigilBtn = document.getElementById('gen-sigil-btn');
    const sigilOut = document.getElementById('gen-sigil-out');
    const sigilInput = document.getElementById('gen-sigil-input');
    if (sigilBtn) sigilBtn.addEventListener('click', () => {
      const seed = (sigilInput && sigilInput.value) || pilgrimId();
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = ((h << 5) - h) + seed.charCodeAt(i);
      const glyphs = ['𓂀', '𓆏', '𓁹', '☥', '⚡', '◎', '△', '◇'];
      const g1 = glyphs[Math.abs(h) % glyphs.length];
      const g2 = glyphs[Math.abs(h >> 3) % glyphs.length];
      const g3 = glyphs[Math.abs(h >> 6) % glyphs.length];
      if (sigilOut) sigilOut.innerHTML = `<span style="font-size:48px">${g1}${g2}${g3}</span><br><small>Sigil of ${seed.replace(/</g, '')}</small>`;
    });

    const frameInput = document.getElementById('meme-frame-input');
    const frameCanvas = document.getElementById('meme-frame-canvas');
    if (frameInput && frameCanvas) {
      const ctx = frameCanvas.getContext('2d');
      frameInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
          frameCanvas.width = 600;
          frameCanvas.height = 600;
          ctx.fillStyle = '#0c0805';
          ctx.fillRect(0, 0, 600, 600);
          const scale = Math.min(560 / img.width, 560 / img.height);
          const w = img.width * scale, h = img.height * scale;
          ctx.drawImage(img, (600 - w) / 2, (600 - h) / 2, w, h);
          ctx.strokeStyle = '#e3b34a';
          ctx.lineWidth = 8;
          ctx.strokeRect(10, 10, 580, 580);
          ctx.font = 'bold 28px Cinzel, serif';
          ctx.fillStyle = '#ffd874';
          ctx.textAlign = 'center';
          ctx.fillText('𓂀 KEKCOIN TEMPLE 𓂀', 300, 560);
        };
        img.src = URL.createObjectURL(file);
      });
    }
  }

  /* ---- Treasury ---- */
  async function fetchBalance(address) {
    try {
      const r = await fetch(C.RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] })
      });
      const d = await r.json();
      return d.result ? d.result.value / 1e9 : null;
    } catch (e) { return null; }
  }

  async function initTreasury() {
    const treasEl = document.getElementById('treasury-sol');
    const burnEl = document.getElementById('burn-total');
    if (!treasEl && !burnEl) return;

    const burns = load('kek_burns', { total: 0, events: [] });
    if (burnEl) burnEl.textContent = burns.total.toLocaleString() + ' $KEK';

    if (treasEl && C.TREASURY !== 'TBD_SET_TREASURY_WALLET') {
      const bal = await fetchBalance(C.TREASURY);
      treasEl.textContent = bal !== null ? bal.toFixed(4) + ' SOL' : '—';
    } else if (treasEl) {
      treasEl.textContent = 'Awaiting consecration';
    }

    const offerBtn = document.getElementById('offering-btn');
    if (offerBtn) offerBtn.addEventListener('click', () => {
      const memo = (document.getElementById('offering-memo') || {}).value || 'For the Kek';
      if (C.TREASURY === 'TBD_SET_TREASURY_WALLET') {
        if (window.KEK) KEK.toast('Treasury wallet not yet consecrated');
        return;
      }
      const url = 'https://solana.com/developers/cookbook/transactions/send-sol';
      window.open('solana:' + C.TREASURY + '?amount=0.01&label=Kekcoin%20Temple&message=' + encodeURIComponent(memo), '_blank');
    });

    const burnBtn = document.getElementById('burn-btn');
    if (burnBtn) burnBtn.addEventListener('click', () => {
      if (window.KEK) KEK.setRitualMode(true, 4);
      burns.total += Math.floor(Math.random() * 50000) + 10000;
      burns.events.unshift({ ts: Date.now(), amount: burns.total });
      store('kek_burns', burns);
      if (burnEl) burnEl.textContent = burns.total.toLocaleString() + ' $KEK';
      const log = document.getElementById('burn-log');
      if (log) log.innerHTML = '<p>Latest offering recorded in the Canon. The altar burns.</p>';
      if (window.KEK) KEK.toast('Burn ritual initiated 𓂀');
    });
  }

  /* ---- Hodl check ---- */
  function initHodl() {
    const btn = document.getElementById('hodl-btn');
    const result = document.getElementById('hodl-result');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const provider = window.solana || window.phantom?.solana;
      if (!provider) {
        if (window.KEK) KEK.toast('Install Phantom to check your relic status');
        return;
      }
      try {
        const resp = await provider.connect();
        const pubkey = resp.publicKey.toString();
        const r = await fetch(C.RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1,
            method: 'getTokenAccountsByOwner',
            params: [pubkey, { mint: C.CA }, { encoding: 'jsonParsed' }]
          })
        });
        const d = await r.json();
        const accounts = d.result && d.result.value || [];
        let amount = 0;
        accounts.forEach(a => {
          const info = a.account.data.parsed.info;
          amount += parseFloat(info.tokenAmount.uiAmount || 0);
        });
        let tier = 'Initiate';
        if (amount >= 1000000) tier = 'High Apostle';
        else if (amount >= 100000) tier = 'Frog Templar';
        else if (amount >= 10000) tier = 'Degen Acolyte';
        else if (amount > 0) tier = 'Pilgrim';
        if (result) {
          result.classList.add('show');
          result.innerHTML = `<strong>Relic Status:</strong> ${tier}<br>
            <strong>Holdings:</strong> ${amount.toLocaleString()} $KEK<br>
            <em>The Temple acknowledges your conviction.</em>`;
        }
      } catch (e) {
        if (window.KEK) KEK.toast('Wallet connection declined');
      }
    });
  }

  /* ---- Transmissions filter ---- */
  function initTransmissions() {
    const list = document.getElementById('tx-list');
    const filters = document.querySelectorAll('.tx-filter');
    if (!list) return;

    function render(reg) {
      const items = reg === 'all' ? D.transmissions : D.transmissions.filter(t => t.register === reg);
      list.innerHTML = items.map(t =>
        `<article class="tx-item reveal">
          <div class="tx-date">${t.date}</div>
          <span class="tx-register">${t.register}</span>
          <h3>${t.title}</h3>
          <p class="tx-body">${t.body}</p>
        </article>`
      ).join('');
    }
    render('all');
    filters.forEach(f => f.addEventListener('click', () => {
      filters.forEach(x => x.classList.remove('active'));
      f.classList.add('active');
      render(f.dataset.filter);
    }));
  }

  /* ---- Coin praise click ---- */
  function initCoinPraise() {
    document.querySelectorAll('.coin3d').forEach(coin => {
      const out = document.getElementById('praiseCount');
      const stage = coin.closest('.coin-stage');
      if (!out) return;
      let n = load('kek_praises', 0);
      out.textContent = n.toLocaleString();
      coin.addEventListener('click', ev => {
        n++;
        out.textContent = n.toLocaleString();
        store('kek_praises', n);
        if (window.KEK) KEK.playKekSound();
        if (stage) {
          const r = stage.getBoundingClientRect();
          const f = document.createElement('div');
          f.className = 'float1';
          f.textContent = '+1 𓂀';
          f.style.left = (ev.clientX - r.left) + 'px';
          f.style.top = (ev.clientY - r.top) + 'px';
          stage.appendChild(f);
          setTimeout(() => f.remove(), 900);
        }
      });
    });
  }

  /* ---- Ritual mode toggle (admin/demo) ---- */
  function initRitualToggle() {
    const btn = document.getElementById('ritual-toggle');
    if (btn) btn.addEventListener('click', () => {
      const on = localStorage.getItem('kek_ritual_active') !== '1';
      if (window.KEK) KEK.setRitualMode(on, 4);
      if (window.KEK) KEK.toast(on ? 'Live ritual mode activated' : 'Ritual mode ended');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSanctumImmersive();
    initSanctumRoom();
    initPresence();
    initCandles();
    initOracle();
    initInitiation();
    initPraiseBoard();
    initMemes();
    initMemeRotator();
    initFudPurify();
    initGenerators();
    initTreasury();
    initHodl();
    initTransmissions();
    initCoinPraise();
    initRitualToggle();
  });
})();