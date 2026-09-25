/* テンプレートの「場面」。サムネと同じ配色・構図を実際の映像で描き、飾りは歌詞の行と拍に合わせて動かす。
   backdrop: background when no image/video is loaded. decor: drawn behind the lyric, following its box. */
(() => {
  'use strict';
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const expoOut = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const backOut = t => { const c = 1.7, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const beatNow = () => window.tsukiBeatAt?.(player.currentTime || 0) || 0;
  // The lyric drawn in the previous frame (drawLine records it); stale boxes mean no lyric on screen.
  const lyric = () => { const b = window.tsukiLyricBox; return b && performance.now() - b.stamp < 150 ? b : null; };
  const enter = (L, d) => L ? clamp01(L.elapsed / d) : 0;
  const leave = (L, d = .3) => L ? clamp01(L.remain / d) : 0;
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function paperNoise(g, color, seed, count = 90) {
    const r = rng(seed); g.fillStyle = color;
    for (let i = 0; i < count; i++) g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 2);
  }
  // Draw fn(g) in the lyric's own frame (centre, rotation).
  function atLyric(g, L, fn) { g.save(); g.translate(L.cx, L.cy); g.rotate(L.rot || 0); fn(g); g.restore(); }

  const scenes = {
    /* セルポップ：ピンクの斜めストライプ、黄色い太陽。行が出るたび太陽が弾み、文字の周りに POP の放射。 */
    cel: {
      ink: '#1b1830',
      backdrop(g, now) {
        g.fillStyle = '#ffb5c3'; g.fillRect(0, 0, W, H);
        g.save(); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 7;
        const off = (now * 24) % 44;
        for (let x = -H; x < W + H; x += 44) { g.beginPath(); g.moveTo(x + off, 0); g.lineTo(x + off - H * .7, H); g.stroke(); }
        g.restore();
      },
      decor(g, now) {
        const L = lyric(), b = beatNow(), pop = L ? backOut(clamp01(L.elapsed / .45)) : 1;
        g.save(); g.fillStyle = '#ffed62';
        g.beginPath(); g.arc(W * .83, H * .2, H * .16 * (.86 + .14 * pop) * (1 + b * .07), 0, Math.PI * 2); g.fill(); g.restore();
        if (L && L.elapsed < .5 && !L.vertical) atLyric(g, L, x => {
          const q = expoOut(L.elapsed / .5); x.strokeStyle = `rgba(27,24,48,${.8 * (1 - q)})`; x.lineWidth = 5; x.lineCap = 'round';
          for (let i = 0; i < 10; i++) {
            const a = i * Math.PI / 5 + L.idx, r1 = L.w * .5 + L.h * (.2 + q * .5), r2 = r1 + L.h * .35;
            x.beginPath(); x.moveTo(Math.cos(a) * r1, Math.sin(a) * r1 * .55); x.lineTo(Math.cos(a) * r2, Math.sin(a) * r2 * .55); x.stroke();
          }
        });
      }
    },
    /* 紙コラージュ：クリーム紙、黒い斜め帯、文字の下に赤い紙片。紙片は行ごとに貼られ、帯は横切る。 */
    collage: {
      ink: '#fff8ec',
      backdrop(g) { g.fillStyle = '#f2e6c4'; g.fillRect(0, 0, W, H); paperNoise(g, 'rgba(90,70,40,.10)', 7, 140); },
      decor(g) {
        const L = lyric(), b = beatNow();
        const k = L ? L.idx : 0, dir = k % 2 ? -1 : 1, sweep = L ? expoOut(clamp01(L.elapsed / .45)) : 1;
        g.save(); g.translate(W / 2 + dir * (1 - sweep) * W * 1.2, H / 2); g.rotate(dir * .78 + (k % 3) * .06);
        g.fillStyle = '#171923'; g.fillRect(-W, -H * (.09 + b * .01), W * 2, H * (.18 + b * .02)); g.restore();
        if (!L || L.vertical) return;
        const slap = clamp01(L.elapsed / .16), out = leave(L, .22);
        atLyric(g, L, x => {
          x.rotate((k % 2 ? .06 : -.05)); const s = (1.25 - .25 * expoOut(slap)) * (.6 + .4 * out);
          x.scale(s, s); x.globalAlpha = Math.min(1, slap * 2) * out;
          x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(-L.w / 2 - L.h * .38 + 6, -L.h * .62 + 7, L.w + L.h * .76, L.h * 1.24);
          x.fillStyle = '#ef5a4b'; x.fillRect(-L.w / 2 - L.h * .38, -L.h * .62, L.w + L.h * .76, L.h * 1.24);
          x.fillStyle = 'rgba(242,230,196,.72)'; x.rotate(-.5); x.fillRect(-L.w / 2 - L.h * .1, -L.h * .2 - L.w * .28, L.h * .9, L.h * .3);
        });
      }
    },
    /* 硬質デジタル：紺地に流れる走査線。行の頭でシアンとマゼンタのズレ帯、文字を囲む照準。 */
    digital: {
      backdrop(g, now) {
        g.fillStyle = '#081527'; g.fillRect(0, 0, W, H);
        const off = (now * 40) % 8; g.fillStyle = 'rgba(113,237,202,.10)';
        for (let y = off; y < H; y += 8) g.fillRect(0, y, W, 1.5);
        const c = g.createLinearGradient(W * .45, H * .45, W, H); c.addColorStop(0, 'rgba(236,81,120,0)'); c.addColorStop(1, 'rgba(236,81,120,.32)');
        g.fillStyle = c; g.fillRect(0, 0, W, H);
      },
      decor(g, now) {
        const L = lyric(); if (!L) return;
        const burst = 1 - clamp01(L.elapsed / .3), r = rng(L.idx * 31 + Math.floor(now * 20));
        if (burst > 0) for (let i = 0; i < 5; i++) {
          g.fillStyle = i % 2 ? `rgba(52,217,219,${.5 * burst})` : `rgba(238,80,129,${.5 * burst})`;
          g.fillRect((r() - .3) * W, L.cy + (r() - .5) * L.h * 3, W * (.2 + r() * .5), 3 + r() * 10);
        }
        const q = expoOut(clamp01(L.elapsed / .35)), pad = L.h * (1.4 - .9 * q), w = L.w / 2 + pad, h = L.h / 2 + pad * .45, s = L.h * .3;
        g.save(); g.translate(L.cx, L.cy); g.strokeStyle = `rgba(113,237,202,${.75 * leave(L)})`; g.lineWidth = 2;
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(sx * w, sy * h + -sy * s); g.lineTo(sx * w, sy * h); g.lineTo(sx * w - sx * s, sy * h); g.stroke(); }
        g.font = '13px monospace'; g.fillStyle = 'rgba(185,246,230,.7)'; g.fillText('LN_' + String(L.idx + 1).padStart(3, '0'), -w, -h - 8); g.restore();
      }
    },
    /* シネマティック：夜の青い階調、横切る光漏れ。上下の黒帯は曲の始まりで閉じる。 */
    cinema: {
      backdrop(g, now) {
        const c = g.createLinearGradient(0, 0, 0, H); c.addColorStop(0, '#2d3045'); c.addColorStop(1, '#12111c'); g.fillStyle = c; g.fillRect(0, 0, W, H);
        const x = W * (.5 + Math.sin(now * .09) * .45), leak = g.createRadialGradient(x, H * .35, 0, x, H * .35, H * .9);
        leak.addColorStop(0, 'rgba(243,189,139,.16)'); leak.addColorStop(1, 'rgba(243,189,139,0)'); g.fillStyle = leak; g.fillRect(0, 0, W, H);
      },
      decor(g, now) {
        const L = lyric(), bar = H * .09;
        g.save(); g.fillStyle = '#07070b'; g.fillRect(0, 0, W, bar); g.fillRect(0, H - bar, W, bar);
        g.font = '15px monospace'; g.fillStyle = 'rgba(243,189,139,.85)';
        g.fillText('SCENE ' + String((L ? L.idx : 0) + 1).padStart(2, '0'), W * .06, bar + 34);
        if (L && !L.vertical) { const q = expoOut(clamp01(L.elapsed / .9)); g.fillStyle = `rgba(243,189,139,${.6 * leave(L, .5)})`; g.fillRect(L.cx - L.w * .5 * q, L.cy + L.h * .62, L.w * q, 1.5); }
        g.restore();
      }
    },
    /* 手書きノート：罫線のクリーム紙。行が変わると紙が一段送られ、鉛筆の下線が書かれていく。 */
    note: {
      ink: '#344455',
      backdrop(g) {
        g.fillStyle = '#eee4d1'; g.fillRect(0, 0, W, H);
        const L = lyric(), step = 52, shift = L ? (L.idx * step + step * (1 - expoOut(clamp01(L.elapsed / .5)))) % step : 0;
        g.strokeStyle = 'rgba(145,174,196,.45)'; g.lineWidth = 2;
        for (let y = step - shift; y < H + step; y += step) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        g.strokeStyle = 'rgba(214,106,94,.55)'; g.beginPath(); g.moveTo(W * .09, 0); g.lineTo(W * .09, H); g.stroke();
        paperNoise(g, 'rgba(80,70,50,.08)', 11, 80);
      },
      decor(g) {
        const L = lyric(); if (!L || L.vertical) return;
        const q = clamp01(L.elapsed / Math.max(.4, (L.duration || 2) * .55));
        atLyric(g, L, x => {
          x.strokeStyle = `rgba(255,138,61,${.85 * leave(L, .4)})`; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath();
          for (let i = 0; i <= 40 * q; i++) { const t = i / 40, px = -L.w / 2 + L.w * t, py = L.h * .62 + Math.sin(t * 19 + L.idx) * 2.2; i ? x.lineTo(px, py) : x.moveTo(px, py); }
          x.stroke();
          if (q >= 1) { x.fillStyle = `rgba(255,138,61,${.8 * leave(L, .4)})`; x.font = `${L.h * .5}px sans-serif`; x.fillText(L.idx % 2 ? '☆' : '♡', L.w / 2 + L.h * .25, -L.h * .2); }
        });
      }
    },
    /* ミニマル：明るい灰色の余白。細い線が行の長さまで伸び、点が行の進み具合を示す。 */
    minimal: {
      ink: '#1d2623',
      backdrop(g) { g.fillStyle = '#d8d9d2'; g.fillRect(0, 0, W, H); paperNoise(g, 'rgba(29,38,35,.05)', 5, 60); },
      decor(g) {
        const L = lyric(), total = S.lines.length || 6;
        g.save(); g.font = '15px monospace'; g.fillStyle = 'rgba(29,38,35,.7)';
        g.fillText(String((L ? L.idx : 0) + 1).padStart(2, '0') + '—' + String(total).padStart(2, '0'), W * .07, H * .12);
        if (L && !L.vertical) {
          const q = expoOut(clamp01(L.elapsed / .7)), y = L.cy + L.h * .75, half = (L.w / 2 + 40) * q;
          g.strokeStyle = 'rgba(29,38,35,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(L.cx - half, y); g.lineTo(L.cx + half, y); g.stroke();
          const p = clamp01(L.elapsed / Math.max(.5, L.duration || 2));
          g.fillStyle = '#1d2623'; g.beginPath(); g.arc(L.cx - half + half * 2 * p, y, 3, 0, Math.PI * 2); g.fill();
        }
        g.restore();
      }
    },
    /* パンクジン：クリーム紙に赤い斜め帯。行ごとに帯が叩きつけられ、白い紙片に黒い文字。 */
    zine: {
      ink: '#161818',
      backdrop(g) {
        g.fillStyle = '#f4e8d1'; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(21,29,27,.07)'; for (let y = 0; y < H; y += 28) g.fillRect(0, y, W, 2);
        paperNoise(g, 'rgba(21,29,27,.12)', 3, 160);
      },
      decor(g) {
        const L = lyric(), b = beatNow(), k = L ? L.idx : 0, hit = L ? backOut(clamp01(L.elapsed / .28)) : 1;
        g.save(); g.translate(W * .5 - (1 - hit) * W, H * (k % 2 ? .38 : .62)); g.rotate(k % 2 ? .28 : -.28);
        g.fillStyle = '#e64b47'; g.fillRect(-W, -H * (.07 + b * .015), W * 2, H * (.14 + b * .03)); g.restore();
        if (!L || L.vertical) return;
        const slam = clamp01(L.elapsed / .14);
        atLyric(g, L, x => {
          x.rotate(k % 2 ? .05 : -.06); const s = 1.35 - .35 * expoOut(slam); x.scale(s, s); x.globalAlpha = Math.min(1, slam * 3) * leave(L, .2);
          x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-L.w / 2 - L.h * .3 + 8, -L.h * .6 + 8, L.w + L.h * .6, L.h * 1.2);
          x.fillStyle = '#f3ecdf'; x.fillRect(-L.w / 2 - L.h * .3, -L.h * .6, L.w + L.h * .6, L.h * 1.2);
        });
      }
    },
    /* ネオンクラブ：紫の闇、拍で脈打つネオンの環。行の頭で環が外へ広がる。 */
    club: {
      backdrop(g) { const c = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .7); c.addColorStop(0, '#2a1650'); c.addColorStop(1, '#0b0618'); g.fillStyle = c; g.fillRect(0, 0, W, H); },
      decor(g, now, energy) {
        const L = lyric(), pulse = beatNow() || energy, burst = L ? expoOut(clamp01(L.elapsed / .6)) : 1;
        g.save(); g.shadowColor = '#9d7bff'; g.shadowBlur = 18 + pulse * 36;
        for (let i = 0; i < 3; i++) {
          g.strokeStyle = i % 2 ? `rgba(92,225,255,${.35 + pulse * .5})` : `rgba(186,104,239,${.4 + pulse * .5})`; g.lineWidth = 3 + pulse * 6;
          const grow = 1 + (1 - burst) * (.6 - i * .15);
          g.beginPath(); g.ellipse(W / 2, H / 2, W * (.24 + i * .1) * (1 + pulse * .05) / grow, H * (.18 + i * .1) / grow, 0, 0, Math.PI * 2); g.stroke();
        }
        g.restore();
      }
    },
    /* 墨と余白：生成りの紙。行の頭で墨の円（円相）が一筆で描かれ、拍で墨が跳ねる。 */
    ink: {
      ink: '#212b30',
      backdrop(g) { g.fillStyle = '#efede5'; g.fillRect(0, 0, W, H); const c = g.createRadialGradient(W * .78, H * .6, 0, W * .78, H * .6, H * .5); c.addColorStop(0, 'rgba(35,49,58,.12)'); c.addColorStop(1, 'rgba(35,49,58,0)'); g.fillStyle = c; g.fillRect(0, 0, W, H); paperNoise(g, 'rgba(60,55,40,.07)', 9, 120); },
      decor(g) {
        const L = lyric(), q = L ? expoOut(clamp01(L.elapsed / .9)) : 1, k = L ? L.idx : 0, fade = L ? .35 + .65 * leave(L, .8) : .5;
        const cx = W * (k % 2 ? .26 : .74), cy = H * .55, r = H * .26, start = -Math.PI * .6 + k;
        g.save(); g.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          g.strokeStyle = `rgba(40,47,48,${(.55 - i * .1) * fade})`; g.lineWidth = 22 - i * 5;
          g.beginPath(); g.arc(cx + i * 1.5, cy - i, r + i * 2, start, start + Math.PI * 1.86 * q); g.stroke();
        }
        const b = beatNow(), rr = rng(k * 17 + 5);
        if (b > .3) { g.fillStyle = `rgba(33,43,48,${.5 * b})`; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(cx + (rr() - .5) * r * 2.6, cy + (rr() - .5) * r * 2.2, 2 + rr() * 6 * b, 0, Math.PI * 2); g.fill(); } }
        g.restore();
      }
    },
    /* サンライズ：夜の紺、朝焼けの珊瑚色、光の黄色の斜め三層。曲が進むほど朝が広がり、行の頭で光の帯が横切る。 */
    sunrise: {
      backdrop(g) {
        const dur = player.duration || 180, p = clamp01((player.currentTime || 0) / dur);
        const edge = .16 - p * .34; // the dawn spreads as the song plays
        g.save(); g.fillStyle = '#f9df9a'; g.fillRect(0, 0, W, H);
        g.translate(W / 2, H / 2); g.rotate(-.68);
        g.fillStyle = '#f68b6c'; g.fillRect(-W * 1.5, -H * 2, W * (1.5 + edge + .22), H * 4);
        g.fillStyle = '#0f2139'; g.fillRect(-W * 1.5, -H * 2, W * (1.5 + edge - .18), H * 4);
        g.restore();
      },
      decor(g) {
        const L = lyric(); if (!L) return;
        const q = clamp01(L.elapsed / .8); if (q >= 1) return;
        g.save(); g.translate(-W * .4 + W * 1.8 * expoOut(q), H / 2); g.rotate(-.68);
        const c = g.createLinearGradient(-90, 0, 90, 0); c.addColorStop(0, 'rgba(255,245,210,0)'); c.addColorStop(.5, `rgba(255,245,210,${.55 * (1 - q)})`); c.addColorStop(1, 'rgba(255,245,210,0)');
        g.fillStyle = c; g.fillRect(-90, -H * 2, 180, H * 4); g.restore();
      }
    },
    /* 右寄せ縦書き：青い夜の階調、文字の後ろに淡い光。縦の線が行の進み具合に合わせて伸びる。 */
    vertical: {
      backdrop(g) { const c = g.createLinearGradient(0, 0, W, H); c.addColorStop(0, '#111e2c'); c.addColorStop(1, '#273438'); g.fillStyle = c; g.fillRect(0, 0, W, H); },
      decor(g, now, energy) {
        const L = lyric(), glow = g.createRadialGradient(W * .78, H * .5, 0, W * .78, H * .5, H * .75);
        glow.addColorStop(0, `rgba(225,185,179,${.16 + energy * .08})`); glow.addColorStop(1, 'rgba(225,185,179,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
        if (!L) return;
        const p = clamp01(L.elapsed / Math.max(.6, L.duration || 2));
        g.strokeStyle = 'rgba(225,185,179,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(W * .9, H * .17); g.lineTo(W * .9, H * .17 + H * .65 * p); g.stroke();
      }
    }
  };

  window.tsukiScene = scenes;
  window.tsukiSceneBackdrop = (g, now) => { const s = scenes[S.templateId]; if (!s) return false; s.backdrop(g, now); return true; };
  window.tsukiSceneDecor = (now, energy) => { const s = scenes[S.templateId]; if (!s) return false; s.decor(ctx, now, energy); return true; };
  window.tsukiSceneInk = () => scenes[S.templateId]?.ink || null;
})();
