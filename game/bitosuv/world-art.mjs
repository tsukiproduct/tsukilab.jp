import artData from './art-data.mjs?v=12';
// 背景の模様は低コントラスト、灯りとランドマークは間隔を空けて配置する。
let scenery=null;
export function setWorldAtlas(image){scenery=image;propCache.clear()}
const palettes=[['#252330','#302c39','#393442','#43444d'],['#2b222f','#352938','#42313e','#51404b'],['#202937','#293343','#344152','#455266']];
const tileCache=new Map(),propCache=new Map();
// 装飾は背景に退かせる。敵の視認性を優先（2026-10 調整）。
export const PROP_SIZE=92,PROP_ALPHA=.55;
const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
function ground(g,stage,variant){
 const p=palettes[stage],r=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 r(0,0,80,80,p[0]);
 if(stage===0){for(let i=0;i<48;i++){let n=hash(i,variant+7),x=n%78,y=(n>>>8)%78;r(x,y,1+n%3,1,p[1]);if(i%7===0){r(x,y-2,1,3,p[2]);r(x+2,y-1,1,2,p[1])}}r(0,39,80,2,'#211f2b');for(let x=4;x<80;x+=18)r(x,39,12,1,p[1])}
 else{for(let row=0;row<4;row++)for(let col=-1;col<4;col++){let x=col*28+(row%2)*14,y=row*20;r(x+1,y+1,26,18,p[1]);r(x+2,y+2,24,1,p[2]);r(x+25,y+3,1,14,p[0]);let n=hash(col+variant*5,row);if(n%3===0){r(x+8,y+11,5,1,p[2]);r(x+12,y+12,1,3,p[2])}}if(stage===2&&variant===0){r(38,0,2,80,'#655c49');r(0,38,80,2,'#655c49');r(37,37,4,4,'#938465')}}
}
function prop(g,stage,variant){
 if(scenery){const f=artData.props[stage][variant%2],scale=Math.min(60/f.w,60/f.h);g.globalAlpha=.78;g.drawImage(scenery,f.x,f.y,f.w,f.h,32-f.w*scale/2,60-f.h*scale,f.w*scale,f.h*scale);g.globalAlpha=1;return}
 const r=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)},ink='#191c29';
 const box=(x,y,w,h,c)=>{r(x,y,w,h,ink);r(x+2,y+2,w-4,h-4,c)};
 const lantern=(x,y)=>{r(x+4,y-3,1,4,'#777087');box(x,y,11,16,'#a25340');r(x+3,y+3,5,10,'#e5a65e');r(x+5,y+3,1,10,'#ffe0a0');r(x+4,y+16,2,4,'#b9875c')};
 if(stage===0){
  if(variant===0){r(7,50,50,5,'#20202c');box(15,17,35,36,'#575869');r(20,13,25,7,'#626575');r(24,9,17,5,'#626575');r(18,21,3,28,'#737584');r(24,23,19,22,'#3a3c4c');r(32,25,3,15,'#7e8190');r(27,30,13,3,'#7e8190');r(21,48,5,2,'#637c73');r(39,46,8,3,'#637c73');for(let i=0;i<4;i++){r(3+i*16,37,2,17,'#363d49');r(3+i*16,40,12,2,'#363d49')}}
  else if(variant===1){r(29,17,5,37,'#4a3e4c');r(21,25,10,4,'#4a3e4c');r(18,16,4,13,'#4a3e4c');r(32,32,15,4,'#4a3e4c');r(44,21,4,13,'#4a3e4c');r(32,13,10,4,'#4a3e4c');r(39,8,3,7,'#4a3e4c');r(26,51,13,3,'#3d3544')}
  else{box(12,34,30,21,'#a56d3c');r(16,31,22,5,'#b57b43');r(19,36,3,15,'#c89350');r(34,36,2,15,'#8d552f');r(25,25,4,8,'#778564');r(18,40,5,4,'#f2cb7c');r(31,40,5,4,'#f2cb7c');r(23,48,9,2,'#f2cb7c');lantern(46,20)}
 }else if(stage===1){
  if(variant===0){box(7,22,51,34,'#503c48');r(11,28,4,24,'#8b6b63');r(50,28,4,24,'#8b6b63');r(14,29,36,17,'#251f2d');r(5,18,55,9,'#975954');for(let i=0;i<6;i++)r(7+i*9,19,5,8,'#bd8672');r(4,27,57,3,'#3e2a38');box(11,43,44,9,'#8b6551');r(17,40,6,3,'#ad966b');r(31,38,9,5,'#be8c59');r(23,9,3,10,'#675665');lantern(13,4);lantern(41,4)}
  else if(variant===1){r(7,13,50,1,'#75606d');r(7,13,2,41,'#4b3e50');r(55,13,2,41,'#4b3e50');lantern(13,15);lantern(30,19);lantern(46,15)}
  else{box(15,33,31,22,'#574954');r(19,30,23,5,'#9b7359');r(20,38,21,2,'#ac8b68');r(20,45,21,2,'#ac8b68');box(24,19,13,13,'#a38361');r(28,22,5,6,'#d8b77f')}
 }else{
  if(variant===0){box(15,20,34,35,'#4d5d73');r(19,16,26,6,'#6c7d90');for(let i=0;i<5;i++)r(15+i*3,16-i*3,34-i*6,3,'#45556d');r(19,24,4,28,'#718193');r(41,24,4,28,'#718193');box(25,24,14,19,'#263343');r(27,27,10,12,'#d1c38d');r(31,28,1,8,'#454454');r(32,34,4,1,'#454454');r(25,47,14,6,'#303e53');r(12,54,40,3,'#38465b')}
  else if(variant===1){box(13,18,40,37,'#3c4b60');r(12,15,42,5,'#647184');for(let x=17;x<52;x+=8){r(x,24,3,27,'#1b2636');r(x+1,24,1,27,'#71808a')}r(13,29,40,2,'#89917c');r(13,44,40,2,'#89917c')}
  else{box(21,15,20,40,'#46576c');r(18,12,26,6,'#6b798c');r(25,20,3,29,'#718096');r(18,50,26,6,'#52657b');lantern(45,30)}
 }
}
function cached(cache,key,w,h,paint){if(cache.has(key))return cache.get(key);if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;paint(g);cache.set(key,c);return c}
export function drawWorld(ctx,stage,minx,miny,W,H,ox,oy,time=0,reduced=false){
 stage=Number.isInteger(stage)&&stage>=0&&stage<3?stage:0;
 const tile=160,startX=Math.floor(-ox/tile)*tile,startY=Math.floor(-oy/tile)*tile;
 for(let x=startX;x<W-ox+tile;x+=tile)for(let y=startY;y<H-oy+tile;y+=tile){let variant=hash(x/tile,y/tile)%4,c=cached(tileCache,stage+','+variant,80,80,g=>ground(g,stage,variant));if(c)ctx.drawImage(c,x,y,tile,tile);else{ctx.save();ctx.translate(x,y);ctx.scale(2,2);ground(ctx,stage,variant);ctx.restore()}}
 const block=320,bx=Math.floor((-ox-128)/block)*block,by=Math.floor((-oy-128)/block)*block;
 for(let x=bx;x<W-ox+block;x+=block)for(let y=by;y<H-oy+block;y+=block){let n=hash(x/block,y/block),variant=n%3,px=x+50+n%90,py=y+40+(n>>>9)%90,c=cached(propCache,stage+','+variant,64,64,g=>prop(g,stage,variant));ctx.globalAlpha=PROP_ALPHA;if(c)ctx.drawImage(c,px+(128-PROP_SIZE)/2,py+(128-PROP_SIZE),PROP_SIZE,PROP_SIZE);else{ctx.save();ctx.translate(px+(128-PROP_SIZE)/2,py+(128-PROP_SIZE));ctx.scale(PROP_SIZE/64,PROP_SIZE/64);prop(ctx,stage,variant);ctx.restore()}ctx.globalAlpha=1;
  if(!reduced){ctx.fillStyle='#edc985';for(let i=0;i<2;i++){const phase=time*.65+i*3+n%9;ctx.globalAlpha=.18+.14*Math.sin(phase);ctx.fillRect(Math.round(px+25+i*53+Math.sin(phase)*8),Math.round(py+15+i*24-Math.cos(phase)*12),2,2)}ctx.globalAlpha=1}
 }
}
