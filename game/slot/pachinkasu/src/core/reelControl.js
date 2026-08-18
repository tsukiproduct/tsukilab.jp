/**
 * リール制御（仕様書 §6）
 * 純粋関数のみ。DOM・演出・音に依存しないこと（テスト・シミュレーターから直接呼ぶため）。
 *
 * 方式:
 *   - レバーオン時に makePlan() で停止プラン（狙うライン＋各リールの狙い）を決定
 *   - 停止操作ごとに controlStop() が「押下位置から最大4コマすべり」の範囲で停止位置を返す
 *   - 現状はオートビタ（入賞目標はすべり上限を超えて全周引き込み = assist）。
 *     手動目押しモードを実装するときは assist を切り、届かない場合の「こぼし」を実装すること
 *
 * 有効ラインは5本（中段・上段・下段・右下がり・右上がり）。
 *
 * 【重要】払い出しは「成立役に対して1回」であり、ラインごとには発生しない。
 *   5ラインは出目の表現（弱スイカ＝斜め／強スイカ＝中段、リーチ目の多様化）に使う。
 *   実機はライン毎に払い出すが、そこを合わせるとテーブルのカウント値を全面的に
 *   下げ直す必要があり、機械割の調整が5ライン化と混ざって追えなくなる。
 *   払い出し口は payoutOf() ただ一つに保つこと。
 *
 * リーチ目の設計（A+AT機の肝）:
 *   通常時ハズレ(SAFE)では左リール中段に 7 / BAR を停止させない。
 *   したがって「左中段に 7 or BAR が止まって、かつ何も入賞していない出目」は
 *   ボーナス成立ゲーム(REACH)でしか出現しない = リーチ目。
 *   上段・下段に7/BARが見えること自体は通常時にもある（実機と同じ）。
 */

/* 左リールの 6,7,8 をチェリー3連にしてある（元は cherry/replay/bell）。
   3連チェリー・中段チェリー・角チェリーを出目で撃ち分けるために必要な配置。
   潰したのはリプレイ1コマとベル1コマ（どちらも残数に余裕がある図柄）で、
   星・スイカ・7・BAR には手を付けていない（引き込みが厳しくなるため）。 */
/** リール配列（21コマ×3）。UI もここから参照する（重複定義禁止） */
export const STRIP = [
  ["red7","bell","replay","melon","bell","star","cherry","cherry","cherry","blue7","replay","bell","melon","cherry","bell","replay","bar","bell","replay","star","bell"],
  ["red7","bell","replay","melon","bell","replay","star","bell","bar","replay","bell","melon","replay","bell","blue7","bell","replay","star","bell","replay","melon"],
  ["bar","bell","replay","melon","bell","replay","star","bell","red7","replay","bell","blue7","replay","bell","melon","bell","replay","star","bell","replay","melon"],
];
export const REEL_LEN = 21;

/** 最大すべりコマ数（実機準拠） */
export const SLIP_MAX = 4;

/* すべりの向きについて:
   リールは図柄が下へ流れる＝インデックスが減る向きに回っている（main.js の startSpin）。
   ボタンを押したあともリールは同じ向きに進んでから止まるので、
   停止位置は push - s（sコマ余分に進んだ位置）になる。
   push + s にすると押した瞬間にリールが逆戻りして見えるので変更しないこと。 */

/**
 * 有効ライン。rows[reel] = 0:上段 / 1:中段 / 2:下段
 * 停止インデックス idx のリールは row r に STRIP[idx + r - 1] を表示する
 * （中段=idx、上段=idx-1、下段=idx+1。main.js の drawReel と同じ並び）
 */
export const LINES = [
  { key: "mid",    name: "中段",     rows: [1, 1, 1] },
  { key: "top",    name: "上段",     rows: [0, 0, 0] },
  { key: "bottom", name: "下段",     rows: [2, 2, 2] },
  { key: "down",   name: "右下がり", rows: [0, 1, 2] },
  { key: "up",     name: "右上がり", rows: [2, 1, 0] },
];
export const LINE_MID = 0, LINE_DOWN = 3, LINE_UP = 4;

