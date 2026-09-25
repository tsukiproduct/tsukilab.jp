/* Cloudflare Worker: runs the existing Jev director endpoint without exposing the API key. */
const endpoint='/music/tsukiyomilab/lyricvisualizer/autolyricbomb/api/jev-director';
const motions=new Set(['drift','scatter','pop','glitch','type']);
const layouts=new Set(['bottom','wander','center']);
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};

function json(status,value){return new Response(JSON.stringify(value),{status,headers});}

function questionsFor(lines){
  const questions={};
  for(let i=0;i<lines.length;i++){
    const target='`lines['+i+']`';
    questions['motion_'+i]={type:'choice',instructions:'For the lyric in '+target+', which single animation best expresses its meaning in a music video? Judge the lyric text and neighboring lyrics, not the timestamp.',criteria:{drift:'Soft, lingering movement for reflection',scatter:'Letters separate and reassemble for turmoil',pop:'Explosive letters for a hook or emphatic release',glitch:'Electronic distortion for tension or conflict',type:'Words appear one by one for a confession or buildup'}};
    questions['layout_'+i]={type:'choice',instructions:'For the lyric in '+target+', which placement best supports readability and expressive impact?',criteria:{bottom:'Quiet lower-third text that leaves room for footage',wander:'Playful placement that draws attention to the words',center:'Stable centered title for a key statement'}};
    questions['impact_'+i]={type:'score',instructions:'How visually prominent should the lyric in '+target+' be relative to the neighboring lyrics?',criteria:['Small and restrained','Medium emphasis','Large focal moment']};
  }
  return questions;
}

function mapAnswers(lines,answers){
  return lines.map((_,i)=>{
    const motion=answers['motion_'+i],layout=answers['layout_'+i],impact=answers['impact_'+i];
    const animKey=motion?.confidence>=.35&&motions.has(motion.choice)?motion.choice:'drift';
    const layoutKey=layout?.confidence>=.35&&layouts.has(layout.choice)?layout.choice:'bottom';
    const level=Number(impact?.score);
    const size=impact?.score!=null&&Number.isFinite(level)?(level<.7?1:level<1.4?1.15:1.55):1;
    return {animKey,layoutKey,size,confidence:Math.min(motion?.confidence||0,layout?.confidence||0)};
  });
}

export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(path!==endpoint||request.method!=='POST')return json(404,{error:'Not found'});
    if(!env.TYPESAFE_API_KEY)return json(503,{error:'Jev API キーが Cloudflare Worker に設定されていません。'});
    try{
      if(Number(request.headers.get('content-length'))>100000)return json(413,{error:'歌詞データが大きすぎます。'});
      const body=await request.text();
      if(new TextEncoder().encode(body).length>100000)return json(413,{error:'歌詞データが大きすぎます。'});
      const data=JSON.parse(body);
      const lines=data.lines;
      if(!Array.isArray(lines)||!lines.length||lines.length>120||lines.some(l=>!l||typeof l.text!=='string'||l.text.length>240))return json(400,{error:'歌詞は1〜120行で指定してください。'});
      const duration=Number(data.duration)||0;
      const plan=[];
      for(let offset=0;offset<lines.length;offset+=8){
        const batch=lines.slice(offset,offset+8);
        const response=await fetch('https://api.typesafe.ai/v1/systemone',{
          method:'POST',headers:{Authorization:'Bearer '+env.TYPESAFE_API_KEY,'Content-Type':'application/json'},
          body:JSON.stringify({model:'jev-latest',state:{purpose:'Choose expressive lyric video motion. The lyrics may be in Japanese or English.',duration_seconds:duration,lines:batch},questions:questionsFor(batch)}),
          signal:AbortSignal.timeout(30000)
        });
        if(!response.ok)return json(502,{error:'Jev API error '+response.status});
        const result=await response.json();
        plan.push(...mapAnswers(batch,result.answers||{}));
      }
      return json(200,{plan});
    }catch(error){
      if(error instanceof SyntaxError)return json(400,{error:'JSON を読み取れませんでした。'});
      return json(502,{error:'Jev への接続に失敗しました。'});
    }
  }
};
