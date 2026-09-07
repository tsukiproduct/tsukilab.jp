'use strict';
const $ = s => document.querySelector(s);
const labels = {all:'すべて',mv:'MV',film:'短編映画',anime:'アニメ',novel:'小説PV',music:'音楽'};
const reducedPreference = matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reducedPreference.matches, manualMotion = false, sound = false, audioContext;
const seen = new Set();
const draw = PlayCore.createDrawMachine(WORKS);
let phaseTimer = 0, spinAgainTimer = 0, currentGenre = 'all';
const cinema = $('#cinema');
let returnFocus = null, modalSource = 'archive';
const safePlayURL = id => 'https://www.youtube.com/watch?v='+id;
const feedback = $('#drag-feedback');
function tone(freq=350, duration=.075, offset=0, type='sine') {
  if (!sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(()=>{});
    const osc=audioContext.createOscillator(), gain=audioContext.createGain(), t=audioContext.currentTime+offset;
    osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(60,freq*.75),t+duration);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.035,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect()};
  } catch { sound=false; $('#sound-toggle').setAttribute('aria-pressed','false');$('#sound-toggle').textContent='効果音 OFF'; }
}
$('#sound-toggle').addEventListener('click',()=>{sound=!sound;$('#sound-toggle').setAttribute('aria-pressed',String(sound));$('#sound-toggle').textContent='効果音 '+(sound?'ON':'OFF');if(sound)tone(580,.12)});
function applyMotion(){
  document.body.classList.toggle('motion-off',!motion);
  $('#motion-toggle').setAttribute('aria-pressed',String(motion));$('#motion-toggle').textContent='動き '+(motion?'ON':'OFF');
  if(!motion){document.documentElement.style.setProperty('--scroll-bend','0deg');document.documentElement.style.setProperty('--scroll-stretch','1');}
}
$('#motion-toggle').addEventListener('click',()=>{manualMotion=true;motion=!motion;applyMotion();if(!motion)resetLetters();wake()});
reducedPreference.addEventListener('change',e=>{if(!manualMotion){motion=!e.matches;applyMotion();if(!motion)resetLetters();wake()}});
applyMotion();

