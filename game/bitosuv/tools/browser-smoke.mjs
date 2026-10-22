// 一時ブラウザーだけで実行。公開ランキングは遮断し、既存のセーブには触れない。
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=process.cwd(),out=path.join(root,'browser-qa');
await mkdir(out,{recursive:true});
const app=await readFile(path.join(root,'game/bitosuv/app.mjs'),'utf8');
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/game/'))throw Error('scope');const p=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));if(!p.startsWith(path.join(root,'game')+path.sep))throw Error('scope');const bytes=await readFile(p);res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'}[path.extname(p)]||'application/octet-stream'});res.end(bytes)}catch{res.writeHead(404);res.end()}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch();
  try{for(const [size,viewport] of [['desktop',{width:1280,height:800}],['mobile',{width:390,height:844}]]){
   for(let stage=0;stage<3;stage++){
    const context=await browser.newContext({viewport,hasTouch:size==='mobile',isMobile:size==='mobile',deviceScaleFactor:1});
    const page=await context.newPage(),errors=[];let external=0;
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
    await page.route('https://**/*',route=>{external++;return route.abort()});
    // テスト時にだけ状態を観察する。配布するapp.mjsにはこのフックを含めない。
    await page.route('**/app.mjs?v=10',route=>route.fulfill({contentType:'text/javascript',body:app+'\nglobalThis.__haloteiQa={getRun:()=>run};'}));
    await page.addInitScript(()=>localStorage.setItem('bito-survivors-v3',JSON.stringify({clears:[true,true,true,true,true],haloteiStages:[true,true,true]})));
    await page.clock.install();
    await page.goto(origin+'/game/halotei/');
    await page.locator('button[data-action="start"]').waitFor({state:'visible'});
    assert.equal(await page.locator('button[data-stage]').count(),3);
    await page.locator(`button[data-stage="${stage}"]`).click();
    await page.locator(`button[data-char="${[0,6,7][stage]}"]`).click();
    await page.locator('button[data-action="start"]').click();
    await page.clock.runFor(100);
    const before=await page.evaluate(()=>globalThis.__haloteiQa.getRun().p.x);
    await page.keyboard.down('d');await page.clock.runFor(600);await page.keyboard.up('d');
    assert.ok(await page.evaluate(()=>globalThis.__haloteiQa.getRun().p.x)>before,'keyboard movement');
    await page.locator('#dash').click();await page.clock.runFor(60);
    assert.ok(await page.evaluate(()=>globalThis.__haloteiQa.getRun().p.dashCd)>0,'dash cooldown');
    // 新敵と硬い敵が並ぶ固定の描画検証場面。通常プレイの難易度試験とは区別する。
    await page.evaluate(()=>{const s=globalThis.__haloteiQa.getRun();s.time=70;s.p.inv=1e9;s.need=1e9;s.fire=1e9;s.spawn=0});
    await page.clock.runFor(1600);
    await page.screenshot({path:path.join(out,`${engine}-${size}-stage-${stage+1}.png`)});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
    await page.locator('#stats').click();assert.match(await page.locator('#panel').innerText(),/CURRENT BUILD/);
    await page.locator('button[data-action="resume"]').click();
    await page.locator('#pause').click();assert.match(await page.locator('#panel').innerText(),/PAUSED/);
    assert.deepEqual(errors,[]);assert.equal(external,0,'no production API calls');
    results.push({engine,size,stage:stage+1,character:[0,6,7][stage],status:'passed'});
    await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
    await context.close();
   }
  }}finally{await browser.close()}
 }
 console.log(JSON.stringify(results,null,2));
}finally{await new Promise(resolve=>server.close(resolve))}
