'use strict';

const byId = id => document.getElementById(id);
const uiSound = new TableSound();
const number = n => n.toLocaleString('ja-JP');
const wind = ['東','南','西','北'];
const callName = {chi:'チー',pon:'ポン',minkan:'大明槓',ankan:'暗槓',kakan:'加槓'};
let match=null, heroIndex=0, timer=0, bannerTimer=0, renderedEvent=null;
let selecting=null, chosenTile=null, activeCutin=false, resultShown=null;

function tileName(id) {
  const t=R.type(id);
  return (R.red(id)?'赤':'')+(t<27 ? R.rank(t)+'萬筒索'[Math.floor(t/9)] : '東南西北白發中'[t-27]);
}
function tileArt(id, classes='', back=false) {
  return '<span class="tile '+classes+(back?' art-back':'')+(R.red(id)&&!back?' red':'')+
    '" title="'+(back?'伏せ牌':tileName(id))+'" aria-hidden="true">'+(back?'':symbol(R.type(id),R.red(id)))+'</span>';
}
function mini(id, classes='', back=false) { return tileArt(id,'mini '+classes,back); }
function meldArt(melds,owner) {
  return melds.map(m=>{
    let faces;
    if (m.kind==='ankan') {
      faces=m.tiles.map((id,i)=>mini(id,'',i===0||i===3));
    } else {
      const direction=(owner-m.from+4)%4;
      faces=m.tiles.filter(id=>id!==m.called && id!==m.added).map(id=>mini(id));
      const index=direction===3?faces.length:direction-1;
      const face=m.added===null ? mini(m.called,'called-face') :
        '<span class="stacked">'+mini(m.called,'called-face')+mini(m.added,'kan-added')+'</span>';
      faces.splice(index,0,face);
    }
    return '<span class="meld" title="'+callName[m.kind]+'">'+faces.join('')+'</span>';
  }).join('');
}

function castCards() {
  byId('cast').innerHTML=CAST.map((c,i)=>`
    <button class="cast-card" type="button" aria-pressed="${heroIndex===i}" style="--tone:${c.color}" data-hero="${i}">
      <img src="assets/body${i}.webp" alt="">
      <span class="cast-id"><b>${c.name}</b><small>${c.reading}</small><span class="cast-move">${c.move}</span></span>
    </button>`).join('');
  byId('skillDescription').textContent=CAST[heroIndex].details;
}
castCards();
byId('cast').addEventListener('click',e=>{
  const choice=e.target.closest('[data-hero]');
  if (!choice) return;
  heroIndex=Number(choice.dataset.hero);
  for (const b of byId('cast').children) b.setAttribute('aria-pressed',Number(b.dataset.hero)===heroIndex);
  byId('skillDescription').textContent=CAST[heroIndex].details;
});

function showDialog(html, buttons) {
  clearTimeout(timer);
  const dialog=byId('dialog');
  byId('dialogContent').innerHTML=html;
  byId('dialogActions').replaceChildren();
  for (const [label,action,primary] of buttons) {
    const b=document.createElement('button');
    b.type='button';
    b.textContent=label;
    if (primary) b.className='primary';
    b.onclick=action;
    byId('dialogActions').append(b);
  }
  if (!dialog.open) dialog.showModal();
}
function dismiss() {
  if (byId('dialog').open) byId('dialog').close();
}
byId('dialog').addEventListener('cancel',e=>e.preventDefault());

