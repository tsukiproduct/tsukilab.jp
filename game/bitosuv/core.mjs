export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const chars=[
 {name:'Bito',en:'BLACK SUIT',desc:'メガネレーザーで貫通射撃。経験値 +12%。',hp:110,speed:150,power:1,xp:1.12,magnet:90,shots:1,aura:0,orbit:0,crit:.05},
 {name:'赤マント',en:'RED CAPE',desc:'追尾する吸血コウモリ。撃破で少し回復。',hp:115,speed:145,power:1.08,xp:1,magnet:85,shots:1,aura:1,orbit:0,crit:.05},
 {name:'オペラ座',en:'THE OPERA',desc:'仮面の刃を扇状に投げる、貫通の射手。',hp:90,speed:150,power:.95,xp:1,magnet:90,shots:2,aura:0,orbit:0,crit:.1},
 {name:'うさBito',en:'USA BITO',desc:'にんじんブーメラン。往復攻撃と俊足。',hp:90,speed:185,power:.95,xp:1.05,magnet:130,shots:1,aura:0,orbit:0,crit:.05},
 {name:'吟遊詩人',en:'THE BARD',desc:'響く音の輪で、周囲をまとめて攻撃。',hp:105,speed:145,power:1,xp:1,magnet:90,shots:1,aura:1,orbit:1,crit:.05},
 {name:'水着Bito',en:'SUMMER BITO',desc:'弾ける水玉で範囲攻撃。最速・会心25%。',hp:80,speed:200,power:1.1,xp:1,magnet:100,shots:1,aura:0,orbit:0,crit:.25},
 {name:'猫娘',en:'NEKOMUSUME',desc:'紅蓮の爪で前方を薙ぐ。火傷と俊足。',hp:98,speed:175,power:1,xp:1.08,magnet:105,shots:1,aura:1,orbit:0,crit:.12},
 {name:'ドン',en:'DON',desc:'衝撃波で敵を押し返す。高体力と軽減。',hp:150,speed:130,power:.95,xp:1,magnet:115,shots:1,aura:1,orbit:0,crit:.05,armor:2}
];
export const weaponDefs=[
 {name:'メガネレーザー',icon:'glasses',kind:'laser',interval:.60,damage:26,color:'#b9efca',desc:'高速レーザーで敵を貫通する。'},
 {name:'吸血コウモリ',icon:'bat',kind:'bat',interval:.85,damage:15,color:'#c77da1',desc:'2羽のコウモリが追尾。撃破で体力を少し回復。'},
 {name:'仮面の刃',icon:'blade',kind:'blade',interval:.85,damage:13,color:'#ece2c7',desc:'扇状に3本の刃を投げ、敵を貫通する。'},
 {name:'にんじんブーメラン',icon:'carrot',kind:'carrot',interval:.95,damage:22,color:'#efa14f',desc:'貫通にんじんが飛び、手元へ戻る。往復で攻撃。'},
 {name:'響け、夜の詩',icon:'note',kind:'sound',interval:1.15,damage:25,color:'#d8a9ee',desc:'広がる音の輪が周囲の敵を攻撃。'},
 {name:'スプラッシュバブル',icon:'water',kind:'water',interval:.90,damage:28,color:'#86d7ee',desc:'水玉が命中すると弾け、周囲にもダメージ。'},
 {name:'紅蓮の爪',icon:'flame',kind:'flame',interval:.80,damage:30,color:'#ef825b',desc:'前方を炎の爪で薙ぎ、2秒間の火傷を与える。'},
 {name:'ドン！と一撃',icon:'slam',kind:'slam',interval:1.25,damage:37,color:'#d7edf1',desc:'足元から衝撃波。周囲の敵を押し返す。'}
];
export function upgradeLabel(s,u){if(u.id==='aura')return {...u,name:['ブラックオーラ','血の帳','仮面の結界','うさぎの足音','伴奏フィールド','水のヴェール','紅蓮の結界','もふもふバリア'][s.char]};if(u.id==='orbit')return {...u,name:['回転する名刺','旋回コウモリ','回転する刃','回転にんじん','回転する音符','回転する水玉','舞う花札','回転キャンディ'][s.char],icon:weaponDefs[s.char].icon};if(u.id==='power')return {...u,name:weaponDefs[s.char].name+'・威力',icon:weaponDefs[s.char].icon};if(u.id==='shots'&&['sound','flame','slam'].includes(weaponDefs[s.char].kind))return {...u,name:'技の範囲拡大',desc:'主力技の範囲を拡大',icon:weaponDefs[s.char].icon};return u}
export function attackSize(s){let kind=weaponDefs[s.char].kind;return kind==='sound'?140+s.shots*10:kind==='flame'?100+s.shots*7:kind==='slam'?98+s.shots*7:0}
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
export function unlockedCharacters(save){let n=unlockCount(save),ids=Array.from({length:n},(_,i)=>i);if(n>=2)ids.push(6);if(n>=3)ids.push(7);return ids}
export function metaCost(rank){return 40+rank*35}
export function purchase(save,id){if(!metaDefs.some(m=>m.id===id))return false;let r=save.meta[id];if(r>=5||save.coins<metaCost(r))return false;save.coins-=metaCost(r);save.meta[id]++;return true}
export function settle(save,s){if(s.settled)return {coins:0,unlocked:null};s.settled=true;let before=unlockCount(save),win=s.mode==='win';save.runs++;save.best=Math.max(save.best,s.kills);let coins=Math.floor((s.kills*.3+s.time*.08+(win?45:0))*s.d.coin);save.coins=clamp(save.coins+coins,0,999999);if(win&&s.runMode!=='survival')save.clears[s.diff]=true;return {coins,unlocked:unlockCount(save)>before?chars[before].name:null}}
export function chestRoll(r, luck=0){r=Math.min(.999999,r+clamp(luck,0,5)*.014);return r<.45?1:r<.72?2:r<.88?3:r<.97?4:5}
export function createRun(char=0,diff=0,save=validateSave(null),rng=Math.random,runMode='campaign'){char=clamp(Math.floor(char),0,7);diff=clamp(Math.floor(diff),0,4);let c=chars[char];return {mode:'playing',runMode,limit:runMode==='survival'?480:Infinity,char,diff,d:difficulties[diff],rng,time:0,p:{x:0,y:0,hp:c.hp+save.meta.health*8,maxHp:c.hp+save.meta.health*8,speed:c.speed,inv:0,face:1,direction:0,dx:0,dy:0,walk:0,moving:false,dash:0,dashCd:0},power:c.power*(1+save.meta.power*.05),rate:1,shots:c.shots,aura:c.aura,orbit:c.orbit,magnet:c.magnet,crit:c.crit,armor:c.armor||0,growth:c.xp/(1+diff*.1),luck:save.meta.luck,ranks:Object.fromEntries(upgradeDefs.map(u=>[u.id,0])),level:1,xp:0,need:7,kills:0,spawn:0,fire:0,pulse:0,orbitTick:0,eliteIndex:0,boss:false,enemies:[],bullets:[],waves:[],bursts:[],hostile:[],gems:[],chests:[],hazards:[],fx:[],events:[],choices:[],chest:null,shake:0,toast:'',toastTime:0,settled:false}}
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
export function spawn(s,type,w=390,h=780,kind='normal'){let def=enemyDefs[type],a=s.rng()*Math.PI*2;let radius=Math.hypot(w,h)/2+45;let x=s.p.x+Math.cos(a)*radius,y=s.p.y+Math.sin(a)*radius;let hp=def.hp*(kind==='boss'||kind==='elite'?s.d.boss:s.d.hp*(1+s.time/500)*(s.runMode==='survival'?1+Math.max(0,s.time-180)/220:1));let e={...def,type,x,y,hp,max:hp,speed:def.speed*s.d.speed*(s.runMode==='survival'?1+Math.min(.5,Math.max(0,s.time-180)/600):0+1),kind,hit:0,cool:kind==='normal'?2.8:2,phase:s.rng()*6.28,attack:0,ax:0,ay:0};s.enemies.push(e);return e}
function effect(s,x,y,color,count=4){for(let i=0;i<count&&s.fx.length<90;i++)s.fx.push({x,y,vx:(s.rng()-.5)*100,vy:(s.rng()-.5)*100,life:.45,color})}
export function hit(s,e,d){if(e.hp<=0||s.mode!=='playing')return;e.hp-=d;e.hit=.12;if(e.hp<=0){s.kills++;if(s.char===1)s.p.hp=Math.min(s.p.maxHp,s.p.hp+.45);s.gems.push({x:e.x,y:e.y,value:e.xp,kind:'xp'});effect(s,e.x,e.y,['#a26ac8','#de675f','#87a783','#ccc9b8','#ce8b46','#779fac','#d76545','#b682c7'][e.type]);if(e.kind==='elite'){s.chests.push({x:e.x,y:e.y});s.toast='宝箱を回収せよ';s.toastTime=2}else if(e.kind==='boss'){if(s.runMode==='survival'){s.chests.push({x:e.x,y:e.y});s.toast='魔王撃破！まだ夜は続く';s.toastTime=3;s.events.push('elite')}else{s.mode='win';s.events.push('win')}}else if(s.rng()<.035)s.gems.push({x:e.x+5,y:e.y,kind:'heal',value:18})}}
function hurt(s,n){if(s.p.inv>0)return;s.p.hp-=Math.max(2,n*s.d.damage-s.armor);s.p.inv=.7;s.shake=.18;effect(s,s.p.x,s.p.y,'#e45a45',5);s.events.push('hurt');if(s.p.hp<=0){s.p.hp=0;s.mode='dead';s.events.push('dead')}}
const dsq=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
function nearest(s){let out=null,best=Infinity;for(let e of s.enemies)if(e.hp>0){let d=dsq(e,s.p);if(d<best){best=d;out=e}}return out}
function attack(s,e){if(e.kind!=='normal'){let count=e.kind==='boss'?8+s.diff*2:4+Math.floor(s.diff/2),rotation=s.rng()*6.28;for(let i=0;i<count&&s.hostile.length<65;i++){let a=rotation+i*6.28/count;s.hostile.push({x:e.x,y:e.y,vx:Math.cos(a)*(95+s.diff*5),vy:Math.sin(a)*(95+s.diff*5),life:4})}s.hazards.push({x:s.p.x,y:s.p.y,r:e.kind==='boss'?62:44,t:.9,done:false})}else if(e.type===4&&s.hostile.length<65){let a=Math.atan2(s.p.y-e.y,s.p.x-e.x);s.hostile.push({x:e.x,y:e.y,vx:Math.cos(a)*85,vy:Math.sin(a)*85,life:4})}}
export function fireWeapon(s){const w=weaponDefs[s.char],p=s.p,target=nearest(s);if(!target)return false;const angle=Math.atan2(target.y-p.y,target.x-p.x),critical=()=>s.rng()<s.crit?2:1;s.fire=Math.max(.12,w.interval/s.rate);
 if(['flame','slam'].includes(w.kind)){let radius=attackSize(s),half=.72+(s.shots-1)*.06;s.bursts.push({kind:w.kind,x:p.x,y:p.y,angle,half,radius,life:.32,maxLife:.32,color:w.color});if(s.bursts.length>40)s.bursts.shift();for(const e of s.enemies){if(e.hp<=0)continue;let dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);let delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));if(d>radius+e.r||(w.kind==='flame'&&Math.abs(delta)>half))continue;hit(s,e,w.damage*s.power*critical());if(w.kind==='flame'&&e.hp>0){e.burn=2;e.burnTick=.5;e.burnDamage=3*s.power}else if(w.kind==='slam'&&e.hp>0){let push=e.kind==='normal'?42:10;e.x+=dx/(d||1)*push;e.y+=dy/(d||1)*push}if(s.mode!=='playing')break}
 }else if(w.kind==='sound'){s.waves.push({x:p.x,y:p.y,radius:0,maxRadius:attackSize(s),speed:260,damage:w.damage*s.power*critical(),hits:new Set(),kind:'sound',life:1.2});if(s.waves.length>12)s.waves.shift();
 }else{const extra=w.kind==='bat'||w.kind==='blade'?1:0,count=Math.min(7,s.shots+extra),spread=w.kind==='blade'?.23:w.kind==='bat'?.20:.105,speed=w.kind==='laser'?520:w.kind==='bat'?235:w.kind==='carrot'?305:w.kind==='water'?260:350;for(let i=0;i<count&&s.bullets.length<100;i++){const a=angle+(i-(count-1)/2)*spread;s.bullets.push({x:p.x,y:p.y-7,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,speed,age:0,life:w.kind==='carrot'?2.1:1.9,damage:w.damage*s.power*critical(),kind:w.kind,pierce:w.kind==='laser'||w.kind==='blade'?1+(s.ranks.power>=6?1:0):w.kind==='carrot'?99:0,hits:new Set(),returning:false})}}
 s.events.push('shot');return true}
