'use strict';
window.FightAudio=(()=>{
 let context,master,buffer,cues,loading,enabled=true,musicEnabled=true,scene=false,unlocked=false,duckUntil=0,lastScene=false;
 const nodes=new Set(),recent=new Map();
 const music=new Audio('assets/audio/battle.mp3');music.loop=true;music.preload='auto';music.volume=.12;
 function load(){if(loading)return loading;loading=(async()=>{context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=.8;master.connect(context.destination);const [a,b]=await Promise.all([fetch('assets/audio/effects.mp3'),fetch('assets/audio/cues.json')]);if(!a.ok||!b.ok)throw Error('audio load');cues=await b.json();buffer=await context.decodeAudioData(await a.arrayBuffer());return true})().catch(()=>false);return loading}
 function unlock(){load();unlocked=true;if(context?.state==='suspended')context.resume().catch(()=>{});syncMusic()}
 function syncMusic(){if(scene&&enabled&&musicEnabled&&unlocked){music.volume=performance.now()<duckUntil?.045:.12;if(music.paused)music.play().catch(()=>{})}else music.pause()}
 function stop(){for(const n of nodes){try{n.stop()}catch(e){}}nodes.clear()}
 function setScene(v){scene=v;if(v!==lastScene){lastScene=v;if(!v)stop();syncMusic()}else if(v&&musicEnabled)music.volume=performance.now()<duckUntil?.045:.12}
 function setEnabled(v){enabled=v;if(master)master.gain.value=v?.8:0;if(!v)stop();else unlock();syncMusic()}
 function setMusic(v){musicEnabled=v;if(v)unlock();syncMusic()}
 function play(name,{volume=.6,rate=1,lowpass=0,maxDuration,duck=false}={}){
  if(!enabled||!unlocked||!buffer||!cues?.[name]||context.state!=='running')return;
  const now=context.currentTime;if(now-(recent.get(name)??-99)<.045)return;recent.set(name,now);
  const cue=cues[name],src=context.createBufferSource(),gain=context.createGain();src.buffer=buffer;src.playbackRate.value=rate;gain.gain.value=volume;src.connect(gain);
  if(lowpass){const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=lowpass;gain.connect(filter);filter.connect(master)}else gain.connect(master);
  if(nodes.size>=12){const first=nodes.values().next().value;try{first.stop()}catch(e){}nodes.delete(first)}
  nodes.add(src);src.onended=()=>{nodes.delete(src);src.disconnect();gain.disconnect()};
  const duration=Math.min(cue.duration,maxDuration??cue.duration);gain.gain.setValueAtTime(volume,now);gain.gain.setValueAtTime(volume,now+Math.max(0,duration/rate-.025));gain.gain.linearRampToValueAtTime(0,now+duration/rate);src.start(now,cue.offset,duration);
  if(duck){duckUntil=performance.now()+duration/rate*1000;syncMusic()}
 }
 return {load,unlock,play,setEnabled,setMusic,setScene,stop};
})();
