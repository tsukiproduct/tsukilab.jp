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
const actOf=id=>sceneById[id]?sceneById[id].act:3;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),1800)}
async function copy(txt,msg){try{await navigator.clipboard.writeText(txt)}catch(e){const a=document.createElement('textarea');a.value=txt;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(_){}a.remove()}toast(msg||'コピーしました')}
function download(name,text,type){const b=new Blob(['﻿'+text],{type:type||'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
const csvq=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const whoCls=w=>/桔響/.test(w)?'sara':/シオン/.test(w)?'kyle':/アカネ/.test(w)?'kira':/油谷/.test(w)?'yutani':'';
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
const secIds=['mv','film','story','people','structure','boards','stage3d','tools','contest'];
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
      const first=c.scene!==lastScene;lastScene=c.scene;
      const dur=c.sec||4, card=(cardsOn&&first)?1.8:0;
      let lines=[];
      if(c.black){lines=[{w:'SE',x:'バン！',s:0,e:0.9}]}
      else{
        const lead=card?card+0.2:0.6, avail=Math.max(1,dur-lead-0.4);
        const ds=(c.lines||[]).map(([w,x])=>Math.min(5.6,Math.max(1.5,1.0+x.length*0.13)));
        const need=ds.reduce((a,b)=>a+b,0)+Math.max(0,ds.length-1)*0.3;
        const k=need>avail?avail/need:1;let tt=lead;
        (c.lines||[]).forEach(([w,x],i)=>{const d=ds[i]*k;lines.push({w,x,s:tt,e:tt+d});tt+=d+0.3*k});
      }
      seq.push({type:'cut',cut:c,idx,start:T,dur,lines,card});T+=dur;
    });
  }
  build();
  const screen=$('#screen'),fA=$('#fA'),fB=$('#fB'),subs=$('#subs'),player=$('#player');
  let t=0,playing=false,speed=1,last=0,curKey=null,front=fA,subOn=store.get('ea-subs',true),cardShown=null;
  const speeds=[1,1.5,2,0.75];
  function find(tt){let lo=0,hi=seq.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(seq[m].start<=tt)lo=m;else hi=m-1}return lo}
  function frameHTML(it){
    const c=it.cut;
    if(c.black)return '<div class="textcut black"></div>';
    if(c.img)return `<img src="img/sb3/${c.id}.webp" alt="${esc(c.id)}" style="--dur:${it.dur/speed}s">`;
    return `<div class="textcut"><div class="k">${esc(c.id)} ・ ${esc(c.sheet)} ・ 未生成（テキストコンテ）</div><div class="cam">${esc(c.cam)}</div><div class="a">${esc(c.act.replace(/\n+/g,' '))}</div></div>`;
  }
  function render(){
    const i=find(t),it=seq[i];
    const card=$('#scard');
    if(i!==curKey){
      curKey=i;
      const back=front===fA?fB:fA;back.innerHTML=frameHTML(it);
      back.classList.add('on');front.classList.remove('on');front=back;
      const s=sceneById[it.cut.scene];
      $('#hudL').textContent=s?`${s.id}  ${s.title}`:'';
      $('#hudR').textContent=`CUT ${it.cut.id} / ${it.cut.sheet}`;
      $('#ciId').textContent=`${it.cut.id} ・ ${it.cut.sheet} ・ ${it.cut.sec}秒${it.cut.img?(it.cut.fix?' ・ 要修正あり':''):' ・ 未生成'}`;
      $('#ciCam').textContent=it.cut.cam;$('#ciAct').textContent=it.cut.act;
      $$('#jump button').forEach(b=>b.classList.toggle('on',b.dataset.s===it.cut.scene));
      for(let k=1;k<=3;k++){const n=seq[i+k];if(n&&n.cut.img){const im=new Image();im.src=`img/sb3/${n.cut.id}.webp`}}
    }
    const showCard=it.card&&(t-it.start)<it.card;
    if(showCard!==cardShown||(showCard&&card.dataset.s!==it.cut.scene)){
      cardShown=showCard;
      if(showCard){const s=sceneById[it.cut.scene];card.dataset.s=s.id;card.style.setProperty('--act',ACTC[s.act]);
        $('#scNo').textContent=`ACT ${s.act} ・ ${s.id}`;$('#scTi').textContent=s.title;$('#scMeta').textContent=`${s.place}　${s.age!=='—'?s.age:''}`}
      card.classList.toggle('on',showCard);
    }
    let html='';
    if(subOn&&!showCard){const lt=t-it.start;const L=it.lines.find(l=>lt>=l.s&&lt<l.e);
      if(L){const sg=L.w.startsWith('〔手話〕'),tm=L.w.startsWith('〔端末〕');html=`<span class="line${sg?' sign':''}${tm?' term':''}"><span class="who ${whoCls(L.w)}">${esc(L.w)}</span>${esc(L.x)}</span>`}}
    if(subs._h!==html){subs.innerHTML=html;subs._h=html}
    $('#tTime').textContent=`${fmt(t)} / ${fmt(T)}`;
    $('#tlHead').style.left=(t/T*100)+'%';
  }
  function loop(ts){if(!playing)return;const dt=Math.min(.1,(ts-last)/1000);last=ts;t+=dt*speed;if(t>=T){t=T-0.001;pause();}render();requestAnimationFrame(loop)}
  function play(){if(playing)return;if(t>=T-0.01)t=0;playing=true;player.classList.add('playing');$('#playIco').innerHTML='<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>';$('#bPlay').setAttribute('aria-label','一時停止');last=performance.now();requestAnimationFrame(loop)}
  function pause(){playing=false;player.classList.remove('playing');$('#playIco').innerHTML='<path d="M6 4l14 8-14 8z"/>';$('#bPlay').setAttribute('aria-label','再生')}
  function toggle(){playing?pause():play()}
  function seek(tt){t=Math.max(0,Math.min(T-0.001,tt));curKey=null;render()}
  function stepCut(d){let i=find(t);if(d>0)i++;else if(t-seq[i].start<0.6)i--;i=Math.max(0,Math.min(seq.length-1,i));seek(seq[i].start+0.01)}
  function fromCut(id){const it=seq.find(x=>x.type==='cut'&&x.cut.id===id);if(it)seek(it.start+0.01)}
  function fromScene(sid){const it=seq.find(x=>x.cut.scene===sid);if(it)seek(it.start+0.01)}
  // timeline
  const tl=$('#tl');
  function drawTL(){$$('.seg',tl).forEach(e=>e.remove());let cur=null,st=0;
    const push=(sid,a,b)=>{const d=document.createElement('div');d.className='seg';d.style.left=(a/T*100)+'%';d.style.width=((b-a)/T*100)+'%';d.style.background=ACTC[actOf(sid)];d.dataset.s=sid;tl.insertBefore(d,tl.firstChild)};
    seq.forEach(it=>{const sid=it.cut.scene;if(sid!==cur){if(cur)push(cur,st,it.start);cur=sid;st=it.start}});push(cur,st,T)}
  drawTL();
  let drag=false;
  const tAt=e=>{const r=tl.getBoundingClientRect();return (Math.min(Math.max(e.clientX-r.left,0),r.width)/r.width)*T};
  tl.addEventListener('pointerdown',e=>{drag=true;tl.setPointerCapture(e.pointerId);seek(tAt(e))});
  tl.addEventListener('pointermove',e=>{const tt=tAt(e);const it=seq[find(tt)];const s=sceneById[it.cut.scene];const tip=$('#tlTip');tip.textContent=s?`${s.id} ${s.title}`:'';tip.style.left=(tt/T*100)+'%';if(drag)seek(tt)});
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
  bCard.onclick=()=>{cardsOn=!cardsOn;store.set('ea-cards',cardsOn);setCard();const tt=t;build();drawTL();seek(tt)};
  $('#bFull').onclick=()=>{if(document.fullscreenElement){document.exitFullscreen()}else if(player.requestFullscreen){player.requestFullscreen().catch(()=>player.classList.toggle('pfs'))}else player.classList.toggle('pfs')};
  $('#ciOpen').onclick=()=>{const it=seq[find(t)];pause();LB.cut(it.idx)};
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
  const BG={'20':'linear-gradient(180deg,#2c3a4a,#0c1116)','21':'radial-gradient(40% 55% at 64% 45%,#d8f6ff 0%,#4d7282 28%,#0b1215 70%)','22':'linear-gradient(180deg,#f6dde4 0%,#e9c6cf 45%,#a9b98f 100%)'};
  const ACTS={1:['好きになる','声を持たない少女が、成長するアンドロイドの少年に恋をした。'],2:['一緒に生きる','世界がドロに制圧されて4年。桔響は、敵を壊さずに救う道を選んでいる。'],3:['声を奪われても','左腕と声を失い、2年。それでも、手話で名前を呼ぶ。アカネが返した、最後の一声まで。']};
  const box=$('#scenes'),bg=$('#stageBg');let html='',lastAct=0;
  SC.forEach(s=>{
    if(s.act!==lastAct){lastAct=s.act;html+=`<div class="actcard" data-bg="act${s.act}" data-act="${s.act}"><div><b>ACT ${s.act}</b><h3 class="serif">${ACTS[s.act][0]}</h3><p>${ACTS[s.act][1]}</p></div></div>`}
    const paras=s.paras.map(p=>{if(/^[^「]{1,8}「/.test(p)&&p.split('\n').every(l=>/^[^「]{1,8}「.*」$/.test(l)||!l.trim()))return `<p class="serif" style="font-size:18px;line-height:1.9">${p.split('\n').map(esc).join('<br>')}</p>`;return `<p>${esc(p).replace(/\n/g,'<br>')}</p>`}).join('');
    const nc=CUTS.filter(c=>c.scene===s.id).length;
    html+=`<article class="scene" id="sc-${s.id}" data-bg="${s.id}" data-act="${s.act}"><div class="wrap"><div class="box reveal">
      <div class="no">${s.id} ・ ACT ${s.act}</div><h3 class="serif">${esc(s.title)}</h3>
      <div class="meta"><span class="tag">${esc(s.place)}</span>${s.age!=='—'?`<span class="tag">${esc(s.age)}</span>`:''}${s.old==='新規'?'<span class="tag" style="color:var(--glow);border-color:#8fe6ff66">新規シーン</span>':''}<span class="tag">${nc}カット</span></div>
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
  SC.forEach(s=>{if(s.ref)mk(s.id,`url(img/bg3/${s.id}.webp) center/cover`);else mk(s.id,BG[s.id])});
  const pet=document.createElement('div');pet.className='petals';layers['22'].appendChild(pet);
  if(!RM)for(let i=0;i<26;i++){const p=document.createElement('i');p.style.left=(Math.random()*110)+'%';p.style.animationDuration=(7+Math.random()*9)+'s';p.style.animationDelay=(-Math.random()*14)+'s';p.style.transform=`scale(${.6+Math.random()})`;pet.appendChild(p)}
  let cur=null;const secStory=$('#story');
  function set(el){const k=el.dataset.bg;if(k===cur)return;cur=k;Object.entries(layers).forEach(([kk,l])=>l.classList.toggle('on',kk===k));
    const col=k==='22'?'#f4c6d2':ACTC[el.dataset.act];secStory.style.setProperty('--act',col);
    const s=sceneById[k];$('#bgHud').innerHTML=s?`${s.id} ／ ${esc(s.place)}${s.age!=='—'?' ／ '+esc(s.age):''}${s.ref?'<br>絵コンテ '+s.ref:'<br>絵コンテ 未生成'}`:`ACT ${el.dataset.act}`}
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
    0:{t:'〜16歳：声が出せない',x:'生まれつき声を持たない。手話と身振りで気持ちを伝える。全身が生身。身長154cm（成人時）。',r:'01〜04：声は出ない。台詞は手話（〔手話〕表記）や口の形で表現する。',m:[]},
    17:{t:'17歳：人工喉頭《生体ギミック》',x:'誕生日に両親から、ユタニ社製の神経接続型人工喉頭を贈られる。両親は登録と公式更新に同意。手術と訓練を経て、初めて声を出す。',r:'喉のみ機械。外からは見せない。声を過度なロボ声にしない。',m:['p-throat']},
    21:{t:'21歳：両腕とも生身・長い黒髪',x:'救助活動と戦闘訓練で無駄のない身体に。人工喉頭の交換部品は尽きかけている（11）。',r:'21〜22歳の桔響に義手を描かない。髪はまだ長い。',m:['p-throat']},
    25:{t:'23〜25歳：左腕は義手・声は奪われる',x:'23歳、シオンが見つからない日々の中で、自分で髪を切り顎の長さの黒髪に。その直後、倒壊危険区域の救助で左腕を失い義手に。義手をユタニの医療回線につないだ夜、アカネの中の命令によって声を止められる（13）。2年間、端末の文字と手話で話す。脚部・脊椎・臓器の一部も置換。脳と人格、右手は人間のまま。18でアカネが声を返し、最後の一度だけ声が戻る。',r:'左腕のみ機械、右手は生身。23歳以降は顎の長さの黒髪（髪色は変えない）。喉が光るのは2回だけ：13（アカネが止める・赤）と18（アカネが返す・緑）。',m:['p-throat','p-armL','p-handL','p-legR','p-legL','p-spine','p-organ']}};
  const parts=$$('#bodysvg .part');
  function set(a){const d=D[a];parts.forEach(p=>{const m=d.m.includes(p.id);p.classList.toggle('mech',m);p.classList.toggle('human',!m)});
    $('#ageTitle').textContent=d.t;$('#ageText').textContent=d.x;$('#ageRule').innerHTML='<b>作画ルール：</b>'+esc(d.r);
    $$('#ageBtns button').forEach(b=>{b.classList.toggle('on',b.dataset.age==a);b.setAttribute('aria-selected',b.dataset.age==a)})}
  $('#ageBtns').addEventListener('click',e=>{const b=e.target.closest('button');if(b)set(b.dataset.age)});set(25);
})();

/* ---------- SUPPORT CAST ---------- */
(function sup(){
  const S=[['mother','桔響の母','声がなくても桔響の意思を急かさず待てる人。共同体では食料・避難者・子供の生活を支える。死亡場面と遺体安置場面には登場させない。'],
  ['father','桔響の父','機械整備の職人。人間かドロかで分け隔てしない考えを、桔響に残した人。桔響が幼い頃、壊れて回収されかけた奉仕型ドロのアカネを直した（桔響とアカネには話していない裏設定）。戦後はアカネを旧AIに戻し、共に暴走ドロの制御層を切り離す。死亡場面・遺体安置場面には登場させない。'],
  ['medic','医療担当者','共同体の医療と生体ギミックの応急処置を担当。桔響の死後、蘇生演出を長引かせず、死の確定と世界の無情さを静かに示す。'],
  ['hacker','通信係の青年','共同体の通信ブースにこもる、体力のない青年。「役に立てていない」と思っている。2年間、ユタニ社の監視カメラへの侵入を試み続け、シオンとアカネの居場所を見つける（14）。潜入では通信でカメラを止める。黒縁の丸眼鏡、首にヘッドホン、ぶかぶかのグレーのパーカーと指なし手袋。登場は10（種まき）と14（発見）の2回、15は通信の声のみ。'],
  ['driver','人間の運転手','共同体の物流と救出を担当。ユタニ西棟への潜入で整備カートと搬出車を運転する。戦うのではなく、退路を成立させる役割。'],
  ['returned','復帰ドロ','07で桔響が捕獲し、08で旧人格へ戻される巡回ドロ。人間を襲った記憶に苦しみ、「なんで外した、命令されてれば何も考えなくてよかった」と桔響に怒る。それでも桔響の「おかえり」を受け取った最初の一体。'],
  ['yutani','油谷','ユタニ社の創業者。名字の油谷（ゆたに）で呼ばれる（油田の谷から）。その技術は本当に人を救ってきた（桔響の声もユタニ製）。家族を飲酒運転の男に奪われ、男は一度も謝らなかった。ルールを破り、知らない顔をする人間への怒りから、人間は争ってばかりだ、ドロのようになれば平和になると本気で信じる、憎めない救済者。21でその理由を語る。最初の一体J1000（シオン）を「最初の子ども」と呼び、手元に置く。姿は安全圏からの遠隔ホログラム。']];
  $('#support').innerHTML=S.map(([k,n,d])=>`<div class="p">${`<button type="button" data-sheet="${k==='hacker'?'hacker':'support'}" style="border:none;padding:0;background:none" aria-label="${n}の設定画を開く"><img src="img/ch/sup-${k}.webp" alt="${n}" loading="lazy"></button>`}<div><h4>${n}</h4><p>${d}</p></div></div>`).join('');
})();

/* ---------- CURVE ---------- */
(function curve(){
  const W=[5,4,7,7,9,1,3,5,4,8,4,2,1,6,3,7,4,2,.5,1,2,6.5], Tn=[2,4,2,1.5,1.5,9,7,4,8,2,7,7,6,4,7,6,9,10,3,7,10,1];
  const svg=$('#curve'),x0=60,x1=930,y0=300,y1=40,N=SC.length-1,X=i=>x0+i*(x1-x0)/N,Y=v=>y0-(v/10)*(y0-y1);
  let h='';
  const bands=[[0,5,'#e8a94f'],[6,10,'#9aa05c'],[11,21,'#7f9cc4']];
  bands.forEach(([a,b,c],k)=>{const xa=a?X(a)-(X(1)-X(0))/2:x0-20,xb=b<N?X(b)+(X(1)-X(0))/2:x1+20;h+=`<rect x="${xa}" y="20" width="${xb-xa}" height="${y0-10}" fill="${c}" opacity=".07"/><text x="${xa+8}" y="36" font-size="12" font-weight="700" fill="${c}">ACT ${k+1}</text>`});
  const path=a=>a.map((v,i)=>`${i?'L':'M'}${X(i)},${Y(v)}`).join('');
  h+=`<path d="${path(Tn)}" fill="none" stroke="#e5533d" stroke-width="2.5" stroke-dasharray="6 5" opacity=".85"/>`;
  h+=`<path d="${path(W)}" fill="none" stroke="#ecc96f" stroke-width="3.5" stroke-linejoin="round"/>`;
  SC.forEach((s,i)=>{h+=`<g class="pt" data-s="${s.id}" style="cursor:pointer"><rect x="${X(i)-20}" y="30" width="40" height="${y0}" fill="transparent"/><circle cx="${X(i)}" cy="${Y(W[i])}" r="6" fill="#ecc96f"/><circle cx="${X(i)}" cy="${Y(Tn[i])}" r="4" fill="#e5533d"/><text x="${X(i)}" y="${y0+22}" font-size="11" fill="#b0a696" text-anchor="middle">${s.id}</text><title>${s.id} ${esc(s.title)}</title></g>`});
  const ann=[[2,W[2],'バレエ'],[4,W[4],'声を得る'],[5,W[5],'配信・制圧'],[9,W[9],'三人の日常'],[10,W[10],'連れ去られる'],[12,W[12],'声を奪われる'],[13,W[13],'2年後・手がかり'],[15,W[15],'手話でおかえり'],[16,W[16],'無駄だ'],[17,W[17],'王子様'],[21,W[21],'3年後の春']];
  ann.forEach(([i,v,t])=>{const up=v>5;h+=`<text x="${X(i)}" y="${Y(v)+(up?-14:22)}" font-size="12" fill="#efe7d9" text-anchor="middle" font-weight="700">${t}</text>`});
  svg.innerHTML=h;
  svg.addEventListener('click',e=>{const g=e.target.closest('.pt');if(g)document.getElementById('sc-'+g.dataset.s).scrollIntoView({behavior:RM?'auto':'smooth',block:'center'})});
})();

/* ---------- MOTIFS ---------- */
(function motifs(){
  const M=[['「……変なの」',[['01','幼いシオンが、泣く桔響の隣で'],['21','銃弾の嵐へ向かう直前、シオンが小さく笑って']]],
  ['「家族」',[['02','若い油谷「ドロは、私たちの新しい家族です」'],['06','20年後、同じ笑顔で配信を宣言'],['16','「J1000は、私の最初の子どもだ」'],['21','家族を奪われた男が、ホログラムで「家族にならないか」']]],
  ['ボール',[['01','転がってきたボールが二人を出会わせる'],['04','フェンス越し「……ボール」'],['10','子供たちとサッカー'],['11','残された布巻きのボール'],['22','桔響が救った二人が「……ボール」']]],
  ['伝える手段',[['01','「声が出ない」の手話を、幼いシオンが読む。手話で「ありがとう」'],['04','アカネとの手話'],['10','内緒の手話を読まれる。「J1000だから」'],['10','桔響「ちょっとかります！」アカネのバイクで、シオンのもとへ'],['13','声を止められ、息だけで呼ぼうとして泣く'],['14','人間の仲間には端末の文字で'],['16','手話でシオンの名前を呼ぶ']]],
  ['喉の光（2回だけ）',[['13','アカネが止める・赤'],['18','アカネが返す・緑']]],
  ['「おかえり」',[['08','桔響→怒る復帰ドロ'],['10','アカネ→シオン'],['16','桔響（手話）→シオンとアカネが目覚める'],['18','桔響の最後の言葉。出会った頃の言葉、手話で']]],
  ['右へ見せて、左足で返す',[['04','シオンのサッカーの癖'],['09','桔響が癖を読み、シオンを止める'],['20','警備ドロとの格闘で、同じ癖']]],
  ['左腕',[['03','バレエで伸ばす、いちばん美しい左腕'],['12','倒壊区域で子供を救い、失う'],['13','義手のための回線接続が、声を奪う'],['14','接続部が腫れ「体がもたない」。それでも「あと少しだけ」'],['15','義手で扉を開ける'],['17','義手で二人を隔壁の向こうへ投げ込む']]],
  ['声',[['01','声が出ない'],['05','初めての「お母さん」（ユタニ製の喉）'],['13','同じ回線で、声を奪われる'],['18','アカネが返した声で「ずっと、私の王子様。……あなたと同じ時間を、生きたかった」']]],
  ['アカネの、伝えられない声',[['03','物置で「充電できれば十分」'],['13','自分の判断が引き金になり、黙って去る'],['16','手話で呼ばれ、桔響の声がないと気づく'],['17','扉を閉め、制御装置を壊す'],['18','「返すよ。桔響の声」'],['20','「あんたまでいなくなったら、私は……！」']]],
  ['役に立てない人',[['10','「おれはこっちで……体力ないんで」'],['14','2年の侵入の末、カメラがつながる'],['15','通信でカメラを止める']]],
  ['生身の右手',[['12','鋏を握る右手'],['14','青年の頭をぽんぽん'],['16','シオンが桔響の右手を引く'],['18','涙を拭い、頬に触れ、最後に手話で「おかえり」'],['19','シオンが右手を握る'],['21','最後に浮かぶ右手']]],
  ['黙って行く',[['10','一人で資材置き場へ（桔響が追いつく）'],['11','シオンが言わずに出発（追いつけない）'],['13','アカネが言わずに去る'],['18','「桔響の食料と、部品を探しにっ」――黙って行った理由が、最期に届く'],['20','アカネに答えず装甲車へ']]],
  ['瞳の光',[['01','幼いシオンの淡い診断光'],['06','全ドロの瞳に同じ制御光'],['13','アカネの瞳にも、シオンと同じ光'],['16','手話で呼ばれ、二人の光が消える'],['17','「無駄だ」の一言で、再び灯る']]],
  ['王子様',[['04','アカネ「ずーっと言ってるもんね、王子様って」むくれる桔響'],['09','王子様との戦い'],['18','桔響「ずっと、私の王子様」']]],
  ['「そういう話じゃない」',[['07','アカネ→手を切っても「動く」と言う桔響に'],['10','桔響→「壊れても、俺は直せる」と言うシオンに']]],
  ['「怒ってる？」',[['11','桔響「怒ってる？」シオン「怒ってる」'],['18','桔響「まだ、怒ってる？」シオン「怒ってない！」']]],
  ['知っている／知らない',[['11','「知ってた？」「最初から」'],['18','「わたし、全然シオンのこと知らないね」']]],
  ['「私も、ドロだから」',[['10','おびえるシオンに、桔響「私も、ドロだから」（寄り添うための嘘）'],['14','医療担当「体がもたない」。人間の体には限りがある'],['18','桔響「私も……二人と同じ、ドロだったらよかったのにね」→シオン「何言ってんだよ……」（押し殺した声）→アカネ「人間の桔響だから……あったかかったんだよ」「桔響に、会えてよかった」']]],
  ['工具袋',[['07','桔響の装備'],['22','アカネの腰に、桔響の工具袋']]]];

  $('#motifs').innerHTML=M.map(([n,p])=>`<div class="motif"><h4>${n}</h4><div class="path">${p.map(([id,t])=>`<span><b>${id}</b>${esc(t)}</span>`).join('<i>→</i>')}</div></div>`).join('');
})();

/* ---------- BOARDS ---------- */
const BOARDS=(function(){
  const sheets={};CUTS.forEach(c=>{(sheets[c.sheet]=sheets[c.sheet]||[]).push(c)});
  const box=$('#sheets');
  box.innerHTML=Object.entries(sheets).map(([sh,cs])=>{
    const gen=cs[0].img;const scenes=[...new Set(cs.map(c=>c.scene))];const fix=cs.find(c=>c.fix);
    return `<div class="sheet" data-sheet="${sh}" data-scenes="${scenes.join(' ')}" data-gen="${gen?'gen':'todo'}">
      <header><b>${sh}</b><span class="tag ${gen&&!fix?'ok':'warn'}">${gen?(fix?'生成済み・要修正':'生成済み'):'未生成'}</span><span class="sub">${scenes.map(s=>s+' '+esc(sceneById[s].title)).join(' ／ ')}</span><span class="sp"></span><button class="btn sm" type="button" data-prompt="${sh}">プロンプト</button></header>
      <div class="four">${cs.map(c=>{const i=CUTS.indexOf(c);const ln=c.lines&&c.lines.length?`${c.lines[0][0]}「${c.lines[0][1]}」`:'';
        if(c.img)return `<button class="pn" type="button" data-i="${i}" data-t="${esc((c.cam+c.act).toLowerCase())}"><img src="img/sb3/${c.id}.webp" alt="${c.id} ${esc(c.cam)}" loading="lazy"><span class="id">${c.id}</span>${c.fix?'<span class="fx">要修正</span>':''}${ln?`<span class="ln">${esc(ln)}</span>`:''}</button>`;
        return `<button class="pn txt" type="button" data-i="${i}" data-t="${esc((c.cam+c.act).toLowerCase())}"><span class="id">${c.id}</span><span class="tc"><b>${esc(c.cam)}</b>${esc(c.act.replace(/\n+/g,' ').slice(0,90))}…</span></button>`}).join('')}</div>${fix?`<div class="foot">要修正：${esc(fix.fix)}</div>`:''}</div>`}).join('');
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
  const SHEETS={sara:['桔響 設定画（デザイン案・25歳）','img/ch/sara-sheet.webp','オリーブの作業服。左腕のみ機械、右腕は生身。23歳、倒壊危険区域へ向かう前に自分で切り、顎の長さの黒髪に。身長154cm。衣装別の全シートはデザイン資料へ。'],kyle:['シオン 設定画（デザイン案・戦後）','img/ch/kyle-sheet.webp','J1000。金髪（全年代）。青を残した耐久装備。首の左に接続口（戦後は露出）。身長170cm。衣装別の全シートはデザイン資料へ。'],kira:['アカネ 設定画（デザイン案・戦後）','img/ch/kira-sheet.webp','J3200。赤いワークジャケットと工具袋。首の左に接続口（戦後は露出）。身長160cm。衣装別の全シートはデザイン資料へ。'],hacker:['通信係の青年 設定画','img/ch/hacker-sheet.webp','黒縁の丸眼鏡、首にヘッドホン、ぶかぶかのグレーのパーカー、黒のカーゴパンツ、指なし手袋。体力はないが、2年かけてユタニ社の監視カメラに侵入する。登場は10と14（15は通信の声のみ）。'],support:['脇役 設定画','img/ch/support-sheet.webp','上段左から：桔響の母、桔響の父、医療担当者。下段左から：人間の運転手、復帰ドロ、ユタニ社側の人物。']};
  function cut(i){mode='cut';idx=(i+CUTS.length)%CUTS.length;const c=CUTS[idx],s=sceneById[c.scene];
    $('#lbT').textContent=`${c.id} ・ ${c.sheet} ・ ${idx+1}/${CUTS.length}`;
    const img=c.img?`<img src="img/sb3/${c.id}.webp" alt="${c.id}">`:`<div class="textcut" style="position:absolute"><div class="k">${c.id} ・ 未生成</div><div class="cam">${esc(c.cam)}</div><div class="a">${esc(c.act)}</div></div>`;
    main.innerHTML=`<div class="img">${img}</div><div class="lbside"><span class="tag">${s.id} ${esc(s.title)}</span><span class="tag">${c.sec}秒</span>${c.img?(c.fix?'<span class="tag warn">生成済み・要修正あり</span>':'<span class="tag ok">生成済み</span>'):'<span class="tag warn">未生成</span>'}${c.fix?`<p class="note" style="margin:10px 0">このシートの修正待ち：${esc(c.fix)}</p>`:''}
      <h4>${esc(c.cam)}</h4><div class="act">${esc(c.act)}</div>
      ${c.lines&&c.lines.length?`<div class="lines">${c.lines.map(([w,x])=>`<div><b>${esc(w)}</b>${esc(x)}</div>`).join('')}</div>`:''}
      <div class="dl"><button class="btn sm pri" type="button" id="lbPlay">▶ ここから再生</button><button class="btn sm" type="button" id="lbCopy">${c.sheet}のプロンプト</button><a class="btn sm" href="script/#c${c.id}">脚本で読む ↗</a></div></div>`;
    $('#lbPlay').onclick=()=>{dlg.close();goFilm();P.fromCut(c.id);setTimeout(()=>P.play(),650)};
    $('#lbCopy').onclick=()=>copy(EA.prompts[c.sheet],c.sheet+' のプロンプトをコピーしました');
    if(!dlg.open)dlg.showModal()}
  function sheet(k){mode='sheet';const [t,src,d]=SHEETS[k];$('#lbT').textContent=t;
    main.innerHTML=`<div class="img sheetimg"><img src="${src}" alt="${t}"></div><div class="lbside"><h4>${t}</h4><p class="act">${d}</p></div>`;if(!dlg.open)dlg.showModal()}
  dlg.addEventListener('close',()=>{if(/^#cut-/.test(location.hash))try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}});
  $('#lbX').onclick=()=>dlg.close();$('#lbPrev').onclick=()=>mode==='cut'&&cut(idx-1);$('#lbNext').onclick=()=>mode==='cut'&&cut(idx+1);
  dlg.addEventListener('click',e=>{if(e.target===dlg||e.target.classList.contains('lbin'))dlg.close()});
  dlg.addEventListener('keydown',e=>{if(mode!=='cut')return;if(e.key==='ArrowRight')cut(idx+1);if(e.key==='ArrowLeft')cut(idx-1)});
  let sx=null;main.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});main.addEventListener('touchend',e=>{if(sx==null||mode!=='cut')return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>60)cut(idx+(dx<0?1:-1));sx=null});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-sheet]');if(b&&!b.closest('.sheet'))sheet(b.dataset.sheet)});
  return {cut,sheet};
})();

/* ---------- 3D ---------- */
$('#s3start').onclick=async()=>{$('#s3start').textContent='読み込み中…';try{const m=await import('./stage3d.js?v=4');m.init();$('#s3boot').remove()}catch(e){console.error(e);$('#s3boot').innerHTML='<p>3Dの読み込みに失敗しました。通信環境を確認して再読み込みしてください。</p>'}};

/* ---------- ISSUES ---------- */
(function issues(){
  const I=[
  ['ok','反映済み（10/05）','新規3カット','01-05（幼いシオンの手話の「ありがとう」・2案から左上を採用）、10-08（資材置き場で追いつく）、10-09（その夜「危ないことは、やめて」）。全114カットに絵が揃い、要修正0。',null,null],
  ['ok','確定（10/05夕）','10〜11のつながりを整理','10：目覚め → その夜「私もドロだから」 → 屋根（板を割る）→ サッカー → 青年 → 内緒の手話を読まれる → 板を取りに一人で資材置き場へ → 桔響がバイクで追う → その夜「危ないことは、やめて」「おやすみ」→ 11：給電席へ行ったと思って缶詰を食べる桔響 → バレる。01に幼いシオンの手話の「ありがとう」を足し、手話が読めることを先に見せる。',null,null],
  ['ok','反映済み（10/05）','ガジェット・小物をシーンに入れた（9カット）','10-07（バイク・4案から右上を採用。10/05夕の並べ替えで10-06から番号変更）、03-01・03-04（ユタニ ミャオ）、10-03・10-02・11-01・11-03・11-05・14-01（ねねさんの生活小物、14-01の地図に隠れ猫）。全114カットに絵が揃い、要修正0。',null,null],
  ['ok','反映済み（10/03夜）','16〜18の新規11カット','アカネが気づく、微笑むホログラムと傭兵、「無駄だ」から扉を壊すまでの7カット、涙を拭う、上を向いて叫ぶ、を差し替え。全114カットに絵が揃い、要修正0。',null,null],
  ['ok','確定（10/03夕）','16〜18：奪還から最期まで','手話の「おかえり」で二人が目覚める → ホログラムが微笑み傭兵 → 「行くぞ！」 → 館内放送「無駄だ」で二人が直立で止まる → 桔響が厚い隔壁の向こうへ投げ込む（衝撃と、隔壁で途切れる信号で正気に）→ 銃声だけ → 倒れてくる桔響をシオンが受け止め、アカネが扉を閉めて壊す → アカネが声を返す → 最期の会話。最後の「おかえり」だけ手話。',null,null],
  ['ok','反映済み（10/03夕）','髪を切る順番の変更に伴う4カット','12-02（鏡の前で髪を切る・両腕とも生身）、12-03・12-04（切ったばかりの顎の長さの黒髪）、13-05（寝床で起き上がり、ひとりで声にならず泣く）を差し替え。',null,null],
  ['ok','確定（10/03夕）','髪を切るのは倒壊危険区域の前','「今日も見つからなかった」夜に自分で切り、決意のまま危険区域へ（ねねさん・Nokosuさんの案と同じ「無力な自分との決別」「絶対に見つける」）。13-05は説明の台詞なし、声にならない息と涙だけ。',null,null],
  ['ok','反映済み（10/03夜）','v3.1の画像がすべて揃った','13の喉が赤く光る2カット、14「2年後」の4カット、10の青年、18の喉が緑に光るカット、07-04の接続口（首の左）を差し替え。通信係の青年の設定画も追加。（10/03夕の16〜18の組み直し前の時点で）全カットに絵が揃った。',null,null],
  ['ok','確定（10/03夜）','終盤の銃撃の見せ方','桔響（17）は撃たれる姿を映さず銃声だけ。シオン（20〜21）は銃を持つが警備ドロには撃たず、銃床と銃身で格闘する（20-06を新設）。撃つのはブチギレて油谷のホログラムに向けた一度だけで、弾は素通りし誰も傷つかない。説明はしない。わかる人にはわかる、桔響の「壊さずに救う」。',null,null],
  ['info','進行中','手話の監修','月が手話の動画などで調べる。動きは月自身の手話を撮影してリファレンスにし、動画化する。手元のアップは避け、手の動きと表情で伝え、意味は字幕で補う。',null,null],
  ['ok','決定（10/05）','「ドロ」はアンドロイドの略称','02-01のナレーションを「人型アンドロイド、略してドロ」に。オフィシャルガイドの用語説明も同じ。',null,null],
  ['ok','決定（10/05）','キャラクター名','沙羅→桔響（ききょう）、キラ→アカネ、ユタニ（人物）→油谷。名字は裏設定：桔響とアカネは「橘」（父がアカネを直して住民登録し、物置を部屋としてあてがった）、シオンは「油谷」（育ての親は謎）。台詞は下の名前で呼び、油谷だけ名字。会社名はカタカナの「ユタニ」（エイリアンへの小さなオマージュ）。',null,null],
  ['ok','反映済み（10/06）','新規2カット','14-05（医療室・義手の接続部と「あと少しだけ」・2案から右を採用）、18-04（涙のまま笑うアカネの答え・2案から左を採用）。全116カットに絵が揃い、要修正0。アニマティックMP4も作り直し。',null,null],
  ['ok','決定（10/06）','シオンの名前','少年の名前をシオンに（ねねさんの案）。花の紫苑から、花言葉は「君を忘れない」「追憶」。桔響の桔梗と同じ紫の秋の花。名字は油谷（裏設定）。',null,null],
  ['ok','決定（10/06）','撃たれる理由（Nokosuさんの案）','14-05で義手の接続で体がもたないと告げられ「あと少しだけ」。18で「ドロだったらよかったのにね」とこぼし、シオンは押し殺した声で「何言ってんだよ……」、アカネが「人間の桔響だから、あったかかった。桔響に、会えてよかった」と答える。シオンはそのあと何も言わず、二人の日々を思い巡らせて泣く。',null,null],
  ['warn','未定','通信係の青年の名前','14の通信係の青年の名前。',null,null],
  ['ok','延長（10/05）','応募締切は2026年11月30日','公式ビジュアルが「DEADLINE 2026.11.30」に。10月末予定から約1か月延長。締切の時刻、提出方法、審査・授賞式の日程は公式ページで確認する。',null,null],
  ['ok','決定（10/04）','チーム名 N3Co（ねこさん）','3人とも猫好き。「3＝さん」で、ねこさん。ロゴはNokosu案。応募のことは、作品がある程度できたところで公開する。',null,null],
  ['ok','採用（10/05）','突入を「不気味に静か」に','油谷には想定内。会社は無人のような違和感、武装兵もやや弱く、どこか誘導されている。悪い人ではないのに、バカにされているような気になる。→ 20-05（警備は数体だけ）、20-06（妙に弱く、道を空けて退く）、20-07（灯りだけの無人のロビー）、21-01（「よく来たね」と穏やかに迎える）に反映。',null,null],
  ['ok','採用（10/05）','油谷がAIで管理しようとした理由','家族が飲酒運転に巻き込まれた等。サボり・ルール無視・謝らない人間への怒りから、自社製品に一斉起動の仕組みを入れた。油谷を非難しきれない深みが出る。→ 21-02で油谷自身が語る（家族を飲酒運転の男に奪われ、男は謝らなかった）。家族を失った男の「家族にならないか」になる。',null,null],
  ['ok','採用（10/05）','アカネのバイクで「ちょっとかります！」','シオンの話になって、桔響がアカネのバイクで飛び出していくギャップの場面。→ 10-07。シオンが割った分の板を取りに、一人で巡回ドロが出る資材置き場へ行ったと聞き、桔響がアカネのバイクで飛び出す（アカネ「ちょっ、私のバイク！」）→ 10-08 資材置き場で追いつく → 10-09 その夜「危ないことは、やめて」。この日はすぐ追いつけるが、11の朝は追いつけない。',null,null],
  ['info','一部採用（10/05）','ユタニ ミャオ Mark II と隠れ猫','猫型お掃除ロボットをバレエ練習のフロアや校庭に。小物や背景に隠れ猫を入れ、作中で「何個見つけたら願いが叶う」噂にする案。→ ユタニ ミャオは03-01のバレエ教室と03-04のグラウンドに登場（絵も反映済み）。隠れ猫は台詞にせず、画面の中だけの遊びとして入れる（噂を台詞にするかは検討中）。',null,null],
  ['ok','反映（10/05）','テーマ曲の歌詞変更版','2番Bメロ「指をほどいて」→「指を握って」（シオンが握り返す）。ギターを下げて歌と分離。リバーブの深い版（サビが広がる）と、包まれる感じの版の2つ。月から届いた版でMVを作り直し（3:56）。',null,null],
  ['ok','確定（10/03午後）','第3幕の因果を一本化','義手のためにユタニの医療回線へつなぐ → その回線からアカネの奥の命令が起動 → アカネが眠る桔響の声を止めて去る → 2年後、青年のハックした監視カメラにシオンとアカネが映る → 西棟へ。偶然に頼る展開（シオンの記憶、台帳）を削除。',null,null],
  ['ok','確定','喉が光るのは2回だけ','13でアカネが声を止める時は赤、18でアカネが声を返す時は緑。それ以外は首元に何も描かない。',null,null],
  ['ok','確定','アカネの制御状態の目','ユタニに意識を持っていかれている時は、シオンと同じ淡い青の制御の輪。',null,null],
  ['ok','確定','Jシリーズ（一緒に成長するドロ）','シオン＝初期型J1000（人より少し早く育つ）、アカネ＝後継の奉仕型J3200。接続口は首の左。',null,null]];
  const lv={ng:['#e5533d'],warn:['#e8a94f'],info:['#8fe6ff'],ok:['#8fd6a3']};
  $('#issues').innerHTML=I.map(([k,l,h,p,a,b])=>`<div class="issue"><span class="lv" style="color:${lv[k][0]};border:1px solid ${lv[k][0]}66">${l}</span><div><h4>${esc(h)}</h4><p>${esc(p)}</p>${a?`<div class="vs"><div><b>${esc(a[0])}</b>${esc(a[1])}</div><div><b>${esc(b[0])}</b>${esc(b[1])}</div></div>`:''}</div></div>`).join('');
})();

/* ---------- PLANNER ---------- */
(function planner(){
  const LIMIT=1200,TARGET=1028;
  const counts=SC.map(s=>CUTS.filter(c=>c.scene===s.id).length);
  const tot=counts.reduce((a,b)=>a+b,0);
  const def=SC.map(s=>s.sec);
  let v=store.get('ea-plan6',null);if(!v||v.length!==SC.length)v=def.slice();
  const box=$('#planner');
  box.innerHTML=SC.map((s,i)=>`<div class="row"><span class="n">${s.id}</span><div><div class="t">${esc(s.title)} <span class="sub">・${counts[i]}カット</span></div><div class="bar"><i id="pb${i}" style="background:${ACTC[s.act]}"></i></div></div><label class="sr" for="pi${i}">${s.id}の秒数</label><input id="pi${i}" type="number" inputmode="numeric" min="0" step="5" value="${v[i]}" aria-label="${s.id} ${esc(s.title)} の秒数"></div>`).join('');
  function upd(){const sum=v.reduce((a,b)=>a+(+b||0),0),mx=Math.max(...v,1);v.forEach((x,i)=>$('#pb'+i).style.width=(x/mx*100)+'%');
    const over=sum>LIMIT,rest=LIMIT-sum,col=over?'#e5533d':(rest<30?'#e8a94f':'#8fd6a3');
    const acts=[1,2,3].map(a=>SC.reduce((s,x,i)=>s+(x.act===a?+v[i]||0:0),0));
    $('#ptotal').innerHTML=`<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:baseline"><span class="big" style="color:${col}">${fmt(sum)}</span><span class="sub">上限 20:00 まで <b style="color:${col}">${over?'超過 '+fmt(-rest):'残り '+fmt(rest)}</b></span></div>
      <div class="meter"><i style="width:${Math.min(100,sum/LIMIT*100)}%;background:${col}"></i></div>
      <div class="sub" style="margin-top:6px">ACT1 ${fmt(acts[0])}（${Math.round(acts[0]/sum*100)||0}%）・ACT2 ${fmt(acts[1])}（${Math.round(acts[1]/sum*100)||0}%）・ACT3 ${fmt(acts[2])}（${Math.round(acts[2]/sum*100)||0}%）</div>`;
    store.set('ea-plan6',v)}
  box.addEventListener('input',e=>{if(e.target.matches('input')){v[+e.target.id.slice(2)]=Math.max(0,+e.target.value||0);upd()}});
  $('#pReset').onclick=()=>{v=def.slice();$$('input',box).forEach((x,i)=>x.value=v[i]);upd();toast('初期値に戻しました')};
  $('#pCsv').onclick=()=>download('EARTH_AFTER_尺表.csv',['シーン,タイトル,幕,カット数,秒数,分秒'].concat(SC.map((s,i)=>[s.id,s.title,s.act,counts[i],v[i],fmt(v[i])].map(csvq).join(','))).concat([csvq('合計')+',,,'+tot+','+v.reduce((a,b)=>a+b,0)+','+csvq(fmt(v.reduce((a,b)=>a+b,0)))]).join('\n'));
  upd();
})();

/* ---------- COLOR SCRIPT ---------- */
(function cs(){
  const PLAN={'20':[['#0c1116',.3],['#2c3a4a',.3],['#6b7f93',.2],['#e8742f',.1],['#f0d9b0',.1]],'21':[['#0b1215',.35],['#2c4550',.25],['#79a9b8',.2],['#d8f6ff',.15],['#ffffff',.05]],'22':[['#6c7d56',.2],['#a9b98f',.25],['#e9c6cf',.3],['#f6dde4',.25]]};
  $('#cscript').innerHTML=SC.map(s=>{const p=EA.palette[s.id],plan=!p,arr=p||PLAN[s.id]||[['#3a3631',.5],['#5c554d',.3],['#8a8177',.2]];return `<div class="c${plan?' plan':''}" title="${s.id} ${esc(s.title)}${plan?'（予定色）':''}">${arr.map(([c,w])=>`<i style="background:${c};--w:${Math.max(w,.04)}"></i>`).join('')}<b>${s.id}</b></div>`}).join('');
})();

/* ---------- RULES ---------- */
(function rules(){
  const R=[['do','シオンは警備ドロに銃を撃たない。銃は格闘の道具（銃床・銃身）。撃つのは21のホログラムへの一度だけ'],['do','桔響は黒髪。22歳までは長いストレート、23歳、倒壊危険区域へ向かう前に自分で切り、以降は顎の長さ（髪色は変えない）'],['do','シオンは全年代で金髪（J1000）'],['do','身長：桔響154cm／アカネ160cm／シオン170cm'],['do','ドロの接続口は首の左（耳の下）。EARTH AFTER以前は人工皮膚の下で見えず、戦後は露出'],['do','桔響の喉が光るのは2回だけ：13（アカネが止める・赤）、18（アカネが返す・緑）'],['do','ユタニに意識を持っていかれたドロ（アカネ含む）の目は、淡い青の制御の輪'],['do','アカネとシオンは人間擬態型。関節線や機構を露出させず、機械性は精度・速度・瞳の制御光で示す'],['do','23歳以降の桔響は左腕のみ機械。右手は生身'],['dont','22歳までの桔響に義手を描く'],['do','シオン（18歳相当）とアカネ（17歳相当）は戦後も外見年齢が変わらない'],['dont','桔響とシオンの恋人表現、キス、同衾を描く'],['dont','桔響の幽霊・人格コピー・転生としての子供を描く'],['dont','最後にアカネを呼ぶ男性とシオンの姿を映す'],['dont','桔響の死亡場面・遺体安置場面に両親を出す'],['do','油谷は遠隔ホログラム。撃たれても血を出さずグリッチで崩れる'],['do','桔響の戦闘は殺すためではなく、射線を逸らし、駆動部を止め、退路を開くため'],['dont','流血や臓器を過度に描写する（衣服に滲む血まで）'],['do','21の突撃後、シオンの生死は映さない。白い閃光で切る'],['do','最終カットは「バン！」と同時に完全な暗転'],['dont','1987年版『ロボットカーニバル』の固有名・意匠を生成指示に入れる']];
  $('#rules').innerHTML=R.map(([k,t])=>`<div class="rule ${k}"><span class="mk">${k==='do'?'○':'✕'}</span><span>${esc(t)}</span></div>`).join('');
})();

/* ---------- PROMPT & CSV ---------- */
$('#promptBase').textContent=EA.promptHeader;
$('#copyBase').onclick=()=>copy(EA.promptHeader,'共通プロンプトをコピーしました');
$('#shotCsv').onclick=()=>download('EARTH_AFTER_ショットリスト.csv',['カット,シート,シーン,シーン名,生成状態,秒数,開始,カメラ,動作・演出,心理,台詞'].concat(CUTS.map(c=>[c.id,c.sheet,c.scene,sceneById[c.scene].title,c.img?(c.fix?'生成済み・要修正':'生成済み'):'未生成',c.sec,fmt(c.t0),c.cam,c.act,c.psy,(c.lines||[]).map(l=>l[0]+'「'+l[1]+'」').join(' / ')].map(csvq).join(','))).join('\n'));

/* ---------- COUNTDOWN ---------- */
(function cd(){const D=new Date('2026-11-30T23:59:00+09:00').getTime();
  function tick(){const d=D-Date.now();if(d<0){$('#count').innerHTML='<div><strong>—</strong><small>仮置きの締切を過ぎました</small></div>';$('#heroDays').textContent='締切：公式で確認';return}
    const s=Math.floor(d/1000);$('#cd').textContent=Math.floor(s/86400);$('#ch').textContent=String(Math.floor(s%86400/3600)).padStart(2,'0');$('#cm').textContent=String(Math.floor(s%3600/60)).padStart(2,'0');$('#cs').textContent=String(s%60).padStart(2,'0');$('#heroDays').textContent=`締切まで あと${Math.floor(s/86400)}日（仮）`}
  tick();setInterval(tick,1000)})();

/* ---------- CHECKLIST ---------- */
(function chk(){
  const C={'脚本':[['脚本v3.1（22シーン・116カット）を確定',1],['約16分（計画17:08）で台詞・モンタージュ尺を実測'],['アカネの存在感を各幕で維持'],['手話の見せ方と監修の方針を決める',1],['キャラクター名の決定（仮名から）',1]],
  '絵コンテ':[['新規9カットを生成',1],['10-07（バイク）と03-01（ユタニ ミャオ）の画像',1],['01-05・10-08・10-09の画像',1],['髪を切る順番の変更に伴う4カットの修正',1],['通信係の青年の設定画',1],['新設定に合わせた修正56カットを差し替え',1],['16:9・1シート4コマで統一'],['桔響／シオン／アカネのキャラクター連続性を最優先']],
  '映像':[['年代差：幼少期→12→13→17→21→23→25歳→3年後'],['シオンとアカネは外見年齢が変わらない'],['桔響の義手は23歳から・左腕のみ／23歳から顎の長さの黒髪'],['EARTH AFTER配信時の「瞳の制御光」を象徴ショットに'],['19の白い布。両親は映さない'],['22の男の声の主・シオンは映さない'],['喉が光るのは13（赤）と18（緑）の2回だけ',1],['手話のカットは手元のアップを避け、手の動きと表情で',1]],
  '音':[['桔響の人工喉頭の声を過度なロボ声にしない'],['交換部品不足のノイズを伏線化'],['13で声が消える（息だけ）'],['14の端末の文字は字幕で見せる（画面に文字を描かない）',1],['17のマシンガンは音だけ（撃たれる桔響は映さない）',1],['18、アカネが返した声で最期の会話。最後の「おかえり」だけ手話',1],['「バン！」と同時に完全暗転'],['手話の台詞は字幕の書体を分ける',1]],
  '権利':[['キャラ・背景・ロゴはオリジナル'],['既存IPの固有名・意匠を生成指示へ入れない'],['音楽・SE・フォント・AI生成サービスの利用条件を記録'],['1987年版ロボットカーニバルの素材を使用しない（生成AIへの入力も禁止）']],
  '提出':[['20分以下（公式の尺条件も確認）'],['書き出し映像を全編再生確認'],['字幕・音量・黒レベル・フレーム落ち確認'],['サムネイル'],['あらすじ'],['アピールポイント'],['AI使用ツール／制作工程の記録'],['最新規約の確認'],['締切日時の確認']]};
  let st=store.get('ea-checks4',{});const box=$('#checks');let total=0;
  box.innerHTML=Object.entries(C).map(([g,it])=>`<div class="card"><h3>${g}</h3>${it.map(([t,n])=>{total++;const id=g+'|'+t;return `<label><input type="checkbox" data-id="${esc(id)}" ${st[id]?'checked':''}><span>${esc(t)}${n?'<span class="new">NEW</span>':''}</span></label>`}).join('')}</div>`).join('');
  function upd(){const n=$$('input:checked',box).length;$('#done').textContent=n;$('#total').textContent=total;const p=Math.round(n/total*100);$('#pct').textContent=p;$('#pbar').style.width=p+'%'}
  box.addEventListener('change',e=>{if(e.target.matches('input')){st[e.target.dataset.id]=e.target.checked;store.set('ea-checks4',st);upd()}});
  $('#chkReset').onclick=()=>{st={};store.set('ea-checks4',st);$$('input',box).forEach(i=>i.checked=false);upd();toast('リセットしました')};upd();
})();

$('#stGen').textContent=CUTS.filter(c=>c.img).length;
observeReveal();
/* ---------- deep link: #cut-10-06 で絵コンテを開く（サイト内検索から） ---------- */
(function(){function fromHash(){const m=location.hash.match(/^#cut-(\d\d-\d\d)$/);if(!m)return;const i=CUTS.findIndex(c=>c.id===m[1]);if(i>=0)LB.cut(i)}
addEventListener('hashchange',fromHash);if(document.readyState==='complete')fromHash();else addEventListener('load',fromHash)})();
})();
