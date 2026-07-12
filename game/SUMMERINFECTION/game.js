import * as THREE from 'three';

const canvas=document.querySelector('#game');
const $=id=>document.querySelector(id);
const ui={hud:$('#hud'),curtain:$('#curtain'),eyebrow:$('#eyebrow'),title:$('#title'),subtitle:$('#subtitle'),start:$('#startButton'),hint:$('#hint'),stageNumber:$('#stageNumber'),stageName:$('#stageName'),timer:$('#timer'),hpBar:$('#hpBar'),level:$('#level'),kills:$('#kills'),bossMeter:$('#bossMeter'),bossBar:$('#bossBar'),message:$('#message'),pause:$('#pauseButton'),touch:$('#touchControls')};
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(640,360,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,16/9,.1,70);
const clock=new THREE.Clock();
const keys=new Set();
const fastMode=new URLSearchParams(location.search).has('fast');
const SURVIVE_SECONDS=fastMode?12:60;
const BOUNDS={x:8.2,z:5.1};
const C={black:0x111116,charcoal:0x25252a,red:0xb31f2b,darkRed:0x5e1018,skin:0xc99578,pale:0xb7aaa0,denim:0x242a33};
const materials=new Map();

function mat(color,emissive=0){const key=color+'-'+emissive;if(!materials.has(key))materials.set(key,new THREE.MeshLambertMaterial({color,emissive,flatShading:true}));return materials.get(key)}
function mesh(geometry,material,x=0,y=0,z=0){const value=new THREE.Mesh(geometry,material);value.position.set(x,y,z);return value}
function box(w,h,d,color,x=0,y=0,z=0,emissive=0){return mesh(new THREE.BoxGeometry(w,h,d),mat(color,emissive),x,y,z)}
function cylinder(rt,rb,h,color,x=0,y=0,z=0,segments=5){return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat(color),x,y,z)}

function labelMaterial(text,fg='#e9e6de',bg='#151517'){
  const c=document.createElement('canvas');c.width=256;c.height=64;
  const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle=bg;x.fillRect(0,0,256,64);
  x.strokeStyle='#77736d';x.lineWidth=3;x.strokeRect(3,3,250,58);
  x.fillStyle=fg;x.font='bold 31px monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,34);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;
  return new THREE.MeshBasicMaterial({map:texture});
}
function addLabel(parent,text,w,h,x,y,z,fg,bg){
  const sign=mesh(new THREE.PlaneGeometry(w,h),labelMaterial(text,fg,bg),x,y,z);parent.add(sign);return sign;
}
function limb(length,radius,color){
  const pivot=new THREE.Group();pivot.add(cylinder(radius*.78,radius,length,color,0,-length/2,0,5));return pivot;
}

