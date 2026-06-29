/* 𓂀 Inner Sanctum — Three.js scene
   No ES modules. Uses global THREE from CDN script tag.
   Glow via additive Sprites (no post-processing needed). */

(function () {
  'use strict';

  /* ── Extract base64 image URL from a CSS class's background-image ─── */
  function extractCSSBg(className) {
    const el = document.createElement('div');
    el.className = className;
    Object.assign(el.style, {
      position: 'fixed', width: '2px', height: '2px',
      left: '-9999px', opacity: '0', visibility: 'hidden', pointerEvents: 'none'
    });
    document.body.appendChild(el);
    const bg = window.getComputedStyle(el).backgroundImage;
    document.body.removeChild(el);
    const m = bg.match(/url\(["']?(data:[^"')]+)["']?\)/);
    return m ? m[1] : null;
  }

  /* ── Glow sprite texture ─────────────────────────────────────────── */
  function makeGlowTex(r1, g1, b1) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0,   'rgba(' + r1 + ',' + g1 + ',' + b1 + ',1)');
    g.addColorStop(0.3, 'rgba(' + r1 + ',' + g1 + ',' + b1 + ',0.7)');
    g.addColorStop(0.7, 'rgba(' + Math.floor(r1*0.6) + ',' + Math.floor(g1*0.4) + ',0,0.2)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  /* ── Fire particle sprite ────────────────────────────────────────── */
  function makeFireTex() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 40, 0, 32, 32, 32);
    g.addColorStop(0,    'rgba(255,255,220,1)');
    g.addColorStop(0.25, 'rgba(255,200,60,0.85)');
    g.addColorStop(0.55, 'rgba(255,80,10,0.5)');
    g.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  /* ── Procedural stone canvas texture ────────────────────────────── */
  function stoneCanvas(w, h, r, g, b, grain, cracks) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
    ctx.fillRect(0, 0, w, h);
    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * grain;
      d[i]   = Math.max(0, Math.min(255, d[i]   + n));
      d[i+1] = Math.max(0, Math.min(255, d[i+1] + n * 0.72));
      d[i+2] = Math.max(0, Math.min(255, d[i+2] + n * 0.40));
    }
    ctx.putImageData(id, 0, 0);
    for (let k = 0; k < cracks; k++) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,0,0,' + (0.06 + Math.random() * 0.12) + ')';
      ctx.lineWidth = 0.4 + Math.random() * 0.9;
      let px = Math.random() * w, py = Math.random() * h;
      ctx.moveTo(px, py);
      for (let s = 0; s < 5 + Math.random() * 9; s++) {
        px += (Math.random() - 0.5) * 30; py += (Math.random() - 0.5) * 24;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    return c;
  }

  /* ── Stone tile floor canvas ─────────────────────────────────────── */
  function floorCanvas() {
    const W = 512, H = 512, TW = 128, TH = 64;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#130c06'; ctx.fillRect(0, 0, W, H);
    for (let row = 0; row * TH < H; row++) {
      const off = (row % 2) * (TW / 2);
      for (let col = -1; col * TW < W + TW; col++) {
        const v = 28 + Math.floor(Math.random() * 18);
        ctx.fillStyle = 'rgb(' + (v + 6) + ',' + v + ',' + (v - 5) + ')';
        ctx.fillRect(col * TW + off + 2, row * TH + 2, TW - 4, TH - 4);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    for (let row = 0; row * TH <= H; row++) {
      ctx.fillRect(0, row * TH, W, 2);
      const off = (row % 2) * (TW / 2);
      for (let col = -1; col * TW < W + TW; col++) ctx.fillRect(col * TW + off, row * TH, 2, TH);
    }
    const id = ctx.getImageData(0, 0, W, H); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i+1] = Math.max(0, Math.min(255, d[i+1] + n * 0.75));
      d[i+2] = Math.max(0, Math.min(255, d[i+2] + n * 0.4));
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  /* ── Repeating texture from canvas ──────────────────────────────── */
  function repTex(canvas, rx, ry) {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    return t;
  }

  /* ── Torch fire particle system ──────────────────────────────────── */
  function TorchFire(scene, x, y, z) {
    const COUNT = 85;
    const fireTex = makeFireTex();
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const siz = new Float32Array(COUNT);
    const age = new Float32Array(COUNT);
    const lsp = new Float32Array(COUNT);
    const vel = new Float32Array(COUNT * 3);

    function resetParticle(i, init) {
      lsp[i] = 0.32 + Math.random() * 0.72;
      age[i] = init ? Math.random() * lsp[i] : 0;
      pos[i*3]   = x + (Math.random() - 0.5) * 0.09;
      pos[i*3+1] = y;
      pos[i*3+2] = z + (Math.random() - 0.5) * 0.09;
      vel[i*3]   = (Math.random() - 0.5) * 0.006;
      vel[i*3+1] = 0.016 + Math.random() * 0.026;
      vel[i*3+2] = (Math.random() - 0.5) * 0.006;
    }
    for (let i = 0; i < COUNT; i++) resetParticle(i, true);

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(siz, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.20, vertexColors: true, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      map: fireTex
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    return {
      update: function (dt) {
        for (let i = 0; i < COUNT; i++) {
          age[i] += dt;
          const t = age[i] / lsp[i];
          if (t >= 1) { resetParticle(i, false); continue; }
          pos[i*3]   += vel[i*3];
          pos[i*3+1] += vel[i*3+1] * (1 - t * 0.6);
          pos[i*3+2] += vel[i*3+2];
          const fade = t < 0.18 ? t / 0.18 : 1 - (t - 0.18) / 0.82;
          let r, g, b;
          if      (t < 0.12) { r = 1; g = 1;                         b = 0.9; }
          else if (t < 0.38) { r = 1; g = 0.72 - (t - 0.12) * 1.3;  b = 0.04; }
          else               { r = Math.max(0, 0.9 - (t-0.38)*1.4); g = Math.max(0, 0.24-(t-0.38)*0.6); b = 0; }
          col[i*3] = r; col[i*3+1] = g; col[i*3+2] = b;
          siz[i] = (0.05 + (1 - t) * 0.17) * fade;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate    = true;
        geo.attributes.size.needsUpdate     = true;
      }
    };
  }

  /* ── Ambient dust particles ──────────────────────────────────────── */
  function AmbientDust(scene, count) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 13;
      pos[i*3+1] = -3.5 + Math.random() * 12;
      pos[i*3+2] = Math.random() * -40;
      vel[i*3]   = (Math.random() - 0.5) * 0.0022;
      vel[i*3+1] = 0.0007 + Math.random() * 0.0020;
      vel[i*3+2] = (Math.random() - 0.5) * 0.0007;
      phases[i]  = Math.random() * Math.PI * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.030, color: 0xb09050, transparent: true, opacity: 0.50,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      map: makeGlowTex(200, 160, 70)
    }));
    scene.add(pts);
    let frame = 0;
    return {
      update: function () {
        frame++;
        for (let i = 0; i < count; i++) {
          pos[i*3]   += vel[i*3]   + Math.sin(frame * 0.007 + phases[i]) * 0.001;
          pos[i*3+1] += vel[i*3+1];
          pos[i*3+2] += vel[i*3+2];
          if (pos[i*3+1] > 8.5)  pos[i*3+1] = -3.5;
          if (pos[i*3] < -7)     vel[i*3] *= -1;
          if (pos[i*3] >  7)     vel[i*3] *= -1;
          if (pos[i*3+2] < -42)  pos[i*3+2] = 0;
        }
        geo.attributes.position.needsUpdate = true;
      }
    };
  }

  /* ── Build one Egyptian column group ─────────────────────────────── */
  function makeColumn(shaftMat, capMat) {
    const grp = new THREE.Group();
    const SH = 10.5;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.58, 1.28), capMat);
    base.position.y = 0.29;
    base.castShadow = true;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.54, SH, 22, 1), shaftMat);
    shaft.position.y = 0.58 + SH / 2;
    shaft.castShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.72, 1.38), capMat);
    cap.position.y = 0.58 + SH + 0.36;
    cap.castShadow = true;
    grp.add(base, shaft, cap);
    return grp;
  }

  /* ════════════════════════════════════════════════════════════════
     MAIN INIT — called by sanctum.html after THREE is loaded
  ════════════════════════════════════════════════════════════════ */
  window.initSanctum = function () {
    const canvas = document.getElementById('sanctumCanvas');
    if (!canvas || !window.THREE) {
      console.error('[Sanctum] Missing canvas or THREE');
      return;
    }
    const T = THREE;

    const W = window.innerWidth, H = window.innerHeight;

    /* Renderer */
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = T.PCFSoftShadowMap;
    renderer.toneMapping       = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace  = T.SRGBColorSpace;

    /* Scene + fog */
    const scene  = new T.Scene();
    scene.fog    = new T.Fog(0x0d0803, 20, 60);
    scene.background = new T.Color(0x0d0803);

    /* Camera */
    const camera = new T.PerspectiveCamera(65, W / H, 0.1, 100);
    camera.position.set(0, 0.2, 7.5);

    /* Texture loader */
    const tLoader = new T.TextureLoader();

    /* ── Textures (procedural) ──────────────────────────────── */
    const wallTex  = repTex(stoneCanvas(512, 512,  44, 32, 19, 42, 14), 5, 2.5);
    const ceilTex  = repTex(stoneCanvas(512, 512,  20, 14,  9, 26,  8), 5, 2.5);
    const colTex   = repTex(stoneCanvas(512, 512,  62, 48, 28, 40,  5), 2,   5);
    const floorTex = repTex(floorCanvas(), 4, 10);

    /* ── Materials ──────────────────────────────────────────── */
    const wallMat  = new T.MeshStandardMaterial({ map: wallTex,  roughness: 0.95, metalness: 0.0 });
    const ceilMat  = new T.MeshStandardMaterial({ map: ceilTex,  roughness: 0.97, metalness: 0.0 });
    const colMat   = new T.MeshStandardMaterial({ map: colTex,   roughness: 0.88, metalness: 0.02 });
    const capMat   = new T.MeshStandardMaterial({ color: 0x6a4e26, roughness: 0.84, metalness: 0.04 });
    const floorMat = new T.MeshStandardMaterial({ map: floorTex, roughness: 0.80, metalness: 0.08 });
    const altarMat = new T.MeshStandardMaterial({ color: 0x1b1008, roughness: 0.76, metalness: 0.20 });
    const torchMat = new T.MeshStandardMaterial({ color: 0x4a3010, roughness: 0.78, metalness: 0.32 });
    const goldMat  = new T.MeshStandardMaterial({
      color: 0xd4a020, roughness: 0.08, metalness: 0.98,
      emissive: new T.Color(0xaa7808), emissiveIntensity: 0.45
    });

    /* ── Room dimensions ────────────────────────────────────── */
    const FY   = -3.5;
    const RH   = 11.5;
    const CY   = FY + RH;       // 8.0
    const RW   = 14;
    const RD   = 46;
    const MID_Z = -RD / 2 + 10; // floor/wall centre

    /* Floor */
    const floor = new T.Mesh(new T.PlaneGeometry(RW, RD + 12), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FY, MID_Z);
    floor.receiveShadow = true;
    scene.add(floor);

    /* Ceiling */
    const ceil = new T.Mesh(new T.PlaneGeometry(RW, RD + 12), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, CY, MID_Z);
    scene.add(ceil);

    /* Side walls */
    function sideWall(x, ry) {
      const m = new T.Mesh(new T.PlaneGeometry(RD + 12, RH), wallMat.clone());
      m.rotation.y = ry;
      m.position.set(x, FY + RH / 2, MID_Z);
      m.receiveShadow = true;
      scene.add(m);
    }
    sideWall(-RW / 2,  Math.PI / 2);
    sideWall( RW / 2, -Math.PI / 2);

    /* Back wall */
    const backMat  = new T.MeshStandardMaterial({ color: 0x110a04, roughness: 0.97 });
    const backWall = new T.Mesh(new T.PlaneGeometry(RW, RH), backMat);
    backWall.position.set(0, FY + RH / 2, -RD + 10);
    scene.add(backWall);

    /* Try loading hero banner as back wall texture */
    const heroURL = extractCSSBg('hero-bg');
    if (heroURL) {
      const ht = tLoader.load(heroURL);
      ht.colorSpace = T.SRGBColorSpace;
      backMat.map = ht;
      backMat.color.set(0xffffff);
      backMat.needsUpdate = true;
    }

    /* ── Columns — 5 pairs ──────────────────────────────────── */
    const COL_Z  = [-1, -7, -13, -19, -25];
    const COL_X  = 5.0;
    const colProto = makeColumn(colMat, capMat);

    COL_Z.forEach(function (z) {
      [-COL_X, COL_X].forEach(function (x) {
        const col = colProto.clone();
        col.position.set(x, FY, z);
        scene.add(col);
      });
    });

    /* ── Torches ─────────────────────────────────────────────── */
    const TORCH_Z  = [-4, -10, -16, -22];
    const TORCH_Y  = 1.8;
    const torchFires  = [];
    const torchLights = [];
    const torchGlows  = [];
    const glowTorchTex = makeGlowTex(255, 110, 20);

    TORCH_Z.forEach(function (tz) {
      [{ x: -COL_X + 1.0, s:  1 }, { x: COL_X - 1.0, s: -1 }].forEach(function (tp) {
        const tx = tp.x, side = tp.s;

        /* Sconce bracket + bowl */
        const grp = new T.Group();
        const arm = new T.Mesh(new T.BoxGeometry(0.30, 0.09, 0.60), torchMat);
        arm.position.z = 0.28;
        const bowl = new T.Mesh(new T.CylinderGeometry(0.14, 0.09, 0.25, 8), torchMat);
        bowl.position.set(0, 0.13, 0.57);
        grp.add(arm, bowl);
        grp.position.set(tx, TORCH_Y, tz);
        grp.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        scene.add(grp);

        /* Fire particles */
        torchFires.push(TorchFire(scene, tx * 0.86, TORCH_Y + 0.28, tz));

        /* Flickering point light */
        const pl = new T.PointLight(0xff7418, 5.5, 18, 2);
        pl.position.set(tx * 0.80, TORCH_Y + 0.55, tz);
        scene.add(pl);
        torchLights.push({ light: pl, base: 5.5, seed: Math.random() * 100 });

        /* Additive glow sprite (fake bloom) */
        const gMat = new T.SpriteMaterial({
          map: glowTorchTex, color: new T.Color(1, 0.42, 0.06),
          blending: T.AdditiveBlending, transparent: true, opacity: 0.55, depthWrite: false
        });
        const gs = new T.Sprite(gMat);
        gs.scale.set(2.4, 2.8, 1);
        gs.position.set(tx * 0.80, TORCH_Y + 0.6, tz);
        scene.add(gs);
        torchGlows.push({ sprite: gs, basOp: 0.55, seed: Math.random() * 100 });
      });
    });

    /* ── Altar — stepped pyramid ─────────────────────────────── */
    const AZ = -32;
    [[7, 1.1, 6, 0], [5.2, 0.88, 5, 1.1], [3.6, 0.76, 3.8, 1.98], [2.2, 0.56, 2.4, 2.74]].forEach(function (s) {
      const m = new T.Mesh(new T.BoxGeometry(s[0], s[1], s[2]), altarMat);
      m.position.set(0, FY + s[1] / 2 + s[3], AZ);
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
    });

    /* Altar top gold slab */
    const slabY = FY + (1.1 + 0.88 + 0.76 + 0.56);
    const slab  = new T.Mesh(new T.BoxGeometry(2.5, 0.07, 2.5), goldMat);
    slab.position.set(0, slabY, AZ);
    scene.add(slab);

    /* ── God ray light shaft above altar ─────────────────────── */
    const rayMat = new T.MeshBasicMaterial({
      color: 0xffe080, transparent: true, opacity: 0.042,
      blending: T.AdditiveBlending, depthWrite: false, side: T.BackSide
    });
    const rayMesh = new T.Mesh(new T.CylinderGeometry(0.45, 3.0, 9.5, 14, 1, true), rayMat);
    rayMesh.position.set(0, FY + RH * 0.68, AZ);
    scene.add(rayMesh);
    for (let i = 0; i < 4; i++) {
      const pm = new T.Mesh(new T.PlaneGeometry(0.32, 9.0), new T.MeshBasicMaterial({
        color: 0xffe890, transparent: true, opacity: 0.024,
        blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
      }));
      pm.rotation.y = (i / 4) * Math.PI;
      pm.position.set(0, FY + RH * 0.60, AZ);
      scene.add(pm);
    }

    /* Altar spotlight */
    const altarSpot = new T.SpotLight(0xffc040, 20, 40, Math.PI / 5.5, 0.45, 2);
    altarSpot.position.set(0, CY, AZ);
    altarSpot.target.position.set(0, FY + 2, AZ);
    altarSpot.castShadow = true;
    altarSpot.shadow.mapSize.set(1024, 1024);
    altarSpot.shadow.bias = -0.0008;
    scene.add(altarSpot, altarSpot.target);

    /* ── Coin ────────────────────────────────────────────────── */
    const COIN_Y = slabY + 2.5;
    const coinFaceMat = new T.MeshStandardMaterial({
      color: 0xe8c030, roughness: 0.09, metalness: 0.97,
      emissive: new T.Color(0xcc9820), emissiveIntensity: 0.55
    });
    const coinEdgeMat = new T.MeshStandardMaterial({
      color: 0xb07c08, roughness: 0.12, metalness: 0.98,
      emissive: new T.Color(0x996808), emissiveIntensity: 0.38
    });
    const coinGeo = new T.CylinderGeometry(0.90, 0.90, 0.09, 64, 1, false);
    const coin = new T.Mesh(coinGeo, [coinEdgeMat, coinFaceMat, coinFaceMat]);
    coin.rotation.x = Math.PI / 2; // face toward camera
    coin.position.set(0, COIN_Y, AZ);
    coin.castShadow = true;
    scene.add(coin);

    /* Try loading coin image from CSS */
    const coinURL = extractCSSBg('coin-bg');
    if (coinURL) {
      tLoader.load(coinURL, function (t) {
        t.colorSpace = T.SRGBColorSpace;
        coinFaceMat.map = t;
        coinFaceMat.needsUpdate = true;
      });
    }

    /* Coin point light */
    const coinLight = new T.PointLight(0xffd050, 8, 16, 2);
    coinLight.position.set(0, COIN_Y, AZ);
    scene.add(coinLight);

    /* Coin glow sprites (fake bloom) */
    const glowCoinTex = makeGlowTex(255, 210, 60);
    function makeCoinGlowSprite(scale, op, col) {
      const sm = new T.SpriteMaterial({
        map: glowCoinTex, color: new T.Color(col[0], col[1], col[2]),
        blending: T.AdditiveBlending, transparent: true, opacity: op, depthWrite: false
      });
      const sp = new T.Sprite(sm);
      sp.scale.set(scale, scale, 1);
      sp.position.set(0, COIN_Y, AZ);
      scene.add(sp);
      return sp;
    }
    const coinGlowInner = makeCoinGlowSprite(3.0,  0.70, [1, 0.9, 0.3]);
    const coinGlowOuter = makeCoinGlowSprite(7.0,  0.28, [1, 0.6, 0.1]);
    const coinGlowHaze  = makeCoinGlowSprite(14.0, 0.12, [1, 0.4, 0.0]);

    /* ── Hieroglyph 𓂀 on back wall ──────────────────────────── */
    const hc = document.createElement('canvas'); hc.width = hc.height = 512;
    const hx = hc.getContext('2d');
    hx.font = '400px serif'; hx.textAlign = 'center'; hx.textBaseline = 'middle';
    hx.fillStyle = 'rgba(210,165,55,0.6)'; hx.fillText('𓂀', 256, 256);
    const hierMesh = new T.Mesh(
      new T.PlaneGeometry(3.8, 3.8),
      new T.MeshBasicMaterial({ map: new T.CanvasTexture(hc), transparent: true, blending: T.AdditiveBlending, depthWrite: false })
    );
    hierMesh.position.set(0, FY + RH * 0.60, -RD + 10.06);
    scene.add(hierMesh);

    /* ── Scene lighting ──────────────────────────────────────── */
    scene.add(new T.AmbientLight(0x0e0806, 0.85));
    scene.add(new T.HemisphereLight(0x1c0e06, 0x000000, 0.22));

    /* ── Ambient dust ────────────────────────────────────────── */
    const dust = AmbientDust(scene, 260);

    /* ── Praise / coin click ─────────────────────────────────── */
    let praiseN = 0;
    try { praiseN = parseInt(localStorage.getItem('kek_praises') || '0', 10); } catch (_) {}
    function syncPraise() {
      ['praiseCount', 'sh-praises'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.textContent = praiseN.toLocaleString();
      });
    }
    syncPraise();

    const raycaster = new T.Raycaster();
    const mouse     = new T.Vector2();
    window.addEventListener('click', function (e) {
      if (e.target.closest && (e.target.closest('.sanctum-hud') || e.target.closest('.s-overlay'))) return;
      mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.intersectObject(coin, false).length > 0) {
        praiseN++;
        try { localStorage.setItem('kek_praises', praiseN); } catch (_) {}
        syncPraise();
        coinLight.intensity = 28;
        coinGlowInner.material.opacity = 1.4;
        const f = document.createElement('div');
        f.className = 'sh-float'; f.textContent = '+1 𓂀';
        f.style.cssText = 'left:' + e.clientX + 'px;top:' + e.clientY + 'px';
        const hud = document.getElementById('sanctumHUD');
        if (hud) { hud.appendChild(f); setTimeout(function () { f.remove(); }, 900); }
      }
    });

    /* ── Camera controller ───────────────────────────────────── */
    let camTX = 0, camTY = 0, camCX = 0, camCY = 0;
    window.addEventListener('mousemove', function (e) {
      camTX = (e.clientX / window.innerWidth  - 0.5) * 0.22;
      camTY = (e.clientY / window.innerHeight - 0.5) * -0.12;
    });
    window.addEventListener('touchmove', function (e) {
      const t = e.touches[0];
      camTX = (t.clientX / window.innerWidth  - 0.5) * 0.14;
      camTY = (t.clientY / window.innerHeight - 0.5) * -0.08;
    }, { passive: true });

    /* ── Resize ──────────────────────────────────────────────── */
    window.addEventListener('resize', function () {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    /* ── Animation loop ──────────────────────────────────────── */
    const clock = new T.Clock();
    let prevT = 0;

    function animate() {
      requestAnimationFrame(animate);
      const t  = clock.getElapsedTime();
      const dt = Math.min(t - prevT, 0.05);
      prevT = t;

      /* Torch lights flicker */
      torchLights.forEach(function (tl) {
        const f = Math.sin(t * 2.8  + tl.seed) * 0.15
                + Math.sin(t * 7.5  + tl.seed * 2) * 0.08
                + Math.sin(t * 16.2 + tl.seed) * 0.04
                + (Math.random() - 0.5) * 0.07;
        tl.light.intensity = tl.base * (1 + f);
        const w = 0.96 + Math.random() * 0.08;
        tl.light.color.setRGB(1, 0.43 * w, 0.08 * w);
      });

      /* Torch glow flicker */
      torchGlows.forEach(function (tg) {
        const f = Math.sin(t * 3.1 + tg.seed) * 0.12 + (Math.random() - 0.5) * 0.07;
        tg.sprite.material.opacity = tg.basOp * (1 + f);
      });

      /* Coin burst decay */
      if (coinLight.intensity > 8) {
        coinLight.intensity = Math.max(8, coinLight.intensity - 55 * dt);
        coinGlowInner.material.opacity = Math.max(0.70, coinGlowInner.material.opacity - 3 * dt);
      }

      /* Coin spin + levitate */
      coin.rotation.z = -t * 0.52;
      const lev = Math.sin(t * 0.70) * 0.17;
      coin.position.y    = COIN_Y + lev;
      coinLight.position.y    = coin.position.y;
      coinGlowInner.position.y = coin.position.y;
      coinGlowOuter.position.y = coin.position.y;
      coinGlowHaze.position.y  = coin.position.y;

      /* Coin glow breathe */
      const breatheCoin = 1 + Math.sin(t * 0.8) * 0.12;
      coinGlowOuter.material.opacity = 0.28 * breatheCoin;
      coinGlowHaze.material.opacity  = 0.12 * breatheCoin;

      /* God ray pulse */
      rayMesh.material.opacity = 0.030 + Math.sin(t * 0.38) * 0.014;

      /* Camera drift */
      const ease = 0.042;
      camCX += (camTX - camCX) * ease;
      camCY += (camTY - camCY) * ease;
      camera.position.y = 0.2 + Math.sin(t * 0.46) * 0.013;
      camera.rotation.set(camCY, camCX, 0, 'YXZ');

      /* Particles */
      torchFires.forEach(function (f) { f.update(dt); });
      dust.update();

      renderer.render(scene, camera);
    }

    animate();
    console.log('[Sanctum] Three.js scene running — ' + renderer.info.programs.length + ' shader programs');
  };

})();
