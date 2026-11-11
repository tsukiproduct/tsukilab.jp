/* N3Co 制作室 — 新しいページ共通の部品（状態のしるし・項目の並び・締切の文字盤・確認表） */
(function(){
'use strict';
var S=document.currentScript,ROOT=S.src.replace(/assets\/ea-core\.js.*$/,'');
var LABEL={k:'確定',h:'引き継ぎ候補',t:'提案',a:'仮定',m:'未決定',o:'旧版',pub:'公式'};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function chip(st,text){return '<span class="st st-'+st+'">'+esc(text||LABEL[st])+'</span>'}
function link(l){return l?' <a href="'+ROOT+l[0]+'">'+esc(l[1])+'</a>':''}
function ent(it,st){
  var body=it.q||it.t;
  return '<li class="ent is-'+st+'" id="'+esc(it.id||'')+'"><div class="hd">'+chip(st)+(it.id?'<span class="id">'+esc(it.id)+'</span>':'')+(it.due?'<span class="due">'+esc(it.due)+'までに</span>':'')+'</div>'+
    '<p class="t">'+esc(body)+'</p>'+
    (it.why?'<p class="n">'+esc(it.why)+'</p>':'')+
    (it.n?'<p class="n">'+esc(it.n)+link(it.link)+'</p>':(it.link?'<p class="n">'+link(it.link)+'</p>':''))+
    (it.opts?'<ul class="opts">'+it.opts.map(function(o){return '<li>'+esc(o)+'</li>'}).join('')+'</ul>':'')+
    (it.src||it.when||it.who?'<p class="src">'+(it.src?'出典：'+esc(it.src):it.when?'提案の時期：'+esc(it.when):esc(it.who))+'</p>':'')+'</li>';
}
function ents(el,arr,st){if(typeof el==='string')el=document.querySelector(el);if(el)el.innerHTML=arr.map(function(it){return ent(it,st)}).join('')}
function fmt(sec){sec=Math.round(sec);var neg=sec<0;sec=Math.abs(sec);return (neg?'−':'')+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}
function jdate(iso){var p=iso.split('-');return (+p[1])+'/'+(+p[2])}
function today(){ /* 日本時間の今日（YYYY-MM-DD） */
  var d=new Date(Date.now()+9*3600e3);return d.toISOString().slice(0,10)}
function toast(msg){var t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=msg;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('on')},1800)}
var store={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* 締切の文字盤：十二時の位置が締切。針は、作り直しを始めた日から締切までを二百四十度で進む */
function dial(el,N){
  if(typeof el==='string')el=document.querySelector(el);if(!el)return;
  var t0=new Date(N.start).getTime(),t1=new Date(N.deadline).getTime(),now=Date.now();
  var p=Math.min(1,Math.max(0,(now-t0)/(t1-t0))),A0=-240;
  function pt(deg,r){var a=(deg-90)*Math.PI/180;return [(100+r*Math.cos(a)).toFixed(2),(100+r*Math.sin(a)).toFixed(2)]}
  function arc(a,b,r){var s=pt(a,r),e=pt(b,r),large=(b-a)>180?1:0;return 'M'+s[0]+' '+s[1]+'A'+r+' '+r+' 0 '+large+' 1 '+e[0]+' '+e[1]}
  var ticks='';for(var i=0;i<60;i++){var m=i%5===0,a=pt(i*6,m?86:88),b=pt(i*6,92);ticks+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+(m?'#8f8a80':'#515a65')+'" stroke-width="'+(m?1.4:.8)+'"/>'}
  var marks='';N.schedule.filter(function(s){return s.key}).forEach(function(s){
    var q=(new Date(s.d+'T12:00:00+09:00').getTime()-t0)/(t1-t0);q=Math.min(1,Math.max(0,q));var c=pt(A0+240*q,74);
    marks+='<circle cx="'+c[0]+'" cy="'+c[1]+'" r="4.2" fill="'+(q<=p?'#f0c987':'#1f2429')+'" stroke="#f0c987" stroke-width="1.6"><title>'+jdate(s.d)+' '+esc(s.t)+'</title></circle>'});
  var hand=pt(A0+240*p,74),ms=Math.max(0,t1-now),days=Math.floor(ms/864e5),hours=Math.floor(ms%864e5/36e5);
  el.innerHTML='<svg viewBox="0 0 200 200" role="img" aria-label="締切まであと'+days+'日と'+hours+'時間">'+
    '<circle cx="100" cy="100" r="96" fill="#252b31" stroke="#3c444d"/>'+ticks+
    '<path d="'+arc(A0,0,74)+'" fill="none" stroke="#3c444d" stroke-width="5" stroke-linecap="round"/>'+
    (p>0?'<path d="'+arc(A0,A0+240*p,74)+'" fill="none" stroke="#f0c987" stroke-width="5" stroke-linecap="round"/>':'')+marks+
    '<circle cx="'+hand[0]+'" cy="'+hand[1]+'" r="7" fill="#f0c987" stroke="#252b31" stroke-width="3"><title>今日</title></circle>'+
    '<text x="100" y="24" text-anchor="middle" font-size="9.5" fill="#f0c987" font-weight="700">締切</text>'+
    '<text x="100" y="88" text-anchor="middle" font-size="11" fill="#b9b3a7">締切まで</text>'+
    '<text x="100" y="120" text-anchor="middle" font-size="27" fill="#ece7dc" font-weight="700" font-family="Zen Old Mincho,serif">あと'+days+'日</text>'+
    (days<3?'<text x="100" y="140" text-anchor="middle" font-size="11" fill="#b9b3a7">と'+hours+'時間</text>':'')+
    '</svg>';
}

/* 確認表：チェックをこの端末に保存する */
function checklist(root,key){
  if(typeof root==='string')root=document.querySelector(root);if(!root)return;
  var st=store.get(key,{}),boxes=[].slice.call(root.querySelectorAll('input[type=checkbox]'));
  var out=document.querySelector('[data-chk-out="'+key+'"]'),bar=document.querySelector('[data-chk-bar="'+key+'"]');
  function upd(){var n=boxes.filter(function(b){return b.checked}).length;if(out)out.textContent=n+' ／ '+boxes.length;if(bar)bar.style.width=(boxes.length?n/boxes.length*100:0)+'%'}
  boxes.forEach(function(b,i){var id=b.dataset.id||('c'+i);b.checked=!!st[id];b.addEventListener('change',function(){st[id]=b.checked;store.set(key,st);upd()})});
  var rs=document.querySelector('[data-chk-reset="'+key+'"]');if(rs)rs.onclick=function(){st={};store.set(key,st);boxes.forEach(function(b){b.checked=false});upd();toast('確認表を空にしました')};
  upd();
}
function copy(text,msg){function ok(){toast(msg||'写しました')}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(ok,fb);else fb();
  function fb(){var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){}ta.remove()}}
function download(name,text,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+text],{type:type||'text/csv'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
window.N3UI={ROOT:ROOT,esc:esc,chip:chip,ent:ent,ents:ents,fmt:fmt,jdate:jdate,today:today,toast:toast,store:store,dial:dial,checklist:checklist,copy:copy,download:download,LABEL:LABEL};
})();
