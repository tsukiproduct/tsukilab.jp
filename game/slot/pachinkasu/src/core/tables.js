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
  /* ---- ベル（仕様書§3.1）----
     押し順ベルは「メインは常に成立させ、ナビの有無で取れるかが変わる」というAT機の芯。
     ナビ無し（通常時）は3択なので 1/3 でしか正解せず、外すと1枚こぼす。
     AT中はナビが出るので必ず正解する。この差が純増の正体。

     カウント値は「通常時とAT中のベル払い出しを、押し順ベル導入前と同じに保つ」よう決めた。
       通常時 = C×8 + P×(8+1+1)/3 = C×8 + P×3.333
       AT中   = C×8 + P×8
     旧実装（BELL 10000・通常8枚/AT11枚）の 80,000 と 110,000 に一致させると
       P×4.667 = 30,000 → P = 6428 ／ C×8 = 80,000 - 21,427 → C = 7322
     これで機械割を動かさずに、AT中ベルの11枚という作り物を排除できる。 */
  BELL_COMMON:  [7322, 7322, 7322, 7322, 7322, 7322],   // 押し順不問（8枚）
  BELL_PUSH:    [6428, 6428, 6428, 6428, 6428, 6428],   // 3択。正解8枚／不正解1枚
  MELON_WEAK:   [520, 520, 520, 520, 520, 520],   // 弱スイカ（右下がり）
  MELON_STRONG: [126, 126, 126, 126, 126, 126],   // 強スイカ（中段揃い）
  /* ---- チェリー（出目で3段階）----
     単チェリー=角 / 強チェリー=中段 / 3連チェリー=左窓すべてチェリー。
     ボーナス重複（CHERRY_BIG/CHERRY_REG）は「中段チェリー＋右リール中段BAR」で出す＝
     この形が見えたらボーナス濃厚。合計は据え置き（1600+40+24）なので機械割は動かない。 */
  CHERRY_WEAK:   [1300, 1300, 1300, 1300, 1300, 1300],  // 単チェリー（角）
  CHERRY_STRONG: [260, 260, 260, 260, 260, 260],        // 強チェリー（中段）
  CHERRY_TRIPLE: [40, 40, 40, 40, 40, 40],              // 3連チェリー
  ONE_COIN:     [260, 270, 280, 300, 320, 340],
  CHERRY_BIG:   [40, 41, 42, 44, 46, 48],   // 中段チェリー＋右中段BAR（ボーナス濃厚）
  CHERRY_REG:   [24, 28, 32, 40, 48, 64],   // 同上。★主要な設定推測要素
  MELON_BIG:    [30, 30, 31, 32, 33, 34],
  MELON_REG:    [16, 17, 18, 20, 22, 24],
  ONE_COIN_BIG: [40, 41, 42, 43, 44, 46],
  RIICHI_BIG:   [80, 82, 84, 86, 89, 92],
  RIICHI_REG:   [24, 26, 28, 32, 36, 40],
  SOLO_BIG:     [90, 91, 93, 95, 98, 100],
  SOLO_REG:     [80, 89, 102, 108, 118, 100], // ★最大の設定差（設定6は上乗せ追加に伴い引き下げ）
};

/** 二次抽選（AT・演出系）は分母256で統一する（仕様書 §5.6） */
export const SUB_DENOM = 256;
export const SUB_TABLE = {
  FREEZE_ON_BIG: 4,         // 1/64
  AT_ON_REG: 16,            // 1/16

  /* ---- AT中のレア役上乗せ（仕様書§8.2）----
     スイカは当選しにくいが、当たれば他役より大きく乗る。
     強スイカは「なかなか乗らないが乗れば50G以上」を担う目玉。 */
  AT_UP_CHERRY: 64,         // 1/4
  AT_UP_ONE_COIN: 128,      // 1/2
  AT_UP_MELON_WEAK: 32,     // 1/8
  AT_UP_MELON_STRONG: 128,  // 1/2

  /** 中段チェリー＋BAR（CHERRY_BIG）のときのフリーズ。出目が見えた時点で激アツ */
  FREEZE_ON_MID_CHERRY: 64,  // 1/4

  /* ---- エンペラータイム（特化ゾーン）----
     ビタ押し3回成功でのAT当選は濃厚、それ以外は EMPEROR_ON_AT で抽選 */
  EMPEROR_ON_AT: 32,        // 1/8
  EMPEROR_CONTINUE: 205,    // 約80%（平均5連）
};

/** AT中のレア役上乗せG数。上の当選率とセットで使う */
export const AT_UP_G = {
  CHERRY: 10,
  ONE_COIN: 20,
  MELON_WEAK: 30,
  MELON_STRONG: [50, 70, 100],  // 均等抽選（期待値 約73G）
};

/** エンペラータイム: 1回の勝利で乗るG数 */
export const EMPEROR_UP_G = 20;

/** AT初期ゲーム数。上乗せを足したぶん、素の値は下げてある（§10.3の調整手順） */
export const AT_INIT_G = { BIG: 20, REG: 16 };

/** 押し順ベルの選択肢数（第一停止のリール3択） */
export const BELL_ORDERS = 3;
/** 押し順ベル: 正解／不正解の払い出し */
export const BELL_PUSH_PAY = { ok: 8, ng: 1 };
/** 変則押しのペナルティゲーム数（この間はAT中でもナビを出さない） */
export const PENALTY_GAMES = 3;

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