function advanceWeapons(s,dt){for(const wave of s.waves){wave.radius=Math.min(wave.maxRadius,wave.radius+wave.speed*dt);wave.life-=dt;for(const e of s.enemies)if(e.hp>0&&!wave.hits.has(e)&&(e.x-wave.x)**2+(e.y-wave.y)**2<=(wave.radius+e.r)**2){wave.hits.add(e);hit(s,e,wave.damage);if(s.mode!=='playing')return}if(wave.radius>=wave.maxRadius)wave.life=0}s.waves=s.waves.filter(w=>w.life>0);for(const b of s.bursts)b.life-=dt;s.bursts=s.bursts.filter(b=>b.life>0)}
export function step(s,dt,input={},w=390,h=780){if(s.mode!=='playing')return;dt=clamp(dt,0,.05);let p=s.p;s.time+=dt;if(s.runMode==='survival'&&s.time>=480){s.time=480;s.mode='win';s.events.push('win');return}s.toastTime-=dt;s.shake=Math.max(0,s.shake-dt);p.inv=Math.max(0,p.inv-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.dash=Math.max(0,p.dash-dt);let mx=Number.isFinite(input.x)?input.x:0,my=Number.isFinite(input.y)?input.y:0,l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}p.moving=l>.08;if(input.dash&&p.dashCd<=0&&p.moving){p.dash=.2;p.dashCd=6;p.inv=.35;s.events.push('dash')}if(p.moving){let speed=p.speed*(p.dash>0?3.2:1);p.x+=mx*speed*dt;p.y+=my*speed*dt;p.walk+=Math.hypot(mx,my)*p.speed*dt;p.dx=mx;p.dy=my;let ax=Math.abs(mx),ay=Math.abs(my);if(ax>ay+.08)p.direction=mx<0?2:1;else if(ay>ax+.08)p.direction=my<0?3:0;p.face=p.direction===2?-1:p.direction===1?1:p.face}
let elites=[45,100,150];if(s.eliteIndex<3&&s.time>=elites[s.eliteIndex]){s.eliteIndex++;spawn(s,6,w,h,'elite');s.toast='鬼部長 出現';s.toastTime=2;s.events.push('elite')}if(!s.boss&&s.time>=180){s.boss=true;spawn(s,7,w,h,'boss');s.toast='最後の依頼人';s.toastTime=3;s.events.push('boss')}if(s.runMode==='survival'&&s.time>=240+60*(s.survivalBosses||0)&&(s.survivalBosses||0)<4){s.survivalBosses=(s.survivalBosses||0)+1;spawn(s,7,w,h,'boss');s.toast='魔王 再来';s.toastTime=2;s.events.push('boss')}
s.spawn-=dt;const normal=s.enemies.filter(e=>e.kind==='normal'&&e.hp>0).length;let cap=72+s.diff*6;if(s.spawn<=0&&normal<cap){s.spawn=Math.max(.17,(.78-s.time*.0027)/s.d.density);let r=s.rng(),type=s.time<15?0:s.time<40?(r<.6?0:1):s.time<75?(r<.3?2:r<.65?1:0):s.time<120?(r<.25?3:r<.5?2:r<.7?1:0):(r<.2?4:r<.4?5:r<.6?3:r<.8?2:1);spawn(s,type,w,h)}
s.fire-=dt;if(s.fire<=0)fireWeapon(s);if(s.mode!=='playing')return;advanceWeapons(s,dt);if(s.mode!=='playing')return;
s.pulse-=dt;s.orbitTick-=dt;let pulse=s.pulse<=0,orb=s.orbitTick<=0;if(pulse)s.pulse=.65;if(orb)s.orbitTick=.22;let orbitCount=Math.min(6,s.orbit);
for(let e of s.enemies){if(e.hp<=0)continue;if(e.burn>0){e.burn-=dt;e.burnTick-=dt;if(e.burnTick<=0){e.burnTick=.5;hit(s,e,e.burnDamage);if(s.mode!=='playing')return}if(e.hp<=0)continue}let dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(e.attack>0){e.attack-=dt;if(e.attack<=0)attack(s,e)}else{e.cool-=dt;let speed=e.speed;if(e.type===1)speed*=1+.18*Math.sin(s.time*5+e.phase);if(e.type===5&&e.cool<.3)speed*=1.7;if(e.type===4&&d<180)speed*=.2;if(d>8){e.x+=dx/d*speed*dt;e.y+=dy/d*speed*dt}if(e.cool<=0&&(e.kind!=='normal'||e.type===4)){e.attack=.8;e.cool=e.kind==='boss'?3.8:e.kind==='elite'?5.2:3.4}}
e.hit=Math.max(0,e.hit-dt);if(d<e.r+10)hurt(s,e.kind==='boss'?20:e.kind==='elite'?16:9);if(s.mode!=='playing')return;if(s.aura&&pulse&&d<48+s.aura*10)hit(s,e,(7+s.aura*5)*s.power);if(orb)for(let i=0;i<orbitCount;i++){let a=s.time*2.6+i*Math.PI*2/orbitCount;if((e.x-p.x-Math.cos(a)*66)**2+(e.y-p.y-Math.sin(a)*66)**2<(e.r+10)**2)hit(s,e,14*s.power)}if(s.mode!=='playing')return;
// Keep the playable swarm nearby without teleporting into the viewport.
if(e.kind==='normal'&&d>Math.hypot(w,h)*1.7){e.hp=0}}
// Spatial grid narrows bullet checks to nearby enemies.
let grid=new Map();for(let e of s.enemies)if(e.hp>0){let k=Math.floor(e.x/64)+','+Math.floor(e.y/64);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(e)}
for(let b of s.bullets){b.age+=dt;if(b.kind==='bat'){let target=nearest(s);if(target){let a=Math.atan2(target.y-b.y,target.x-b.x),k=Math.min(1,dt*4);b.vx+=(Math.cos(a)*b.speed-b.vx)*k;b.vy+=(Math.sin(a)*b.speed-b.vy)*k}}if(b.kind==='carrot'&&b.age>.65){if(!b.returning){b.returning=true;b.hits.clear()}let d=Math.hypot(p.x-b.x,p.y-b.y)||1;b.vx=(p.x-b.x)/d*b.speed;b.vy=(p.y-b.y)/d*b.speed;if(d<12)b.life=0}b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0)continue;let gx=Math.floor(b.x/64),gy=Math.floor(b.y/64);outer:for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++)for(let e of grid.get(x+','+y)||[])if(e.hp>0&&!b.hits.has(e)&&dsq(b,e)<(e.r+5)**2){b.hits.add(e);hit(s,e,b.damage);if(b.kind==='water'){s.bursts.push({kind:'splash',x:b.x,y:b.y,radius:58,life:.3,maxLife:.3,color:'#8bdcef'});if(s.bursts.length>40)s.bursts.shift();for(let other of s.enemies)if(other!==e&&other.hp>0&&dsq(b,other)<(58+other.r)**2){hit(s,other,b.damage*.55);if(s.mode!=='playing')return}}if(s.mode!=='playing')return;if(b.pierce>0)b.pierce--;else{b.life=0;break outer}}}s.bullets=s.bullets.filter(b=>b.life>0);s.enemies=s.enemies.filter(e=>e.hp>0);

