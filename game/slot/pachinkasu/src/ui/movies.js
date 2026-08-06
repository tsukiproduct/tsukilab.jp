/**
 * 液晶ムービー層（仕様書 §14.6 の14本に対応する差し込みスロット）
 *
 * 使い方: assets/movies/ に下記キーのファイル名で .webm（または .mp4）を置くだけ。
 * ファイルが存在すれば自動で再生され、無ければ従来の静止画演出にフォールバックする。
 * コード変更は不要（詳細は assets/movies/README.md）。
 *
 * - playMovie(key):  一発再生。再生できたら true を返す（false なら呼び元が静止画演出を出す）
 * - setLoopMovie(key|null): 背景ループ再生（AT中背景など）。null で停止
 */

/** キー → ファイル名（拡張子なし）。仕様書§14.6の14本 */
export const MOVIES = {
  demo:          "mv_demo_loop",       // 待機デモ（ループ可）
  renzoku_a_dev: "mv_renzoku_a_dev",   // 連続演出A 発展共通
  renzoku_a_win: "mv_renzoku_a_win",   // 連続演出A 成功
  renzoku_a_lose:"mv_renzoku_a_lose",  // 連続演出A 失敗
  renzoku_b_dev: "mv_renzoku_b_dev",   // 連続演出B 発展共通
  renzoku_b_win: "mv_renzoku_b_win",   // 連続演出B 成功
  renzoku_b_lose:"mv_renzoku_b_lose",  // 連続演出B 失敗
  big:           "mv_big_kakutei",     // BIG確定
  reg:           "mv_reg_kakutei",     // REG確定
  freeze:        "mv_freeze",          // フリーズ（プレミア）
  at_start:      "mv_at_start",        // AT突入
  at_loop_a:     "mv_at_loop_a",       // AT中背景ループ（前半）
  at_loop_b:     "mv_at_loop_b",       // AT中背景ループ（後半・残G少）
  kanso:         "mv_kanso_ending",    // 完走エンディング
};

const DIR = "assets/movies/";
const EXTS = [".webm", ".mp4"];

/** ファイル存在キャッシュ: key -> 解決済みURL / null(無し) */
const cache = new Map();

const $ = (id) => document.getElementById(id);

/**
 * manifest.json（tools/scan_movies.py が生成）を先に読む。
 * これがあれば存在する動画だけを読みに行くので、404も初回再生の待ちも発生しない。
 * 無い場合は自動プローブにフォールバックするため、ファイルを置くだけでも動く。
 */
// 取得できれば object（空でも「マニフェストは正」）、取得できなければ null（＝プローブに切替）
const manifest = fetch(DIR + "manifest.json")
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null);

/** 候補拡張子を順に試し、読める URL を返す（無ければ null） */
function probe(name) {
  const v = document.createElement("video");
  return new Promise((res) => {
    let i = 0;
    const tryNext = () => {
      if (i >= EXTS.length) { res(null); return; }
      const url = DIR + name + EXTS[i++];
      v.onloadeddata = () => res(url);
      v.onerror = tryNext;
      v.src = url;
      v.load();
    };
    tryNext();
  });
}

async function resolveSrc(key) {
  if (cache.has(key)) return cache.get(key);
  const name = MOVIES[key];
  if (!name) { cache.set(key, null); return null; }
  const m = await manifest;
  // マニフェストがあればそれが正（載っていない＝未配置。プローブしないので404が出ない）
  if (m) { const url = m[key] ? DIR + m[key] : null; cache.set(key, url); return url; }
  // マニフェストが無い環境では実ファイルを探しに行く（置くだけでも動くようにするため）
  const url = await probe(name);
  cache.set(key, url);
  return url;
}

/**
 * 一発再生。動画があれば #lcdmovie で最後まで再生して true。無ければ即 false。
 *
 * 【重要】必ずタイムアウトで抜けること。
 *   タブが裏に回ると（アプリを最小化した等）ブラウザが再生を止めるため `ended` が永久に来ない。
 *   ここで待ち続けるとボーナス消化が止まってゲームが固まる。
 *   メタデータが読めた時点で「実尺＋猶予」に締め直し、読めなければ HARD_CAP で打ち切る。
 *
 * @param {string} key MOVIES のキー
 * @param {number} hardCapMs メタデータすら読めない場合の最終打ち切り
 */
export async function playMovie(key, hardCapMs = 8000) {
  const url = await resolveSrc(key);
  if (!url) return false;
  const v = $("lcdmovie");
  return new Promise((res) => {
    let done = false, tm;
    const arm = (ms) => { clearTimeout(tm); tm = setTimeout(() => finish(true), ms); };
    const finish = (ok) => {
      if (done) return; done = true;
      clearTimeout(tm);
      v.onended = v.onerror = v.onloadedmetadata = null;
      v.pause(); v.style.display = "none"; v.removeAttribute("src"); v.load();
      res(ok);
    };
    arm(hardCapMs);
    // 実尺が分かったら締め直す（+1.5秒は再生開始のもたつき分の猶予）
    v.onloadedmetadata = () => {
      if (isFinite(v.duration) && v.duration > 0) arm(v.duration * 1000 + 1500);
    };
    v.onended = () => finish(true);
    v.onerror = () => finish(false);
    v.src = url; v.loop = false; v.muted = true;
    v.style.display = "block";
    v.play().catch(() => finish(false));
  });
}

let currentLoop = null;

/** 背景ループ再生（#lcdloop）。同じキーなら何もしない。null で停止 */
export async function setLoopMovie(key) {
  if (key === currentLoop) return;
  currentLoop = key;
  const v = $("lcdloop");
  if (!key) { v.pause(); v.style.display = "none"; v.removeAttribute("src"); v.load(); return; }
  const url = await resolveSrc(key);
  if (currentLoop !== key) return; // 待っている間に切り替わった
  if (!url) { v.style.display = "none"; return; }
  v.src = url; v.loop = true; v.muted = true;
  v.style.display = "block";
  // 裏に回っている間は play() が弾かれることがある。表に戻ったとき再開させる（下の visibilitychange）
  v.play().catch(() => {});
}

// タブが表に戻ったらループ動画を再開する（裏で止まったまま復帰しないのを防ぐ）
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !currentLoop) return;
  const v = $("lcdloop");
  if (v.getAttribute("src") && v.paused) v.play().catch(() => {});
});