/* Elastic typography: pointer capture, keyboard impulses, damped spring return. */
const letterNodes=[...document.querySelectorAll('.letter')];
const letterStates=letterNodes.map(el=>({el,x:0,y:0,vx:0,vy:0,dragging:false,pointer:null,baseX:0,baseY:0,startX:0,startY:0}));
const tetherLines=[...document.querySelectorAll('.tethers line')];
const zone=$('.elastic-zone');
let frame=0,lastFrame=0,lastScroll=scrollY,scrollImpulse=0,bend=0;
function resetLetters(){letterStates.forEach((s,i)=>{if(s.pointer!==null&&s.el.hasPointerCapture(s.pointer))s.el.releasePointerCapture(s.pointer);Object.assign(s,{x:0,y:0,vx:0,vy:0,dragging:false,pointer:null});s.el.style.transform='';tetherLines[i].style.opacity=0})}
function measureAnchors(){const r=zone.getBoundingClientRect();letterStates.forEach(s=>{const b=s.el.getBoundingClientRect();s.baseX=b.left-r.left+b.width/2-s.x;s.baseY=b.top-r.top+b.height/2-s.y})}
function wake(){if(!frame){lastFrame=performance.now();frame=requestAnimationFrame(animate)}}
function animate(now){
  const dt=Math.min((now-lastFrame)/1000,.032)||.016;lastFrame=now;frame=0;let active=false;
  letterStates.forEach((s,i)=>{
    if(!s.dragging){if(motion){[s.x,s.vx]=PlayCore.spring(s.x,s.vx,dt);[s.y,s.vy]=PlayCore.spring(s.y,s.vy,dt)}else{s.x=s.y=s.vx=s.vy=0}}
    if(Math.abs(s.x)+Math.abs(s.y)+Math.abs(s.vx)+Math.abs(s.vy)>.02||s.dragging)active=true;
    const stretch=motion?Math.min(.07,Math.hypot(s.x,s.y)*.0004):0;
    s.el.style.transform=`translate(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px) rotate(${motion?s.x*.065:0}deg) scale(${1+stretch},${1-stretch*.4})`;
    const l=tetherLines[i];l.setAttribute('x1',s.baseX);l.setAttribute('y1',s.baseY);l.setAttribute('x2',s.baseX+s.x);l.setAttribute('y2',s.baseY+s.y);l.style.opacity=Math.min(.55,Math.hypot(s.x,s.y)/100);
  });
  bend+=(scrollImpulse-bend)*.14;scrollImpulse*=.78;
  if(Math.abs(bend)<.003&&Math.abs(scrollImpulse)<.003){bend=0;scrollImpulse=0}else active=true;
  document.documentElement.style.setProperty('--scroll-bend',(motion?bend:0).toFixed(3)+'deg');
  document.documentElement.style.setProperty('--scroll-stretch',(motion?1+Math.abs(bend)*.018:1).toFixed(4));
  if(active&&!document.hidden)frame=requestAnimationFrame(animate);
}
letterStates.forEach((s,i)=>{
  s.el.addEventListener('pointerdown',e=>{
    if(e.button!==0||s.pointer!==null)return;measureAnchors();s.pointer=e.pointerId;s.dragging=true;s.startX=e.clientX-s.x;s.startY=e.clientY-s.y;s.vx=s.vy=0;s.el.setPointerCapture(e.pointerId);wake();
  });
  s.el.addEventListener('pointermove',e=>{if(s.pointer!==e.pointerId)return;const bound=Math.min(125,innerWidth*.24);s.x=Math.max(-bound,Math.min(bound,e.clientX-s.startX));s.y=Math.max(-110,Math.min(110,e.clientY-s.startY));wake()});
  function release(e){if(s.pointer!==e.pointerId)return;const distance=Math.hypot(s.x,s.y);s.dragging=false;s.pointer=null;if(s.el.hasPointerCapture(e.pointerId))s.el.releasePointerCapture(e.pointerId);if(e.type!=='pointercancel'){if(distance<5){s.vy=-550;s.vx=(i-1)*180}tone(260+i*100,.11);feedback.textContent=['いい伸び。','真ん中も、のびる。','猫、のびました。'][i];if(motion)letterStates.forEach((n,j)=>{if(j!==i&&!n.dragging)n.vy-=Math.min(250,distance*1.6)})}wake()}
  s.el.addEventListener('pointerup',release);s.el.addEventListener('pointercancel',release);s.el.addEventListener('lostpointercapture',e=>{if(s.pointer===e.pointerId){s.dragging=false;s.pointer=null;wake()}});
  s.el.addEventListener('keydown',e=>{const impulse={ArrowLeft:[-650,0],ArrowRight:[650,0],ArrowUp:[0,-650],ArrowDown:[0,650],' ':[0,-600],Enter:[0,-600]}[e.key];if(!impulse)return;e.preventDefault();measureAnchors();s.vx+=impulse[0];s.vy+=impulse[1];tone(320+i*100,.09);wake()});
});
window.addEventListener('resize',()=>{resetLetters();measureAnchors();wake()},{passive:true});
document.fonts?.ready.then(()=>{measureAnchors();wake()});
window.addEventListener('scroll',()=>{const current=scrollY,delta=current-lastScroll;lastScroll=current;if(!motion)return;scrollImpulse=Math.max(-3.2,Math.min(3.2,delta*.035));$('#ribbon-text').style.setProperty('--ribbon-x',(-current*.16%800)+'px');wake()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0}else{lastScroll=scrollY;wake()}});
measureAnchors();

/* Archive: real links remain available for new tabs / no-JS fallbacks. */
Object.entries(labels).forEach(([key,label])=>{const b=document.createElement('button');b.textContent=label;b.dataset.genre=key;b.setAttribute('aria-pressed',String(key==='all'));b.addEventListener('click',()=>{tone(300,.035);render(key)});$('#filters').append(b)});
function setupImage(img){img.addEventListener('error',()=>{img.hidden=true},{once:true})}
function render(genre){
  currentGenre=genre;document.querySelectorAll('[data-genre]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.genre===genre)));
  const list=WORKS.filter(w=>genre==='all'||w.genre===genre);$('#result-count').textContent=String(list.length).padStart(2,'0')+' FILMS';
  const grid=$('#gallery');grid.replaceChildren();
  list.forEach(w=>{
    const index=WORKS.indexOf(w)+1;const a=document.createElement('a');a.className='work'+(seen.has(w.id)?' seen':'');a.href=safePlayURL(w.id);a.dataset.id=w.id;a.setAttribute('aria-haspopup','dialog');a.setAttribute('aria-label',w.title+' を上映する');
    const picture=document.createElement('div');picture.className='picture';
    const fallback=document.createElement('span');fallback.className='picture-fallback';fallback.textContent=w.title;fallback.setAttribute('aria-hidden','true');
    const img=document.createElement('img');img.src='https://i.ytimg.com/vi/'+w.id+'/hqdefault.jpg';img.alt=w.title+' のサムネイル';img.width=480;img.height=360;img.loading='lazy';img.decoding='async';setupImage(img);
    const watch=document.createElement('span');watch.className='watch';watch.textContent='PLAY ↗';picture.append(fallback,img,watch);
    const text=document.createElement('div');text.className='work-text';
    const meta=document.createElement('div');meta.className='work-meta';const category=document.createElement('span');category.textContent=labels[w.genre];const year=document.createElement('span');year.textContent=w.year;meta.append(category,year);
    const title=document.createElement('h3');title.textContent=w.title;const sub=document.createElement('p');sub.textContent=w.sub;text.append(meta,title,sub);
    const foot=document.createElement('div');foot.className='work-foot';const serial=document.createElement('span');serial.textContent='TSUKIMAO / '+String(index).padStart(3,'0');const badge=document.createElement('b');badge.textContent=seen.has(w.id)?'OPENED ✓':'↗';foot.append(serial,badge);a.append(picture,text,foot);
    a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();openFilm(w,a,'archive')});grid.append(a);
  });
}
render('all');

