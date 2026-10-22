import artData from './art-data.mjs?v=10';
// 素材の実測矩形と共通スケールで足元を固定。コード描画は確認・読込失敗時の代替用。
let atlas=null;
export function setEnemyAtlas(image){atlas=image}
export const enemyColors=['#ba8bdb','#d77d9d','#94bfa2','#e7e4d1','#f2ad52','#a4d4df','#ee8b70','#c49de8','#d2a66b','#81c8b3','#f59b68','#d8c681'];
export function enemyPose(e,time,reduced=false){
 const floating=[1,3,10].includes(e.type),speed=e.type===1?9:e.type===9?10:5;
 return {frame:reduced?0:e.attack>0?3:e.charge>0?2:Math.floor(time*speed+(e.phase||0))%4,
  bob:reduced?0:Math.round(Math.sin(time*(floating?5:8)+(e.phase||0))*(floating?3:1)),flip:e.aimX!==undefined&&e.aimX<e.x?-1:1};
}
export function paintEnemy(g,type,frame=0){
 const ink='#181326',light='#fff1cc',color=enemyColors[type],step=[0,1,0,-1][frame],attack=frame===3;
 const r=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 const box=(x,y,w,h,c)=>{r(x,y,w,h,ink);r(x+1,y+1,w-2,h-2,c)};
 const eyes=(x=12,y=13,c=light)=>{r(x,y,2,2,c);r(x+6,y,2,2,c);r(x+1,y,1,1,ink);r(x+7,y,1,1,ink)};
 const feet=(c=ink)=>{r(9,26+step,5,3,c);r(19,26-step,5,3,c)};
 const coat=()=>{box(9,16,15,11,color);r(11,18,4,6,'#ffffff24');feet();};
 if(type===0){box(7,16-step,20,12+step,color);r(10,13-step,14,5,color);r(10,16,6,2,'#e0b3ef');r(9,26,4,2,ink);r(21,26,4,2,ink);eyes(11,20)}
 if(type===1){let wing=[4,8,12,7][frame];box(13,12,8,12,color);r(13,9,3,5,ink);r(18,9,3,5,ink);for(let i=0;i<3;i++){box(3+i*3,wing+i*2,5,10-i*2,'#854a77');box(25-i*3,wing+i*2,5,10-i*2,'#854a77')}eyes(13,15);r(16,21,2,2,light)}
 if(type===2){coat();box(10,6,14,12,color);r(11,8,5,3,'#b9d4a7');eyes(11,11);r(14,16,7,1,ink);box(5,18+step,5,8,color);box(24,17-step,5,8,color);r(16,18,2,7,'#62445d');r(20,22,3,3,'#725277')}
 if(type===3){box(9,8,16,15,color);r(11,6,12,4,color);for(let i=0;i<4;i++)r(9+i*4,21,3,5+((i+frame)%3),color);r(11,12,3,5,ink);r(19,12,3,5,ink);r(15,20,3,2,'#8d81a0')}
 if(type===4){coat();box(7,8,20,12,color);r(10,6,14,3,color);r(16,3,3,5,'#76a380');r(10,10,2,7,'#c16f3c');r(22,10,2,7,'#c16f3c');eyes(11,11);r(12,16,10,2,ink);r(15,16,2,1,light);box(4,19,5,6,'#886b70');box(24,19,5,6,'#886b70')}
 if(type===5){coat();box(11,5,12,11,'#e2dec8');eyes(11,9,ink);r(15,13,4,2,ink);r(9,16,16,3,'#6cabc1');box(3,17,8,11,'#6d8d9d');r(6,19,2,7,light);r(4,21,6,2,light);r(26,9,2,17,ink);r(25,8,4,12,'#d9e8d8');r(24,22,6,2,color)}
 if(type===6){box(6,12,22,15,color);box(9,5,16,14,color);r(7,3,4,7,'#ddd3b6');r(23,3,4,7,'#ddd3b6');eyes(11,10);r(11,15,12,3,ink);r(12,15,2,2,light);r(20,15,2,2,light);box(2,17-step,6,11,color);box(27,17+step,5,11,color);r(8,25,18,3,'#745072');feet()}
 if(type===7){box(8,13,18,15,'#6c478c');r(5,25,24,4,'#6c478c');box(11,5,12,12,'#e0d7c4');r(8,2,4,8,'#ae8acc');r(23,2,4,8,'#ae8acc');eyes(11,9,'#f5b978');r(15,14,4,2,ink);r(15,18,3,7,color);r(29,8,2,21,'#c6ab6e');box(26,2,6,7,attack?'#fff1cc':color);r(6,17+step,4,6,color)}
 if(type===8){let jaw=[0,2,4,5][frame];box(5,16,24,12,'#946442');box(5,10-jaw,24,8,color);r(7,17-jaw,20,3+jaw,ink);for(let x=8;x<27;x+=4){r(x,17-jaw,2,3,light);r(x,22,2,2,light)}r(7,12-jaw,2,3,'#efcf81');r(25,12-jaw,2,3,'#efcf81');r(16,22,6,3,'#c47aa0');r(16,25,3,2,color);r(3,25,4,3,ink);r(28,25,3,3,ink)}
 if(type===9){for(let i=0;i<4;i++){let y=11+i*4,offset=(i+frame)%2;box(3-offset,y,9,3,'#4d7b83');box(22+offset,y,9,3,'#4d7b83');r(2-offset,y+2,2,4,ink);r(30+offset,y+2,2,4,ink)}box(10,14,14,13,color);box(12,9,10,9,'#629b91');r(12,17,10,2,'#507b83');eyes(12,11,'#ffd48a');r(13,24,2,4,light);r(19,24,2,4,light)}
 if(type===10){r(16,2,1,5,ink);box(10,6,14,3,'#73606e');box(8,9,18,15,'#c16454');r(11,10,12,13,color);for(let y=11;y<24;y+=4)r(9,y,16,1,'#9c4a4a');box(13,12,9,6,light);r(17,13,3,4,ink);r(12,21,10,2,ink);r(16,24,2,5,color);r(13+step,28,7,2,color)}
 if(type===11){coat();box(7,5,20,17,color);r(10,8,14,11,'#f2e5b4');r(11,9,12,1,'#7a846f');r(16,10,1,7,ink);r(17,15,5,1,ink);r(9,12,2,2,'#7a846f');r(23,12,2,2,'#7a846f');r(16,2,3,4,'#a99c68');r(26,17,3,11,'#b9d7d3');r(24,26,7,2,color);r(4,20+step,5,5,'#7895a6')}
}
export function makeEnemySprite(type,frame){const c=document.createElement('canvas');c.width=c.height=112;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(atlas){const pair=artData.enemy[type],f=pair[frame%2],scale=Math.min(98/Math.max(...pair.map(p=>p.w)),98/Math.max(...pair.map(p=>p.h)));g.drawImage(atlas,f.x,f.y,f.w,f.h,56-f.anchorX*scale,104-f.h*scale,f.w*scale,f.h*scale)}else{g.scale(112/34,112/34);paintEnemy(g,type,frame)}return c}
