import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,spawn,cameraTarget,cameraTuning} from '../core.mjs';
import {songInfo,stageSongs} from '../audio.mjs';

const halo=(char=0)=>createRun(char,0,undefined,()=>.5,'campaign',{edition:'halotei',stage:0});
const crowd=(s,n)=>{for(let i=0;i<n;i++){const e=spawn(s,0);e.x=s.p.x+(i%10-5)*30;e.y=s.p.y+(Math.floor(i/10)-2)*40}};

test('camera stays at 1x when calm and pulls back as the crowd grows',()=>{
 const s=halo();assert.equal(cameraTarget(s,390,844).zoom,1);
 crowd(s,20);const mid=cameraTarget(s,390,844).zoom;crowd(s,40);const far=cameraTarget(s,390,844).zoom;
 assert.ok(mid<1&&far<mid,'zoom '+mid+' -> '+far);assert.ok(far>=cameraTuning.minPhone);
});

test('wide melee reach and bosses pull the camera back; Bito edition never zooms',()=>{
 const don=halo(7);don.shots=12;don.evolved=true;assert.ok(cameraTarget(don,390,844).zoom<1);
 const b=halo();spawn(b,7,390,844,'boss');const t=cameraTarget(b,1280,800);assert.equal(t.boss,true);assert.ok(t.zoom<=cameraTuning.bossZoom);
 const bito=createRun(0,0);crowd(bito,60);assert.equal(cameraTarget(bito,390,844).zoom,1);
 assert.equal(cameraTarget(null).zoom,1);
});

test('every stage song has a melody that fills its bars exactly',()=>{
 for(const n of [...stageSongs,'title']){const i=songInfo(n);assert.ok(i);assert.equal(i.steps,i.loop,n)}
});
