'use strict';
// 演出の追加分：ニコ動風コメント、イカサマ好機の小窓、差し替え可能な演出グラフィック。
// assets/fx/ に決まった名前の画像（.webp か .png）を置くと自動で使われ、無ければ既存の立ち絵で代用する。

const FX_KEYS=['tsukimao','nokosu','lucier','hehehe'];
const FX_KINDS=['gaze_watch','gaze_away','gaze_idle','cutin','move','houju','trick_ok','trick_ng','win'];
const fxArt=new Map();

function fxPreload() {
  if (typeof Image==='undefined') return;
  for (let c=0;c<4;c++) for (const kind of FX_KINDS) {
    const base='assets/fx/'+FX_KEYS[c]+'_'+kind;
    const img=new Image();
    img.onload=()=>fxArt.set(kind+c,img.src);
    img.onerror=()=>{
      if (img.dataset.tried) return;
      img.dataset.tried='1';
      img.src=base+'.png';
    };
    img.src=base+'.webp';
  }
}
fxPreload();
const fxSrc=(kind,c)=>fxArt.get(kind+c)||null;

const LINES=[
  { // 月真猫
    idle:['ふぁ…ねむ','この卓、空気重くない？','牌の音って落ち着くよね','あとで何食べよっかな','誰か今、嘘ついたでしょ','ん〜…いい牌こないなぁ'],
    start:['よろしく〜。手加減はしないけど','さ、遊ぼっか'],
    riichi:['リーチ。逃げないでね？','はい、リーチ。待ってるよ'],
    call:['それ、もらうね','ちょうだい'],
    tsumo:['ツモ。ごめんね〜','引いちゃった'],
    ron:['ロン。いただきます','それ、待ってた'],
    houju:['あ…やっちゃった','うそでしょ…','今の無し…にならない？'],
    watch:['ねぇ、その手。見えてるよ','イカサマ？やめときなって','じーっ…','動いたら噛むよ'],
    caught:['はい、現行犯〜','残念。ずっと見てた'],
    chance:['（今なら…いけるかも）','（だれも見てない…）'],
    cheatOk:['…ふふ、いただき','誰も見てないもんね'],
    cheatNg:['…ばれた？','ちぇっ'],
    veto:['その和了、欠けさせてあげる','月蝕の時間だよ'],
    vetoed:['は？今の何…','ちょっと、ずるくない？'],
    react:['わ、リーチ来た','こわ〜'],
    away:['ふぁ…（あくび）','窓の外、月きれい'],
    focus:['…集中、集中']
  },
  { // 残
    idle:['今の打牌、記録しておきますね','残り枚数、把握済みです','静かな卓は好きですよ','確率は嘘をつきません','ふふ、皆さん顔に出てます','その迷い、記録しました'],
    start:['よろしくお願いします。記録を始めます','では、残しましょうか'],
    riichi:['リーチです。逃げ道は計算済みです','立直。確率的には、もう詰みです'],
    call:['いただきます','それ、必要でした'],
    tsumo:['ツモ。予定どおりです','引きました。想定内です'],
    ron:['ロンです。記録に残しますね','その牌、待っていました'],
    houju:['…計算が、合わない','記録から消したいです','嘘…でしょう'],
    watch:['その手の動き、記録しました','イカサマですか？無駄ですよ','視線、外していませんから','次に動いたら指摘します'],
    caught:['はい、そこまでです','記録完了。言い逃れは無理ですね'],
    chance:['（視線ゼロ。今です）','（誰も見ていない…）'],
    cheatOk:['…記録には残りません','ふふ、完璧です'],
    cheatNg:['…見られていましたか','計算外です'],
    veto:['卓に残るのは、牌の音だけ','その和了、残しません'],
    vetoed:['…今、何を？','納得できません'],
    react:['リーチ、確認しました','待ちを絞ります'],
    away:['（手帳に何か書いている）','…眼鏡、拭きますね'],
    focus:['思考を澄ませます']
  },
  { // 流空
    idle:['退屈だな。もっと震えてくれよ','火、ある？','この卓に神はいない','君たちの手、透けて見える','勝ちは最初から決まってる','煙が目に染みるな'],
    start:['さあ、跪く準備はいいか','せいぜい楽しませてくれ'],
    riichi:['リーチ。祈る時間をやろう','立直だ。逃げ場はない'],
    call:['寄越せ','それは僕のだ'],
    tsumo:['ツモ。運命は僕を選ぶ','当然の結末だ'],
    ron:['ロン。その一枚が命取りだ','差し出してくれてありがとう'],
    houju:['……は？','この僕が…振った…？','今のは、見なかったことに'],
    watch:['イカサマしようとしても無駄だぞ','その指、一本ずつ折ろうか','僕の目を盗めると思った？','動くなよ'],
    caught:['見えてるって言っただろ','三流の手品だな'],
    chance:['（今だ。誰も見ていない）','（盤面は僕が書き換える）'],
    cheatOk:['…フッ、誰も気づかない','手品はこうやるんだ'],
    cheatNg:['チッ…目ざといな','…今のは試しただけだ'],
    veto:['その一枚が、勝ちを連れてきたと思った？','虚空に還れ'],
    vetoed:['僕の和了を…止めた？','面白い。覚えておく'],
    react:['リーチか。健気だな','その待ち、浅いよ'],
    away:['（煙を吐いて天井を見ている）','…今日の月は赤いな'],
    focus:['さて、本気を出すか']
  },
  { // 経経経経減
    idle:['へへへへへ','腹減ったなァ','筋肉は嘘をつかねェ','おい、牌が小せぇぞ','へへ…いい手が来てる気がするぜ','肩、こってきたな'],
    start:['へへへ、まとめてかかってこい','今日も卓をへし折るぜ'],
    riichi:['リーチだァ！へへへへへ','立直！腕が鳴るぜ'],
    call:['もらったァ','へへ、それいただき'],
    tsumo:['ツモォ！へへへへへ','引いたぜ、筋肉で'],
    ron:['ロンだァ！逃がさねェ','へへへ、それだよそれ'],
    houju:['ぐおぉぉ…やっちまった…','へ…へへ…へ…','筋肉が…泣いてる'],
    watch:['へへへ…見てるぞォ','イカサマか？握り潰すぞ','その手、動かしてみな','目ェ離さねえぞ'],
    caught:['へへへへへ！捕まえたァ','甘ェんだよ'],
    chance:['（へへ…今なら）','（誰も見てねェな…）'],
    cheatOk:['へへ…こっそり、こっそり','誰も見てねェ'],
    cheatNg:['ぐっ…見られてたか','へへ…冗談だって'],
    veto:['和了より先に、卓の掟が折れる','経典崩壊ィィ！'],
    vetoed:['あァ！？なんだ今の','俺の和了どこ行った！？'],
    react:['リーチか、へへへ上等だ','おっかねェな'],
    away:['（指を鳴らしている）','ふぁぁぁ…眠ィ'],
    focus:['ふんッ！集中ゥ！']
  }
];
const CROWD={
  start:['わこつ','きたあああ','待ってた','卓の空気やば'],
  riichi:['リーチきた','こわっ','おお'],
  win:['うおおお','88888','つよい'],
  big:['えぐい','満貫以上きたあああ','88888888'],
  houju:['あっ','やっちまったなあ','放銃ｗｗｗ','南無'],
  veto:['は？','暴牌きたあああ','ｗｗｗｗ','和了消えて草'],
  cheatOk:['今なんかした？','手品かな？','見えなかった','うまい'],
  caught:['バレてて草','現行犯','ｗｗｗ','そりゃ見てるわ'],
  draw:['流局か','おつ','平和だ'],
  suspect:['今、手が動いた？','なんか怪しい','袖、見た？','今のすり替えじゃね？','手つき怪しすぎｗ'],
  miss:['告発外れｗ','冤罪','あーあ','読み違えたな']
};

