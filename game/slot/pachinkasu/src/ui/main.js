/**
 * UI層 / Game層 エントリポイント
 * 依存方向: ui -> core（逆流禁止。演出が抽選結果に影響してはならない）
 *
 * TODO(next): Game層の分離（src/game/stateMachine.js / atManager.js へ切り出し）
 */
import { TABLE, DENOM, probabilities, assertTables, SUB_TABLE } from '../core/tables.js';
import { drawFlag, rnd16, subLottery, isBigFlag, isRegFlag, isBonusFlag, payoutOf } from '../core/lottery.js';
import { STRIP, REEL_LEN, makePlan, controlStop, isReachMoku } from '../core/reelControl.js';
import { playMovie, setLoopMovie, hasMovie } from './movies.js';
import { SE } from './sound.js';

assertTables();

/* ================= デバッグフック =================
 * 通常起動では debug.js が読み込まれないため、以下の値は初期値のまま＝素の挙動になる。
 * デバッグUIは ?debug=1 を付けたときだけ動的importされる（このファイル末尾）。
 * 本番配布時は debug.js を同梱しなければ機能自体が存在しなくなる。
 *
 * 【重要】forceFlag は抽選結果を上書きする。デバッグ専用であり、
 *         通常の演出コードからここに書き込んではならない（ui→core の一方向依存を守る）。 */
export const DBG = {
  forceFlag: null,    // 次ゲームで強制する成立フラグ名（null=通常抽選）
  keepForce: false,   // true なら毎ゲーム forceFlag を適用し続ける
  forceFreeze: false, // 次のBIGでフリーズを強制
  forceATonBonus: false, // 次のボーナス終了時にAT当選を強制
  speed: 1,           // 演出速度の倍率（1=通常、大きいほど速い）
  onUpdate: null,     // (G)=>void 1ゲーム終わるごとに呼ばれる（デバッグ表示の更新用）
};

/** 素材パス解決 */
const ASSET_DIR = {
  sym: 'assets/symbols/', bg: 'assets/bg/', an: 'assets/announce/', cut: 'assets/cutin/',
};
function img(key) {
  if (key.startsWith('sym_')) return ASSET_DIR.sym + key + '.jpg';
  if (key.startsWith('bg_')) return ASSET_DIR.bg + key + '.jpg';
  if (key.startsWith('an_')) return ASSET_DIR.an + key + '.jpg';
  return ASSET_DIR.cut + key + '.jpg';
}
const $ = id => document.getElementById(id);
// 液晶背景などを差し替え
$('lcd').style.backgroundImage = `url(${img('bg_st_a')})`;


/* ============ リール ============ */
// 配列・制御は core/reelControl.js が正。ここは描画だけを持つ
const SYM = n => img('sym_'+n), SYMG = n => img('sym_'+n+'_g');
const reels = [0,1,2].map(i=>({el:$('r'+i), cells:[...$('r'+i).querySelectorAll('img')], idx:0, spinning:false, timer:null}));
function drawReel(i, midIdx, glowMid=false){
  const st = STRIP[i], n = REEL_LEN, r = reels[i];
  r.idx = midIdx;
  r.cells[0].src = SYM(st[(midIdx+n-1)%n]);
  r.cells[1].src = glowMid ? SYMG(st[midIdx]) : SYM(st[midIdx]);
  r.cells[2].src = SYM(st[(midIdx+1)%n]);
}
/* 1tickで1コマ進める。2コマ飛ばしにすると「押した位置の±1コマ」が
   時間的に連続しなくなり、ビタ押しの判定が体感と合わなくなるため。
   33ms/コマ ≒ 0.7秒で1周（実機とほぼ同じ速度） */
