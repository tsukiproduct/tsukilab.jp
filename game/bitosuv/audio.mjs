// ハロテイの音。外部ファイルを使わず WebAudio だけで生成する（CSP は self のみ・通信量ゼロ）。
// BGM はステージごとに曲が変わり、群れの密度とボス戦で編成が厚くなる。
const N=m=>440*2**((m-69)/12);
// 音量バランス（BGM・効果音・全体）。コンプレッサーが山を抑える。
export const levels={music:2.6,sfx:2.2,master:.95};
let ac=null,master,musicBus,sfxBus,musicOut,sfxOut,noiseBuf,timer=null;
let musicOn=false,sfxOn=false,offline=false,song=null,step=0,nextTime=0,intensity=0,boss=false,duck=1,leadFreq=0;
const last={};

// ---------- 曲データ（[音高, 長さ(ステップ)] の並び。和音は [ベース, 構成音…]） ----------
const songs={
 // かぼちゃ墓地：ニ短調の 12/8。三連のセレスタ分散和音と、テルミン風の旋律（死の舞踏の気分）
 graveyard:{bpm:100,spb:3,bar:12,lead:'theremin',shift:0,
  chords:[[50,62,65,69],[46,62,65,70],[43,62,67,70],[45,61,64,69],[50,62,65,69],[46,62,65,70],[43,62,67,70],[45,61,64,69]],
  mel:[[74,6],[77,3],[81,3],[82,6],[81,3],[77,3],[79,3],[81,3],[82,3],[86,3],[85,9],[81,3],[86,6],[84,3],[81,3],[82,3],[81,3],[79,3],[77,3],[76,3],[79,3],[82,3],[81,3],[81,6],[73,3],[76,3]]},
 // 妖怪の灯り市：都節音階。琴の分散和音・尺八風の旋律・太鼓
 market:{bpm:92,spb:4,bar:16,lead:'shaku',shift:0,
  chords:[[45,69,72,76],[41,65,69,72],[40,64,71,77],[45,69,72,76],[45,69,72,76],[41,65,69,72],[40,64,71,77],[40,64,71,77]],
  mel:[[76,4],[77,2],[81,2],[83,4],[81,4],[84,4],[83,2],[81,2],[77,8],[76,2],[77,2],[81,2],[83,2],[84,4],[88,4],[83,6],[81,2],[77,4],[76,4],[81,4],[84,4],[83,4],[81,4],[77,6],[76,2],[77,4],[81,4],[83,4],[81,2],[77,2],[76,4],[77,4],[76,16]]},
 // 夜明けの時計城：ハ短調。チェンバロの16分・時計のチクタク・オルガンの旋律
 castle:{bpm:124,spb:4,bar:16,lead:'organ',shift:-12,
  chords:[[48,60,63,67],[44,60,63,68],[41,60,65,68],[43,59,62,67],[48,60,63,67],[44,60,63,68],[39,58,63,67],[43,59,62,67]],
  mel:[[79,4],[84,4],[87,4],[86,4],[84,4],[80,4],[75,8],[77,4],[80,4],[84,4],[87,4],[86,8],[83,8],[84,2],[86,2],[87,4],[91,8],[89,4],[87,4],[84,8],[82,4],[79,4],[87,4],[86,4],[83,4],[86,4],[91,8]]},
};
songs.title={...songs.graveyard,bpm:76,lead:'box',title:true};
for(const s of Object.values(songs)){s.loop=s.chords.length*s.bar;s.at=new Map();let i=0;for(const [m,len] of s.mel){s.at.set(i,[m,len]);i+=len}}
export const stageSongs=['graveyard','market','castle'];
export function songInfo(name){const s=songs[name];if(!s)return null;let total=0;for(const [,len] of s.mel)total+=len;return {bars:s.chords.length,steps:total,loop:s.loop}}