let chatOn=true, chatLanes=[], chatLast=0, chatQueue=[], chatTimer=0, idleAt=0;
let peekKey='', peekFrame=0, peekShown=-1, lastWatch=[], chanceSaid=null, flashUntil=0, flashTimer=0;
const pick=list=>list[Math.floor(Math.random()*list.length)];
const opps=()=>match.active.filter(p=>p);

function chatToggle() {
  chatOn=!chatOn;
  const b=document.getElementById('chat');
  b.textContent=chatOn?'コメント ON':'コメント OFF';
  b.setAttribute('aria-pressed',chatOn);
  if (!chatOn) { chatQueue=[]; document.getElementById('danmaku').replaceChildren(); }
}

// p: 卓の席（0=自分）。null なら観客コメント。
function say(p, text, {delay=0, priority=false}={}) {
  if (!chatOn || !match || !text) return;
  const item={p,text,at:Date.now()+delay};
  if (priority) chatQueue.unshift(item); else chatQueue.push(item);
  if (chatQueue.length>14) chatQueue.splice(8);
  pumpChat();
}
function sayLine(p, key, opts) {
  if (!match) return;
  const list=LINES[match.cast[p]][key];
  if (list) say(p,pick(list),opts);
}
function crowd(key, count=1, delay=150) {
  const pool=[...CROWD[key]];
  for (let i=0;i<count && pool.length;i++) {
    const text=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    say(null,text,{delay:delay+i*420+Math.random()*300});
  }
}
function pumpChat() {
  clearTimeout(chatTimer);
  if (!chatQueue.length) return;
  const now=Date.now();
  chatQueue.sort((a,b)=>a.at-b.at);
  const next=chatQueue[0];
  const wait=Math.max(next.at-now, chatLast+420-now);
  if (wait>0) { chatTimer=setTimeout(pumpChat,wait); return; }
  chatQueue.shift();
  chatLast=now;
  spawnComment(next);
  if (chatQueue.length) chatTimer=setTimeout(pumpChat,420);
}
function spawnComment({p,text}) {
  const layer=document.getElementById('danmaku');
  if (!layer || document.getElementById('game').hidden) return;
  const lanes=8, now=Date.now();
  let lane=0, best=Infinity;
  for (let i=0;i<lanes;i++) {
    const t=chatLanes[i]||0;
    if (t<best) { best=t; lane=i; }
  }
  chatLanes[lane]=now+1700+text.length*55;
  const el=document.createElement('span');
  el.className='nico'+(p===null?' crowd':p===0?' hero':'');
  if (p!==null) {
    const c=match.cast[p];
    el.style.setProperty('--tone',CAST[c].color);
    el.innerHTML='<b>'+CAST[c].name+'</b>'+escapeText(text);
  } else el.textContent=text;
  el.style.setProperty('--lane',lane);
  const seconds=Math.min(8.5,5.2+text.length*0.09);
  el.style.setProperty('--dur',seconds+'s');
  layer.append(el);
  const width=layer.clientWidth||0;
  if (width) el.style.setProperty('--travel',-(width+(el.offsetWidth||200)+20)+'px');
  el.classList.add('go');
  setTimeout(()=>el.remove?.(),seconds*1000+120);
}
function escapeText(s) { return s.replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]); }