const REEL_TICK_MS = 33;
function startSpin(i){
  const r = reels[i]; r.spinning = true; r.el.classList.add('spin');
  // idx を減らす向きに回す。中段(idx)の図柄が次tickで下段(idx+1)へ移る＝図柄が下へ流れる。
  // 増やす向きだと図柄が上へ流れ、実機と逆回転に見える。
  r.timer = setInterval(()=>{ r.idx = (r.idx-1+REEL_LEN)%REEL_LEN; drawReel(i, r.idx); },
                        Math.max(5, REEL_TICK_MS/DBG.speed));
}
/** 停止: 押した瞬間の位置から制御表(core)で停止位置を決める */
function stopReel(i){
  const r = reels[i]; clearInterval(r.timer); r.spinning=false; r.el.classList.remove('spin');
  // ビタ押しチャレンジ中の中リールだけは制御表を通さない。
  // すべらせてしまうと「狙って止める」技術介入にならないため、押した位置で判定する。
  if(G.vitaNow && i===1 && G.vitaResult===null){
    const pressed = r.idx;
    G.vitaResult = reelDist(pressed, VITA_TARGET) <= VITA_TOLERANCE;
    if(G.vitaResult) G.vitaHits++;
    // 成功なら赤7をきっちり中段へ、失敗は押した位置のまま止める
    const midIdx = G.vitaResult ? VITA_TARGET : pressed;
    drawReel(i, midIdx, G.vitaResult);
    G.mids[i] = STRIP[i][midIdx];
    hideVitaTarget();
    if(G.vitaResult){ nav("ビタ成功!! AT+10G",1600); flash('flash-w'); SE.vitaOk(); }
    else { nav("失敗… AT+2G",1600); SE.vitaNg(); }
    DBG.onUpdate?.(G);   // デバッグ表示を即時反映（ポーリング待ちだと判定結果が遅れて見える）
    return;
  }
  const midIdx = controlStop(i, r.idx, G.plan, G.mids);
  drawReel(i, midIdx);
  G.mids[i] = STRIP[i][midIdx];
}
[0,1,2].forEach(i=>drawReel(i, i*4));

/* ================= Game層: 状態 ================= */
const G = {
  setting: 1, phase: "NORMAL", credit: 1000, diff: 0, games: 0,
  bigC: 0, regC: 0, carry: null, flag: null,
  plan: null, mids: [null,null,null], align: null,
  stopsLeft: 0, replayNext: false,
  at: false, atG: 0, atTotalG: 0, atRunG: 0, atStartDiff: 0,
  pendingAT: 0, freezeWon: false,
  // ボーナス中の進行（phase が BIG / REG のあいだ有効）
  bonusPaid: 0,     // このボーナスでの累計獲得枚数
  bonusTotal: 0,    // 終了条件の枚数（BIG=204 / REG=60）
  bonusGame: 0,     // このボーナスで消化したゲーム数
  vitaHits: 0,      // ビタ押し成功回数（0〜3）
  vitaNow: false,   // 今のゲームがビタ押しチャレンジか
  vitaResult: null, // 直近のビタ判定（true=成功 / false=失敗 / null=未判定）
  justWon: false,   // このゲームでボーナスに当選したか（告知抽選の重み分けに使う）
  announced: false, // 内部中のボーナスを告知済みか（告知後は「7を狙え」に切り替わる）
  busy: false,
};

/* ---- ビタ押しチャレンジ（仕様書§7.1 中リール指定図柄のビタ押し）----
   BIG中の指定ゲームで中リールに赤7を狙わせる。押した瞬間の中段位置が
   赤7から±1コマ以内なら成功。制御表を通さない＝すべらせないので本物のビタ押し。 */
const VITA_TARGET = STRIP[1].indexOf('red7');  // 中リールの赤7位置
const VITA_TOLERANCE = 1;                      // ±1コマまで成功
const VITA_GAMES = [5, 9, 13];                 // 累計60/120/180枚に対応するゲーム目
/** リール上の円環距離（0〜10コマ） */
function reelDist(a, b){
  const d = Math.abs(a - b) % REEL_LEN;
  return Math.min(d, REEL_LEN - d);
}
/** 成功回数に応じたAT当選率。3回成功のみ濃厚、全外しでも40%は残す */
const VITA_AT_RATE = [0.40, 0.55, 0.70, 1.00];
function seg(){ $('credit').textContent=G.credit; $('game').textContent=G.games%1000; }
function setBG(key){ $('lcd').style.backgroundImage = `url(${img(key)})`; }
function badge(t){ $('stateBadge').textContent = t; }
function flash(cls){ const f=$('flashfx'); f.className=""; void f.offsetWidth; f.classList.add(cls); }
function showCut(k, ms=900){ const c=$('cutin'); c.src=img(k); c.style.display='block'; setTimeout(()=>c.style.display='none', ms); }
function showAnn(k, ms=1600){ return new Promise(res=>{ const a=$('announce'); a.src=img(k); a.style.display='block'; setTimeout(()=>{a.style.display='none';res();}, ms); }); }
/**
 * ボーナス中の液晶。累計獲得枚数を常に大きく重ねる。
 * 背景ループ動画(mv_big_loop / mv_reg_loop)が配置されていればそれを見せ、
 * 無ければ従来どおり告知画面の静止画を出しっぱなしにする。
 */
