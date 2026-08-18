/**
 * 抽選エンジン（仕様書 §5.1 / §5.2）
 * この層は純粋関数のみ。DOM・演出・音に一切依存しないこと（シミュレーターから直接呼ぶため）。
 */
import { TABLE, DENOM, SUB_DENOM, SUB_TABLE, AT_UP_G } from './tables.js';

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

/** その役が「強スイカ」扱いか（弱スイカ以外のスイカ＝重複含む）。演出と上乗せの出し分けに使う */
export const isStrongMelon = (f) => f.startsWith('MELON') && f !== 'MELON_WEAK';

/**
 * AT中のレア役上乗せ抽選（仕様書§8.2）
 * スイカは当選しにくいぶん、当たれば大きい。強スイカは50G以上が確定する。
 * @returns {number} 上乗せゲーム数（0=非当選）
 */
export function drawATUpgrade(flag) {
  if (flag.startsWith('CHERRY')) {
    return subLottery(SUB_TABLE.AT_UP_CHERRY) ? AT_UP_G.CHERRY : 0;
  }
  if (flag.startsWith('ONE_COIN')) {
    return subLottery(SUB_TABLE.AT_UP_ONE_COIN) ? AT_UP_G.ONE_COIN : 0;
  }
  if (flag === 'MELON_WEAK') {
    return subLottery(SUB_TABLE.AT_UP_MELON_WEAK) ? AT_UP_G.MELON_WEAK : 0;
  }
  if (isStrongMelon(flag)) {
    if (!subLottery(SUB_TABLE.AT_UP_MELON_STRONG)) return 0;
    const t = AT_UP_G.MELON_STRONG;
    return t[rnd16() % t.length];
  }
  return 0;
}
