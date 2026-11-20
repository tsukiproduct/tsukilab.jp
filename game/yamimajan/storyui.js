'use strict';
// ストーリーモードの画面：章選び、会話シーン、対局後の分岐、進行の保存。

const STORY_KEY='yamimajan.story.v1';
const FX_NAME=['tsukimao','nokosu','lucier','hehehe'];
let storyHero=0, sceneQueue=[], sceneDone=null, sceneTyping=0, sceneFull='';

function storyLoad() {
  try { return JSON.parse(localStorage.getItem(STORY_KEY))||{}; } catch { return {}; }
}
function storySave(data) {
  try { localStorage.setItem(STORY_KEY,JSON.stringify(data)); } catch {}
}
function storyProgress(hero) {
  const all=storyLoad();
  return all[hero]||{cleared:0,prologue:false,epilogue:false};
}
function storyUpdate(hero,patch) {
  const all=storyLoad();
  all[hero]={...storyProgress(hero),...patch};
  storySave(all);
}

function openStory(hero) {
  storyHero=hero;
  const book=STORY[hero], prog=storyProgress(hero), c=CAST[hero];
  byId('lobby').hidden=true; byId('game').hidden=true; byId('story').hidden=false;
  byId('story').style.setProperty('--tone',c.color);
  byId('storyArt').src='assets/story/cover_'+FX_NAME[hero]+'.webp';
  byId('storyTitle').textContent=c.name+'編「'+book.title+'」';
  byId('storyTagline').textContent=book.tagline;
  const items=[{kind:'prologue',label:'序章',title:'新月の夜',open:true,done:prog.prologue}];
  book.chapters.forEach((ch,i)=>items.push({kind:'chapter',index:i,label:'第'+(i+1)+'章',title:ch.title,
    opp:ch.opp,open:prog.cleared>=i,done:prog.cleared>i}));
  items.push({kind:'epilogue',label:'終章',title:'夜明け',open:prog.cleared>=3,done:prog.epilogue});
  byId('storyChapters').innerHTML=items.map((it,n)=>{
    const lv=it.kind==='chapter'?'<span class="lv">'+'★'.repeat(it.index+1)+'</span>':'';
    const face=it.kind==='chapter'?'<img src="assets/portrait'+it.opp+'.webp" alt="">':'';
    const vs=it.kind==='chapter'?'<small>VS '+CAST[it.opp].name+'</small>':'';
    return '<li><button type="button" data-item="'+n+'" '+(it.open?'':'disabled')+' class="'+(it.done?'done':'')+'">'+
      face+'<span class="ch-label">'+it.label+lv+'</span><span class="ch-title">'+(it.open?it.title:'？？？')+'</span>'+vs+
      '<span class="ch-state">'+(it.done?'済':it.open?'▶':'封')+'</span></button></li>';
  }).join('');
  byId('storyChapters').onclick=e=>{
    const b=e.target.closest('button[data-item]');
    if (!b || b.disabled) return;
    const it=items[Number(b.dataset.item)];
    if (it.kind==='prologue') playScene(book.prologue,null,()=>{ storyUpdate(hero,{prologue:true}); openStory(hero); },'bg_entrance');
    if (it.kind==='epilogue') playScene(book.epilogue,null,()=>{ storyUpdate(hero,{epilogue:true}); openStory(hero); },'bg_dawn');
    if (it.kind==='chapter') beginChapter(it.index);
  };
  window.scrollTo(0,0);
}

function beginChapter(index) {
  const book=STORY[storyHero], ch=book.chapters[index], prog=storyProgress(storyHero);
  const go=()=>playScene(ch.pre,ch.opp,()=>{
    storyRun={hero:storyHero,chapter:index,opp:ch.opp};
    startMatch({hero:storyHero,mode:'dark',length:4,duel:storyDuel(index,ch.opp)});
    drive();
  },chapterBg(index));
  if (index===0 && !prog.prologue) playScene(book.prologue,null,()=>{ storyUpdate(storyHero,{prologue:true}); go(); },'bg_entrance');
  else go();
}

