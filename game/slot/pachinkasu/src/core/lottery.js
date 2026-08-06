/**
 * 抽選エンジン（仕様書 §5.1 / §5.2）
 * この層は純粋関数のみ。DOM・演出・音に一切依存しないこと（シミュレーターから直接呼ぶため）。
 */
import { TABLE, DENOM, SUB_DENOM } from './tables.js';

/** 16bit一様乱数。Math.randomの下位ビット偏りを避けるためcryptoを使う */
export function rnd16() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint16Array(1))[0];
  }
  // Node環境のフォールバック（シミュレーター用）
  return Math.floor(Math.random() * DENOM);
}

/** 二次抽選（分母256）。当選ならtrue */
export function subLottery(count) {
  return (rnd16() % SUB_DENOM) < count;
}

/**
 * 成立役抽選（減算方式）
 * @param {number} setting 1-6
 * @param {boolean} carrying ボーナス持ち越し中か（trueなら内部中テーブル＝ボーナス行をハズレに置換）
 * @param {number} [forcedRnd] テスト用に乱数を外から与える
 * @returns {string} フラグ名
 */
export function drawFlag(setting, carrying = false, forcedRnd) {
  let r = forcedRnd !== undefined ? forcedRnd : rnd16();
  for (const key of Object.keys(TABLE)) {
    if (carrying && isBonusFlag(key)) continue; // 内部中: ボーナス行はスキップ＝ハズレに吸収
    r -= TABLE[key][setting - 1];
    if (r < 0) return key;
  }
  return 'HAZURE';
}

export const isBigFlag = (f) => /BIG/.test(f);
export const isRegFlag = (f) => /REG$/.test(f);
export const isBonusFlag = (f) => isBigFlag(f) || isRegFlag(f);

/** 小役の払い出し枚数（AT中のベルはナビ成功で11枚） */
export function payoutOf(flag, inAT = false) {
  if (flag === 'REPLAY') return { coins: 0, replay: true };
  if (flag.startsWith('BELL')) return { coins: inAT ? 11 : 8, replay: false };
  if (flag.startsWith('MELON')) return { coins: 15, replay: false };
  if (flag.startsWith('CHERRY')) return { coins: 2, replay: false };
  if (flag.startsWith('ONE_COIN') || flag.startsWith('RIICHI')) return { coins: 1, replay: false };
  return { coins: 0, replay: false };
}
