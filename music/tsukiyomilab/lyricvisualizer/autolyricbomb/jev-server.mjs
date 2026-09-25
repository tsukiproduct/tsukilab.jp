/* Optional Node server: serves the editor and keeps TYPESAFE_API_KEY out of browser code. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';

const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT)||8787;
const allowedMotion=new Set(['drift','scatter','pop','glitch','type']);
const allowedLayout=new Set(['bottom','wander','center']);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};

export function buildQuestions(lines){
  const questions={};
  for(let i=0;i<lines.length;i++){
    const target='`lines['+i+']`';
    questions['motion_'+i]={type:'choice',instructions:'For the lyric in '+target+', which single animation best expresses its meaning in a music video? Judge the lyric text and neighboring lyrics, not the timestamp.',criteria:{drift:'Soft, lingering movement for reflection',scatter:'Letters separate and reassemble for turmoil',pop:'Explosive letters for a hook or emphatic release',glitch:'Electronic distortion for tension or conflict',type:'Words appear one by one for a confession or buildup'}};
    questions['layout_'+i]={type:'choice',instructions:'For the lyric in '+target+', which placement best supports readability and expressive impact?',criteria:{bottom:'Quiet lower-third text that leaves room for footage',wander:'Playful placement that draws attention to the words',center:'Stable centered title for a key statement'}};
    questions['impact_'+i]={type:'score',instructions:'How visually prominent should the lyric in '+target+' be relative to the neighboring lyrics?',criteria:['Small and restrained','Medium emphasis','Large focal moment']};
  }
  return questions;
}
export function mapAnswers(lines,answers){
  return lines.map((line,i)=>{
    const motion=answers['motion_'+i],layout=answers['layout_'+i],impact=answers['impact_'+i];
    const animKey=motion?.confidence>=.35&&allowedMotion.has(motion.choice)?motion.choice:'drift';
    const layoutKey=layout?.confidence>=.35&&allowedLayout.has(layout.choice)?layout.choice:'bottom';
    const level=Number(impact?.score);
    const size=Number.isFinite(level)?(level<.7?1:level<1.4?1.15:1.55):1;
    return {animKey,layoutKey,size,confidence:Math.min(motion?.confidence||0,layout?.confidence||0)};
  });
}
async function evaluate(lines,duration){
  const key=process.env.TYPESAFE_API_KEY;
  if(!key)throw Object.assign(new Error('Jev API キーが接続先サーバーに設定されていません。'),{status:503});
  const plan=[];
  for(let offset=0;offset<lines.length;offset+=8){
    const batch=lines.slice(offset,offset+8);
    const response=await fetch('https://api.typesafe.ai/v1/systemone',{
      method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({model:'jev-latest',state:{purpose:'Choose expressive lyric video motion. The lyrics may be in Japanese or English.',duration_seconds:duration,lines:batch},questions:buildQuestions(batch)}),signal:AbortSignal.timeout(30000)
    });
    const result=await response.json();
    if(!response.ok)throw Object.assign(new Error('Jev API error '+response.status),{status:502});
    plan.push(...mapAnswers(batch,result.answers||{}));
  }
  return plan;
}
async function readBody(req){
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>100000)throw Object.assign(new Error('歌詞データが大きすぎます。'),{status:413});chunks.push(chunk);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  createServer(async(req,res)=>{
    const json=(code,payload)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));};
    try{
      const path=new URL(req.url,'http://localhost').pathname;
      if(req.method==='POST'&&path==='/api/jev-director'){
        const data=await readBody(req);
        const lines=data.lines;
        if(!Array.isArray(lines)||!lines.length||lines.length>120||lines.some(l=>typeof l.text!=='string'||l.text.length>240))throw Object.assign(new Error('歌詞は1〜120行で指定してください。'),{status:400});
        json(200,{plan:await evaluate(lines,Number(data.duration)||0)});return;
      }
      if(req.method!=='GET')throw Object.assign(new Error('Not found'),{status:404});
      const file=resolve(root,'.'+(path==='/'?'/index.html':path));
      if(!file.startsWith(root)||!mime[extname(file)])throw Object.assign(new Error('Not found'),{status:404});
      const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]});res.end(content);
    }catch(error){json(error.status||500,{error:error.status?error.message:'サーバーで処理できませんでした。'});}
  }).listen(port,()=>process.stdout.write('Lyric Motion Studio: http://localhost:'+port+'\n'));
}