/* Gacha: one guarded sequence; capsule opening is an explicit action. */
function setPhase(next){if(!draw.advance(next))return false;$('#gacha').dataset.state=next;return true}
function afterPhase(callback,milliseconds){clearTimeout(phaseTimer);phaseTimer=setTimeout(()=>{phaseTimer=0;callback()},motion?milliseconds:40)}
function resetGacha(){if(!draw.reset())return;$('#gacha').dataset.state='idle';$('#capsule').hidden=true;$('#capsule').disabled=true;$('#spin').disabled=false;$('#crank').disabled=false;$('#crank').style.setProperty('--crank-angle','0deg');$('#spin').innerHTML='ガチャをまわす <span>↻</span>';$('#gacha-status').textContent='もうひとつ、知らない作品に会いに。'}
function spin(){
  clearTimeout(spinAgainTimer);if(!draw.start())return;
  $('#gacha').dataset.state='spinning';$('#spin').disabled=true;$('#crank').disabled=true;$('#capsule').hidden=true;$('#capsule').disabled=true;
  $('#spin').textContent='まわしています…';$('#gacha-status').textContent='ガチャ、ガチャ。なにが出るかな。';
  for(let i=0;i<6;i++)tone(160+i*55,.045,i*.1,'triangle');
  afterPhase(()=>{
    if(!setPhase('dropping'))return;$('#capsule').hidden=false;$('#gacha-status').textContent='ころん。作品が出てきました。';tone(190,.16);
    afterPhase(()=>{if(!setPhase('ready'))return;$('#capsule').disabled=false;$('#spin').disabled=false;$('#spin').innerHTML='カプセルをひらく <span>＋</span>';$('#gacha-status').textContent='カプセルをクリックして、ひらいてみて。';},850);
  },850);
}
function openCapsule(){
  if(!setPhase('opening'))return;$('#capsule').disabled=true;$('#spin').disabled=true;$('#spin').textContent='ひらいています…';$('#gacha-status').textContent='ぱかっ。今日の一本は…';tone(620,.12);tone(940,.16,.1);
  afterPhase(()=>{if(!setPhase('screening'))return;$('#draw-count').textContent=String(draw.discovered).padStart(2,'0')+' / '+WORKS.length+' DISCOVERED';openFilm(draw.selected,$('#spin'),'gacha')},570);
}
$('#spin').addEventListener('click',()=>{if(draw.state==='ready')openCapsule();else spin()});
$('#capsule').addEventListener('click',openCapsule);

