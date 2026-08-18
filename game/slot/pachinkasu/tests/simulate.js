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
 *   - BIG終了時: AT中なら+30G固定。非AT中は VITA_AT_RATE[0]+設定×0.4% で突入、
 *     初期 AT_INIT_G.BIG + ビタ獲得分（技術介入なし想定: ビタ3回全失敗＝救済+2G×3）
 *   - フリーズ(1/64): AT確定+50G
 *   - REG中: 1/16でAT（初期 AT_INIT_G.REG）
 *   - AT中: 押し順ベルを必ず正解（通常時は1/3）、レア役で上乗せ(drawATUpgrade)、
 *     完走(AT開始差枚+2400 or 1500G)
 *   - エンペラータイム: AT当選時に1/8（ビタ3回成功なら濃厚だが技術介入なし想定なので抽選のみ）。
 *     継続率約80%で1勝ごとに+20G
 *
 * 合格基準:
 *   - 各役の出現率が理論値と有意差なし
 *   - 機械割の目標: 設定1 ≒95.2% / 設定6 ≒102.9%（技術介入なし・仕様書§10.2）
 */
import { drawFlag, isBigFlag, isRegFlag, payoutOf, drawATUpgrade } from '../src/core/lottery.js';
import { BELL_ORDERS } from '../src/core/tables.js';
import { TABLE, DENOM, SUB_TABLE, SUB_DENOM, AT_INIT_G, EMPEROR_UP_G, probabilities, assertTables } from '../src/core/tables.js';

assertTables();

const N = Number(process.argv[2] || 1_000_000);
const BIG_PAY = 204, REG_PAY = 60;      // 実装 startBonus の払い出し
const VITA_FAIL_G = 6;                  // 救済+2G×3（技術介入なし＝ビタ全外し）
// ビタ押し成功回数ごとのAT当選率（main.js の VITA_AT_RATE と一致させること）。
// このシミュレーションは技術介入なし＝成功0回として VITA_AT_RATE[0] を使う
const AT_RATE_VITA0 = 0.40;
const FREEZE_RATE = 4 / 256;            // SUB_TABLE.FREEZE_ON_BIG
const FREEZE_BONUS_G = 50;
const AT_ON_REG_RATE = SUB_TABLE.AT_ON_REG / SUB_DENOM;
const EMPEROR_RATE = SUB_TABLE.EMPEROR_ON_AT / SUB_DENOM;
const EMPEROR_CONT = SUB_TABLE.EMPEROR_CONTINUE / SUB_DENOM;

/** エンペラータイム: 勝ち続ける限り+20G。突入時に一括で消化ゲーム数を確定させる */
function emperorGain() {
  let g = 0;
  while (Math.random() < EMPEROR_CONT) g += EMPEROR_UP_G;
  return g;
}
/** AT突入時の初期ゲーム数（エンペラータイム抽選込み） */
function atStartG(base) {
  return base + (Math.random() < EMPEROR_RATE ? emperorGain() : 0);
}

console.log(`=== ${N.toLocaleString()} ゲーム シミュレーション（実装準拠モデル） ===\n`);

for (let setting = 1; setting <= 6; setting++) {
  let coinsIn = 0, coinsOut = 0, big = 0, reg = 0;
  let carry = null, replayNext = false;
  let atG = 0, atRunDiffStart = 0, atRunG = 0, diff = 0;
  let atEnter = 0, atGamesTotal = 0, emperor = 0, upG = 0;

  for (let g = 0; g < N; g++) {
    const inAT = atG > 0;
    if (!replayNext) { coinsIn += 3; diff -= 3; }
    replayNext = false;
    if (inAT) { atG--; atRunG++; atGamesTotal++; }

    const flag = drawFlag(setting, !!carry);
    /* 押し順ベル: AT中はナビが出るので必ず正解。通常時はナビが無く、
       左から打つ定石だと正解リールが左のときだけ当たる＝1/3。
       これがAT（アシストタイム）の純増の正体で、払い出し自体は通常時と同じ。 */
    const pushOk = flag === 'BELL_PUSH' && (inAT || Math.random() < 1 / BELL_ORDERS);
    const p = payoutOf(flag, { pushOk });
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
          // 技術介入なし＝ビタ全外しなので VITA_AT_RATE[0] を使う
          const rate = AT_RATE_VITA0 + (setting - 1) * 0.004;
          if (freeze || Math.random() < rate) {
            const emp = Math.random() < EMPEROR_RATE ? emperorGain() : 0;
            if (emp) emperor++;
            atG = AT_INIT_G.BIG + VITA_FAIL_G + (freeze ? FREEZE_BONUS_G : 0) + emp;
            atEnter++; atRunG = 0; atRunDiffStart = diff;
          }
        }
      } else {
        reg++; coinsOut += REG_PAY; diff += REG_PAY;
        if (atG <= 0 && Math.random() < AT_ON_REG_RATE) {
          atG = atStartG(AT_INIT_G.REG); atEnter++; atRunG = 0; atRunDiffStart = diff;
        }
      }
      carry = null;
    }

    // AT中のレア役上乗せ（実装と同じ drawATUpgrade を通す）
    if (inAT) { const up = drawATUpgrade(flag); if (up) { atG += up; upG += up; } }
    // 完走（AT開始からの差枚+2400 or 1500G）
    if (atG > 0 && (diff - atRunDiffStart >= 2400 || atRunG >= 1500)) atG = 0;
  }

  const th = probabilities(setting);
  const rate = (coinsOut / coinsIn) * 100;
  console.log(
    `設定${setting}: 機械割 ${rate.toFixed(2)}%  ` +
    `BIG 1/${(N / big).toFixed(1)} (理論1/${th.bigRate.toFixed(1)})  ` +
    `REG 1/${(N / reg).toFixed(1)} (理論1/${th.regRate.toFixed(1)})  ` +
    `AT突入${atEnter}回・平均${(atGamesTotal / Math.max(1, atEnter)).toFixed(1)}G` +
    `・上乗せ計${upG}G・エンペラー${emperor}回`
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
