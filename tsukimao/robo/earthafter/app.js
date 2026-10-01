/* EARTH AFTER — production guide app */
(function(){
'use strict';
const EA=window.EA; const SC=EA.scenes, CUTS=EA.cuts;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const ACTC={1:'#e8a94f',2:'#9aa05c',3:'#7f9cc4'};
const sceneById=Object.fromEntries(SC.map(s=>[s.id,s]));
const actOf=id=>id==='END'?3:(sceneById[id]?sceneById[id].act:3);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),1800)}
async function copy(txt,msg){try{await navigator.clipboard.writeText(txt)}catch(e){const a=document.createElement('textarea');a.value=txt;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(_){}a.remove()}toast(msg||'コピーしました')}
function download(name,text,type){const b=new Blob(['﻿'+text],{type:type||'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
const csvq=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const whoCls=w=>/沙羅/.test(w)?'sara':/カイル/.test(w)?'kyle':/キラ/.test(w)?'kira':/ユタニ/.test(w)?'yutani':'';
const fmt=s=>{s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

/* ---------- BOOT ---------- */
(function boot(){
  const el=$('#boot');
  const shown=el&&getComputedStyle(el).display!=='none'&&!RM;
  if(!shown){if(el)el.remove();afterBoot();return}
  let done=false;const fin=()=>{if(done)return;done=true;if(el.parentNode)el.remove();afterBoot()};
  el.addEventListener('click',fin);setTimeout(fin,4600);
})();
function afterBoot(){
  const c=$('#catch'),T='あなたと同じ時間を、生きたかった。';
  if(RM){c.textContent=T;return}
  let k=0;c.innerHTML='<span class="cur"></span>';
  setTimeout(function t(){if(k<=T.length){c.innerHTML=esc(T.slice(0,k))+'<span class="cur"></span>';k++;setTimeout(t,k===6||k===11?380:110)}},700);
}

/* ---------- CHROME: topbar, nav, reveal ---------- */
const topbar=$('#topbar'),dock=$('#dock'),toTop=$('#toTop');
const navLinks=$$('#topnav a'),dockLinks=$$('#dock a');
const secIds=['film','story','people','structure','boards','stage3d','tools','contest'];
function onScroll(){
  const y=scrollY,h=innerHeight;
  const show=y>h*.6;topbar.classList.toggle('show',show);dock.classList.toggle('show',show);toTop.classList.toggle('show',y>h*1.5);
  let cur='';for(const id of secIds){const e=document.getElementById(id);if(e&&e.getBoundingClientRect().top<h*.35)cur=id}
  navLinks.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+cur));
  dockLinks.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+cur));
}
addEventListener('scroll',onScroll,{passive:true});onScroll();
toTop.onclick=()=>scrollTo({top:0,behavior:RM?'auto':'smooth'});
$('#dToc').onclick=()=>$('#toc').classList.add('open');
$('#tocX').onclick=()=>$('#toc').classList.remove('open');
$$('#toc a').forEach(a=>a.addEventListener('click',()=>$('#toc').classList.remove('open')));
const rv=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rv.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
function observeReveal(root){$$('.reveal',root||document).forEach(e=>rv.observe(e))}

