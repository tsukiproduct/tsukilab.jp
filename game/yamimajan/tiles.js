'use strict';

const DOT_LAYOUT = [
  [],
  [[50,50]],
  [[33,26],[67,74]],
  [[29,23],[50,50],[71,77]],
  [[30,28],[70,28],[30,72],[70,72]],
  [[28,24],[72,24],[50,50],[28,76],[72,76]],
  [[30,18],[70,18],[30,50],[70,50],[30,82],[70,82]],
  [[29,15],[50,30],[71,45],[30,62],[70,62],[30,85],[70,85]],
  [[30,14],[70,14],[30,38],[70,38],[30,62],[70,62],[30,86],[70,86]],
  [[25,19],[50,19],[75,19],[25,50],[50,50],[75,50],[25,81],[50,81],[75,81]]
];
const BAMBOO_LAYOUT = [
  [], [],
  [[50,28],[50,72]],
  [[50,21],[29,72],[71,72]],
  [[30,29],[70,29],[30,71],[70,71]],
  [[29,24],[71,24],[50,50],[29,76],[71,76]],
  [[30,17],[70,17],[30,50],[70,50],[30,83],[70,83]],
  [[50,14],[29,37],[71,37],[29,61],[71,61],[29,85],[71,85]],
  [[32,13],[68,13],[32,38],[68,38],[32,62],[68,62],[32,87],[68,87]],
  [[27,17],[50,17],[73,17],[27,50],[50,50],[73,50],[27,83],[50,83],[73,83]]
];

function svgTile(body) {
  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="tile-art">'+body+'</svg>';
}

function circleMark(x,y,r,color) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#645d4d" stroke-width="1"/>
    <circle cx="${x}" cy="${y}" r="${r*.69}" fill="none" stroke="#f2e7c8" stroke-width="1.6"/>
    <circle cx="${x}" cy="${y}" r="${r*.36}" fill="#f2e7c8"/>`;
}
function circles(n) {
  const colors=['#234149','#295c4b','#aa2938'];
  if (n===1) {
    let petals='';
    for (let angle=0;angle<360;angle+=45) {
      petals+=`<path d="M50 21q10 11 0 22q-10-11 0-22Z" transform="rotate(${angle} 50 50)" fill="#274d46"/>`;
    }
    return svgTile('<circle cx="50" cy="50" r="37" fill="none" stroke="#253c3c" stroke-width="3"/>'+
      '<circle cx="50" cy="50" r="32" fill="none" stroke="#ac283a" stroke-width="2"/>'+
      petals+circleMark(50,50,11,'#a82336'));
  }
  const radius=n===9?10:n>=6?10.8:n<4?13.5:12;
  return svgTile(DOT_LAYOUT[n].map(([x,y],i)=>{
    let color=colors[0];
    if (n===3) color=colors[i===1?2:1];
    else if (n===5 && i===2 || n===7 && i<3 || n===9 && i>=3 && i<=5) color=colors[2];
    else if (n!==2 && i%2===0) color=colors[1];
    return circleMark(x,y,radius,color);
  }).join(''));
}
function bamboos(n,red) {
  if (n===1) {
    return svgTile(`<path d="M45 39Q44 23 54 17Q61 9 72 24L88 27L72 34Q68 57 51 67L39 78L13 87L23 68L18 59Q21 45 45 39Z" fill="#285d47"/>
      <path d="M25 51Q42 41 59 47Q47 60 32 66L23 67Z" fill="#a42b30"/>
      <path d="M53 25Q61 15 67 25L60 31Z" fill="#bd6935"/>
      <circle cx="64" cy="24" r="3.2" fill="#f9ebc5"/>
      <path d="M42 71l-1 10m10-15 3 11M19 83L12 91M23 85l-6 8" stroke="#40392c" stroke-width="2.1"/>`);
  }
  const h=n===2?32:n>=7?22:25;
  return svgTile(BAMBOO_LAYOUT[n].map(([x,y],i)=>{
    const color=red || n===5&&i===2 || n===7&&i===0 || n===9&&i%3===1 ? '#ac3038' : '#2c6550';
    return `<rect x="${x-5.4}" y="${y-h/2}" width="10.8" height="${h}" rx="4.5" fill="${color}" stroke="#3d4842" stroke-width="1.1"/>
      <path d="M${x-1} ${y-h*.3}v${h*.60}" stroke="#e8dbc2" stroke-width="1.7" opacity=".78"/>
      <path d="M${x-4} ${y}h8" stroke="#273e34" stroke-width="1"/>`;
  }).join(''));
}

function symbol(t,red=false) {
  if (t===31) return '<span class="haku"></span>';
  if (t>=27) return '<span class="honor'+(t===33?' crimson':'')+'">'+ '東南西北白發中'[t-27]+'</span>';
  const n=t%9+1;
  if (t<9) return '<span class="man-num">'+'一二三四五六七八九'[n-1]+'</span><span class="man-word">萬</span>';
  if (t<18) return circles(n);
  return bamboos(n,red);
}