/**
 * 「揃ってよい形」の全リスト。ここに無い並びはすべて出目であり payout は発生しない。
 * ハズレ制御は全5ラインについて、この完成形・テンパイ形の両方を回避する。
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

/* 通常時ハズレで左リール中段に出してはならない図柄。
   7/BAR: リーチ目（左中段の7/BAR＋非入賞）を作らないため
   チェリー: 中段チェリーは入賞形なので、ハズレで出すと誤認させる

   【3段すべて禁止にしないこと】5ライン化の途中で「上中下すべてで7/BAR禁止」に
   していたが、左リールに3連チェリーを入れた時点で禁止位置が
   {6,7,8,9,10} と5コマ連続になり、4コマすべりでは逃げられなくなった
   （実測: ハズレで2,646回7/BARが露出）。
   リーチ目の定義を左中段に限れば禁止は {0,6,7,8,9,13,16}＝最長4コマ連続に収まる。
   上段・下段に7/BARが見えるのは実機でも日常なので、これで実感も合う。 */
const LEFT_BAN_MID = ["red7", "blue7", "bar", "cherry"];

/** ボーナス絵柄（リーチ目の左停止候補） */
const BONUS_SYMS = ["red7", "blue7", "bar"];

const norm = (p) => ((p % REEL_LEN) + REEL_LEN) % REEL_LEN;
const symAt = (reel, pos) => STRIP[reel][norm(pos)];

/** 停止インデックス idx のリール reel が row に表示する図柄 */
export const symAtRow = (reel, idx, row) => symAt(reel, idx + row - 1);

/** 停止インデックス配列から見える3x3。grid[reel][row]（未停止は null） */
export function gridOf(stops) {
  return [0, 1, 2].map((i) =>
    stops[i] == null ? [null, null, null] : [0, 1, 2].map((r) => symAtRow(i, stops[i], r))
  );
}

/** ライン li に並んだ3図柄 */
export function lineSyms(grid, li) {
  const rows = LINES[li].rows;
  return [0, 1, 2].map((i) => grid[i][rows[i]]);
}

/** そのラインが入賞形か */
const isWinLine = (syms) =>
  WIN_PATTERNS.some((p) => [0, 1, 2].every((i) => syms[i] === p[i]));

/** 入賞しているライン番号の一覧（演出・テスト用） */
export function winningLines(stops) {
  const g = gridOf(stops);
  const out = [];
  for (let li = 0; li < LINES.length; li++) if (isWinLine(lineSyms(g, li))) out.push(li);
  return out;
}

/* ---- チェリーの種類ごとの左リール停止位置 ----
   配列から自動で作る。配列を変えてもここは追従するので、
   停止位置をハードコードしないこと。
   7/BAR が窓に入る位置は除外している（チェリーは入賞形なのでリーチ目にはならないが、
   「7が見えているのに小役」という紛らわしい出目を避けるため）。 */
function cherryStops(pred) {
  const out = [];
  for (let i = 0; i < REEL_LEN; i++) {
    const w = [0, 1, 2].map((r) => symAtRow(0, i, r));
    if (w.some((x) => BONUS_SYMS.includes(x))) continue;
    if (pred(w, w.filter((x) => x === "cherry").length)) out.push(i);
  }
  return out;
}
/** 3連チェリー（左窓すべてチェリー） */
export const CHERRY_STOPS_TRIPLE = cherryStops((w, n) => n === 3);
/** 中段チェリー（中段だけチェリー。2連・3連は含めない） */
export const CHERRY_STOPS_MID = cherryStops((w, n) => n === 1 && w[1] === "cherry");
/** 角チェリー（上段か下段にだけチェリー） */
export const CHERRY_STOPS_CORNER = cherryStops((w, n) => n === 1 && w[1] !== "cherry");

/**
 * 停止プランの決定（レバーオン時に1回呼ぶ）
 * @param {string} flag   成立フラグ
 * @param {object} opt
 * @param {boolean} opt.justWon  このゲームでボーナスが「成立」したか（持ち越し初日）
 * @param {?string} opt.align    'BIG'|'REG' なら入賞ゲーム（内部中×ハズレ）
 * @returns {{mode:string, line:number, targets:Array<object>}}
 *   mode: WIN=入賞 / ALIGN=ボーナス入賞 / REACH=リーチ目 / SAFE=通常ハズレ出目
 *   line: 揃えるライン番号（SAFEでは未使用）
 */
