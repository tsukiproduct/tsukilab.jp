// Small, dependency-free onset detector. Inputs are mono PCM in short clips.
export function analyzePulse(samples,offset=0,rate=16000){
  const hop=512,frames=[];let low=0;
  for(let start=0;start+hop<=samples.length;start+=hop){
    let power=0,bass=0;
    for(let i=start;i<start+hop;i++){
      const value=samples[i];low+=.045*(value-low);
      power+=value*value;bass+=low*low;
    }
    frames.push({t:offset+start/rate,e:Math.sqrt(power/hop),bass:Math.sqrt(bass/hop)});
  }
  let floor=0,prevE=0,prevB=0;
  const impulses=frames.map(f=>{
    const rise=Math.max(0,f.e-prevE)*.6+Math.max(0,f.bass-prevB)*.9;
    floor=floor*.975+rise*.025;prevE=f.e;prevB=f.bass;
    return rise;
  });
  const peaks=[];
  for(let i=2;i<frames.length-2;i++){
    const s=impulses[i];
    if(s<.009||s<impulses[i-1]||s<=impulses[i+1])continue;
    // Compare to a local baseline; each clip may have different loudness.
    let mean=0;for(let j=Math.max(0,i-32);j<i;j++)mean+=impulses[j];
    mean/=Math.min(i,32)||1;
    if(s<Math.max(.009,mean*2.1))continue;
    if(peaks.length&&frames[i].t-peaks.at(-1).t<.17){
      if(s>peaks.at(-1).strength)peaks[peaks.length-1]={t:frames[i].t,strength:s};
    }else peaks.push({t:frames[i].t,strength:s});
  }
  const sections=[];
  for(const f of frames){
    const bucket=Math.floor(f.t/8);
    const section=sections[bucket]||(sections[bucket]={start:bucket*8,energy:0,count:0});
    section.energy+=f.e;section.count++;
  }
  return {peaks,sections:sections.filter(Boolean).map(s=>({start:s.start,energy:s.energy/s.count,count:s.count}))};
}

export function summarizeMusic(chunks,duration){
  const peaks=chunks.flatMap(c=>c.peaks).sort((a,b)=>a.t-b.t);
  const buckets=new Map();
  for(const c of chunks)for(const s of c.sections){
    const v=buckets.get(s.start)||{start:s.start,total:0,count:0};
    v.total+=s.energy*s.count;v.count+=s.count;buckets.set(s.start,v);
  }
  const sections=[...buckets.values()].sort((a,b)=>a.start-b.start).map(s=>({start:s.start,energy:s.total/s.count}));
  const loudest=Math.max(.015,...sections.map(s=>s.energy));
  const quietest=Math.min(...sections.map(s=>s.energy));
  const range=loudest-quietest;
  for(const s of sections){
    const density=peaks.filter(p=>p.t>=s.start&&p.t<s.start+8).length/20;
    const relative=range>.012?(s.energy-quietest)/range:s.energy/loudest;
    s.intensity=Math.min(1,Math.round((.2+relative*.65+Math.min(.15,density*.15))*100)/100);
    delete s.energy;
  }
  const hist=new Float32Array(111);
  for(let i=0;i<peaks.length;i++)for(let j=i+1;j<peaks.length&&j<i+12;j++){
    const dt=peaks[j].t-peaks[i].t;
    if(dt>3)break;
    for(let div=1;div<=4;div++){
      const bpm=Math.round(60*div/dt);
      if(bpm>=70&&bpm<=180)hist[bpm-70]+=Math.sqrt(Math.min(peaks[i].strength,peaks[j].strength));
    }
  }
  let best=0,score=0;
  for(let i=0;i<hist.length;i++){
    const nearby=(hist[i-1]||0)+hist[i]*2+(hist[i+1]||0);
    if(nearby>score){score=nearby;best=i;}
  }
  let numerator=0,denominator=0;
  for(let i=Math.max(0,best-2);i<=Math.min(110,best+2);i++){
    numerator+=(i+70)*hist[i];denominator+=hist[i];
  }
  const bpm=peaks.length>=8&&denominator>0?Math.round(numerator/denominator):null;
  const maxStrength=Math.max(.015,...peaks.map(p=>p.strength));
  return {bpm,beats:peaks.map(p=>({t:Math.round(p.t*100)/100,strength:Math.min(1,Math.round(p.strength/maxStrength*100)/100)})),sections,duration};
}

export function pulseAt(analysis,t){
  const beats=analysis?.beats||[];let lo=0,hi=beats.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(beats[mid].t<=t)lo=mid+1;else hi=mid;}
  const b=beats[lo-1];return b?Math.max(0,1-(t-b.t)/.28)*(.45+.55*b.strength):0;
}
export function intensityAt(analysis,t){return analysis?.sections?.[Math.floor(t/8)]?.intensity??.4;}
