/**
 * リール制御（仕様書 §6）
 * 純粋関数のみ。DOM・演出・音に依存しないこと（テスト・シミュレーターから直接呼ぶため）。
 *
 * 方式:
 *   - レバーオン時に makePlan() で停止プラン（各リールの狙い）を決定
 *   - 停止操作ごとに controlStop() が「押下位置から最大4コマすべり」の範囲で停止位置を返す
 *   - 現状はオートビタ（入賞目標はすべり上限を超えて全周引き込み = assist）。
 *     手動目押しモードを実装するときは assist を切り、届かない場合の「こぼし」を実装すること
 *
 * リーチ目の設計（A+AT機の肝）:
 *   通常時ハズレ(SAFE)では左リール中段に 7 / BAR / チェリー を絶対に停止させない。
 *   したがって「左中段に 7 or BAR が停止し、かつ何も入賞していない出目」は
 *   ボーナス成立ゲーム(REACH)でしか出現しない = リーチ目。
 *   （左7/BAR × 中バラケ × 右バラケ の組合せで数十〜数百通りが自然発生する）
 */

/** リール配列（21コマ×3）。UI もここから参照する（重複定義禁止） */
export const STRIP = [
  ["red7","bell","replay","melon","bell","star","cherry","replay","bell","blue7","replay","bell","melon","cherry","bell","replay","bar","bell","replay","star","bell"],
  ["red7","bell","replay","melon","bell","replay","star","bell","bar","replay","bell","melon","replay","bell","blue7","bell","replay","star","bell","replay","melon"],
  ["bar","bell","replay","melon","bell","replay","star","bell","red7","replay","bell","blue7","replay","bell","melon","bell","replay","star","bell","replay","melon"],
];
export const REEL_LEN = 21;

/** 最大すべりコマ数（実機準拠） */
export const SLIP_MAX = 4;

/**
 * 入賞ライン（中段1ライン）で「揃ってよい形」の全リスト。
 * ここに無い並びはすべて「出目」であり、payout は発生しない。
 * ハズレ制御はこのリストの完成形・テンパイ形の両方を回避する。
 */
export const WIN_PATTERNS = [
  ["replay", "replay", "replay"],
  ["bell", "bell", "bell"],
  ["melon", "melon", "melon"],
  ["star", "star", "star"],   // リーチ目役（1枚）
  ["star", "star", "bar"],    // 1枚役
  ["red7", "red7", "red7"],   // BIG
  ["red7", "red7", "blue7"],  // 異色BIG
  ["bar", "bar", "bar"],      // REG
];

/** 通常時ハズレで左中段に置いてはならない図柄（リーチ目・チェリー誤認の防止） */
const LEFT_BAN = ["red7", "blue7", "bar", "cherry"];

/** ボーナス絵柄（リーチ目の左停止候補） */
const BONUS_SYMS = ["red7", "blue7", "bar"];

const norm = (p) => ((p % REEL_LEN) + REEL_LEN) % REEL_LEN;
const symAt = (reel, pos) => STRIP[reel][norm(pos)];

/**
 * 停止プランの決定（レバーオン時に1回呼ぶ）
 * @param {string} flag   成立フラグ
 * @param {object} opt
 * @param {boolean} opt.justWon  このゲームでボーナスが「成立」したか（持ち越し初日）
 * @param {?string} opt.align    'BIG'|'REG' なら入賞ゲーム（内部中×ハズレ）
 * @returns {{mode:string, targets:Array<{want?:string[], avoid?:string[]}>}}
 *   mode: WIN=入賞 / ALIGN=ボーナス入賞 / REACH=リーチ目 / SAFE=通常ハズレ出目
 */