function createCharacter(kind='player',variant=0){
  const root=new THREE.Group(),model=new THREE.Group();root.add(model);
  const player=kind==='player',boss=kind==='boss';
  const skin=boss?0xb89b8c:player?C.skin:[0x98917d,0x7e9187,0xafa392][variant%3];
  const top=player?C.red:boss?C.black:[0x54513e,0x354f4c,0x796957][variant%3];
  const trousers=player||boss?C.denim:0x34353a;
  const hips=box(.62,.32,.34,trousers,0,1.18,0);
  const torso=cylinder(.43,.58,.95,top,0,1.82,0,5);torso.rotation.y=Math.PI/5;
  const neck=cylinder(.16,.17,.25,skin,0,2.4,0,5);
  const head=mesh(new THREE.IcosahedronGeometry(.38,0),mat(skin),0,2.75,0);
  model.add(hips,torso,neck,head);
  const leftArm=limb(.82,.14,player||boss?skin:top),rightArm=limb(.82,.14,player||boss?skin:top);
  leftArm.position.set(-.53,2.16,0);rightArm.position.set(.53,2.16,0);leftArm.rotation.z=-.12;rightArm.rotation.z=.12;model.add(leftArm,rightArm);
  const leftLeg=limb(1.06,.18,trousers),rightLeg=limb(1.06,.18,trousers);
  leftLeg.position.set(-.23,1.15,0);rightLeg.position.set(.23,1.15,0);model.add(leftLeg,rightLeg);
  leftLeg.add(box(.25,.16,.48,0x111114,0,-1.03,.11));rightLeg.add(box(.25,.16,.48,0x111114,0,-1.03,.11));
  const hairColor=boss?0x0a0a0d:player?0x26090d:[0x29251f,0x454039,0x251f1c][variant%3];
  const hair=mesh(new THREE.IcosahedronGeometry(.405,1),mat(hairColor),0,2.84,-.03);hair.scale.set(1.05,1.05,.9);model.add(hair,box(.72,.16,.11,hairColor,0,2.94,.31));
  if(player){
    model.add(box(.14,.72,.08,C.red,-.46,1.78,.3),box(.14,.72,.08,C.red,.46,1.78,.3),box(.68,.12,.38,0x151519,0,1.18,0),box(.08,.5,.08,0xd11e2c,-.31,2.83,.34));
  }else if(boss){
    model.add(box(.84,.12,.43,0x651420,0,1.22,0),box(.75,.08,.08,0x9e1c29,0,1.28,.24),box(.07,.45,.07,0x8c1824,-.28,2.78,.34));
    model.add(box(.07,.045,.035,0xd6202e,-.12,2.76,.35,0x6b0000),box(.07,.045,.035,0xd6202e,.12,2.76,.35,0x6b0000),box(.09,.05,.025,0x66151b,.19,2.56,.34));
  }else{
    head.rotation.z=(variant-1)*.12;leftArm.rotation.x=-.55+variant*.12;rightArm.rotation.x=-.65-variant*.1;model.rotation.z=(variant-1)*.05;
  }
  root.userData.parts={model,leftArm,rightArm,leftLeg,rightLeg};root.scale.setScalar(boss?1.12:1);return root;
}
function animateCharacter(entity,time,moving=true){
  const p=entity.group.userData.parts;if(!p)return;
  const pace=entity.kind==='boss'?5:8,swing=moving?Math.sin(time*pace+entity.phase)*.48:0;
  p.leftLeg.rotation.x=swing;p.rightLeg.rotation.x=-swing;
  p.leftArm.rotation.x=-swing*.7+(entity.kind==='zombie'?-.7:0);p.rightArm.rotation.x=swing*.7+(entity.kind==='zombie'?-.7:0);
  p.model.position.y=moving?Math.abs(Math.sin(time*pace+entity.phase))*.055:0;
}