function refreshGaze() {
  if (!match || !match.dark) return;
  const active=match.s.turn===0 && ['discard','tsumo'].includes(match.s.phase);
  const watched=active ? match.watchers() : [];
  for (let p=1;p<4;p++) {
    const card=byId('seat'+p);
    const look=card.querySelector('.look');
    if (!look) continue;
    const watching=watched.includes(p);
    const text=active ? watching?'● 監視中':'○ よそ見' : '';
    card.classList.toggle('watch',watching);
    if (look.textContent!==text) look.textContent=text;
  }
  const own=match.s.players[0];
  const peekNote=!active||match.s.phase!=='discard'?'':own.riichi?'立直中':own.cheat?'すり替え済み':
    own.source!=='live'||own.drawn===null?'鳴きの後':match.skill[0].gauge<18?'集中不足':'';
  peek(active && match.s.phase==='discard' && selecting!=='riichi', watched, peekNote);
  const gaze=byId('gaze');
  gaze.classList.toggle('clear',active && !watched.length);
  if (!active) gaze.textContent='暴牌の必要集中 '+CAST[heroIndex].cost;
  else if (match.s.players[0].riichi) gaze.textContent='立直中はすり替え不可';
  else if (match.s.players[0].source!=='live') gaze.textContent='すり替えは通常のツモ手番で可能';
  else if (match.s.players[0].cheat) gaze.textContent='この手番のすり替えは終了';
  else gaze.textContent=watched.length?'監視中 · すり替え発覚':'視線が外れた · すり替え好機';
}
setInterval(()=>{ if (!document.hidden && match && !byId('dialog').open && !activeCutin) refreshGaze(); },100);
setInterval(()=>chatTick(document.hidden || !match || byId('dialog').open || activeCutin),500);

function eventText(e) {
  const name=e.p===undefined?'':match.name(e.p);
  switch(e.kind) {
    case 'start': return wind[Math.floor(e.hand/4)]+(e.hand%4+1)+'局・'+e.honba+'本場 開局';
    case 'discard': return name+'　'+tileName(e.id)+(e.tsumogiri?' ツモ切り':'');
    case 'riichi': return name+'が立直を宣言';
    case 'call': return name+'　'+callName[e.call];
    case 'claim': return name+'　'+(e.from===null?'ツモ':'ロン')+'宣言';
    case 'focus': return name+'　集中＋12';
    case 'cheat': return name+'　'+tileName(e.id)+'を'+tileName(e.incoming)+'にすり替えた';
    case 'caught': return name+'のイカサマが見破られた';
    case 'veto': return name+'の「'+CAST[match.cast[e.p]].move+'」が'+match.name(e.target)+'の和了を阻止';
    case 'draw': return '流局';
    case 'win': return name+' 和了　'+number(e.delta[e.p])+'点';
    default: return '';
  }
}

function animateTable(kind, text) {
  const camera=byId('camera'), banner=byId('tableBanner');
  camera.classList.remove('camera-call','camera-open','impact');
  void camera.offsetWidth;
  camera.classList.add(kind==='veto'?'impact':kind==='start'?'camera-open':'camera-call');
  if (text) {
    banner.hidden=false;
    banner.textContent=text;
    banner.style.animation='none';
    void banner.offsetWidth;
    banner.style.animation='';
    clearTimeout(bannerTimer);
    bannerTimer=setTimeout(()=>{ banner.hidden=true; },850);
  }
}

function showCutin(e) {
  activeCutin=true;
  byId('game').inert=true;
  document.querySelector('.mast').inert=true;
  const art=match.cast[e.p], character=CAST[art], cut=byId('cutin');
  cut.dataset.style=character.style;
  cut.style.setProperty('--tone',character.color);
  byId('cutinBody').src='assets/body'+art+'.webp';
  byId('cutinFace').src='assets/impact'+art+'.webp';
  byId('cutinName').textContent=character.name+'　／　暴牌';
  byId('cutinMove').textContent=character.move;
  byId('cutinLine').textContent=character.line;
  fxCutin(art);
  cut.hidden=false;
  byId('cutinContinue').focus({preventScroll:true});
}

