'use strict';

const R = typeof module === 'undefined' ? Rules : require('./rules.js');
const CAST = [
  {name:'月真猫', reading:'つきまお', move:'月蝕', color:'#e85654', cost:60, style:'eclipse', line:'月が欠ける。その和了も欠ける。', details:'暴牌に技60。阻止した次の自分の打牌で技＋12。'},
  {name:'残', reading:'nokosu', move:'残響', color:'#e88db4', cost:50, style:'echo', line:'卓に残るのは、牌の音だけ。', details:'暴牌に技50。4人の中で一番少ない技で出せる。'},
  {name:'流空', reading:'ルシエル', move:'虚空', color:'#8bcae4', cost:65, style:'void', line:'その一枚が、勝ちを連れてきたと思った？', details:'暴牌に技65。阻止した次の手番は監視が外れ、イカサマの好機が続く。'},
  {name:'経経経経減', reading:'へへへへへ', move:'経典崩壊', color:'#efad65', cost:70, style:'ruin', line:'和了より先に、卓の掟が折れる。', details:'暴牌に技70。阻止後、和了を宣言した相手の技を30削る。'}
];
const WIND = ['東','南','西','北'];
const DUEL_WALL = 64;
// イカサマの技。成功すると技ポイントがたまり、暴牌に使う。1局に1回まで、燕返しは1試合に1回。
const TRICKS = {
  swap:   {name:'すり替え',   gain:15},
  river:  {name:'川すり替え', gain:20},
  tsubame:{name:'燕返し',     gain:30}
};
const CAUGHT_LOSS = 10;
const AI_CHEAT_4P = .03;
const AI_ACCUSE_4P = .2;
const sorted = hand => [...hand].sort((a,b)=>a-b);

