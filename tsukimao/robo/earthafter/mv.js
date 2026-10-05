/* EARTH AFTER — music video player (HLS: Safari native / hls.js elsewhere) */
(function(){
  var v=document.getElementById('mvVideo');if(!v)return;
  var SRC='media/mv3/master.m3u8',err=document.getElementById('mvErr'),ready=false,loading=false,queue=[],hls=null,started=false;
  function flush(){var q=queue;queue=[];q.forEach(function(f){f()})}
  function fail(){if(err)err.hidden=false}
  function attach(cb){
    if(ready){cb&&cb();return}
    if(cb)queue.push(cb);
    if(loading)return;loading=true;
    if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=SRC;ready=true;flush();return}
    var s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    s.onload=function(){
      if(!window.Hls||!Hls.isSupported()){fail();return}
      hls=new Hls({capLevelToPlayerSize:true,startLevel:-1,autoStartLoad:false});
      hls.on(Hls.Events.ERROR,function(_,d){if(d.fatal){if(d.type===Hls.ErrorTypes.NETWORK_ERROR)hls.startLoad();else if(d.type===Hls.ErrorTypes.MEDIA_ERROR)hls.recoverMediaError();else fail()}});
      hls.loadSource(SRC);hls.attachMedia(v);ready=true;if(queue.length){started=true;hls.startLoad()}flush();
    };
    s.onerror=fail;document.head.appendChild(s);
  }
  // prepare the stream when the player comes near the viewport, so the first tap plays immediately
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){attach();io.disconnect()}})},{rootMargin:'400px 0px'});
    io.observe(v);
  }else attach();
  v.addEventListener('play',function(){
    if(!ready){v.pause();attach(function(){v.play().catch(function(){})})}
    if(hls&&!started){started=true;hls.startLoad()}
    try{if(typeof P!=='undefined'&&P.pause)P.pause()}catch(e){}
  });
  // pause the MV when the animatic starts, and when scrolled far away
  var ab=document.getElementById('bPlay'),sc=document.getElementById('screen');
  [ab,sc].forEach(function(el){el&&el.addEventListener('click',function(){if(!v.paused)v.pause()})});
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting&&!v.paused&&!document.fullscreenElement&&!v.webkitDisplayingFullscreen)v.pause()})},{threshold:0}).observe(v);
  }
})();