export function makePlan(flag, { justWon = false, align = null } = {}) {
  /** 指定ラインに want を止めるプランを組む */
  /* key には flag を入れる。feasible() のメモ化キーに使う。
     mode と line だけだと WIN プランが全部同じキーになり、
     リプレイの探索結果を1枚役が使ってしまう（実測: 12,348通りで道連れ入賞）。 */
  const plan = (mode, line, wants) => ({
    mode, line, key: flag,
    targets: wants.map((w, i) => ({ want: w, row: LINES[line].rows[i] })),
  });

  if (align) {
    const s = align === "BIG" ? "red7" : "bar";
    return plan("ALIGN", LINE_MID, [[s], [s], [s]]);
  }
  if (flag === "REPLAY") return plan("WIN", LINE_MID, [["replay"], ["replay"], ["replay"]]);
  if (flag.startsWith("BELL")) return plan("WIN", LINE_MID, [["bell"], ["bell"], ["bell"]]);

  /* ---- スイカの強弱は「揃うライン」で見せる ----
     弱スイカ = 右下がり（斜め） / 強スイカ = 中段揃い。払い出しはどちらも15枚。
     ボーナスとの重複（MELON_BIG / MELON_REG）は強スイカ扱いにして期待度を上げる。 */
  if (flag === "MELON_WEAK") return plan("WIN", LINE_DOWN, [["melon"], ["melon"], ["melon"]]);
  if (flag.startsWith("MELON")) return plan("WIN", LINE_MID, [["melon"], ["melon"], ["melon"]]);

  /* ---- チェリーは出目で3段階 ----
     単チェリー（角） < 強チェリー（中段） < 3連チェリー。
     ボーナス重複は「中段チェリー＋右リール中段BAR」で出す＝この形が見えたら濃厚。
     チェリーは左リール1枚で成立する役なのでラインの概念に乗せず、
     左リールの停止位置を直接指定する。 */
  if (flag.startsWith("CHERRY")) {
    const midBar = flag === "CHERRY_BIG" || flag === "CHERRY_REG";
    const stops =
      flag === "CHERRY_TRIPLE" ? CHERRY_STOPS_TRIPLE :
      flag === "CHERRY_WEAK"   ? CHERRY_STOPS_CORNER :
      CHERRY_STOPS_MID;                       // 強チェリー・ボーナス重複は中段
    return {
      mode: "WIN", line: LINE_MID, cherry: true, key: flag,
      targets: [
        { stops },
        { avoid: [] },
        midBar ? { want: ["bar"], row: 1 } : { avoid: [] },
      ],
    };
  }
  if (flag.startsWith("ONE_COIN")) return plan("WIN", LINE_MID, [["star"], ["star"], ["bar"]]);
  if (flag.startsWith("RIICHI")) return plan("WIN", LINE_MID, [["star"], ["star"], ["star"]]);
  if (flag.startsWith("SOLO") && justWon) {
    // 単独ボーナス成立ゲーム: リーチ目を出す（左中段に7/BAR + 非入賞形）
    /* noWin: 引き込みはするが入賞形は作らせない。
       左リールが最後に止まる押し順だと、7/BARを引き込んだ結果その場でボーナスが
       揃ってしまう（リーチ目のつもりが入賞）。それを防ぐための指定。 */
    return { mode: "REACH", line: LINE_MID, key: flag,
      targets: [{ want: BONUS_SYMS, row: 1, noWin: true }, { avoid: [] }, { avoid: [] }] };
  }
  // 通常時ハズレ / 内部中の小役なしゲームの前段
  return { mode: "SAFE", line: LINE_MID, key: "SAFE",
    targets: [{ avoid: [], leftSafe: true }, { avoid: [] }, { avoid: [] }] };
}

/* ハズレ制御の優先順位について:
   1ライン時代は「入賞もテンパイも起こさない」を同じ強さで課していたが、
   5ラインでは2リール停止の時点でどれかのラインがテンパイするのが普通で、
   両方を4コマ以内で満たせる位置が無くなり、結果として入賞を許してしまう。
   そこで
     絶対条件: どのラインも入賞させない（払い出しの整合性）
     努力目標: 生きたテンパイを作らない（ガセテンパイを減らす）
   の2段階にしている。リーチ目の一意性は左リールの 7/BAR 禁止だけで担保できるので、
   テンパイを許容しても「リーチ目がハズレで出る」ことは起きない。 */