export function makePlan(flag, { justWon = false, align = null } = {}) {
  const W = (...syms) => ({ want: syms });
  const A = (...syms) => ({ avoid: syms });

  if (align) {
    return align === "BIG"
      ? { mode: "ALIGN", targets: [W("red7"), W("red7"), W("red7")] }
      : { mode: "ALIGN", targets: [W("bar"), W("bar"), W("bar")] };
  }
  if (flag === "REPLAY") return { mode: "WIN", targets: [W("replay"), W("replay"), W("replay")] };
  if (flag.startsWith("BELL")) return { mode: "WIN", targets: [W("bell"), W("bell"), W("bell")] };
  if (flag.startsWith("MELON")) return { mode: "WIN", targets: [W("melon"), W("melon"), W("melon")] };
  if (flag.startsWith("CHERRY")) return { mode: "WIN", targets: [W("cherry"), A(), A()] };
  if (flag.startsWith("ONE_COIN")) return { mode: "WIN", targets: [W("star"), W("star"), W("bar")] };
  if (flag.startsWith("RIICHI")) return { mode: "WIN", targets: [W("star"), W("star"), W("star")] };
  if (flag.startsWith("SOLO") && justWon) {
    // 単独ボーナス成立ゲーム: リーチ目を出す（左に7/BAR + 非入賞形）
    return { mode: "REACH", targets: [W(...BONUS_SYMS), A(), A()] };
  }
  // 通常時ハズレ / 内部中の小役なしゲームの前段
  return { mode: "SAFE", targets: [A(...LEFT_BAN), A(), A()] };
}

/**
 * 候補図柄を置いたとき「入賞形」または「入賞形への生きたテンパイ」になるか。
 * 2リール以上確定した時点からチェックする（第1停止は自由）。
 */
function makesWinShape(reel, sym, stoppedMids) {
  const mids = [...stoppedMids];
  mids[reel] = sym;
  if (mids.filter(Boolean).length < 2) return false;
  // 確定済みの図柄がすべてパターンと一致するなら、その形は入賞に到達し得る
  return WIN_PATTERNS.some((p) => [0, 1, 2].every((i) => !mids[i] || mids[i] === p[i]));
}

/**
 * 停止位置の決定（純粋関数）
 * @param {number} reel        0-2
 * @param {number} push        押下位置（この位置の図柄が「今中段にある」状態で押した）
 * @param {object} plan        makePlan() の戻り値
 * @param {Array<?string>} stoppedMids 停止済みリールの中段図柄（未停止は null）
 * @param {boolean} assist     true=オートビタ（4コマを超えて引き込む）
 * @returns {number} 中段に停止させる配列インデックス
 */
export function controlStop(reel, push, plan, stoppedMids = [null, null, null], assist = true) {
  const t = plan.targets[reel];

  if (t.want) {
    // 引き込み: リプレイ＞小役＞ボーナス の優先はフラグ決定時点で1目標に解決済み
    for (let s = 0; s <= SLIP_MAX; s++) {
      if (t.want.includes(symAt(reel, push + s))) return norm(push + s);
    }
    if (assist) {
      // オートビタ: 全周から最短の目標を探す（手動目押し実装時はここを通さず「こぼし」に）
      for (let s = SLIP_MAX + 1; s < REEL_LEN; s++) {
        if (t.want.includes(symAt(reel, push + s))) return norm(push + s);
      }
    }
    return norm(push); // 目標が配列に存在しない場合のみ（設計上起きない）
  }

  // 回避モード: 4コマ以内で 禁止図柄・入賞形・テンパイ を避ける
  for (let s = 0; s <= SLIP_MAX; s++) {
    const sym = symAt(reel, push + s);
    if (t.avoid.includes(sym)) continue;
    if (makesWinShape(reel, sym, stoppedMids)) continue;
    return norm(push + s);
  }
  // 完全回避が不可能な窓（配列上ほぼ無い）: 禁止図柄の回避だけは死守する
  for (let s = 0; s <= SLIP_MAX; s++) {
    const sym = symAt(reel, push + s);
    if (!t.avoid.includes(sym)) return norm(push + s);
  }
  return norm(push);
}

/** 出目がリーチ目か（左中段7/BAR かつ 非入賞形）。演出・デバッグ用 */
export function isReachMoku(mids) {
  if (!BONUS_SYMS.includes(mids[0])) return false;
  return !WIN_PATTERNS.some((p) => [0, 1, 2].every((i) => mids[i] === p[i]));
}