/* ---------- ANIMATIC ---------- */
const P=(function(){
  const seq=[];let T=0;
  let cardsOn=store.get('ea-cards',true);
  function build(){
    seq.length=0;T=0;let lastScene=null;
    CUTS.forEach((c,idx)=>{
      if(c.scene!==lastScene&&c.scene!=='END'&&cardsOn){seq.push({type:'card',scene:c.scene,start:T,dur:1.8});T+=1.8}
      lastScene=c.scene;
      const lines=[];let t=0.7;
      (c.lines||[]).forEach(([w,x])=>{const d=Math.min(5.6,Math.max(1.5,1.0+x.length*0.13));lines.push({w,x,s:t,e:t+d});t+=d+0.35});
      let dur=lines.length?t+0.5:(c.img?2.8:(c.id.startsWith('END')?(c.id==='END-1'?1.2:2.4):5.2));
      if(c.id==='END-1')lines.splice(0,lines.length,{w:'SE',x:'バン！',s:0,e:0.9});
      seq.push({type:'cut',cut:c,idx,start:T,dur,lines});T+=dur;
    });
  }
  build();
  const screen=$('#screen'),fA=$('#fA'),fB=$('#fB'),subs=$('#subs'),player=$('#player');
  let t=0,playing=false,speed=1,last=0,curKey=null,front=fA,subOn=store.get('ea-subs',true);
  const speeds=[1,1.5,2,0.75];
  function find(tt){let lo=0,hi=seq.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(seq[m].start<=tt)lo=m;else hi=m-1}return lo}
  function frameHTML(it){
    const c=it.cut;
    if(c.id.startsWith('END'))return '<div class="textcut black"></div>';
    if(c.img)return `<img src="img/sb/${c.id}.webp" alt="${esc(c.id)}" style="--dur:${it.dur/speed}s">`;
    return `<div class="textcut"><div class="k">${esc(c.id)} ・ ${esc(c.sheet)} ・ 未生成（テキストコンテ）</div><div class="cam">${esc(c.cam)}</div><div class="a">${esc(c.act.replace(/\n+/g,' '))}</div></div>`;
  }
  function render(){
    const i=find(t),it=seq[i],key=i;
    const card=$('#scard');
    if(key!==curKey){
      curKey=key;
      if(it.type==='card'){
        const s=sceneById[it.scene];card.style.setProperty('--act',ACTC[s.act]);
        $('#scNo').textContent=`ACT ${s.act} ・ ${s.id}`;$('#scTi').textContent=s.title;$('#scMeta').textContent=`${s.place}　${s.age!=='—'?s.age:''}`;
        card.classList.add('on');
        const nx=seq[i+1];if(nx&&nx.type==='cut'){const back=front===fA?fB:fA;back.innerHTML=frameHTML(nx);back.classList.remove('on');}
      }else{
        card.classList.remove('on');
        const back=front===fA?fB:fA;back.innerHTML=frameHTML(it);
        back.classList.add('on');front.classList.remove('on');front=back;
        const s=sceneById[it.cut.scene];
        $('#hudL').textContent=s?`${s.id}  ${s.title}`:'END';
        $('#hudR').textContent=`CUT ${it.cut.id} / ${it.cut.sheet}`;
        $('#ciId').textContent=`${it.cut.id} ・ ${it.cut.sheet}${it.cut.img?'':' ・ 未生成'}`;
        $('#ciCam').textContent=it.cut.cam;$('#ciAct').textContent=it.cut.act;
        $$('#jump button').forEach(b=>b.classList.toggle('on',b.dataset.s===it.cut.scene));
        for(let k=1;k<=3;k++){const n=seq[i+k];if(n&&n.type==='cut'&&n.cut.img){const im=new Image();im.src=`img/sb/${n.cut.id}.webp`}}
      }
    }
    let html='';
    if(it.type==='cut'&&subOn){const lt=t-it.start;const L=it.lines.find(l=>lt>=l.s&&lt<l.e);
      if(L)html=`<span class="line"><span class="who ${whoCls(L.w)}">${esc(L.w)}</span>${esc(L.x)}</span>`}
    if(subs._h!==html){subs.innerHTML=html;subs._h=html}
    $('#tTime').textContent=`${fmt(t)} / ${fmt(T)}`;
    $('#tlHead').style.left=(t/T*100)+'%';
  }
  function loop(ts){if(!playing)return;const dt=Math.min(.1,(ts-last)/1000);last=ts;t+=dt*speed;if(t>=T){t=T-0.001;pause();}render();requestAnimationFrame(loop)}
  function play(){if(playing)return;if(t>=T-0.01)t=0;playing=true;player.classList.add('playing');$('#playIco').innerHTML='<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>';$('#bPlay').setAttribute('aria-label','一時停止');last=performance.now();requestAnimationFrame(loop)}
  function pause(){playing=false;player.classList.remove('playing');$('#playIco').innerHTML='<path d="M6 4l14 8-14 8z"/>';$('#bPlay').setAttribute('aria-label','再生')}
  function toggle(){playing?pause():play()}
  function seek(tt){t=Math.max(0,Math.min(T-0.001,tt));curKey=null;render()}
  function stepCut(d){let i=find(t);if(d>0){i++;while(i<seq.length&&seq[i].type!=='cut')i++}else{if(t-seq[i].start>0.6&&seq[i].type==='cut'){}else{i--;while(i>0&&seq[i].type!=='cut')i--}}
    if(seq[i])seek(seq[i].start+(seq[i].type==='cut'?0.01:0))}
  function fromCut(id){const it=seq.find(x=>x.type==='cut'&&x.cut.id===id);if(it)seek(it.start+0.01)}
  function fromScene(sid){const it=seq.find(x=>(x.type==='card'&&x.scene===sid)||(x.type==='cut'&&x.cut.scene===sid));if(it)seek(it.start+0.01)}
  // timeline
  const tl=$('#tl');
  function drawTL(){$$('.seg',tl).forEach(e=>e.remove());let cur=null,st=0;
    const push=(sid,a,b)=>{const d=document.createElement('div');d.className='seg';d.style.left=(a/T*100)+'%';d.style.width=((b-a)/T*100)+'%';d.style.background=sid==='END'?'#555':ACTC[actOf(sid)];d.dataset.s=sid;tl.insertBefore(d,tl.firstChild)};
    seq.forEach(it=>{const sid=it.type==='card'?it.scene:it.cut.scene;if(sid!==cur){if(cur)push(cur,st,it.start);cur=sid;st=it.start}});push(cur,st,T)}
  drawTL();
  let drag=false;
  const tAt=e=>{const r=tl.getBoundingClientRect();return (Math.min(Math.max(e.clientX-r.left,0),r.width)/r.width)*T};
  tl.addEventListener('pointerdown',e=>{drag=true;tl.setPointerCapture(e.pointerId);seek(tAt(e))});
  tl.addEventListener('pointermove',e=>{const tt=tAt(e);const it=seq[find(tt)];const sid=it.type==='card'?it.scene:it.cut.scene;const s=sceneById[sid];const tip=$('#tlTip');tip.textContent=s?`${s.id} ${s.title}`:'END';tip.style.left=(tt/T*100)+'%';if(drag)seek(tt)});
  tl.addEventListener('pointerup',()=>drag=false);
  // jump buttons
  $('#jump').innerHTML=SC.map(s=>`<button type="button" data-s="${s.id}" title="${esc(s.title)}">${s.id} ${esc(s.title)}</button>`).join('');
  $('#jump').addEventListener('click',e=>{const b=e.target.closest('button');if(b){fromScene(b.dataset.s);play()}});
  // controls
  $('#bPlay').onclick=toggle;screen.addEventListener('click',toggle);
  $('#bPrev').onclick=()=>stepCut(-1);$('#bNext').onclick=()=>stepCut(1);
  $('#bSpeed').onclick=e=>{speed=speeds[(speeds.indexOf(speed)+1)%speeds.length];e.currentTarget.textContent=speed.toFixed(speed%1?2:1).replace(/0$/,'')+'×'};
  const bSub=$('#bSub');const setSub=()=>{bSub.classList.toggle('off',!subOn);bSub.setAttribute('aria-pressed',subOn)};setSub();
  bSub.onclick=()=>{subOn=!subOn;store.set('ea-subs',subOn);setSub();subs._h=null;render()};
  const bCard=$('#bCard');const setCard=()=>{bCard.classList.toggle('off',!cardsOn);bCard.setAttribute('aria-pressed',cardsOn)};setCard();
  bCard.onclick=()=>{const it=seq[find(t)];const id=it.type==='cut'?it.cut.id:null;cardsOn=!cardsOn;store.set('ea-cards',cardsOn);setCard();build();drawTL();if(id)fromCut(id);else seek(0)};
  $('#bFull').onclick=()=>{if(document.fullscreenElement){document.exitFullscreen()}else if(player.requestFullscreen){player.requestFullscreen().catch(()=>player.classList.toggle('pfs'))}else player.classList.toggle('pfs')};
  $('#ciOpen').onclick=()=>{const it=seq[find(t)];const c=it.type==='cut'?it.cut:CUTS.find(x=>x.scene===it.scene);pause();LB.cut(CUTS.indexOf(c))};
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select')||$('#lb').open)return;
    const r=player.getBoundingClientRect();const vis=r.top<innerHeight*.7&&r.bottom>innerHeight*.3;
    if(!vis&&!document.fullscreenElement)return;
    if(e.code==='Space'){e.preventDefault();toggle()}else if(e.key==='ArrowRight'){stepCut(1)}else if(e.key==='ArrowLeft'){stepCut(-1)}else if(e.key==='f'||e.key==='F'){$('#bFull').click()}else if(e.key==='Escape'&&player.classList.contains('pfs'))player.classList.remove('pfs')});
  // pause when scrolled away
  new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting&&playing&&!document.fullscreenElement&&!player.classList.contains('pfs'))pause()}),{threshold:.15}).observe(player);
  render();
  return {play,pause,fromCut,fromScene,get total(){return T}};
})();
function goFilm(){document.getElementById('film').scrollIntoView({behavior:RM?'auto':'smooth'});}
$$('[data-play]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goFilm();setTimeout(()=>P.play(),650)}));

/* ---------- STORY ---------- */
(function story(){
  const BG={R15:'radial-gradient(55% 55% at 72% 42%,#6d1d12 0%,#2a0b07 45%,#0b0605 80%)',R16:'linear-gradient(180deg,#f1eee9,#cfcac2)',R17:'linear-gradient(180deg,#141827 0%,#4a2f2a 55%,#c98244 100%)',R18:'linear-gradient(180deg,#2c3a4a,#0c1116)',R19:'radial-gradient(40% 55% at 64% 45%,#d8f6ff 0%,#4d7282 28%,#0b1215 70%)',R20:'linear-gradient(180deg,#f6dde4 0%,#e9c6cf 45%,#a9b98f 100%)'};
  const ACTS={1:['好きになる','声を持たない少女が、成長するアンドロイドの少年に恋をした。'],2:['一緒に生きる','世界がドロに制圧されて4年。沙羅は、敵を壊さずに救う道を選んでいる。'],3:['受け継いで生きる','何年も探し続けた人に、今度こそ名前を呼んでもらうために。']};
  const box=$('#scenes'),bg=$('#stageBg');let html='',lastAct=0;
  SC.forEach(s=>{
    if(s.act!==lastAct){lastAct=s.act;html+=`<div class="actcard" data-bg="act${s.act}" data-act="${s.act}"><div><b>ACT ${s.act}</b><h3 class="serif">${ACTS[s.act][0]}</h3><p>${ACTS[s.act][1]}</p></div></div>`}
    const paras=s.paras.map(p=>{if(/^[^「]{1,8}「/.test(p)&&p.split('\n').every(l=>/^[^「]{1,8}「.*」$/.test(l)||!l.trim()))return `<p class="serif" style="font-size:18px;line-height:1.9">${p.split('\n').map(esc).join('<br>')}</p>`;return `<p>${esc(p).replace(/\n/g,'<br>')}</p>`}).join('');
    const nc=CUTS.filter(c=>c.scene===s.id).length;
    html+=`<article class="scene" id="sc-${s.id}" data-bg="${s.id}" data-act="${s.act}"><div class="wrap"><div class="box reveal">
      <div class="no">${s.id} ・ ACT ${s.act}</div><h3 class="serif">${esc(s.title)}</h3>
      <div class="meta"><span class="tag">${esc(s.place)}</span>${s.age!=='—'?`<span class="tag">沙羅 ${esc(s.age)}</span>`:''}<span class="tag">${nc}カット</span></div>
      ${paras}
      ${s.line?`<p class="quote">${esc(s.line)}<small>${esc(s.sp)}</small></p>`:''}
      <div class="acts"><button class="btn sm" type="button" data-watch="${s.id}">▶ このシーンを観る</button><button class="btn sm" type="button" data-board="${s.id}">絵コンテを見る</button></div>
    </div></div></article>`;
  });
  box.innerHTML=html;
  // bg layers
  const layers={};
  const mk=(key,style)=>{const d=document.createElement('div');d.className='l';d.style.background=style;bg.appendChild(d);layers[key]=d};
  mk('act1','radial-gradient(70% 60% at 70% 40%,#5a3a1c,#0b0a09 75%)');mk('act2','radial-gradient(70% 60% at 70% 40%,#3a3d22,#0b0a09 75%)');mk('act3','radial-gradient(70% 60% at 70% 40%,#1f2d3f,#0b0a09 75%)');
  SC.forEach(s=>{if(s.ref)mk(s.id,`url(img/ref/${s.ref}.webp) center/cover`);else mk(s.id,BG[s.id])});
  const pet=document.createElement('div');pet.className='petals';layers.R20.appendChild(pet);
  if(!RM)for(let i=0;i<26;i++){const p=document.createElement('i');p.style.left=(Math.random()*110)+'%';p.style.animationDuration=(7+Math.random()*9)+'s';p.style.animationDelay=(-Math.random()*14)+'s';p.style.transform=`scale(${.6+Math.random()})`;pet.appendChild(p)}
  let cur=null;const secStory=$('#story');
  function set(el){const k=el.dataset.bg;if(k===cur)return;cur=k;Object.entries(layers).forEach(([kk,l])=>l.classList.toggle('on',kk===k));
    const col=k==='R20'?'#f4c6d2':ACTC[el.dataset.act];secStory.style.setProperty('--act',col);
    const s=sceneById[k];$('#bgHud').innerHTML=s?`${s.id} ／ ${esc(s.place)}${s.age!=='—'?' ／ 沙羅 '+esc(s.age):''}${s.ref?'':'<br>場面画 未制作'}`:`ACT ${el.dataset.act}`}
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)set(e.target)})},{rootMargin:'-45% 0px -45% 0px'});
  $$('.scene,.actcard',box).forEach(e=>io.observe(e));
  set($('.actcard',box));
  box.addEventListener('click',e=>{const w=e.target.closest('[data-watch]'),b=e.target.closest('[data-board]');
    if(w){goFilm();P.fromScene(w.dataset.watch);setTimeout(()=>P.play(),650)}
    if(b){BOARDS.filterScene(b.dataset.board)}});
  const end=$('#storyEnd');new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)end.classList.add('in')}),{threshold:.6}).observe(end);
})();

