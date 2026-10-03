/* EARTH AFTER — 3D stage blockout models (three.js) */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const C={sara:'#ecc96f',saraChild:'#f3d98f',kyle:'#86a6d3',kira:'#dc8058',human:'#a9c98a',doro:'#9aa3ad',guard:'#c9cdd2',yutani:'#bfe9f5',enemy:'#e5533d'};
const $=s=>document.querySelector(s);
let renderer,scene,camera,controls,root,labelsEl,view,stageKey=null,presetKey=null,anim=null,visible=true,showLabels=true,showFire=true,freeView=false;
let chars=[],fireLines=[],tickers=[];

/* ---------- helpers ---------- */
const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:.05,flatShading:true},o));
function add(m,x=0,y=0,z=0,g=root){m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m}
function box(w,h,d,c,x,y,z,o){return add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c,o)),x,y+h/2,z)}
function cyl(r1,r2,h,c,x,y,z,o,seg=12){return add(new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat(c,o)),x,y+h/2,z)}
function tree(x,z,s=1,c='#3f4a2e'){cyl(.12*s,.18*s,1.6*s,'#4a3a2c',x,0,z);const m=add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.1*s,0),mat(c)),x,2.2*s,z);m.userData.foliage=true;return m}
function person(name,color,h,x,z,rot=0,o={}){
  const g=new THREE.Group();const r=h*.1;
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(r,h*.46,4,10),mat(color,{emissive:color,emissiveIntensity:.18}));
  body.position.y=h*.42;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(h*.1,14,10),mat(color,{emissive:color,emissiveIntensity:.22}));head.position.y=h*.9;g.add(head);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(h*.035,h*.1,8),mat('#ffffff',{emissive:'#ffffff',emissiveIntensity:.3}));nose.rotation.x=Math.PI/2;nose.position.set(0,h*.9,h*.11);g.add(nose);
  if(o.eyes){const e=new THREE.Mesh(new THREE.BoxGeometry(h*.12,h*.02,h*.02),new THREE.MeshBasicMaterial({color:o.eyes}));e.position.set(0,h*.92,h*.095);g.add(e)}
  if(o.sit){g.scale.y=.62}
  if(o.lie){g.rotation.z=o.lie===-1?-Math.PI/2:Math.PI/2;}
  g.position.set(x,o.sit?((o.y??.45)-h*.03):(o.y||0),z);g.rotation.y=rot;
  g.traverse(m=>{if(m.isMesh){m.castShadow=true}});
  root.add(g);
  const anchor=new THREE.Object3D();anchor.position.y=h*1.08;g.add(anchor);
  if(name){const el=document.createElement('span');el.textContent=name;el.style.setProperty('--c',color);labelsEl.appendChild(el);chars.push({anchor,el})}
  return g;
}
function fire(a,b,color=C.enemy){
  const geo=new THREE.BufferGeometry().setFromPoints([a,b]);const l=new THREE.Line(geo,new THREE.LineDashedMaterial({color,dashSize:.35,gapSize:.2,transparent:true,opacity:.95}));
  l.computeLineDistances();root.add(l);fireLines.push(l);l.visible=showFire;return l}
function light(type,c,i,x,y,z,o={}){let L;
  if(type==='dir'){L=new THREE.DirectionalLight(c,i);L.position.set(x,y,z);if(o.shadow){L.castShadow=true;L.shadow.mapSize.set(1024,1024);const s=o.s||20;Object.assign(L.shadow.camera,{left:-s,right:s,top:s,bottom:-s,near:1,far:120});L.shadow.bias=-.0005}root.add(L.target);if(o.t)L.target.position.set(...o.t)}
  else if(type==='pt'){L=new THREE.PointLight(c,i,o.d||14,1.6);L.position.set(x,y,z);if(o.bulb){const b=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color:c}));b.position.copy(L.position);root.add(b)}}
  else if(type==='hemi'){L=new THREE.HemisphereLight(c,o.g||'#111',i)}
  else L=new THREE.AmbientLight(c,i);
  root.add(L);return L}

