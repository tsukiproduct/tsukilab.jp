/* Cloudflare Worker: runs the existing Jev director endpoint without exposing the API key. */
const endpoint='/music/tsukiyomilab/lyricvisualizer/autolyricbomb/api/jev-director';
const transcriptionEndpoint='/music/tsukiyomilab/lyricvisualizer/autolyricbomb/api/transcribe';
const motions=new Set(['drift','scatter','pop','glitch','type','slam','wipe','pulse','echo','stagger','draw','mask','track','impact','outline','bounce','sparkle','focus','disperse']);
const layouts=new Set(['bottom','wander','center','tateRight']);
const graphics=new Set(['none','rays','sweep','frame','dots']);
const sectionKinds=new Set(['verse','prechorus','chorus','bridge','outro']);
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};

function json(status,value){return new Response(JSON.stringify(value),{status,headers});}

// Only this editor's own page may call the API (browsers always send Origin on POST).
function sameOrigin(request){
  const origin=request.headers.get('Origin');
  return !origin||origin===new URL(request.url).origin;
}
// Per-IP limits via the Workers Rate Limiting binding; skipped if the binding is not configured.
async function allowed(limiter,request){
  if(!limiter)return true;
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  try{return (await limiter.limit({key:ip})).success;}catch{return true;}
}

async function transcribe(request,env){
  if(!env.AI)return json(503,{error:'Cloudflare Workers AI のバインディングがありません。'});
  const size=Number(request.headers.get('content-length'));
  if(!Number.isFinite(size)||size<44||size>1200000)return json(413,{error:'音声区間は 1.2 MB 以下の WAV にしてください。'});
  try{
    const audio=await request.arrayBuffer();
    if(audio.byteLength<44||audio.byteLength>1200000)return json(413,{error:'音声区間が大きすぎます。'});
    const view=new DataView(audio),bytes=new Uint8Array(audio);
    const tag=(at)=>String.fromCharCode(...bytes.subarray(at,at+4));
    if(tag(0)!=='RIFF'||tag(8)!=='WAVE'||tag(12)!=='fmt '||tag(36)!=='data'||view.getUint16(20,true)!==1||view.getUint16(22,true)!==1||view.getUint32(24,true)!==16000||view.getUint16(34,true)!==16||view.getUint32(40,true)>640000)return json(400,{error:'16 kHz・16 bit・モノラル WAV の区間を指定してください。'});
    let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    const language=request.headers.get('X-Lyric-Language');
    // Voice activity detection removes intros and interludes but may also cut soft singing, so it is opt-in.
    const options={audio:btoa(binary),task:'transcribe',vad_filter:request.headers.get('X-Lyric-Vad')==='1',condition_on_previous_text:false,no_speech_threshold:0.8};
    if(language==='japanese'||language==='english')options.language=language==='japanese'?'ja':'en';
    const result=await env.AI.run('@cf/openai/whisper-large-v3-turbo',options);
    return json(200,{segments:Array.isArray(result.segments)?result.segments:[],text:result.text||'',vtt:result.vtt||''});
  }catch(error){return json(502,{error:'音声認識に失敗しました。Cloudflare Workers AI の設定と使用量を確認してください。'});}
}

