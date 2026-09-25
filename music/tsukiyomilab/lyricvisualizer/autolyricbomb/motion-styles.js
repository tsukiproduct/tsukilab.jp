/* 月詠ラボ独自のリリックモーション。原則は ART-DIRECTION.md「かっこいい・かわいい・芸術的」を参照。
   Each motion draws one horizontal line around the origin already translated to the line centre. */
(() => {
  'use strict';
  const expoOut = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const backOut = t => { const c = 1.9, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const backIn = t => 2.9 * t * t * t - 1.9 * t * t;
  const bounceOut = t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  };
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const LIGHT = '#f3efe7';
  let INK = LIGHT;

  // Letter positions with optional extra spacing, centred on 0.
  function layoutChars(g, chars, spacing = 0) {
    const widths = chars.map(ch => g.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
    let x = -total / 2;
    return chars.map((ch, i) => { const at = x; x += widths[i] + spacing; return { ch, x: at, w: widths[i] }; });
  }
  // Short lines get faster entrances so the words settle and stay readable (at least ~0.5 s still).
  const pace = p => Math.min(1, Math.max(.45, (p.duration || 3) / 2.6));

  // Sticker look for cute styles: a thick rounded accent outline behind light letters.
  function sticker(g, ch, x, y, base, accent) {
    g.lineJoin = 'round'; g.lineWidth = base * .16; g.strokeStyle = accent; g.strokeText(ch, x, y);
    g.fillStyle = '#fffafc'; g.fillText(ch, x, y);
  }
  function star(g, x, y, r) {
    g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .32 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  }

  const motions = {
    /* ---- かっこいい: 速い入り、静止して読ませる、スナップで抜ける ---- */
    // Letters rise from behind an invisible baseline (mask reveal) and leave upward.
    mask({ g, chars, base, p, accent, tw }) {
      const k = pace(p), out = 1 - clamp01(p.remain / Math.min(.35, p.outDur + .1));
      g.save(); g.beginPath(); g.rect(-tw / 2 - base, -base * .78, tw + base * 2, base * 1.5); g.clip();
      g.fillStyle = INK;
      for (const [i, c] of layoutChars(g, chars).entries()) {
        const q = expoOut(clamp01((p.elapsed - i * .028 * k) / (.42 * k)));
        g.fillText(c.ch, c.x, (1 - q) * base * 1.2 - expoOut(out) * base * 1.3);
      }
      g.restore();
      const line = expoOut(clamp01(p.elapsed / (.5 * k))) * (1 - out);
      g.fillStyle = accent; g.fillRect(-tw / 2, base * .8, tw * line, Math.max(2, base * .05));
    },
    // Wide tracking tightens into the word; an outlined ghost keeps the wide spacing.
    track({ g, chars, base, p, accent }) {
      const k = pace(p), q = expoOut(clamp01(p.elapsed / (.8 * k)));
      const spread = (1 - q) * base * .9 + (p.beat || 0) * base * .04;
      const alpha = clamp01(p.elapsed / (.25 * k)) * clamp01(p.remain / p.outDur);
      g.globalAlpha = alpha * .28; g.strokeStyle = accent; g.lineWidth = Math.max(1, base * .03);
      for (const c of layoutChars(g, chars, base * .55)) g.strokeText(c.ch, c.x, 0);
      g.globalAlpha = alpha; g.fillStyle = INK;
      for (const c of layoutChars(g, chars, spread)) g.fillText(c.ch, c.x, 0);
    },
    // Hard cut-in on the downbeat: a white flash, oversized frame, short shake, then stillness.
    impact({ g, chars, base, p, accent, tw }) {
      const e = p.elapsed;
      if (p.remain < p.outDur * .45) return; // snap out instead of fading
      if (e < .09) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(255,255,255,${.3 * (1 - e / .09)})`; g.fillRect(0, 0, W, H); g.restore(); }
      const s = 1 + .38 * (1 - expoOut(clamp01(e / .16))) + (p.beat || 0) * .05;
      const shake = e < .22 ? (1 - e / .22) * base * .12 : 0;
      g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); g.scale(s, s);
      const off = base * .07;
      g.fillStyle = accent; g.fillText(chars.join(''), -tw / 2 + off, off);
      g.fillStyle = INK; g.fillText(chars.join(''), -tw / 2, 0);
    },
    // A giant outlined copy drifts behind the readable filled line (layered type).
    outline({ g, chars, base, p, accent, tw }) {
      const k = pace(p), q = expoOut(clamp01(p.elapsed / (.6 * k))), alpha = clamp01(p.remain / p.outDur);
      g.save(); g.scale(1.9, 1.9); g.globalAlpha = .2 * alpha; g.strokeStyle = accent; g.lineWidth = Math.max(1, base * .025);
      g.strokeText(chars.join(''), -tw / 2 + p.elapsed * base * .12 - base * .2, 0); g.restore();
      g.globalAlpha = q * alpha; g.fillStyle = INK; g.fillText(chars.join(''), -tw / 2 - (1 - q) * base * .45, 0);
    },

    /* ---- かわいい: オーバーシュート、体積を保つ伸び縮み、ステッカー質感、きらめき ---- */
    // Each letter drops, lands with squash and stretch (area kept: sx * sy = 1) and bobs on beats.
    bounce({ g, chars, base, p, accent, idx }) {
      const k = pace(p), out = clamp01(1 - p.remain / p.outDur);
      for (const [i, c] of layoutChars(g, chars, base * .04).entries()) {
        const q = clamp01((p.elapsed - i * .055 * k) / (.6 * k));
        if (q <= 0) continue;
        const wobble = Math.exp(-5 * q) * Math.sin(q * 20) * .28;
        const sy = 1 - wobble, sx = 1 / sy;
        const y = -(1 - bounceOut(q)) * base * 1.3 - (p.beat || 0) * base * .09 * ((i + idx) % 2 ? 1 : .55);
        const shrink = 1 - backIn(out);
        g.save(); g.translate(c.x + c.w / 2, y + base * .42); g.scale(sx * shrink, sy * shrink);
        sticker(g, c.ch, -c.w / 2, -base * .42, base, accent); g.restore();
      }
    },
    // Letters pop open with overshoot and a playful tilt; small stars twinkle with the beat.
    sparkle({ g, chars, base, p, accent, idx, now }) {
      const k = pace(p), out = clamp01(1 - p.remain / p.outDur), placed = layoutChars(g, chars, base * .05);
      for (const [i, c] of placed.entries()) {
        const q = clamp01((p.elapsed - i * .045 * k) / (.42 * k));
        if (q <= 0) continue;
        const s = Math.max(0, backOut(q)) * (1 - backIn(out)), r = (1 - q) * (i % 2 ? -.7 : .7) + Math.sin(now * 2 + i) * .04;
        g.save(); g.translate(c.x + c.w / 2, 0); g.rotate(r); g.scale(s, s);
        sticker(g, c.ch, -c.w / 2, 0, base, accent); g.restore();
      }
      const width = placed.length ? placed.at(-1).x + placed.at(-1).w - placed[0].x : 0;
      g.fillStyle = accent;
      for (let i = 0; i < 6; i++) {
        const seed = Math.sin((idx + 1) * 91.7 + i * 17.3) * 43758.5, r = seed - Math.floor(seed);
        const tw = .5 + .5 * Math.sin(now * 5 + i * 1.7);
        g.globalAlpha = clamp01(p.elapsed * 3 - i * .15) * (1 - out) * (.35 + tw * .65);
        star(g, (r - .5) * (width + base * 1.6), (i % 2 ? -1 : 1) * base * (.75 + r * .35), base * (.1 + tw * .08 + (p.beat || 0) * .08));
      }
    },

    /* ---- 芸術的: 余白、ゆっくりした焦点移動、散って消える ---- */
    // Out-of-focus words come into focus with airy spacing; they blur away on exit.
    focus({ g, chars, base, p, accent }) {
      const k = pace(p), q = clamp01(p.elapsed / (1.3 * k)), out = clamp01(1 - p.remain / Math.max(.3, p.outDur));
      const blur = (1 - expoOut(q)) * 14 + out * 10;
      try { g.filter = blur > .3 ? `blur(${blur.toFixed(1)}px)` : 'none'; } catch (e) {}
      g.globalAlpha = expoOut(q) * (1 - out); g.scale(1.05 - .05 * expoOut(q), 1.05 - .05 * expoOut(q));
      g.fillStyle = INK === LIGHT ? '#efe9dc' : INK;
      const placed = layoutChars(g, chars, base * .22);
      for (const c of placed) g.fillText(c.ch, c.x, 0);
      try { g.filter = 'none'; } catch (e) {}
      g.fillStyle = accent; g.fillRect(placed[0].x - base * .5, -base * .35, Math.max(1.5, base * .03), base * .7);
    },
    // Letters settle slowly, then scatter like ash while the line fades.
    disperse({ g, chars, base, p, idx }) {
      const k = pace(p), window = Math.min(1.1, Math.max(.35, (p.duration || 2) * .35));
      const out = clamp01(1 - p.remain / window);
      g.fillStyle = INK === LIGHT ? '#efe9dc' : INK;
      for (const [i, c] of layoutChars(g, chars, base * .08).entries()) {
        const q = expoOut(clamp01((p.elapsed - i * .07 * k) / (.9 * k)));
        const seed = Math.sin((idx + 3) * 12.9898 + i * 78.233) * 43758.5453, r = seed - Math.floor(seed), r2 = (r * 7.31) % 1;
        const o = Math.pow(out, 1.4);
        g.save(); g.globalAlpha = q * (1 - out);
        g.translate(c.x + c.w / 2 + (r - .5) * base * 2.4 * o, (1 - q) * base * .25 - r2 * base * 1.6 * o); g.rotate((r2 - .5) * 1.4 * o);
        g.fillText(c.ch, -c.w / 2, 0); g.restore();
      }
    }
  };

  // Mood mixes pick a motion per line: strong moments get the boldest move, the rest vary.
  const pools = {
    coolMix: { strong: ['impact'], rest: ['mask', 'track', 'outline', 'mask'] },
    cuteMix: { strong: ['sparkle'], rest: ['bounce', 'sparkle', 'bounce'] },
    artMix: { strong: ['focus'], rest: ['focus', 'disperse', 'drift', 'echo'] }
  };
  function resolve(anim, line, rng) {
    const pool = pools[anim];
    if (!pool) return anim;
    const strong = line.section === 'chorus' || (line.size || 1) >= 1.3;
    const list = strong ? pool.strong : pool.rest;
    return list[Math.floor(rng() * list.length)];
  }

  window.tsukiStyledMotion = (name, args) => { const fn = motions[name]; if (!fn) return false; INK = args.ink || LIGHT; fn(args); return true; };
  window.tsukiResolveMotion = resolve;
  window.tsukiStyledMotionNames = Object.keys(motions);
})();