function baseWorld(floor){
  const w=new THREE.Group();w.add(box(18,.16,11.5,floor,0,-.1,0));
  w.add(box(18.6,.5,.25,0x0d0d0f,0,.15,-5.65),box(18.6,.5,.25,0x0d0d0f,0,.15,5.65),box(.25,.5,11.5,0x0d0d0f,-9.2,.15,0),box(.25,.5,11.5,0x0d0d0f,9.2,.15,0));
  return w;
}
function buildFestival(){
  const w=baseWorld(0x2b251e);w.add(box(7.3,.65,2.1,0x19191c,0,.32,-4.35),box(7.4,.18,2.2,0x5b171b,0,2.65,-5.1));
  addLabel(w,'SAMATEI',4.8,.95,0,2.7,-3.98,'#d9d2c5','#241014');
  for(let i=-3;i<=3;i++){w.add(cylinder(.05,.05,1.65,0x8d7b62,i*2.2,.82,-2.85),mesh(new THREE.OctahedronGeometry(.14,0),mat(i%2?0xbc3129:0xe48a35,0x3a1005),i*2.2,1.72,-2.85))}
  for(const x of[-7.3,6.8]){const s=new THREE.Group();s.add(box(2.2,1.5,1.6,0x6e1d1b,0,.75,0),box(2.45,.16,1.9,0xd8c49f,0,1.6,0));s.position.set(x,0,-1.7);w.add(s)}
  for(let z=-1;z<4.5;z+=1.2)for(const x of[-8.3,8.3])w.add(box(.12,.75,.12,0x77736d,x,.38,z));return w;
}
function buildStore(){
  const w=baseWorld(0x25282a);w.add(box(17.2,3.6,.45,0xb7c4b5,0,1.8,-5.15),box(17.3,.3,.5,0x264c45,0,2.85,-4.85),box(17.3,.22,.51,0xa91e2d,0,2.53,-4.84));
  addLabel(w,'24 HOUR STORE',4.3,.66,-3.8,3.28,-4.91,'#183b35','#d8e2d5');
  for(let x=-7.5;x<=6.2;x+=2.75)w.add(box(2.25,2,.12,0x8bb7a4,x,1.25,-4.86,0x10211b),box(.12,2.2,.3,0x22292a,x+1.22,1.25,-4.74));
  w.add(box(2.25,.12,7.5,0xb6b3a7,5.9,.04,.6),box(1.2,1.7,.75,0xa51726,-7.3,.85,3.8),box(.9,.55,.8,0x183957,7.2,.28,3.6));
  for(let z=-2.7;z<4;z+=1.15)w.add(box(2,.035,.08,0xe1ded0,5.9,.14,z));return w;
}
function buildLobby(){
  const w=baseWorld(0x555554);w.add(box(18,3.8,.45,0x44464a,0,1.9,-5.15),box(3.6,3.1,.18,0x25272a,0,1.55,-4.88),box(1.65,2.7,.14,0x727276,-.88,1.4,-4.75),box(1.65,2.7,.14,0x727276,.88,1.4,-4.75),box(.12,.08,.03,0xd33538,-.1,1.35,-4.63,0x550000));
  for(let y=.55;y<=2.5;y+=.48)for(let x=-7.6;x<-3.2;x+=.7)w.add(box(.56,.34,.12,0x7a776d,x,y,-4.86));
  w.add(box(3.1,.58,1.05,0x20272d,5.8,.29,-2.8),box(2.5,1.05,.5,0x30383e,6.1,.53,3.9));
  for(let x=-8;x<=8;x++)w.add(box(.025,.02,10.5,0x696969,x,.01,0));for(let z=-5;z<=5;z++)w.add(box(17,.02,.025,0x696969,0,.01,z));return w;
}
function buildRoom(){
  const w=baseWorld(0x594432);w.add(box(18,4.2,.35,0x8e877b,0,2.1,-5.22),box(.35,4.2,11,0x777168,-9,2.1,0));
  w.add(box(4.5,.7,3.1,0x263550,-5.65,.42,-.9),box(1.1,.55,3.05,0x8292af,-7.3,.86,-.9),box(3.6,.18,2.4,0x1d2a43,-5.2,.82,-.9));
  w.add(box(3.65,1.35,.16,0x29466c,-1.7,2.55,-5),box(.18,2.5,.15,0x7988a1,-3.62,2.25,-4.88),box(.18,2.5,.15,0x7988a1,.22,2.25,-4.88));
  w.add(box(3.2,1,1.05,0x5c4939,5.9,.5,-3.75),box(3.55,.12,1.25,0x80664c,5.9,1.08,-3.75),box(2.05,3.35,.16,0x5b4634,5.5,1.68,-5));
  for(let i=-3;i<=3;i++){const tape=box(2.55,.08,.04,0xb0ada3,5.5,1.2+i*.28,-4.88);tape.rotation.z=i%2?.16:-.12;w.add(tape)}
  addLabel(w,'SAMATEI',2.4,1.15,-6.8,2.55,-5,'#d9d3c7','#1a1717');
  w.add(box(.85,.75,.65,0xd2cec4,-5.5,1.35,-.8),mesh(new THREE.IcosahedronGeometry(.28,0),mat(0xd2cec4),-5.5,1.92,-.8),box(.12,.12,.04,0x111115,-5.65,1.93,-.5),box(.12,.12,.04,0x111115,-5.35,1.93,-.5));return w;
}

const stages=[
  {name:'SAMATEI FESTIVAL',subtitle:'1 MINUTE TO DAWN',fog:0x15100e,camera:[0,13.2,14.8],spawn:.78,build:buildFestival},
  {name:'CONVENIENCE STORE',subtitle:'THE LIGHTS ARE STILL ON',fog:0x0c1515,camera:[-1.5,12.5,15.5],spawn:.66,build:buildStore},
  {name:'APARTMENT ENTRANCE',subtitle:'SHE IS UPSTAIRS',fog:0x111117,camera:[1.4,12.8,14.2],spawn:.55,build:buildLobby},
  {name:'HER ROOM',subtitle:'DAY 7',fog:0x080a11,camera:[-.8,10.5,12.2],boss:true,build:buildRoom}
];
const state={mode:'title',paused:false,stageIndex:0,stageTime:0,transitionTime:0,level:1,kills:0,xp:0,spawnClock:0,attackClock:0,messageTime:0,player:null,enemies:[],shots:[],particles:[],boss:null,world:null};

