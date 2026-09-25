/* Long songs are sent to our Cloudflare Worker in short WAV clips for transcription. */
(()=>{
  const button=$('transcribeBtn'),status=$('transcribeStatus');
  let runId=0,running=false,vocalFile=null,controller=null;
  function refreshAvailability(){
    if(running)return;
    button.disabled=!audioFileForAnalysis;
  }
  $('audIn').addEventListener('change',refreshAvailability);
  $('vocalIn').addEventListener('change',e=>{
    vocalFile=e.target.files?.[0]||null;
    $('vocalDrop').classList.toggle('done',!!vocalFile);
    status.textContent=vocalFile?'ボーカル音源を使用します：'+vocalFile.name:'曲のミックス音源から認識します。';
    refreshAvailability();
  });
  $('cleanNotesBtn').addEventListener('click',()=>{
    const clean=text=>text.replace(/[♪♫♬♩🎵🎶]/gu,'').replace(/ {2,}/g,' ').trim();
    $('lyricsIn').value=$('lyricsIn').value.split('\n').map(clean).filter(Boolean).join('\n');
    S.lines=S.lines.map(line=>({...line,text:clean(line.text)})).filter(line=>line.text);
    selLine=-1;
    renderChips();renderSizeChips();
    status.textContent='音符を削除しました。歌詞と表示時刻はそのままです。';
  });
  function stop(){
    runId++;running=false;
    controller?.abort();controller=null;
    button.textContent='✦ 曲から歌詞を自動検出（試験版）';
    refreshAvailability();
  }
  function isNoise(text){
    const cleaned=text.replace(/[\[\]()（）♪♫♬\s.,!?。、「」:：_-]/g,'').toLowerCase();
    return !cleaned||/^(music|musical|instrumental|instrumentals|applause|silence|backgroundmusic|拍手|音楽|演奏|無音)$/.test(cleaned);
  }
  function splitLyrics(text){return window.tsukiSplitLyrics(text);}
  function resultLines(raw,duration){
    const result=[];let ignored=0;
    for(const segment of raw){
      const text=String(segment.text||'').replace(/[♪♫♬♩🎵🎶]/gu,'').replace(/\s+/gu,' ').trim();
      if(isNoise(text)){ignored++;continue;}
      const pieces=splitLyrics(text).filter(piece=>{if(isNoise(piece)){ignored++;return false;}return true;});
      const totalWeight=pieces.reduce((n,p)=>n+[...p].length,0);let passed=0;
      for(let i=0;i<pieces.length;i++){
        const text=pieces[i];
        if(!text||text.length>90)continue;
        const span=Math.max(0,Math.min(20,(segment.end||segment.t+pieces.length)-segment.t));
        const t=Number(segment.t)+span*(passed/Math.max(1,totalWeight));passed+=[...text].length;
        if(!Number.isFinite(t))continue;
        const last=result.at(-1);
        if(last&&last.text===text&&Math.abs(last.t-t)<2){ignored++;continue;}
        result.push({text,t:Math.max(0,Math.min(duration,t)),size:1});
      }
    }
    return {lines:result.sort((a,b)=>a.t-b.t),ignored};
  }
  function parseTime(value){
    if(typeof value==='number')return value;
    const parts=String(value||'').split(':').map(Number);
    return parts.length>1&&parts.every(Number.isFinite)?parts.reduce((a,b)=>a*60+b,0):Number(value);
  }
  function fromVtt(vtt){
    const lines=[];
    for(const cue of vtt.split(/\n\s*\n/)){
      const match=cue.match(/([\d:.]+)\s+-->\s+([\d:.]+)/);
      if(!match)continue;
      const text=cue.slice(cue.indexOf(match[0])+match[0].length).trim();
      lines.push({start:parseTime(match[1]),end:parseTime(match[2]),text});
    }
    return lines;
  }
  function extractSegments(data,offset,duration){
    let segments=data.segments?.length?data.segments:fromVtt(data.vtt||'');
    if(!segments.length&&data.text?.trim())segments=[{start:0,end:duration,text:data.text}];
    return segments.map(s=>({t:offset+parseTime(s.start??s.start_time??0),end:offset+parseTime(s.end??s.end_time??duration),text:s.text||''})).filter(s=>Number.isFinite(s.t));
  }
  button.addEventListener('click',async()=>{
    if(running){stop();status.textContent='自動検出を中止しました。';return;}
    const songFile=audioFileForAnalysis;
    if(!songFile)return;
    const file=vocalFile||songFile;
    if($('lyricsIn').value.trim()&&!confirm('入力済みの歌詞を自動検出結果に置き換えますか？'))return;
    running=true;const task=++runId;
    controller=new AbortController();const signal=controller.signal;
    button.textContent='検出を中止';
    status.textContent=(vocalFile?'ボーカル音源':'曲のミックス音源')+'を区間ごとに準備中…';
    try{
      // Compressed tracks are decoded by the browser; avoid two simultaneous decodes on a phone.
      await window.tsukiRhythmPending;
      if(task!==runId||audioFileForAnalysis!==songFile){stop();return;}
      const {audioChunks,CHUNK_SECONDS,CHUNK_STEP}=await import('./audio-chunks.mjs?v=20260925e');
      const raw=[];let count=0,duration=player.duration||0;
      for await(const clip of audioChunks(file,{signal})){
        if(task!==runId||audioFileForAnalysis!==songFile){if(task===runId)stop();return;}
        duration=clip.total;
        status.textContent='歌詞を解析中… '+(count+1)+' / '+(duration<=CHUNK_SECONDS?1:Math.ceil((duration-CHUNK_SECONDS)/CHUNK_STEP)+1)+' 区間';
        const response=await fetch('./api/transcribe',{method:'POST',headers:{'Content-Type':'audio/wav','X-Lyric-Language':$('asrLanguage').value},body:clip.wav,signal});
        const data=await response.json().catch(()=>({}));
        if(!response.ok)throw Error(data.error||'音声認識サーバー：'+response.status);
        raw.push(...extractSegments(data,clip.start,clip.duration));count++;
      }
      if(task!==runId)return;
      const {lines,ignored}=resultLines(raw,player.duration||duration);
      if(lines.length){
        S.lines=lines;$('lyricsIn').value=lines.map(l=>l.text).join('\n');
        S.maxHold=0;$('holdIn').value=0;$('holdLabel').textContent='歌詞の表示時間 — 制限なし（次の行まで表示）';
        selLine=-1;renderChips();renderSizeChips();updateSizeUI();
        $('spreadBtn').disabled=false;$('syncBtn').disabled=false;$('autoSyncBtn').disabled=false;
        if(Number.isFinite(player.duration))window.tsukiPreviewLine?.(0);
        window.tsukiOpenPreview?.();
        status.textContent=lines.length+' 行を仮検出しました（曲 '+Math.round(duration)+' 秒・'+count+' 区間）。'+(ignored?ignored+' 件の音楽・重複を除外。':'')+'プレビューと時刻を確認して修正してください。';
      }else status.textContent='有効な歌詞を検出できませんでした。現在の歌詞は保持しました。';
      stop();
    }catch(error){if(task!==runId)return;status.textContent='自動検出できませんでした：'+String(error?.message||error);stop();}
  });
})();
