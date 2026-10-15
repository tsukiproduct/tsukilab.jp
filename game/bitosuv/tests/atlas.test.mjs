import test from 'node:test';
import assert from 'node:assert/strict';
import artData from '../art-data.mjs';
import {makeEnemySprite,setEnemyAtlas} from '../enemy-art.mjs';
test('24 measured enemy rectangles and six scenery crops stay within their atlas and never overlap',()=>{
 const enemy=artData.enemy.flat();assert.equal(enemy.length,24);assert.equal(artData.props.flat().length,6);
 for(const [frames,width,height] of [[enemy,1024,1536],[artData.props.flat(),1536,1024]])for(let i=0;i<frames.length;i++){
  const f=frames[i];assert.ok(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=width&&f.y+f.h<=height);
  for(let j=i+1;j<frames.length;j++){const b=frames[j];assert.ok(f.x+f.w<=b.x||b.x+b.w<=f.x||f.y+f.h<=b.y||b.y+b.h<=f.y,`overlap ${i}/${j}`)}
 }
});
test('rendered enemy poses share one scale and a fixed foot anchor, without stretching into neighbors',()=>{
 const previous=globalThis.document;let calls=[];
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({imageSmoothingEnabled:false,drawImage(...args){calls.push(args)}})})};
 try{setEnemyAtlas({name:'atlas'});for(let type=0;type<12;type++){let scales=[];for(let frame=0;frame<4;frame++){calls=[];const c=makeEnemySprite(type,frame);assert.equal(c.width,112);const [,sx,sy,sw,sh,dx,dy,dw,dh]=calls[0];assert.ok(dx>=0&&dy>=0&&dx+dw<=112&&dy+dh<=112);assert.ok(Math.abs(dy+dh-104)<1e-8);assert.ok(Math.abs(dw/sw-dh/sh)<1e-8);scales.push(dw/sw);assert.equal(sx,artData.enemy[type][frame%2].x);assert.equal(sy,artData.enemy[type][frame%2].y)}assert.ok(scales.every(s=>Math.abs(s-scales[0])<1e-8))}}
 finally{setEnemyAtlas(null);globalThis.document=previous}
});