async function showBonusScreen(kind){
  const a=$('announce');
  if(await hasMovie(kind==="BIG" ? 'big_loop' : 'reg_loop')){
    a.style.display='none';       // 静止画は動画を隠してしまうので出さない
  } else {
    a.src=img(kind==="BIG"?'an_big':'an_regb'); a.style.display='block';
  }
  $('bonusCount').style.display='block'; drawBonusCount();
}
function hideBonusScreen(){ $('announce').style.display='none'; $('bonusCount').style.display='none'; }
function drawBonusCount(){
  $('bonusNum').textContent = G.bonusPaid;
  const c=$('bonusCount'); c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
}
function nav(t,ms=1400){ $('nav').textContent=t; if(ms) setTimeout(()=>{ if($('nav').textContent===t) $('nav').textContent=''; }, ms); }
function updateLCD(){
  if(G.phase==="BIG"){ setBG('bg_big'); badge("BIG BONUS"); }
  else if(G.phase==="REG"){ setBG('bg_reg'); badge("REG BONUS"); }
  else if(G.at){ setBG('bg_at'); badge("AT中"); }
  // 告知済みの内部中は隠さない。狙わせるのが目的なので状態を明示する
  else if(G.carry && G.announced){ setBG('bg_zencho'); badge("ボーナス濃厚"); }
  else if(G.carry){ setBG('bg_zencho'); badge("チャンス!?"); }
  else { setBG(G.games%97>80 ? 'bg_st_b':'bg_st_a'); badge("通常"); }
  $('atinfo').style.display = G.at ? 'block':'none'; $('atg').textContent = G.atG;
  // 背景ループ動画（あれば）。ボーナス中 > AT中 の優先度。音アリで流す（曲を聴かせるため）
  if(G.phase==="BIG")      setLoopMovie('big_loop', true);
  else if(G.phase==="REG") setLoopMovie('reg_loop', true);
  else if(G.at)            setATLoop();
  else                     setLoopMovie(null);
  // 下パネル: AT・ボーナス中は発光版
  $('panel').classList.toggle('glow', G.at || G.phase!=="NORMAL");
}

/** AT中の背景ループ。専用動画(at_loop_a/b)が無ければBIGのMVをそのまま流用する */
async function setATLoop(){
  const want = G.atG<=10 ? 'at_loop_b' : 'at_loop_a';
  let key = null;
  if(await hasMovie(want)) key = want;
  else if(await hasMovie('big_loop')) key = 'big_loop';
  if(G.at && G.phase==="NORMAL") setLoopMovie(key, true);  // 待つ間に状態が変わっていたら何もしない
}

/* ================= 音 =================
 * 実体は src/ui/sound.js（WebAudioの合成）。ここでは鳴らすタイミングだけを持つ。
 * AudioContext はユーザー操作の中でしか作れないので markInput() から unlock している。 */

/* ---- ボーナス確定までの段階演出 ----
   カットイン → 溜め（画面が震える） → 濃厚告知 の3段。
   どのボーナスかはここでは出さない。BIG/REGの判別は入賞時の告知画面に任せる
   （実機と同じく、成立告知の時点では種別を伏せる） */
async function bonusRevealFx(){
  const rv = $('reveal'), tx = $('revealText'), cut = $('revealCut');
  cut.src = img('cut_s');           // 強カットイン
  tx.textContent = '';
  rv.className = 'on'; void rv.offsetWidth;   // アニメーションを毎回頭から流す

  rv.classList.add('s1'); SE.cutin(3);
  await wait(520);

  rv.classList.remove('s1'); rv.classList.add('s2');
  tx.textContent = '!?'; SE.charge(900);
  await wait(900);

  rv.classList.remove('s2'); rv.classList.add('s3');
  tx.innerHTML = 'BONUS<span class="sub">濃厚</span>';
  flash('flash-w'); SE.reveal();
  await wait(1500);

  rv.className = '';
}
/** 告知抽選の当選率。成立ゲームで即告知、外れても内部中は毎ゲーム抽選し続ける */
const ANNOUNCE_RATE_HIT   = 0.45;  // 成立ゲーム
const ANNOUNCE_RATE_CARRY = 0.08;  // 内部中の各ゲーム（平均12G前後で告知される）

