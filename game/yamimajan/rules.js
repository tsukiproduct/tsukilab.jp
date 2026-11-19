'use strict';

const Rules = (() => {
  const type = id => id >> 2;
  const rank = t => t % 9 + 1;
  const terminal = t => t >= 27 || rank(t) === 1 || rank(t) === 9;
  const sequence = t => t < 27 && rank(t) <= 7;
  const red = id => id % 4 === 0 && type(id) < 27 && rank(type(id)) === 5;
  const orphans = [0,8,9,17,18,26,27,28,29,30,31,32,33];
  const count = tiles => {
    const c = Array(34).fill(0);
    for (const tile of tiles) c[type(tile)]++;
    return c;
  };
  const dora = t => t < 27 ? t - t % 9 + (t + 1) % 9 :
    t < 31 ? 27 + (t - 26) % 4 : 31 + (t - 30) % 3;
  const closed = melds => melds.every(m => m.kind === 'ankan');

  function shapes(c, fixed) {
    const out = [];
    if (!fixed) {
      if (c.filter(n => n === 2).length === 7) out.push({special:'pairs'});
      if (orphans.every(t => c[t]) && orphans.some(t => c[t] === 2)) out.push({special:'orphans'});
    }
    function visit(pair, groups) {
      const t = c.findIndex(n => n > 0);
      if (t < 0) {
        out.push({pair, groups:groups.slice()});
        return;
      }
      if (c[t] >= 3) {
        c[t] -= 3;
        groups.push({kind:'trip', t});
        visit(pair, groups);
        groups.pop();
        c[t] += 3;
      }
      if (sequence(t) && c[t+1] && c[t+2]) {
        c[t]--; c[t+1]--; c[t+2]--;
        groups.push({kind:'seq',t});
        visit(pair, groups);
        groups.pop();
        c[t]++; c[t+1]++; c[t+2]++;
      }
    }
    for (let pair = 0; pair < 34; pair++) {
      if (c[pair] < 2) continue;
      c[pair] -= 2;
      visit(pair, []);
      c[pair] += 2;
    }
    return out;
  }

  const allIds = (hand, melds) => hand.concat(melds.flatMap(m => m.tiles));
  function completes(hand,melds,winning) {
    if (hand.length !== 13-3*melds.length) return false;
    return shapes(count([...hand,winning]),melds.length).length>0;
  }
  function waits(hand, melds = []) {
    if (hand.length !== 13 - 3 * melds.length) return [];
    const c = count(hand);
    const owned = count(allIds(hand,melds));
    const out = [];
    for (let t = 0; t < 34; t++) {
      if (owned[t] === 4) continue;
      c[t]++;
      if (shapes(c,melds.length).length) out.push(t);
      c[t]--;
    }
    return out;
  }

  // Negative one is a complete hand, zero is tenpai.
  function shanten(hand, melds = []) {
    const c = count(hand);
    let best = 8;
    if (!melds.length) {
      const distinct = c.filter(Boolean).length;
      const pairs = c.filter(n => n >= 2).length;
      const distinctOrphans = orphans.filter(t => c[t]).length;
      best = Math.min(6 - pairs + Math.max(0, 7 - distinct),
        13 - distinctOrphans - Number(orphans.some(t => c[t] >= 2)));
    }
    function walk(start, groups, partials, pair) {
      let t = start;
      while (t < 34 && !c[t]) t++;
      if (t === 34) {
        best = Math.min(best,8 - 2*groups - Math.min(partials,4-groups) - pair);
        return;
      }
      if (groups < 4 && c[t] >= 3) {
        c[t] -= 3; walk(t,groups+1,partials,pair); c[t] += 3;
      }
      if (groups < 4 && sequence(t) && c[t+1] && c[t+2]) {
        c[t]--; c[t+1]--; c[t+2]--;
        walk(t,groups+1,partials,pair);
        c[t]++; c[t+1]++; c[t+2]++;
      }
      if (!pair && c[t] >= 2) {
        c[t] -= 2; walk(t,groups,partials,1); c[t] += 2;
      }
      if (groups + partials < 4) {
        if (c[t] >= 2) {
          c[t] -= 2; walk(t,groups,partials+1,pair); c[t] += 2;
        }
        for (let delta = 1; delta <= 2; delta++) {
          if (t >= 27 || rank(t) + delta > 9 || !c[t+delta]) continue;
          c[t]--; c[t+delta]--; walk(t,groups,partials+1,pair); c[t]++; c[t+delta]++;
        }
      }
      const saved = c[t];
      c[t] = 0; walk(t+1,groups,partials,pair); c[t] = saved;
    }
    walk(0,melds.length,0,0);
    return best;
  }

  function basePoints(han, fu, yakuman) {
    if (yakuman) return 8000 * yakuman;
    if (han >= 13) return 8000;
    if (han >= 11) return 6000;
    if (han >= 8) return 4000;
    if (han >= 6) return 3000;
    const raw = fu * 2 ** (han+2);
    return han >= 5 || raw >= 1920 ? 2000 : raw;
  }
  const up100 = n => Math.ceil(n/100)*100;
  function price(base, dealer, tsumo) {
    return tsumo ? (dealer ? up100(base*2)*3 : up100(base*2)+up100(base)*2) :
      up100(base*(dealer?6:4));
  }

  function evaluate(hand, melds, winning, ctx) {
    if (hand.length !== 14 - 3 * melds.length || !hand.includes(winning)) return null;
    const possible = shapes(count(hand),melds.length);
    const close = closed(melds);
    const ids = allIds(hand,melds);
    const c = count(ids);
    const types = c.flatMap((n,t) => n ? [t] : []);
    const suits = new Set(types.filter(t => t < 27).map(t => Math.floor(t/9)));
    const tile = type(winning);
    let best = null;
    function offer(yaku, fu, yakuman) {
      if (!yaku.length) return;
      if (yakuman) fu = 0;
      let han = yakuman ? 0 : yaku.reduce((sum,y) => sum+y.han,0);
      if (!yakuman) {
        const bonuses = [
          ['ドラ',(ctx.dora || []).reduce((sum,id) => sum+c[dora(type(id))],0)],
          ['裏ドラ',ctx.riichi ? (ctx.ura || []).reduce((sum,id) => sum+c[dora(type(id))],0) : 0],
          ['赤ドラ',ids.filter(red).length]
        ];
        for (const [name,value] of bonuses) if (value) { han += value; yaku.push({name,han:value}); }
      }
      const base = basePoints(han,fu,yakuman);
      const total = price(base,ctx.dealer,ctx.tsumo);
      if (!best || total > best.total || (total === best.total &&
        (yakuman > best.yakuman || (yakuman === best.yakuman &&
          (han > best.han || (han === best.han && fu > best.fu)))))) {
        best = {yaku, fu, yakuman, han, base, total};
      }
    }
    const natural = [];
    if (ctx.heaven) natural.push({name:ctx.dealer ? '天和' : '地和', units:1});
    if (types.every(t => t >= 27)) natural.push({name:'字一色',units:1});
    if (types.every(t => [19,20,21,23,25,32].includes(t))) natural.push({name:'緑一色',units:1});
    if (types.every(t => t < 27 && terminal(t))) natural.push({name:'清老頭',units:1});
    if (close && suits.size === 1 && types.every(t => t < 27)) {
      const offset = Math.floor(types[0]/9)*9;
      const core = [3,1,1,1,1,1,1,1,3];
      if (core.every((n,i) => c[offset+i] >= n)) natural.push({
        name:'九蓮宝燈', units:1
      });
    }
    function normal() {
      const yaku = [];
      const add = (name, han) => yaku.push({name,han});
      if (ctx.riichi) add(ctx.riichi === 2 ? 'ダブル立直' : '立直',ctx.riichi);
      if (ctx.ippatsu && ctx.riichi) add('一発',1);
      if (close && ctx.tsumo) add('門前清自摸和',1);
      if (ctx.rinshan) add('嶺上開花',1);
      if (ctx.chankan) add('槍槓',1);
      if (ctx.last && !ctx.rinshan && !ctx.chankan) add(ctx.tsumo?'海底摸月':'河底撈魚',1);
      if (types.every(t => !terminal(t))) add('断么九',1);
      if (types.every(terminal)) add('混老頭',2);
      if (suits.size === 1) add(types.some(t => t>=27)?'混一色':'清一色',
        (types.some(t => t>=27)?2:5)+Number(close));
      return yaku;
    }
    for (const shape of possible) {
      const yakus = natural.slice();
      if (shape.special === 'orphans') {
        yakus.push({name:'国士無双',units:1});
        offer(yakus,0,yakus.reduce((sum,y)=>sum+y.units,0));
        continue;
      }
      if (shape.special === 'pairs') {
        if (yakus.length) offer(yakus,0,yakus.reduce((sum,y)=>sum+y.units,0));
        else offer([...normal(),{name:'七対子',han:2}],25,0);
        continue;
      }
      const {pair,groups} = shape;
      const fixed = melds.map(m => ({
        t: Math.min(...m.tiles.map(type)), kind:m.kind === 'chi'?'seq':'trip',
        kan:m.tiles.length===4, open:m.kind!=='ankan'
      }));
      const slots = groups.flatMap((g,i) => (g.kind==='trip' ? tile===g.t : tile>=g.t && tile<=g.t+2) ? [i] : []);
      if (pair === tile) slots.push(-1);
      for (const slot of slots) {
        const all = groups.map((g,i) => ({...g,open:!ctx.tsumo && i===slot && g.kind==='trip'})).concat(fixed);
        const seq = all.filter(g=>g.kind==='seq');
        const trip = all.filter(g=>g.kind==='trip');
        const kans = trip.filter(g=>g.kan).length;
        const concealed = trip.filter(g=>!g.open).length;
        const dragons = trip.filter(g=>g.t>=31).length;
        const winds = trip.filter(g=>g.t>=27 && g.t<31).length;
        const yakuman = yakus.slice();
        if (dragons===3) yakuman.push({name:'大三元',units:1});
        if (winds===4) yakuman.push({name:'大四喜',units:1});
        if (winds===3 && pair>=27 && pair<31) yakuman.push({name:'小四喜',units:1});
        if (concealed===4) yakuman.push({name:'四暗刻',units:1});
        if (kans===4) yakuman.push({name:'四槓子',units:1});
        if (yakuman.length) {
          offer(yakuman,0,yakuman.reduce((sum,y)=>sum+y.units,0));
          continue;
        }
        const yaku = normal();
        const add = (name,han) => yaku.push({name,han});
        const pairFu = 2*(Number(pair>=31)+Number(pair===ctx.seat)+Number(pair===ctx.wind));
        const g = groups[slot];
        const narrow = slot===-1 || (g.kind==='seq' &&
          (tile===g.t+1 || (rank(g.t)===1 && tile===g.t+2) || (rank(g.t)===7 && tile===g.t))) ;
        const pinfu = close && seq.length===4 && !pairFu && !narrow;
        if (pinfu) add('平和',1);
        for (const m of trip) {
          if (m.t>=31) add(['役牌 白','役牌 發','役牌 中'][m.t-31],1);
          if (m.t===ctx.seat) add('自風',1);
          if (m.t===ctx.wind) add('場風',1);
        }
        if (dragons===2 && pair>=31) add('小三元',2);
        if (trip.length===4) add('対々和',2);
        if (concealed>=3) add('三暗刻',2);
        if (kans===3) add('三槓子',2);
        if (trip.some(m=>m.t<9 && [m.t+9,m.t+18].every(t=>trip.some(n=>n.t===t)))) add('三色同刻',2);
        const starts = seq.map(m=>m.t);
        if (starts.some(t=>t<9 && starts.includes(t+9)&&starts.includes(t+18))) add('三色同順',close?2:1);
        if ([0,9,18].some(o=>[o,o+3,o+6].every(t=>starts.includes(t)))) add('一気通貫',close?2:1);
        if (close) {
          const duplicated = [...new Set(starts)].reduce((sum,t)=>sum+Math.floor(starts.filter(n=>n===t).length/2),0);
          if (duplicated) add(duplicated===2?'二盃口':'一盃口',duplicated===2?3:1);
        }
        if (seq.length && terminal(pair) && trip.every(m=>terminal(m.t)) &&
          seq.every(m=>rank(m.t)===1 || rank(m.t)===7)) {
          const pure = types.every(t=>t<27);
          add(pure?'純全帯么九':'混全帯么九',(pure?2:1)+Number(close));
        }
        let fu = 20 + pairFu + (narrow?2:0);
        for (const m of trip) fu += 2*(m.kan?4:1)*(m.open?1:2)*(terminal(m.t)?2:1);
        if (!ctx.tsumo && close) fu += 10;
        if (ctx.tsumo && !pinfu) fu += 2;
        if (!ctx.tsumo && fu===20) fu = 30;
        offer(yaku,Math.ceil(fu/10)*10,0);
      }
    }
    return best;
  }


  function riichiKan(hand, melds, drawn, ids) {
    const t=type(drawn);
    if (!ids.includes(drawn)) return false;
    const before=hand.filter(id=>id!==drawn);
    const after=hand.filter(id=>!ids.includes(id));
    const old=waits(before,melds);
    const next=waits(after,[...melds,{kind:'ankan',tiles:ids}]);
    if (!old.length || old.join()!==next.join()) return false;
    const c=count(before);
    return old.every(w=>{
      c[w]++;
      const valid=shapes(c,melds.length).every(shape=>shape.groups?.some(g=>g.kind==='trip' && g.t===t));
      c[w]--;
      return valid;
    });
  }

  return {completes,riichiKan,type,rank,terminal,red,closed,count,waits,shanten,evaluate,up100,dora};
})();
if (typeof module !== 'undefined') module.exports = Rules;
