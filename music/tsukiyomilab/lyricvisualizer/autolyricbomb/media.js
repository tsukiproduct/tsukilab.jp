/* Background media pool: several images and videos shown in order, at random or cut on strong beats. */
(() => {
  'use strict';
  const MAX_IMAGES = 40, MAX_VIDEOS = 12, FADE = .45;
  const items = [];
  let mode = 'order', interval = 4, seed = 1, sequence = [], cuts = null, cutsKey = '';
  let blurCache = new Map(), blurFor = -1, songItem = null;

  const hash = n => { let t = (n * 2654435761 + seed * 40503) >>> 0; t ^= t >>> 15; t = Math.imul(t, 2246822519) >>> 0; t ^= t >>> 13; return t / 4294967296; };

  // Clip k shown after cut k. Random never shows the same item twice in a row.
  function itemAt(k) {
    const n = items.length;
    if (n < 2) return 0;
    if (mode === 'order') return k % n;
    while (sequence.length <= k) {
      const prev = sequence.length ? sequence[sequence.length - 1] : -1;
      const pick = Math.floor(hash(sequence.length) * (prev < 0 ? n : n - 1));
      sequence.push(prev < 0 ? pick : (prev + 1 + pick) % n);
    }
    return sequence[k];
  }

  // Beat mode: aim for one cut per interval (twice as often in loud sections), snapped to a strong beat.
  function beatCuts() {
    const rhythm = window.tsukiRhythm;
    const key = rhythm ? rhythm.beats.length + ':' + rhythm.duration + ':' + interval : '';
    if (key === cutsKey) return cuts;
    cutsKey = key; cuts = null;
    if (!rhythm || rhythm.beats.length < 4) return null;
    const list = [0];
    for (const beat of rhythm.beats) {
      const intensity = rhythm.sections?.[Math.floor(beat.t / 8)]?.intensity ?? .4;
      const gap = interval * (1.35 - intensity * .7);
      const last = list[list.length - 1];
      if (beat.t - last >= gap && beat.strength >= .35) list.push(beat.t);
      else if (beat.t - last >= gap * 1.8) list.push(beat.t);
    }
    return cuts = list;
  }

  function cutIndex(t) {
    if (mode === 'beat') {
      const list = beatCuts();
      if (list) {
        let lo = 0, hi = list.length;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (list[mid] <= t) lo = mid + 1; else hi = mid; }
        const k = Math.max(0, lo - 1);
        return { k, start: list[k] };
      }
    }
    const k = Math.max(0, Math.floor(t / interval));
    return { k, start: k * interval };
  }

  function blurred(item) {
    if (blurFor !== S.blur) { blurCache = new Map(); blurFor = S.blur; }
    let canvas = blurCache.get(item);
    if (!canvas || canvas.width !== W || canvas.height !== H) {
      canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
      const x = canvas.getContext('2d'), img = item.el;
      const s = Math.max(W / img.width, H / img.height), iw = img.width * s, ih = img.height * s;
      try { x.filter = S.blur > 0 ? `blur(${S.blur}px)` : 'none'; } catch (e) {}
      x.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
      blurCache.set(item, canvas);
    }
    return canvas;
  }

  function drawItem(g, item, x, y, w, h, alpha, blur) {
    if (!item || alpha <= 0) return;
    g.save(); g.globalAlpha *= alpha;
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    if (item.kind === 'image') {
      if (blur && x === 0 && y === 0 && w === W && h === H) g.drawImage(blurred(item), 0, 0);
      else { const img = item.el, s = Math.max(w / img.width, h / img.height); g.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s); }
    } else if (item.el.readyState >= 2) {
      const v = item.el, s = Math.max(w / v.videoWidth, h / v.videoHeight);
      try { g.filter = blur && S.blur > 0 ? `blur(${S.blur}px)` : 'none'; } catch (e) {}
      g.drawImage(v, x + (w - v.videoWidth * s) / 2, y + (h - v.videoHeight * s) / 2, v.videoWidth * s, v.videoHeight * s);
    }
    g.restore();
  }

  function clock() { return player.src ? player.currentTime || 0 : performance.now() / 1000; }
  function state(t = clock()) {
    if (!items.length) return null;
    const { k, start } = cutIndex(t);
    const current = items[itemAt(k)];
    const fade = mode === 'beat' ? 0 : Math.min(FADE, interval * .3);
    const into = t - start;
    const previous = k > 0 && into < fade ? items[itemAt(k - 1)] : null;
    return { current, previous, mix: previous ? into / fade : 1 };
  }

  // Only the visible videos play; the song's own video follows the song clock.
  function managePlayback(visible) {
    const running = !player.src || !player.paused;
    for (const item of items) {
      if (item.kind !== 'video') continue;
      const v = item.el;
      if (item === songItem) {
        if (Math.abs(v.currentTime - player.currentTime) > .3 && v.readyState >= 1) v.currentTime = player.currentTime;
      }
      const want = running && visible.includes(item);
      if (want && v.paused) v.play().catch(() => {});
      else if (!want && !v.paused) v.pause();
    }
  }

  function draw(g, x = 0, y = 0, w = W, h = H, blur = true) {
    const s = state();
    managePlayback(s ? [s.current, s.previous] : []);
    if (!s) return false;
    if (s.previous) drawItem(g, s.previous, x, y, w, h, 1, blur);
    drawItem(g, s.current, x, y, w, h, s.previous ? s.mix : 1, blur);
    return true;
  }

  function reset() { sequence = []; cutsKey = ''; seed = Math.floor(Math.random() * 99999) + 1; }
  function refreshUI() {
    const images = items.filter(i => i.kind === 'image').length, videos = items.length - images;
    $('imgDrop').classList.toggle('done', images > 0);
    $('vidDrop').classList.toggle('done', videos > 0);
    $('imgDrop').firstChild.textContent = images ? `✓ 背景画像 ${images} 枚（追加できます）` : '背景画像を追加（複数選択できます）';
    $('vidDrop').firstChild.textContent = videos ? `✓ 背景動画 ${videos} 本（追加できます）` : '背景動画を追加（複数選択できます）';
    $('mediaControls').hidden = items.length < 1;
    $('mediaSwitch').hidden = items.length < 2;
    $('videoSongBtn').hidden = !videos;
    $('mediaStatus').textContent = items.length
      ? items.map((item, i) => (i + 1) + '. ' + (item.kind === 'image' ? '🖼 ' : '🎞 ') + item.name + (item === songItem ? '（曲）' : '')).join('\n')
      : '';
  }
  function add(item) { items.push(item); reset(); refreshUI(); }

  $('imgIn').addEventListener('change', e => {
    const files = [...(e.target.files || [])];
    const room = MAX_IMAGES - items.filter(i => i.kind === 'image').length;
    for (const f of files.slice(0, Math.max(0, room))) {
      const img = new Image();
      img.onload = () => add({ kind: 'image', el: img, name: f.name.slice(0, 28) });
      img.src = URL.createObjectURL(f);
    }
    if (files.length > room) $('mediaNote').textContent = `画像は ${MAX_IMAGES} 枚までです。`;
    e.target.value = '';
  });
  $('vidIn').addEventListener('change', e => {
    const files = [...(e.target.files || [])];
    const room = MAX_VIDEOS - items.filter(i => i.kind === 'video').length;
    for (const f of files.slice(0, Math.max(0, room))) {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
      v.src = URL.createObjectURL(f);
      v.addEventListener('loadeddata', () => add({ kind: 'video', el: v, name: f.name.slice(0, 28), file: f }), { once: true });
      v.addEventListener('error', () => { $('mediaNote').textContent = f.name + ' はこのブラウザで再生できませんでした。'; }, { once: true });
      v.load();
    }
    if (files.length > room) $('mediaNote').textContent = `動画は ${MAX_VIDEOS} 本までです（端末のメモリ保護のため）。`;
    e.target.value = '';
  });
  $('mediaMode').addEventListener('change', e => { mode = e.target.value; reset(); updateModeNote(); });
  $('mediaInterval').addEventListener('input', e => {
    interval = Number(e.target.value) || 4; cutsKey = '';
    $('mediaIntervalLabel').textContent = '切り替えの間隔 — ' + interval + ' 秒' + (mode === 'beat' ? '前後（盛り上がりで短く）' : '');
  });
  function updateModeNote() {
    $('mediaInterval').dispatchEvent(new Event('input'));
    $('mediaNote').textContent = mode === 'beat'
      ? (window.tsukiRhythm?.beats?.length ? '強い拍で切り替えます。サビなど盛り上がる所ほど速く切り替わります。' : '曲の拍を解析すると、強い拍で切り替えます（それまでは一定間隔）。')
      : mode === 'random' ? '同じ素材が続かないように、ランダムに切り替えます。' : '追加した順に切り替えます。';
  }
  $('mediaClearBtn').addEventListener('click', () => {
    for (const item of items) { if (item.kind === 'video') item.el.pause(); if (item !== songItem) URL.revokeObjectURL(item.el.src); }
    items.length = 0; songItem = null; blurCache = new Map(); reset(); refreshUI();
    $('mediaNote').textContent = '背景素材をすべて外しました。';
  });
  // A lyric-free music video can supply the song itself: playback, beat analysis and lyric detection.
  $('videoSongBtn').addEventListener('click', () => {
    const video = [...items].reverse().find(i => i.kind === 'video');
    if (!video) return;
    try {
      const transfer = new DataTransfer(); transfer.items.add(video.file);
      const input = $('audIn'); input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) { $('mediaNote').textContent = 'このブラウザでは動画を曲として読み込めませんでした。音声ファイルを「曲」に入れてください。'; return; }
    if (songItem) songItem.el.loop = true;
    songItem = video; video.el.loop = false;
    if (mode !== 'order' || items.length > 1) $('mediaNote').textContent = '動画の音声を曲にしました。映像は曲の再生位置に合わせて動きます。歌詞の自動検出・拍解析にも使えます。';
    refreshUI();
  });
  $('audIn').addEventListener('change', e => {
    // Choosing a different song file releases the video's song role.
    if (songItem && e.target.files?.[0] !== songItem.file) { songItem.el.loop = true; songItem = null; refreshUI(); }
  });

  window.tsukiMedia = { draw, has: () => items.length > 0, options: () => ({ mode, interval }), restore(o) {
    if (!o) return;
    if (['order', 'random', 'beat'].includes(o.mode)) { mode = o.mode; $('mediaMode').value = mode; }
    if (Number.isFinite(o.interval)) { interval = Math.min(20, Math.max(1, o.interval)); $('mediaInterval').value = interval; }
    reset(); updateModeNote();
  } };
  refreshUI(); updateModeNote();
})();