function lights(index){
  scene.children.filter(v=>v.isLight).forEach(v=>scene.remove(v));
  const ambient=[0x8b735a,0x708d7d,0x777786,0x51617c];
  const hemi=new THREE.HemisphereLight(ambient[index],0x171419,1.55);
  const key=new THREE.DirectionalLight(index===3?0x8295c9:0xd6b38d,1.45);key.position.set(-5,10,7);scene.add(hemi,key);
}
function clearEntities(){
  for(const e of[...state.enemies,...state.shots,...state.particles])scene.remove(e.group);
  if(state.boss)scene.remove(state.boss.group);
  state.enemies=[];state.shots=[];state.particles=[];state.boss=null;
}
function resetPlayer(){
  if(state.player?.group)scene.remove(state.player.group);
  const group=createCharacter('player');scene.add(group);
  state.player={kind:'player',group,position:group.position,hp:100,maxHp:100,speed:4.8,inv:0,phase:0};
}
function loadStage(index){
  clearEntities();if(state.world)scene.remove(state.world);
  const stage=stages[index];state.world=stage.build();scene.add(state.world);
  scene.background=new THREE.Color(stage.fog);scene.fog=new THREE.Fog(stage.fog,15,30);lights(index);
  camera.position.fromArray(stage.camera);camera.lookAt(0,0,0);
  state.stageTime=0;state.spawnClock=.4;state.attackClock=0;
  state.player.position.set(0,0,2.5);state.player.hp=Math.min(state.player.maxHp,state.player.hp+24);
  if(stage.boss)spawnBoss();updateHud();
}
function spawnEnemy(){
  const side=Math.floor(Math.random()*4),p=new THREE.Vector3();
  if(side<2)p.set(side?BOUNDS.x:-BOUNDS.x,0,THREE.MathUtils.randFloat(-BOUNDS.z,BOUNDS.z));
  else p.set(THREE.MathUtils.randFloat(-BOUNDS.x,BOUNDS.x),0,side===2?-BOUNDS.z:BOUNDS.z);
  const variant=Math.floor(Math.random()*3),group=createCharacter('zombie',variant);group.position.copy(p);scene.add(group);
  state.enemies.push({kind:'zombie',group,position:group.position,hp:34+state.stageIndex*10,speed:1.15+Math.random()*.48+state.stageIndex*.1,phase:Math.random()*6,hit:0});
}
function spawnBoss(){
  const group=createCharacter('boss');group.position.set(0,0,-2.6);scene.add(group);
  state.boss={kind:'boss',group,position:group.position,hp:720,maxHp:720,speed:1.32,phase:2,hit:0};
}
function nearestTarget(){
  const targets=state.boss&&state.boss.hp>0?[state.boss,...state.enemies]:state.enemies;
  let nearest=null,best=Infinity;for(const target of targets){const d=state.player.position.distanceToSquared(target.position);if(d<best){best=d;nearest=target}}return nearest;
}
function shoot(){
  const target=nearestTarget();if(!target)return;
  const direction=target.position.clone().sub(state.player.position).setY(0).normalize();
  const shot=mesh(new THREE.OctahedronGeometry(.1,0),mat(0xffdf91,0x8a4a12));
  shot.position.copy(state.player.position).add(new THREE.Vector3(0,1.25,0)).addScaledVector(direction,.45);scene.add(shot);
  state.shots.push({kind:'shot',group:shot,position:shot.position,velocity:direction.multiplyScalar(9.5),life:1.35,damage:18+state.level*3});
  state.player.group.rotation.y=Math.atan2(direction.x,direction.z);
}
function burst(position,color=0xb9232e,count=5){
  for(let i=0;i<count;i++){const part=mesh(new THREE.TetrahedronGeometry(.045,0),mat(color));part.position.copy(position).add(new THREE.Vector3(0,1.2,0));scene.add(part);
    state.particles.push({group:part,velocity:new THREE.Vector3(THREE.MathUtils.randFloat(-1.3,1.3),THREE.MathUtils.randFloat(.4,1.7),THREE.MathUtils.randFloat(-1.3,1.3)),life:.55})}
}
function damagePlayer(amount){
  if(state.player.inv>0||state.mode!=='play')return;
  state.player.hp-=amount;state.player.inv=.75;burst(state.player.position,0x7d1720,4);if(state.player.hp<=0)gameOver();
}
function gainKill(){
  state.kills++;state.xp++;const needed=4+state.level*2;
  if(state.xp>=needed){state.xp=0;state.level++;state.player.maxHp+=7;state.player.hp=Math.min(state.player.maxHp,state.player.hp+20);showMessage('LEVEL '+state.level)}
}
function updatePlayer(dt,time){
  const x=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
  const z=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0),moving=x!==0||z!==0;
  if(moving){const d=new THREE.Vector3(x,0,z).normalize();state.player.position.addScaledVector(d,state.player.speed*dt);state.player.position.x=THREE.MathUtils.clamp(state.player.position.x,-BOUNDS.x,BOUNDS.x);state.player.position.z=THREE.MathUtils.clamp(state.player.position.z,-BOUNDS.z,BOUNDS.z);state.player.group.rotation.y=Math.atan2(d.x,d.z)}
  state.player.inv=Math.max(0,state.player.inv-dt);state.player.group.visible=state.player.inv<=0||Math.floor(state.player.inv*18)%2===0;animateCharacter(state.player,time,moving);
}
function updateEnemies(dt,time){
  const all=state.boss&&state.boss.hp>0?[...state.enemies,state.boss]:state.enemies;
  for(const enemy of all){
    const d=state.player.position.clone().sub(enemy.position).setY(0),distance=d.length();d.normalize();enemy.position.addScaledVector(d,enemy.speed*dt);enemy.group.rotation.y=Math.atan2(d.x,d.z);
    enemy.hit=Math.max(0,enemy.hit-dt);enemy.group.scale.setScalar((enemy.kind==='boss'?1.12:1)*(enemy.hit>0?1.08:1));animateCharacter(enemy,time,true);
    if(distance<(enemy.kind==='boss'?.95:.7))damagePlayer(enemy.kind==='boss'?17:9);
  }
}
function updateShots(dt){
  for(let i=state.shots.length-1;i>=0;i--){
    const shot=state.shots[i];shot.life-=dt;shot.position.addScaledVector(shot.velocity,dt);shot.group.rotation.y+=dt*12;let hit=null;
    if(state.boss&&state.boss.hp>0&&shot.position.distanceTo(state.boss.position.clone().setY(1.2))<.75)hit=state.boss;
    if(!hit)hit=state.enemies.find(e=>shot.position.distanceTo(e.position.clone().setY(1.1))<.52);
    if(hit){hit.hp-=shot.damage;hit.hit=.12;burst(hit.position,hit.kind==='boss'?0xa51d29:0x6e7560,4);
      if(hit.kind==='boss'&&hit.hp<=0)ending();
      if(hit.kind!=='boss'&&hit.hp<=0){scene.remove(hit.group);state.enemies.splice(state.enemies.indexOf(hit),1);gainKill()}
      shot.life=0;
    }
    if(shot.life<=0){scene.remove(shot.group);state.shots.splice(i,1)}
  }
}
function updateParticles(dt){
  for(let i=state.particles.length-1;i>=0;i--){const p=state.particles[i];p.life-=dt;p.velocity.y-=3.5*dt;p.group.position.addScaledVector(p.velocity,dt);p.group.scale.setScalar(Math.max(0,p.life*2));if(p.life<=0){scene.remove(p.group);state.particles.splice(i,1)}}
}
function updateGame(dt,time){
  if(state.mode==='transition'){state.transitionTime-=dt;if(state.transitionTime<=0){state.mode='play';ui.curtain.classList.add('hidden')}return}
  if(state.mode!=='play'||state.paused)return;
  state.stageTime+=dt;state.spawnClock-=dt;state.attackClock-=dt;
  updatePlayer(dt,time);updateEnemies(dt,time);updateShots(dt);updateParticles(dt);
  if(state.attackClock<=0){shoot();state.attackClock=Math.max(.18,.62-state.level*.035)}
  const stage=stages[state.stageIndex];
  if(!stage.boss){
    if(state.spawnClock<=0){spawnEnemy();if(state.stageTime>28&&Math.random()<.28)spawnEnemy();state.spawnClock=stage.spawn*Math.max(.45,1-state.stageTime/120)}
    if(state.stageTime>=SURVIVE_SECONDS)beginStage(state.stageIndex+1);
  }
  if(state.messageTime>0){state.messageTime-=dt;if(state.messageTime<=0)ui.message.classList.add('hidden')}
  updateHud();
}
function updateHud(){
  const stage=stages[state.stageIndex];ui.stageNumber.textContent='STAGE '+(state.stageIndex+1)+'/4';ui.stageName.textContent=stage.name;
  ui.timer.textContent=stage.boss?'--':String(Math.max(0,Math.ceil(SURVIVE_SECONDS-state.stageTime))).padStart(2,'0');
  ui.hpBar.style.transform='scaleX('+Math.max(0,state.player.hp/state.player.maxHp)+')';ui.level.textContent=state.level;ui.kills.textContent=state.kills;
  ui.bossMeter.classList.toggle('hidden',!stage.boss);if(state.boss)ui.bossBar.style.transform='scaleX('+Math.max(0,state.boss.hp/state.boss.maxHp)+')';
}
function showMessage(text){ui.message.textContent=text;ui.message.classList.remove('hidden');state.messageTime=1.8}
function curtain(eyebrow,title,subtitle,button,hint=''){
  ui.eyebrow.textContent=eyebrow;ui.title.innerHTML=title;ui.subtitle.textContent=subtitle;ui.start.textContent=button;ui.hint.textContent=hint;ui.curtain.classList.remove('hidden');
}
function beginStage(index){
  state.stageIndex=index;loadStage(index);state.mode='transition';state.transitionTime=2.4;
  curtain('STAGE '+(index+1),stages[index].name,stages[index].subtitle,'READY');ui.start.classList.add('hidden');
}
function startGame(){
  resetPlayer();state.stageIndex=0;state.level=1;state.kills=0;state.xp=0;state.paused=false;
  ui.start.classList.add('hidden');ui.hud.classList.remove('hidden');ui.pause.classList.remove('hidden');beginStage(0);
}
function gameOver(){
  state.mode='gameover';state.player.group.visible=true;curtain('INFECTION COMPLETE','YOU <span>DIED</span>','THE NIGHT STARTS AGAIN','RETRY','PRESS ENTER / TAP');
  ui.start.classList.remove('hidden');ui.hud.classList.add('hidden');ui.pause.classList.add('hidden');
}
function ending(){
  state.mode='ending';curtain('THE ROOM IS QUIET.','<span>かゆい</span> うま','SUMMER INFECTION — CLEAR','AGAIN','PRESS ENTER / TAP');
  ui.start.classList.remove('hidden');ui.hud.classList.add('hidden');ui.pause.classList.add('hidden');
}
function togglePause(){
  if(state.mode!=='play')return;state.paused=!state.paused;ui.pause.textContent=state.paused?'▶':'Ⅱ';
  if(state.paused)showMessage('PAUSED');else{state.messageTime=0;ui.message.classList.add('hidden');clock.getDelta()}
}
function pressStart(){if(['title','gameover','ending'].includes(state.mode))startGame()}
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;updateGame(dt,time);renderer.render(scene,camera);
}

window.addEventListener('keydown',event=>{keys.add(event.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code))event.preventDefault();if(event.code==='Enter'||event.code==='Space')pressStart();if(event.code==='Escape'||event.code==='KeyP')togglePause()});
window.addEventListener('keyup',event=>keys.delete(event.code));window.addEventListener('blur',()=>keys.clear());
ui.start.addEventListener('click',pressStart);ui.pause.addEventListener('click',togglePause);
for(const button of ui.touch.querySelectorAll('button')){
  const code=button.dataset.key;button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(code)});
  const release=()=>keys.delete(code);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('pointerleave',release);
}

resetPlayer();loadStage(0);state.player.group.position.set(0,0,1.7);state.player.group.rotation.y=Math.PI;ui.hud.classList.add('hidden');animate();