/* ================= 遊技フロー ================= */
const setBtns = (bet,lever,stops) => { $('bet').disabled=!bet; $('lever').disabled=!lever;
 [0,1,2].forEach(i=>$('s'+i).disabled=!stops); syncPanelTap(); };

/* ---- 下パネルのタップ操作面 ----
   スマホで片手で打てるよう、下パネル全体を1つのボタンにして
   タップするたびに MAXBET→レバー→左→中→右 と順送りする。
   ビタ押しチャレンジ中だけ停止順を 中→右→左 に変える（中リールを最初に狙うため）。 */
const panelTap = $('paneltap'), panelTapLabel = $('paneltapLabel');
const CTRL_LABEL = { bet:'MAX BET', lever:'レバー', s0:'左', s1:'中', s2:'右' };
const STOP_ORDER_NORMAL = [0,1,2];   // 左→中→右
const STOP_ORDER_VITA   = [1,2,0];   // 中→右→左（ビタ押しは中リールから）
/** 次にタップで押される操作のID。押せるものが無ければ null */
function nextControl(){
  if(!$('bet').disabled)   return 'bet';
  if(!$('lever').disabled) return 'lever';
  const order = G.vitaNow ? STOP_ORDER_VITA : STOP_ORDER_NORMAL;
  for(const i of order){ if(!$('s'+i).disabled) return 's'+i; }
  return null;
}
// 指を離した瞬間(click)ではなく押した瞬間(pointerdown)で反応させる。
// ビタ押しは押したタイミングで判定するので、click だと狙いがズレる
panelTap.addEventListener('pointerdown', () => {
  const id = nextControl();
  if(id) $(id).click();
});
function syncPanelTap(){
  const id = nextControl();
  panelTap.classList.toggle('ready', !!id);
  panelTap.classList.toggle('vita', !!G.vitaNow);
  panelTapLabel.textContent = id ? CTRL_LABEL[id] : '';
}

setBtns(true,false,false);
const setNavi = on => [0,1,2].forEach(i=>$('s'+i).classList.toggle('navi', on));

let betted = false;
function doBet(){
  if(G.busy||betted) return;
  // ボーナス中は投入不要。払い出し総枚数(204/60)がそのまま純増になる＝
  // tests/simulate.js の計算モデル（投入なしで一括加算）と一致させるため
  const inBonus = G.phase !== "NORMAL";
  if(!inBonus && !G.replayNext){ if(G.credit<3){ G.credit+=500; nav("500枚 貸出"); } G.credit-=3; G.diff-=3; }
  betted = true; seg(); SE.bet(); setBtns(false,true,false);
}
$('bet').onclick = doBet;