for(let b of s.hostile){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(dsq(b,p)<15**2){hurt(s,12);b.life=0}}s.hostile=s.hostile.filter(b=>b.life>0);for(let z of s.hazards){z.t-=dt;if(z.t<=0&&!z.done){z.done=true;if(dsq(z,p)<z.r**2)hurt(s,18);effect(s,z.x,z.y,'#d45a48',7)}}s.hazards=s.hazards.filter(z=>z.t>-.25);if(s.mode!=='playing')return;
for(let g of s.gems){let d=dsq(g,p);if(d<s.magnet**2){g.x+=(p.x-g.x)*Math.min(1,dt*8);g.y+=(p.y-g.y)*Math.min(1,dt*8)}if(d<18**2){g.dead=true;if(g.kind==='heal')p.hp=Math.min(p.maxHp,p.hp+g.value);else s.xp+=g.value*s.growth}}s.gems=s.gems.filter(g=>!g.dead);if(s.gems.length>260)s.gems.splice(0,s.gems.length-260);for(let c of s.chests)if(dsq(c,p)<23**2){s.chests=s.chests.filter(x=>x!==c);s.mode='chest';s.chest={open:false};s.events.push('chest');return}
for(let f of s.fx){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt}s.fx=s.fx.filter(f=>f.life>0);if(s.xp>=s.need){s.xp-=s.need;s.level++;s.need=Math.round(s.need*1.14+2);let list=choices(s);if(list.length){s.mode='upgrade';s.choices=list;s.events.push('upgrade')}else{p.hp=Math.min(p.maxHp,p.hp+12)}}if(s.events.length>24)s.events.splice(0,s.events.length-24)}