// ---------- 音の部品 ----------
function env(g,t,a,peak,d){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}
function tone(type,f,t,dur,dest,o={}){const osc=ac.createOscillator(),g=ac.createGain();osc.type=type;osc.frequency.setValueAtTime(f,t);if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t+(o.slide||dur));if(o.detune)osc.detune.value=o.detune;let out=g;if(o.filter){const fl=ac.createBiquadFilter();fl.type=o.filter;fl.frequency.setValueAtTime(o.ff||1200,t);if(o.ffTo)fl.frequency.exponentialRampToValueAtTime(o.ffTo,t+dur);fl.Q.value=o.q||.7;osc.connect(fl);fl.connect(g);osc.onended=()=>{osc.disconnect();fl.disconnect();g.disconnect()}}else{osc.connect(g);osc.onended=()=>{osc.disconnect();g.disconnect()}}
 if(o.vib){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=o.vib;lg.gain.value=f*(o.vibDepth||.012);l.connect(lg);lg.connect(osc.frequency);l.start(t);l.stop(t+(o.a||.005)+dur+.05);l.onended=()=>{l.disconnect();lg.disconnect()}}
 env(g,t,o.a||.005,o.gain??.2,dur);out.connect(dest);osc.start(t);osc.stop(t+(o.a||.005)+dur+.05);return osc}
function noise(t,dur,dest,o={}){const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf;fl.type=o.type||'bandpass';fl.frequency.setValueAtTime(o.f||1000,t);if(o.fTo)fl.frequency.exponentialRampToValueAtTime(o.fTo,t+dur);fl.Q.value=o.q||1;env(g,t,o.a||.002,o.gain??.2,dur);s.connect(fl);fl.connect(g);g.connect(dest);s.start(t,Math.random()*1.4);s.stop(t+(o.a||.002)+dur+.05);s.onended=()=>{s.disconnect();fl.disconnect();g.disconnect()}}
function impulse(sec=2.4){const len=Math.floor(ac.sampleRate*sec),b=ac.createBuffer(2,len,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len)**2.6}return b}

// 楽器
const celesta=(m,t,v=.07,d=.9)=>{tone('sine',N(m),t,d,musicOut,{gain:v});tone('sine',N(m)*4,t,.18,musicOut,{gain:v*.22})};
const box=(m,t,v=.08)=>{tone('sine',N(m),t,1.1,musicOut,{gain:v});tone('triangle',N(m)*2,t,.25,musicOut,{gain:v*.3});tone('sine',N(m)*5.4,t,.08,musicOut,{gain:v*.12})};
const pizz=(m,t,v=.22)=>{tone('triangle',N(m),t,.3,musicOut,{gain:v,filter:'lowpass',ff:900,ffTo:200});tone('sine',N(m)/2,t,.22,musicOut,{gain:v*.5})};
const harpsi=(m,t,v=.045)=>{tone('sawtooth',N(m),t,.22,musicOut,{gain:v,filter:'lowpass',ff:4200,ffTo:900});tone('square',N(m)*2,t,.08,musicOut,{gain:v*.25,filter:'highpass',ff:1500})};
const koto=(m,t,v=.07)=>{tone('sawtooth',N(m)*1.012,t,.7,musicOut,{gain:v,to:N(m),slide:.05,filter:'lowpass',ff:3200,ffTo:600})};
const pad=(ch,t,dur,v=.018)=>{for(const m of ch.slice(1))for(const dt of [-8,8])tone('sawtooth',N(m-12),t,dur*.75,musicOut,{gain:v,a:dur*.25,detune:dt,filter:'lowpass',ff:700})};
function lead(kind,m,t,dur){const f=N(m),from=leadFreq||f;leadFreq=f;
 if(kind==='theremin')tone('sine',from,t,dur*.92,musicOut,{gain:.075,a:.04,to:f,slide:.07,vib:5.6,vibDepth:.014});
 else if(kind==='shaku'){tone('triangle',f,t,dur*.9,musicOut,{gain:.06,a:.06,vib:4.8,vibDepth:.008});noise(t,Math.min(.25,dur*.5),musicOut,{type:'bandpass',f:f*2,q:6,gain:.03,a:.03})}
 else if(kind==='organ'){for(const [r,v] of [[1,.035],[2,.02],[3,.012]])tone('square',f*r,t,dur*.9,musicOut,{gain:v,a:.015,filter:'lowpass',ff:2400,vib:6,vibDepth:.004})}
 else box(m,t,.075)}
