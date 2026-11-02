/* EARTH AFTER — shared site navigation
   ページ切替バー / 追従目次（PC：右レール、スマホ：目次ボタン＋シート）/ 読了バー /
   ⌘K・/ で全ページ横断ジャンプ / [ ] で前後のセクションへ / 前後のページ */
(function(){
'use strict';
var S=document.currentScript;
var ROOT=S.src.replace(/assets\/ea-nav\.js.*$/,'');
var VER='4';
var HERO=S.hasAttribute('data-hero');
var PAGES=[
 {k:'guide',p:'',t:'制作ガイド',en:'PRODUCTION',c:'#e8a94f',d:'アニマティック・MV・絵コンテ・3D舞台・制作ツール',img:'img/bg3/10.webp'},
 {k:'world',p:'world/',t:'世界観',en:'WORLD',c:'#f4c6d2',d:'結末までのストーリー・相関図・プロフィール・舞台・小道具',img:'img/bg3/01.webp'},
 {k:'script',p:'script/',t:'脚本',en:'SCRIPT',c:'#ecc96f',d:'全シーンの行動・台詞・カメラ・生成プロンプト',img:'img/bg3/05.webp'},
 {k:'design',p:'design/',t:'デザイン',en:'DESIGN',c:'#86a6d3',d:'設定画・衣装・作画固定事項',img:'design/img/height-lineup-s.webp'},
 {k:'gadgets',p:'gadgets/',t:'ガジェット',en:'GADGETS',c:'#8fe6ff',d:'ユタニ ミャオ・バイク・生活小物・隠れ猫',img:'gadgets/img/kira-bike-scene-s.webp'},
 {k:'review',p:'review/',t:'審査',en:'REVIEW',c:'#a9c98a',d:'審査シミュレーション（ドット絵レポート）',img:'img/bg3/22.webp'}
];
var de=document.documentElement,doc=document;
var rootPath=new URL(ROOT,location.href).pathname;
var here=location.pathname.slice(rootPath.length).replace(/index\.html$/,'');
var CUR=PAGES.filter(function(p){return p.p===here})[0]||PAGES[0];
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
function h(tag,attrs,html){var e=doc.createElement(tag);if(attrs)for(var k in attrs){if(k==='class')e.className=attrs[k];else e.setAttribute(k,attrs[k])}if(html!=null)e.innerHTML=html;return e}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function url(u){return ROOT+u}
var ICON_SEARCH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
var isMac=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent);

de.classList.add('ea-on');if(HERO)de.classList.add('ea-hero');
de.style.setProperty('--c',CUR.c);

/* ---------- top bar ---------- */
var bar=h('header',{'class':'ea-bar',role:'banner'});
bar.innerHTML='<a class="ea-brand" href="'+url('')+'" aria-label="EARTH AFTER 制作ガイドのトップへ"><span class="ea-mark" aria-hidden="true"><i></i><i></i></span><span class="ea-word">EARTH AFTER</span></a>'+
 '<nav class="ea-tabs" aria-label="ページ">'+PAGES.map(function(p){return '<a class="ea-tab" href="'+url(p.p)+'" style="--c:'+p.c+'"'+(p===CUR?' aria-current="page"':'')+'><small>'+p.en+'</small>'+p.t+'</a>'}).join('')+'</nav>'+
 '<button class="ea-find" type="button" aria-label="サイト内を検索してジャンプ（'+(isMac?'⌘':'Ctrl+')+'K）">'+ICON_SEARCH+'<span class="ea-l">検索・ジャンプ</span><span class="ea-kbd">'+(isMac?'⌘K':'Ctrl K')+'</span></button>'+
 '<div class="ea-prog" aria-hidden="true"></div>';
doc.body.insertBefore(bar,doc.body.firstChild);
var prog=bar.querySelector('.ea-prog');
bar.querySelector('.ea-find').addEventListener('click',function(){openPal()});
var curTab=bar.querySelector('[aria-current]');if(curTab&&curTab.scrollIntoView)setTimeout(function(){var t=bar.querySelector('.ea-tabs');t.scrollLeft=Math.max(0,curTab.offsetLeft-t.clientWidth/2+curTab.clientWidth/2)},0);

/* ---------- sections ---------- */
var secs=[];
function labelOf(el){
  if(el.dataset.eaLabel)return el.dataset.eaLabel;
  var hh=el.querySelector('h2');var t=hh?hh.textContent.replace(/\s+/g,' ').trim():'';
  return t.length>20?t.slice(0,19)+'…':t;
}
function collect(){
  var list=[].slice.call(doc.querySelectorAll('[data-ea-toc]'));
  if(!list.length)list=[].slice.call(doc.querySelectorAll('section[id],article[id]')).filter(function(el){
    var p=el.parentElement&&el.parentElement.closest('section[id],article[id]');
    return !p&&(el.dataset.eaLabel||el.querySelector('h2'))&&el.offsetParent!==null&&!el.closest('dialog')});
  secs=list.map(function(el){return{el:el,id:el.id,label:labelOf(el),group:el.dataset.eaGroup||''}}).filter(function(s){return s.label});
}
collect();

/* rail */
var rail=h('nav',{'class':'ea-rail','aria-label':'このページの目次'});
function buildRail(){
  var g='',html='';
  secs.forEach(function(s,i){
    if(s.group&&s.group!==g){g=s.group;html+='<span class="ea-act">'+esc(g)+'</span>'}
    html+='<a href="#'+s.id+'" data-i="'+i+'"><span class="ea-rl">'+esc(s.label)+'</span><i></i></a>';
  });
  rail.innerHTML=html;rail.hidden=secs.length<3;
  var room=innerHeight-140, need=secs.length+(g?4:0);
  rail.style.setProperty('--rh',Math.max(14,Math.min(26,Math.floor(room/Math.max(need,1))))+'px');
}
buildRail();doc.body.appendChild(rail);
rail.addEventListener('click',function(e){var a=e.target.closest('a');if(!a)return;e.preventDefault();go(secs[+a.dataset.i].el)});

/* mobile fab + sheet */
var fab=h('button',{'class':'ea-fab',type:'button','aria-label':'このページの目次を開く'});
fab.innerHTML='<span class="ea-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="#ffffff22" stroke-width="3"/><circle class="ea-rc" cx="18" cy="18" r="15" fill="none" stroke="'+CUR.c+'" stroke-width="3" stroke-linecap="round" stroke-dasharray="94.25" stroke-dashoffset="94.25"/></svg><b>0</b></span><span class="ea-cur"><small>目次</small><span class="ea-cl"></span></span><span class="ea-up" role="button" aria-label="ページの先頭へ">↑</span>';
doc.body.appendChild(fab);
var scrim=h('div',{'class':'ea-scrim'}),sheet=h('div',{'class':'ea-sheet',role:'dialog','aria-modal':'true','aria-label':'目次とページ'});
doc.body.appendChild(scrim);doc.body.appendChild(sheet);
fab.addEventListener('click',function(e){if(e.target.closest('.ea-up')){e.stopPropagation();scrollTo({top:0,behavior:RM?'auto':'smooth'});return}openSheet()});
scrim.addEventListener('click',closeSheet);
function openSheet(){
  var g='',items='';
  secs.forEach(function(s,i){
    if(s.group&&s.group!==g){g=s.group;items+='<li class="ea-acth">'+esc(g)+'</li>'}
    items+='<li><a href="#'+s.id+'" data-i="'+i+'"'+(i===active?' class="on"':'')+'><span class="n">'+String(i+1).padStart(2,'0')+'</span>'+esc(s.label)+'</a></li>'});
  sheet.innerHTML='<div class="ea-grab"></div><header><h2><small>'+CUR.en+'</small>'+esc(CUR.t)+'</h2><button class="ea-x" type="button" aria-label="閉じる">✕</button></header><div class="ea-body">'+
   '<button class="ea-sfind" type="button">'+ICON_SEARCH+'シーン・カット・台詞を検索</button>'+
   (secs.length?'<h3>このページ</h3><ol>'+items+'</ol>':'')+
   '<h3>ほかのページ</h3><div class="ea-pages">'+PAGES.map(function(p){return '<a href="'+url(p.p)+'" style="--c:'+p.c+'"'+(p===CUR?' aria-current="page"':'')+'><small>'+p.en+'</small>'+p.t+'<span>'+esc(p.d)+'</span></a>'}).join('')+'</div></div>';
  de.classList.add('ea-sheet-open');
  sheet.querySelector('.ea-x').onclick=closeSheet;
  sheet.querySelector('.ea-sfind').onclick=function(){closeSheet();openPal()};
  sheet.querySelectorAll('ol a').forEach(function(a){a.onclick=function(e){e.preventDefault();closeSheet();go(secs[+a.dataset.i].el)}});
  var on=sheet.querySelector('ol a.on');if(on)setTimeout(function(){on.scrollIntoView({block:'center'})},30);
  setTimeout(function(){sheet.querySelector('.ea-x').focus()},50);
}
function closeSheet(){de.classList.remove('ea-sheet-open');}

/* scroll state */
var active=-1,ticking=false,rc=fab.querySelector('.ea-rc'),rb=fab.querySelector('.ea-ring b'),cl=fab.querySelector('.ea-cl');
function update(){
  ticking=false;
  var y=scrollY,vh=innerHeight,max=Math.max(1,doc.documentElement.scrollHeight-vh),p=Math.min(1,Math.max(0,y/max));
  prog.style.setProperty('--p',p);
  rc.setAttribute('stroke-dashoffset',(94.25*(1-p)).toFixed(2));rb.textContent=Math.round(p*100);
  de.classList.toggle('ea-attop',y<40);de.classList.toggle('ea-scrolled',y>240);
  var a=-1;for(var i=0;i<secs.length;i++){if(secs[i].el.getBoundingClientRect().top<vh*.34)a=i;else break}
  if(a!==active){active=a;
    [].forEach.call(rail.querySelectorAll('a'),function(el,i){el.classList.toggle('on',i===a);if(i===a)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current')});
    cl.textContent=a>=0?secs[a].label:(CUR.t);
  }
}
function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(update)}}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',function(){buildRail();active=-2;onScroll()});
update();

function flash(el){if(!el)return;el.classList.remove('ea-flash');void el.offsetWidth;el.classList.add('ea-flash');setTimeout(function(){el.classList.remove('ea-flash')},1700)}
function go(el,noFlash){
  if(!el)return;
  el.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
  if(el.id)try{history.replaceState(null,'','#'+el.id)}catch(e){}
  if(!noFlash)flash(el.querySelector('h2,h3')||el);
}

/* keyboard: [ ] でセクション移動 */
function typing(e){var t=e.target;return t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))}
addEventListener('keydown',function(e){
  if((e.metaKey||e.ctrlKey)&&!e.altKey&&(e.key==='k'||e.key==='K')){e.preventDefault();de.classList.contains('ea-pal-open')?closePal():openPal();return}
  if(e.key==='Escape'){if(de.classList.contains('ea-pal-open')){e.preventDefault();closePal()}else if(de.classList.contains('ea-sheet-open'))closeSheet();return}
  if(typing(e)||e.metaKey||e.ctrlKey||e.altKey||doc.querySelector('dialog[open]')||de.classList.contains('ea-pal-open'))return;
  if(e.key==='/'){e.preventDefault();openPal();return}
  if(e.key===']'||e.key==='['){if(!secs.length)return;e.preventDefault();
    var i=e.key===']'?Math.min(secs.length-1,active+1):Math.max(0,active-(secs[Math.max(active,0)].el.getBoundingClientRect().top<-20?0:1));go(secs[i].el)}
});