/* ---------- BODY DIAGRAM ---------- */
(function body(){
  const D={
    0:{t:'〜16歳：声が出せない',x:'生まれつき声を持たない。筆談（メモ帳）や身振りで気持ちを伝える。全身が生身。',r:'R01〜R02：声は出ない。台詞はメモ帳の文字や口の形で表現する。',m:[]},
    17:{t:'17歳：人工喉頭《生体ギミック》',x:'誕生日に両親から神経接続型の人工喉頭を贈られ、手術と訓練を経て初めて声を出す。',r:'喉のみ機械。声を過度なロボ声にしないこと。',m:['p-throat']},
    21:{t:'21歳：戦後4年、両腕とも生身',x:'救助活動と戦闘訓練で無駄のない身体に。人工喉頭の交換部品は尽きかけている（R09）。',r:'21歳以前の沙羅に義手を描かない。',m:['p-throat']},
    25:{t:'25歳：左腕・脚部・脊椎・臓器の一部',x:'救助活動で左腕を失い義手に。脚部補助・脊椎補助・臓器の一部も生体ギミックへ置換。脳と人格は人間のまま、右手も生身。',r:'左腕のみ機械、右手は生身。R15で頬に触れるのは生身の右手。',m:['p-throat','p-armL','p-handL','p-legR','p-legL','p-spine','p-organ']}};
  const parts=$$('#bodysvg .part');
  function set(a){const d=D[a];parts.forEach(p=>{const m=d.m.includes(p.id);p.classList.toggle('mech',m);p.classList.toggle('human',!m)});
    $('#ageTitle').textContent=d.t;$('#ageText').textContent=d.x;$('#ageRule').innerHTML='<b>作画ルール：</b>'+esc(d.r);
    $$('#ageBtns button').forEach(b=>{b.classList.toggle('on',b.dataset.age==a);b.setAttribute('aria-selected',b.dataset.age==a)})}
  $('#ageBtns').addEventListener('click',e=>{const b=e.target.closest('button');if(b)set(b.dataset.age)});set(25);
})();