function chatTick(paused) {
  if (!match || paused || !chatOn) return;
  const now=Date.now();
  if (!idleAt) idleAt=now+4000;
  if (now<idleAt) return;
  idleAt=now+4500+Math.random()*5000;
  const p=Math.random()<0.2?0:pick(opps());
  sayLine(p,'idle');
}

// match.events の1件ごとに呼ばれる。
function fxEvent(e) {
  if (!match) return;
  switch(e.kind) {
    case 'start':
      idleAt=Date.now()+6000;
      if (e.hand===0 && e.honba===0) {
        crowd('start',2,200);
        const list=opps(), q=pick(list);
        sayLine(q,'start',{delay:900});
        const r=list.filter(x=>x!==q);
        if (r.length && Math.random()<0.5) sayLine(pick(r),'start',{delay:2200});
      }
      break;
    case 'riichi':
      sayLine(e.p,'riichi',{priority:true});
      { const q=match.active.filter(x=>x!==e.p); sayLine(pick(q),'react',{delay:700}); }
      if (Math.random()<0.6) crowd('riichi',1,400);
      break;
    case 'call':
      if (Math.random()<0.6) sayLine(e.p,'call');
      break;
    case 'claim':
      sayLine(e.p,e.from===null?'tsumo':'ron',{priority:true});
      break;
    case 'focus':
      sayLine(0,'focus');
      break;
    case 'cheat':
      sayLine(0,'cheatOk',{priority:true});
      crowd('cheatOk',2,500);
      flash('trick_ok',match.cast[0],'すり替え成功',tileName(e.id)+' → '+tileName(e.incoming));
      break;
    case 'caught': {
      const watcher=lastWatch.length?lastWatch[0]:pick(opps());
      sayLine(watcher,'caught',{priority:true});
      sayLine(0,'cheatNg',{delay:800});
      crowd('caught',2,500);
      flash('trick_ng',match.cast[0],'イカサマ発覚',match.name(watcher)+'に見破られた');
      break;
    }
    case 'veto':
      sayLine(e.p,'veto',{priority:true});
      sayLine(e.target,'vetoed',{delay:1300});
      crowd('veto',3,300);
      break;
    case 'win': {
      const total=e.result?.total||0;
      crowd(total>=8000?'big':'win',total>=8000?3:1,300);
      if (e.from!==null && e.from!==undefined) {
        sayLine(e.from,'houju',{delay:250,priority:true});
        crowd('houju',2,600);
        flash('houju',match.cast[e.from],'放銃',match.name(e.from)+'　−'+number(Math.abs(e.delta[e.from])),1700);
      }
      break;
    }
    case 'draw':
      if (Math.random()<0.7) crowd('draw',1,200);
      break;
    case 'aiCheat':
      // 相手のイカサマは、性格に応じた確率で仕草やコメントににじむ。
      if (match.duel && Math.random()<(match.duel.tell??.5)) {
        if (Math.random()<.5) sayLine(e.p,'cheatOk',{delay:300}); else crowd('suspect',1,250);
        const seat=document.getElementById('seat'+e.p);
        seat?.classList.remove('suspect'); void seat?.offsetWidth; seat?.classList.add('suspect');
      }
      break;
    case 'accused':
      sayLine(e.p,'caught',{priority:true});
      sayLine(e.target,'cheatNg',{delay:900});
      crowd('caught',2,500);
      flash('trick_ng',match.cast[e.target],'イカサマ発覚',match.name(e.p)+'の告発',1700);
      break;
    case 'accuseMiss':
      sayLine(e.target,'vetoed',{priority:true});
      crowd('miss',2,400);
      break;
  }
}