/**
 * 揃ってよいライン。WIN/ALIGN は狙った1本だけ、SAFE/REACH は1本も揃えてはいけない。
 *
 * 【なぜ必要か】狙ったラインを揃えるだけだと、他のラインが道連れで揃ってしまう。
 * 実際「中段リプレイ揃い」を狙うと停止位置[2,2,2]で上段ベル・下段スイカまで
 * 同時に揃い、1ゲームで3種類の入賞形が並ぶ意味不明な出目になっていた。
 * 払い出しは役に対して1回なので出玉は狂わないが、見た目が破綻する。
 */
const allowedLine = (plan) =>
  (plan.mode === 'WIN' || plan.mode === 'ALIGN') ? plan.line : -1;

/** その停止位置で「揃ってはいけないライン」が揃うか（3リール揃ったときのみ成立し得る） */
function completesWin(reel, idx, stops, plan) {
  const st = [...stops];
  st[reel] = idx;
  if (st.some((x) => x == null)) return false;
  const ok = allowedLine(plan);
  const g = gridOf(st);
  for (let li = 0; li < LINES.length; li++) {
    if (li !== ok && isWinLine(lineSyms(g, li))) return true;
  }
  return false;
}

/** その停止位置でいずれかのラインが「まだ入賞に到達し得る」形になるか（生きたテンパイ） */
function makesLiveTempai(reel, idx, stops) {
  const st = [...stops];
  st[reel] = idx;
  if (st.filter((x) => x != null).length < 2) return false;
  const g = gridOf(st);
  for (let li = 0; li < LINES.length; li++) {
    const syms = lineSyms(g, li);
    if (WIN_PATTERNS.some((p) => [0, 1, 2].every((i) => syms[i] == null || syms[i] === p[i]))) {
      return true;
    }
  }
  return false;
}

/* ================= 詰み回避の先読み =================
   制御は押された順に貪欲に決めるので、1停目・2停目を目先の都合だけで止めると、
   最後のリールがどこに止めても入賞してしまう窓に追い込まれることがある。
   実測では
     - ハズレで左リールが最後に来る押し順（中→右→左 / 右→中→左）
     - リーチ目で中リールが最後に来る押し順（右→左→中）
   が詰んで、ベルやリプレイが勝手に揃っていた。

   そこで「この位置に止めたあと、残りのリールを"全押下位置・全停止順"で
   入賞させずに止め切れるか」を再帰で確かめる。実機の制御テーブルが
   押し順ごとの停止位置を持っているのと同じ役割。
   状態数は高々 3×21 + 3×21×21 なのでメモ化すれば一度きりのコストで済む。 */

/** その押下位置から届く停止位置の候補（引き込みは全周＝オートビタ前提） */
function candidatesFor(reel, push, t) {
  const out = [];
  if (t.want) {
    for (let s = 0; s < REEL_LEN; s++) {
      const idx = norm(push - s);
      if (t.want.includes(symAtRow(reel, idx, t.row))) out.push(idx);
    }
  } else {
    for (let s = 0; s <= SLIP_MAX; s++) {
      const idx = norm(push - s);
      if (t.leftSafe && !leftSafeOk(idx)) continue;
      out.push(idx);
    }
  }
  return out;
}

const feasCache = new Map();

/**
 * 残りのリールを、どの押下位置・どの停止順で来られても入賞させずに止め切れるか。
 * 「揃ってよいライン」は allowedLine(plan) が決める（WIN/ALIGN は狙った1本だけ）。
 */
function feasible(stops, plan) {
  const rem = [0, 1, 2].filter((i) => stops[i] == null);
  if (rem.length === 0) return true;
  const key = plan.key + '|' + plan.line + '|' + stops.join(',');
  const hit = feasCache.get(key);
  if (hit !== undefined) return hit;

  let ok = true;
  for (const r of rem) {           // プレイヤーが次にどのリールを押しても
    const t = plan.targets[r];
    let allPushOk = true;
    for (let push = 0; push < REEL_LEN && allPushOk; push++) {   // どの位置で押しても
      let found = false;
      for (const idx of candidatesFor(r, push, t)) {
        if (completesWin(r, idx, stops, plan)) continue;
        const st = [...stops]; st[r] = idx;
        if (!feasible(st, plan)) continue;
        found = true; break;
      }
      if (!found) allPushOk = false;
    }
    if (!allPushOk) { ok = false; break; }
  }
  feasCache.set(key, ok);
  return ok;
}