const kick=(t,v=.35)=>tone('sine',130,t,.2,musicOut,{gain:v,to:40,slide:.16});
const snare=(t,v=.11)=>{noise(t,.13,musicOut,{f:1900,q:.8,gain:v});tone('triangle',190,t,.06,musicOut,{gain:v*.6})};
const hat=(t,v=.035)=>noise(t,.035,musicOut,{type:'highpass',f:8000,gain:v});
const tick=(t,hi)=>{tone('sine',hi?2600:1700,t,.03,musicOut,{gain:.05});noise(t,.02,musicOut,{type:'highpass',f:6000,gain:.02})};
const taiko=(t,v=.32)=>{tone('sine',96,t,.32,musicOut,{gain:v,to:46,slide:.25});noise(t,.08,musicOut,{type:'lowpass',f:420,gain:v*.4})};

// ---------- 演奏 ----------
const stepDur=()=>60/(song.bpm*(boss?1.1:1))/song.spb;
function play(i,t){const s=song,li=i%s.loop,bar=Math.floor(li/s.bar),k=li%s.bar,ch=s.chords[bar],d=stepDur(),beat=k%s.spb===0,hot=intensity>.45||boss;
 const mel=s.at.get(li);if(mel)lead(s.lead,mel[0]+s.shift,t,mel[1]*d);
 if(k===0)pad(ch,t,s.bar*d,s.title?.012:.018);
 if(s===songs.graveyard||s.title){const pat=[1,2,3,2,3,2,1,2,3,2,3,2];celesta(ch[pat[k]]+12,t,s.title?.03:.035,.5);if(!s.title){if(k===0)pizz(ch[0],t);if(k===6)pizz(ch[0]+7,t,.16)}
  if(!s.title&&hot){if(k===3||k===9)snare(t,.07);if(k%3===0)hat(t)}if(boss){if(k===0||k===6)kick(t);if(k===11)taiko(t,.2)}}
 else if(s===songs.market){if(k%2===0)koto(ch[[1,2,3,2,1,3,2,3][k/2]]+12,t);if(k===0)pizz(ch[0],t,.18);if(k===0||k===10)taiko(t,.26);if(k===12&&bar%2===1)celesta(ch[3]+24,t,.03,1.4);
  if(hot&&(k===6||k===14))taiko(t,.16);if(hot&&k%4===2)hat(t,.025);if(boss&&k%4===0)kick(t,.28)}
 else{harpsi(ch[[1,3,2,3][k%4]]+12,t);if(k%2===0)pizz(ch[0]+(k%8===4?12:0),t,.14);if(beat)tick(t,(k/4)%2===0);
  if(hot&&(k===4||k===12))snare(t,.08);if(boss&&k%4===0)kick(t,.3)}}
function schedule(){if(!ac||!song)return;while(nextTime<ac.currentTime+.16){play(step,nextTime);nextTime+=stepDur();step++}}

// ---------- 収録曲（イントロ付きループ）----------
// LOOPSTART/LOOPLENGTH はファイルのタグ値（サンプル数, 44.1kHz）。Safari向けに m4a も用意。
const tracks={bitoTheme:{urls:[new URL('./assets/bito-theme.ogg',import.meta.url).href,new URL('./assets/bito-theme.m4a',import.meta.url).href],loopStart:264600/44100,loopEnd:(264600+3175200)/44100,gain:.21,buf:null,loading:null}};
let trackName=null,trackSrc=null,trackGain=null;
export const trackNames=Object.keys(tracks);
function canPlay(url){try{const a=document.createElement('audio');return a.canPlayType(url.endsWith('.ogg')?'audio/ogg; codecs="vorbis"':'audio/mp4; codecs="mp4a.40.2"')!==''}catch{return false}}
function loadTrack(name){const tr=tracks[name];if(tr.buf||tr.loading)return tr.loading;
 tr.loading=(async()=>{for(const url of tr.urls.filter(canPlay).concat(tr.urls)){try{const r=await fetch(url);if(!r.ok)continue;tr.buf=await ac.decodeAudioData(await r.arrayBuffer());return tr.buf}catch{}}tr.loading=null;return null})();return tr.loading}
function stopTrack(){if(trackSrc){const src=trackSrc,g=trackGain,t=ac.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+.6);src.stop(t+.65);src.onended=()=>{src.disconnect();g.disconnect()}}trackSrc=null;trackGain=null}
async function startTrack(name){if(!ac||!musicOn)return;const tr=tracks[name],buf=await loadTrack(name);if(!buf||trackName!==name||trackSrc||!musicOn)return;
 const src=ac.createBufferSource(),g=ac.createGain();src.buffer=buf;src.loop=true;src.loopStart=tr.loopStart;src.loopEnd=Math.min(tr.loopEnd,buf.duration);g.gain.value=tr.gain;src.connect(g);g.connect(musicBus);src.start(ac.currentTime+.05);trackSrc=src;trackGain=g}