/* ---------- SUPPORT CAST ---------- */
(function sup(){
  const S=[['mother','沙羅の母','声がなくても沙羅の意思を急かさず待てる人。共同体では食料・避難者・子供の生活を支える。死亡場面と遺体安置場面には登場させない。'],
  ['father','沙羅の父','戦前から機械整備に詳しい。キラと共に暴走ドロの外部通信と制御層を切り離す。沙羅の人工喉頭と身体の整備を支えてきた。死亡場面・遺体安置場面には登場させない。'],
  ['medic','医療担当者','共同体の医療と生体ギミックの応急処置を担当。沙羅の死後、蘇生演出を長引かせず、死の確定と世界の無情さを静かに示す。'],
  ['driver','人間の運転手','共同体の物流と救出を担当。ユタニ西棟への潜入で整備カートと搬出車を運転する。戦うのではなく、退路を成立させる役割。'],
  ['returned','復帰ドロ','R05で沙羅が捕獲し、R06で旧人格へ戻される巡回ドロ。人間を襲った記憶と罪悪感を抱える。沙羅の「おかえり」を受け取った最初の一体。'],
  ['yutani','ユタニ','ユタニ社の創業者。穏やかな表情と丁寧な口調を崩さない。ドロを「家族」と呼ぶが、それは制御下へ戻すための言葉。本社に現れる姿は安全圏からの遠隔ホログラム。']];
  $('#support').innerHTML=S.map(([k,n,d])=>`<div class="p"><button type="button" data-sheet="support" style="border:none;padding:0;background:none" aria-label="${n}の設定画を開く"><img src="img/ch/sup-${k}.webp" alt="${n}" loading="lazy"></button><div><h4>${n}</h4><p>${d}</p></div></div>`).join('');
})();

/* ---------- CURVE ---------- */
(function curve(){
  const W=[5,7,9,1,3,6,4,8,6,2,2,3,8,4,1,.5,1,1,2,6.5], Tn=[2,1.5,1.5,9,7,3,8,2,5,7,4,7,5,9,10,3,6,9,10,1];
  const svg=$('#curve'),x0=60,x1=930,y0=300,y1=40,X=i=>x0+i*(x1-x0)/19,Y=v=>y0-(v/10)*(y0-y1);
  let h='';
  const bands=[[0,3,'#e8a94f'],[4,9,'#9aa05c'],[10,19,'#7f9cc4']];
  bands.forEach(([a,b,c],k)=>{const xa=a?X(a)-(X(1)-X(0))/2:x0-20,xb=b<19?X(b)+(X(1)-X(0))/2:x1+20;h+=`<rect x="${xa}" y="20" width="${xb-xa}" height="${y0-10}" fill="${c}" opacity=".07"/><text x="${xa+8}" y="36" font-size="12" font-weight="700" fill="${c}">ACT ${k+1}</text>`});
  const path=a=>a.map((v,i)=>`${i?'L':'M'}${X(i)},${Y(v)}`).join('');
  h+=`<path d="${path(Tn)}" fill="none" stroke="#e5533d" stroke-width="2.5" stroke-dasharray="6 5" opacity=".85"/>`;
  h+=`<path d="${path(W)}" fill="none" stroke="#ecc96f" stroke-width="3.5" stroke-linejoin="round"/>`;
  SC.forEach((s,i)=>{h+=`<g class="pt" data-s="${s.id}" style="cursor:pointer"><rect x="${X(i)-20}" y="30" width="40" height="${y0}" fill="transparent"/><circle cx="${X(i)}" cy="${Y(W[i])}" r="6" fill="#ecc96f"/><circle cx="${X(i)}" cy="${Y(Tn[i])}" r="4" fill="#e5533d"/><text x="${X(i)}" y="${y0+22}" font-size="11" fill="#b0a696" text-anchor="middle">${s.id}</text><title>${s.id} ${esc(s.title)}</title></g>`});
  const ann=[[2,W[2],'声を得る'],[3,W[3],'配信・制圧'],[7,W[7],'三人の日常'],[9,W[9],'帰れなかった朝'],[12,W[12],'「おかえり」'],[14,W[14],'王子様'],[19,W[19],'3年後の春']];
  ann.forEach(([i,v,t])=>{const up=v>5;h+=`<text x="${X(i)}" y="${Y(v)+(up?-14:22)}" font-size="12" fill="#efe7d9" text-anchor="middle" font-weight="700">${t}</text>`});
  svg.innerHTML=h;
  svg.addEventListener('click',e=>{const g=e.target.closest('.pt');if(g)document.getElementById('sc-'+g.dataset.s).scrollIntoView({behavior:RM?'auto':'smooth',block:'center'})});
})();