async function doLever(){
  if(!betted||G.busy) return;
  G.busy = true; betted=false; G.replayNext=false; SE.lever();
  $('payout').textContent = 0;
  G.games++;

  // ---- ボーナス中: 抽選を行わず、消化役（BIG=15枚のスイカ / REG=8枚のベル）を毎回引き込む ----
  if(G.phase !== "NORMAL"){
    G.bonusGame++;
    G.flag = G.phase === "BIG" ? "MELON" : "BELL";
    G.plan = makePlan(G.flag, {});
    G.mids = [null,null,null];
    G.align = null;
    // ビタ押しチャレンジのゲームか（BIGのみ・指定ゲーム目）
    G.vitaNow = G.phase === "BIG" && VITA_GAMES.includes(G.bonusGame);
    G.vitaResult = null;
    if(G.vitaNow){ showVitaTarget(); SE.cutin(2); }
    [0,1,2].forEach(startSpin); G.stopsLeft = 3;
    setBtns(false,false,true);
    G.busy = false;
    return;
  }

  if(G.at){
    const remain = G.atG;   // このゲームを含めた残りG数
    G.atG--; G.atTotalG++; G.atRunG++;
    // 残り3ゲームからカウントダウン（3→2→LAST）
    if(remain>=1 && remain<=CD_GAMES) showCountdown(remain); else hideCountdown();
  }
  // ---- 抽選 ----
  const wasCarrying = !!G.carry;
  let flag = drawFlag(G.setting, wasCarrying);
  // デバッグ: フラグ強制。内部中はボーナスを引けない仕様なので、その場合だけ強制を無視する
  if(DBG.forceFlag){
    const f = DBG.forceFlag;
    if(!DBG.keepForce) DBG.forceFlag = null;
    if(!(wasCarrying && isBonusFlag(f))) flag = f;
  }
  const justWon = isBonusFlag(flag) && !wasCarrying;
  if(justWon){ G.carry = isBigFlag(flag) ? "BIG":"REG"; G.announced = false; }
  G.justWon = justWon;
  G.flag = flag;
  // ---- 停止プラン（リール制御表） ----
  // 内部中×ハズレ → ボーナス入賞ゲーム（オートビタ）
  G.align = (wasCarrying && flag==="HAZURE") ? G.carry : null;
  G.plan = makePlan(flag, { justWon, align: G.align });
  G.mids = [null,null,null];
  // ---- 演出 ----
  if(/RIICHI/.test(flag)) { showCut('cut_s'); flash('flash-v'); SE.cutin(3); }
  else if(/MELON_|CHERRY_|ONE_COIN_/.test(flag)) { showCut('cut_m'); flash('flash-r'); SE.cutin(2); }
  else if(["MELON","CHERRY","ONE_COIN"].includes(flag) && rnd16()%4===0) { showCut('cut_w'); SE.cutin(1); }
  // 告知済みの内部中はずっと「7を狙え」。プレイヤーが何をすべきか迷わないようにする
  if(G.carry && G.announced) nav("7を狙え!!", 0);
  setNavi(G.at && flag.startsWith("BELL")); // AT中ベルナビ: 停止ボタン点灯
  updateLCD();
  // ---- リール始動 ----
  [0,1,2].forEach(startSpin); G.stopsLeft = 3;
  setBtns(false,false,true);
  G.busy = false;
}
$('lever').onclick = doLever;

function pressStop(i){
  const r = reels[i]; if(!r.spinning) return;
  SE.stop();
  stopReel(i);
  $('s'+i).disabled = true; syncPanelTap();  // 停止済みのリールは押せなくする
  G.stopsLeft--;
  if(G.stopsLeft===0) settle();
}
[0,1,2].forEach(i => {
  const b = $('s'+i);
  // 実操作は pointerdown で拾う。click(指を離した瞬間)だとビタ押しの狙いがズレるため
  b.addEventListener('pointerdown', () => pressStop(i));
  // キーボード操作とパネルタップからの .click() は detail=0 で届くので、それだけ通す
  b.addEventListener('click', e => { if(e.detail === 0) pressStop(i); });
});