/** 通常時ハズレの左リール制約を満たすか（左中段の図柄だけを見る） */
function leftSafeOk(idx) {
  return !LEFT_BAN_MID.includes(symAtRow(0, idx, 1));
}

/**
 * 停止位置の決定（純粋関数）
 * @param {number} reel        0-2
 * @param {number} push        押下位置（この位置の図柄が「今中段にある」状態で押した）
 * @param {object} plan        makePlan() の戻り値
 * @param {Array<?number>} stops 停止済みリールの停止インデックス（未停止は null）
 * @param {boolean} assist     true=オートビタ（4コマを超えて引き込む）
 * @returns {number} 中段に来る配列インデックス
 */
export function controlStop(reel, push, plan, stops = [null, null, null], assist = true) {
  const t = plan.targets[reel];

  // 停止位置を直接指定する目標（チェリーの出目分け）。押下位置から最も近いものを選ぶ
  if (t.stops) {
    const last = assist ? REEL_LEN : SLIP_MAX + 1;
    for (let s = 0; s < last; s++) {
      const idx = norm(push - s);
      if (t.stops.includes(idx)) return idx;
    }
    return norm(push);
  }

  if (t.want) {
    const row = t.row;
    const hit = (idx) => t.want.includes(symAtRow(reel, idx, row));
    const last = assist ? REEL_LEN : SLIP_MAX + 1;
    /* 引き込みは必ず成立させたうえで、
       1) 余計なラインを揃えず、かつ残りのリールが詰まない位置
       2) 余計なラインを揃えない位置
       3) （最後の砦）とにかく引き込む
       の順に探す。1が取れないと「狙った1本＋道連れで2本」の出目になる。 */
    for (let s = 0; s < last; s++) {
      const idx = norm(push - s);
      if (!hit(idx) || completesWin(reel, idx, stops, plan)) continue;
      const st = [...stops]; st[reel] = idx;
      if (feasible(st, plan)) return idx;
    }
    for (let s = 0; s < last; s++) {
      const idx = norm(push - s);
      if (hit(idx) && !completesWin(reel, idx, stops, plan)) return idx;
    }
    for (let s = 0; s < last; s++) if (hit(push - s)) return norm(push - s);
    return norm(push); // 目標が配列に存在しない場合のみ（設計上起きない）
  }

  // 回避モード。上の優先順位に従って段階的に探す
  const leftOk = (idx) => !t.leftSafe || leftSafeOk(idx);
  const base = (idx) => leftOk(idx) && !completesWin(reel, idx, stops, plan);
  const escapes = (idx) => {
    const st = [...stops]; st[reel] = idx;
    return feasible(st, plan);
  };
  // 1) 入賞なし・テンパイなし・残りが詰まない（いちばん綺麗な出目）
  for (let s = 0; s <= SLIP_MAX; s++) {
    const idx = push - s;
    if (base(idx) && !makesLiveTempai(reel, idx, stops) && escapes(idx)) return norm(idx);
  }
  // 2) テンパイは許容。詰まないことだけは守る
  for (let s = 0; s <= SLIP_MAX; s++) {
    const idx = push - s;
    if (base(idx) && escapes(idx)) return norm(idx);
  }
  // 3) 先読みも諦める。入賞だけは絶対に避ける
  for (let s = 0; s <= SLIP_MAX; s++) {
    const idx = push - s;
    if (base(idx)) return norm(idx);
  }
  // 4) ここに来るのは設計上ありえない（tests/reel.js が総当たりで担保している）。
  //    最後の砦として左リール制約＝リーチ目の防止だけは死守する
  if (t.leftSafe) {
    for (let s = 0; s <= SLIP_MAX; s++) if (leftSafeOk(push - s)) return norm(push - s);
  }
  return norm(push);
}

/**
 * 出目がリーチ目か（左リールのいずれかの段に7/BAR、かつ全ライン非入賞）。演出・デバッグ用
 * @param {Array<?number>} stops 3リールの停止インデックス
 */
export function isReachMoku(stops) {
  if (stops.some((s) => s == null)) return false;
  if (!BONUS_SYMS.includes(symAtRow(0, stops[0], 1))) return false;   // 左中段に7/BAR
  return winningLines(stops).length === 0;                            // かつ全ライン非入賞
}