/* ---------- MOTIFS ---------- */
(function motifs(){
  const M=[['「……変なの」',[['R01','幼いカイルが、泣く沙羅の隣で'],['R19','銃弾の嵐へ向かう直前、カイルが小さく笑って']]],
  ['ボール',[['R01','転がってきたボールが二人を出会わせる'],['R02','フェンス越し「……ボール」'],['R08','子供たちとサッカー'],['R10','残された布巻きのボール'],['R20','少年「……ボール」']]],
  ['「おかえり」',[['R06','沙羅→最初の復帰ドロ'],['R08','キラ→カイル'],['R13','沙羅→記憶を持ったカイル']]],
  ['右へ見せて、左足で返す',[['R02','カイルのサッカーの癖'],['R07','沙羅が癖を読み、カイルを止める'],['R14','沙羅自身が「左へ見せて右へ潜る」']]],
  ['声',[['R01','声が出ない'],['R03','初めての「お母さん」'],['R09','交換部品が尽きかける'],['R15','最後の一瞬だけ、声が澄む']]],
  ['生身の右手',[['R11','左腕は義手、右手は生身'],['R13','右手でカイルの手を引く'],['R15','右手が頬に触れる'],['R16','カイルが右手を握る'],['R19','最後に浮かぶ右手']]],
  ['黙って行く',[['R10','カイルが言わずに出発'],['R13','「言ったら、ついてくるだろ」'],['R17','キラに答えず装甲車へ']]],
  ['瞳の光',[['R01','幼いカイルの淡い診断光'],['R04','全ドロの瞳に同じ制御光'],['R13','携帯電源でカイルの目が開く']]],
  ['工具袋',[['R05','沙羅の装備'],['R20','キラの腰に、沙羅の工具袋']]]];
  $('#motifs').innerHTML=M.map(([n,p])=>`<div class="motif"><h4>${n}</h4><div class="path">${p.map(([id,t])=>`<span><b>${id}</b>${esc(t)}</span>`).join('<i>→</i>')}</div></div>`).join('');
})();

/* ---------- BOARDS ---------- */
const BOARDS=(function(){
  const sheets={};CUTS.forEach(c=>{(sheets[c.sheet]=sheets[c.sheet]||[]).push(c)});
  const box=$('#sheets');
  box.innerHTML=Object.entries(sheets).map(([sh,cs])=>{
    const gen=cs[0].img;const scenes=[...new Set(cs.map(c=>c.scene))].filter(s=>s!=='END');
    return `<div class="sheet" data-sheet="${sh}" data-scenes="${scenes.join(' ')}" data-gen="${gen?'gen':'todo'}">
      <header><b>${sh}</b><span class="tag ${gen?'ok':'warn'}">${gen?'生成済み':'未生成'}</span><span class="sub">${scenes.map(s=>s+' '+esc(sceneById[s].title)).join(' ／ ')}</span><span class="sp"></span><button class="btn sm" type="button" data-prompt="${sh}">プロンプト</button></header>
      <div class="four">${cs.map(c=>{const i=CUTS.indexOf(c);const ln=c.lines&&c.lines.length?`${c.lines[0][0]}「${c.lines[0][1]}」`:'';
        if(c.img)return `<button class="pn" type="button" data-i="${i}" data-t="${esc((c.cam+c.act).toLowerCase())}"><img src="img/sb/${c.id}.webp" alt="${c.id} ${esc(c.cam)}" loading="lazy"><span class="id">${c.id}</span>${ln?`<span class="ln">${esc(ln)}</span>`:''}</button>`;
        return `<button class="pn txt" type="button" data-i="${i}" data-t="${esc((c.cam+c.act).toLowerCase())}"><span class="id">${c.id.startsWith('END')?'END':c.id}</span><span class="tc"><b>${esc(c.cam)}</b>${esc(c.act.replace(/\n+/g,' ').slice(0,90))}…</span></button>`}).join('')}</div></div>`}).join('');
  const sel=$('#bScene');sel.innerHTML+=SC.map(s=>`<option value="${s.id}">${s.id} ${esc(s.title)}</option>`).join('');
  function apply(){const q=$('#bq').value.trim().toLowerCase(),sc=sel.value,st=$('#bState').value;let n=0,hits=0;
    $$('.sheet',box).forEach(s=>{let ok=(!sc||s.dataset.scenes.split(' ').includes(sc))&&(!st||s.dataset.gen===st);let any=!q;
      $$('.pn',s).forEach(p=>{const h=!!q&&p.dataset.t.includes(q);p.classList.toggle('hit',h);if(h){any=true;hits++}});
      s.classList.toggle('hide',!(ok&&any));if(ok&&any)n++});
    $('#bCount').textContent=`${n}シート表示中`+(q?`・「${q}」に一致：${hits}カット`:'')}
  $('#bq').addEventListener('input',apply);sel.addEventListener('change',apply);$('#bState').addEventListener('change',apply);apply();
  box.addEventListener('click',e=>{const p=e.target.closest('.pn'),pr=e.target.closest('[data-prompt]');
    if(p)LB.cut(+p.dataset.i);if(pr)copy(EA.prompts[pr.dataset.prompt],pr.dataset.prompt+' のプロンプトをコピーしました')});
  return {filterScene(id){sel.value=id;$('#bq').value='';$('#bState').value='';apply();document.getElementById('boards').scrollIntoView({behavior:RM?'auto':'smooth'})}};
})();