function events() {
  const list=match.events;
  const last=list.at(-1);
  if (last===renderedEvent) return;
  const start=renderedEvent?list.indexOf(renderedEvent)+1:0;
  for (const e of list.slice(start)) {
    if (e.kind==='call') animateTable(e.kind,callName[e.call]);
    if (e.kind==='riichi') animateTable(e.kind,'立直');
    if (e.kind==='claim') animateTable(e.kind,e.from===null?'ツモ':'ロン');
    if (e.kind==='start') animateTable(e.kind,match.round);
    if (e.kind==='cheat') animateTable(e.kind,'すり替え');
    if (e.kind==='caught') animateTable(e.kind,'発覚');
    if (e.kind==='veto') {
      animateTable('veto');
      showCutin(e);
    }
    uiSound.play(e.kind,e.p===undefined?undefined:CAST[match.cast[e.p]].style,{houju:e.kind==='win' && e.from!==null && e.from!==undefined});
    if (e.kind==='riichi') uiSound.setScene('tension');
    if (e.kind==='start') uiSound.setScene(match.game.hand+1>=match.length?'tension':'table');
    fxEvent(e);
  }
  renderedEvent=last;
  byId('log').innerHTML=list.slice(-35).reverse().map(e=>'<li>'+eventText(e)+'</li>').join('');
}

function render() {
  if (!match) return;
  const {s,game}=match, own=s.players[0], character=CAST[heroIndex];
  byId('round').textContent=match.round;
  byId('modeTag').textContent=(match.dark?'闇卓':'通常卓')+' ／ '+(match.length===4?'東風戦':'半荘戦');
  byId('tableRound').textContent=game.honba+' 本場　供託 '+game.sticks;
  byId('wallCount').textContent='残り '+s.wall.length+' 枚';
  byId('dora').innerHTML='<small>表示牌</small>'+match.indicators().map(id=>mini(id)).join('');
  const lastDiscard=[...match.events].reverse().find(e=>e.kind==='discard' || e.kind==='start');
  for (let p=0;p<4;p++) {
    const v=s.players[p], card=byId('seat'+p);
    card.classList.toggle('active',s.turn===p && !['result','response','calls'].includes(s.phase));
    card.innerHTML=`<img src="assets/portrait${match.cast[p]}.webp" alt=""><div>
      <strong>${match.name(p)}</strong><span class="seat-info"><em>${wind[match.seat(p)]}${s.dealer===p?' 親':''}</em>
      <b>${number(game.scores[p])}</b>${v.riichi?'<span class="rflag" title="立直">立</span>':''}</span>${p&&match.dark?'<div class="look"></div>':''}</div>`;
    const river=byId('river'+p);
    river.setAttribute('aria-label',match.name(p)+'の捨て牌 '+v.river.map(d=>tileName(d.id)+(d.called?' 鳴かれた':'')).join(' '));
    river.innerHTML=v.river.map((d,i)=>mini(d.id,[
      d.called?'called':'',d.riichi?'riichi-tile':'',
      !d.called && lastDiscard?.p===p && lastDiscard.id===d.id && i===v.river.length-1?'last-tile':''
    ].join(' '))).join('');
    byId('meld'+p).innerHTML=meldArt(v.melds,p);
  }
  const canRiichi=selecting==='riichi'?match.riichiChoices():[];
  const hand=sorted(own.hand.filter(id=>id!==own.drawn)).concat(own.drawn===null?[]:[own.drawn]);
  byId('hand').classList.toggle('choosing',!!selecting);
  const focusedTile=document.activeElement?.dataset.tile;
  byId('hand').innerHTML=hand.map(id=>{
    const enabled=s.turn===0 && s.phase==='discard' &&
      (selecting==='riichi'?canRiichi.includes(id):selecting==='cheat'?match.canCheat():match.canDiscard(id));
    return '<button type="button" data-tile="'+id+'" '+(enabled?'':'disabled')+' class="'+
      (id===own.drawn?'drawn ':'')+(chosenTile===id?'selected':'')+'" aria-label="'+tileName(id)+
      (id===own.drawn?' ツモ牌':'')+'">'+tileArt(id)+'</button>';
  }).join('');
  if (focusedTile!==undefined) byId('hand').querySelector('button[data-tile="'+focusedTile+'"]:enabled')?.focus({preventScroll:true});
  byId('state').textContent=stateText();
  const gauge=match.skill[0].gauge;
  byId('powerPanel').hidden=!match.dark;
  byId('powerPanel').style.setProperty('--tone',character.color);
  byId('powerName').textContent=character.move;
  byId('gaugeLabel').textContent=gauge+' / 100';
  byId('gauge').style.width=gauge+'%';
  byId('meter').setAttribute('aria-valuenow',gauge);
  byId('meter').classList.toggle('ready',gauge>=character.cost);
  refreshGaze();
  renderCommands();
  events();
}

