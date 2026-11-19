'use strict';

// 音響。assets/audio/ に決まった名前の音声ファイル（.mp3 / .ogg / .wav）を置くとそれを鳴らし、
// 無い音だけ従来の合成音で代用する。
const BGM_SLOTS=['bgm_lobby','bgm_table','bgm_tension'];
const SE_SLOTS=['se_start','se_discard','se_call','se_riichi','se_claim','se_win','se_houju','se_draw',
  'se_focus','se_cheat','se_caught','se_veto','se_veto_tsukimao','se_veto_nokosu','se_veto_lucier','se_veto_hehehe'];
const VETO_KEY={eclipse:'tsukimao',echo:'nokosu',void:'lucier',ruin:'hehehe'};

class TableSound {
  constructor() {
    this.context=null;
    this.enabled=false;
    this.ambient=null;
    this.buffers=new Map();
    this.bgmFiles=new Map();
    this.loading=null;
    this.scene='lobby';
    this.bgm=null;
    this.bgmName='';
    this.duckTimer=0;
  }
  toggle() {
    const Context=window.AudioContext || window.webkitAudioContext;
    if (!Context) return false;
    if (!this.context) {
      this.context=new Context();
      this.master=this.context.createGain();
      this.master.gain.value=.35;
      this.master.connect(this.context.destination);
      this.seGain=this.context.createGain();
      this.seGain.gain.value=2.2;
      this.seGain.connect(this.master);
    }
    this.enabled=!this.enabled;
    if (this.enabled) {
      this.context.resume().catch(()=>{});
      this.load().then(()=>this.applyScene());
      this.applyScene();
    } else {
      clearInterval(this.ambient); this.ambient=null;
      this.stopBgm();
      this.context.suspend().catch(()=>{});
    }
    return this.enabled;
  }
  // 置かれている音声ファイルを探して読み込む（初回のみ）。
  load() {
    // assets/audio/audio.json に置いたファイル名の一覧（例 ["bgm_table.mp3","se_discard.mp3"]）を読む。
    if (this.loading) return this.loading;
    this.loading=(async()=>{
      let list=[];
      try {
        const res=await fetch('assets/audio/audio.json',{cache:'no-cache'});
        if (res.ok) list=await res.json();
      } catch {}
      const files=new Map(list.map(f=>[f.replace(/\.[^.]+$/,''),'assets/audio/'+f]));
      for (const name of BGM_SLOTS) if (files.has(name)) this.bgmFiles.set(name,files.get(name));
      await Promise.all(SE_SLOTS.filter(n=>files.has(n)).map(async name=>{
        try {
          const res=await fetch(files.get(name));
          this.buffers.set(name,await this.context.decodeAudioData(await res.arrayBuffer()));
        } catch {}
      }));
    })();
    return this.loading;
  }
  // 場面ごとのBGM：lobby / table / tension
  setScene(scene) {
    if (this.scene===scene) return;
    this.scene=scene;
    if (this.enabled) this.applyScene();
  }
  applyScene() {
    if (!this.enabled) return;
    const want=this.scene==='tension' && !this.bgmFiles.has('bgm_tension') ? 'bgm_table' : 'bgm_'+this.scene;
    const url=this.bgmFiles.get(want);
    if (url) {
      clearInterval(this.ambient); this.ambient=null;
      if (this.bgmName!==want) this.crossfade(want,url);
    } else {
      this.stopBgm();
      if (!this.ambient && this.scene!=='lobby') {
        this.ambient=setInterval(()=>this.music(),3800);
        this.music();
      }
    }
  }
  crossfade(name,url) {
    const old=this.bgm;
    const next=new Audio(url);
    next.loop=true;
    next.volume=0;
    next.play().catch(()=>{});
    this.bgm=next; this.bgmName=name;
    this.fade(next,this.bgmVolume(),1200);
    if (old) this.fade(old,0,900,()=>old.pause());
  }
  bgmVolume() { return .42; }
  fade(audio,to,ms,done) {
    const from=audio.volume, start=performance.now();
    const step=now=>{
      const k=Math.min(1,(now-start)/ms);
      audio.volume=Math.max(0,Math.min(1,from+(to-from)*k));
      if (k<1) requestAnimationFrame(step); else done?.();
    };
    requestAnimationFrame(step);
  }
  stopBgm() {
    if (this.bgm) { const old=this.bgm; this.fade(old,0,500,()=>old.pause()); }
    this.bgm=null; this.bgmName='';
  }
  // 暴牌などの大きな演出中はBGMを下げる。
  duck(ms=2200) {
    if (!this.bgm) return;
    clearTimeout(this.duckTimer);
    this.fade(this.bgm,.1,180);
    this.duckTimer=setTimeout(()=>{ if (this.bgm) this.fade(this.bgm,this.bgmVolume(),900); },ms);
  }
  sample(name,volume=1,rate=1) {
    const buffer=this.buffers.get(name);
    if (!this.enabled || !buffer) return false;
    const src=this.context.createBufferSource(), gain=this.context.createGain();
    src.buffer=buffer;
    src.playbackRate.value=rate;
    gain.gain.value=volume;
    src.connect(gain).connect(this.seGain);
    src.start();
    src.onended=()=>{ src.disconnect(); gain.disconnect(); };
    return true;
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
  play(kind,style,extra={}) {
    if (!this.enabled) return;
    // 音声ファイルがあればそちらを優先。打牌は毎回わずかに高さを揺らして単調さを消す。
    if (kind==='discard' && this.sample('se_discard',.9,.94+Math.random()*.12)) return;
    if (kind==='riichi' && this.sample('se_riichi')) return;
    if (kind==='call' && this.sample('se_call')) return;
    if (kind==='claim' && this.sample('se_claim')) return;
    if (kind==='start' && this.sample('se_start')) return;
    if (kind==='focus' && this.sample('se_focus')) return;
    if (kind==='cheat' && this.sample('se_cheat')) return;
    if (kind==='caught' && this.sample('se_caught')) return;
    if (kind==='draw' && this.sample('se_draw')) return;
    if (kind==='win') {
      if (extra.houju) this.sample('se_houju',.9);
      if (this.sample('se_win')) return;
    }
    if (kind==='veto') {
      this.duck(2600);
      if (this.sample('se_veto_'+VETO_KEY[style]) || this.sample('se_veto')) return;
    }
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