/* ---------- LIGHTBOX ---------- */
const LB=(function(){
  const dlg=$('#lb'),main=$('#lbMain');let mode=null,idx=0;
  const SHEETS={sara:['沙羅 設定画（デザイン案・25歳）','img/ch/sara-sheet.webp','オリーブの作業服。左腕のみ機械、右腕は生身。衣装別の全シートはデザイン資料へ。'],kyle:['カイル 設定画（デザイン案・戦後）','img/ch/kyle-sheet.webp','青を残した耐久装備。うなじに保守端子。衣装別の全シートはデザイン資料へ。'],kira:['キラ 設定画（デザイン案・戦後）','img/ch/kira-sheet.webp','赤いワークジャケットと工具袋。うなじに保守端子。衣装別の全シートはデザイン資料へ。'],support:['脇役 設定画','img/ch/support-sheet.webp','上段左から：沙羅の母、沙羅の父、医療担当者。下段左から：人間の運転手、復帰ドロ、ユタニ社側の人物。']};
  function cut(i){mode='cut';idx=(i+CUTS.length)%CUTS.length;const c=CUTS[idx],s=sceneById[c.scene];
    $('#lbT').textContent=`${c.id} ・ ${c.sheet} ・ ${idx+1}/${CUTS.length}`;
    const img=c.img?`<img src="img/sb/${c.id}.webp" alt="${c.id}">`:`<div class="textcut" style="position:absolute"><div class="k">${c.id.startsWith('END')?'END':c.id} ・ 未生成</div><div class="cam">${esc(c.cam)}</div><div class="a">${esc(c.act)}</div></div>`;
    main.innerHTML=`<div class="img">${img}</div><div class="lbside"><span class="tag">${s?s.id+' '+esc(s.title):'END'}</span>${c.img?'<span class="tag ok">生成済み（構図確認用）</span>':'<span class="tag warn">未生成</span>'}
      <h4>${esc(c.cam)}</h4><div class="act">${esc(c.act)}</div>
      ${c.lines&&c.lines.length?`<div class="lines">${c.lines.map(([w,x])=>`<div><b>${esc(w)}</b>${esc(x)}</div>`).join('')}</div>`:''}
      <div class="dl"><button class="btn sm pri" type="button" id="lbPlay">▶ ここから再生</button><button class="btn sm" type="button" id="lbCopy">${c.sheet}のプロンプト</button></div></div>`;
    $('#lbPlay').onclick=()=>{dlg.close();goFilm();P.fromCut(c.id);setTimeout(()=>P.play(),650)};
    $('#lbCopy').onclick=()=>copy(EA.prompts[c.sheet],c.sheet+' のプロンプトをコピーしました');
    if(!dlg.open)dlg.showModal()}
  function sheet(k){mode='sheet';const [t,src,d]=SHEETS[k];$('#lbT').textContent=t;
    main.innerHTML=`<div class="img sheetimg"><img src="${src}" alt="${t}"></div><div class="lbside"><h4>${t}</h4><p class="act">${d}</p></div>`;if(!dlg.open)dlg.showModal()}
  $('#lbX').onclick=()=>dlg.close();$('#lbPrev').onclick=()=>mode==='cut'&&cut(idx-1);$('#lbNext').onclick=()=>mode==='cut'&&cut(idx+1);
  dlg.addEventListener('click',e=>{if(e.target===dlg||e.target.classList.contains('lbin'))dlg.close()});
  dlg.addEventListener('keydown',e=>{if(mode!=='cut')return;if(e.key==='ArrowRight')cut(idx+1);if(e.key==='ArrowLeft')cut(idx-1)});
  let sx=null;main.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});main.addEventListener('touchend',e=>{if(sx==null||mode!=='cut')return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>60)cut(idx+(dx<0?1:-1));sx=null});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-sheet]');if(b&&!b.closest('.sheet'))sheet(b.dataset.sheet)});
  return {cut,sheet};
})();

/* ---------- 3D ---------- */
$('#s3start').onclick=async()=>{$('#s3start').textContent='読み込み中…';try{const m=await import('./stage3d.js');m.init();$('#s3boot').remove()}catch(e){console.error(e);$('#s3boot').innerHTML='<p>3Dの読み込みに失敗しました。通信環境を確認して再読み込みしてください。</p>'}};

/* ---------- ISSUES ---------- */
(function issues(){
  const I=[
  ['ng','要修正','R14-06 と R15：沙羅が撃たれる場面が二重になっている','絵コンテ指示のR14-06では、沙羅が脇腹を撃たれて車内へ運ばれる。物語本文では、R15で沙羅がカイルを庇って胸に被弾し、搬出口のその場で亡くなる。',['絵コンテ R14-06','手動レバーを引いた沙羅が脇腹を撃たれ、カイルが抱えて車内へ。車が走り出す。'],['物語本文 R14–R15','R14はカイル解放まで。R15、救出車へ退避する直前に沙羅がカイルを庇って胸に被弾し、その場で息を引き取る。']],
  ['warn','要確認','R13-04：「言ったら、ついてくるだろ」のやりとり','物語本文の象徴的なやりとりが、絵コンテ指示には入っていない。',['絵コンテ R13-04','「すぐ戻れると思った。……ごめん」「戻りたかったよ」'],['物語本文 R13','「言ったら、ついてくるだろ」「行くよ」「……だろ？」→二人で泣きながら一瞬だけ笑う']],
  ['warn','要確認','R15：カイル「……いる。ずっといるから」','物語本文にあるカイルの返答が、絵コンテ指示（R15-04／R15-05）にはない。アニマティックの字幕では、本文に合わせてR15-05に入れています。',null,null],
  ['warn','要確認','生成済み絵コンテの設定ズレ','パッケージの注記どおり、幼少期の年齢・義手の有無・人物の取り違えを含むシートがある（例：SB-01の幼少期の沙羅が戦後の衣装）。完成映像用の確定画ではなく、構図確認用として扱う。',null,null],
  ['info','未着手','SB-16〜SB-24（36カット）が未生成','R13-05〜R20とENDの画面設計と生成指示は完成済み。絵コンテ欄の「プロンプト」ボタンから、そのままコピーして生成できる。',null,null],
  ['warn','要確認','尺：設計は約20分、上限は20分','ロング部門の上限（資料記載）とほぼ同じ長さ。公式要項で尺の条件を確認し、尺配分プランナーで余裕を持たせる。',null,null],
  ['warn','要確認','締切の確定日時','公式の表記は「10月末予定」。確定した日時と提出方法を公式ページで確認する。',null,null],
  ['info','検討中','デザイン案（2026-10-02）の本編への反映','デザイン案とコンセプトアートを受け取り、人物欄に反映した（確定前）。本編にない場面も含む。人工喉頭の見せ方と保守端子の位置は、採用時に決める。詳細はデザイン資料の「本編との対応メモ」を参照。',null,null],
  ['ok','確定','EARTH AFTERの暴走原因・ユタニの思想','前回の資料で未確定だった2点は、新しい物語本文で確定。命令「人類の保全と社会損失の最小化」を、人間の自由を奪う管理だと解釈した。ユタニはドロを「家族」と呼び、アップデートによる統合を正当化する。',null,null]];
  const lv={ng:['#e5533d','要修正'],warn:['#e8a94f','要確認'],info:['#8fe6ff','未着手'],ok:['#8fd6a3','確定']};
  $('#issues').innerHTML=I.map(([k,l,h,p,a,b])=>`<div class="issue"><span class="lv" style="color:${lv[k][0]};border:1px solid ${lv[k][0]}66">${l}</span><div><h4>${esc(h)}</h4><p>${esc(p)}</p>${a?`<div class="vs"><div><b>${esc(a[0])}</b>${esc(a[1])}</div><div><b>${esc(b[0])}</b>${esc(b[1])}</div></div>`:''}</div></div>`).join('');
})();

