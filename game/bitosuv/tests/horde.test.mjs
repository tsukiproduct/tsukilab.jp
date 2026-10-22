import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,isHorde,ringWave,hordeTuning,chars} from '../core.mjs';
import {rng,bot} from './balance.mjs';

// ハロテイ通常ステージだけが「群れ」調整の対象。ランキングとBito版は従来値のまま。
test('horde tuning applies only to Halotei campaign stages',()=>{
 const camp=createRun(0,0,undefined,rng(1),'campaign',{edition:'halotei',stage:0});
 const ranked=createRun(0,0,undefined,rng(1),'survival',{edition:'halotei'});
 const bito=createRun(0,0,undefined,rng(1),'campaign');
 assert.equal(isHorde(camp),true);assert.equal(isHorde(ranked),false);assert.equal(isHorde(bito),false);
 assert.equal(camp.magnet,chars[0].magnet+hordeTuning.magnet);
 assert.equal(ranked.magnet,chars[0].magnet);assert.equal(bito.magnet,chars[0].magnet);
});

test('ring waves surround the player and never exceed the regular-enemy cap',()=>{
 const s=createRun(0,4,undefined,rng(3),'campaign',{edition:'halotei',stage:2});s.time=125;
 const n=ringWave(s,390,844);
 assert.ok(n>=10);
 const ring=s.enemies.slice(-n);
 assert.ok(ring.some(e=>e.x<s.p.x-150)&&ring.some(e=>e.x>s.p.x+150)&&ring.some(e=>e.y<s.p.y-300)&&ring.some(e=>e.y>s.p.y+300));
 for(let i=0;i<20;i++)ringWave(s,390,844);
 assert.ok(s.enemies.filter(e=>e.kind==='normal').length<=72+s.diff*6);
});

test('a Halotei campaign run keeps a crowd near the player during surges',()=>{
 const s=createRun(0,0,undefined,rng(5),'campaign',{edition:'halotei',stage:0});let peak=0,rings=0;
 for(let i=0;i<60*70&&s.mode!=='dead';i++){if(s.mode!=='playing'){s.mode='playing';continue}step(s,1/60,bot(s));if(s.events.includes('ring'))rings++;s.events.length=0;peak=Math.max(peak,s.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-s.p.x,e.y-s.p.y)<450).length)}
 assert.ok(rings>=2,'ring waves fired');
 assert.ok(peak>=15,'crowd peak '+peak);
});