class Match {
  constructor({hero=0, mode='dark', length=8, rng=Math.random, duel=null} = {}) {
    this.hero = hero;
    this.cast = Array.from({length:4},(_,i)=>(hero+i)%4);
    this.dark = mode==='dark';
    this.length = length;
    this.rng = rng;
    // duel: 2人打ち。{opponent, vigilance(1-4), cheatRate, gauge, accuse}
    this.duel = duel;
    this.active = duel ? [0,2] : [0,1,2,3];
    if (duel) {
      const rest=[0,1,2,3].filter(c=>c!==hero && c!==duel.opponent);
      this.cast=[hero,rest[0],duel.opponent,rest[1]];
    }
    this.events = [];
    this.revision = 0;
    this.game = {scores:[25000,25000,25000,25000], hand:0, honba:0, sticks:0};
    this.skill = Array.from({length:4},()=>({gauge:this.dark?20:0, boost:false}));
    if (duel && this.dark) this.skill[2].gauge=duel.gauge ?? 20;
    this.tsubameUsed = false;
    this.startHand();
  }
  event(kind, data={}) {
    this.events.push({kind,...data});
    if (this.events.length>80) this.events.shift();
  }
  startHand(deck) {
    const wall = deck ? deck.slice() : Array.from({length:136},(_,i)=>i);
    if (!deck) for (let i=wall.length-1;i>0;i--) {
      const j = Math.floor(this.rng()*(i+1));
      [wall[i],wall[j]] = [wall[j],wall[i]];
    }
    const n = this.active.length;
    const dealer = this.active[this.game.hand%n];
    const dead = wall.splice(0,14);
    this.s = {
      wall, dead, dealer, kans:0, interrupted:false, turn:dealer, phase:'draw',
      pending:null, response:null, kan:null, result:null,
      players:Array.from({length:4},()=>({
        hand:[],river:[],melds:[],riichi:0,riichiMark:false,ippatsu:false,skip:false,lockedRon:false,
        drawn:null,source:null,forbidden:[],cheat:false,dirty:false,tried:false
      }))
    };
    const order=[0,1,2,3].map(i=>(dealer+i)%4).filter(p=>this.active.includes(p));
    for (let block=0;block<3;block++) for (const p of order) {
      this.s.players[p].hand.push(...wall.splice(-4).reverse());
    }
    for (const p of order) this.s.players[p].hand.push(wall.pop());
    // 2人打ちは山を1人あたり約20巡に絞り、4人打ちと同じ手の進み方にする。
    this.s.sunk = this.duel && !deck ? wall.splice(0,Math.max(0,wall.length-(this.duel.wall||DUEL_WALL))) : [];
    this.winBackup = null;
    this.event('start',{hand:this.game.hand,honba:this.game.honba});
    this.draw();
  }
  get round() { return this.roundName(this.game.hand); }
  roundName(hand) { const n=this.active.length; return WIND[Math.floor(hand/n)]+(hand%n+1)+'局'; }
  next(p) { const i=this.active.indexOf(p); return this.active[(i+1)%this.active.length]; }
  get roundWind() { return 27+Math.floor(this.game.hand/this.active.length); }
  seat(p) { return (p-this.s.dealer+4)%4; }
  name(p) { return CAST[this.cast[p]].name; }
  indicators() { return Array.from({length:1+this.s.kans},(_,i)=>this.s.dead[4+2*i]); }
  ura() { return Array.from({length:1+this.s.kans},(_,i)=>this.s.dead[5+2*i]); }
  bump() { this.revision++; }
  charge(p,n) {
    if (this.dark) this.skill[p].gauge = Math.max(0,Math.min(100,this.skill[p].gauge+n));
  }
  waits(p) { const v=this.s.players[p]; return R.waits(v.hand,v.melds); }
  furiten(p) {
    const v = this.s.players[p];
    if (v.skip || v.lockedRon) return true;
    if (!v.river.length) return false;
    const waits=this.waits(p);
    return v.river.some(d=>waits.includes(R.type(d.id)));
  }
  score(p, tile, tsumo, chankan=false) {
    const v=this.s.players[p];
    if (!tsumo && this.furiten(p)) return null;
    const last = !this.s.wall.length && (tsumo ? v.source==='live' : this.s.response?.last);
    return R.evaluate(tsumo?v.hand:[...v.hand,tile], v.melds, tile, {
      dealer:p===this.s.dealer, seat:27+this.seat(p), wind:this.roundWind,
      tsumo, chankan, last, riichi:v.riichi, ippatsu:v.ippatsu,
      rinshan:tsumo && v.source==='rinshan',
      heaven:tsumo && v.source==='live' && !this.s.interrupted && !v.river.length && !v.cheat,
      dora:this.indicators(), ura:this.ura()
    });
  }
  draw(rinshan=false) {
    if (this.s.phase!=='draw') return false;
    const s=this.s;
    if (!s.wall.length) { this.exhaust(); return true; }
    const p=s.turn, v=s.players[p];
    const id=rinshan ? s.dead[s.kans-1] : s.wall.pop();
    if (rinshan) s.dead[s.kans-1] = s.wall.shift();
    v.hand.push(id);
    v.drawn=id;
    v.source=rinshan?'rinshan':'live';
    v.skip=false;
    v.forbidden=[];
    if (!rinshan) v.cheat=false;
    s.phase='discard';
    this.revision++;
    if (p===0 && !rinshan) {
      const boosted = this.skill[p].boost && this.cast[p]===2;
      this.gaze = {start:Date.now(), seed:Math.floor(this.rng()*6), boosted};
      if (boosted) this.skill[p].boost=false;
    }
    if (p!==0 && !rinshan && this.dark && !v.riichi && !v.dirty && this.rng()<(this.duel ? this.duel.cheatRate||0 : AI_CHEAT_4P)) this.aiCheat(p);
    if (this.score(p,id,true)) s.phase='tsumo';
    return true;
  }
  canDiscard(id) {
    const s=this.s, v=s.players[s.turn];
    return s.phase==='discard' && v.hand.includes(id) && (!v.riichi || id===v.drawn)
      && !v.forbidden.includes(R.type(id));
  }
  riichiChoices(p=this.s.turn) {
    const s=this.s, v=s.players[p];
    if (p!==s.turn || !['discard','tsumo'].includes(s.phase) || v.riichi ||
        !R.closed(v.melds) || s.wall.length<4 || this.game.scores[p]<1000) return [];
    const results=new Map();
    return v.hand.filter(id=>{
      const t=R.type(id);
      if (!results.has(t)) results.set(t,R.waits(v.hand.filter(n=>n!==id),v.melds).length>0);
      return results.get(t);
    });
  }
  discard(id, riichi=false) {
    if (!this.canDiscard(id) || (riichi && !this.riichiChoices().includes(id))) return false;
    const s=this.s, p=s.turn, v=s.players[p];
    const last=!s.wall.length && v.source!=='rinshan';
    const tsumogiri=v.drawn===id;
    v.hand=v.hand.filter(n=>n!==id);
    v.drawn=null;
    v.source=null;
    v.forbidden=[];
    if (v.riichi) v.ippatsu=false;
    v.river.push({id,tsumogiri,riichi:riichi||v.riichiMark,called:false});
    v.riichiMark=false;
    if (this.skill[p].boost && this.cast[p]===0) {
      this.charge(p,12);
      this.skill[p].boost=false;
    }
    this.event('discard',{p,id,riichi,tsumogiri});
    if (riichi) this.event('riichi',{p});
    this.openResponse(p,id,{last,riichi});
    return true;
  }
  openResponse(from,id,{last=false,riichi=false,kan=false}={}) {
    const s=this.s;
    s.response={from,id,last,riichi,kan,ron:[]};
    for (let offset=1;offset<=3;offset++) {
      const p=(from+offset)%4;
      if (!this.active.includes(p)) continue;
      const v=s.players[p];
      if (!R.completes(v.hand,v.melds,id)) continue;
      const result=this.score(p,id,false,kan);
      if (!result || (kan && s.kan.kind==='ankan' && !result.yaku.some(y=>y.name==='国士無双'))) {
        if (!kan || s.kan.kind==='kakan') {
          if (v.riichi) v.lockedRon=true;
          else v.skip=true;
        }
        continue;
      }
      s.response.ron.push({p,result,accepted:p!==0});
    }
    s.phase='response';
    this.bump();
    if (!s.response.ron.some(o=>o.p===0)) this.continueRon();
  }
  chooseRon(accept) {
    if (this.s.phase!=='response') return false;
    const offer=this.s.response.ron.find(o=>o.p===0);
    if (!offer || offer.answered) return false;
    offer.accepted=accept;
    offer.answered=true;
    if (!accept) {
      const v=this.s.players[0];
      if (v.riichi) v.lockedRon=true;
      else v.skip=true;
    }
    this.continueRon();
    return true;
  }
  continueRon() {
    const response=this.s.response;
    const next=response.ron.find(o=>o.accepted && !o.blocked);
    if (next) {
      this.proposeWin(next.p,response.from,response.id,next.result);
      return;
    }
    if (response.kan) { this.finishKan(); return; }
    if (response.riichi) {
      const p=response.from, v=this.s.players[p];
      v.riichi=!this.s.interrupted && v.river.length===1?2:1;
      v.ippatsu=true;
      this.game.scores[p]-=1000;
      this.game.sticks++;
    }
    if (!this.s.wall.length) { this.exhaust(); return; }
    this.s.phase='calls';
    this.bump();
  }
  calls(p) {
    const s=this.s, v=s.players[p], {from,id}=s.response;
    if (p===from || v.riichi || !s.wall.length) return [];
    const t=R.type(id);
    const same=v.hand.filter(n=>R.type(n)===t);
    const out=[];
    function unique(options, combo) {
      const signature=combo.map(n=>R.type(n)*2+Number(R.red(n))).sort((a,b)=>a-b).join();
      if (options.has(signature)) return false;
      options.add(signature);
      return true;
    }
    if (same.length>=2 && v.hand.some(n=>R.type(n)!==t)) {
      const seen=new Set();
      same.forEach((a,i)=>same.slice(i+1).forEach(b=>{
        if (unique(seen,[a,b])) out.push({kind:'pon',tiles:[a,b],forbidden:[t]});
      }));
    }
    if (same.length===3 && s.kans<4) out.push({kind:'minkan',tiles:same,forbidden:[]});
    if (p!==(from+1)%4 || t>=27) return out;
    const seen=new Set();
    for (let start=t-2;start<=t;start++) {
      if (start<0 || start%9>6 || Math.floor(start/9)!==Math.floor(t/9)) continue;
      const other=[start,start+1,start+2].filter(n=>n!==t);
      const forbidden=[t];
      if (t===start && t%9<=5) forbidden.push(t+3);
      if (t===start+2 && t%9>=3) forbidden.push(t-3);
      for (const a of v.hand.filter(n=>R.type(n)===other[0])) {
        for (const b of v.hand.filter(n=>R.type(n)===other[1])) {
          if (v.hand.some(n=>n!==a && n!==b && !forbidden.includes(R.type(n))) &&
            unique(seen,[a,b])) out.push({kind:'chi',tiles:[a,b],forbidden});
        }
      }
    }
    return out;
  }
  chooseCall(index=-1) {
    if (this.s.phase!=='calls') return false;
    const s=this.s, {from}=s.response;
    const human=this.calls(0);
    if (index>=human.length) return false;
    const selected=index>=0 ? [{p:0,call:human[index]}] : [];
    for (let offset=1;offset<=3;offset++) {
      const p=(from+offset)%4;
      if (!p || !this.active.includes(p)) continue;
      const call=this.aiCall(p,this.calls(p));
      if (call) selected.push({p,call});
    }
    selected.sort((a,b)=>Number(a.call.kind==='chi')-Number(b.call.kind==='chi') ||
      (a.p-from+4)%4-(b.p-from+4)%4);
    if (selected.length) this.makeCall(selected[0].p,selected[0].call);
    else {
      s.turn=this.next(from);
      s.phase='draw';
      s.response=null;
      this.bump();
    }
    return true;
  }
  expose(p,kind,tiles,from=null,called=null,index=null,added=null) {
    const v=this.s.players[p];
    const meld={kind,tiles:sorted(tiles),from,called,added};
    if (index===null) v.melds.push(meld);
    else v.melds[index]=meld;
    v.drawn=null;
    v.source=null;
    this.s.interrupted=true;
    for (const q of this.s.players) q.ippatsu=false;
    this.event('call',{p,call:kind,tiles:meld.tiles});
  }
  makeCall(p,call) {
    const s=this.s, {from,id}=s.response;
    const v=s.players[p];
    const called=s.players[from].river.at(-1);
    called.called=true;
    if (called.riichi) s.players[from].riichiMark=true;
    v.hand=v.hand.filter(n=>!call.tiles.includes(n));
    v.forbidden=call.forbidden;
    v.cheat=false;
    this.expose(p,call.kind,[...call.tiles,id],from,id);
    s.turn=p;
    s.response=null;
    if (call.kind==='minkan') this.rinshan();
    else { s.phase='discard'; this.bump(); }
  }
  kans() {
    const s=this.s, v=s.players[s.turn];
    if (s.phase!=='discard' || !s.wall.length || s.kans>=4 || v.drawn===null) return [];
    const c=R.count(v.hand), out=[];
    for (let t=0;t<34;t++) if (c[t]===4) {
      const ids=v.hand.filter(n=>R.type(n)===t);
      if (v.riichi && !R.riichiKan(v.hand,v.melds,v.drawn,ids)) continue;
      out.push({kind:'ankan',ids,id:ids.includes(v.drawn)?v.drawn:ids.at(-1)});
    }
    if (!v.riichi) v.melds.forEach((m,index)=>{
      if (m.kind!=='pon') return;
      const id=v.hand.find(n=>R.type(n)===R.type(m.tiles[0]));
      if (id!==undefined) out.push({kind:'kakan',ids:[id],id,index});
    });
    return out;
  }
  declareKan(index) {
    const choice=this.kans()[index];
    if (!choice) return false;
    this.s.kan=choice;
    this.openResponse(this.s.turn,choice.id,{kan:true});
    return true;
  }
  finishKan() {
    const s=this.s, p=s.turn, v=s.players[p], kan=s.kan;
    v.hand=v.hand.filter(n=>!kan.ids.includes(n));
    const previous=v.melds[kan.index];
    this.expose(p,kan.kind,previous ? [...previous.tiles,kan.id] : kan.ids,
      previous?.from,previous?.called,kan.index ?? null,kan.kind==='kakan'?kan.id:null);
    s.kan=null;
    s.response=null;
    this.rinshan();
  }
  rinshan() {
    this.s.kans++;
    this.s.phase='draw';
    this.draw(true);
  }
  chooseTsumo(accept) {
    const s=this.s;
    if (s.phase!=='tsumo') return false;
    s.phase='discard';
    if (accept) {
      const p=s.turn, id=s.players[p].drawn;
      this.proposeWin(p,null,id,this.score(p,id,true));
    } else {
      if (s.players[s.turn].riichi) s.players[s.turn].lockedRon=true;
      this.bump();
    }
    return true;
  }
  proposeWin(p,from,id,result) {
    this.winBackup=structuredClone(this.s);
    this.s.pending={p,from,id,result};
    this.s.phase='veto';
    this.event('claim',{p,from,id});
    this.bump();
  }
  vetoOptions() {
    if (!this.dark || this.s.phase!=='veto') return [];
    const {p,from,result}=this.s.pending;
    return this.active.filter(q=>q!==p && this.skill[q].gauge>=CAST[this.cast[q]].cost &&
      (q===0 || !this.duel || (this.vetoUsed||0)<(this.duel.vetoLimit??1)) &&
      (q===0 || ((q===from || from===null) && result.total>=3900)));
  }
  resolveWin(humanVeto=false) {
    const s=this.s;
    if (s.phase!=='veto') return false;
    const allowed=this.vetoOptions();
    const claim=s.pending;
    // 2人打ち：自分がイカサマをした局に和了すると、相手が告発してくることがある。
    if (this.dark && claim.p===0 && s.players[0].dirty && !humanVeto && this.rng()<(this.duel ? this.duel.accuse||0 : AI_ACCUSE_4P)) {
      this.penalty(0,this.duel?2:1+Math.floor(this.rng()*3));
      return true;
    }
    const breaker=humanVeto && allowed.includes(0) ? 0 :
      allowed.filter(p=>p!==0).sort((a,b)=>Number(b===claim.from)-Number(a===claim.from) ||
        this.skill[b].gauge-this.skill[a].gauge)[0];
    if (breaker!==undefined) {
      const hero=CAST[this.cast[breaker]];
      this.s=this.winBackup;
      this.winBackup=null;
      this.charge(breaker,-hero.cost);
      if (breaker!==0) this.vetoUsed=(this.vetoUsed||0)+1;
      if (this.cast[breaker]===0 || this.cast[breaker]===2) this.skill[breaker].boost=true;
      if (this.cast[breaker]===3) this.charge(claim.p,-30);
      this.s.phase='blocked';
      this.blocked=claim;
      this.event('veto',{p:breaker,target:claim.p,id:claim.id});
      this.bump();
    } else this.settle(claim);
    return true;
  }
  resume() {
    if (this.s.phase!=='blocked') return false;
    const {p,from}=this.blocked;
    this.blocked=null;
    if (from===null) { this.s.phase='discard'; this.bump(); }
    else {
      this.s.phase='response';
      this.s.response.ron.find(o=>o.p===p).blocked=true;
      this.continueRon();
    }
    return true;
  }
  watchers(now=Date.now()) {
    if (!this.gaze || this.gaze.boosted) return [];
    const step=Math.floor((now-this.gaze.start)/1050);
    if (this.duel) {
      // 6拍のうち vigilance 拍だけ相手がこちらを見る。並びは局ごとに変わる。
      const phase=(step*5+this.gaze.seed)%6;
      return phase<(this.duel.vigilance||2) ? [2] : [];
    }
    const phase=(step+this.gaze.seed)%6;
    return [[1],[2],[],[3],[],[1,3]][phase];
  }
  // イカサマができる手番か（1局に1回まで）。
  canCheat() {
    const s=this.s, v=s.players[0];
    return this.dark && s.turn===0 && s.phase==='discard' && !v.riichi &&
      v.source==='live' && v.drawn!==null && !v.tried && s.wall.length>=3;
  }
  canRiverSwap() {
    return this.canCheat() && this.s.players[0].river.some(d=>!d.called);
  }
  canTsubame() {
    const v=this.s.players[0];
    return this.canCheat() && !this.tsubameUsed && !v.river.length && !v.melds.length && this.s.wall.length>=20;
  }
  // 監視されていれば失敗。技ポイントを失い、この局のイカサマは終わり。
  attempt(kind, now) {
    const v=this.s.players[0];
    v.tried=true;
    if (kind==='tsubame') this.tsubameUsed=true;
    if (this.watchers(now).length) {
      this.charge(0,-CAUGHT_LOSS);
      this.event('caught',{p:0,trick:kind});
      this.bump();
      return false;
    }
    return true;
  }
  succeed(kind, data) {
    const v=this.s.players[0];
    v.dirty=true;
    v.cheat=true;
    this.charge(0,TRICKS[kind].gain);
    this.event('cheat',{p:0,trick:kind,...data});
    if (this.score(0,v.drawn,true)) this.s.phase='tsumo';
    this.bump();
    return true;
  }
  // すり替え：手牌1枚と、山の手前3枚のうち一番手が進む牌を入れ替える。
  cheat(id,now=Date.now()) {
    if (!this.canCheat() || !this.s.players[0].hand.includes(id)) return false;
    if (!this.attempt('swap',now)) return true;
    const v=this.s.players[0], wall=this.s.wall;
    const base=v.hand.filter(n=>n!==id);
    let pos=wall.length-1, best=Infinity;
    for (let k=1;k<=Math.min(3,wall.length);k++) {
      const i=wall.length-k, d=R.shanten([...base,wall[i]],v.melds);
      if (d<best) { best=d; pos=i; }
    }
    const incoming=wall[pos];
    wall[pos]=id;
    v.hand[v.hand.indexOf(id)]=incoming;
    v.drawn=incoming;
    return this.succeed('swap',{id,incoming});
  }
  // 川すり替え：手牌1枚と、自分の捨て牌1枚を入れ替える。
  riverSwap(id,index,now=Date.now()) {
    const v=this.s.players[0], d=v.river[index];
    if (!this.canRiverSwap() || !v.hand.includes(id) || !d || d.called) return false;
    if (!this.attempt('river',now)) return true;
    const incoming=d.id;
    d.id=id;
    v.hand[v.hand.indexOf(id)]=incoming;
    v.drawn=incoming;
    return this.succeed('river',{id,incoming});
  }
  // 燕返し：配牌直後に、手牌を山に仕込んだ牌とまとめて入れ替える（1試合に1回）。
  tsubame(now=Date.now()) {
    if (!this.canTsubame()) return false;
    if (!this.attempt('tsubame',now)) return true;
    const v=this.s.players[0], wall=this.s.wall;
    const span=Math.min(40,wall.length);
    let changed=0;
    for (let round=0;round<7;round++) {
      const current=R.shanten(v.hand,v.melds);
      if (current<=0) break;
      let best=null, value=current;
      for (const id of new Set(v.hand)) {
        const rest=v.hand.filter(n=>n!==id);
        for (let k=1;k<=span;k++) {
          const i=wall.length-k, d=R.shanten([...rest,wall[i]],v.melds);
          if (d<value) { value=d; best={id,i}; }
        }
      }
      if (!best) break;
      const incoming=wall[best.i];
      wall[best.i]=best.id;
      v.hand[v.hand.indexOf(best.id)]=incoming;
      if (v.drawn===best.id) v.drawn=incoming;
      changed++;
    }
    return this.succeed('tsubame',{changed});
  }
  payment(delta,from,to,amount) { delta[from]-=amount; delta[to]+=amount; }
  liability(p,name) {
    const key=name==='大三元' ? t=>t>=31 : t=>t>=27&&t<31;
    const threshold=name==='大三元'?3:4;
    const exposed=this.s.players[p].melds.filter(m=>m.kind!=='chi' && key(R.type(m.tiles[0])));
    const responsible=exposed[threshold-1];
    return responsible?.from ?? null;
  }
  settle(claim) {
    const s=this.s, {p,from,id,result}=claim;
    const delta=[0,0,0,0], {honba,sticks}=this.game;
    const dealer=p===s.dealer;
    const pay=(seat,amount)=>this.payment(delta,seat,p,amount);
    const liable=result.yakuman ? result.yaku.filter(y=>['大三元','大四喜'].includes(y.name))
      .map(y=>this.liability(p,y.name)).filter(q=>q!==null) : [];
    const ordinary=result.base-8000*liable.length;
    for (const seat of liable) {
      const full=8000*(dealer?6:4);
      if (from===null || from===seat) pay(seat,full);
      else { pay(seat,full/2); pay(from,full/2); }
    }
    if (from===null && this.duel) {
      // 2人打ちのツモは、相手がロンと同じ額を払う。
      const q=this.next(p);
      if (ordinary>0) pay(q,R.up100(ordinary*(dealer?6:4)));
      pay(q,300*honba);
    } else if (from===null) {
      for (let q=0;q<4;q++) if (q!==p) {
        pay(q,R.up100(ordinary*(dealer||q===s.dealer?2:1))+(liable.length?0:100*honba));
      }
      if (liable.length) pay(liable[0],300*honba);
    } else pay(from,R.up100(ordinary*(dealer?6:4))+300*honba);
    delta[p]+=1000*sticks;
    if (this.wrongAccusation) { this.payment(delta,0,p,this.wrongAccusation); this.wrongAccusation=0; }
    this.game.sticks=0;
    this.winBackup=null;
    this.end({kind:'win',p,from,id,result,delta,repeat:dealer,
      hand:sorted(s.players[p].hand.concat(from===null?[]:[id])), melds:s.players[p].melds,
      ura:s.players[p].riichi ? this.ura() : []});
  }
  exhaust() {
    const s=this.s;
    const tenpai=this.active.filter(p=>this.waits(p).length);
    const delta=[0,0,0,0];
    const n=this.active.length, pool=this.duel?1500:3000;
    if (tenpai.length && tenpai.length<n) for (const p of this.active) {
      delta[p]=tenpai.includes(p)?pool/tenpai.length:-pool/(n-tenpai.length);
    }
    this.end({kind:'draw',tenpai,delta,repeat:tenpai.includes(s.dealer)});
  }
  end(result) {
    this.s.phase='result';
    this.s.pending=null;
    this.s.response=null;
    this.s.kan=null;
    this.s.result=result;
    result.delta.forEach((n,p)=>this.game.scores[p]+=n);
    result.final=!result.repeat && this.game.hand+1>=this.length;
    if (this.duel && this.active.some(p=>this.game.scores[p]<0)) result.final=result.bust=true;
    if (result.final && this.game.sticks) {
      const leader=this.ranking()[0].p;
      this.game.scores[leader]+=1000*this.game.sticks;
      result.delta[leader]+=1000*this.game.sticks;
      this.game.sticks=0;
    }
    this.event(result.kind,result);
    this.bump();
  }
  ranking() {
    return this.game.scores.map((score,p)=>({p,score})).filter(x=>this.active.includes(x.p))
      .sort((a,b)=>b.score-a.score||a.p-b.p);
  }
  nextHand() {
    if (this.s.phase!=='result' || this.s.result.final) return false;
    const result=this.s.result;
    if (!result.repeat) this.game.hand++;
    if (result.kind!=='penalty') this.game.honba=result.repeat || result.kind==='draw' ? this.game.honba+1 : 0;
    this.startHand();
    return true;
  }
  // CPUのすり替え：山の手前数枚から手が最も進む牌を選び、引いた牌と入れ替える。
  aiCheat(p) {
    const s=this.s, v=s.players[p], id=v.drawn;
    const depth=Math.min(5,s.wall.length);
    if (!depth) return false;
    const base=v.hand.filter(n=>n!==id);
    let best=-1, value=R.shanten(v.hand,v.melds);
    for (let k=1;k<=depth;k++) {
      const cand=s.wall[s.wall.length-k];
      const d=R.shanten([...base,cand],v.melds);
      if (d<value) { value=d; best=s.wall.length-k; }
    }
    if (best<0) return false;
    const incoming=s.wall[best];
    s.wall[best]=id;
    v.hand[v.hand.indexOf(id)]=incoming;
    v.drawn=incoming;
    v.dirty=true;
    this.charge(p,TRICKS.swap.gain);
    this.event('aiCheat',{p});
    return true;
  }
  // 自分が相手の和了宣言を告発する。相手がこの局でイカサマをしていれば罰符、外れなら和了に加えて2000点を払う。
  canAccuse() {
    return this.dark && this.s.phase==='veto' && this.s.pending.p!==0;
  }
  accuse() {
    if (!this.canAccuse()) return false;
    const claim=this.s.pending;
    if (this.s.players[claim.p].dirty) { this.penalty(claim.p,0); return 'hit'; }
    this.wrongAccusation=2000;
    this.event('accuseMiss',{p:0,target:claim.p});
    this.settle(claim);
    return 'miss';
  }
  // イカサマの罰符。親なら12000、子なら8000を告発した側へ。局は同じ親でやり直し。
  penalty(cheater,accuser) {
    const s=this.s;
    if (this.winBackup) { this.s=this.winBackup; this.winBackup=null; }
    const amount=cheater===this.s.dealer?12000:8000;
    const delta=[0,0,0,0];
    this.payment(delta,cheater,accuser,amount);
    this.event('accused',{p:accuser,target:cheater});
    this.end({kind:'penalty',p:cheater,by:accuser,amount,delta,repeat:true});
  }
  aiCall(p, choices) {
    const v=this.s.players[p];
    if (!choices.length) return null;
    const old=R.shanten(v.hand,v.melds);
    let best=null, value=Infinity;
    for (const call of choices) {
      const tiles=[...call.tiles,this.s.response.id];
      const melds=[...v.melds,{kind:call.kind,tiles}];
      const hand=v.hand.filter(id=>!call.tiles.includes(id));
      const all=hand.concat(melds.flatMap(m=>m.tiles));
      const hasYaku = all.every(id=>!R.terminal(R.type(id))) ||
        melds.some(m=>m.kind!=='chi' && [27+this.seat(p),this.roundWind,31,32,33].includes(R.type(m.tiles[0])));
      if (!hasYaku) continue;
      const distance=call.kind==='minkan' ? R.shanten(hand,melds) :
        Math.min(...hand.filter(id=>!call.forbidden.includes(R.type(id)))
          .map(id=>R.shanten(hand.filter(n=>n!==id),melds)));
      if (distance<value && (distance<old || (call.kind==='minkan' && distance===old))) {
        best=call;
        value=distance;
      }
    }
    return best;
  }
  aiDiscard(force=false) {
    const s=this.s, p=s.turn, v=s.players[p];
    if ((!p && !force) || s.phase!=='discard') return false;
    const kan=this.kans();
    if (kan.length && (v.riichi || R.shanten(v.hand,v.melds)<=1)) return this.declareKan(0);
    const options=v.hand.filter(id=>this.canDiscard(id));
    if (v.riichi) return this.discard(options[0]);
    const legalRiichi=this.riichiChoices(p);
    const publicIds=[...this.indicators(),...v.hand];
    for (const q of s.players) {
      publicIds.push(...q.river.filter(d=>!d.called).map(d=>d.id));
      publicIds.push(...q.melds.flatMap(m=>m.tiles));
    }
    const seen=R.count(publicIds);
    const threats=s.players.filter(q=>q.riichi && q!==v);
    const bonus=this.indicators().map(id=>R.dora(R.type(id)));
    let best=options[0], top=-Infinity;
    for (const id of options) {
      const t=R.type(id), rem=v.hand.filter(n=>n!==id);
      const distance=R.shanten(rem,v.melds);
      let value=-24*distance;
      if (distance===0) value+=R.waits(rem,v.melds).reduce((sum,w)=>sum+4-seen[w],0)*2.8;
      else if (distance<=2) {
        let outs=0;
        for (let w=0;w<34;w++) if (seen[w]<4) {
          if (R.shanten([...rem,w*4],v.melds)<distance) outs+=4-seen[w];
        }
        value+=outs*.16;
      }
      if (threats.length) {
        const safe=threats.filter(q=>q.river.some(d=>R.type(d.id)===t)).length;
        value+=safe*(distance>1?31:5);
      }
      value+=(R.terminal(t)?0.8:0)+(seen[t]-1)*.12-2*Number(R.red(id))-1.6*bonus.filter(n=>n===t).length+this.rng()*.25;
      if (value>top) { best=id; top=value; }
    }
    return this.discard(best,legalRiichi.includes(best));
  }
}
if (typeof module!=='undefined') module.exports={Match,CAST,TRICKS};
