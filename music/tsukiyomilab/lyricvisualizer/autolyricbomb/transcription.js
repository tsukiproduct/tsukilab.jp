/* Experimental local transcription; audio is never uploaded by this module. */
(()=>{
  const button=$('transcribeBtn'),status=$('transcribeStatus');
  let worker=null,runId=0,running=false;
  $('audIn').addEventListener('change',()=>{button.disabled=!audioFileForAnalysis;});
  function stop(){
    runId++;running=false;
    if(worker){worker.terminate();worker=null;}
    button.disabled=!audioFileForAnalysis;
    button.textContent='✦ 曲から歌詞を自動検出（試験版）';
  }
  function resultLines(raw,duration){
    const result=[];
    for(const segment of raw){
      const pieces=String(segment.text).split(/(?<=[。！？!?])\s*|(?<=、)\s+/u).map(s=>s.trim()).filter(Boolean);
      for(let i=0;i<pieces.length;i++){
        const text=pieces[i];
        if(!text||text.length>90)continue;
        result.push({text,t:Math.max(0,Math.min(duration,segment.t+i*.5)),size:1});
      }
    }
    return result.sort((a,b)=>a.t-b.t);
  }
  button.addEventListener('click',async()=>{
    if(running){stop();status.textContent='自動検出を中止しました。';return;}
    const file=audioFileForAnalysis;
    if(!file)return;
    if($('lyricsIn').value.trim()&&!confirm('入力済みの歌詞を自動検出結果に置き換えますか？'))return;
    running=true;const task=++runId;
    button.textContent='検出を中止';
    status.textContent='曲を読み込んでいます…';
    try{
      const decoding=new AudioContext();
      let decoded;
      try{decoded=await decoding.decodeAudioData(await file.arrayBuffer());}
      finally{await decoding.close();}
      if(task!==runId||audioFileForAnalysis!==file){if(task===runId)stop();return;}
      const length=Math.ceil(decoded.duration*16000);
      const offline=new OfflineAudioContext(1,length,16000);
      const source=offline.createBufferSource();source.buffer=decoded;
      source.connect(offline.destination);source.start(0);
      const mono=await offline.startRendering();
      if(task!==runId||audioFileForAnalysis!==file){if(task===runId)stop();return;}
      const samples=mono.getChannelData(0).slice();
      if(!worker)worker=new Worker('./transcription-worker.js',{type:'module'});
      const currentWorker=worker;
      currentWorker.onmessage=({data})=>{
        if(worker!==currentWorker||task!==runId)return;
        if(data.type==='download')status.textContent='認識モデルを準備中… '+data.percent+'%';
        if(data.type==='progress')status.textContent='歌詞を解析中… '+data.current+' / '+data.total+' 区間';
        if(data.type==='error'){
          status.textContent='自動検出できませんでした：'+data.message+'。対応ブラウザと通信環境を確認してください。';stop();
        }
        if(data.type==='done'){
          const lines=resultLines(data.lines,decoded.duration);
          if(lines.length){
            S.lines=lines;
            $('lyricsIn').value=lines.map(l=>l.text).join('\n');
            selLine=-1;renderChips();renderSizeChips();updateSizeUI();
            $('spreadBtn').disabled=false;$('syncBtn').disabled=false;
            $('autoSyncBtn').disabled=false;
            status.textContent=lines.length+' 行を仮検出しました。歌詞とタイムラインを確認して修正してください。';
          }else status.textContent='歌詞を検出できませんでした。伴奏が強い場合は歌詞を入力し、時刻を合わせてください。';
          stop();
        }
      };
      currentWorker.onerror=()=>{if(worker!==currentWorker||task!==runId)return;status.textContent='ブラウザで認識モデルを起動できませんでした。';stop();};
      currentWorker.postMessage({type:'transcribe',audio:samples.buffer},[samples.buffer]);
    }catch(error){if(task!==runId)return;status.textContent='音声を解析できませんでした：'+String(error?.message||error);stop();}
  });
})();
