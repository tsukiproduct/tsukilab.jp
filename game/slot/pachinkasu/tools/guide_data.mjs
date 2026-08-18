/**
 * 攻略ページ用のデータを実テーブルから算出する。
 * 手打ちの数値を載せると tables.js を変えたときに嘘になるため、必ずここを通す。
 *
 *   node tools/guide_data.mjs        # 数値を確認
 *   node tools/gen_guide.mjs         # HTMLを生成
 */
import { TABLE, DENOM, probabilities } from '../src/core/tables.js';
import { STRIP, REEL_LEN } from '../src/core/reelControl.js';

export const SETTINGS = [1, 2, 3, 4, 5, 6];

/** 小役グループ: 表示名 → そのグループを構成するフラグ名 */
export const ROLE_GROUPS = {
  'リプレイ':   ['REPLAY'],
  'ベル':       ['BELL'],
  '弱スイカ':   ['MELON_WEAK'],
  '強スイカ':   ['MELON_STRONG', 'MELON_BIG', 'MELON_REG'],
  'チェリー':   ['CHERRY', 'CHERRY_BIG', 'CHERRY_REG'],
  '1枚役':      ['ONE_COIN', 'ONE_COIN_BIG'],
  'リーチ目役': ['RIICHI_BIG', 'RIICHI_REG'],
};

/** レア役ごとの「引いたときボーナスも一緒に成立している割合」 */
export const RARE_ROLES = {
  '弱スイカ':   { all: ['MELON_WEAK'], big: [], reg: [] },
  '強スイカ':   { all: ['MELON_STRONG', 'MELON_BIG', 'MELON_REG'], big: ['MELON_BIG'], reg: ['MELON_REG'] },
  'チェリー':   { all: ['CHERRY', 'CHERRY_BIG', 'CHERRY_REG'], big: ['CHERRY_BIG'], reg: ['CHERRY_REG'] },
  '1枚役':      { all: ['ONE_COIN', 'ONE_COIN_BIG'], big: ['ONE_COIN_BIG'], reg: [] },
  'リーチ目役': { all: ['RIICHI_BIG', 'RIICHI_REG'], big: ['RIICHI_BIG'], reg: ['RIICHI_REG'] },
};

const sum = (keys, s) => keys.reduce((a, k) => a + TABLE[k][s - 1], 0);
/** 1/N 表記。0なら「－」 */
export const rate = (count) => count > 0 ? `1/${(DENOM / count).toFixed(1)}` : '－';
export const pct = (n, d) => d > 0 ? `${(n / d * 100).toFixed(1)}%` : '－';

export function roleRates(setting) {
  const out = {};
  for (const [label, keys] of Object.entries(ROLE_GROUPS)) out[label] = rate(sum(keys, setting));
  return out;
}

export function bonusRates(setting) {
  const th = probabilities(setting);
  return {
    big: `1/${th.bigRate.toFixed(1)}`,
    reg: `1/${th.regRate.toFixed(1)}`,
    total: `1/${th.totalRate.toFixed(1)}`,
  };
}

export function rareExpectation(setting) {
  const out = {};
  for (const [label, g] of Object.entries(RARE_ROLES)) {
    const all = sum(g.all, setting), big = sum(g.big, setting), reg = sum(g.reg, setting);
    out[label] = {
      rate: rate(all),
      big: pct(big, all), reg: pct(reg, all), total: pct(big + reg, all),
      totalRaw: (big + reg) / all,
    };
  }
  return out;
}

/** リール配列（図柄IDを日本語表示名に） */
export const SYM_LABEL = {
  red7: '赤7', blue7: '青7', bar: 'BAR', replay: 'リプレイ',
  bell: 'ベル', melon: 'スイカ', cherry: 'チェリー', star: '星',
};
export function reelTable() {
  const rows = [];
  for (let i = 0; i < REEL_LEN; i++) rows.push([i, ...STRIP.map(s => s[i])]);
  return rows;
}
export function symbolCounts() {
  const out = {};
  for (const key of Object.keys(SYM_LABEL)) {
    out[key] = STRIP.map(s => s.filter(x => x === key).length);
  }
  return out;
}

// 直接実行されたときは数値を表示して確認できるようにする
import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('=== ボーナス確率 ===');
  for (const s of SETTINGS) {
    const b = bonusRates(s);
    console.log(`  設定${s}: BIG ${b.big} / REG ${b.reg} / 合算 ${b.total}`);
  }
  console.log('\n=== 通常時の小役 (設定1) ===');
  for (const [k, v] of Object.entries(roleRates(1))) console.log(`  ${k.padEnd(12)} ${v}`);
  console.log('\n=== レア役のボーナス期待度 (設定1) ===');
  for (const [k, v] of Object.entries(rareExpectation(1)))
    console.log(`  ${k.padEnd(12)} ${v.rate}  BIG ${v.big} / REG ${v.reg} / 合算 ${v.total}`);
  console.log('\n=== 図柄配置数 (左/中/右) ===');
  for (const [k, v] of Object.entries(symbolCounts()))
    console.log(`  ${SYM_LABEL[k].padEnd(6)} ${v.join(' / ')}`);
}
