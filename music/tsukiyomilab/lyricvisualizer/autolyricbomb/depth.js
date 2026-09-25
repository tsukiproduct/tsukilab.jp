/* 奥行きのあるテンプレート。歌詞が手前から奥へ流れる（遠近スクロール）、ワイヤーフレームの中を奥へ進む（トンネル）。
   These templates draw every visible lyric themselves, so several lines can share the depth at once. */
(() => {
  'use strict';
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const expoOut = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const beatAt = t => window.tsukiBeatAt?.(t) || 0;
  function font(size) { return `${fontWeight()} ${size}px ${FONTS[S.fontKey] || FONTS.gothic}`; }
  function fitSize(g, text, size, maxW) {
    g.font = font(size); const w = g.measureText(text).width;
    if (w > maxW) { size *= maxW / w; g.font = font(size); }
    return size;
  }
  // Fractional index of the lyric being sung: 2.5 = halfway from line 2 to line 3.
  function scrollIndex(lines, t) {
    let i = -1; for (let k = 0; k < lines.length; k++) if (lines[k].t <= t) i = k;
    if (i < 0) return -1 + clamp01(1 - (lines[0].t - t) / 1.2);
    const next = lines[i + 1]?.t ?? lines[i].t + 4;
    return i + clamp01((t - lines[i].t) / Math.max(.4, next - lines[i].t));
  }

  /* ---- 遠近スクロール ---- */
  const crawl = {
    backdrop(g, now) {
      const c = g.createLinearGradient(0, 0, 0, H); c.addColorStop(0, '#02030a'); c.addColorStop(.35, '#0b1030'); c.addColorStop(1, '#141a3a');
      g.fillStyle = c; g.fillRect(0, 0, W, H);
      const glow = g.createRadialGradient(W / 2, H * .2, 0, W / 2, H * .2, W * .5); glow.addColorStop(0, 'rgba(120,170,255,.22)'); glow.addColorStop(1, 'rgba(120,170,255,0)');
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
      // Dust drifting toward the viewer gives the plane its depth.
      for (let i = 0; i < 70; i++) {
        const seed = Math.sin(i * 127.1) * 43758.5, r = seed - Math.floor(seed), z = 1 - ((now * .06 + r * 7.3) % 1);
        const s = 1 / (z * 4 + .15), x = W / 2 + (r - .5) * W * 1.6 * s * .35, y = H * .2 + ((i * .37) % 1 - .1) * H * s * .5;
        g.fillStyle = `rgba(200,220,255,${.5 * (1 - z)})`; g.fillRect(x, y, 1.5 * s * .4 + .5, 1.5 * s * .4 + .5);
      }
    },
    decor() {},
    lyrics(lines, t) {
      const g = ctx, pos = scrollIndex(lines, t), gap = .42, horizon = H * .16, front = H * .9;
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let i = lines.length - 1; i >= 0; i--) {
        const z = (pos - i) * gap;
        if (z < -gap * 1.2 || z > 7) continue;
        const s = 1 / (1 + z * 1.15), y = horizon + (front - horizon) * s;
        const current = pos >= i && pos < i + 1;
        const alpha = clamp01((z + gap * 1.2) / (gap * .9)) * clamp01((s - .12) / .2);
        const size = fitSize(g, lines[i].text, H * .085, W * .86);
        g.save(); g.translate(W / 2, y); g.scale(s, s * (.42 + .5 * s)); // tilted plane: rows flatten with distance
        g.globalAlpha = alpha; g.font = font(size);
        if (current) { g.shadowColor = S.accent; g.shadowBlur = 24; g.fillStyle = S.accent; }
        else g.fillStyle = '#e6ecff';
        g.fillText(lines[i].text, 0, 0); g.restore();
      }
      g.restore();
      return true;
    }
  };

  /* ---- ワイヤーフレームのトンネル ---- */
  const vp = () => ({ x: W / 2, y: H * .46 });
  const tunnel = {
    backdrop(g) { const c = g.createRadialGradient(W / 2, H * .46, 0, W / 2, H * .46, W * .7); c.addColorStop(0, '#1a0830'); c.addColorStop(1, '#030108'); g.fillStyle = c; g.fillRect(0, 0, W, H); },
    decor(g, now, energy) {
      const t = player.src ? player.currentTime || 0 : now, b = Math.max(beatAt(t), energy * .6), v = vp();
      const cam = t * 2.2, f = H * .55;
      g.save(); g.lineWidth = 1.5;
      // Floor and ceiling grids: rows come toward the camera, columns converge on the vanishing point.
      for (const [side, color] of [[1, '255,63,208'], [-1, '79,243,255']]) {
        for (let k = 0; k < 26; k++) {
          const z = k + 1 - (cam % 1); if (z < .35) continue;
          const y = v.y + side * f * .5 / z; g.strokeStyle = `rgba(${color},${Math.min(.8, 1.6 / z) * (.5 + b * .5)})`;
          g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
        }
        g.strokeStyle = `rgba(${color},${.35 + b * .35})`;
        for (let x = -12; x <= 12; x++) { g.beginPath(); g.moveTo(v.x + f * x * .5 / .35, v.y + side * f * .5 / .35); g.lineTo(v.x, v.y); g.stroke(); }
      }
      // Frames of the tunnel rush past; strong beats light them up.
      for (let k = 0; k < 8; k++) {
        const z = (k * 3 + 3 - (cam % 3)); if (z < .6) continue;
        const hw = f * 1.25 / z, hh = f * .5 / z;
        g.strokeStyle = `rgba(255,255,255,${Math.min(.7, 1.2 / z) * (.35 + b * .65)})`; g.lineWidth = 1 + 3 / z;
        g.strokeRect(v.x - hw, v.y - hh, hw * 2, hh * 2);
      }
      g.restore();
    },
    lyrics(lines, t) {
      const g = ctx, v = vp();
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let i = lines.length - 1; i >= 0; i--) {
        const a = t - lines[i].t; if (a < -.2) continue;
        // A line drifts slowly while it is sung, then flies into the depth once the next line starts.
        const next = lines[i + 1] ? t - lines[i + 1].t : -1;
        const d = Math.max(0, a) * .16 + (next > 0 ? next * next * 1.4 + next * 1.1 : 0);
        const s = 1 / (1 + d); if (s < .06) continue;
        const frontY = H * .7, y = v.y + (frontY - v.y) * s;
        const alpha = clamp01((a + .2) / .25) * clamp01((s - .06) / .14);
        const size = fitSize(g, lines[i].text, H * .1, W * .8);
        const pop = 1 + (1 - expoOut(clamp01(a / .3))) * .35 + beatAt(t) * .04 * (next > 0 ? 0 : 1);
        g.save(); g.translate(v.x, y); g.scale(s * pop, s * pop); g.globalAlpha = alpha; g.font = font(size);
        g.shadowColor = next > 0 ? 'rgba(79,243,255,.8)' : S.accent; g.shadowBlur = 20;
        g.fillStyle = next > 0 ? '#bdf8ff' : '#ffffff'; g.fillText(lines[i].text, 0, 0); g.restore();
      }
      g.restore();
      return true;
    }
  };

  const modes = { crawl, tunnel };
  const register = () => { if (window.tsukiScene) Object.assign(window.tsukiScene, modes); };
  register();
  window.tsukiDepthLyrics = (lines, t) => { const m = modes[S.templateId]; return m && lines.length ? m.lyrics(lines, t) : false; };
})();
