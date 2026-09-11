'use strict';
window.createFightInput=(keys,pressed)=>{
 const sources=new Map(),activePointers=new Set(),buttons=[...document.querySelectorAll('[data-key]')],pad=document.querySelector('.direction');
 function set(id,next){const before=new Set(keys);if(next.length)sources.set(id,new Set(next));else sources.delete(id);keys.clear();for(const list of sources.values())for(const k of list)keys.add(k);for(const k of keys)if(!before.has(k))pressed.add(k);for(const b of buttons)b.classList.toggle('pressed',keys.has(b.dataset.key));}
 function clear(){sources.clear();activePointers.clear();keys.clear();pressed.clear();for(const b of buttons)b.classList.remove('pressed');}
 function slide(e){const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-key]');if(b&&pad.contains(b))return [b.dataset.key];const r=pad.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(x<-.15||x>1.15||y<-.15||y>1.15)return [];const result=[];if(x<.34)result.push('ArrowLeft');else if(x>.66)result.push('ArrowRight');if(y<.34)result.push('ArrowUp');else if(y>.66)result.push('ArrowDown');return result;}
 for(const b of buttons){
  b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);activePointers.add(e.pointerId);set('p'+e.pointerId,[b.dataset.key]);},{passive:false});
  b.addEventListener('pointermove',e=>{if(!activePointers.has(e.pointerId))return;e.preventDefault();if(pad.contains(b))set('p'+e.pointerId,slide(e));},{passive:false});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{if(e.cancelable)e.preventDefault();activePointers.delete(e.pointerId);set('p'+e.pointerId,[]);},{passive:false});
  for(const type of ['contextmenu','dragstart','selectstart'])b.addEventListener(type,e=>e.preventDefault());
 }
 // Touch cancellation and app switching must release every virtual button.
 window.addEventListener('blur',clear);window.addEventListener('pagehide',clear);window.addEventListener('orientationchange',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
 document.querySelector('.controls').addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
 document.querySelector('.screen').addEventListener('contextmenu',e=>e.preventDefault());
 return {down:k=>set('k'+k,[k]),up:k=>set('k'+k,[]),clear,set};
};
