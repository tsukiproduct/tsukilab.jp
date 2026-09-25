/* Jev plans are computed by the optional server. Sample scenes below are explicitly illustrative. */
(()=>{
  const sample=[
    {label:'INTRO / 予感',text:'夜が溶けていく',why:'余白と遅い登場で、最初の言葉を聴かせる',template:'cinema',animKey:'drift',layoutKey:'bottom',size:1},
    {label:'VERSE / 揺らぎ',text:'届きそうで 届かない',why:'文字が散り、気持ちの迷いを見せる',template:'collage',animKey:'scatter',layoutKey:'wander',size:1.2},
    {label:'CHORUS / 解放',text:'いま、全部叫べ！',why:'大きな文字が拍に合わせて弾ける',template:'cel',animKey:'pop',layoutKey:'wander',size:1.6},
    {label:'OUTRO / 余韻',text:'まだ光が残っている',why:'動きを落として映像と最後の言葉を残す',template:'minimal',animKey:'drift',layoutKey:'bottom',size:1}
  ];
  const row=$('directorScenes'),status=$('directorStatus');
  const readable={pop:'一文字ずつ跳ねる',scatter:'散って集まる',glitch:'ノイズとズレ',type:'一文字ずつ出る',drift:'静かに漂う',slam:'拍で着地',wipe:'光で開く',pulse:'拍で脈打つ',echo:'残像を残す',stagger:'交互に跳ねる',draw:'手描きで現れる'};
  let sampleOpen=false;
  let currentRequest=null,partial=null;
  $('directorExpandBtn').addEventListener('click',()=>{
    const expanded=row.classList.toggle('expanded');
    $('directorExpandBtn').textContent=expanded?'一覧をたたむ ↑':'全行を表示 ↓';
    $('directorExpandBtn').setAttribute('aria-expanded',String(expanded));
  });
  function show(scenes,source){
    row.replaceChildren();
    $('directorSceneHint').hidden=scenes.length<=4;
    $('directorLineCount').textContent=source==='sample'?'サンプル '+scenes.length+' 場面':'演出結果 '+scenes.length+' / '+S.lines.length+' 行';
    $('directorExpandBtn').hidden=scenes.length<=4;
    scenes.forEach((scene,i)=>{
      const btn=document.createElement('button');btn.type='button';btn.className='director-scene';
      const head=document.createElement('strong');head.textContent=scene.label||'LINE '+String(i+1).padStart(2,'0');
      const lyric=document.createElement('span');lyric.textContent=scene.text;
      const note=document.createElement('small');note.textContent=scene.why||readable[scene.animKey]||'動きを調整';
      btn.append(head,lyric,note);
      btn.addEventListener('click',()=>{
        if(source==='sample'){
          demoClock=i*2.8;window.tsukiDirectorDemo.current=-1;demoPlaying=true;
        }else if(S.lines[i]&&player.src){window.tsukiPreviewLine?.(i);window.tsukiOpenPreview?.();}
      });
      row.append(btn);
    });
  }
  window.tsukiDirectorHighlight=index=>row.querySelectorAll('.director-scene').forEach((el,i)=>el.classList.toggle('on',i===index));
  window.tsukiStopDirectorSample=()=>{
    window.tsukiDirectorDemo=null;sampleOpen=false;
    $('directorSampleBtn').textContent='演出プランのサンプルを見る ▶';
  };
  document.addEventListener('tsuki:template-applied',()=>{
    row.replaceChildren();$('directorSceneHint').hidden=true;$('directorExpandBtn').hidden=true;
    $('directorLineCount').textContent='演出一覧';partial=null;
    status.textContent=S.lines.length?'テンプレートを適用しました。前の行別演出はテンプレート下のボタンで戻せます。':'テンプレートのサンプルを表示しています。';
  });
  $('directorSampleBtn').addEventListener('click',()=>{
    if(sampleOpen){window.tsukiDirectorDemo=null;sampleOpen=false;row.replaceChildren();$('directorSampleBtn').textContent='演出プランのサンプルを見る ▶';status.textContent='サンプルを終了しました。';return;}
    player.pause();demoClock=0;demoPlaying=true;sampleOpen=true;
    window.tsukiDirectorDemo={scenes:sample,current:-1};
    $('demoToggle').textContent='一時停止';$('directorSampleBtn').textContent='サンプルを閉じる ×';
    status.textContent='これは架空の歌詞を使う演出例です。各カットを押すと、その場面から再生します。Jev の実行結果ではありません。';
    show(sample,'sample');
  });
  $('directorLiveBtn').addEventListener('click',async()=>{
    if(currentRequest){currentRequest.abort();return;}
    if(!S.lines.length){status.textContent='先に曲と歌詞を読み込み、歌詞を反映してください。';return;}
    if(sampleOpen){window.tsukiDirectorDemo=null;sampleOpen=false;$('directorSampleBtn').textContent='演出プランのサンプルを見る ▶';}
    const button=$('directorLiveBtn');currentRequest=new AbortController();
    button.textContent='演出を中止';status.textContent=S.lines.length+' 行の拍解析と Jev の演出を準備しています…';
    try{
      await window.tsukiRhythmPending;
      status.textContent='Jev に歌詞と曲の拍・盛り上がりを渡しています…';
      const rhythm=window.tsukiRhythm;
      const beats=rhythm?.beats||[];
      const lineRhythm=S.lines.map(line=>{
        let left=0,right=beats.length;
        while(left<right){const mid=(left+right)>>1;if(beats[mid].t<=line.t)left=mid+1;else right=mid;}
        const candidates=[beats[left-1],beats[left]].filter(Boolean).sort((a,b)=>Math.abs(a.t-line.t)-Math.abs(b.t-line.t));
        const near=candidates[0];
        return {intensity:Math.round((window.tsukiIntensityAt?.(line.t)??.4)*100)/100,beatOffset:near&&Math.abs(near.t-line.t)<.5?Math.round((line.t-near.t)*100)/100:null,beatStrength:near&&Math.abs(near.t-line.t)<.5?near.strength:0};
      });
      // Each request is small enough to finish reliably; a failed or cancelled song can resume.
      const input=S.lines.map((l,i)=>({text:l.text,t:l.t,...lineRhythm[i]}));
      const fingerprint=JSON.stringify({lines:input,bpm:rhythm?.bpm||null,sections:rhythm?.sections||[]});
      if(!partial||partial.fingerprint!==fingerprint)partial={fingerprint,plan:[]};
      const total=input.length;
      while(partial.plan.length<total){
        const start=partial.plan.length,batch=input.slice(start,start+8);
        status.textContent='Jev が演出を作成中… '+start+' / '+total+' 行。完了済みの行は保持しています。';
        const response=await fetch('./api/jev-director',{
          method:'POST',headers:{'Content-Type':'application/json'},signal:currentRequest.signal,
          body:JSON.stringify({lines:batch,duration:player.duration||0,bpm:rhythm?.bpm||null,sections:rhythm?.sections||[]})
        });
        if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Jev の接続先は、この公開ページにまだ設定されていません。');
        const data=await response.json();
        if(!response.ok)throw Error(data.error||'Jev への接続に失敗しました。');
        if(!Array.isArray(data.plan)||data.plan.length!==batch.length)throw Error('演出プランの行数が一致しません。');
        partial.plan.push(...data.plan);
      }
      const plan=partial.plan;
      partial=null;
      S.lines=S.lines.map((line,i)=>({...line,animKey:plan[i].animKey,layoutKey:plan[i].layoutKey,graphicKey:plan[i].graphicKey,size:plan[i].size}));
      S.directionBackup=null;$('restoreDirectionBtn').hidden=true;
      show(S.lines.map((line,i)=>({...line,label:'LINE '+String(i+1).padStart(2,'0'),why:(readable[line.animKey]||'動きを調整')+' / '+Math.round((plan[i].confidence||0)*100)+'%'})),'live');
      renderChips();renderSizeChips();
      if(player.src)window.tsukiPreviewLine?.(0);
      status.textContent=S.lines.length+' / '+S.lines.length+' 行の演出を反映しました。下の「全行を表示」で最後まで確認できます。プレビューは「大きく見る」から開けます。';
    }catch(error){
      if(error?.name==='AbortError')status.textContent='中止しました。'+(partial?.plan.length||0)+' / '+S.lines.length+' 行まで完了。もう一度押すと続きから再開できます。';
      else status.textContent=String(error?.message||error)+' '+(partial?.plan.length||0)+' / '+S.lines.length+' 行まで完了。もう一度押すと続きから再試行できます。';
    }finally{currentRequest=null;button.textContent=partial?.plan.length?'続きから Jev で演出':'この歌詞を Jev で演出';}
  });
})();
