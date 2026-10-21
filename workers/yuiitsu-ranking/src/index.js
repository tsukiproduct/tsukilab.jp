// 油一（ゆいいつ）ランキング API (Cloudflare Worker + D1)
//   GET  /start                 -> { token }  run token, signed with a server-only key
//   GET  /top?diff=easy&pid=... -> { rows:[{rank,name,total,splits,me}], me:{rank,total}|null }
//   POST /score {token,pid,diff,name,t1,t2,t3,splits} -> { ok, best, rank }
//   POST /name  {pid,name}      -> { ok }
const ORIGINS = ['https://tsukilab.jp', 'https://www.tsukilab.jp'];
const DIFFS = ['easy', 'hard'];
const MIN_STAGE = 4;          // seconds; nothing human clears a bowl faster
const MAX_TOTAL = 3 * 3600;   // seconds
const enc = new TextEncoder();

function cors(req) {
  const o = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
const json = (req, body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(req) } });

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function secret(env) {
  const row = await env.DB.prepare('SELECT v FROM meta WHERE k = ?').bind('secret').first();
  if (row) return row.v;
  const v = b64u(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare('INSERT OR IGNORE INTO meta (k, v) VALUES (?, ?)').bind('secret', v).run();
  return (await env.DB.prepare('SELECT v FROM meta WHERE k = ?').bind('secret').first()).v;
}
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
const cleanName = (v) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 12);
const validPid = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(v);
const num = (v) => typeof v === 'number' && Number.isFinite(v);

async function top(req, env, url) {
  const diff = url.searchParams.get('diff');
  if (!DIFFS.includes(diff)) return json(req, { error: 'diff' }, 400);
  const pid = url.searchParams.get('pid') || '';
  const { results } = await env.DB.prepare('SELECT pid, name, total, splits FROM scores WHERE diff = ? ORDER BY total ASC, at ASC LIMIT 10').bind(diff).all();
  const rows = results.map((r, i) => ({ rank: i + 1, name: r.name, total: r.total, splits: r.splits, me: !!pid && r.pid === pid }));
  let me = null;
  if (validPid(pid)) {
    const mine = await env.DB.prepare('SELECT total FROM scores WHERE pid = ? AND diff = ?').bind(pid, diff).first();
    if (mine) {
      const c = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE diff = ? AND total < ?').bind(diff, mine.total).first();
      me = { rank: c.n + 1, total: mine.total };
    }
  }
  return json(req, { rows, me });
}

async function score(req, env) {
  let b; try { b = await req.json(); } catch { return json(req, { error: 'body' }, 400); }
  const { token, pid, diff, t1, t2, t3 } = b || {};
  if (!validPid(pid) || !DIFFS.includes(diff) || ![t1, t2, t3].every(num)) return json(req, { error: 'invalid' }, 400);
  if ([t1, t2, t3].some((t) => t < MIN_STAGE)) return json(req, { error: 'too_fast' }, 422);
  const total = Math.round((t1 + t2 + t3) * 100) / 100;
  if (total > MAX_TOTAL) return json(req, { error: 'too_slow' }, 422);
  // run token: the server saw this run start at least `total` seconds ago
  const key = await secret(env);
  const [payload, sig] = String(token || '').split('.');
  if (!payload || sig !== await hmac(key, payload)) return json(req, { error: 'token' }, 403);
  let started; try { started = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).t; } catch { return json(req, { error: 'token' }, 403); }
  const elapsed = (Date.now() - started) / 1000;
  if (!(elapsed + 3 >= total) || elapsed > MAX_TOTAL + 600) return json(req, { error: 'time' }, 422);
  // one submission per address every 10 s
  const ip = await hmac(key, req.headers.get('CF-Connecting-IP') || 'x');
  const now = Date.now();
  const hit = await env.DB.prepare('SELECT at FROM hits WHERE ip = ?').bind(ip).first();
  if (hit && now - hit.at < 10000) return json(req, { error: 'slow_down' }, 429);
  await env.DB.prepare('INSERT INTO hits (ip, at) VALUES (?, ?) ON CONFLICT(ip) DO UPDATE SET at = excluded.at').bind(ip, now).run();

  const name = cleanName(b.name);
  const splits = Math.max(0, Math.min(9999, Math.floor(Number(b.splits) || 0)));
  const old = await env.DB.prepare('SELECT total FROM scores WHERE pid = ? AND diff = ?').bind(pid, diff).first();
  let best = false;
  if (!old || total < old.total) {
    await env.DB.prepare('INSERT INTO scores (pid, diff, name, total, t1, t2, t3, splits, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(pid, diff) DO UPDATE SET name = excluded.name, total = excluded.total, t1 = excluded.t1, t2 = excluded.t2, t3 = excluded.t3, splits = excluded.splits, at = excluded.at')
      .bind(pid, diff, name, total, t1, t2, t3, splits, now).run();
    best = true;
  } else {
    await env.DB.prepare('UPDATE scores SET name = ? WHERE pid = ?').bind(name, pid).run();
  }
  const mine = await env.DB.prepare('SELECT total FROM scores WHERE pid = ? AND diff = ?').bind(pid, diff).first();
  const c = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE diff = ? AND total < ?').bind(diff, mine.total).first();
  return json(req, { ok: true, best, rank: c.n + 1, total: mine.total });
}

async function rename(req, env) {
  let b; try { b = await req.json(); } catch { return json(req, { error: 'body' }, 400); }
  if (!validPid(b?.pid)) return json(req, { error: 'invalid' }, 400);
  await env.DB.prepare('UPDATE scores SET name = ? WHERE pid = ?').bind(cleanName(b.name), b.pid).run();
  return json(req, { ok: true });
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    try {
      if (req.method === 'GET' && url.pathname === '/start') {
        const payload = b64u(enc.encode(JSON.stringify({ t: Date.now(), n: b64u(crypto.getRandomValues(new Uint8Array(9))) })));
        return json(req, { token: payload + '.' + await hmac(await secret(env), payload) });
      }
      if (req.method === 'GET' && url.pathname === '/top') return await top(req, env, url);
      if (req.method === 'POST' && url.pathname === '/score') return await score(req, env);
      if (req.method === 'POST' && url.pathname === '/name') return await rename(req, env);
      if (url.pathname === '/') return json(req, { service: 'yuiitsu-ranking', ok: true });
      return json(req, { error: 'not_found' }, 404);
    } catch (e) {
      return json(req, { error: 'server' }, 500);
    }
  },
};