function stateText() {
  const s=match.s;
  if (s.phase==='discard' && s.turn===0) {
    if (selecting==='riichi') return '立直する捨て牌を選ぶ';
    if (selecting==='cheat') return '交換する牌を選ぶ';
    if (s.players[0].riichi) return '立直中 · ツモ切り';
    return '捨てる牌を選ぶ';
  }
  if (s.phase==='tsumo') return match.name(s.turn)+'のツモ和了';
  if (s.phase==='response') return 'ロンするか選ぶ';
  if (s.phase==='calls' && match.calls(0).length) return '鳴くか選ぶ';
  if (s.phase==='veto') return match.name(s.pending.p)+'の'+(s.pending.from===null?'ツモ':'ロン')+'宣言';
  if (s.phase==='blocked') return '和了が阻止された';
  if (s.phase==='result') return s.result.kind==='draw'?'流局':'局終了';
  return match.name(s.turn)+'の手番';
}

function renderCommands() {
  const wrap=byId('commands'), s=match.s, v=s.players[0];
  wrap.replaceChildren();
  function add(label, fn, {primary=false, disabled=false, selected=false, tiles=[]}={}) {
    const b=document.createElement('button');
    b.type='button';
    b.className=(primary?'primary ':'')+(selected?'selected':'');
    b.textContent=label;
    b.disabled=disabled;
    if (tiles.length) {
      const preview=document.createElement('span');
      preview.className='cmd-tiles';
      preview.innerHTML=tiles.map(id=>mini(id)).join('');
      b.setAttribute('aria-label',label+' '+tiles.map(tileName).join(' '));
      b.append(preview);
    }
    b.onclick=()=>act(fn);
    wrap.append(b);
  }
  if (s.phase==='discard' && s.turn===0) {
    if (selecting) add('取消',()=>{ selecting=null; chosenTile=null; });
    if (!selecting) {
      const riichi=match.riichiChoices();
      add('立直',()=>{ selecting='riichi'; },{disabled:!riichi.length,primary:!!riichi.length});
      match.kans().forEach((k,i)=>add(callName[k.kind],()=>match.declareKan(i),{tiles:[k.id]}));
      if (match.dark) {
        add('集中 ＋12',()=>match.focus(),{disabled:v.focus || match.skill[0].gauge===100});
        add('すり替え −18',()=>{ selecting='cheat'; },{disabled:!match.canCheat()});
      }
    }
  } else if (s.phase==='tsumo' && s.turn===0) {
    add('ツモ',()=>match.chooseTsumo(true),{primary:true});
    add('見送る',()=>match.chooseTsumo(false));
  } else if (s.phase==='response') {
    add('ロン',()=>match.chooseRon(true),{primary:true,tiles:[s.response.id]});
    add('見送る',()=>match.chooseRon(false));
  } else if (s.phase==='calls') {
    const calls=match.calls(0);
    calls.forEach((c,i)=>add(callName[c.kind],()=>match.chooseCall(i),
      {tiles:[...c.tiles,s.response.id].sort((a,b)=>a-b)}));
    if (calls.length) add('見送る',()=>match.chooseCall());
  } else if (s.phase==='veto' && match.vetoOptions().includes(0)) {
    const hero=CAST[heroIndex];
    add('暴牌「'+hero.move+'」−'+hero.cost,()=>match.resolveWin(true),{primary:true});
    add('和了を受け入れる',()=>match.resolveWin());
  }
  if (!wrap.childElementCount && ['result','blocked'].includes(s.phase)) return;
  if (v.hand.length===13-v.melds.length*3) {
    const waits=match.waits(0);
    if (waits.length) {
      const hint=document.createElement('span');
      hint.className='wait-hint';
      hint.textContent=(match.furiten(0)?'フリテン · ':'待ち · ')+waits.map(t=>tileName(t*4+1)).join(' ');
      wrap.append(hint);
    }
  }
}

