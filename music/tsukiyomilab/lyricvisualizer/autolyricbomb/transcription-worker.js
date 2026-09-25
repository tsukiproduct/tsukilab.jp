/* Browser-only first pass. The model is downloaded once and cached by the browser. */
let transcriber;
async function getTranscriber(mode){
  if(!transcriber){
    const {pipeline}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
    if(mode==='small'&&!self.navigator.gpu)throw new Error('高精度モデルには WebGPU が必要です。標準モデルを選ぶか PC の Chrome で試してください。');
    const model={tiny:'Xenova/whisper-tiny',base:'Xenova/whisper-base',small:'onnx-community/whisper-small'}[mode]||'Xenova/whisper-base';
    transcriber=await pipeline('automatic-speech-recognition',model,{
      ...(mode==='small'?{device:'webgpu',dtype:{encoder_model:'fp32',decoder_model_merged:'q4'}}:{}),
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
    const pipe=await getTranscriber(data.mode);
    const audio=new Float32Array(data.audio);
    const sampleRate=16000,windowSize=25*sampleRate;
    const total=Math.ceil(audio.length/windowSize),results=[];
    for(let i=0;i<total;i++){
      postMessage({type:'progress',current:i+1,total});
      const start=i*windowSize,end=Math.min(start+windowSize,audio.length);
      const options={task:'transcribe',return_timestamps:true};
      if(data.language&&data.language!=='auto')options.language=data.language;
      const output=await pipe(audio.subarray(start,end),options);
      const offset=start/sampleRate;
      if(output.chunks?.length){
        for(const chunk of output.chunks){
          const text=String(chunk.text||'').trim();
          if(!text)continue;
          const startTime=Number(chunk.timestamp?.[0]),endTime=Number(chunk.timestamp?.[1]);
          results.push({text,t:offset+(Number.isFinite(startTime)?Math.max(0,startTime):0),end:offset+(Number.isFinite(endTime)?endTime:(end-start)/sampleRate)});
        }
      }else if(output.text?.trim())results.push({text:output.text.trim(),t:offset,end:end/sampleRate});
    }
    postMessage({type:'done',lines:results});
  }catch(error){postMessage({type:'error',message:String(error?.message||error)});}
};