async function settle(){
  G.busy = true; setBtns(false,false,false); setNavi(false);
  const flag = G.flag;

  // ---- ボーナス中の消化 ----
  if(G.phase !== "NORMAL"){
    // ビタ押しゲームは中リールに赤7を止めているので、揃い演出は成功時のみ
    if(!G.vitaNow || G.vitaResult){
      [0,1,2].forEach(i=>drawReel(i,reels[i].idx,true));
      document.querySelectorAll('.cell.mid').forEach(c=>c.classList.add('winline'));
      setTimeout(()=>document.querySelectorAll('.cell.mid').forEach(c=>c.classList.remove('winline')),400);
    }
    // ビタ押しの結果をATゲーム数に反映（成功+10G / 失敗は救済+2G）
    if(G.vitaNow){ G.pendingAT += G.vitaResult ? 10 : 2; G.vitaNow=false; }
    // 1ゲームあたりの獲得。終了枚数を超える分は切り詰める
    const per = G.phase==="BIG" ? 15 : 8;
    const got = Math.min(per, G.bonusTotal - G.bonusPaid);
    G.bonusPaid += got; G.credit += got; G.diff += got;
    $('payout').textContent = got; seg(); drawBonusCount();
    SE.payout(); SE.medal(got, .10);
    if(G.bonusPaid >= G.bonusTotal){ await endBonus(); }
    else { setBtns(true,false,false); G.busy=false; }
    return;
  }

  // 発光演出: 入賞形が実際に並んだときだけ光らせる
  if(G.plan.mode==="WIN"||G.plan.mode==="ALIGN"){
    if(G.mids[0]===G.mids[1] && G.mids[1]===G.mids[2]) [0,1,2].forEach(i=>drawReel(i,reels[i].idx,true));
    document.querySelectorAll('.cell.mid').forEach(c=>c.classList.add('winline'));
    setTimeout(()=>document.querySelectorAll('.cell.mid').forEach(c=>c.classList.remove('winline')),700);
  }
  // リーチ目告知（ボーナス成立ゲームのみ出現し得る出目）
  if(G.plan.mode==="REACH" && isReachMoku(G.mids)){ flash('flash-v'); nav("・・・！？",1800); }
  // 払い出し
  const p = payoutOf(flag, G.at);
  if(p.coins){
    G.credit+=p.coins; G.diff+=p.coins; $('payout').textContent=p.coins;
    // 入賞音は役ごとに変える（音だけで何が入ったか分かるようにする）。
    // そのあと払い出し枚数ぶんメダル音を重ねる
    if(flag.startsWith("MELON")) SE.melon();
    else if(flag.startsWith("CHERRY")) SE.cherry();
    else if(flag.startsWith("ONE_COIN")) SE.chance();
    else SE.payout();
    SE.medal(p.coins, .12);
  }
  if(p.replay){ G.replayNext=true; nav("再遊技"); SE.replay(); }
  if(G.at && flag.startsWith("BELL")) nav("ナビ成功! +11枚");
  // AT中スイカ上乗せ (256分母)
  // 上乗せでカウントダウン圏内から抜けるので表示を消す
  if(G.at && flag.startsWith("MELON") && subLottery(SUB_TABLE.MELON_UPGRADE_IN_AT)){ G.atG+=10; nav("＋10G!!"); flash('flash-v'); hideCountdown(); }
  seg();
  // ボーナス告知。成立ゲームで45%、外れても内部中は毎ゲーム8%で抽選し続ける。
  // 入賞ゲーム(G.align)はこのあと7が揃うので告知しない
  if(G.carry && !G.announced && !G.align &&
     rnd16()/DENOM < (G.justWon ? ANNOUNCE_RATE_HIT : ANNOUNCE_RATE_CARRY)){
    G.announced = true;
    await bonusRevealFx();
    nav("7を狙え!!", 0);
  }
  // ボーナス開始
  if(G.align){ await startBonus(G.align); }
  else await endOfGame();
}

async function endOfGame(){
  // ---- AT終了判定 ----
  // 完走: AT開始からの差枚+2400 または 1500G（有利区間相当・仕様書§8）
  const kanso = G.at && (G.diff-G.atStartDiff>=2400 || G.atRunG>=1500);
  if(G.at && (G.atG<=0 || kanso)){
    const gained = G.diff - G.atStartDiff, ran = G.atRunG;
    G.at=false; G.atG=0;
    hideCountdown();
    setLoopMovie(null);   // 最終ゲームなのでMVを止め、そのままリザルトへ
    if(kanso && !(await playMovie('kanso'))){ setBG('bg_kanso'); await wait(2200); }
    await showResult({
      title: kanso ? "MOON TIME 完走" : "MOON TIME 終了",
      num: (gained>0?'+':'') + gained,
      sub: `消化 ${ran}G` + (kanso ? '<br><span class="hit">おめでとう!!</span>' : ''),
    });
    if(G.setting===6) await showAnn('an_s6', 2000);   // 設定6のみ示唆画面
    nav(kanso ? "完走!! おめでとう!" : "AT終了", 2200);
  }
  updateLCD(); seg();
  setBtns(true,false,false); G.busy=false;
  DBG.onUpdate?.(G);
}
const wait = ms => new Promise(r=>setTimeout(r, ms/DBG.speed));

/** AT突入の共通処理 */
function enterAT(initG){
  G.at = true; G.atG = initG; G.atRunG = 0; G.atStartDiff = G.diff;
  hideCountdown();
}