function act(fn) {
  if (!match || byId('dialog').open || activeCutin) return;
  clearTimeout(timer);
  fn();
  render();
  drive();
}
function drive() {
  clearTimeout(timer);
  if (!match || byId('dialog').open || activeCutin) return;
  const s=match.s;
  let fn, delay;
  if (s.phase==='draw') { fn=()=>match.draw(); delay=s.turn===0?250:330; }
  if (s.phase==='discard' && s.turn!==0) { fn=()=>match.aiDiscard(); delay=350; }
  if (s.phase==='tsumo' && s.turn!==0) { fn=()=>match.chooseTsumo(true); delay=390; }
  if (s.phase==='calls' && !match.calls(0).length) { fn=()=>match.chooseCall(); delay=165; }
  if (s.phase==='veto' && !match.vetoOptions().includes(0)) { fn=()=>match.resolveWin(); delay=520; }
  if (s.phase==='result' && s.result!==resultShown) { fn=showResult; delay=320+flashBusy(); }
  if (fn) timer=setTimeout(()=>act(fn),delay);
}
function selectTile(id) {
  act(()=>{
    if (match.s.turn!==0 || match.s.phase!=='discard') return;
    const choice=selecting;
    selecting=null; chosenTile=null;
    if (choice==='cheat') match.cheat(id);
    else match.discard(id,choice==='riichi');
  });
}
byId('hand').addEventListener('click',e=>{
  const b=e.target.closest('button[data-tile]');
  if (b && !b.disabled) selectTile(Number(b.dataset.tile));
});

function showResult() {
  const s=match.s, r=s.result;
  if (!r) return;
  resultShown=r;
  let heading=r.kind==='draw'?'流局':match.name(r.p)+'　'+(r.from===null?'ツモ':'ロン');
  let top='<span class="eyebrow">'+match.round+'　'+match.game.honba+'本場'+(r.final?' ／ 終局':'')+'</span><h2>'+heading+'</h2>';
  if (r.kind==='win') {
    const result=r.result;
    const summary=result.yakuman?(result.yakuman===1?'役満':result.yakuman+'倍役満'):result.han+'翻 '+result.fu+'符';
    const winArt=fxSrc('win',match.cast[r.p]);
    if (winArt) top='<img class="result-art" src="'+winArt+'" alt="">'+top;
    top+='<div class="result-tiles">'+r.hand.filter(id=>id!==r.id).map(id=>mini(id)).join('')+mini(r.id,'winning-tile')+meldArt(r.melds,r.p)+'</div>';
    top+='<div class="yaku">'+result.yaku.map(y=>'<span>'+y.name+(y.han?' '+y.han+'翻':'')+'</span>').join('')+'</div>';
    if (r.ura.length) top+='<p>裏ドラ表示牌 '+r.ura.map(id=>mini(id)).join(' ')+'</p>';
    top+='<p>'+summary+'　／　'+number(result.total)+'点'+(r.from===null?'（支払い合計）':'')+'</p>';
  } else {
    top+='<p>テンパイ　'+(r.tenpai.map(p=>match.name(p)).join('、')||'なし')+'</p>';
  }
  const rows=r.final?match.ranking().map(x=>x.p):[0,1,2,3];
  top+='<table><thead><tr><th scope="col">雀士</th><th scope="col">増減</th><th scope="col">持ち点</th></tr></thead><tbody>'+rows.map((p,i)=>{
    const delta=r.delta[p];
    return '<tr><td>'+(r.final?(i+1)+'位　':'')+match.name(p)+'</td><td class="'+
      (delta>0?'delta-plus':delta<0?'delta-minus':'')+'">'+(delta>0?'+':'')+number(delta)+
      '</td><td>'+number(match.game.scores[p])+'</td></tr>';
  }).join('')+'</tbody></table>';
  showDialog(top,[[r.final?'タイトルに戻る':'次局へ',()=>{
    dismiss();
    if (r.final) toLobby();
    else act(()=>match.nextHand());
  },true]]);
}