function questionsFor(lines){
  const questions={};
  for(let i=0;i<lines.length;i++){
    const target='`lines['+i+']` (song line '+(lines[i].index+1)+')';
    questions['motion_'+i]={type:'choice',instructions:'Choose one distinct, readable animation for '+target+'. Consider its words, its place in the whole song (`song`), neighboring lines, audio intensity, proximity to a detected beat and the build of the song. Vary the visual rhythm; reserve high-impact movement for musical peaks.',criteria:{drift:'Slow, lingering movement',scatter:'Letters converge from apart',pop:'Playful letters bounce',glitch:'Electronic disruption',type:'Revealed one character at a time',slam:'A strong impact on a downbeat',wipe:'A swift horizontal reveal',pulse:'Typography breathes with the beat',echo:'Afterimages for a lingering phrase',stagger:'Alternating letters spring into place',draw:'Crayon or marker hand lettering slowly drawn onto a canvas',mask:'Cool: letters rise from behind a line, then hold still',track:'Cool: wide letter spacing tightens into the word',impact:'Cool: a flash cut-in on a hard downbeat, for the strongest hook',outline:'Cool: a huge outlined copy layered behind the line',bounce:'Cute: letters drop and squash-and-stretch like rubber',sparkle:'Cute: letters pop open with overshoot while stars twinkle',focus:'Artistic: words drift from blur into focus with airy spacing',disperse:'Artistic: letters settle, then scatter away like ash'}};
    questions['layout_'+i]={type:'choice',instructions:'For the lyric in '+target+', which placement best supports readability and expressive impact?',criteria:{bottom:'Quiet lower-third text that leaves room for footage',wander:'Playful placement that draws attention to the words',center:'Stable centered title for a key statement',tateRight:'Japanese vertical line along the right edge for intimate or reflective words'}};
    questions['impact_'+i]={type:'score',instructions:'How visually prominent should the lyric in '+target+' be relative to the neighboring lyrics?',criteria:['Small and restrained','Medium emphasis','Large focal moment']};
    questions['section_'+i]={type:'choice',instructions:'Using the whole song in `song`, which part of the song structure does '+target+' belong to? `repeat` counts identical lyric lines in the song; repeated hooks usually belong to the chorus.',criteria:{verse:'Verse (A-melo): storytelling lines, moderate energy',prechorus:'Pre-chorus (B-melo): builds tension toward the chorus',chorus:'Chorus (sabi): the hook, often repeated and the most intense',bridge:'Bridge or breakdown (C-melo, quiet last chorus): a contrasting passage',outro:'Outro: winding down after the final chorus'}};
    questions['graphic_'+i]={type:'choice',instructions:'Which one graphic accent best supports '+target+' while keeping the lyric readable? Use its musical intensity and nearby lyrics; silence or restraint is allowed.',criteria:{none:'No added shapes; allow the words and underlying image to breathe',rays:'Short, sharp rays for forceful declarations',sweep:'A traveling light beam for a reveal or transition',frame:'Architectural lines that hold the typography together',dots:'A field of print dots for playful, restless energy'}};
  }
  return questions;
}

function mapAnswers(lines,answers){
  return lines.map((_,i)=>{
    const motion=answers['motion_'+i],layout=answers['layout_'+i],impact=answers['impact_'+i],graphic=answers['graphic_'+i],part=answers['section_'+i];
    const animKey=motion?.confidence>=.35&&motions.has(motion.choice)?motion.choice:'drift';
    const layoutKey=layout?.confidence>=.35&&layouts.has(layout.choice)?layout.choice:'bottom';
    const graphicKey=graphic?.confidence>=.35&&graphics.has(graphic.choice)?graphic.choice:null;
    const level=Number(impact?.score);
    const size=impact?.score!=null&&Number.isFinite(level)?(level<.7?1:level<1.4?1.15:1.55):1;
    const section=part?.confidence>=.35&&sectionKinds.has(part.choice)?part.choice:null;
    return {animKey,layoutKey,graphicKey,size,section,confidence:Math.min(motion?.confidence||0,layout?.confidence||0)};
  });
}

// Yes/no probability; guides show it as `noul`, so accept a plain `probability` as well.
function noul(answer){
  const value=Number(answer?.noul??answer?.probability);
  return Number.isFinite(value)?Math.min(1,Math.max(0,value)):null;
}
function checkQuestions(lines){
  const questions={};
  for(let i=0;i<lines.length;i++)questions['suspect_'+i]={type:'noul',
    instructions:'The lyrics in `song` were transcribed automatically from a sung recording. Is `lines['+i+']` (song line '+(lines[i].index+1)+') likely NOT the real sung lyric: a mishearing that breaks the meaning of the neighboring lines, a nonsensical phrase, or text that is not a lyric at all (a video subtitle closing such as ご視聴ありがとうございました, a channel promotion, a caption credit)? Unusual poetic wording, slang, repeated hooks and mixed languages are normal in lyrics and are not errors.',
    criteria:{true:'Probably a recognition error or not a lyric',false:'Plausible lyric in this song'}};
  return questions;
}
function songContext(data){
  if(!Array.isArray(data.song))return [];
  return data.song.slice(0,120).map((l,i)=>({index:i,text:String(l?.text||'').slice(0,240),t:Math.round((Number(l?.t)||0)*10)/10,repeat:Math.min(20,Math.max(1,Number(l?.repeat)||1))}));
}
async function askJev(env,state,questions){
  const response=await fetch('https://api.typesafe.ai/v1/systemone',{
    method:'POST',headers:{Authorization:'Bearer '+env.TYPESAFE_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:'jev-latest',state,questions}),
    signal:AbortSignal.timeout(30000)
  });
  if(!response.ok)throw Object.assign(new Error('Jev API error '+response.status),{status:502});
  return (await response.json()).answers||{};
}

