/**
 * モンテカルロ検証（仕様書 §10.3 / §15）
 * 実行: node tests/simulate.js [ゲーム数]
 *
 * 【重要】このシミュレーターは src/ui/main.js の実装と同じ遷移をなぞる。
 *   実装を変えたらここも合わせること（乖離した瞬間に検証の意味がなくなる）。
 *
 * モデル化している実装挙動:
 *   - ボーナス成立 → 持ち越し → 内部中ハズレのゲームで入賞（そのGのBET3枚は消費・払い出しなし）
 *   - BIG=204枚 / REG=60枚 加算（入賞Gとは別に払い出しのみ）
 *   - BIG終了時: AT中なら+30G固定。非AT中は 50%+設定×0.4% で突入、初期40G+ビタ獲得分
 *     （技術介入なし想定: ビタ3回全て失敗＝救済+2G×3。成功時の確定フローは含めない）
 *   - フリーズ(1/64): AT確定+50G（実装 runBonus 参照）
 *   - REG中: 1/16でAT+30G
 *   - AT中: ベル+3枚(ナビ11枚)、スイカ50%で+10G、完走(AT開始差枚+2400 or 1500G)
 *
 * 合格基準:
 *   - 各役の出現率が理論値と有意差なし
 *   - 機械割の目標: 設定1 ≒95.2% / 設定6 ≒102.9%（技術介入なし・仕様書§10.2）
 */
import { drawFlag, isBigFlag, isRegFlag, payoutOf } from '../src/core/lottery.js';
import { TABLE, DENOM, probabilities, assertTables } from '../src/core/tables.js';

assertTables();

const N = Number(process.argv[2] || 1_000_000);
const BIG_PAY = 204, REG_PAY = 60;      // 実装 runBonus の払い出し
const VITA_FAIL_G = 6;                  // 救済+2G×3（技術介入なし）
const FREEZE_RATE = 4 / 256;            // SUB_TABLE.FREEZE_ON_BIG
const FREEZE_BONUS_G = 50;
const AT_ON_REG_RATE = 16 / 256;        // SUB_TABLE.AT_ON_REG
const MELON_UP_RATE = 128 / 256;        // SUB_TABLE.MELON_UPGRADE_IN_AT

console.log(`=== ${N.toLocaleString()} ゲーム シミュレーション（実装準拠モデル） ===\n`);

for (let setting = 1; setting <= 6; setting++) {
  let coinsIn = 0, coinsOut = 0, big = 0, reg = 0;
  let carry = null, replayNext = false;
  let atG = 0, atRunDiffStart = 0, atRunG = 0, diff = 0;
  let atEnter = 0, atGamesTotal = 0;

  for (let g = 0; g < N; g++) {
    const inAT = atG > 0;
    if (!replayNext) { coinsIn += 3; diff -= 3; }
    replayNext = false;
    if (inAT) { atG--; atRunG++; atGamesTotal++; }

    const flag = drawFlag(setting, !!carry);
    const p = payoutOf(flag, inAT); // AT中ベルはナビ成功前提で11枚（実装と同じ）
    coinsOut += p.coins; diff += p.coins;
    if (p.replay) replayNext = true;

    if (!carry && isBigFlag(flag)) carry = 'BIG';
    else if (!carry && isRegFlag(flag)) carry = 'REG';
    else if (carry && flag === 'HAZURE') {
      // 入賞ゲーム: 払い出しなし、次のループで通常に戻る
      if (carry === 'BIG') {
        big++; coinsOut += BIG_PAY; diff += BIG_PAY;
        const freeze = Math.random() < FREEZE_RATE;
        if (atG > 0) { atG += 30; }
        else {
          const rate = 0.50 + (setting - 1) * 0.004;
          if (freeze || Math.random() < rate) {
            atG = 40 + VITA_FAIL_G + (freeze ? FREEZE_BONUS_G : 0);
            atEnter++; atRunG = 0; atRunDiffStart = diff;
          }
        }
      } else {
        reg++; coinsOut += REG_PAY; diff += REG_PAY;
        if (atG <= 0 && Math.random() < AT_ON_REG_RATE) { atG = 30; atEnter++; atRunG = 0; atRunDiffStart = diff; }
      }
      carry = null;
    }

    // AT中スイカ上乗せ
    if (inAT && flag.startsWith('MELON') && Math.random() < MELON_UP_RATE) atG += 10;
    // 完走（AT開始からの差枚+2400 or 1500G）
    if (atG > 0 && (diff - atRunDiffStart >= 2400 || atRunG >= 1500)) atG = 0;
  }

  const th = probabilities(setting);
  const rate = (coinsOut / coinsIn) * 100;
  console.log(
    `設定${setting}: 機械割 ${rate.toFixed(2)}%  ` +
    `BIG 1/${(N / big).toFixed(1)} (理論1/${th.bigRate.toFixed(1)})  ` +
    `REG 1/${(N / reg).toFixed(1)} (理論1/${th.regRate.toFixed(1)})  ` +
    `AT突入${atEnter}回・平均${(atGamesTotal / Math.max(1, atEnter)).toFixed(1)}G`
  );
}

// 役別分布の検定（設定1）
console.log('\n=== 設定1 役別出現率 (実測 vs 理論) ===');
const counts = {};
for (let i = 0; i < N; i++) {
  const f = drawFlag(1, false);
  counts[f] = (counts[f] || 0) + 1;
}
for (const k of Object.keys(TABLE)) {
  const actual = N / (counts[k] || 1);
  const theory = DENOM / TABLE[k][0];
  const diff = ((actual - theory) / theory) * 100;
  const mark = Math.abs(diff) < 5 ? 'OK' : '要確認';
  console.log(`  ${k.padEnd(13)} 1/${actual.toFixed(1).padStart(7)} (理論 1/${theory.toFixed(1)}) ${mark}`);
}