const chapterBg=index=>index===2?'bg_seventh':'bg_parlor';
function storyAfterMatch(won) {
  const run=storyRun, book=STORY[run.hero], ch=book.chapters[run.chapter];
  storyRun=null;
  clearTimeout(timer);
  match=null;
  fxReset();
  byId('game').hidden=true; byId('exit').hidden=true;
  if (won) {
    const prog=storyProgress(run.hero);
    storyUpdate(run.hero,{cleared:Math.max(prog.cleared,run.chapter+1)});
    playScene(ch.win,ch.opp,()=>{
      if (run.chapter===2 && !storyProgress(run.hero).epilogue)
        playScene(book.epilogue,null,()=>{ storyUpdate(run.hero,{epilogue:true}); openStory(run.hero); },'bg_dawn');
      else openStory(run.hero);
    },chapterBg(run.chapter));
  } else playScene(ch.lose,ch.opp,()=>openStory(run.hero),chapterBg(run.chapter));
}

// 会話シーン。左に主人公、右に相手。話している側を明るくする。
function playScene(lines, opp, done, bg='bg_parlor') {
  sceneQueue=lines.slice();
  sceneDone=done;
  const box=byId('scene');
  box.hidden=false;
  box.classList.remove('event');
  byId('sceneBg').style.backgroundImage='url("assets/story/'+bg+'.webp")';
  byId('sceneEvent').style.backgroundImage='';
  byId('standL').src='assets/body'+storyHero+'.webp';
  byId('standR').hidden=opp===null;
  if (opp!==null) byId('standR').src='assets/body'+opp+'.webp';
  box.classList.toggle('solo',opp===null);
  nextLine();
}
function nextLine() {
  const box=byId('scene');
  if (sceneTyping) { finishTyping(); return; }
  const line=sceneQueue.shift();
  if (!line) { endScene(); return; }
  const narration=line.s==='N';
  box.classList.toggle('narration',narration);
  box.classList.toggle('speak-l',line.s===storyHero);
  box.classList.toggle('speak-r',!narration && line.s!==storyHero);
  byId('sceneBox').style.setProperty('--tone',narration?'#d9b07a':CAST[line.s].color);
  byId('sceneName').textContent=narration?'':CAST[line.s].name;
  if (line.ev!==undefined) {
    // イベント絵は全画面に出し、次の ev か場面の終わりまで残す。
    box.classList.toggle('event',!!line.ev);
    const ev=byId('sceneEvent');
    if (line.ev) {
      ev.style.backgroundImage='url("assets/story/'+line.ev+'.webp")';
      ev.classList.remove('show'); void ev.offsetWidth; ev.classList.add('show');
    }
  }
  const cg=byId('sceneCg');
  if (line.cg) {
    const [kind,c]=line.cg;
    cg.src=(typeof fxSrc==='function'&&fxSrc(kind,c))||'assets/fx/'+FX_NAME[c]+'_'+kind+'.webp';
    cg.className='scene-cg cg-'+kind;
    cg.hidden=false;
  } else cg.hidden=true;
  sceneFull=line.t;
  const text=byId('sceneText');
  text.textContent='';
  let i=0;
  clearInterval(sceneTyping);
  sceneTyping=setInterval(()=>{
    i++;
    text.textContent=sceneFull.slice(0,i);
    if (i>=sceneFull.length) finishTyping();
  },32);
}
function finishTyping() {
  clearInterval(sceneTyping);
  sceneTyping=0;
  byId('sceneText').textContent=sceneFull;
}
function endScene() {
  clearInterval(sceneTyping); sceneTyping=0;
  byId('scene').hidden=true;
  byId('scene').classList.remove('event');
  byId('sceneCg').hidden=true;
  const done=sceneDone;
  sceneDone=null;
  done?.();
}
byId('scene').onclick=e=>{ if (e.target.closest('#sceneSkip')) return; nextLine(); };
byId('sceneSkip').onclick=()=>{ sceneQueue=[]; endScene(); };
byId('storyBegin').onclick=()=>openStory(heroIndex);
byId('storyBack').onclick=()=>{ byId('story').hidden=true; byId('lobby').hidden=false; window.scrollTo(0,0); };
document.addEventListener('keydown',e=>{
  if (byId('scene').hidden) return;
  if (e.key==='Enter' || e.key===' ') { e.preventDefault(); nextLine(); }
  if (e.key==='Escape') { sceneQueue=[]; endScene(); }
});