export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    const isApi=(path===transcriptionEndpoint||path===endpoint)&&request.method==='POST';
    if(!isApi)return json(404,{error:'Not found'});
    if(!sameOrigin(request))return json(403,{error:'このページ以外からは利用できません。'});
    const limiter=path===transcriptionEndpoint?env.TRANSCRIBE_LIMIT:env.JEV_LIMIT;
    if(!await allowed(limiter,request))return json(429,{error:'短時間に多くのリクエストがありました。1分ほど待ってから再度お試しください。'});
    if(path===transcriptionEndpoint)return transcribe(request,env);
    if(!env.TYPESAFE_API_KEY)return json(503,{error:'Jev API キーが Cloudflare Worker に設定されていません。'});
    try{
      if(Number(request.headers.get('content-length'))>100000)return json(413,{error:'歌詞データが大きすぎます。'});
      const body=await request.text();
      if(new TextEncoder().encode(body).length>100000)return json(413,{error:'歌詞データが大きすぎます。'});
      const data=JSON.parse(body);
      const lines=data.lines;
      if(!Array.isArray(lines)||!lines.length||lines.length>120||lines.some(l=>!l||typeof l.text!=='string'||l.text.length>240))return json(400,{error:'歌詞は1〜120行で指定してください。'});
      const song=songContext(data);
      const at=Math.max(0,Math.floor(Number(data.offset)||0));
      const indexed=lines.map((l,i)=>({...l,index:at+i}));
      // Lyric check: the whole song is context, only the given lines are judged.
      if(data.task==='check'){
        const checks=[];
        for(let offset=0;offset<indexed.length;offset+=20){
          const batch=indexed.slice(offset,offset+20).map(l=>({index:l.index,text:l.text,t:Number(l.t)||0}));
          const answers=await askJev(env,{purpose:'Proofread automatically transcribed song lyrics before they are shown in a lyric video.',song,lines:batch},checkQuestions(batch));
          checks.push(...batch.map((_,i)=>({suspect:noul(answers['suspect_'+i])})));
        }
        return json(200,{checks});
      }
      const duration=Number(data.duration)||0;
      const bpm=Number(data.bpm);
      const sections=Array.isArray(data.sections)?data.sections.slice(0,240).map(s=>({start:Number(s.start)||0,intensity:Math.min(1,Math.max(0,Number(s.intensity)||0))})):[];
      const plan=[];
      for(let offset=0;offset<indexed.length;offset+=8){
        const batch=indexed.slice(offset,offset+8);
        const answers=await askJev(env,{purpose:'Direct a lyric music video with expressive, legible and varied motion driven by words, the structure of the whole song and the analyzed rhythm. `song` lists every lyric line for context; decide only for `lines`. Beat offsets are seconds from the nearest detected transient; intensity is relative to this song, not a genre label.',duration_seconds:duration,bpm:Number.isFinite(bpm)&&bpm>=60&&bpm<=240?bpm:null,sections,song,lines:batch},questionsFor(batch));
        plan.push(...mapAnswers(batch,answers));
      }
      return json(200,{plan});
    }catch(error){
      if(error instanceof SyntaxError)return json(400,{error:'JSON を読み取れませんでした。'});
      if(error?.status)return json(error.status,{error:error.message});
      return json(502,{error:'Jev への接続に失敗しました。'});
    }
  }
};