/** ボーナス開始。告知を出したあと操作をプレイヤーに返す（消化は settle 側で進む） */
async function startBonus(kind){
  G.carry=null; G.align=null; G.announced=false; G.phase=kind;
  G.bonusPaid = 0;
  G.bonusTotal = kind==="BIG" ? 204 : 60;   // 仕様書§7の終了条件
  G.bonusGame = 0; G.vitaHits = 0; G.vitaNow = false; G.vitaResult = null;
  if(kind==="BIG") G.bigC++; else G.regC++;
  updateLCD(); flash('flash-w'); SE.bonusStart(kind);
  // フリーズ抽選（BIG入賞時 1/64・仕様書§5.6）
  if(kind==="BIG" && (DBG.forceFreeze || subLottery(SUB_TABLE.FREEZE_ON_BIG))){
    DBG.forceFreeze = false;
    SE.freeze();
    if(!(await playMovie('freeze'))){ flash('flash-v'); nav("FREEZE!!",2200); await wait(2000); }
    G.pendingAT += 50; G.freezeWon = true; // フリーズ恩恵: AT濃厚+50G
  }
  // 確定ムービー（無ければ静止画）→ そのあと告知画面を固定表示にする
  if(!(await playMovie(kind==="BIG"?'big':'reg'))) await showAnn(kind==="BIG"?'an_big':'an_regb', 1700);
  await showBonusScreen(kind);
  nav(kind==="BIG" ? "BIG BONUS 消化中" : "REG BONUS 消化中", 1800);
  setBtns(true,false,false); G.busy = false;   // ここからプレイヤーが打つ
}

/** 規定枚数に到達したときの終了処理（AT抽選はここ） */
async function endBonus(){
  const kind = G.phase;
  const paid = G.bonusPaid, hits = G.vitaHits;
  const wasAT = G.at;
  hideBonusScreen();
  // 最終ゲームなのでMVを止める。この直後にリザルトを出す（止めると同時に切り替わって見える）
  setLoopMovie(null);
  // AT抽選。BIGはビタ押しの成功回数で当選率が変わる（3回成功のみ濃厚、全外しでも40%）
  let entered = false;
  const forceAT = DBG.forceATonBonus; DBG.forceATonBonus = false; // デバッグ: AT当選を強制
  if(kind==="BIG"){
    if(G.at){ G.atG+=30; nav("＋30G!!"); hideCountdown(); } // AT中のBIGは+30G固定
    else {
      const base = VITA_AT_RATE[Math.min(G.vitaHits, 3)];
      // 3回成功とフリーズは濃厚なので設定差を乗せない
      const rate = (base >= 1 || G.freezeWon) ? 1 : base + (G.setting-1)*0.004;
      if(forceAT || rnd16()/DENOM < rate){ enterAT(40 + G.pendingAT); entered=true; }
    }
  } else {
    if(!G.at && (forceAT || subLottery(SUB_TABLE.AT_ON_REG))){ enterAT(30); entered=true; }
  }
  G.pendingAT = 0; G.freezeWon = false; G.phase="NORMAL";
  G.bonusPaid = 0; G.bonusTotal = 0;
  G.bonusGame = 0; G.vitaHits = 0; G.vitaNow = false; G.vitaResult = null;
  hideVitaTarget();
  // ---- リザルト画面 ----
  // AT当選の可否もここで見せる。AT中のボーナスは上乗せなので当否を出さない
  const sub = kind==="BIG"
    ? `ビタ押し ${hits}/3 成功<br>` +
      (wasAT ? '<span class="hit">AT ＋30G</span>'
             : entered ? '<span class="hit">AT 当選!!</span>' : 'AT 非当選')
    : (wasAT ? '<span class="hit">AT 継続</span>'
             : entered ? '<span class="hit">AT 当選!!</span>' : 'AT 非当選');
  await showResult({ title: `${kind} BONUS 終了`, num: paid, sub });
  if(entered){
    if(!(await playMovie('at_start'))) await showAnn('an_atstart',1700);
    nav("MOON TIME 突入!!"); SE.atStart();
  }
  await endOfGame();
}

/** ビタ押しチャレンジの「狙え」表示。リール回転中ずっと出しておく */
function showVitaTarget(){ $('vita').style.display='flex'; }
function hideVitaTarget(){ $('vita').style.display='none'; }

/* ================= リザルト画面 =================
   ボーナス／AT の終了時に、MVを止めるのと同時に出す。 */
async function showResult({ title, num, unit='枚', sub='', ms=2600 }){
  $('rTtl').textContent = title;
  $('rNum').textContent = num;
  $('rUnit').textContent = unit;
  $('rSub').innerHTML = sub;
  const r = $('result');
  r.classList.add('on');
  SE.result();
  await wait(ms);
  r.classList.remove('on');
}

