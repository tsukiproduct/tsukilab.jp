/* 残響 — サイトの動き
   保存先はすべて localStorage（キーは zk.*）。サーバーへは何も送らない。 */
(() => {
  'use strict';
  const doc = document, html = doc.documentElement, body = doc.body;
  const ROOT = body.dataset.root || './';
  const KIND = [...body.classList].find(c => c.startsWith('k-'))?.slice(2) || '';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------ 保存
  const S = {
    get(k, d) { try { const v = localStorage.getItem('zk.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('zk.' + k, JSON.stringify(v)); } catch (e) { /* 保存できない環境でも読める */ } },
    del(k) { try { localStorage.removeItem('zk.' + k); } catch (e) {} },
  };
  const read = () => S.get('read', {});
  const isRead = k => !!read()[k];
  const spoil = () => !!S.get('spoil', false);
  const open = k => isRead(k) || spoil();
  const stage = () => S.get('stage', 0);
  const today = () => { const d = new Date(); return `${d.getMonth() + 1}月${d.getDate()}日`; };
  const $ = (s, el = doc) => el.querySelector(s);
  const $$ = (s, el = doc) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const jsonData = id => { const el = doc.getElementById(id); try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } };

  function toast(msg, ms = 4200) {
    const t = $('.toast'); if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, ms);
  }

  // ------------------------------------------------------------ 閲覧日（貸出カード）
  function logVisit(page) {
    const v = S.get('visits', {}); const list = v[page] || []; const d = today();
    if (list[0] !== d) list.unshift(d);
    v[page] = list.slice(0, 12); S.set('visits', v);
  }
  const pageKey = { archive: 'archive/', timeline: 'timeline/', people: 'people/', notes: 'notes/', check: 'check/' }[KIND];
  if (pageKey) logVisit(pageKey);

  // ------------------------------------------------------------ ナビ
  $$('[data-nav]').forEach(a => {
    const n = a.dataset.nav;
    if ((n === 'home' && KIND === 'home') || (pageKey && n === pageKey) || (n === '' && KIND === 'book')) a.setAttribute('aria-current', 'page');
  });
  const menuBtn = $('[data-act="menu"]'), drawer = $('#drawer');
  menuBtn?.addEventListener('click', () => {
    const openNow = drawer.hidden; drawer.hidden = !openNow; menuBtn.setAttribute('aria-expanded', String(openNow));
  });

  // ------------------------------------------------------------ 時計（15:00 の一分間だけ、秒針が止まる）
  // トップの柱時計（線画）も同じ時刻で動かす
  const hc = $$('.hero-clock .hc-h, .hero-clock .hc-m, .hero-clock .hc-s');
  if (hc.length) {
    let lastS = 0;
    const tickH = () => {
      const d = new Date(), hh = d.getHours(), mm = d.getMinutes(), ss = d.getSeconds();
      if (!(hh === 15 && mm === 0)) lastS = ss;
      hc.forEach(el => {
        const deg = el.classList.contains('hc-h') ? (hh % 12) * 30 + mm * .5 : el.classList.contains('hc-m') ? mm * 6 + ss * .1 : lastS * 6;
        el.style.transform = `rotate(${deg}deg)`;
      });
    };
    tickH(); setInterval(tickH, 1000);
  }
  const clock = $('.clock svg');
  if (clock) {
    const h = $('.c-h', clock), m = $('.c-m', clock), s = $('.c-s', clock);
    let lastSec = 0;
    const tick = () => {
      const d = new Date();
      const hh = d.getHours(), mm = d.getMinutes(), ss = d.getSeconds();
      h.style.transform = `rotate(${(hh % 12) * 30 + mm * .5}deg)`;
      m.style.transform = `rotate(${mm * 6 + ss * .1}deg)`;
      if (!(hh === 15 && mm === 0)) lastSec = ss;
      s.style.transform = `rotate(${lastSec * 6}deg)`;
      clock.parentElement.setAttribute('aria-label', `現在時刻 ${hh}時${mm}分`);
    };
    tick(); setInterval(tick, 1000);
  }

  // ------------------------------------------------------------ 雨音（端末内で合成）
  let rain = null;
  function rainToggle(btn) {
    if (rain) { rain.stop(); rain = null; btn.setAttribute('aria-pressed', 'false'); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { toast('この端末では雨音を再生できません。'); return; }
    const ac = new AC();
    const len = ac.sampleRate * 3, buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { // ピンクノイズ
      const ch = buf.getChannelData(c); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
        b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
        ch[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
      }
    }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 380;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    const g = ac.createGain(); g.gain.value = 0;
    src.connect(hp).connect(lp).connect(g).connect(ac.destination); src.start();
    g.gain.linearRampToValueAtTime(.32, ac.currentTime + 2.5);
    // 庇に落ちる粒
    const drop = () => {
      const t = ac.currentTime, o = ac.createBufferSource(); o.buffer = buf;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 2600; bp.Q.value = 6;
      const dg = ac.createGain(); dg.gain.setValueAtTime(0, t); dg.gain.linearRampToValueAtTime(.18 * Math.random(), t + .004); dg.gain.exponentialRampToValueAtTime(.0001, t + .09);
      const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
      if (pan) { pan.pan.value = Math.random() * 2 - 1; o.connect(bp).connect(dg).connect(pan).connect(ac.destination); }
      else o.connect(bp).connect(dg).connect(ac.destination);
      o.start(t, Math.random() * 2, .12);
    };
    const iv = setInterval(() => { for (let i = 0; i < 3; i++) if (Math.random() < .55) setTimeout(drop, Math.random() * 300); }, 280);
    rain = { stop() { clearInterval(iv); g.gain.linearRampToValueAtTime(0, ac.currentTime + 1.2); setTimeout(() => ac.close(), 1400); } };
    btn.setAttribute('aria-pressed', 'true');
  }
  $('[data-act="rain"]')?.addEventListener('click', e => rainToggle(e.currentTarget));

  // ------------------------------------------------------------ シート（設定・検索）
  let lastFocus = null;
  function openSheet(id) {
    const sh = doc.getElementById(id); if (!sh) return;
    lastFocus = doc.activeElement; sh.hidden = false;
    const f = sh.querySelector('input,button'); f?.focus();
    if (id === 'sheet-search') searchOpened();
  }
  function closeSheet(sh) { sh.hidden = true; lastFocus?.focus?.(); }
  $('[data-act="settings"]')?.addEventListener('click', () => openSheet('sheet-settings'));
  $('[data-act="search"]')?.addEventListener('click', () => openSheet('sheet-search'));
  $$('.sheet').forEach(sh => {
    sh.addEventListener('click', e => { if (e.target === sh || e.target.closest('[data-close]')) closeSheet(sh); });
    sh.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(sh); });
  });

  // 表示設定
  const settings = Object.assign({ theme: 'auto', size: 'm', lh: 'normal', face: 'mincho', dir: 'yoko' }, S.get('settings', {}));
  function applySettings() {
    for (const k of ['theme', 'size', 'lh', 'face', 'dir']) html.dataset[k] = settings[k];
    $$('.seg').forEach(seg => {
      const k = seg.dataset.set;
      $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === settings[k])));
    });
    const sp = $('[data-set-check="spoil"]'); if (sp) sp.checked = spoil();
  }
  $$('.seg button').forEach(b => b.addEventListener('click', () => {
    const k = b.closest('.seg').dataset.set;
    const keep = Reader.current?.();
    settings[k] = b.dataset.v; S.set('settings', settings); applySettings();
    if (k === 'dir' || k === 'size' || k === 'lh' || k === 'face') Reader.restore?.(keep);
  }));
  $('[data-set-check="spoil"]')?.addEventListener('change', e => {
    S.set('spoil', e.target.checked); renderPage();
  });
  applySettings();

  // ------------------------------------------------------------ 画像スロット（assets/img/<名前>.webp、なければ .png を表示）
  function loadSlots(scope = doc) {
    $$('.slot[data-slot]', scope).forEach(fig => {
      if (fig.dataset.tried) return; fig.dataset.tried = '1';
      const exts = ['webp', 'png'];
      const tryNext = () => {
        const ext = exts.shift(); if (!ext) return;
        const img = new Image(); img.decoding = 'async'; img.alt = '';
        img.onload = () => { fig.appendChild(img); fig.classList.add('has-img'); };
        img.onerror = tryNext;
        img.src = `${ROOT}assets/img/${fig.dataset.slot}.${ext}`;
      };
      tryNext();
    });
  }
  loadSlots();

  // ------------------------------------------------------------ 章の読了と収束
  let CH = null; // chapters.json
  async function chapters() {
    if (CH) return CH;
    try { CH = await (await fetch(ROOT + 'assets/chapters.json')).json(); } catch (e) { CH = { order: [], ch: {} }; }
    return CH;
  }
  function markRead(key) {
    const r = read(); if (r[key]) return false;
    r[key] = Date.now(); S.set('read', r);
    let msg = '';
    if (key === 'echo-03' && stage() < 1) { S.set('stage', 1); msg = 'stage1'; }
    if (key === 'echo-05' && stage() < 2) { S.set('stage', 2); msg = 'stage2'; }
    return msg || true;
  }

  // ------------------------------------------------------------ 検索
  let INDEX = null;
  async function index() {
    if (INDEX) return INDEX;
    INDEX = (await (await fetch(ROOT + 'assets/search.json')).json()).rows;
    return INDEX;
  }
  const norm = s => s.normalize('NFKC').toLowerCase();
  function searchOpened() {
    const notice = $('.sr-notice');
    if (stage() >= 2 && !S.get('histWiped', false)) {
      const n = (S.get('hist', []) || []).length;
      S.set('hist', []); S.set('histWiped', true);
      notice.innerHTML = `<strong>検索履歴を削除しました</strong>あなたの利便性のため、<br>より最適な情報を提供いたします。<small>削除された項目：${n}件　この操作は取り消せません。</small>`;
      notice.hidden = false;
    } else notice.hidden = true;
    drawHist();
  }
  function drawHist() {
    const box = $('.sr-hist'); if (!box) return;
    const h = S.get('hist', []);
    box.innerHTML = h.map(q => `<button type="button">${esc(q)}</button>`).join('');
    $$('button', box).forEach(b => b.addEventListener('click', () => { $('#sr-q').value = b.textContent; runSearch(b.textContent); }));
  }
  async function runSearch(q) {
    q = q.trim(); const out = $('.sr-res'); if (!q) { out.innerHTML = ''; return; }
    const h = S.get('hist', []).filter(x => x !== q); h.unshift(q); S.set('hist', h.slice(0, 20)); drawHist();
    out.innerHTML = '<li class="sr-none">探しています</li>';
    const rows = await index(); const nq = norm(q); const res = [];
    for (const r of rows) { if (norm(r[5]).includes(nq)) { res.push(r); if (res.length >= 80) break; } }
    if (!res.length) { out.innerHTML = `<li class="sr-none">「${esc(q)}」は、本文に見つかりませんでした。別のことばで試してください。</li>`; return; }
    out.innerHTML = res.map(r => {
      const [, key, href, title, n, t] = r;
      const can = open(key) || key === body.dataset.key;
      const i = norm(t).indexOf(nq), a = Math.max(0, i - 28);
      const snip = can ? esc(t.slice(a, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length, i + q.length + 40))
        : 'まだ読んでいない章です。開くと、その章へ移動します。';
      return `<li><a href="${ROOT}${href}#p${n}"><span class="sr-where">${esc(title)}${can ? '' : '（未読）'}</span><span class="sr-snip">${a > 0 && can ? '…' : ''}${snip}</span></a></li>`;
    }).join('') + (res.length >= 80 ? '<li class="sr-none">80件まで表示しています。ことばを足すと絞り込めます。</li>' : '');
  }
  $('.sr-form')?.addEventListener('submit', e => { e.preventDefault(); runSearch($('#sr-q').value); });

  // ------------------------------------------------------------ 読書画面
  const Reader = {};
  function initReader() {
    const art = $('.reader'); if (!art) return;
    const key = art.dataset.key, text = $('#text'), bar = $('#bar'), prog = $('.progress i');
    const paras = $$('p[id^="p"]', text);
    const isTate = () => html.dataset.dir === 'tate';
    history.scrollRestoration = 'manual';

    // 縦書きの案内
    const hint = doc.createElement('p'); hint.className = 'tate-hint'; hint.textContent = '左へスクロールして読み進めます';
    text.after(hint);

    const pos = S.get('pos', {});
    function current() {
      // 画面の読み始め位置にある段落
      const top = isTate() ? null : (bar.getBoundingClientRect().bottom + 8);
      if (isTate()) {
        const box = text.getBoundingClientRect();
        for (const p of paras) { const r = p.getBoundingClientRect(); if (r.left < box.right - 8) return +p.id.slice(1); }
        return 1;
      }
      for (const p of paras) { const r = p.getBoundingClientRect(); if (r.bottom > top) return +p.id.slice(1); }
      return paras.length ? +paras.at(-1).id.slice(1) : 1;
    }
    function goTo(n, smooth) {
      const p = doc.getElementById('p' + n); if (!p) return;
      if (isTate()) {
        const box = text.getBoundingClientRect(), r = p.getBoundingClientRect();
        text.scrollBy({ left: r.right - box.right + 24, behavior: smooth ? 'smooth' : 'auto' });
        text.scrollIntoView({ block: 'start' });
      } else {
        const y = p.getBoundingClientRect().top + scrollY - bar.offsetHeight - 24;
        scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
      }
    }
    Reader.current = current;
    Reader.restore = n => requestAnimationFrame(() => requestAnimationFrame(() => goTo(n)));

    function pct() {
      if (isTate()) { const max = text.scrollWidth - text.clientWidth; return max > 0 ? Math.min(1, Math.abs(text.scrollLeft) / max) : 0; }
      const r = text.getBoundingClientRect(); const total = r.height - innerHeight * .6;
      return Math.min(1, Math.max(0, (-r.top + bar.offsetHeight) / Math.max(1, total)));
    }
    let saveT = 0, lastY = scrollY;
    function onScroll() {
      const p = pct(); if (prog) prog.style.width = (p * 100).toFixed(1) + '%';
      if (!isTate()) { // 下へ読むときはヘッダーを隠す
        const y = scrollY; bar.classList.toggle('is-hidden', y > lastY && y > 200); lastY = y;
      }
      clearTimeout(saveT); saveT = setTimeout(save, 600);
    }
    function save() {
      const n = current(); const all = S.get('pos', {});
      all[key] = { p: n, pct: Math.round(pct() * 100), t: Date.now() }; S.set('pos', all);
      const para = doc.getElementById('p' + n);
      S.set('last', { key, p: n, href: location.pathname, text: (para?.textContent || '').trim().slice(0, 90), title: doc.title.split('｜')[0], t: Date.now() });
    }
    addEventListener('scroll', onScroll, { passive: true });
    text.addEventListener('scroll', onScroll, { passive: true });
    addEventListener('pagehide', save);
    // 縦書き：ホイールを横移動に
    text.addEventListener('wheel', e => {
      if (!isTate() || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault(); text.scrollLeft -= e.deltaY;
    }, { passive: false });

    // 検索から来たとき
    const hash = location.hash.match(/^#p(\d+)$/);
    if (hash) {
      const n = +hash[1]; setTimeout(() => { goTo(n); const p = doc.getElementById('p' + n); p?.classList.add('hit'); setTimeout(() => p?.classList.remove('hit'), 2600); }, 60);
    } else if (pos[key] && pos[key].p > 3 && !isRead(key)) {
      const box = $('.resume', art); box.hidden = false;
      $('[data-act="resume"]', box).addEventListener('click', () => { box.hidden = true; goTo(pos[key].p, true); });
      $('[data-act="dismiss"]', box).addEventListener('click', () => { box.hidden = true; });
    }

    // 読了
    const end = $('#end');
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      const before = { ...read() }; const r = markRead(key);
      if (r) showUnlocked(key, before, r);
    }, { root: null, threshold: .2 });
    if (end) io.observe(end);
    if (isRead(key)) showUnlocked(key, null, false);

    // 章のメモ
    const ta = $('#memo-text'), saved = $('.memo-saved');
    if (ta) {
      const memo = S.get('memo', {}); ta.value = memo[key] || '';
      let t = 0;
      ta.addEventListener('input', () => {
        clearTimeout(t); t = setTimeout(() => {
          const m = S.get('memo', {}); if (ta.value.trim()) m[key] = ta.value; else delete m[key];
          S.set('memo', m); saved.textContent = '保存しました（この端末の中）';
        }, 500);
      });
    }
    onScroll();
  }

  async function showUnlocked(key, before, result) {
    const box = $('.unlocked'); if (!box) return;
    const lines = [];
    const arc = await fetchData('archive'), ppl = await fetchData('people');
    const newA = (arc || []).filter(x => x.unlock === key).map(x => `『${esc(x.title)}』`);
    const newP = (ppl || []).filter(x => x.unlock === key).map(x => esc(x.name));
    if (newA.length) lines.push(`資料室に記録が増えました：${newA.join('、')}　<a href="${ROOT}archive/">資料室へ</a>`);
    if (newP.length) lines.push(`人物録に記載が増えました：${newP.join('、')}　<a href="${ROOT}people/">人物録へ</a>`);
    if (key === 'echo-03') lines.push(`資料室の記載が、最新の記録に更新されました。　<a href="${ROOT}archive/">資料室へ</a>`);
    if (key === 'echo-05') lines.push(`記憶照合が開きました。　<a href="${ROOT}check/">記憶照合へ</a>`);
    if (!lines.length) return;
    box.innerHTML = lines.map(l => `<p style="margin:.2rem 0">${l}</p>`).join(''); box.hidden = false;
    if (result) toast('この章を読み終えました。');
  }
  // 章末で使う資料データ
  let DATA = null;
  async function fetchData(name) {
    if (!DATA) { try { DATA = await (await fetch(ROOT + 'assets/data.json')).json(); } catch (e) { DATA = { archive: [], people: [] }; } }
    return DATA[name] || [];
  }

  // ------------------------------------------------------------ 本の扉
  function initBook() {
    const bk = body.dataset.book; if (!bk || KIND !== 'book') return;
    const r = read(), pos = S.get('pos', {});
    let resume = null;
    $$('.toc-list li').forEach(li => {
      const k = li.dataset.key, st = $('.toc-state', li);
      if (r[k]) st.textContent = '読了';
      else if (pos[k]) { st.textContent = `${pos[k].pct || 0}%`; if (!resume) resume = li.querySelector('a').getAttribute('href') + '#p' + pos[k].p; }
    });
    const first = $$('.toc-list li').find(li => !r[li.dataset.key]);
    const btn = $('.book-resume');
    if (resume) { btn.href = resume; btn.hidden = false; }
    else if (first && Object.keys(r).some(k => k.startsWith(bk))) { btn.href = first.querySelector('a').getAttribute('href'); btn.textContent = '次の章から読む'; btn.hidden = false; }
  }

  // ------------------------------------------------------------ トップ
  async function initHome() {
    if (KIND !== 'home') return;
    const title = $('.hero-title');
    if (title && !reduceMotion) (doc.fonts?.ready || Promise.resolve()).then(() => title.classList.add('is-settling'));
    const last = S.get('last', null);
    if (last && last.text) {
      $('.hl-first').hidden = true; $('.hero')?.classList.add('is-return');
      const ret = $('.hl-return'); ret.hidden = false; $('.hl-t', ret).textContent = last.text.length > 58 ? last.text.slice(0, 58) + '…' : last.text;
      const c = $('[data-continue]'); c.href = `${last.href}#p${last.p}`; c.hidden = false; c.textContent = '続きを読む';
      const f = $('[data-first]'); f.textContent = '最初の一行から読む'; f.classList.replace('btn--ink', 'btn--ghost'); c.classList.replace('btn--ghost', 'btn--ink');
      c.parentElement.prepend(c);
    }
    const ch = await chapters(), r = read();
    for (const bk of ['as', 'echo', 'mega']) {
      const keys = ch.order.filter(k => k.startsWith(bk));
      const done = keys.filter(k => r[k]).length;
      const sp = $(`.spine--${bk} a`); if (sp && keys.length) sp.style.setProperty('--done', Math.round(done / keys.length * 100) + '%');
    }
    const v = S.get('visits', {});
    $$('.lcard').forEach(card => {
      const rows = (v[card.dataset.page] || []).slice(0, 4);
      while (rows.length < 4) rows.push('');
      $('.lcard-rows', card).innerHTML = rows.map(d => `<span>${esc(d)}</span>`).join('');
    });
    if (isRead('echo-05')) { const c = $('.lcard--check'); if (c) c.hidden = false; }
    rainCanvas();
  }
  function rainCanvas() {
    const cv = $('.rain'); if (!cv || reduceMotion) return;
    const ctx = cv.getContext('2d'); let W, H, drops = [], run = true, dpr = Math.min(2, devicePixelRatio || 1);
    const ink = () => getComputedStyle(html).getPropertyValue('--pencil').trim() || '#5d656c';
    function size() {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(W * H / 9000);
      drops = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, l: 8 + Math.random() * 22, v: 3 + Math.random() * 6, a: .05 + Math.random() * .12 }));
    }
    size(); addEventListener('resize', size);
    new IntersectionObserver(es => { run = es[0].isIntersecting; if (run) loop(); }).observe(cv);
    function loop() {
      if (!run) return;
      ctx.clearRect(0, 0, W, H); ctx.strokeStyle = ink(); ctx.lineWidth = 1;
      for (const d of drops) {
        ctx.globalAlpha = d.a; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * .06, d.y + d.l); ctx.stroke();
        d.y += d.v; d.x -= d.v * .06; if (d.y > H) { d.y = -d.l; d.x = Math.random() * W; }
      }
      ctx.globalAlpha = 1; requestAnimationFrame(loop);
    }
    loop();
  }

  // ------------------------------------------------------------ 覚えておく（ピン）
  function pinBtn(type, id, snap) {
    const pins = S.get('pins', {}); const k = type + ':' + id; const on = !!pins[k];
    return `<button class="btn btn--pin" type="button" data-pin="${esc(k)}" aria-pressed="${on}" data-snap="${esc(JSON.stringify(snap))}">${on ? '覚えている' : '覚えておく'}</button>`;
  }
  function bindPins(scope) {
    $$('[data-pin]', scope).forEach(b => b.addEventListener('click', () => {
      const pins = S.get('pins', {}); const k = b.dataset.pin;
      if (pins[k]) { toast('すでに覚えています。写しは記憶ノートにあります。'); return; }
      pins[k] = { snap: JSON.parse(b.dataset.snap), at: Date.now(), stage: stage() };
      S.set('pins', pins); b.setAttribute('aria-pressed', 'true'); b.textContent = '覚えている';
      toast('記憶ノートに写しを残しました。');
    }));
  }

  // ------------------------------------------------------------ 資料室
  function initArchive() {
    const d = jsonData('zk-archive'); const box = $('#arc'); if (!d || !box) return;
    const st = stage();
    let items = d.items.slice();
    if (st < 1) items.sort(() => Math.random() - .5); // 収束するまで、棚の並びは毎回少し違う
    $('[data-converged-note]').hidden = st < 1;
    box.innerHTML = items.map(it => {
      if (!open(it.unlock)) return `<li class="dossier dossier--locked"><p>まだ読んでいない章に出てくる資料です。</p></li>`;
      const rows = (st >= 1 && it.after1) ? it.after1 : it.rows;
      const ch = d.ch[it.unlock];
      const snap = { title: it.title, sub: `${it.kind}　${it.maker}`, rows };
      return `<li class="dossier">
        <figure class="slot" data-slot="arc-${esc(it.id)}" style="--ratio:1/1"></figure>
        <div class="dos-in">
          <p class="dos-kind">${esc(it.kind)}</p>
          <h2 class="dos-title">${esc(it.title)}</h2>
          <p class="dos-maker">${esc(it.maker)}</p>
          <dl class="dos-rows">${rows.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
          <div class="dos-foot"><span>初出　${ch ? `<a href="${ROOT}${ch.href}">${esc(ch.label)}</a>` : ''}</span>${pinBtn('arc', it.id, snap)}</div>
        </div></li>`;
    }).join('');
    bindPins(box); loadSlots(box);
  }

  // ------------------------------------------------------------ 人物録
  function initPeople() {
    const d = jsonData('zk-people'); const box = $('#ppl'); if (!d || !box) return;
    const st = stage();
    const groups = { as: [], echo: [], mega: [] };
    let shown = 0, hidden = 0;
    for (const p of d.items) {
      if (!open(p.unlock)) { hidden++; continue; }
      let role = p.role, rows = p.rows;
      if (st >= 2 && 'after2' in p) { if (p.after2 === null) continue; role = p.after2.role; rows = p.after2.rows; }
      groups[p.book].push({ ...p, role, rows }); shown++;
    }
    box.innerHTML = Object.entries(groups).filter(([, v]) => v.length).map(([bk, list]) =>
      `<h2 class="ppl-book">${esc(d.books[bk])}</h2><ul class="ppl-list">${list.map(p => `
        <li class="person"><h3>${esc(p.name)}</h3>${pinBtn('person', p.id, { title: p.name, sub: d.books[bk], role: p.role, rows: p.rows })}
        <p class="role">${esc(p.role)}</p>
        ${p.rows.length ? `<dl>${p.rows.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>` : ''}</li>`).join('')}</ul>`).join('')
      || `<p class="lock-note">まだ誰の記録もありません。本棚から一冊選んで、最初の章を読んでみてください。</p>`;
    $('[data-people-count]').textContent = `記載されている人物：${shown}名` + (hidden ? `　まだ読んでいない章に、あと${hidden}名` : '');
    bindPins(box);
  }

  // ------------------------------------------------------------ 年表
  function initTimeline() {
    const d = jsonData('zk-timeline'); const box = $('#tl'); if (!d || !box) return;
    const st = stage(); let locked = 0;
    const rows = d.items.filter(it => { if (open(it.unlock)) return true; locked++; return false; }).map(it => {
      let { rec, mem } = it;
      if (st >= 1 && it.after1) ({ rec, mem } = it.after1);
      if (st >= 2 && it.after2) ({ rec, mem } = it.after2);
      return `<li><p class="rec ${rec ? '' : 'empty'}" style="margin:0">${rec ? esc(rec) : '―'}</p><p class="date" style="margin:0">${esc(it.d)}</p><p class="mem ${mem ? '' : 'empty'}" style="margin:0">${mem ? esc(mem) : '―'}</p></li>`;
    });
    box.innerHTML = rows.join('') + (locked ? `<li class="tl-more" style="display:block">まだ読んでいない章に関わる出来事が、あと${locked}件あります。</li>` : '');
    if (!rows.length) box.innerHTML = `<li class="tl-more" style="display:block">本棚から一冊選んで、最初の章を読むと、ここに出来事が並びはじめます。</li>`;
  }

  // ------------------------------------------------------------ 記憶ノート
  function currentOf(k, d) {
    const [type, id] = k.split(':'); const st = stage();
    if (type === 'arc') {
      const it = d.archive.find(x => x.id === id); if (!it) return null;
      return { rows: (st >= 1 && it.after1) ? it.after1 : it.rows };
    }
    const p = d.people.find(x => x.id === id); if (!p) return null;
    if (st >= 2 && 'after2' in p) { if (p.after2 === null) return { gone: true }; return { role: p.after2.role, rows: p.after2.rows }; }
    return { role: p.role, rows: p.rows };
  }
  const rowsHtml = rows => `<dl>${(rows || []).map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>`;
  function initNotes() {
    const d = jsonData('zk-notes'); const box = $('#nb'); if (!d || !box) return;
    const memo = S.get('memo', {}), pins = S.get('pins', {}), quiz = S.get('quiz', null);
    let h = '<h2>章ごとのメモ</h2>';
    const mk = Object.keys(memo);
    h += mk.length ? mk.map(k => `<div class="nb-memo"><h3>${d.ch[k] ? `<a href="${ROOT}${d.ch[k].href}">${esc(d.ch[k].label)}</a>` : esc(k)}</h3><textarea rows="3" data-memo="${esc(k)}">${esc(memo[k])}</textarea></div>`).join('')
      : '<p class="nb-empty">まだ何も書いていません。章の最後にある欄から書けます。</p>';
    h += '<h2>覚えておいたもの</h2>';
    const pk = Object.keys(pins);
    h += pk.length ? pk.map(k => {
      const p = pins[k], cur = currentOf(k, d), s = p.snap;
      const same = cur && !cur.gone && JSON.stringify(cur.rows) === JSON.stringify(s.rows) && (cur.role || '') === (s.role || '');
      const at = new Date(p.at); const when = `${at.getMonth() + 1}月${at.getDate()}日に覚えた写し`;
      return `<article class="pin-card"><h3>${esc(s.title)}</h3><p class="pin-meta">${esc(s.sub || '')}　${when}</p>
        ${same ? `<div class="pin-col pin-col--mine">${s.role ? `<p>${esc(s.role)}</p>` : ''}${rowsHtml(s.rows)}</div><p class="pin-same">いまの記録と同じです。</p>`
        : `<div class="pin-cols"><div class="pin-col pin-col--mine"><h4>あなたの写し</h4>${s.role ? `<p>${esc(s.role)}</p>` : ''}${rowsHtml(s.rows)}</div>
           <div class="pin-col"><h4>いまの記録</h4>${!cur || cur.gone ? '<p>該当する記録がありません。</p>' : `${cur.role ? `<p>${esc(cur.role)}</p>` : ''}${rowsHtml(cur.rows)}`}</div></div>`}
        <button class="pin-rm" type="button" data-unpin="${esc(k)}">この写しを手放す</button></article>`;
    }).join('') : '<p class="nb-empty">資料室や人物録で「覚えておく」を押すと、その時点の記載がここに写されます。</p>';
    if (quiz) {
      h += '<h2>記憶照合の記録</h2>' + `<ol class="qz-res">${quiz.answers.map(a => `<li><span class="q">${esc(a.q)}</span><span class="row"><span>あなたの記憶</span><span class="mine">${esc(a.mine)}</span></span><span class="row"><span>いまの記録</span><span>${esc(a.record)}</span></span></li>`).join('')}</ol>`;
    }
    box.innerHTML = h;
    $$('[data-memo]', box).forEach(ta => {
      let t = 0; ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const m = S.get('memo', {}); if (ta.value.trim()) m[ta.dataset.memo] = ta.value; else delete m[ta.dataset.memo]; S.set('memo', m); }, 500); });
    });
    $$('[data-unpin]', box).forEach(b => b.addEventListener('click', () => {
      if (!confirm('この写しを手放します。もう一度覚えても、いまの記録の内容になります。')) return;
      const p = S.get('pins', {}); delete p[b.dataset.unpin]; S.set('pins', p); initNotes();
    }));
  }
  $('[data-act="export"]')?.addEventListener('click', () => {
    const d = jsonData('zk-notes') || { ch: {} }; const memo = S.get('memo', {}), pins = S.get('pins', {});
    let t = '記憶ノート\n\n';
    for (const k in memo) t += `■ ${d.ch[k]?.label || k}\n${memo[k]}\n\n`;
    for (const k in pins) { const s = pins[k].snap; t += `□ ${s.title}（${s.sub || ''}）\n${s.role ? s.role + '\n' : ''}${(s.rows || []).map(r => `  ${r[0]}：${r[1]}`).join('\n')}\n\n`; }
    const a = doc.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' })); a.download = 'kioku-note.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('[data-act="wipe"]')?.addEventListener('click', () => {
    if (!confirm('章ごとのメモと、覚えておいた写しをすべて消します。読んだ位置は残ります。')) return;
    S.del('memo'); S.del('pins'); initNotes(); toast('ノートを空にしました。');
  });

  // ------------------------------------------------------------ 記憶照合
  function initCheck() {
    const d = jsonData('zk-quiz'); const box = $('#qz'); if (!d || !box) return;
    if (!isRead('echo-05')) return;
    const answers = [];
    const ask = i => {
      if (i >= d.items.length) return finish();
      const q = d.items[i];
      box.innerHTML = `<div class="qz-q"><p class="qz-n">${i + 1}／${d.items.length}</p><p class="qz-text">${esc(q.q)}</p><div class="qz-choices">${q.choices.map(c => `<button type="button">${esc(c)}</button>`).join('')}</div></div>`;
      $$('.qz-choices button', box).forEach(b => b.addEventListener('click', () => { answers.push({ q: q.q, mine: b.textContent, record: q.record, memo: q.memo }); ask(i + 1); }));
      $('.qz-choices button', box).focus();
    };
    const finish = () => {
      S.set('quiz', { answers, at: Date.now() });
      box.innerHTML = `<ol class="qz-res">${answers.map(a => `<li><span class="q">${esc(a.q)}</span>
        <span class="row"><span>あなたの記憶</span><span class="mine">${esc(a.mine)}</span></span>
        <span class="row"><span>いまの記録</span><span>${esc(a.record)}</span></span>
        <p class="memo">${esc(a.memo)}</p></li>`).join('')}</ol>
        <p class="qz-end">どちらが正しいかは、ここには書きません。<br>あなたが覚えているかぎり、それは、あった。</p>
        <p><a class="btn btn--ghost" href="${ROOT}notes/">記憶ノートで見る</a> <button class="btn btn--ghost" type="button" data-again>もう一度</button></p>`;
      $('[data-again]', box).addEventListener('click', () => { answers.length = 0; ask(0); });
    };
    const prev = S.get('quiz', null);
    box.innerHTML = `<p>${prev ? '前回の照合の記録は、記憶ノートに残っています。' : '八つの問いがあります。思い出せる範囲で、選んでください。'}</p><p><button class="btn btn--ink" type="button" data-start>照合をはじめる</button></p>`;
    $('[data-start]', box).addEventListener('click', () => ask(0));
  }

  // ------------------------------------------------------------ about
  $('[data-act="reset-all"]')?.addEventListener('click', () => {
    if (!confirm('読んだ位置、読み終えた章、設定、記憶ノートを含めて、この端末に残っている記録をすべて消します。')) return;
    try { Object.keys(localStorage).filter(k => k.startsWith('zk.')).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    toast('すべての記録を消しました。'); setTimeout(() => location.reload(), 900);
  });

  function renderPage() {
    if (KIND === 'archive') initArchive();
    if (KIND === 'people') initPeople();
    if (KIND === 'timeline') initTimeline();
  }
  renderPage();
  initReader();
  initBook();
  initHome();
  if (KIND === 'notes') initNotes();
  if (KIND === 'check') initCheck();
})();