// 演出画像を卓の上に短く重ねる。画像が無いときは立ち絵で代用する。
function flash(kind, c, text, sub, ms=1500) {
  const box=document.getElementById('fxFlash');
  if (!box) return;
  const src=fxSrc(kind,c);
  box.className='fx-flash fx-'+kind+(src?' custom':'');
  box.style.setProperty('--tone',CAST[c].color);
  document.getElementById('fxImg').src=src||'assets/body'+c+'.webp';
  document.getElementById('fxText').textContent=text;
  document.getElementById('fxSub').textContent=sub||'';
  box.hidden=false;
  flashUntil=Date.now()+ms;
  clearTimeout(flashTimer);
  flashTimer=setTimeout(()=>{ box.hidden=true; },ms);
}
const flashBusy=()=>Math.max(0,flashUntil-Date.now());

// イカサマ好機の小窓。chance=すり替え可能な自分の手番か。
function peek(chance, watched, note='') {
  const box=document.getElementById('peek');
  if (!box) return;
  if (!chance) {
    if (!box.hidden) box.hidden=true;
    lastWatch=watched;
    return;
  }
  const now=Date.now();
  const fresh=watched.filter(p=>!lastWatch.includes(p));
  if (!note) for (const p of fresh) sayLine(p,'watch',{priority:true});
  const turnKey=match.game.hand+':'+match.game.honba+':'+match.s.wall.length;
  if (!note && !watched.length && chanceSaid!==turnKey) {
    chanceSaid=turnKey;
    sayLine(0,'chance');
    if (Math.random()<0.5) sayLine(pick(opps()),'away',{delay:600});
  }
  lastWatch=watched;
  const watching=watched.length>0;
  const list=opps(), p=watching?watched[0]:list[Math.floor(now/1700)%list.length];
  const c=match.cast[p];
  peekFrame=Math.floor(now/900)%2;
  const kind=watching?'gaze_watch':(peekFrame?'gaze_idle':'gaze_away');
  const src=fxSrc(kind,c)||fxSrc(watching?'gaze_watch':'gaze_away',c);
  const key=p+kind+(src?'1':'0')+note;
  if (key!==peekKey) {
    peekKey=key;
    const img=document.getElementById('peekImg');
    img.src=src||'assets/body'+c+'.webp';
    box.classList.toggle('custom',!!src);
    box.classList.toggle('watch',watching);
    box.classList.toggle('away',!watching);
    box.classList.toggle('glance',!watching && !!peekFrame);
    box.style.setProperty('--tone',CAST[c].color);
    document.getElementById('peekName').textContent=match.name(p);
    document.getElementById('peekState').textContent=watching?'監視中':note?'よそ見 · '+note:'よそ見 · 好機';
    if (p!==peekShown) {
      peekShown=p;
      box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
    }
  }
  if (box.hidden) box.hidden=false;
}

// 暴牌カットインに専用画像を適用する。
function fxCutin(c) {
  const cut=document.getElementById('cutin');
  const band=fxSrc('cutin',c), move=fxSrc('move',c);
  cut.classList.toggle('custom-band',!!band);
  cut.classList.toggle('has-move',!!move);
  if (band) document.getElementById('cutinBody').src=band;
  const layer=document.getElementById('cutinArt');
  if (layer) layer.style.backgroundImage=move?'url("'+move+'")':'';
}
function fxReset() {
  chatQueue=[]; chatLanes=[]; lastWatch=[]; peekKey=''; peekShown=-1; idleAt=0; flashUntil=0;
  clearTimeout(chatTimer); clearTimeout(flashTimer);
  const layer=document.getElementById('danmaku'); if (layer) layer.replaceChildren();
  const f=document.getElementById('fxFlash'); if (f) f.hidden=true;
  const pk=document.getElementById('peek'); if (pk) pk.hidden=true;
}
