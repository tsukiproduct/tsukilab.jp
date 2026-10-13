export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const chars=[
 {name:'Bito',en:'BLACK SUIT',desc:'経験値 +12%。迷ったらこの男。',hp:110,speed:150,power:1,xp:1.12,magnet:90,shots:1,aura:0,orbit:0,crit:.05},
 {name:'赤マント',en:'RED CAPE',desc:'オーラ装備。近距離戦が得意。',hp:115,speed:145,power:1.08,xp:1,magnet:85,shots:1,aura:1,orbit:0,crit:.05},
 {name:'オペラ座',en:'THE OPERA',desc:'2発同時射撃。仮面の射手。',hp:90,speed:150,power:.95,xp:1,magnet:90,shots:2,aura:0,orbit:0,crit:.1},
 {name:'うさBito',en:'USA BITO',desc:'移動と回収が速い。群れをすり抜けろ。',hp:90,speed:185,power:.95,xp:1.05,magnet:130,shots:1,aura:0,orbit:0,crit:.05},
 {name:'吟遊詩人',en:'THE BARD',desc:'回転名刺と音の波。囲まれても演奏。',hp:105,speed:145,power:1,xp:1,magnet:90,shots:1,aura:1,orbit:1,crit:.05},
 {name:'水着Bito',en:'SUMMER BITO',desc:'最速・会心25%。体力は低め。',hp:80,speed:200,power:1.1,xp:1,magnet:100,shots:1,aura:0,orbit:0,crit:.25}
];
export const difficulties=[
 {name:'夜の入口',en:'DUSK',hp:.9,speed:.9,damage:.8,density:.85,boss:1,coin:1},
 {name:'深夜勤務',en:'MIDNIGHT',hp:1.1,speed:1,damage:1,density:1,boss:1.15,coin:1.3},
 {name:'悪夢の街',en:'NIGHTMARE',hp:1.3,speed:1.08,damage:1.15,density:1.15,boss:1.35,coin:1.6},
 {name:'地獄の残業',en:'HELL',hp:1.55,speed:1.16,damage:1.3,density:1.3,boss:1.6,coin:2},
 {name:'夜明けなき夜',en:'NO DAWN',hp:1.85,speed:1.24,damage:1.5,density:1.45,boss:1.85,coin:2.5}
];
export const upgradeDefs=[
 {id:'power',icon:'glasses',name:'レーザーメガネ',desc:'攻撃力 +22%',max:6},
 {id:'rate',icon:'bolt',name:'クイックワーク',desc:'攻撃速度 +18%',max:6},
 {id:'shots',icon:'shots',name:'マルチショット',desc:'発射数 +1',max:4},
 {id:'aura',icon:'aura',name:'ブラックオーラ',desc:'周囲に継続ダメージ',max:5},
 {id:'orbit',icon:'card',name:'回転する名刺',desc:'旋回名刺 +1',max:5},
 {id:'speed',icon:'boot',name:'軽い革靴',desc:'移動速度 +8%',max:4},
 {id:'health',icon:'heart',name:'コーヒーブレイク',desc:'最大体力 +12 / 30回復',max:5},
 {id:'magnet',icon:'magnet',name:'経験値マグネット',desc:'回収範囲 +30',max:4},
 {id:'armor',icon:'shield',name:'仕立ての良いスーツ',desc:'被ダメージ -1.5',max:4},
 {id:'crit',icon:'star',name:'キメ顔',desc:'会心率 +8% / 会心は2倍',max:4}
];
export const metaDefs=[{id:'power',name:'火力',icon:'glasses',desc:'1段階につき攻撃力 +5%'},{id:'health',name:'体力',icon:'heart',desc:'1段階につき最大体力 +8'},{id:'luck',name:'幸運',icon:'star',desc:'宝箱の複数強化率が少し上昇'}];
export function validateSave(raw){const n=(v,max)=>typeof v==='number'&&Number.isFinite(v)?clamp(Math.floor(v),0,max):0;return {version:3,clears:Array.from({length:5},(_,i)=>raw?.clears?.[i]===true),coins:n(raw?.coins,999999),best:n(raw?.best,999999),runs:n(raw?.runs,999999),meta:{power:n(raw?.meta?.power,5),health:n(raw?.meta?.health,5),luck:n(raw?.meta?.luck,5)}}}
export function unlockCount(save){let count=1;for(let i=0;i<5;i++){if(!save.clears[i])break;count++}return count}
export function metaCost(rank){return 40+rank*35}
export function purchase(save,id){if(!metaDefs.some(m=>m.id===id))return false;let r=save.meta[id];if(r>=5||save.coins<metaCost(r))return false;save.coins-=metaCost(r);save.meta[id]++;return true}
export function settle(save,s){if(s.settled)return {coins:0,unlocked:null};s.settled=true;let before=unlockCount(save),win=s.mode==='win';save.runs++;save.best=Math.max(save.best,s.kills);let coins=Math.floor((s.kills*.3+s.time*.08+(win?45:0))*s.d.coin);save.coins=clamp(save.coins+coins,0,999999);if(win)save.clears[s.diff]=true;return {coins,unlocked:unlockCount(save)>before?chars[before].name:null}}
export function chestRoll(r, luck=0){r=Math.min(.999999,r+clamp(luck,0,5)*.014);return r<.45?1:r<.72?2:r<.88?3:r<.97?4:5}
export function createRun(char=0,diff=0,save=validateSave(null),rng=Math.random){char=clamp(Math.floor(char),0,5);diff=clamp(Math.floor(diff),0,4);let c=chars[char];return {mode:'playing',char,diff,d:difficulties[diff],rng,time:0,p:{x:0,y:0,hp:c.hp+save.meta.health*8,maxHp:c.hp+save.meta.health*8,speed:c.speed,inv:0,face:1,direction:0,dx:0,dy:0,walk:0,moving:false,dash:0,dashCd:0},power:c.power*(1+save.meta.power*.05),rate:1,shots:c.shots,aura:c.aura,orbit:c.orbit,magnet:c.magnet,crit:c.crit,armor:0,growth:c.xp/(1+diff*.1),luck:save.meta.luck,ranks:Object.fromEntries(upgradeDefs.map(u=>[u.id,0])),level:1,xp:0,need:7,kills:0,spawn:0,fire:0,pulse:0,orbitTick:0,eliteIndex:0,boss:false,enemies:[],bullets:[],hostile:[],gems:[],chests:[],hazards:[],fx:[],events:[],choices:[],chest:null,shake:0,toast:'',toastTime:0,settled:false}}
export function available(s){return upgradeDefs.filter(u=>s.ranks[u.id]<u.max)}
export function applyUpgrade(s,id){let u=upgradeDefs.find(u=>u.id===id);if(!u||s.ranks[id]>=u.max)return false;s.ranks[id]++;switch(id){case'power':s.power*=1.22;break;case'rate':s.rate*=1.18;break;case'shots':s.shots++;break;case'aura':s.aura++;break;case'orbit':s.orbit++;break;case'speed':s.p.speed*=1.08;break;case'health':s.p.maxHp+=12;s.p.hp=Math.min(s.p.maxHp,s.p.hp+30);break;case'magnet':s.magnet+=30;break;case'armor':s.armor+=1.5;break;case'crit':s.crit=Math.min(.85,s.crit+.08);break}return true}
export function choices(s){let pool=available(s).slice(),out=[];while(pool.length&&out.length<3)out.push(pool.splice(Math.floor(s.rng()*pool.length),1)[0]);return out}
export function choose(s,id){if(s.mode!=='upgrade'||!s.choices.some(u=>u.id===id))return false;applyUpgrade(s,id);s.mode='playing';s.choices=[];return true}
export function openChest(s){if(s.mode!=='chest'||s.chest.open)return false;let count=chestRoll(s.rng(),s.luck),rewards=[];for(let i=0;i<count;i++){let pool=available(s),u=pool[Math.floor(s.rng()*pool.length)];s.level++;if(u){applyUpgrade(s,u.id);rewards.push(u.id)}else{s.p.hp=Math.min(s.p.maxHp,s.p.hp+20);rewards.push('heal')}}s.chest={open:true,count,rewards};s.p.inv=Math.max(s.p.inv,1);return true}
export const enemyDefs=[
 {name:'スライム',hp:17,speed:33,r:12,size:46,xp:1},
 {name:'コウモリ',hp:12,speed:63,r:10,size:49,xp:1},
 {name:'残業ゾンビ',hp:47,speed:28,r:15,size:58,xp:3},
 {name:'ゴースト',hp:26,speed:43,r:12,size:48,xp:2},
 {name:'パンプキン',hp:30,speed:31,r:13,size:53,xp:2},
 {name:'スケルトン',hp:37,speed:49,r:13,size:51,xp:2},
 {name:'鬼部長',hp:230,speed:35,r:25,size:91,xp:12},
 {name:'最後の依頼人',hp:1050,speed:29,r:29,size:110,xp:25}
];
export function spawn(s,type,w=390,h=780,kind='normal'){let def=enemyDefs[type],a=s.rng()*Math.PI*2;let radius=Math.hypot(w,h)/2+45;let x=s.p.x+Math.cos(a)*radius,y=s.p.y+Math.sin(a)*radius;let hp=def.hp*(kind==='boss'||kind==='elite'?s.d.boss:s.d.hp*(1+s.time/500));let e={...def,type,x,y,hp,max:hp,speed:def.speed*s.d.speed,kind,hit:0,cool:kind==='normal'?2.8:2,phase:s.rng()*6.28,attack:0,ax:0,ay:0};s.enemies.push(e);return e}
function effect(s,x,y,color,count=4){for(let i=0;i<count&&s.fx.length<90;i++)s.fx.push({x,y,vx:(s.rng()-.5)*100,vy:(s.rng()-.5)*100,life:.45,color})}
export function hit(s,e,d){if(e.hp<=0||s.mode!=='playing')return;e.hp-=d;e.hit=.12;if(e.hp<=0){s.kills++;s.gems.push({x:e.x,y:e.y,value:e.xp,kind:'xp'});effect(s,e.x,e.y,['#a26ac8','#de675f','#87a783','#ccc9b8','#ce8b46','#779fac','#d76545','#b682c7'][e.type]);if(e.kind==='elite'){s.chests.push({x:e.x,y:e.y});s.toast='宝箱を回収せよ';s.toastTime=2}else if(e.kind==='boss'){s.mode='win';s.events.push('win')}else if(s.rng()<.035)s.gems.push({x:e.x+5,y:e.y,kind:'heal',value:18})}}
function hurt(s,n){if(s.p.inv>0)return;s.p.hp-=Math.max(2,n*s.d.damage-s.armor);s.p.inv=.7;s.shake=.18;effect(s,s.p.x,s.p.y,'#e45a45',5);s.events.push('hurt');if(s.p.hp<=0){s.p.hp=0;s.mode='dead';s.events.push('dead')}}
const dsq=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
function nearest(s){let out=null,best=Infinity;for(let e of s.enemies)if(e.hp>0){let d=dsq(e,s.p);if(d<best){best=d;out=e}}return out}
function attack(s,e){if(e.kind!=='normal'){let count=e.kind==='boss'?8+s.diff*2:4+Math.floor(s.diff/2),rotation=s.rng()*6.28;for(let i=0;i<count&&s.hostile.length<65;i++){let a=rotation+i*6.28/count;s.hostile.push({x:e.x,y:e.y,vx:Math.cos(a)*(95+s.diff*5),vy:Math.sin(a)*(95+s.diff*5),life:4})}s.hazards.push({x:s.p.x,y:s.p.y,r:e.kind==='boss'?62:44,t:.9,done:false})}else if(e.type===4&&s.hostile.length<65){let a=Math.atan2(s.p.y-e.y,s.p.x-e.x);s.hostile.push({x:e.x,y:e.y,vx:Math.cos(a)*85,vy:Math.sin(a)*85,life:4})}}
export function step(s,dt,input={},w=390,h=780){if(s.mode!=='playing')return;dt=clamp(dt,0,.05);let p=s.p;s.time+=dt;s.toastTime-=dt;s.shake=Math.max(0,s.shake-dt);p.inv=Math.max(0,p.inv-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.dash=Math.max(0,p.dash-dt);let mx=Number.isFinite(input.x)?input.x:0,my=Number.isFinite(input.y)?input.y:0,l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}p.moving=l>.08;if(input.dash&&p.dashCd<=0&&p.moving){p.dash=.2;p.dashCd=6;p.inv=.35;s.events.push('dash')}if(p.moving){let speed=p.speed*(p.dash>0?3.2:1);p.x+=mx*speed*dt;p.y+=my*speed*dt;p.walk+=Math.hypot(mx,my)*p.speed*dt;p.dx=mx;p.dy=my;let ax=Math.abs(mx),ay=Math.abs(my);if(ax>ay+.08)p.direction=mx<0?2:1;else if(ay>ax+.08)p.direction=my<0?3:0;p.face=p.direction===2?-1:p.direction===1?1:p.face}
let elites=[45,100,150];if(s.eliteIndex<3&&s.time>=elites[s.eliteIndex]){s.eliteIndex++;spawn(s,6,w,h,'elite');s.toast='鬼部長 出現';s.toastTime=2;s.events.push('elite')}if(!s.boss&&s.time>=180){s.boss=true;spawn(s,7,w,h,'boss');s.toast='最後の依頼人';s.toastTime=3;s.events.push('boss')}
s.spawn-=dt;const normal=s.enemies.filter(e=>e.kind==='normal'&&e.hp>0).length;let cap=72+s.diff*6;if(s.spawn<=0&&normal<cap){s.spawn=Math.max(.17,(.78-s.time*.0027)/s.d.density);let r=s.rng(),type=s.time<15?0:s.time<40?(r<.6?0:1):s.time<75?(r<.3?2:r<.65?1:0):s.time<120?(r<.25?3:r<.5?2:r<.7?1:0):(r<.2?4:r<.4?5:r<.6?3:r<.8?2:1);spawn(s,type,w,h)}
s.fire-=dt;if(s.fire<=0){let t=nearest(s);if(t){s.fire=Math.max(.115,.55/s.rate);let a=Math.atan2(t.y-p.y,t.x-p.x);for(let i=0;i<s.shots&&s.bullets.length<100;i++){let angle=a+(i-(s.shots-1)/2)*.105;s.bullets.push({x:p.x,y:p.y-7,vx:Math.cos(angle)*430,vy:Math.sin(angle)*430,life:1.9,damage:23*s.power*(s.rng()<s.crit?2:1),pierce:s.ranks.power>=6?1:0,hit:null})}s.events.push('shot')}}
s.pulse-=dt;s.orbitTick-=dt;let pulse=s.pulse<=0,orb=s.orbitTick<=0;if(pulse)s.pulse=.65;if(orb)s.orbitTick=.22;let orbitCount=Math.min(6,s.orbit);
for(let e of s.enemies){if(e.hp<=0)continue;let dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(e.attack>0){e.attack-=dt;if(e.attack<=0)attack(s,e)}else{e.cool-=dt;let speed=e.speed;if(e.type===1)speed*=1+.18*Math.sin(s.time*5+e.phase);if(e.type===5&&e.cool<.3)speed*=1.7;if(e.type===4&&d<180)speed*=.2;if(d>8){e.x+=dx/d*speed*dt;e.y+=dy/d*speed*dt}if(e.cool<=0&&(e.kind!=='normal'||e.type===4)){e.attack=.8;e.cool=e.kind==='boss'?3.8:e.kind==='elite'?5.2:3.4}}
e.hit=Math.max(0,e.hit-dt);if(d<e.r+10)hurt(s,e.kind==='boss'?20:e.kind==='elite'?16:9);if(s.mode!=='playing')return;if(s.aura&&pulse&&d<48+s.aura*10)hit(s,e,(7+s.aura*5)*s.power);if(orb)for(let i=0;i<orbitCount;i++){let a=s.time*2.6+i*Math.PI*2/orbitCount;if((e.x-p.x-Math.cos(a)*66)**2+(e.y-p.y-Math.sin(a)*66)**2<(e.r+10)**2)hit(s,e,14*s.power)}if(s.mode!=='playing')return;
// Keep the playable swarm nearby without teleporting into the viewport.
if(e.kind==='normal'&&d>Math.hypot(w,h)*1.7){e.hp=0}}
// Spatial grid narrows bullet checks to nearby enemies.
let grid=new Map();for(let e of s.enemies)if(e.hp>0){let k=Math.floor(e.x/64)+','+Math.floor(e.y/64);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(e)}
for(let b of s.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let gx=Math.floor(b.x/64),gy=Math.floor(b.y/64);outer:for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++)for(let e of grid.get(x+','+y)||[])if(e.hp>0&&b.hit!==e&&dsq(b,e)<(e.r+5)**2){hit(s,e,b.damage);b.hit=e;if(b.pierce>0)b.pierce--;else{b.life=0;break outer}}if(s.mode!=='playing')return}s.bullets=s.bullets.filter(b=>b.life>0);s.enemies=s.enemies.filter(e=>e.hp>0);
for(let b of s.hostile){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(dsq(b,p)<15**2){hurt(s,12);b.life=0}}s.hostile=s.hostile.filter(b=>b.life>0);for(let z of s.hazards){z.t-=dt;if(z.t<=0&&!z.done){z.done=true;if(dsq(z,p)<z.r**2)hurt(s,18);effect(s,z.x,z.y,'#d45a48',7)}}s.hazards=s.hazards.filter(z=>z.t>-.25);if(s.mode!=='playing')return;
for(let g of s.gems){let d=dsq(g,p);if(d<s.magnet**2){g.x+=(p.x-g.x)*Math.min(1,dt*8);g.y+=(p.y-g.y)*Math.min(1,dt*8)}if(d<18**2){g.dead=true;if(g.kind==='heal')p.hp=Math.min(p.maxHp,p.hp+g.value);else s.xp+=g.value*s.growth}}s.gems=s.gems.filter(g=>!g.dead);if(s.gems.length>260)s.gems.splice(0,s.gems.length-260);for(let c of s.chests)if(dsq(c,p)<23**2){s.chests=s.chests.filter(x=>x!==c);s.mode='chest';s.chest={open:false};s.events.push('chest');return}
for(let f of s.fx){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt}s.fx=s.fx.filter(f=>f.life>0);if(s.xp>=s.need){s.xp-=s.need;s.level++;s.need=Math.round(s.need*1.14+2);let list=choices(s);if(list.length){s.mode='upgrade';s.choices=list;s.events.push('upgrade')}else{p.hp=Math.min(p.maxHp,p.hp+12)}}if(s.events.length>24)s.events.splice(0,s.events.length-24)}
