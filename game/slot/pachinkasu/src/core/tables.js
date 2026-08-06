/**
 * 内部抽選テーブル（仕様書 §5.3）
 * すべて「65536中のカウント値」。実機と同じ16bit乱数・減算方式で参照する。
 *
 * 【重要】数値を変更したら必ず tests/simulate.js を実行し、
 *         機械割が目標値（設定1 ≒95.2% / 設定6 ≒102.9%）から外れていないか確認すること。
 */
export const DENOM = 65536;

/** フラグ定義順 = 減算の走査順。この順序自体に意味はないが、変更時は必ず全体を通すこと */
export const TABLE = {
  REPLAY:       [8978, 8978, 8978, 8978, 8978, 8978],
  BELL:         [10000, 10000, 10000, 10000, 10000, 10000],
  MELON:        [646, 646, 646, 646, 646, 646],
  CHERRY:       [1600, 1600, 1600, 1600, 1600, 1600],
  ONE_COIN:     [260, 270, 280, 300, 320, 340],
  CHERRY_BIG:   [40, 41, 42, 44, 46, 48],
  CHERRY_REG:   [24, 28, 32, 40, 48, 64],   // ★主要な設定推測要素
  MELON_BIG:    [30, 30, 31, 32, 33, 34],
  MELON_REG:    [16, 17, 18, 20, 22, 24],
  ONE_COIN_BIG: [40, 41, 42, 43, 44, 46],
  RIICHI_BIG:   [80, 82, 84, 86, 89, 92],
  RIICHI_REG:   [24, 26, 28, 32, 36, 40],
  SOLO_BIG:     [90, 91, 93, 95, 98, 100],
  SOLO_REG:     [80, 89, 102, 108, 118, 128], // ★最大の設定差
};

/** 二次抽選（AT・演出系）は分母256で統一する（仕様書 §5.6） */
export const SUB_DENOM = 256;
export const SUB_TABLE = {
  FREEZE_ON_BIG: 4,        // 1/64
  AT_ON_REG: 16,           // 1/16
  MELON_UPGRADE_IN_AT: 128, // 50%
};

/** 起動時検証: 全設定でカウント合計が65536を超えないこと（残りはハズレ） */
export function assertTables() {
  for (let s = 0; s < 6; s++) {
    let sum = 0;
    for (const k of Object.keys(TABLE)) sum += TABLE[k][s];
    if (sum > DENOM) throw new Error(`テーブル超過: 設定${s + 1} 合計${sum}`);
  }
  return true;
}

/** 表示用の確率を導出（データ画面・仕様書検算に使用） */
export function probabilities(setting) {
  const s = setting - 1;
  const sumOf = (re) =>
    Object.keys(TABLE).filter((k) => re.test(k)).reduce((a, k) => a + TABLE[k][s], 0);
  const big = sumOf(/BIG/);
  const reg = sumOf(/REG$/);
  return {
    big, reg,
    bigRate: DENOM / big,
    regRate: DENOM / reg,
    totalRate: DENOM / (big + reg),
  };
}
