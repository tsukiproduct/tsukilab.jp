/* Song-level rhythm analysis. Works incrementally for PCM WAVs. */
(()=>{
  let generation=0,pending=Promise.resolve();
  async function analyze(file,mine){
    window.tsukiRhythm=null;
    const status=$('rhythmStatus');
    status.textContent='曲の拍と盛り上がりを解析中…';
    try{
      const [{audioChunks,CHUNK_SECONDS},core]=await Promise.all([import('./audio-chunks.mjs'),import('./rhythm-core.mjs')]);
      const chunks=[];let count=0,duration=0;
      for await(const clip of audioChunks(file)){
        if(mine!==generation)return null;
        const pcm=new Int16Array(clip.wav,44),samples=new Float32Array(pcm.length);
        for(let i=0;i<pcm.length;i++)samples[i]=pcm[i]/32768;
        chunks.push(core.analyzePulse(samples,clip.start));duration=clip.total;count++;
        status.textContent='拍を解析中… '+count+' / '+Math.ceil(duration/CHUNK_SECONDS)+' 区間';
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      if(mine!==generation)return null;
      const summary=core.summarizeMusic(chunks,duration);
      window.tsukiRhythm=summary;
      window.tsukiBeatAt=t=>core.pulseAt(summary,t);
      window.tsukiIntensityAt=t=>core.intensityAt(summary,t);
      status.textContent=summary.beats.length?(summary.bpm?`推定 ${summary.bpm} BPM`: 'テンポ推定中')+' / '+summary.beats.length+' 拍候補を検出。Jev の演出にも反映します。':'拍を確定できませんでした。音量に連動する演出は引き続き利用できます。';
      return summary;
    }catch(e){
      if(mine===generation)status.textContent='拍の解析は利用できませんでした。音量連動で演出できます。';
      return null;
    }
  }
  $('audIn').addEventListener('change',event=>{
    const file=event.target.files?.[0];
    if(file){
      const mine=++generation;
      // Serialize browser decodes if the user quickly chooses another long song.
      pending=pending.catch(()=>null).then(()=>mine===generation?analyze(file,mine):null);
      window.tsukiRhythmPending=pending;
    }
  });
})();