/* ---------- command palette ---------- */
var pal=null,inp,res,flt,filter='all',hits=[],sel=0,loaded=false,ITEMS=[];
var KIND={page:{g:'ページ',w:60,ic:'P'},sec:{g:'セクション',w:40,ic:'§'},char:{g:'人物',w:35,ic:'人'},item:{g:'設定・項目',w:8,ic:'・'},scene:{g:'シーン',w:28,ic:'#'},cut:{g:'カット',w:16,ic:'▣'}};
var ORDER=['page','sec','char','scene','cut','item'];
var FLT=[['all','すべて'],['nav','ページ・目次',['page','sec']],['scene','シーン',['scene']],['cut','カット',['cut']],['set','人物・設定',['char','item']]];
var LIM={page:6,sec:12,char:6,scene:12,item:10,cut:40};
function hira(s){return s.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-96)}).replace(/\s+/g,'')}
function loadIndex(cb){
  if(loaded)return cb();
  if(window.EA_INDEX){prep();return cb()}
  var sc=doc.createElement('script');sc.src=url('assets/ea-index.js?v='+VER);sc.onload=function(){prep();cb()};sc.onerror=function(){prep();cb()};doc.head.appendChild(sc);
}
function prep(){
  loaded=true;
  var base=PAGES.map(function(p){return{k:'page',t:p.t+'　'+p.en,s:p.d,u:p.p,c:p.c}});
  var idx=(window.EA_INDEX&&window.EA_INDEX.items)||[];
  ITEMS=base.concat(idx).map(function(it){it.h=hira(it.t);it.hs=hira(it.s||'');it.hx=hira(it.x||'');return it});
}
function search(q){
  var qq=hira(q),toks=q.trim().split(/\s+/).map(hira).filter(Boolean);
  var idm=q.trim().match(/^(\d{1,2})(?:[-‐ー－\s]?(\d{1,2}))?$/);
  var idq=idm?(idm[2]?pad(idm[1])+'-'+pad(idm[2]):pad(idm[1])):null;
  var out=[];
  ITEMS.forEach(function(it){
    var sc=0;
    if(idq){var tid=it.t.split(' ')[0];if(tid===idq)sc+=500;else if(it.k==='cut'&&idq.length===2&&tid.slice(0,2)===idq)sc+=200}
    if(toks.length){
      var ok=true;
      for(var i=0;i<toks.length;i++){var t=toks[i],s=0;
        var ti=it.h.indexOf(t);if(ti===0)s=150;else if(ti>0)s=100;else if(it.hs.indexOf(t)>=0)s=30;else if(it.k!=='sec'&&it.k!=='page'&&it.hx.indexOf(t)>=0)s=10;
        if(!s){ok=false;break}sc+=s}
      if(!ok&&!(idq&&sc>=200))return;
    }
    if(!sc)return;
    out.push({it:it,sc:sc+KIND[it.k].w});
  });
  out.sort(function(a,b){return b.sc-a.sc});
  return out.map(function(o){o.it._sc=o.sc;return o.it});
}
function pad(n){return String(n).padStart(2,'0')}
function soft(s){return String(s).toLowerCase().replace(/[ァ-ヶ]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-96)})}
function snippet(it,q){
  var toks=q.trim().split(/\s+/).filter(Boolean);if(!toks.length||!it.x)return '';
  var t=soft(toks[0]);if(soft(it.t).indexOf(t)>=0)return '';
  var x=it.x,i=soft(x).indexOf(t);if(i<0)return '';
  var a=Math.max(0,i-18),b=Math.min(x.length,i+t.length+40);
  return (a>0?'…':'')+mark(x.slice(a,b),toks)+(b<x.length?'…':'');
}
function mark(s,toks){
  var ss=soft(s),on=new Array(s.length+1).join('0').split('');
  toks.forEach(function(t){t=soft(t);if(!t)return;var i=0;while((i=ss.indexOf(t,i))>=0){for(var j=i;j<i+t.length;j++)on[j]='1';i+=t.length}});
  var o='',m=false;for(var k=0;k<s.length;k++){var f=on[k]==='1';if(f&&!m)o+='<mark>';if(!f&&m)o+='</mark>';m=f;o+=esc(s[k])}
  return o+(m?'</mark>':'');
}
function buildPal(){
  pal=h('div',{'class':'ea-pal',role:'dialog','aria-modal':'true','aria-label':'サイト内検索とジャンプ'});
  pal.innerHTML='<div class="ea-bd"></div><div class="ea-box"><label class="ea-in">'+ICON_SEARCH+'<input type="text" autocomplete="off" spellcheck="false" placeholder="ページ・シーン・カット・台詞を検索（例：おかえり／10-06／ミャオ）" aria-label="検索" role="combobox" aria-expanded="true" aria-controls="ea-res"><span class="ea-kbd" title="閉じる">Esc</span></label>'+
   '<div class="ea-flt" role="toolbar" aria-label="絞り込み"></div><div class="ea-res" id="ea-res" role="listbox"></div>'+
   '<div class="ea-foot"><span><span class="ea-kbd">↑↓</span>選択</span><span><span class="ea-kbd">Enter</span>移動</span><span><span class="ea-kbd">Tab</span>絞り込み</span><span><span class="ea-kbd">/</span>どこでも検索</span><span><span class="ea-kbd">[</span><span class="ea-kbd">]</span>前後のセクション</span></div></div>';
  doc.body.appendChild(pal);
  inp=pal.querySelector('input');res=pal.querySelector('.ea-res');flt=pal.querySelector('.ea-flt');
  pal.querySelector('.ea-bd').onclick=closePal;pal.querySelector('.ea-in .ea-kbd').onclick=closePal;
  inp.addEventListener('input',function(){sel=0;render()});
  inp.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();move(1)}else if(e.key==='ArrowUp'){e.preventDefault();move(-1)}
    else if(e.key==='Enter'){e.preventDefault();if(hits[sel])pick(hits[sel],e.metaKey||e.ctrlKey)}
    else if(e.key==='Tab'){e.preventDefault();var i=FLT.map(function(f){return f[0]}).indexOf(filter);filter=FLT[(i+(e.shiftKey?FLT.length-1:1))%FLT.length][0];sel=0;render()}
  });
  flt.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;filter=b.dataset.f;sel=0;render();inp.focus()});
  res.addEventListener('mousemove',function(e){var a=e.target.closest('.ea-it');if(a&&+a.dataset.i!==sel){sel=+a.dataset.i;hl(false)}});
  res.addEventListener('click',function(e){var a=e.target.closest('.ea-it');if(!a)return;e.preventDefault();pick(hits[+a.dataset.i],e.metaKey||e.ctrlKey)});
}
function openPal(){
  if(doc.querySelector('dialog[open]'))return;
  closeSheet();if(!pal)buildPal();
  de.classList.add('ea-pal-open');inp.value='';filter='all';sel=0;
  res.innerHTML='<div class="ea-empty">読み込み中…</div>';
  setTimeout(function(){inp.focus()},20);
  loadIndex(render);
}
function closePal(){de.classList.remove('ea-pal-open')}
function move(d){if(!hits.length)return;sel=(sel+d+hits.length)%hits.length;hl(true)}
function hl(scroll){[].forEach.call(res.querySelectorAll('.ea-it'),function(a){var on=+a.dataset.i===sel;a.classList.toggle('on',on);a.setAttribute('aria-selected',on);if(on&&scroll)a.scrollIntoView({block:'nearest'})})}
function render(){
  if(!loaded)return;
  var q=inp.value,list;
  if(!q.trim()){
    var own=secs.map(function(s){return{k:'sec',t:s.label,s:CUR.t+(s.group?' · '+s.group:''),u:CUR.p+'#'+s.id,own:1}});
    list=ITEMS.filter(function(it){return it.k==='page'}).concat(own);
  }else list=search(q);
  var counts={};list.forEach(function(it){counts[it.k]=(counts[it.k]||0)+1});
  flt.innerHTML=FLT.map(function(f){var n=f[2]?f[2].reduce(function(a,k){return a+(counts[k]||0)},0):list.length;return '<button type="button" data-f="'+f[0]+'" aria-pressed="'+(filter===f[0])+'">'+f[1]+(q.trim()?'<b>'+n+'</b>':'')+'</button>'}).join('');
  var allow=FLT.filter(function(f){return f[0]===filter})[0][2];
  if(allow)list=list.filter(function(it){return allow.indexOf(it.k)>=0});
  var by={};list.forEach(function(it){(by[it.k]=by[it.k]||[]).push(it)});
  hits=[];var html='';
  var groups=['page','sec'];if(q.trim()){groups=ORDER.slice();var top=list[0];if(top&&top._sc>=500){groups.splice(groups.indexOf(top.k),1);groups.unshift(top.k)}}
  groups.forEach(function(k){var arr=by[k];if(!arr)return;arr=arr.slice(0,allow?120:LIM[k]);
    var gname=(!q.trim()&&k==='sec')?'このページの目次 — '+CUR.t:KIND[k].g;
    html+='<div class="ea-grp">'+gname+'</div>';
    arr.forEach(function(it){var i=hits.length;hits.push(it);
      var pg=PAGES.filter(function(p){return it.u.split('#')[0]===p.p})[0];
      var c=it.c||(pg&&pg.c)||'';
      var ic=it.i?'<img class="ea-ic" src="'+url(it.i)+'" alt="" loading="lazy">':'<span class="ea-ic" style="--c:'+c+'">'+(it.k==='scene'?esc(it.t.slice(0,2)):KIND[it.k].ic)+'</span>';
      var sn=q.trim()?snippet(it,q):'';
      html+='<a class="ea-it" role="option" data-i="'+i+'" href="'+url(it.u)+'">'+ic+'<span class="ea-tx"><span class="ea-t">'+(q.trim()?mark(it.t,q.trim().split(/\s+/)):esc(it.t))+'</span><span class="ea-s">'+esc(it.s||'')+(it.k==='cut'?' · 絵コンテを開く':it.k==='scene'?' · 脚本':'')+'</span>'+(sn?'<span class="ea-sn">'+sn+'</span>':'')+'</span><span class="ea-go">↵</span></a>';
    })});
  res.innerHTML=html||'<div class="ea-empty">「'+esc(q)+'」に一致するものはありません。<br>カット番号（例：10-06）や台詞の一部でも探せます。</div>';
  if(sel>=hits.length)sel=0;hl(true);res.scrollTop=0;
}
function pick(it,newTab){
  var u=url(it.u),U=new URL(u,location.href);
  if(newTab){open(U.href,'_blank');return}
  closePal();
  if(U.pathname.replace(/index\.html$/,'')===location.pathname.replace(/index\.html$/,'')){
    var hash=U.hash;
    if(/^#cut-/.test(hash)){if(location.hash===hash)dispatchEvent(new HashChangeEvent('hashchange'));else location.hash=hash;return}
    var el=hash&&doc.getElementById(decodeURIComponent(hash.slice(1)));
    if(el)go(el);else scrollTo({top:0,behavior:RM?'auto':'smooth'});
  }else location.href=U.href;
}

/* ---------- prev / next page ---------- */
if(!doc.body.hasAttribute('data-ea-nonext')){
  var i=PAGES.indexOf(CUR),pv=PAGES[i-1],nx=PAGES[i+1];
  var box=h('nav',{'class':'ea-next','aria-label':'前後のページ'});
  function card(p,lab,cls){return '<a class="'+cls+'" href="'+url(p.p)+'" style="--c:'+p.c+';--img:url('+url(p.img)+')"><small>'+lab+' · '+p.en+'</small><b>'+p.t+'</b><span>'+esc(p.d)+'</span></a>'}
  box.innerHTML=(pv?card(pv,'← 前のページ',''):'')+(nx?card(nx,'次のページ →','nx'):'');
  var fs=doc.querySelectorAll('footer'),foot=fs[fs.length-1];
  if(foot)foot.parentNode.insertBefore(box,foot);else doc.body.appendChild(box);
}

/* hash on load → flash */
if(location.hash&&!/^#cut-/.test(location.hash)){var t0=doc.getElementById(decodeURIComponent(location.hash.slice(1)));if(t0)setTimeout(function(){flash(t0.matches('section,article')?(t0.querySelector('h2,h3')||t0):t0)},400)}

window.EANav={refresh:function(){collect();buildRail();active=-2;update()},open:openPal,go:go};
})();
