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

  function sbHeaders() {
    return {
      apikey: C.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    };
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---- Global presence (Supabase) ---- */
  function presencePage() {
    const p = (location.pathname || '/').replace(/\/$/, '') || '/';
    if (p === '/' || p === '/index.html') return 'gates';
    return p.replace(/^\//, '').split('/')[0] || 'temple';
  }

  async function presencePing() {
    if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) return;
    const id = pilgrimId();
    const sigil = localStorage.getItem('kek_pilgrim_sigil') || randomSigil();
    localStorage.setItem('kek_pilgrim_sigil', sigil);
    const row = {
      pilgrim_id: id,
      display_name: localStorage.getItem('kek_pilgrim_name') || 'Anonymous Pilgrim',
      sigil: sigil,
      page: presencePage(),
      last_seen: new Date().toISOString(),
    };
    try {
      await fetch(C.SUPABASE_URL + '/rest/v1/temple_presence', {
        method: 'POST',
        headers: sbHeaders(),
        body: JSON.stringify(row),
      });
    } catch (e) { /* table may not exist yet */ }
  }

  async function presenceFetch() {
    if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) return [];
    const cutoff = new Date(Date.now() - C.PRESENCE_TTL_MS).toISOString();
    const url = C.SUPABASE_URL + '/rest/v1/temple_presence?select=pilgrim_id,display_name,sigil,page,last_seen'
      + '&last_seen=gte.' + encodeURIComponent(cutoff)
      + '&order=last_seen.desc&limit=48';
    try {
      const r = await fetch(url, { headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY } });
      if (!r.ok) return [];
      return await r.json();
    } catch (e) { return []; }
  }

  function initPresence() {
    const countEl = document.getElementById('presence-count');
    const gridEl = document.getElementById('pilgrim-grid');
    const chamberEl = document.getElementById('presence-chambers');
    if (!countEl && !gridEl) return;

    async function render() {
      await presencePing();
      const rows = await presenceFetch();
      const count = rows.length;
      if (countEl) countEl.textContent = count;
      if (gridEl) {
        if (!rows.length) {
          gridEl.innerHTML = '<p style="color:var(--parchment-dim);font-style:italic;text-align:center;">The halls are quiet. You are early.</p>';
        } else {
          gridEl.innerHTML = rows.slice(0, 24).map(p =>
            `<span class="pilgrim-chip" title="${escHtml(p.page || 'temple')}"><span class="sigil">${escHtml(p.sigil || '𓂀')}</span>${escHtml(p.display_name)}</span>`
          ).join('');
        }
      }
      if (chamberEl && rows.length) {
        const pages = {};
        rows.forEach(r => { const pg = r.page || 'temple'; pages[pg] = (pages[pg] || 0) + 1; });
        chamberEl.innerHTML = Object.keys(pages).sort().map(pg =>
          `<span class="presence-chamber-chip">${escHtml(pg)} <b>${pages[pg]}</b></span>`
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

    const SB_URL = C.SUPABASE_URL;
    const SB_KEY = C.SUPABASE_ANON_KEY;

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

  /* ---- Meme database ---- */
  function initMemeDatabase() {
    const grid = document.getElementById('meme-db-grid');
    if (!grid) return;

    const SB_URL = C.SUPABASE_URL;
    const SB_KEY = C.SUPABASE_ANON_KEY;
    const PAGE    = 48;

    let activeCat   = 'all';
    let activeSort  = 'kek';
    let searchQuery = '';
    let offset      = 0;
    let totalCount  = 0;
    let cache       = [];   /* all rows loaded so far, for modal lookup */

    const searchInput = document.getElementById('meme-search');
    const sortSelect  = document.getElementById('meme-sort');
    const countEl     = document.getElementById('meme-count');
    const catBtns     = document.querySelectorAll('#mdb-cats .cat-pill');
    const modal       = document.getElementById('meme-modal');
    const modalInner  = document.getElementById('meme-modal-inner');

    const CAT_LABELS = { frog:'KEK / Frog', classic:'Classic', wojak:'Wojak', reaction:'Reaction', crypto:'Crypto', '4chan':'4chan', modern:'Modern' };
    const TIER_CLASS = { Eternal:'tier-eternal', Ancient:'tier-ancient', Legendary:'tier-legendary', Sacred:'tier-sacred', Modern:'tier-modern' };
    const SORT_MAP   = { kek:'kek.desc', 'year-old':'year.asc', 'year-new':'year.desc', name:'title.asc' };

    /* All dynamic values pass through esc() before innerHTML insertion — XSS safe */
    function esc(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    function kekDots(n) {
      return Array.from({length:5}).map((_,i)=>`<span class="kek-dot${i<n?' on':''}"></span>`).join('');
    }

    function buildUrl(off) {
      const p = new URLSearchParams({
        select: '*',
        limit:  String(PAGE),
        offset: String(off),
        order:  SORT_MAP[activeSort] || 'kek.desc',
      });
      if (activeCat !== 'all') p.set('cat', 'eq.' + activeCat);
      if (searchQuery)         p.set('search_vector', 'plfts.' + searchQuery);
      return `${SB_URL}/rest/v1/memes?${p}`;
    }

    async function fetchPage(off, append) {
      const res = await fetch(buildUrl(off), {
        headers: {
          'apikey':        SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Prefer':        'count=exact',
        },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      /* Total count lives in the Content-Range header: "0-47/1234" */
      const range = res.headers.get('Content-Range');
      if (range) {
        const t = range.match(/\/(\d+)$/);
        if (t) totalCount = parseInt(t[1], 10);
      }

      const rows = await res.json();
      if (append) {
        cache = cache.concat(rows);
        appendCards(rows);
      } else {
        cache = rows;
        renderGrid(rows);
      }
      updateControls();
    }

    function renderGrid(rows) {
      grid.innerHTML = '';
      if (!rows.length) {
        grid.innerHTML = '<div class="mdb-empty"><span>𓆏</span><p>No memes match. The void is vast.</p></div>';
        return;
      }
      appendCards(rows);
    }

    function appendCards(rows) {
      const frag = document.createDocumentFragment();
      rows.forEach(m => {
        const div  = document.createElement('div');
        div.className = 'meme-card-db reveal';
        div.dataset.id = m.id;
        div.tabIndex   = 0;
        div.setAttribute('role', 'button');
        div.setAttribute('aria-label', m.title);
        const media = m.img
          ? `<img class="mc-img" src="${esc(m.img)}" alt="${esc(m.title)}" loading="lazy">`
          : `<div class="mc-icon">${esc(m.icon||'𓂀')}</div>`;
        const tier = TIER_CLASS[m.tier] || 'tier-modern';
        div.innerHTML = `
          <div class="mc-top">
            <span class="mc-cat-badge">${esc(CAT_LABELS[m.cat]||m.cat)}</span>
            <span class="mc-tier-badge ${tier}">${esc(m.tier)}</span>
          </div>
          <div class="mc-media">${media}</div>
          <div class="mc-body">
            <h3 class="mc-title">${esc(m.title)}</h3>
            <div class="mc-meta">${esc(String(m.year||''))}${m.creator?' · '+esc(m.creator):''}</div>
            <p class="mc-summary">${esc(m.summary)}</p>
            <div class="mc-kek-row">${kekDots(m.kek)}<span class="kek-lbl">KEK</span></div>
            ${(m.scripture || m.lore) ? `<a class="mc-scripture-link" href="/codex/#${esc(m.id)}" onclick="event.stopPropagation()">📜 read the scripture</a>` : ''}
          </div>`;
        div.addEventListener('click', () => openModal(m.id));
        div.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') openModal(m.id); });
        frag.appendChild(div);
      });
      grid.appendChild(frag);
      if (window.KEK) KEK.initReveal();
    }

    function updateControls() {
      if (countEl) {
        const showing = cache.length;
        const total   = totalCount || showing;
        countEl.textContent = showing + ' of ' + total;
      }
      /* Load More button */
      let btn = document.getElementById('meme-load-more');
      if (cache.length >= totalCount && totalCount > 0) {
        if (btn) btn.remove();
        return;
      }
      if (!btn && totalCount > PAGE) {
        btn = document.createElement('div');
        btn.id        = 'meme-load-more';
        btn.className = 'meme-load-more-wrap';
        btn.innerHTML = '<button class="btn btn-ghost meme-load-more-btn">Load More Memes</button>';
        grid.after(btn);
        btn.querySelector('button').addEventListener('click', () => {
          offset += PAGE;
          btn.querySelector('button').textContent = 'Loading…';
          btn.querySelector('button').disabled = true;
          fetchPage(offset, true).catch(() => {
            btn.querySelector('button').textContent = 'Load More Memes';
            btn.querySelector('button').disabled = false;
          });
        });
      }
    }

    function reset() {
      offset = 0;
      cache  = [];
      totalCount = 0;
      const btn = document.getElementById('meme-load-more');
      if (btn) btn.remove();
      grid.innerHTML = '<div class="mdb-loading"><span class="mdb-loading-glyph">𓂀</span><p>Loading the archive…</p></div>';
      fetchPage(0, false).catch(() => {
        grid.innerHTML = '<div class="mdb-empty"><span>𓆏</span><p>Could not reach the archive. Check your connection.</p></div>';
      });
    }

    function openModal(id) {
      const m = cache.find(x => x.id === id);
      if (!m || !modal) return;
      const media = m.img
        ? `<img class="modal-media-img" src="${esc(m.img)}" alt="${esc(m.title)}">`
        : `<div class="modal-media-icon">${esc(m.icon||'𓂀')}</div>`;
      const tier     = TIER_CLASS[m.tier] || 'tier-modern';
      const tagHtml  = (m.tags||[]).map(t=>`<span class="modal-tag">#${esc(t)}</span>`).join('');
      const loreLines = (m.lore||'').split('\n').map(l => l.startsWith('>') ? `<span class="greentext">${esc(l)}</span>` : esc(l)).join('<br>');
      modalInner.innerHTML = `
        <div class="modal-head">
          <div class="modal-media-wrap">${media}</div>
          <div class="modal-title-block">
            <div class="modal-badges">
              <span class="mc-cat-badge">${esc(CAT_LABELS[m.cat]||m.cat)}</span>
              <span class="mc-tier-badge ${tier}">${esc(m.tier)}</span>
            </div>
            <h2 class="modal-title">${esc(m.title)}</h2>
            <div class="modal-meta-row">
              <span>${esc(String(m.year||''))}</span>
              ${m.creator?`<span>${esc(m.creator)}</span>`:''}
              ${m.origin ?`<span>${esc(m.origin)}</span>` :''}
            </div>
            <div class="modal-kek-row">
              ${kekDots(m.kek)}
              <span class="kek-lbl">KEK Connection ${m.kek}/5</span>
            </div>
          </div>
        </div>
        <div class="modal-section">
          <div class="modal-sec-label">𓂀 Origin &amp; History</div>
          <p>${esc(m.description||'')}</p>
        </div>
        <div class="modal-section modal-lore-section">
          <div class="modal-sec-label">𓁹 Temple Lore</div>
          <p class="modal-lore-text">${loreLines||'The lore is yet to be inscribed.'}</p>
        </div>
        ${tagHtml?`<div class="modal-tags">${tagHtml}</div>`:''}
      `;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      const closeBtn = modal.querySelector('.modal-close-btn');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (modal) {
      modal.addEventListener('click', e => { if (e.target===modal) closeModal(); });
      document.addEventListener('keydown', e => { if (e.key==='Escape' && modal.classList.contains('open')) closeModal(); });
    }
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    let searchTimer;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { searchQuery = searchInput.value.trim(); reset(); }, 350);
      });
    }

    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.dataset.cat;
        reset();
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', () => { activeSort = sortSelect.value; reset(); });
    }

    reset();
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

  /* ---- Treasury (on-chain) ---- */
  async function rpcCall(method, params) {
    const r = await fetch(C.RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: method, params: params }),
    });
    const d = await r.json();
    return d.result;
  }

  async function fetchSolBalance(address) {
    try {
      const v = await rpcCall('getBalance', [address]);
      return v != null ? v / 1e9 : null;
    } catch (e) { return null; }
  }

  async function fetchTokenBalance(owner, mint) {
    try {
      const res = await rpcCall('getTokenAccountsByOwner', [owner, { mint: mint }, { encoding: 'jsonParsed' }]);
      const accounts = (res && res.value) || [];
      let total = 0;
      accounts.forEach(a => {
        const info = a.account.data.parsed.info;
        total += parseFloat(info.tokenAmount.uiAmount || 0);
      });
      return total;
    } catch (e) { return null; }
  }

  async function fetchTxCount(address) {
    try {
      const sigs = await rpcCall('getSignaturesForAddress', [address, { limit: 1000 }]);
      return Array.isArray(sigs) ? sigs.length : 0;
    } catch (e) { return null; }
  }

  function fmtNum(n) {
    if (n == null || isNaN(n)) return '—';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  async function initTreasury() {
    const treasSol = document.getElementById('treasury-sol');
    const treasKek = document.getElementById('treasury-kek');
    const treasTxs = document.getElementById('treasury-txs');
    const treasUpdated = document.getElementById('treasury-updated');
    if (!treasSol && !treasKek) return;

    if (C.TREASURY && C.TREASURY !== 'TBD_SET_TREASURY_WALLET') {
      const [sol, kek, txs] = await Promise.all([
        fetchSolBalance(C.TREASURY),
        fetchTokenBalance(C.TREASURY, C.CA),
        fetchTxCount(C.TREASURY),
      ]);
      if (treasSol) treasSol.textContent = sol != null ? sol.toFixed(4) + ' SOL' : '—';
      if (treasKek) treasKek.textContent = kek != null ? fmtNum(kek) + ' $KEK' : '—';
      if (treasTxs) treasTxs.textContent = txs != null ? txs + '+' : '—';
      if (treasUpdated) treasUpdated.textContent = 'Last read: ' + new Date().toLocaleString();
    } else if (treasSol) {
      treasSol.textContent = 'Awaiting consecration';
    }

    const offerBtn = document.getElementById('offering-btn');
    if (offerBtn) offerBtn.addEventListener('click', () => {
      if (!C.TREASURY || C.TREASURY === 'TBD_SET_TREASURY_WALLET') {
        if (window.KEK) KEK.toast('Treasury wallet not yet consecrated');
        return;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(C.TREASURY);
        if (window.KEK) KEK.toast('Treasury address copied — paste in Phantom');
      }
      window.open('https://solscan.io/account/' + C.TREASURY, '_blank', 'noopener');
    });

    const burnBtn = document.getElementById('burn-btn');
    if (burnBtn) burnBtn.addEventListener('click', () => {
      window.open('https://solscan.io/token/' + C.CA, '_blank', 'noopener');
      const log = document.getElementById('burn-log');
      if (log) log.innerHTML = '<p>Community burns are verified on-chain. Coordinate Great Burn rituals in Telegram.</p>';
      if (window.KEK) KEK.toast('Opening token history on Solscan');
    });
  }

  function hodlTier(amount) {
    const tiers = C.HODL_TIERS || [];
    for (let i = 0; i < tiers.length; i++) {
      if (amount >= tiers[i].min) return tiers[i];
    }
    return tiers[tiers.length - 1] || { name: 'Visitor', glyph: '·', blurb: '' };
  }

  async function checkRelicStatus(resultEl, btnEl) {
    const provider = window.solana || window.phantom?.solana;
    if (!provider) {
      if (window.KEK) KEK.toast('Install Phantom to check relic status');
      window.open('https://phantom.app/', '_blank', 'noopener');
      return;
    }
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Reading the chain…'; }
    try {
      const resp = await provider.connect({ onlyIfTrusted: false });
      const pubkey = resp.publicKey.toString();
      const amount = await fetchTokenBalance(pubkey, C.CA) || 0;
      const tier = hodlTier(amount);
      const pct = C.TOTAL_SUPPLY ? ((amount / C.TOTAL_SUPPLY) * 100).toFixed(4) : '0';
      if (resultEl) {
        resultEl.classList.add('show');
        resultEl.innerHTML =
          `<div class="hodl-tier">${escHtml(tier.glyph)} <strong>${escHtml(tier.name)}</strong></div>` +
          `<div class="hodl-stat"><span>Holdings</span><b>${amount.toLocaleString()} $KEK</b></div>` +
          `<div class="hodl-stat"><span>Share of supply</span><b>${pct}%</b></div>` +
          `<div class="hodl-stat"><span>Wallet</span><code>${escHtml(pubkey.slice(0, 4))}…${escHtml(pubkey.slice(-4))}</code></div>` +
          `<p class="hodl-blurb">${escHtml(tier.blurb)}</p>` +
          `<p class="hodl-note"><em>Read-only check. The Temple never signs transactions.</em></p>`;
      }
    } catch (e) {
      if (window.KEK) KEK.toast('Wallet connection declined');
    } finally {
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Check Relic Status'; }
    }
  }

  function initHodl() {
    document.querySelectorAll('[data-hodl-check]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-hodl-result') || 'hodl-result';
        checkRelicStatus(document.getElementById(target), btn);
      });
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
    initPresence();
    initCandles();
    initOracle();
    initInitiation();
    initPraiseBoard();
    initMemeDatabase();
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