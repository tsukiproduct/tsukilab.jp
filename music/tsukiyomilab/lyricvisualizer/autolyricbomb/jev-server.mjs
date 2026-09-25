/* Optional local server: serves the editor and runs the same API code as the Cloudflare Worker (worker.mjs).
   Usage: TYPESAFE_API_KEY=... node jev-server.mjs  →  http://localhost:8787
   /api/transcribe needs the Cloudflare Workers AI binding and answers 503 locally. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import worker from './worker.mjs';

const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT)||8787;
const apiPrefix='/music/tsukiyomilab/lyricvisualizer/autolyricbomb';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const env={TYPESAFE_API_KEY:process.env.TYPESAFE_API_KEY};

async function readBody(req,max){
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>max)throw Object.assign(new Error('リクエストが大きすぎます。'),{status:413});chunks.push(chunk);}
  return Buffer.concat(chunks);
}
createServer(async(req,res)=>{
  const fail=(code,message)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:message}));};
  try{
    const url=new URL(req.url,'http://localhost:'+port);
    if(url.pathname.startsWith('/api/')){
      const body=req.method==='POST'?await readBody(req,1300000):undefined;
      const headers=new Headers();
      for(const [k,v] of Object.entries(req.headers))if(typeof v==='string')headers.set(k,v);
      const response=await worker.fetch(new Request(url.origin+apiPrefix+url.pathname,{method:req.method,headers,body}),env);
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    if(req.method!=='GET')return fail(404,'Not found');
    const file=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
    if(!file.startsWith(root)||!mime[extname(file)])return fail(404,'Not found');
    res.writeHead(200,{'Content-Type':mime[extname(file)]});res.end(await readFile(file));
  }catch(error){fail(error.status||(error.code==='ENOENT'?404:500),error.status?error.message:error.code==='ENOENT'?'Not found':'サーバーで処理できませんでした。');}
}).listen(port,()=>process.stdout.write('Lyric Motion Studio: http://localhost:'+port+'\n'));
