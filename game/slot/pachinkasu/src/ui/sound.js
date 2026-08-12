/**
 * 効果音（WebAudioで合成。音源ファイルは持たない）
 *
 * 実機の音を模したシンセ。ファイルを増やさずに済むこと、
 * 差し替えたくなったときに1ファイルで完結することを優先している。
 *
 * 【重要】ブラウザの自動再生ポリシーにより、AudioContext は
 * ユーザー操作の中で生成・resume しないと鳴らない。unlock() を
 * 最初のタップ/キー入力から呼ぶこと（main.js で対応済み）。
 */

let AC = null;
let master = null;

/** 音量。0で無音（将来のミュート切替用） */
export let volume = 0.9;
export function setVolume(v){ volume = v; if(master) master.gain.value = v; }

/** ユーザー操作の中から呼ぶ。以降どこからでも鳴らせるようになる */
export function unlock(){
  if(!AC){
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    AC = new Ctx();
    master = AC.createGain();
    master.gain.value = volume;
    master.connect(AC.destination);
  }
  if(AC.state === 'suspended') AC.resume();
}
const now = () => AC ? AC.currentTime : 0;

/** 単音。sweepTo を渡すと周波数を滑らせる（ピュイーン等） */
function tone(freq, dur, {type='square', gain=.14, at=0, sweepTo=null, attack=.005} = {}){
  if(!AC) return;
  const t = now() + at;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if(sweepTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + .02);
}

/** ノイズ（メダルの当たる音・フリーズのざらつき等） */
function noise(dur, {gain=.12, at=0, hz=2600, q=1.2} = {}){
  if(!AC) return;
  const t = now() + at;
  const len = Math.max(1, Math.floor(AC.sampleRate * dur));
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len); // 減衰付き
  const src = AC.createBufferSource(); src.buffer = buf;
  const bp = AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=hz; bp.Q.value=q;
  const g = AC.createGain(); g.gain.value = gain;
  src.connect(bp); bp.connect(g); g.connect(master);
  src.start(t);
}

/** 和音・アルペジオ */
function arp(freqs, step, dur, opt={}){
  freqs.forEach((f,i) => tone(f, dur, {...opt, at: i*step}));
}

/* ===================== 操作音 ===================== */
export const SE = {
  unlock, setVolume,

  /** BET（メダル投入） */
  bet(){ noise(.05,{gain:.10,hz:3400}); tone(880,.05,{type:'square',gain:.07}); },

  /** レバーオン */
  lever(){ tone(220,.10,{type:'sawtooth',gain:.13,sweepTo:150}); noise(.06,{gain:.07,hz:1200}); },

  /** リール停止 */
  stop(){ tone(150,.05,{type:'square',gain:.11,sweepTo:90}); noise(.03,{gain:.06,hz:900}); },

  /* ===================== 入賞音 ===================== */

  /** 子役の払い出し音（ベル等）。短く明るい「チン」 */
  payout(){
    tone(1318,.10,{type:'triangle',gain:.13});
    tone(1976,.09,{type:'triangle',gain:.08,at:.01});
  },

  /**
   * メダルの払い出し音。枚数ぶん「チャリチャリ」と鳴らす。
   * 1枚ずつ律儀に鳴らすと長くなるので上限を設ける
   */
  medal(count=1, delay=0){
    const n = Math.min(count, 12);
    for(let i=0;i<n;i++){
      const at = delay + i*.055;
      noise(.035,{gain:.10,hz:3200+Math.random()*1200,q:2.2,at});
      tone(2200+Math.random()*500,.03,{type:'square',gain:.05,at});
    }
  },

  /** リプレイ揃い。「ピロリン」と上がって余韻 */
  replay(){
    tone(784,.09,{type:'triangle',gain:.12});
    tone(1046,.09,{type:'triangle',gain:.12,at:.075});
    tone(1568,.22,{type:'triangle',gain:.10,at:.15});
  },

  /** スイカ。レア役らしい上昇アルペジオ */
  melon(){
    arp([523,659,784,1046], .06, .18, {type:'triangle',gain:.13});
    tone(1568,.42,{type:'sine',gain:.09,at:.24});
  },

  /** チェリー。跳ねる2音＋余韻。スイカと聞き分くよう音色を変える */
  cherry(){
    tone(1174,.09,{type:'square',gain:.11});
    tone(880,.09,{type:'square',gain:.11,at:.08});
    tone(1318,.30,{type:'triangle',gain:.10,at:.17});
  },

  /** 1枚役・リーチ目役など「チャンス」寄りの小役 */
  chance(){
    tone(660,.08,{type:'sawtooth',gain:.10});
    tone(990,.08,{type:'sawtooth',gain:.10,at:.07});
  },

  /* ===================== 演出音 ===================== */

  /** カットイン。lv 1=弱 2=中 3=強 で派手さを変える */
  cutin(lv=1){
    if(lv>=3){ tone(1200,.28,{type:'sawtooth',gain:.15,sweepTo:2400}); noise(.22,{gain:.10,hz:5200}); }
    else if(lv===2){ tone(880,.20,{type:'square',gain:.12,sweepTo:1500}); }
    else { tone(620,.14,{type:'triangle',gain:.10,sweepTo:900}); }
  },

  /** ボーナス確定演出の「溜め」。だんだん上がって不安を煽る */
  charge(ms=700){
    tone(180,ms/1000,{type:'sawtooth',gain:.11,sweepTo:1400,attack:.05});
    noise(ms/1000,{gain:.05,hz:800,q:.7});
  },

  /** ボーナス確定の瞬間 */
  reveal(){
    arp([523,659,784,1046,1318],.05,.5,{type:'square',gain:.15});
    noise(.5,{gain:.10,hz:4200,q:.8});
  },

  /** BIG開始のファンファーレ */
  bonusStart(){
    arp([523,659,784],.09,.16,{type:'square',gain:.15});
    tone(1046,.55,{type:'square',gain:.15,at:.27});
  },

  /** ビタ押し成功 */
  vitaOk(){
    arp([1046,1318,1568,2093],.05,.22,{type:'triangle',gain:.15});
  },

  /** ビタ押し失敗 */
  vitaNg(){
    tone(200,.30,{type:'sawtooth',gain:.12,sweepTo:110});
  },

  /** フリーズ（プレミア） */
  freeze(){
    tone(60,1.6,{type:'sine',gain:.18,sweepTo:40,attack:.2});
    noise(1.6,{gain:.06,hz:300,q:.5});
  },

  /** AT突入 */
  atStart(){
    arp([659,784,988,1318,1568],.07,.4,{type:'triangle',gain:.15});
  },
};