// ---------- 公開関数 ----------
export function init(){if(ac){if(ac.state==='suspended')ac.resume();return ac}const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;try{build(new C())}catch{return null}if(ac.state==='suspended')ac.resume();return ac}
function build(ctx){ac=ctx;
 master=ac.createGain();master.gain.value=levels.master;const comp=ac.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=8;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.2;master.connect(comp);comp.connect(ac.destination);
 const verb=ac.createConvolver();verb.buffer=impulse();const wet=ac.createGain();wet.gain.value=.28;verb.connect(wet);wet.connect(master);
 musicBus=ac.createGain();musicBus.gain.value=0;musicBus.connect(master);sfxBus=ac.createGain();sfxBus.gain.value=levels.sfx;sfxBus.connect(master);
 musicOut=ac.createGain();musicOut.connect(musicBus);const mv=ac.createGain();mv.gain.value=.9;musicOut.connect(mv);mv.connect(verb);
 sfxOut=ac.createGain();sfxOut.connect(sfxBus);const sv=ac.createGain();sv.gain.value=.25;sfxOut.connect(sv);sv.connect(verb);
 noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const nd=noiseBuf.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
 return ac}
function level(){if(!ac)return;const v=musicOn&&(song||trackName)?levels.music*duck:0;musicBus.gain.cancelScheduledValues(ac.currentTime);musicBus.gain.setTargetAtTime(v,ac.currentTime,.25)}
export function setEnabled(music,sfx){musicOn=!!music;sfxOn=!!sfx;if(musicOn||sfxOn)init();if(!ac)return;level();if(trackName){if(musicOn)startTrack(trackName);else stopTrack()}if(musicOn&&song&&!timer){nextTime=ac.currentTime+.05;timer=setInterval(schedule,30)}if(!musicOn&&timer){clearInterval(timer);timer=null}}
export function setSong(name){if(tracks[name]){if(trackName===name)return;song=null;if(ac)stopTrack();trackName=name;level();if(ac)startTrack(name);return}if(trackName){trackName=null;if(ac)stopTrack()}if(!songs[name]){song=null;level();return}if(songs[name]!==song){song=songs[name];step=0;leadFreq=0;if(ac)nextTime=Math.max(nextTime,ac.currentTime+.05)}level();if(musicOn&&ac&&!timer){nextTime=ac.currentTime+.05;timer=setInterval(schedule,30)}}
export function stopSong(){song=null;trackName=null;if(ac)stopTrack();if(timer){clearInterval(timer);timer=null}level()}
export function setIntensity(v){intensity=Math.max(0,Math.min(1,+v||0))}
export function setBoss(on){boss=!!on}
export function setDuck(on){duck=on?.35:1;level()}

