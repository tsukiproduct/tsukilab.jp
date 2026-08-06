/**
 * リール制御の検証（仕様書 §6）
 * 実行: node tests/reel.js
 *
 * 全21押下位置 × 全フラグ × 全停止順 を総当たりし、以下を保証する:
 *   1. 成立役は必ず入賞する（すべり4コマ or オートビタ）
 *   2. 通常時ハズレ(SAFE)では絶対に入賞しない・テンパイしない・左中段に7/BAR/チェリーが止まらない
 *   3. ボーナス成立ゲーム(REACH)では必ずリーチ目が出る（＝ハズレでは出得ない出目）
 *   4. リーチ目の種類数を数える（仕様書§6.2 目標: 数百通り以上）
 */
import { STRIP, REEL_LEN, WIN_PATTERNS, makePlan, controlStop, isReachMoku } from '../src/core/reelControl.js';

let fail = 0;
const ng = (msg) => { console.log('  NG: ' + msg); fail++; };

/**
 * 「生きたテンパイ」= 2リール停止時点で、まだ入賞に到達し得るパターンが残っている状態。
 * （右リールが先に止まって揃う余地が消えた bell-bell-bar 等はテンパイではない）
 */
function isLiveTempai(mids) {
  if (mids.filter(Boolean).length !== 2) return false;
  return WIN_PATTERNS.some((p) => [0,1,2].every((i) => !mids[i] || mids[i] === p[i]));
}

/** 押下位置の全組合せ・全停止順で1ゲーム分を再現。出目と途中経過の両方を返す */
function allOutcomes(plan) {
  const orders = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  const out = [], tempais = [];
  for (const order of orders) {
    for (let p0 = 0; p0 < REEL_LEN; p0++)
      for (let p1 = 0; p1 < REEL_LEN; p1++)
        for (let p2 = 0; p2 < REEL_LEN; p2++) {
          const push = [p0, p1, p2];
          const mids = [null, null, null];
          for (const r of order) {
            mids[r] = STRIP[r][controlStop(r, push[r], plan, mids)];
            if (isLiveTempai(mids)) tempais.push([...mids]);
          }
          out.push(mids);
        }
  }
  out.tempais = tempais;
  return out;
}

const eq = (m, a, b, c) => m[0] === a && m[1] === b && m[2] === c;

console.log('=== リール制御 総当たり検証 ===\n');

// --- 1. 小役・リプレイの引き込み ---
console.log('[1] 成立役の引き込み（全押下位置で必ず入賞するか）');
const winCases = [
  ['REPLAY',   (m) => eq(m,'replay','replay','replay')],
  ['BELL',     (m) => eq(m,'bell','bell','bell')],
  ['MELON',    (m) => eq(m,'melon','melon','melon')],
  ['CHERRY',   (m) => m[0] === 'cherry'],
  ['ONE_COIN', (m) => eq(m,'star','star','bar')],
  ['RIICHI_BIG',(m)=> eq(m,'star','star','star')],
];
for (const [flag, ok] of winCases) {
  const res = allOutcomes(makePlan(flag, { justWon: flag.includes('_') }));
  const bad = res.filter((m) => !ok(m));
  if (bad.length) ng(`${flag}: ${bad.length}/${res.length} 件が非入賞 例=${bad[0]}`);
  else console.log(`  OK  ${flag.padEnd(11)} ${res.length}通りすべて入賞`);
}

// --- 2. 通常時ハズレの安全性 ---
console.log('\n[2] 通常時ハズレ(SAFE)の安全性');
const safe = allOutcomes(makePlan('HAZURE', {}));
const banned = ['red7','blue7','bar','cherry'];
const leftBad = safe.filter((m) => banned.includes(m[0]));
const winShape = safe.filter((m) =>
  (m[0]===m[1] && m[1]===m[2]) || eq(m,'star','star','bar') || eq(m,'red7','red7','blue7'));
if (leftBad.length) ng(`左中段に禁止図柄が停止: ${leftBad.length}件 例=${leftBad[0]}`);
else console.log(`  OK  左中段に 7/BAR/チェリー が停止した回数: 0 / ${safe.length}`);
if (winShape.length) ng(`ハズレなのに入賞形: ${winShape.length}件 例=${winShape[0]}`);
else console.log(`  OK  入賞形の発生: 0`);
if (safe.tempais.length) ng(`ハズレなのに生きたテンパイ: ${safe.tempais.length}件 例=${safe.tempais[0]}`);
else console.log(`  OK  生きたテンパイの発生: 0（ガセテンパイなし）`);
if (safe.some(isReachMoku)) ng('ハズレでリーチ目が出現している（リーチ目の信頼性が崩壊する）');
else console.log('  OK  リーチ目の出現: 0（＝リーチ目はボーナス成立時のみ）');

// --- 3. ボーナス成立ゲームのリーチ目 ---
console.log('\n[3] ボーナス成立ゲーム(REACH)のリーチ目');
const reach = allOutcomes(makePlan('SOLO_BIG', { justWon: true }));
const notReach = reach.filter((m) => !isReachMoku(m));
if (notReach.length) ng(`リーチ目にならない出目: ${notReach.length}件 例=${notReach[0]}`);
else console.log(`  OK  ${reach.length}通りすべてリーチ目`);
const kinds = new Set(reach.map((m) => m.join('-')));
console.log(`  リーチ目の種類数: ${kinds.size} 通り  ${kinds.size >= 100 ? '(仕様書§6.2の目標を満たす)' : '(要拡充)'}`);
console.log(`  例: ${[...kinds].slice(0, 5).join(' / ')}`);

// --- 4. ボーナス入賞ゲーム ---
console.log('\n[4] ボーナス入賞(ALIGN)');
for (const [kind, sym] of [['BIG','red7'],['REG','bar']]) {
  const res = allOutcomes(makePlan('HAZURE', { align: kind }));
  const bad = res.filter((m) => !eq(m, sym, sym, sym));
  if (bad.length) ng(`${kind}: ${bad.length}件が非入賞 例=${bad[0]}`);
  else console.log(`  OK  ${kind} ${res.length}通りすべて ${sym} 揃い`);
}

console.log(fail === 0 ? '\n✅ 全項目パス' : `\n❌ ${fail}件のNG`);
process.exit(fail === 0 ? 0 : 1);