/* ---- AT終了3ゲーム前のカウントダウン ----
   remain はこのゲームを含めた残りゲーム数（3→2→1）。1は「LAST」表示にする */
const CD_GAMES = 3;
function showCountdown(remain){
  const c = $('countdown');
  c.classList.remove('on','last'); void c.offsetWidth;   // 毎ゲーム頭からアニメさせる
  if(remain===1){ $('cdNum').textContent='LAST'; $('cdLabel').textContent=''; c.classList.add('last'); }
  else { $('cdNum').textContent=remain; $('cdLabel').textContent='G'; }
  c.classList.add('on');
  SE.countdown(remain);
}
function hideCountdown(){ $('countdown').classList.remove('on','last'); }

/* ================= メニュー ================= */
const row = $('setrow');
for(let s=1;s<=6;s++){ const b=document.createElement('button'); b.textContent=s;
  if(s===G.setting)b.classList.add('on');
  b.onclick=()=>{ G.setting=s; G.credit=1000;G.diff=0;G.games=0;G.bigC=0;G.regC=0;
    G.at=false;G.atG=0;G.carry=null;G.announced=false;G.justWon=false;
    G.pendingAT=0;G.freezeWon=false;
    row.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); refreshData(); seg(); updateLCD(); };
  row.appendChild(b); }
function refreshData(){
  const th = probabilities(G.setting);
  $('dataview').innerHTML = `総G数 ${G.games} ｜ BIG ${G.bigC} ｜ REG ${G.regC} ｜ 差枚 ${G.diff>0?'+':''}${G.diff}<br>
  <span class="small">BIG 1/${th.bigRate.toFixed(1)} ／ REG 1/${th.regRate.toFixed(1)} ／ 合算 1/${th.totalRate.toFixed(1)}</span>`;
}
$('menu').onclick=()=>{ if(G.busy)return; refreshData(); $('menuov').style.display='flex'; };
$('closebtn').onclick=()=>$('menuov').style.display='none';
// タイトルの「遊技開始」がAudioContextを作る最初のユーザー操作になる
$('startbtn').onclick=()=>{ $('titleov').style.display='none'; SE.unlock(); SE.bet(); };

/* ================= キーボード操作 ================= */
// SPACE=BET/レバー ｜ ←↓→ or 1,2,3=停止 ｜ M=メニュー
document.addEventListener('keydown', e=>{
  if(e.repeat) return;
  markInput();
  const k = e.key;
  if(k===' '){ e.preventDefault(); if(!betted && !G.busy && !$('bet').disabled) doBet(); else if(betted) doLever(); }
  else if(k==='ArrowLeft'||k==='1') $('s0').click();
  else if(k==='ArrowDown'||k==='2') $('s1').click();
  else if(k==='ArrowRight'||k==='3') $('s2').click();
  else if(k==='m'||k==='M') $('menu').click();
});

/* ================= 待機デモ（通常時60秒無操作で mv_demo_loop） ================= */
let idleTimer = null, demoOn = false;
function markInput(){
  SE.unlock();   // 自動再生ポリシー対策。ユーザー操作の中でしかAudioContextを作れない
  if(demoOn){ demoOn=false; updateLCD(); } // updateLCD がループ動画を状態に合わせ戻す
  clearTimeout(idleTimer);
  idleTimer = setTimeout(()=>{
    if(G.phase==="NORMAL" && !G.at && !G.busy && !betted){ demoOn=true; setLoopMovie('demo'); }
  }, 60000);
}
document.addEventListener('pointerdown', markInput);
markInput();

seg(); updateLCD();

/* ================= デバッグモード =================
 * 次のいずれかのときだけ debug.js を読み込む。
 *   1. debug.html を開いた（window.__PACHINKASU_DEBUG__ が立っている）
 *   2. URL に ?debug=1 が付いている
 * 通常の index.html では debug.js へのリクエスト自体が発生しない。
 * debug.js が存在しない配布物では import が失敗するだけで、通常動作に影響しない。 */
if(window.__PACHINKASU_DEBUG__ || new URLSearchParams(location.search).has('debug')){
  import('./debug.js')
    .then(m => m.initDebug({ DBG, G, enterAT, updateLCD, seg, refreshData, TABLE, SE, bonusRevealFx, showResult }))
    .catch(e => console.warn('debug.js を読み込めませんでした（通常モードで継続）', e));
}
