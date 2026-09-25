// Produce independent 16 kHz mono WAV clips without loading an ASR model on the phone.
export const CHUNK_SECONDS=20;
export const CHUNK_STEP=18; // Repeat two seconds across boundaries to retain cut syllables.
const RATE=16000;

export async function inspectWav(file){
  const buffer=await file.slice(0,Math.min(file.size,1048576)).arrayBuffer();
  const view=new DataView(buffer),tag=(at)=>String.fromCharCode(...new Uint8Array(buffer,at,4));
  if(view.byteLength<12||tag(0)!=='RIFF'||tag(8)!=='WAVE')return null;
  let format=null,dataOffset=-1,dataLength=0;
  for(let at=12;at+8<=view.byteLength;){
    const size=view.getUint32(at+4,true),next=at+8+size+(size%2);
    if(tag(at)==='fmt '&&size>=16&&at+24<=view.byteLength){
      format={kind:view.getUint16(at+8,true),channels:view.getUint16(at+10,true),rate:view.getUint32(at+12,true),block:view.getUint16(at+20,true),bits:view.getUint16(at+22,true)};
    }
    if(tag(at)==='data'){dataOffset=at+8;dataLength=Math.min(size,file.size-dataOffset);break;}
    if(next<=at||next>file.size)break;
    at=next;
  }
  if(!format||dataOffset<0||!format.rate||format.rate>192000||!format.channels||format.channels>8||format.block!==format.channels*format.bits/8||![16,24,32].includes(format.bits)||![1,3].includes(format.kind)||format.kind===3&&format.bits!==32)return null;
  return {...format,dataOffset,frames:Math.floor(dataLength/format.block),duration:dataLength/format.block/format.rate};
}

function wav16(samples){
  const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer),bytes=new Uint8Array(buffer);
  const tag=(at,str)=>{for(let i=0;i<str.length;i++)bytes[at+i]=str.charCodeAt(i);};
  tag(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);tag(8,'WAVE');tag(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,RATE,true);
  v.setUint32(28,RATE*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
  tag(36,'data');v.setUint32(40,samples.length*2,true);
  for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);
  return buffer;
}

function readPcm(v,at,format){
  if(format.kind===3)return v.getFloat32(at,true);
  if(format.bits===16)return v.getInt16(at,true)/32768;
  if(format.bits===32)return v.getInt32(at,true)/2147483648;
  const n=v.getUint8(at)|v.getUint8(at+1)<<8|v.getUint8(at+2)<<16;
  return (n&0x800000?n-0x1000000:n)/8388608;
}

export async function* audioChunks(file,{signal}={}){
  const wav=await inspectWav(file);
  if(wav){
    const framesPerChunk=Math.round(CHUNK_SECONDS*wav.rate),framesPerStep=Math.round(CHUNK_STEP*wav.rate);
    for(let first=0;first<wav.frames;first+=framesPerStep){
      if(signal?.aborted)throw new DOMException('Aborted','AbortError');
      const count=Math.min(framesPerChunk,wav.frames-first);
      const bytes=await file.slice(wav.dataOffset+first*wav.block,wav.dataOffset+(first+count)*wav.block).arrayBuffer();
      const v=new DataView(bytes),out=new Float32Array(Math.ceil(count*RATE/wav.rate));
      // Box-filter each output sample over the source frames it covers: a cheap low-pass before 16 kHz.
      const ratio=wav.rate/RATE;
      for(let i=0;i<out.length;i++){
        const first=Math.min(count-1,Math.floor(i*ratio)),last=Math.max(first+1,Math.min(count,Math.floor((i+1)*ratio)));
        let sum=0;
        for(let frame=first;frame<last;frame++)for(let c=0;c<wav.channels;c++)sum+=readPcm(v,frame*wav.block+c*wav.bits/8,wav);
        out[i]=sum/((last-first)*wav.channels);
      }
      yield {start:first/wav.rate,duration:count/wav.rate,wav:wav16(out),total:wav.duration};
      if(first+count>=wav.frames)break;
    }
    return;
  }
  // Compressed sources need browser decoding, but Whisper itself stays on the server.
  const context=new AudioContext();
  try{
    const decoded=await context.decodeAudioData(await file.arrayBuffer());
    for(let start=0;start<decoded.duration;start+=CHUNK_STEP){
      if(signal?.aborted)throw new DOMException('Aborted','AbortError');
      const length=Math.min(CHUNK_SECONDS,decoded.duration-start);
      const offline=new OfflineAudioContext(1,Math.ceil(length*RATE),RATE);
      const source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);
      source.start(0,start,length);
      const rendered=await offline.startRendering();
      yield {start,duration:length,wav:wav16(rendered.getChannelData(0)),total:decoded.duration};
      if(start+length>=decoded.duration)break;
    }
  }finally{await context.close();}
}
