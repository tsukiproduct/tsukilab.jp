/* Experimental local transcription; audio is never uploaded by this module. */
(()=>{
  const button=$('transcribeBtn'),status=$('transcribeStatus');
  let worker=null,runId=0,running=false,vocalFile=null;
  $('audIn').addEventListener('change',()=>{button.disabled=!audioFileForAnalysis;});
  $('vocalIn').addEventListener('change',e=>{
    vocalFile=e.target.files?.[0]||null;
    $('vocalDrop').classList.toggle('done',!!vocalFile);
    status.textContent=vocalFile?'ボーカル音源を使用します：'+vocalFile.name:'曲のミックス音源から認識します。';
  });
  function stop(){
    runId++;running=false;
    if(worker){worker.terminate();worker=null;}
    button.disabled=!audioFileForAnalysis;
    button.textContent='✦ 曲から歌詞を自動検出（試験版）';
  }
  function isNoise(text){
    const cleaned=text.replace(/[\[\]()（）♪♫♬\s.,!?。、「」:：_-]/g,'').toLowerCase();
    return !cleaned||/^(music|musical|instrumental|instrumentals|applause|silence|backgroundmusic|拍手|音楽|演奏|無音)$/.test(cleaned);
  }
  function resultLines(raw,duration){
    const result=[];let ignored=0;
    for(const segment of raw){
      const text=String(segment.text||'').trim();
      if(isNoise(text)){ignored++;continue;}
      const pieces=text.split(/(?<=[。！？!?])\s*/u).map(s=>s.trim()).filter(Boolean).filter(piece=>{if(isNoise(piece)){ignored++;return false;}return true;});
      for(let i=0;i<pieces.length;i++){
        const text=pieces[i];
        if(!text||text.length>90)continue;
        const span=Math.max(0,Math.min(20,(segment.end||segment.t+pieces.length)-segment.t));
        const t=Number(segment.t)+span*(i/pieces.length);
        if(!Number.isFinite(t))continue;
        const last=result.at(-1);
        if(last&&last.text===text&&Math.abs(last.t-t)<2){ignored++;continue;}
        result.push({text,t:Math.max(0,Math.min(duration,t)),size:1});
      }
    }
    return {lines:result.sort((a,b)=>a.t-b.t),ignored};
  }
  button.addEventListener('click',async()=>{
    if(running){stop();status.textContent='自動検出を中止しました。';return;}
    const songFile=audioFileForAnalysis;
    if(!songFile)return;
    const file=vocalFile||songFile;
    if($('lyricsIn').value.trim()&&!confirm('入力済みの歌詞を自動検出結果に置き換えますか？'))return;
    running=true;const task=++runId;
    button.textContent='検出を中止';
    status.textContent=(vocalFile?'ボーカル音源':'曲のミックス音源')+'を読み込んでいます…';
    try{
      const decoding=new AudioContext();
      let decoded;
      try{decoded=await decoding.decodeAudioData(await file.arrayBuffer());}
      finally{await decoding.close();}
      if(task!==runId||audioFileForAnalysis!==songFile){if(task===runId)stop();return;}
      const length=Math.ceil(decoded.duration*16000);
      const offline=new OfflineAudioContext(1,length,16000);
      const source=offline.createBufferSource();source.buffer=decoded;
      source.connect(offline.destination);source.start(0);
      const mono=await offline.startRendering();
      if(task!==runId||audioFileForAnalysis!==songFile){if(task===runId)stop();return;}
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
          const {lines,ignored}=resultLines(data.lines,player.duration||decoded.duration);
          if(lines.length){
            S.lines=lines;
            $('lyricsIn').value=lines.map(l=>l.text).join('\n');
            selLine=-1;renderChips();renderSizeChips();updateSizeUI();
            $('spreadBtn').disabled=false;$('syncBtn').disabled=false;
            $('autoSyncBtn').disabled=false;
            if(Number.isFinite(player.duration))player.currentTime=Math.min(Math.max(0,lines[0].t+.3),player.duration);
            status.textContent=lines.length+' 行を仮検出しました。'+(ignored?ignored+' 件の音楽・重複を除外。':'')+'プレビューと時刻を確認して修正してください。';
          }else status.textContent='有効な歌詞を検出できませんでした。「music」等の音楽検出は追加せず、現在の歌詞を保持しました。ボーカル音源または上位モデルを試してください。';
          stop();
        }
      };
      currentWorker.onerror=()=>{if(worker!==currentWorker||task!==runId)return;status.textContent='ブラウザで認識モデルを起動できませんでした。';stop();};
      currentWorker.postMessage({type:'transcribe',audio:samples.buffer,mode:$('asrModel').value,language:$('asrLanguage').value},[samples.buffer]);
    }catch(error){if(task!==runId)return;status.textContent='音声を解析できませんでした：'+String(error?.message||error);stop();}
  });
})();