/* ---------- stages ---------- */
const STAGES={
 park:{name:'夕暮れの公園',sub:'01・21',desc:'01の出会いの場所。二人はベンチの両端に座り、間に一人分の空席がある。夕日は正面奥（遊具と工業地帯の方向）。21では同じ構図の春の共同体として比較できる。',
  build(v){
   const spring=v==='spring';
   scene.background=new THREE.Color(spring?'#cfe0ea':'#3a2a3a');scene.fog=new THREE.Fog(spring?'#e8dfe4':'#8a4a3a',14,62);
   light('hemi',spring?'#fff4f6':'#ffb77a',spring?1.1:.55,0,0,0,{g:spring?'#8aa070':'#2a1a22'});
   light('dir',spring?'#fff6e8':'#ff9a50',spring?1.6:2.4,spring?6:-2,spring?14:3.2,spring?6:-30,{shadow:true,s:14});
   box(60,.02,60,spring?'#8f9d6a':'#5a4636',0,-.02,0,{roughness:1});
   box(2.2,.05,40,spring?'#c9b79a':'#7a6452',0,0,-10,{roughness:1});
   // bench
   box(1.9,.06,.45,'#5b3f2a',0,.42,0);box(1.9,.4,.06,'#5b3f2a',0,.48,-.22);[-.85,.85].forEach(x=>{box(.06,.42,.4,'#2b2b2b',x,0,0)});
   // swings
   [-7.2,-5.4].forEach(x=>cyl(.05,.05,2.4,'#6a4b3a',x,0,-6));box(2,.08,.08,'#6a4b3a',-6.3,2.36,-6);[-6.8,-5.8].forEach(x=>box(.4,.04,.2,'#3a2a22',x,.45,-6));
   const dome=add(new THREE.Mesh(new THREE.SphereGeometry(1.6,10,6,0,Math.PI*2,0,Math.PI/2),mat('#8b5a3c',{wireframe:true})),-2.5,0,-9);
   cyl(.05,.07,3.2,'#222',2.6,0,-1.4);if(!spring)light('pt','#ffc98a',3,2.6,3.2,-1.4,{bulb:true,d:9});else box(.25,.2,.25,'#eee',2.6,3.2,-1.4);
   for(let i=0;i<9;i++)tree(-12+i*3+Math.sin(i)*1.5,-4-(i%3)*3.5,1+(i%2)*.3,spring?'#f0b9c8':'#3f3a2a');
   tree(6,3,1.3,spring?'#f4c6d2':'#3a3526');tree(-5,4,1.1,spring?'#f4c6d2':'#3a3526');
   if(!spring){for(let i=0;i<14;i++){const h=4+((i*7)%9);box(2.2,h,2,'#241a1e',-26+i*4,0,-40-(i%3)*3,{roughness:1});if(i%3==0)cyl(.3,.4,h+6,'#1b1417',-25+i*4,0,-42)}
     const sun=new THREE.Mesh(new THREE.SphereGeometry(2.6,20,14),new THREE.MeshBasicMaterial({color:'#ffcf7a'}));sun.position.set(-3,4,-52);root.add(sun)}
   if(!spring){
     person('幼い沙羅',C.saraChild,1.15,-.62,0,0,{sit:true,y:.48});person('幼いカイル',C.kyle,1.25,.62,0,0,{sit:true,y:.48});
     add(new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),mat('#eee')),.95,.12,.25);
     [[-6.5,-4.8],[-5,-5.2],[-3.6,-7.5],[-7.5,-7]].forEach(([x,z],i)=>person(i?null:'遊ぶ子供たち','#b9a893',1.1,x,z,i));
     fire(new THREE.Vector3(-.62,.75,0),new THREE.Vector3(.62,.75,0),'#ffffff').material.opacity=.35;
   }else{
     person('人間の少女',C.saraChild,1.1,-.8,1.2,.9);person('ドロの少年',C.kyle,1.15,.5,1.2,-.9,{eyes:'#8fe6ff'});
     add(new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),mat('#eee')),-.15,.11,1.35);
     person('キラ（沙羅の工具袋）',C.kira,1.62,2.4,-1.6,-2.4);
     petals();
   }
  },
  cams:{
   '01-01':{p:[3.4,1.1,4.2],t:[-3,.7,-6],mm:28,d:'固定・引き。手前のベンチに沙羅が一人、奥の遊具で子供たちが遊ぶ。輪から離れた孤独を距離で見せる。'},
   '01-02':{p:[.35,.18,2.1],t:[0,.55,0],mm:24,d:'足元から二人へ。ボールが沙羅の靴に当たり、少年が駆け寄る。ローアングル。'},
   '01-03':{p:[0,.85,3.6],t:[0,.8,0],mm:40,d:'同じ高さの二人。カイルがボールを抱えて隣に座る。間に一人分の空席。'},
   '01-04':{p:[3,.95,-2.2],t:[0,.9,0],mm:50,d:'横顔・長めの間。同じ夕焼けを見る。夕日は二人の正面奥。'},
   '21-02':{p:[-.3,1.1,6.4],t:[-.1,.6,1.2],mm:45,v:'spring',d:'3年後の春。人間の少女とドロの少年がボールを介して出会う。01と同じ空間の反復として構図を合わせる。'},
   '21-03':{p:[3.6,1.5,1.2],t:[1.6,1.2,-1],mm:50,v:'spring',d:'通り過ぎたキラが振り返り、口元だけで笑う。桜の花びら。'}
  }},
 community:{name:'地下共同体',sub:'08・10・11',desc:'人間と、旧AIへ戻されたドロが暮らす地下拠点。ランタンの暖色と、打ちっぱなしの壁。修理台（08）、広場のサッカー（10）、夜の食卓と戸口（11）を一つの空間に配置した。',
  build(v){
   scene.background=new THREE.Color('#0d0b0a');scene.fog=new THREE.Fog('#1a130d',10,34);
   light('amb','#6a5846',1.1);light('hemi','#ffcf99',.6,0,0,0,{g:'#140f0c'});
   const W=26,D=18,H=5.5;
   box(W,.1,D,'#3a322a',0,-.1,0,{roughness:.95});box(W,.2,D,'#1f1a16',0,H,0);
   box(W,H,.3,'#2d2621',0,0,-D/2);box(.3,H,D,'#2d2621',-W/2,0,0);box(.3,H,D,'#2d2621',W/2,0,0);
   for(let i=-2;i<=2;i++)for(let j=-1;j<=1;j+=2)box(.5,H,.5,'#3a3129',i*5,0,j*4);
   // doorway (R09)
   box(1.6,2.4,.35,'#060505',-4,0,-D/2+.1,{emissive:'#1a2a3a',emissiveIntensity:.4});
   // stairs to surface
   for(let k=0;k<8;k++)box(2,.25,.5,'#4a4038',-W/2+1.5,k*.3,D/2-1-k*.5);
   // lanterns
   [[-8,-2],[-3,-5],[2,-2],[6,2],[-6,4],[1,5]].forEach(([x,z])=>{cyl(.01,.01,1.2,'#222',x,H-1.2,z);light('pt','#ffb46a',22,x,H-1.35,z,{bulb:true,d:12})});
   // repair area (R06)
   box(2.2,.7,1,'#5a5550',5,0,1.4);box(1.4,1.1,.6,'#2a2f35',6.9,0,.2,{emissive:'#3fa0c0',emissiveIntensity:.25});
   // table & cans (R09)
   box(2.4,.08,1.1,'#5b4636',0,.74,-4);[[-1,-4.4],[1,-4.4],[-1,-3.6],[1,-3.6]].forEach(([x,z])=>box(.07,.74,.07,'#3a2d24',x,0,z));
   for(let k=0;k<5;k++)cyl(.05,.05,.11,'#9aa0a6',-.6+k*.18,.82,-4.2,{metalness:.6,roughness:.4});
   box(.5,.45,.5,'#3b3b3b',-.2,0,-3.1);// stool
   // charging seat (R10)
   box(.7,.9,.7,'#3d4450',-7.5,0,-4.5);box(.1,1.6,.7,'#2e3440',-7.9,0,-4.5,{emissive:'#6fd2ee',emissiveIntensity:.35});
   // pitch (R08)
   box(7,.01,4.6,'#4a3f33',-6,0,3.4);add(new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),mat('#ddd')),-5.4,.11,3.2);
   box(.1,1,1.6,'#777',-9.4,0,3.4);
   if(v==='R06'){person('沙羅',C.sara,1.55,3.6,2.3,2.4);person('復帰ドロ',C.doro,1.7,5,1.4,-1.2,{sit:true,y:.7,eyes:'#ffb46a'});person('キラ',C.kira,1.6,6.6,-.3,-2.2);person('父',C.human,1.72,6.1,2.6,-2.6)}
   else if(v==='R09'){person('沙羅',C.sara,1.55,-.2,-3.2,Math.PI,{sit:true,y:.45});person('カイル（戸口）',C.kyle,1.75,-4,-8.4,.5);fire(new THREE.Vector3(-4,1.6,-8.4),new THREE.Vector3(-.2,1.1,-3.2),'#ffffff').material.opacity=.35}
   else if(v==='R09b'){person('沙羅',C.sara,1.55,-.2,-3.2,Math.PI,{sit:true,y:.45});person('カイル',C.kyle,1.75,.9,-3,-.9,{sit:true,y:.45})}
   else{person('カイル',C.kyle,1.75,-5.6,3.9,-2.2);person('沙羅',C.sara,1.55,-3.6,1.6,-1.6);person('キラ',C.kira,1.6,-3.4,4.9,-2);[[-6.6,2.6],[-7.2,4],[-5.2,2.6]].forEach(([x,z],i)=>person(i?null:'子供たち',C.human,1.05,x,z,1.2))}
  },
  cams:{
   '08-04':{p:[2.2,1.35,3.6],t:[5,1,1.3],mm:50,v:'R06',d:'沙羅は手が届く少し手前で立ち止まる。「もう、命令は来ない。……おかえり」。肩越しに復帰ドロを見る。'},
   '10-03':{p:[-1.2,.6,7.6],t:[-5.4,.6,3.2],mm:28,v:'R08',d:'子供相手に本気のサッカー。「大人げない！」「ドロだ」。低めの引きで全員を入れる。'},
   '11-01':{p:[1.9,1.55,-.6],t:[-3.2,1.2,-7.4],mm:35,v:'R09',d:'沙羅の背中越しに戸口のカイル。「そんなに急いで食うなよ」。隠していた食事が見つかる瞬間。'},
   '11-02':{p:[.4,1.15,-.2],t:[.35,1,-3.1],mm:65,v:'R09b',d:'「怒ってる？」「怒ってる」。並んで座る二人の近景。ランタンの一灯で。'}
  }},
 bay:{name:'ユタニ西棟 地下搬出口',sub:'16・17',desc:'沙羅の最期の場所。奥に救出車と手動レバー、右の隔壁にカイル、左上の通路に射手。赤い破線は射線。17-02では、沙羅がカイルとの射線上に飛び込む。',
  build(v){
   scene.background=new THREE.Color('#070606');scene.fog=new THREE.Fog('#1c0907',8,34);
   light('amb','#5a4644',1.2);light('hemi','#ffd0c0',.4,0,0,0,{g:'#120606'});
   const W=10,L=30,H=7;
   box(W,.1,L,'#2a2624',0,-.1,0,{roughness:.6,metalness:.2});box(.3,H,L,'#23201e',-W/2,0,0);box(.3,H,L,'#2c2826',W/2,0,0);box(W,H,.3,'#141111',0,0,-L/2);
   for(let i=0;i<5;i++){box(.4,H,.4,'#3a3432',-W/2+.4,0,-12+i*6);box(.4,H,.4,'#3a3432',W/2-.4,0,-12+i*6)}
   // ramp from +z
   const ramp=box(4,.2,8,'#34302d',0,1.2,12);ramp.rotation.x=-.28;
   // catwalk left
   box(1.6,.12,22,'#3d3936',-W/2+1,3.4,2);for(let i=0;i<8;i++)box(.05,1,.05,'#555',-W/2+1.75,3.5,-8+i*3);box(.05,.05,22,'#666',-W/2+1.75,4.4,2);
   // rescue van
   box(2.4,2.2,5,'#4d5347',-1.2,0,-12.2);box(2.3,.1,.1,'#e5533d',-1.2,2.25,-9.7,{emissive:'#e5533d',emissiveIntensity:1});
   // manual lever
   box(.3,1.4,.2,'#555',1.6,0,-9.2);box(.06,.5,.06,'#e8a94f',1.6,1.4,-9.2,{emissive:'#e8a94f',emissiveIntensity:.4});
   // bulkhead with restraint
   box(.4,4,6,'#3b3f44',W/2-.5,0,-4,{metalness:.4,roughness:.5});
   // cargo platform
   box(1.6,.6,2.2,'#5a5046',-2.6,0,-7.6);
   // emergency lights
   [[-4.4,5.6,-10],[4.4,5.6,-2],[-4.4,5.6,6],[4.4,5.6,10]].forEach(p=>light('pt','#ff3b28',40,...p,{bulb:true,d:16}));
   light('pt','#8fb8ff',16,-1.2,2.4,-9.4,{d:8});light('pt','#ffd9b0',10,2,3,-3,{d:9});
   const shooter=[-4,3.5+1.45,6];
   person('射手（警備兵）',C.enemy,1.75,shooter[0],shooter[2],Math.PI+.35,{y:3.46,eyes:'#ff3b28'});
   person('キラ',C.kira,1.6,-2.2,-9.6,.4);person('運転手',C.human,1.72,-.2,-11,-.2);
   const KY=new THREE.Vector3(W/2-1,1.2,-3.6);
   if(v==='R15b'){
     person('カイル',C.kyle,1.75,W/2-1,-3.6,-1.4);
     person('沙羅（被弾）',C.sara,1.55,2.2,-1.2,-.4);
     fire(new THREE.Vector3(...shooter),new THREE.Vector3(2.2,1.15,-1.2));
   }else if(v==='R15c'){
     person('カイル',C.kyle,1.75,2.7,-3.4,-1.2,{sit:true,y:0});person('沙羅',C.sara,1.55,1,-3.2,0,{lie:-1,y:.3});
   }else{
     person('カイル（拘束）',C.kyle,1.75,W/2-1,-3.6,-1.4);person('沙羅',C.sara,1.55,1.1,-8.4,2.6);
     fire(new THREE.Vector3(...shooter),KY);
   }
   person(null,C.guard,1.75,2,7,Math.PI,{eyes:'#ff3b28',lie:true,y:.3});
  },
  cams:{
   '16-01':{p:[3.8,4.6,9.5],t:[-.6,1.4,-6],mm:20,v:'R15a',d:'引き・退路と射線。奥の救出車、手動レバーへ走る沙羅、隔壁のカイル、上段通路の射手を一画面に。位置関係を明確に。'},
   '17-01':{p:[4.4,1.55,-5.6],t:[-4,4.6,6],mm:85,v:'R15a',d:'カイル越しの望遠。射手に気づくが身体が動かない。発砲直前の緊張。'},
   '17-02':{p:[-2.8,1.35,-4.8],t:[2.2,1.1,-1.8],mm:40,v:'R15b',d:'衝撃の瞬間・中景。沙羅がカイルとの射線上に飛び込み、胸に被弾。過度な流血は避ける。'},
   '17-03':{p:[1.3,1.25,.4],t:[2.1,.55,-3.2],mm:45,v:'R15c',d:'二人の顔・近景。生身の右手がカイルの頬に触れる。「王子様でいてね」。'},
   '16-03':{p:[-3.8,.9,-1],t:[1,1.5,4],mm:24,v:'R15a',d:'非常灯だけの空間を、沙羅が搬送板を盾に渡る。全身が入る広めのレンズ。'}
  }},
 lobby:{name:'ユタニ本社 中央ロビー',sub:'19・20',desc:'左右対称の巨大な吹き抜け。正面のガラス扉から朝日。中央にユタニの遠隔ホログラム。「やれ」の後、上層回廊と奥の扉から警備ドロの大群が現れる（20-04以降で表示）。',
  build(v){
   scene.background=new THREE.Color('#0a0d10');scene.fog=new THREE.Fog('#0e1418',18,80);
   light('amb','#6d7f8c',.35);light('hemi','#cfe6f0',.35,0,0,0,{g:'#0b0d10'});
   const W=30,L=56,H=18;
   box(W,.1,L,'#c9ccd0',0,-.1,0,{roughness:.18,metalness:.35});
   box(.4,H,L,'#20262c',-W/2,0,0);box(.4,H,L,'#20262c',W/2,0,0);box(W,H,.4,'#1a1f24',0,0,-L/2);box(W,.4,L,'#15191d',0,H,0);
   for(let i=0;i<7;i++){[-1,1].forEach(s=>{box(1.1,H,1.1,'#2c343b',s*(W/2-3),0,-22+i*7.3)})}
   [6,11].forEach(y=>{[-1,1].forEach(s=>{box(3,.4,L-4,'#262d33',s*(W/2-1.5),y,0);box(.1,1,L-4,'#8fa3b0',s*(W/2-3),y+.4,0,{metalness:.8,roughness:.2,transparent:true,opacity:.5})});box(W-6,.4,3,'#262d33',0,y,-L/2+1.5)});
   // entrance glass & sun
   const glass=new THREE.Mesh(new THREE.PlaneGeometry(14,12),new THREE.MeshBasicMaterial({color:'#fff1d8',transparent:true,opacity:.9}));glass.position.set(0,6,L/2-.3);glass.rotation.y=Math.PI;root.add(glass);
   for(let i=-3;i<=3;i++)box(.12,12,.2,'#1a1f24',i*2.1,0,L/2-.4);
   const sunL=light('dir','#ffd9a0',2.2,0,10,L/2+10,{shadow:true,s:30,t:[0,0,0]});
   light('pt','#bfe9f5',8,0,5,0,{d:20});
   // logo pillar
   box(4,12,.6,'#11161a',0,0,-L/2+2.2,{emissive:'#2b4a58',emissiveIntensity:.5});
   // hologram
   const holo=new THREE.Group();root.add(holo);
   const hm=new THREE.MeshBasicMaterial({color:C.yutani,transparent:true,opacity:.55,wireframe:false});
   const hb=new THREE.Mesh(new THREE.CapsuleGeometry(.3,1,4,12),hm);hb.position.y=1;holo.add(hb);
   const hh=new THREE.Mesh(new THREE.SphereGeometry(.19,16,12),hm);hh.position.y=1.9;holo.add(hh);
   const arms=new THREE.Mesh(new THREE.BoxGeometry(1.9,.12,.12),hm);arms.position.y=1.45;holo.add(arms);
   const ring=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,.05,40,1,true),new THREE.MeshBasicMaterial({color:C.yutani,transparent:true,opacity:.3,side:THREE.DoubleSide}));ring.position.y=.03;holo.add(ring);
   const cone=new THREE.Mesh(new THREE.CylinderGeometry(.9,.2,2.6,24,1,true),new THREE.MeshBasicMaterial({color:C.yutani,transparent:true,opacity:.07,side:THREE.DoubleSide}));cone.position.y=1.3;holo.add(cone);
   tickers.push(t=>{const g=Math.random()<.06;hm.opacity=g?.15+Math.random()*.4:.5+Math.sin(t*9)*.05;holo.position.x=g?(Math.random()-.5)*.25:0;ring.rotation.y=t*.6});
   const ha=new THREE.Object3D();ha.position.y=2.3;holo.add(ha);const hl=document.createElement('span');hl.textContent='ユタニ（ホログラム）';hl.style.setProperty('--c',C.yutani);labelsEl.appendChild(hl);chars.push({anchor:ha,el:hl});
   const ky=v==='R19e'?8:12;
   person('カイル',C.kyle,1.75,0,ky,Math.PI);
   if(v==='R19b'||v==='R19e'){
     const K=new THREE.Vector3(0,1.3,ky);let n=0;
     [6.4,11.4].forEach(y=>{[-1,1].forEach(s=>{for(let i=0;i<7;i++){const z=-20+i*6.5,x=s*(W/2-2);person(n++?null:'警備ドロ（数十体）',C.guard,1.75,x,z,s>0?-Math.PI/2:Math.PI/2,{y,eyes:'#ff3b28'});if(i%2==0)fire(new THREE.Vector3(x,y+1.4,z),K).material.opacity=.4}})});
     for(let i=0;i<8;i++){const x=-7+i*2;person(null,C.guard,1.75,x,-22,0,{eyes:'#ff3b28'});}
   }
  },
  cams:{
   '20-01':{p:[0,1.6,24],t:[0,2.2,-6],mm:24,v:'R18',d:'誰もいない巨大ロビー。中央にユタニのホログラム。左右対称、冷たい白光。カイルは入口から銃を向ける。'},
   '20-03':{p:[7.5,1.6,7.5],t:[0,1.6,5.2],mm:35,v:'R18',d:'対峙・中景。両腕を広げるホログラムと、銃を向けたままのカイル。'},
   '20-02':{p:[0,1.75,3.4],t:[0,1.75,0],mm:85,v:'R18',d:'ユタニの近景。「今度こそ、私たちの家族にならないか？」。温和だが不気味。'},
   '20-04':{p:[0,15,-20],t:[0,1,9],mm:16,v:'R19b',d:'グリッチと包囲・超広角。「やれ」。上層回廊と奥の扉から数十体の警備ドロ。'},
   '20-05':{p:[0,1.15,15.5],t:[0,1.6,-10],mm:24,v:'R19e',d:'背後からの突撃。出口は閉ざされ、正面に警備兵の大群。白い閃光へ。生死は描かない。'}
  }}
};
function petals(){const N=160,geo=new THREE.BufferGeometry(),pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*20;pos[i*3+1]=Math.random()*8;pos[i*3+2]=(Math.random()-.5)*14}
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const p=new THREE.Points(geo,new THREE.PointsMaterial({color:'#f4c6d2',size:.08}));root.add(p);
  tickers.push((t,dt)=>{const a=geo.attributes.position.array;for(let i=0;i<N;i++){a[i*3+1]-=dt*.6;a[i*3]-=dt*.25;if(a[i*3+1]<0){a[i*3+1]=8;a[i*3]=(Math.random()-.5)*20}}geo.attributes.position.needsUpdate=true})}