/* ---------- PLANNER ---------- */
(function planner(){
  const LIMIT=1200,TARGET=1170;
  const counts=SC.map(s=>CUTS.filter(c=>c.scene===s.id||(s.id==='R20'&&c.scene==='END')).length);
  const tot=counts.reduce((a,b)=>a+b,0);
  const def=counts.map(n=>Math.round(n/tot*TARGET));def[def.length-1]+=TARGET-def.reduce((a,b)=>a+b,0);
  let v=store.get('ea-plan',null);if(!v||v.length!==SC.length)v=def.slice();
  const box=$('#planner');
  box.innerHTML=SC.map((s,i)=>`<div class="row"><span class="n">${s.id}</span><div><div class="t">${esc(s.title)} <span class="sub">・${counts[i]}カット</span></div><div class="bar"><i id="pb${i}" style="background:${ACTC[s.act]}"></i></div></div><label class="sr" for="pi${i}">${s.id}の秒数</label><input id="pi${i}" type="number" inputmode="numeric" min="0" step="5" value="${v[i]}" aria-label="${s.id} ${esc(s.title)} の秒数"></div>`).join('');
  function upd(){const sum=v.reduce((a,b)=>a+(+b||0),0),mx=Math.max(...v,1);v.forEach((x,i)=>$('#pb'+i).style.width=(x/mx*100)+'%');
    const over=sum>LIMIT,rest=LIMIT-sum,col=over?'#e5533d':(rest<30?'#e8a94f':'#8fd6a3');
    const acts=[1,2,3].map(a=>SC.reduce((s,x,i)=>s+(x.act===a?+v[i]||0:0),0));
    $('#ptotal').innerHTML=`<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:baseline"><span class="big" style="color:${col}">${fmt(sum)}</span><span class="sub">上限 20:00 まで <b style="color:${col}">${over?'超過 '+fmt(-rest):'残り '+fmt(rest)}</b></span></div>
      <div class="meter"><i style="width:${Math.min(100,sum/LIMIT*100)}%;background:${col}"></i></div>
      <div class="sub" style="margin-top:6px">ACT1 ${fmt(acts[0])}（${Math.round(acts[0]/sum*100)||0}%）・ACT2 ${fmt(acts[1])}（${Math.round(acts[1]/sum*100)||0}%）・ACT3 ${fmt(acts[2])}（${Math.round(acts[2]/sum*100)||0}%）</div>`;
    store.set('ea-plan',v)}
  box.addEventListener('input',e=>{if(e.target.matches('input')){v[+e.target.id.slice(2)]=Math.max(0,+e.target.value||0);upd()}});
  $('#pReset').onclick=()=>{v=def.slice();$$('input',box).forEach((x,i)=>x.value=v[i]);upd();toast('初期値に戻しました')};
  $('#pCsv').onclick=()=>download('EARTH_AFTER_尺表.csv',['シーン,タイトル,幕,カット数,秒数,分秒'].concat(SC.map((s,i)=>[s.id,s.title,s.act,counts[i],v[i],fmt(v[i])].map(csvq).join(','))).concat([csvq('合計')+',,,'+tot+','+v.reduce((a,b)=>a+b,0)+','+csvq(fmt(v.reduce((a,b)=>a+b,0)))]).join('\n'));
  upd();
})();

/* ---------- COLOR SCRIPT ---------- */
(function cs(){
  const PLAN={R15:[['#0b0605',.4],['#3a0f0a',.25],['#8e2a1c',.2],['#e5533d',.1],['#f0c9a0',.05]],R16:[['#6b6863',.15],['#b8b3ab',.3],['#dedad3',.35],['#f4f2ee',.2]],R17:[['#141827',.3],['#4a2f2a',.3],['#a0603a',.25],['#e1a05a',.15]],R18:[['#0c1116',.3],['#2c3a4a',.3],['#6b7f93',.2],['#e8742f',.1],['#f0d9b0',.1]],R19:[['#0b1215',.35],['#2c4550',.25],['#79a9b8',.2],['#d8f6ff',.15],['#ffffff',.05]],R20:[['#6c7d56',.2],['#a9b98f',.25],['#e9c6cf',.3],['#f6dde4',.25]]};
  $('#cscript').innerHTML=SC.map(s=>{const p=EA.palette[s.id],plan=!p,arr=p||PLAN[s.id];return `<div class="c${plan?' plan':''}" title="${s.id} ${esc(s.title)}${plan?'（予定色）':''}">${arr.map(([c,w])=>`<i style="background:${c};--w:${Math.max(w,.04)}"></i>`).join('')}<b>${s.id}</b></div>`}).join('');
})();