/* Dragging the mechanical handle accumulates rotation, or click to turn. */
let crankPointer=null,crankLast=0,crankRotation=0,crankMoved=false,crankSuppressedUntil=0,crankCenter=null;
const crank=$('#crank');
crank.addEventListener('pointerdown',e=>{if(e.button!==0||draw.state!=='idle'||crankPointer!==null)return;const r=crank.getBoundingClientRect();crankCenter={x:r.left+r.width/2,y:r.top+r.height/2};crankPointer=e.pointerId;crankLast=Math.atan2(e.clientY-crankCenter.y,e.clientX-crankCenter.x)*180/Math.PI;crankRotation=0;crankMoved=false;crank.setPointerCapture(e.pointerId)});
crank.addEventListener('pointermove',e=>{if(crankPointer!==e.pointerId)return;const angle=Math.atan2(e.clientY-crankCenter.y,e.clientX-crankCenter.x)*180/Math.PI;const delta=PlayCore.angleDelta(angle,crankLast);crankLast=angle;crankRotation+=delta;if(Math.abs(crankRotation)>8)crankMoved=true;crank.style.setProperty('--crank-angle',crankRotation+'deg');if(Math.abs(crankRotation)>160){crankSuppressedUntil=performance.now()+500;crankPointer=null;crank.releasePointerCapture(e.pointerId);spin()}});
crank.addEventListener('pointerup',e=>{if(crankPointer!==e.pointerId)return;crankPointer=null;if(crank.hasPointerCapture(e.pointerId))crank.releasePointerCapture(e.pointerId);if(crankMoved){crankSuppressedUntil=performance.now()+500;if(Math.abs(crankRotation)>60)spin();else{crank.style.setProperty('--crank-angle','0deg');$('#gacha-status').textContent='もう少し、ぐるっと。クリックでも回せます。'}}});
crank.addEventListener('pointercancel',()=>{crankPointer=null;crank.style.setProperty('--crank-angle','0deg')});
crank.addEventListener('lostpointercapture',()=>{crankPointer=null});
crank.addEventListener('click',()=>{if(performance.now()>crankSuppressedUntil)spin()});

/* Native modal provides focus trapping, Escape and inert background. */
function openFilm(work,trigger,source){
  if(cinema.open)cinema.close();
  returnFocus=trigger;modalSource=source;seen.add(work.id);
  const card=document.querySelector('.work[data-id="'+work.id+'"]');if(card){card.classList.add('seen');card.querySelector('.work-foot b').textContent='OPENED ✓'}
  $('#cinema-label').textContent=source==='gacha'?'GACHA / YOUR RANDOM PICTURE':'TSUKIMAO / NOW SHOWING';
  $('#cinema-title').textContent=work.title;$('#cinema-sub').textContent=work.sub;$('#cinema-meta').textContent=labels[work.genre]+' / '+work.year+' / No.'+String(WORKS.indexOf(work)+1).padStart(3,'0');$('#youtube-link').href=safePlayURL(work.id);
  $('#work-inquiry').href='mailto:atg.tsukimao@gmail.com?subject='+encodeURIComponent('「'+work.title+'」のような映像制作のご相談')+'&body='+encodeURIComponent('月真猫さま\n\n「'+work.title+'」を見て、制作について相談したくご連絡しました。\n参考作品：'+safePlayURL(work.id)+'\n\n・お名前／会社名：\n・用途：\n・希望納期：\n・予算：\n\nよろしくお願いいたします。');
  const player=document.createElement('iframe');player.title=work.title+' — YouTube動画';player.src='https://www.youtube-nocookie.com/embed/'+work.id+'?autoplay=1&mute=1&playsinline=1&rel=0';player.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';player.allowFullscreen=true;player.referrerPolicy='strict-origin-when-cross-origin';$('#video-mount').replaceChildren(player);
  document.body.classList.add('modal-open');cinema.showModal();$('#close-cinema').focus({preventScroll:true});
}
$('#close-cinema').addEventListener('click',()=>cinema.close());
cinema.addEventListener('click',e=>{if(e.target===cinema){const r=cinema.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)cinema.close()}});
cinema.addEventListener('close',()=>{if(cinema.open)return;$('#video-mount').replaceChildren();document.body.classList.remove('modal-open');if(modalSource==='gacha')resetGacha();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true})});
$('#again').addEventListener('click',()=>{
  cinema.close();
  if(draw.state==='screening')resetGacha();
  $('#gacha').scrollIntoView({behavior:motion?'smooth':'instant',block:'center'});
  clearTimeout(spinAgainTimer);spinAgainTimer=setTimeout(()=>{spinAgainTimer=0;if(draw.state==='ready'){$('#capsule').focus({preventScroll:true});return}if(draw.state==='idle')spin()},motion?450:0);
});
$('#mail').href='mailto:atg.tsukimao@gmail.com?subject='+encodeURIComponent('映像制作のご相談')+'&body='+encodeURIComponent('月真猫さま\n\n制作について相談したく、ご連絡しました。\n\n・お名前／会社名：\n・つくりたいもの・用途：\n・尺：\n・希望納期：\n・予算：\n・参考作品：\n\nよろしくお願いいたします。');
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('atg.tsukimao@gmail.com');$('#copy-status').textContent='メールアドレスをコピーしました。'}catch{$('#copy-status').textContent='アドレスを選択してコピーしてください：atg.tsukimao@gmail.com'}});