function start() {
  clearTimeout(timer);
  renderedEvent=null; resultShown=null; selecting=null; chosenTile=null;
  fxReset();
  match=new Match({hero:heroIndex,mode:document.querySelector('[name=mode]:checked').value,
    length:Number(document.querySelector('[name=length]:checked').value)});
  byId('lobby').hidden=true; byId('game').hidden=false; byId('exit').hidden=false;
  byId('powerPortrait').style.backgroundImage='url("assets/body'+heroIndex+'.webp")';
  window.scrollTo(0,0);
  render();
  drive();
}

function toLobby() {
  clearTimeout(timer);
  clearTimeout(bannerTimer);
  dismiss();
  activeCutin=false;
  byId('cutin').hidden=true;
  byId('game').inert=false;
  document.querySelector('.mast').inert=false;
  match=null;
  fxReset();
  uiSound.setScene('lobby');
  byId('lobby').hidden=false; byId('game').hidden=true; byId('exit').hidden=true;
  window.scrollTo(0,0);
}
function leave() {
  if (!match || activeCutin || byId('dialog').open) return;
  showDialog('<h2>卓を離れる？</h2><p>この対局を終了して、タイトルに戻ります。</p>',
    [['対局を続ける',()=>{ dismiss(); drive(); }],['卓を離れる',toLobby,true]]);
}

byId('begin').onclick=start;
byId('exit').onclick=leave;
byId('brand').onclick=e=>{ e.preventDefault(); leave(); };
byId('sound').onclick=()=>{
  const on=uiSound.toggle();
  byId('sound').textContent=on?'音響 ON':'音響 OFF';
  byId('sound').setAttribute('aria-pressed',on);
};
byId('chat').onclick=chatToggle;
byId('help').onclick=()=>{
  if (activeCutin || byId('dialog').open) return;
  showDialog(`<span class="eyebrow">遊び方</span><h2>闇卓の掟</h2>
    <p>牌をクリックまたはタップして打牌。PCでは左右の矢印で手牌を選び、Enterで決定できます。立直は「立直」を押してから、光る候補の牌を選びます。鳴き・和了は表示されたボタンで選択します。</p>
    <p><strong>集中</strong>　打牌で＋5、立直成立で＋13。「集中」は自分の手番で一度だけ＋12。</p>
    <p><strong>すり替え</strong>　全員の視線が外れた瞬間に、選んだ牌と山の次の牌を交換します。集中18を消費し、通常のツモ手番で1回。監視中なら発覚して交換できません。</p>
    <p><strong>暴牌</strong>　相手のロン・ツモ宣言時、必要集中を満たすと発動できます。精算を止め、ツモは同じ手牌で打牌へ、ロンは同じ捨て牌の応答へ戻ります。相手も高得点の直接損失を受ける場面で使います。</p>
    <p><strong>通常卓</strong>　集中・すり替え・暴牌を使わない四人リーチ麻雀です。頭ハネ、赤ドラ各1枚、喰いタンあり。</p>`,
    [['閉じる',()=>{ dismiss(); drive(); },true]]);
};
byId('cutinContinue').onclick=()=>{
  if (!match || !activeCutin) return;
  activeCutin=false;
  byId('cutin').hidden=true;
  byId('game').inert=false;
  document.querySelector('.mast').inert=false;
  act(()=>match.resume());
};

document.addEventListener('keydown',e=>{
  if (!match || activeCutin || byId('dialog').open || e.altKey || e.metaKey || e.ctrlKey) return;
  const buttons=Array.from(byId('hand').querySelectorAll('button:enabled'));
  if (['ArrowLeft','ArrowRight'].includes(e.key) && buttons.length) {
    e.preventDefault();
    const current=buttons.indexOf(document.activeElement);
    const next=current<0 ? (e.key==='ArrowLeft'?buttons.length-1:0) :
      (current+(e.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length;
    chosenTile=Number(buttons[next].dataset.tile);
    for (const b of buttons) b.classList.toggle('selected',b===buttons[next]);
    buttons[next].focus({preventScroll:true});
  }
  if (e.key==='Escape' && selecting) act(()=>{ selecting=null; chosenTile=null; });
});