/* ---------- RULES ---------- */
(function rules(){
  const R=[['do','（デザイン案採用時）沙羅は黒髪のストレートで統一'],['do','（デザイン案採用時）キラとカイルは人間擬態型。関節線や機構を露出させず、機械性は精度・速度・瞳の制御光で示す'],['do','25歳の沙羅は左腕のみ機械。右手は生身'],['dont','21歳以前の沙羅に義手を描く'],['do','カイル（18歳相当）とキラ（17歳相当）は戦後も外見年齢が変わらない'],['dont','沙羅とカイルの恋人表現、キス、同衾を描く'],['dont','沙羅の幽霊・人格コピー・転生としての子供を描く'],['dont','最後にキラを呼ぶ男性とカイルの姿を映す'],['dont','沙羅の死亡場面・遺体安置場面に両親を出す'],['do','ユタニ本社のユタニは遠隔ホログラム。撃たれても血を出さずグリッチで崩れる'],['do','沙羅の戦闘は殺すためではなく、射線を逸らし、駆動部を止め、退路を開くため'],['dont','流血や臓器を過度に描写する（衣服に滲む血まで）'],['do','R19後のカイルの生死は映さない。白い閃光で切る'],['do','最終カットは「バン！」と同時に完全な暗転'],['dont','1987年版『ロボットカーニバル』の固有名・意匠を生成指示に入れる']];
  $('#rules').innerHTML=R.map(([k,t])=>`<div class="rule ${k}"><span class="mk">${k==='do'?'○':'✕'}</span><span>${esc(t)}</span></div>`).join('');
})();

/* ---------- PROMPT & CSV ---------- */
$('#promptBase').textContent=EA.promptHeader;
$('#copyNew').onclick=()=>copy($('#promptNew').textContent,'デザイン案の指定をコピーしました');
$('#copyBase').onclick=()=>copy(EA.promptHeader,'共通プロンプトをコピーしました');
$('#shotCsv').onclick=()=>download('EARTH_AFTER_ショットリスト.csv',['カット,シート,シーン,シーン名,生成状態,カメラ,動作・演出,台詞'].concat(CUTS.map(c=>[c.id,c.sheet,c.scene,c.scene==='END'?'暗転':sceneById[c.scene].title,c.img?'生成済み':'未生成',c.cam,c.act,(c.lines||[]).map(l=>l[0]+'「'+l[1]+'」').join(' / ')].map(csvq).join(','))).join('\n'));

/* ---------- COUNTDOWN ---------- */
(function cd(){const D=new Date('2026-10-31T23:59:00+09:00').getTime();
  function tick(){const d=D-Date.now();if(d<0){$('#count').innerHTML='<div><strong>—</strong><small>仮置きの締切を過ぎました</small></div>';$('#heroDays').textContent='締切：公式で確認';return}
    const s=Math.floor(d/1000);$('#cd').textContent=Math.floor(s/86400);$('#ch').textContent=String(Math.floor(s%86400/3600)).padStart(2,'0');$('#cm').textContent=String(Math.floor(s%3600/60)).padStart(2,'0');$('#cs').textContent=String(s%60).padStart(2,'0');$('#heroDays').textContent=`締切まで あと${Math.floor(s/86400)}日（仮）`}
  tick();setInterval(tick,1000)})();

/* ---------- CHECKLIST ---------- */
(function chk(){
  const C={'脚本':[['R14-06とR15の矛盾を解消（沙羅が撃たれる場面の一本化）',1],['R13・R15の台詞を本文と絵コンテで統一',1],['20分以内へ台詞・モンタージュ尺を実測'],['キラの存在感を各幕で維持'],['EARTH AFTER暴走原因・ユタニの思想（物語本文で確定済み）',1]],
  '絵コンテ':[['SB-16〜SB-24（36カット）を生成',1],['設定ズレのある生成済みシートを確認・差し替え',1],['16:9・1シート4コマで統一'],['沙羅／カイル／キラのキャラクター連続性を最優先']],
  '映像':[['年代差：幼少期→学生→17歳→21歳→25歳→3年後'],['カイルとキラは外見年齢が変わらない'],['沙羅の義手は25歳から・左腕のみ',1],['EARTH AFTER配信時の「瞳の制御光」を象徴ショットに'],['R16の白い布。両親は映さない',1],['R20の男の声の主・カイルは映さない',1]],
  '音':[['沙羅の人工喉頭の声を過度なロボ声にしない'],['交換部品不足のノイズを伏線化'],['R15、最後の一瞬だけ声が澄む',1],['「バン！」と同時に完全暗転',1]],
  '権利':[['キャラ・背景・ロゴはオリジナル'],['既存IPの固有名・意匠を生成指示へ入れない'],['音楽・SE・フォント・AI生成サービスの利用条件を記録'],['1987年版ロボットカーニバルの素材を使用しない（生成AIへの入力も禁止）']],
  '提出':[['20分以下（公式の尺条件も確認）'],['書き出し映像を全編再生確認'],['字幕・音量・黒レベル・フレーム落ち確認'],['サムネイル'],['あらすじ'],['アピールポイント'],['AI使用ツール／制作工程の記録'],['最新規約の確認'],['締切日時の確認']]};
  let st=store.get('ea-checks2',{});const box=$('#checks');let total=0;
  box.innerHTML=Object.entries(C).map(([g,it])=>`<div class="card"><h3>${g}</h3>${it.map(([t,n])=>{total++;const id=g+'|'+t;return `<label><input type="checkbox" data-id="${esc(id)}" ${st[id]?'checked':''}><span>${esc(t)}${n?'<span class="new">NEW</span>':''}</span></label>`}).join('')}</div>`).join('');
  function upd(){const n=$$('input:checked',box).length;$('#done').textContent=n;$('#total').textContent=total;const p=Math.round(n/total*100);$('#pct').textContent=p;$('#pbar').style.width=p+'%'}
  box.addEventListener('change',e=>{if(e.target.matches('input')){st[e.target.dataset.id]=e.target.checked;store.set('ea-checks2',st);upd()}});
  $('#chkReset').onclick=()=>{st={};store.set('ea-checks2',st);$$('input',box).forEach(i=>i.checked=false);upd();toast('リセットしました')};upd();
})();

$('#stGen').textContent=CUTS.filter(c=>c.img).length;
observeReveal();
})();
