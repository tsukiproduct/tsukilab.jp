/* 月詠ラボの演出プリセット。既存エンジンの操作を組み合わせる独自UI。 */
(() => {
  'use strict';
  const presets = {
    cel: {bg:['#1f4442','#0c1820','#d9f16d'],font:'rock', anim:'pop', layout:'wander', viz:'moon', accent:'#d9f16d', dim:45, blur:6, fx:100, grain:true, underline:true, zoom:true, shake:false, rgb:false, glitch:false, hold:0, note:'言葉が軽やかに弾む、明るいモーション。曲を読み込むと音に合わせて動きます。'},
    collage: {bg:['#3d2d25','#15100e','#ff4d4d'],font:'reggae', anim:'scatter', layout:'wander', viz:'bars', accent:'#ff4d4d', dim:43, blur:3, fx:145, grain:true, underline:false, zoom:true, shake:true, rgb:false, glitch:false, hold:0, note:'切り貼りしたように文字が集まり、強い拍で背景が揺れる。'},
    digital: {bg:['#06222e','#020609','#5ce1ff'],font:'dot', anim:'glitch', layout:'wander', viz:'mirror', accent:'#5ce1ff', dim:63, blur:4, fx:130, grain:false, underline:false, zoom:true, shake:false, rgb:true, glitch:true, hold:0, note:'文字のノイズと光のズレ。暗い映像や電子的な曲に。'},
    cinema: {bg:['#211d18','#090807','#ffd24d'],font:'mincho', anim:'drift', layout:'bottom', viz:'off', accent:'#ffd24d', dim:52, blur:6, fx:55, grain:true, underline:false, zoom:false, shake:false, rgb:false, glitch:false, hold:0, note:'映像に余白を残し、歌詞がゆっくり現れて消える。'},
    note: {bg:['#2d2733','#121016','#ff8a3d'],font:'klee', anim:'type', layout:'wander', viz:'wave', accent:'#ff8a3d', dim:42, blur:8, fx:65, grain:true, underline:false, zoom:false, shake:false, rgb:false, glitch:false, hold:0, note:'メモを書き足すように、一文字ずつ歌詞を見せる。'},
    minimal: {bg:['#262829','#111213','#ffffff'],font:'stick', anim:'drift', layout:'bottom', viz:'off', accent:'#ffffff', dim:38, blur:0, fx:35, grain:false, underline:false, zoom:false, shake:false, rgb:false, glitch:false, hold:0, note:'背景の映像を中心に、言葉を控えめに添える。'},
    zine: {bg:['#2e1515','#0e0808','#ff4d4d'],font:'dela',anim:'slam',layout:'wander',viz:'grid',accent:'#ff4d4d',dim:54,blur:0,fx:145,grain:true,underline:false,zoom:false,shake:true,rgb:false,glitch:false,hold:0,note:'切り抜き紙片、格子、強い着地。サビでは衝撃を前に出す。'},
    club: {bg:['#231040','#06030d','#9d7bff'],font:'gothic',anim:'pulse',layout:'center',viz:'mirror',accent:'#9d7bff',dim:70,blur:5,fx:150,grain:false,underline:false,zoom:true,shake:false,rgb:true,glitch:false,hold:0,note:'拍で脈打つタイポとネオンの環。電子音の強弱に反応。'},
    ink: {bg:['#232421','#0b0b0a','#ffffff'],font:'mincho',anim:'echo',layout:'wander',viz:'off',accent:'#ffffff',dim:46,blur:6,fx:55,grain:true,underline:false,zoom:false,shake:false,rgb:false,glitch:false,hold:0,note:'墨の輪郭と余白。歌詞の残像で静かな場面に奥行きを。'},
    sunrise: {bg:['#2c2350','#e89a5b','#ffd24d'],font:'maru',anim:'wipe',layout:'bottom',viz:'shards',accent:'#ffd24d',dim:49,blur:4,fx:105,grain:false,underline:true,zoom:true,shake:false,rgb:false,glitch:false,hold:0,note:'光の帯で言葉を開く。曲の後半や希望に向かう場面に。'},
    vertical: {bg:['#2d1f27','#0d090c','#e1b9b3'],font:'mincho',anim:'drift',layout:'tateRight',viz:'off',accent:'#e1b9b3',dim:78,blur:4,fx:55,grain:true,underline:false,zoom:false,shake:false,rgb:false,glitch:false,hold:0,note:'右側に縦書きの歌詞がふわっと現れる。背景がなくても、暗い余白と文字だけで見せます。'},
    desktop: {bg:['#13273d','#13273d','#47749e'],font:'dot',anim:'type',layout:'center',viz:'off',accent:'#47749e',dim:0,blur:0,fx:40,grain:false,underline:false,zoom:false,shake:false,rgb:false,glitch:false,hold:0,note:'架空のデスクトップに歌詞を打ち込む。OSの窓、フォルダとカーソルで物語を作ります。'},
    edge: {bg:['#161616','#040404','#ff3b3b'],font:'dela',anim:'coolMix',layout:'center',viz:'off',accent:'#ff3b3b',dim:64,blur:2,fx:120,grain:true,underline:false,zoom:true,shake:false,rgb:false,glitch:false,hold:0,note:'かっこいい：拍で一気に入り、止めて読ませ、スナップで抜く。サビは閃光のインパクト。'},
    kawaii: {bg:['#ffb3d4','#b3a4ff','#ffffff'],font:'mochiy',anim:'cuteMix',layout:'wander',viz:'off',accent:'#ff7eb6',dim:6,blur:8,fx:85,grain:false,underline:false,zoom:true,shake:false,rgb:false,glitch:false,hold:0,note:'かわいい：文字がぷにっと弾み、ステッカーの縁取りと星がきらめく。'},
    art: {bg:['#1c1e20','#0c0d0e','#e8e2d0'],font:'zenold',anim:'artMix',layout:'wander',viz:'off',accent:'#e8e2d0',dim:60,blur:10,fx:40,grain:true,underline:false,zoom:false,shake:false,rgb:false,glitch:false,hold:0,note:'芸術的：ぼけから焦点が合い、余白に置かれた言葉が灰のように散る。'},
    crayon: {bg:['#ece1c5','#ece1c5','#c56658'],font:'hachi',anim:'draw',layout:'center',viz:'off',accent:'#c56658',dim:0,blur:0,fx:45,grain:true,underline:false,zoom:false,shake:false,rgb:false,glitch:false,hold:0,note:'紙に一文字ずつ描く手描きの質感。歌詞と落書きだけでMVにできます。'}
  };
  const order = Object.keys(presets);
  const select = (id,value) => { const el = $(id); el.value = value; el.dispatchEvent(new Event('change',{bubbles:true})); };
  const slide = (id,value) => { const el = $(id); el.value = value; el.dispatchEvent(new Event('input',{bubbles:true})); };
  const toggle = (selector,on) => {
    const el = document.querySelector(selector + ' button[data-v="' + (on ? '1':'0') + '"]');
    if (el) el.click();
  };
  const active = id => {
    document.querySelectorAll('.template-tile').forEach(tile => {
      const selected = tile.dataset.template === id;
      tile.classList.toggle('selected',selected);
      tile.setAttribute('aria-pressed',selected?'true':'false');
    });
    const i = order.indexOf(id);
    $('templateCount').textContent = String(i+1).padStart(2,'0')+' / '+String(order.length).padStart(2,'0');
    $('templateNote').textContent = presets[id].note;
  };
  function applyTemplate(id,restart=true) {
    const p = presets[id]; if (!p) return;
    S.templateId=id;
    select('fontSel',p.font);select('animSel',p.anim);select('layoutSel',p.layout);select('vizSel',p.viz);
    slide('dimIn',p.dim);slide('blurIn',p.blur);slide('fxAmtIn',p.fx);slide('holdIn',p.hold);
    toggle('#grainToggle',p.grain);toggle('#underlineToggle',p.underline);
    for (const [key,value] of Object.entries({zoom:p.zoom,shake:p.shake,rgb:p.rgb,dglitch:p.glitch}))
      toggle('.toggle[data-fx="'+key+'"]',value);
    const swatch = [...document.querySelectorAll('.sw')].find(x => x.dataset.c===p.accent);
    if (swatch) swatch.click();
    else {
      // Template colours outside the palette still apply.
      S.accent=p.accent;document.documentElement.style.setProperty('--acc',p.accent);
      document.querySelectorAll('.sw').forEach(el=>el.classList.remove('on'));
    }
    active(id);
    S.seed=Math.floor(Math.random()*99999);
    if(restart)demoClock=0;
  }
  window.tsukiApplyTemplate=applyTemplate;
  // Without background media each template still gets its own tone: a vertical gradient and a soft glow.
  window.tsukiBackdrop=g=>{
    const p=presets[S.templateId];if(!p?.bg)return false;
    const [top,bottom,glow]=p.bg,grad=g.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,top);grad.addColorStop(1,bottom);g.fillStyle=grad;g.fillRect(0,0,W,H);
    const light=g.createRadialGradient(W*.5,H*.42,0,W*.5,H*.42,H*.8);
    light.addColorStop(0,glow+'22');light.addColorStop(1,glow+'00');g.fillStyle=light;g.fillRect(0,0,W,H);
    return true;
  };
  document.querySelectorAll('.template-tile').forEach(tile => tile.addEventListener('click',()=>{
    window.tsukiStopDirectorSample?.();
    if(S.lines.some(line=>line.animKey||line.layoutKey||line.graphicKey)){
      S.directionBackup=S.lines.map(line=>({text:line.text,t:line.t,animKey:line.animKey,layoutKey:line.layoutKey,graphicKey:line.graphicKey}));
      S.lines=S.lines.map(line=>({...line,animKey:undefined,layoutKey:undefined,graphicKey:undefined}));
      $('restoreDirectionBtn').hidden=false;
      updateSizeUI();
    }
    applyTemplate(tile.dataset.template);
    if(player.src&&S.lines.length){
      window.tsukiPreviewLine?.(selLine>=0?selLine:0);
      if(window.innerWidth<=950)window.tsukiOpenPreview?.();
    }
    document.dispatchEvent(new Event('tsuki:template-applied'));
  }));
  $('restoreDirectionBtn').addEventListener('click',()=>{
    const backup=S.directionBackup;
    if(!backup||backup.length!==S.lines.length||backup.some((entry,i)=>entry.text!==S.lines[i].text||entry.t!==S.lines[i].t)){
      $('templateNote').textContent='歌詞や時刻が変わったため、前の行別演出は戻せません。Jev でもう一度演出できます。';
      return;
    }
    S.lines=S.lines.map((line,i)=>({...line,animKey:backup[i].animKey,layoutKey:backup[i].layoutKey,graphicKey:backup[i].graphicKey}));
    S.directionBackup=null;$('restoreDirectionBtn').hidden=true;
    updateSizeUI();renderSizeChips();
    $('templateNote').textContent='行ごとの演出を戻しました。テンプレートの色・背景はそのままです。';
    if(player.src)window.tsukiPreviewLine?.(selLine>=0?selLine:0);
  });
  $('demoToggle').addEventListener('click',()=>{
    demoPlaying=!demoPlaying;
    $('demoToggle').textContent=demoPlaying?'一時停止':'もう一度再生';
    $('demoToggle').setAttribute('aria-pressed',demoPlaying?'true':'false');
    if(demoPlaying)demoClock=0;
  });
  $('audIn').addEventListener('change', event => {
    const file=event.target.files && event.target.files[0];
    if(file) $('trackName').textContent=file.name.replace(/\.[^.]+$/,'');
  });
  document.addEventListener('tsuki:project-restored',()=>active(presets[S.templateId]?S.templateId:'cel'));
  let saved=false;
  try{saved=!!localStorage.getItem('tsukilab.autolyricbomb');}catch(e){}
  if(saved) active(presets[S.templateId]?S.templateId:'cel'); else applyTemplate('cel');
})();