/* ---------- core ---------- */
function clear(){if(root){root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){[].concat(o.material).forEach(m=>m.dispose())}});scene.remove(root)}
  root=new THREE.Group();scene.add(root);labelsEl.innerHTML='';chars=[];fireLines=[];tickers=[]}
let builtVariant=null;
function build(key,variant){clear();stageKey=key;builtVariant=variant;STAGES[key].build(variant)}
const fovFromMM=mm=>{const h=2*Math.atan(18/mm);return THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(h/2)/(16/9)))};
function goPreset(id,instant){
  const st=STAGES[stageKey],c=st.cams[id];presetKey=id;
  const v=c.v||null;if(v!==builtVariant)build(stageKey,v);
  setFree(false);
  const from={p:camera.position.clone(),t:controls.target.clone(),f:camera.fov};
  const to={p:new THREE.Vector3(...c.p),t:new THREE.Vector3(...c.t),f:fovFromMM(c.mm)};
  if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){camera.position.copy(to.p);controls.target.copy(to.t);camera.fov=to.f;camera.updateProjectionMatrix();camera.lookAt(to.t)}
  else anim={from,to,s:performance.now(),d:900};
  $('#s3desc').innerHTML=`<b style="color:var(--paper)">${id}</b>　${c.d}`;
  document.querySelectorAll('#s3cams button').forEach(b=>b.classList.toggle('on',b.dataset.c===id));
  hud();
}
function hud(){const c=presetKey&&STAGES[stageKey].cams[presetKey];
  $('#s3hud').innerHTML=`${STAGES[stageKey].name}<br>${freeView?'自由視点':(presetKey||'')}　${c&&!freeView?c.mm+'mm':Math.round(camera.fov)+'°'}　カメラ高 ${camera.position.y.toFixed(1)}m`}
