'use strict';

class TableSound {
  constructor() {
    this.context=null;
    this.enabled=false;
    this.ambient=null;
  }
  toggle() {
    const Context=window.AudioContext || window.webkitAudioContext;
    if (!Context) return false;
    if (!this.context) {
      this.context=new Context();
      this.master=this.context.createGain();
      this.master.gain.value=.35;
      this.master.connect(this.context.destination);
    }
    this.enabled=!this.enabled;
    if (this.enabled) {
      this.context.resume().catch(()=>{});
      this.ambient=setInterval(()=>this.music(),3800);
      this.music();
    } else {
      clearInterval(this.ambient);
      this.context.suspend().catch(()=>{});
    }
    return this.enabled;
  }
  tone(freq,end,duration,volume,type='sine',offset=0) {
    if (!this.enabled) return;
    const ctx=this.context, t=ctx.currentTime+offset;
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(freq,t);
    osc.frequency.exponentialRampToValueAtTime(end,t+duration);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(volume,t+Math.min(.065,duration*.18));
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t+duration+.03);
    osc.onended=()=>{ osc.disconnect(); gain.disconnect(); };
  }
  noise(duration,frequency,volume,offset=0) {
    if (!this.enabled) return;
    const ctx=this.context, t=ctx.currentTime+offset;
    const source=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), gain=ctx.createGain();
    const samples=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate);
    const data=samples.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    source.buffer=samples;
    filter.type='bandpass';
    filter.frequency.value=frequency;
    filter.Q.value=1.2;
    gain.gain.setValueAtTime(volume,t);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(t);
    source.onended=()=>{ source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  music() {
    if (document.hidden) return;
    this.tone(55,54,3.6,.036);
    this.tone(82.4,82,3.5,.020,'sine',.18);
    this.tone(138.6,136,2.9,.016,'triangle',.6);
    this.tone(207.65,205,1.1,.018,'sine',1.15);
    this.noise(2.9,510,.013,.33);
  }
  play(kind,style) {
    if (kind==='discard') {
      this.tone(1100,520,.115,.19,'triangle');
      this.noise(.11,2200,.27);
      this.tone(820,760,.072,.07,'sine',.04);
    }
    if (kind==='call' || kind==='riichi') {
      this.tone(290,140,.31,.14,'triangle');
      this.tone(760,400,.25,.11,'triangle',.045);
    }
    if (kind==='claim') {
      this.tone(117,52,.53,.24,'triangle');
      this.tone(580,210,.21,.13,'triangle',.035);
    }
    if (kind==='veto') {
      const root={eclipse:143,echo:227,void:318,ruin:76}[style] || 143;
      this.tone(root,39,.83,.45,'sawtooth');
      this.tone(root*3,root,.5,.14,'triangle',.12);
      this.noise(.58,style==='void'?840:1700,.36,.04);
      if (style==='echo') for (let i=1;i<=3;i++) this.tone(root*2,root,.24,.13/i,'triangle',i*.14);
    }
    if (kind==='cheat' || kind==='focus') this.tone(544,752,.24,.12,'sine');
    if (kind==='caught') this.noise(.22,420,.28);
    if (kind==='start' || kind==='win') {
      [164.8,196,246.9,329.6].forEach((f,i)=>this.tone(f,f*.99,1.2,.09,'triangle',i*.10));
    }
  }
}