// 効果音。連打されるものは間引く。
function ok(key,ms){if(offline)return true;const now=performance.now();if(now-(last[key]||0)<ms)return false;last[key]=now;return true}
let gemCombo=0,gemAt=0;
const pent=[0,3,5,7,10,12,15,17,19,22,24];
export function sfx(name,arg){if(!sfxOn)return;if(!init())return;sfxAt(name,arg,ac.currentTime+.005)}
function sfxAt(name,arg,t){const o=sfxOut;
 switch(name){
  case 'ui':tone('sine',880,t,.05,o,{gain:.06});tone('sine',1320,t+.04,.06,o,{gain:.04});break;
  case 'shot':if(!ok('shot',105))return;
   if(arg===6)noise(t,.12,o,{f:900,fTo:2400,q:.9,gain:.07});
   else if(arg===7){tone('sine',110,t,.16,o,{gain:.16,to:45,slide:.14});noise(t,.1,o,{type:'lowpass',f:500,gain:.08})}
   else tone('square',1250,t,.06,o,{gain:.022,to:520,slide:.06,filter:'lowpass',ff:3000});break;
  case 'impact':if(!ok('impact',70))return;noise(t,.03,o,{type:'highpass',f:2200,gain:.05});tone('sine',220+Math.random()*60,t,.04,o,{gain:.03});break;
  case 'gem':{if(!ok('gem',45))return;const now=performance.now();gemCombo=now-gemAt<600?Math.min(pent.length-1,gemCombo+1):0;gemAt=now;const m=81+pent[gemCombo];tone('sine',N(m),t,.09,o,{gain:.045});tone('sine',N(m+12),t+.02,.06,o,{gain:.018});break}
  case 'heal':for(const [i,m] of [79,83,86].entries())tone('sine',N(m),t+i*.06,.2,o,{gain:.05});break;
  case 'hurt':if(!ok('hurt',120))return;tone('sawtooth',170,t,.2,o,{gain:.09,to:62,slide:.18,filter:'lowpass',ff:900});noise(t,.12,o,{type:'lowpass',f:700,gain:.09});break;
  case 'dash':noise(t,.22,o,{f:350,fTo:2600,q:1.4,gain:.09,a:.03});break;
  case 'upgrade':for(const [i,m] of [74,77,81,86].entries())tone('sine',N(m),t+i*.055,.35,o,{gain:.06});tone('sine',N(98),t+.22,.4,o,{gain:.02});break;
  case 'chest':for(let i=0;i<7;i++)tone('sine',N(86+pent[(i*3)%8]),t+i*.045,.3,o,{gain:.04});noise(t,.5,o,{type:'highpass',f:7000,gain:.025,a:.1});break;
  case 'evolve':for(const m of [62,69,74,77,81])tone('sawtooth',N(m),t,1.4,o,{gain:.02,a:.35,filter:'lowpass',ff:1600});tone('sine',N(93),t+.3,1.2,o,{gain:.05});break;
  case 'boss':for(const [r,v,d] of [[1,.22,2.6],[2.76,.07,1.6],[5.4,.03,.9]])tone('sine',55*r,t,d,o,{gain:v});for(const m of [38,44,49])tone('sawtooth',N(m),t,1.6,o,{gain:.025,a:.4,filter:'lowpass',ff:500});break;
  case 'ring':noise(t,1.1,o,{f:300,fTo:1300,q:3,gain:.08,a:.35});tone('sine',740,t+.1,1,o,{gain:.05,a:.2,to:330,slide:1,vib:7,vibDepth:.03});break;
  case 'win':for(const [i,m] of [62,66,69,74,78,81].entries())tone('triangle',N(m),t+i*.09,.6,o,{gain:.07});for(const m of [62,66,69,74])tone('sawtooth',N(m),t+.55,1.6,o,{gain:.02,a:.2,filter:'lowpass',ff:1800});break;
  case 'dead':tone('sine',N(69),t,1.6,o,{gain:.08,to:N(50),slide:1.5,vib:5,vibDepth:.02});tone('sine',55,t+.2,2.2,o,{gain:.18});break;
 }}

// PV・試聴用：同じ音源をオフラインで書き出す。plan={seconds, cues:[{at,song?,boss?,intensity?,sfx?,arg?}]}
export async function renderOffline(plan,rate=44100){const O=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;const keep={ac,master,musicBus,sfxBus,musicOut,sfxOut,noiseBuf,song,step,nextTime,intensity,boss,duck,leadFreq,offline};
 const ctx=new O(2,Math.ceil(plan.seconds*rate),rate);build(ctx);offline=true;musicBus.gain.value=levels.music;song=null;boss=false;intensity=0;duck=1;leadFreq=0;
 const cues=[...plan.cues].filter(c=>c.at<plan.seconds).sort((a,b)=>a.at-b.at);
 for(let i=0;i<=cues.length;i++){const until=i<cues.length?cues[i].at:plan.seconds;if(song)while(nextTime<until){play(step,nextTime);nextTime+=stepDur();step++}if(i===cues.length)break;const c=cues[i];
  if('song' in c){song=songs[c.song]||null;step=0;leadFreq=0;nextTime=c.at}if('boss' in c)boss=!!c.boss;if('intensity' in c)intensity=c.intensity;if(c.sfx)sfxAt(c.sfx,c.arg,c.at)}
 const out=ctx.startRendering();({ac,master,musicBus,sfxBus,musicOut,sfxOut,noiseBuf,song,step,nextTime,intensity,boss,duck,leadFreq,offline}=keep);return out}