function setStage(key){
  const st=STAGES[key];stageKey=key;
  document.querySelectorAll('#s3stages button').forEach(b=>b.classList.toggle('on',b.dataset.s===key));
  const bar=$('#s3cams');bar.querySelectorAll('button').forEach(b=>b.remove());
  Object.keys(st.cams).sort().forEach(id=>{const b=document.createElement('button');b.type='button';b.dataset.c=id;b.textContent=id;b.onclick=()=>goPreset(id);bar.appendChild(b)});
  builtVariant=undefined;goPreset(Object.keys(st.cams).sort()[0],true);
  $('#s3desc').innerHTML=`<b style="color:var(--paper)">${st.name}（${st.sub}）</b>　${st.desc}<br><span style="font-size:13px">カットのボタンでカメラが移動します。</span>`;
}
function setFree(on){freeView=on;controls.enabled=on;$('#s3o').classList.toggle('on',on);hud()}
function resize(){const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
const tmp=new THREE.Vector3();
let lastT=performance.now();
function frame(now){requestAnimationFrame(frame);if(!visible||document.hidden)return;
  const dt=Math.min(.05,(now-lastT)/1000);lastT=now;const t=now/1000;
  if(anim){const k=Math.min(1,(now-anim.s)/anim.d),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
    camera.position.lerpVectors(anim.from.p,anim.to.p,e);controls.target.lerpVectors(anim.from.t,anim.to.t,e);camera.fov=anim.from.f+(anim.to.f-anim.from.f)*e;camera.updateProjectionMatrix();camera.lookAt(controls.target);if(k>=1){anim=null;hud()}}
  if(freeView)controls.update();
  tickers.forEach(f=>f(t,dt));
  renderer.render(scene,camera);
  const w=view.clientWidth,h=view.clientHeight;
  chars.forEach(({anchor,el})=>{anchor.getWorldPosition(tmp);tmp.project(camera);const vis=showLabels&&tmp.z<1&&Math.abs(tmp.x)<1.1&&Math.abs(tmp.y)<1.1;el.style.display=vis?'':'none';if(vis){el.style.left=((tmp.x+1)/2*w)+'px';el.style.top=((1-tmp.y)/2*h)+'px'}});
}
export function init(){
  view=$('#s3view');labelsEl=$('#s3labels');
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  view.insertBefore(renderer.domElement,view.firstChild);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(40,16/9,.05,300);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enabled=false;controls.maxPolarAngle=Math.PI*.495;
  renderer.domElement.addEventListener('pointerdown',()=>{if(!freeView){setFree(true);presetKey=null;document.querySelectorAll('#s3cams button').forEach(b=>b.classList.remove('on'))}});
  controls.addEventListener('change',()=>{if(freeView)hud()});
  // guide overlay
  $('#s3guide').innerHTML='<svg viewBox="0 0 160 90" preserveAspectRatio="none" style="width:100%;height:100%"><g stroke="#ffffff66" stroke-width=".3" vector-effect="non-scaling-stroke"><line x1="53.3" y1="0" x2="53.3" y2="90"/><line x1="106.6" y1="0" x2="106.6" y2="90"/><line x1="0" y1="30" x2="160" y2="30"/><line x1="0" y1="60" x2="160" y2="60"/><line x1="78" y1="45" x2="82" y2="45"/><line x1="80" y1="43" x2="80" y2="47"/></g></svg>';
  const sb=$('#s3stages');Object.entries(STAGES).forEach(([k,s])=>{const b=document.createElement('button');b.type='button';b.dataset.s=k;b.textContent=`${s.name}`;b.title=s.sub;b.onclick=()=>setStage(k);sb.appendChild(b)});
  $('#s3g').onclick=e=>{const on=$('#s3guide').classList.toggle('on');e.currentTarget.classList.toggle('on',on)};
  $('#s3l').onclick=e=>{showLabels=!showLabels;e.currentTarget.classList.toggle('on',showLabels)};
  $('#s3f').onclick=e=>{showFire=!showFire;e.currentTarget.classList.toggle('on',showFire);fireLines.forEach(l=>l.visible=showFire)};
  $('#s3o').onclick=()=>setFree(!freeView);
  $('#s3c').onclick=async()=>{const c=presetKey&&STAGES[stageKey].cams[presetKey];const p=camera.position,t=controls.target;
    const txt=`EARTH AFTER 3D舞台\n舞台：${STAGES[stageKey].name}\nカット：${presetKey||'自由視点'}\nレンズ：${c&&!freeView?c.mm+'mm（35mm換算）':'画角'+Math.round(camera.fov)+'°'}\nカメラ位置：(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}) m\n注視点：(${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)}) m\nカメラ高：${p.y.toFixed(2)} m${c?'\n演出：'+c.d:''}`;
    try{await navigator.clipboard.writeText(txt)}catch(e){}const tt=$('#toast');tt.textContent='カメラ情報をコピーしました';tt.classList.add('on');setTimeout(()=>tt.classList.remove('on'),1600)};
  new ResizeObserver(resize).observe(view);
  new IntersectionObserver(es=>es.forEach(e=>visible=e.isIntersecting)).observe(view);
  resize();setStage('park');requestAnimationFrame(frame);
}
