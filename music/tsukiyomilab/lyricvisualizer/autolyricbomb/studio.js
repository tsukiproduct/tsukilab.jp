/* 月詠ラボの演出プリセット。既存エンジンの操作を組み合わせる独自UI。 */
(() => {
  'use strict';
  const presets = {
    cel: {font:'rock', anim:'pop', layout:'wander', viz:'moon', accent:'#d9f16d', dim:45, blur:6, fx:100, grain:true, underline:true, zoom:true, shake:false, rgb:false, glitch:false, hold:3.5, note:'言葉が軽やかに弾む、明るいモーション。曲を読み込むと音に合わせて動きます。'},
    collage: {font:'reggae', anim:'scatter', layout:'wander', viz:'bars', accent:'#ff4d4d', dim:43, blur:3, fx:145, grain:true, underline:false, zoom:true, shake:true, rgb:false, glitch:false, hold:2.5, note:'切り貼りしたように文字が集まり、強い拍で背景が揺れる。'},
    digital: {font:'dot', anim:'glitch', layout:'wander', viz:'mirror', accent:'#5ce1ff', dim:63, blur:4, fx:130, grain:false, underline:false, zoom:true, shake:false, rgb:true, glitch:true, hold:3, note:'文字のノイズと光のズレ。暗い映像や電子的な曲に。'},
    cinema: {font:'mincho', anim:'drift', layout:'bottom', viz:'off', accent:'#ffd24d', dim:52, blur:6, fx:55, grain:true, underline:false, zoom:false, shake:false, rgb:false, glitch:false, hold:5, note:'映像に余白を残し、歌詞がゆっくり現れて消える。'},
    note: {font:'hachi', anim:'type', layout:'wander', viz:'wave', accent:'#ff8a3d', dim:42, blur:8, fx:65, grain:true, underline:false, zoom:false, shake:false, rgb:false, glitch:false, hold:4, note:'メモを書き足すように、一文字ずつ歌詞を見せる。'},
    minimal: {font:'stick', anim:'drift', layout:'bottom', viz:'off', accent:'#ffffff', dim:38, blur:0, fx:35, grain:false, underline:false, zoom:false, shake:false, rgb:false, glitch:false, hold:4, note:'背景の映像を中心に、言葉を控えめに添える。'}
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
  function applyTemplate(id) {
    const p = presets[id]; if (!p) return;
    S.templateId=id;
    select('fontSel',p.font);select('animSel',p.anim);select('layoutSel',p.layout);select('vizSel',p.viz);
    slide('dimIn',p.dim);slide('blurIn',p.blur);slide('fxAmtIn',p.fx);slide('holdIn',p.hold);
    toggle('#grainToggle',p.grain);toggle('#underlineToggle',p.underline);
    for (const [key,value] of Object.entries({zoom:p.zoom,shake:p.shake,rgb:p.rgb,dglitch:p.glitch}))
      toggle('.toggle[data-fx="'+key+'"]',value);
    const swatch = [...document.querySelectorAll('.sw')].find(x => x.dataset.c===p.accent);
    if (swatch) swatch.click();
    active(id);
    S.seed=Math.floor(Math.random()*99999);
    demoClock=0;
  }
  document.querySelectorAll('.template-tile').forEach(tile => tile.addEventListener('click',()=>applyTemplate(tile.dataset.template)));
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
