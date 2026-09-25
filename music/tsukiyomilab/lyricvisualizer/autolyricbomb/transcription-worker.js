/* Browser-only first pass. The model is downloaded once and cached by the browser. */
let transcriber;
async function getTranscriber(){
  if(!transcriber){
    const {pipeline}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
    transcriber=await pipeline('automatic-speech-recognition','Xenova/whisper-tiny',{
      progress_callback:p=>{
        if(p.status==='progress'&&Number.isFinite(p.progress))postMessage({type:'download',percent:Math.round(p.progress)});
      }
    });
  }
  return transcriber;
}
self.onmessage=async ({data})=>{
  if(data.type!=='transcribe')return;
  try{
    const pipe=await getTranscriber();
    const audio=new Float32Array(data.audio);
    const sampleRate=16000,windowSize=25*sampleRate;
    const total=Math.ceil(audio.length/windowSize),results=[];
    for(let i=0;i<total;i++){
      postMessage({type:'progress',current:i+1,total});
      const start=i*windowSize,end=Math.min(start+windowSize,audio.length);
      const output=await pipe(audio.subarray(start,end),{task:'transcribe',return_timestamps:true});
      const offset=start/sampleRate;
      if(output.chunks?.length){
        for(const chunk of output.chunks){
          const text=String(chunk.text||'').trim();
          if(!text)continue;
          const startTime=Number(chunk.timestamp?.[0]);
          results.push({text,t:offset+(Number.isFinite(startTime)?Math.max(0,startTime):0)});
        }
      }else if(output.text?.trim())results.push({text:output.text.trim(),t:offset});
    }
    postMessage({type:'done',lines:results});
  }catch(error){postMessage({type:'error',message:String(error?.message||error)});}
};
