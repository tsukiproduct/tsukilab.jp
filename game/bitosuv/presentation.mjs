import {drawWorld} from './world-art.mjs?v=12';
// Visual feedback is separate from simulation. No particles affect damage or clocks.
export function drawTelegraphs(ctx,s){
 for(const e of s.enemies){if(e.hp<=0||e.attack<=0)continue;let progress=1-e.attack/(e.windup||.95);ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.aim||0);ctx.strokeStyle='#f0aa75';ctx.fillStyle='#c9563828';ctx.lineWidth=1.5;
  if(e.pattern==='charge'){let reach=e.type===8?136.5:132.5,width=e.r+10;ctx.fillRect(0,-width,reach,width*2);ctx.strokeRect(0,-width,reach,width*2);ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(reach,0);ctx.lineTo(reach-12,-7);ctx.moveTo(reach,0);ctx.lineTo(reach-12,7);ctx.stroke();ctx.fillStyle='#f0aa75';ctx.fillRect(0,-width,reach*progress,2)}
  else if(e.pattern==='needle'){ctx.lineWidth=3;ctx.strokeStyle='#17101f';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(210,0);ctx.stroke();ctx.strokeStyle='#ffe2a1';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#ffe2a1';ctx.fillRect(202,-3,6,6)}
  else if(e.pattern==='fan'){let half=e.kind==='normal'?.3:.65;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,135,-half,half);ctx.closePath();ctx.fill();for(let a=-half;a<=half+.01;a+=half/2){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*135,Math.sin(a)*135);ctx.stroke()}}
  else if(e.pattern==='ring'){ctx.beginPath();ctx.arc(0,0,e.r+16,.9,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,e.r+20,.9,.9+(Math.PI*2-.9)*progress);ctx.stroke()}
  ctx.restore();
 }
}
export function drawDamage(ctx,s){ctx.save();ctx.textAlign='center';for(let n of s.numbers){ctx.globalAlpha=Math.min(1,n.life*4);ctx.font=(n.big?'bold 13px':'10px')+' monospace';ctx.strokeStyle='#17101f';ctx.lineWidth=3;ctx.strokeText(String(n.value),Math.round(n.x),Math.round(n.y));ctx.fillStyle=n.big?'#f8d69b':'#d9dfd5';ctx.fillText(String(n.value),Math.round(n.x),Math.round(n.y))}ctx.restore()}
export function drawMarkers(ctx,s,W,H,z=1){
 let p=s.p,ox=W/2/z-p.x,oy=H*.57/z-p.y,targets=[...s.chests.map(c=>({...c,chest:true})),...s.enemies.filter(e=>e.kind!=='normal'&&e.hp>0)].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,4);let placed=[];
 for(let t of targets){let sx=(t.x+ox)*z,sy=(t.y+oy)*z;if(sx>24&&sx<W-24&&sy>170&&sy<H-110)continue;let x=Math.min(W-25,Math.max(25,sx)),y=Math.min(H-110,Math.max(185,sy));if(placed.some(a=>Math.hypot(a.x-x,a.y-y)<42))continue;placed.push({x,y});let angle=Math.atan2(sy-y,sx-x);ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=t.chest?'#dfb96d':'#ed9879';ctx.strokeStyle='#17101f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-6);ctx.lineTo(-3,0);ctx.lineTo(-5,6);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();ctx.font='9px monospace';ctx.textAlign='center';ctx.fillStyle=t.chest?'#dfb96d':'#ed9879';ctx.fillText(t.chest?'宝箱':'BOSS',x,y+17)}
}
export function drawLanterns(ctx,minx,miny,W,H,ox,oy){for(let x=minx;x<W-ox+80;x+=80)for(let y=miny;y<H-oy+80;y+=80){let cell=Math.abs(x/80*11+y/80*7);if(cell%31!==0)continue;ctx.fillStyle='#d58c2a08';ctx.beginPath();ctx.arc(x+40,y+15,47,0,Math.PI*2);ctx.fill();ctx.fillStyle='#de983814';ctx.beginPath();ctx.arc(x+40,y+15,28,0,Math.PI*2);ctx.fill();ctx.fillStyle='#554151';ctx.fillRect(x+39,y+16,3,39);ctx.fillStyle='#16121b';ctx.fillRect(x+33,y+5,15,20);ctx.fillRect(x+31,y+3,19,3);ctx.fillStyle='#d8914c';ctx.fillRect(x+36,y+9,9,12);ctx.fillStyle='#f1cd83';ctx.fillRect(x+39,y+10,3,9)}}
export const drawStage=drawWorld;
