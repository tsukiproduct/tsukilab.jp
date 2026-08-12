/**
 * デバッグパネル（開発専用）
 *
 * main.js から ?debug=1 のときだけ動的importされる。通常起動では読み込まれないので、
 * このファイルの有無・内容は本番の挙動に一切影響しない。
 * 本番配布時はこのファイルを同梱しないこと（import が失敗して通常モードで動く）。
 *
 * 提供する機能:
 *   - 成立フラグの強制（単発 / 継続）
 *   - フリーズ強制・AT当選強制
 *   - AT即開始（G数指定）・状態リセット
 *   - 演出速度の倍率変更（テスト効率用）
 *   - 現在の内部状態のライブ表示
 *   - 自動プレイ（指定回数を自動消化）
 */

/** 強制できるフラグ一覧。tables.js の TABLE のキー順＋HAZURE */
const FLAG_LABELS = {
  REPLAY: 'リプレイ', BELL: 'ベル', MELON: 'スイカ', CHERRY: 'チェリー', ONE_COIN: '1枚役',
  CHERRY_BIG: 'チェリー+BIG', CHERRY_REG: 'チェリー+REG',
  MELON_BIG: 'スイカ+BIG', MELON_REG: 'スイカ+REG',
  ONE_COIN_BIG: '1枚役+BIG',
  RIICHI_BIG: 'リーチ目+BIG', RIICHI_REG: 'リーチ目+REG',
  SOLO_BIG: '単独BIG', SOLO_REG: '単独REG',
  HAZURE: 'ハズレ',
};

const CSS = `
#dbgPanel{position:fixed;top:0;left:0;width:270px;height:100vh;overflow-y:auto;z-index:9999;
 background:#0d0d12;border-right:2px solid #FF8A00;color:#eee;
 font:12px/1.5 "Consolas","Yu Gothic",monospace;padding:10px;box-sizing:border-box;}
#dbgPanel h3{font-size:12px;color:#FF8A00;margin:12px 0 5px;letter-spacing:.1em;
 border-bottom:1px solid #3a2c14;padding-bottom:3px;}
#dbgPanel h3:first-child{margin-top:0;}
#dbgPanel button{font:11px/1.2 inherit;background:#1c1c26;color:#eee;border:1px solid #444;
 padding:4px 6px;cursor:pointer;}
#dbgPanel button:hover{background:#2a2a38;border-color:#FF8A00;}
#dbgPanel button.on{background:#FF8A00;color:#0d0d12;border-color:#FF8A00;font-weight:bold;}
#dbgPanel input[type=number]{width:56px;background:#1c1c26;color:#eee;border:1px solid #444;
 padding:3px;font:11px inherit;}
.dbgGrid{display:grid;grid-template-columns:1fr 1fr;gap:3px;}
.dbgRow{display:flex;gap:4px;align-items:center;margin:4px 0;flex-wrap:wrap;}
#dbgState{background:#000;border:1px solid #333;padding:6px;white-space:pre;
 font-size:11px;color:#00E85A;line-height:1.6;}
#dbgPanel .hint{color:#888;font-size:10px;margin:3px 0 0;}
#dbgPanel .warn{color:#FF2D2D;}
body.dbgOn #app{margin-left:270px;}
`;

export function initDebug(api) {
  const { DBG, G, enterAT, updateLCD, seg, refreshData, SE, bonusRevealFx, showResult } = api;

  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
  document.body.classList.add('dbgOn');

  const panel = document.createElement('div');
  panel.id = 'dbgPanel';
  panel.innerHTML = `
    <h3>■ 状態</h3>
    <div id="dbgState">-</div>

    <h3>■ フラグ強制</h3>
    <div class="dbgRow">
      <button id="dbgKeep">継続OFF</button>
      <button id="dbgClear">解除</button>
    </div>
    <div class="dbgGrid" id="dbgFlags"></div>
    <p class="hint">単発=次の1ゲームのみ / 継続=解除するまで毎ゲーム<br>
    内部中はボーナスフラグを引けない仕様のため無視されます</p>

    <h3>■ 強制トリガー</h3>
    <div class="dbgRow">
      <button id="dbgFreeze">フリーズ</button>
      <button id="dbgForceAT">AT当選</button>
    </div>
    <p class="hint">次のボーナスで発動</p>

    <h3>■ 直接操作</h3>
    <div class="dbgRow">
      AT開始 <input type="number" id="dbgAtG" value="40" min="1" max="9999"> G
      <button id="dbgAtGo">実行</button>
    </div>
    <div class="dbgRow">
      <button id="dbgAtEnd">AT終了</button>
      <button id="dbgReset">状態リセット</button>
    </div>
    <div class="dbgRow">
      クレジット <input type="number" id="dbgCredit" value="1000" min="0"> <button id="dbgSetCredit">設定</button>
    </div>

    <h3>■ 演出・音のテスト</h3>
    <div class="dbgRow">
      <button id="dbgReveal">確定演出</button>
      <button id="dbgAnnounce">告知フラグON</button>
    </div>
    <div class="dbgRow">
      <button id="dbgResult">リザルト画面</button>
      <button id="dbgAt3">AT残り3Gに</button>
    </div>
    <div class="dbgGrid" id="dbgSounds"></div>
    <p class="hint">確定演出はカットイン→溜め→濃厚の3段（演出速度に追従）</p>

    <h3>■ 演出速度</h3>
    <div class="dbgRow" id="dbgSpeed">
      <button data-s="1" class="on">1x</button>
      <button data-s="2">2x</button>
      <button data-s="5">5x</button>
      <button data-s="20">20x</button>
    </div>

    <h3>■ 自動プレイ</h3>
    <div class="dbgRow">
      <input type="number" id="dbgAutoN" value="100" min="1" max="100000"> 回
      <button id="dbgAutoGo">開始</button>
      <button id="dbgAutoStop">停止</button>
    </div>
    <p class="hint">速度20xと併用すると高速に消化できます</p>
    <p class="hint warn">※このパネルは ?debug=1 のときだけ表示されます</p>
  `;
  document.body.appendChild(panel);

  const $d = id => document.getElementById(id);

  /* ---- 状態表示 ---- */
  function refreshState() {
    const forced = DBG.forceFlag ? `${DBG.forceFlag}${DBG.keepForce ? '(継続)' : '(単発)'}` : 'なし';
    $d('dbgState').textContent =
      `設定    : ${G.setting}\n` +
      `総G数   : ${G.games}\n` +
      `BIG/REG : ${G.bigC} / ${G.regC}\n` +
      `差枚    : ${G.diff > 0 ? '+' : ''}${G.diff}\n` +
      `クレジット: ${G.credit}\n` +
      `内部中  : ${G.carry || '-'}${G.carry ? (G.announced ? ' [告知済]' : ' [未告知]') : ''}\n` +
      `AT      : ${G.at ? `残${G.atG}G (通算${G.atTotalG})` : 'なし'}\n` +
      `前回役  : ${G.flag || '-'}\n` +
      `ボーナス: ${G.phase !== 'NORMAL' ? `${G.phase} ${G.bonusPaid}/${G.bonusTotal}枚 (${G.bonusGame}G)` : '-'}\n` +
      `ビタ成功: ${G.vitaHits}/3\n` +
      `強制    : ${forced}\n` +
      `速度    : ${DBG.speed}x`;
  }
  DBG.onUpdate = refreshState;
  setInterval(refreshState, 300); // 手動操作の反映用（ゲーム進行外の変化も拾う）

  /* ---- フラグ強制 ---- */
  const flagBox = $d('dbgFlags');
  Object.entries(FLAG_LABELS).forEach(([key, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.title = key;
    b.onclick = () => {
      DBG.forceFlag = key;
      [...flagBox.children].forEach(c => c.classList.remove('on'));
      b.classList.add('on');
      refreshState();
    };
    flagBox.appendChild(b);
  });
  $d('dbgKeep').onclick = e => {
    DBG.keepForce = !DBG.keepForce;
    e.target.textContent = DBG.keepForce ? '継続ON' : '継続OFF';
    e.target.classList.toggle('on', DBG.keepForce);
    refreshState();
  };
  $d('dbgClear').onclick = () => {
    DBG.forceFlag = null;
    [...flagBox.children].forEach(c => c.classList.remove('on'));
    refreshState();
  };

  /* ---- 強制トリガー ---- */
  $d('dbgFreeze').onclick = e => {
    DBG.forceFreeze = !DBG.forceFreeze;
    e.target.classList.toggle('on', DBG.forceFreeze);
  };
  $d('dbgForceAT').onclick = e => {
    DBG.forceATonBonus = !DBG.forceATonBonus;
    e.target.classList.toggle('on', DBG.forceATonBonus);
  };

  /* ---- 直接操作 ---- */
  $d('dbgAtGo').onclick = () => {
    enterAT(Number($d('dbgAtG').value) || 40);
    updateLCD(); seg(); refreshState();
  };
  $d('dbgAtEnd').onclick = () => {
    G.at = false; G.atG = 0;
    updateLCD(); seg(); refreshState();
  };
  $d('dbgReset').onclick = () => {
    Object.assign(G, {
      phase: 'NORMAL', credit: 1000, diff: 0, games: 0, bigC: 0, regC: 0,
      carry: null, flag: null, announced: false, justWon: false,
      at: false, atG: 0, atTotalG: 0, atRunG: 0,
      atStartDiff: 0, pendingAT: 0, freezeWon: false,
      bonusPaid: 0, bonusTotal: 0, bonusGame: 0, vitaHits: 0, vitaNow: false, vitaResult: null,
    });
    updateLCD(); seg(); refreshData(); refreshState();
  };
  $d('dbgSetCredit').onclick = () => {
    G.credit = Number($d('dbgCredit').value) || 0;
    seg(); refreshState();
  };

  /* ---- 演出・音のテスト ---- */
  $d('dbgReveal').onclick = () => { SE.unlock(); bonusRevealFx(); };
  $d('dbgAnnounce').onclick = () => {
    // 内部中でないと意味がないので、持っていなければBIGを持たせる
    if (!G.carry) G.carry = 'BIG';
    G.announced = true;
    updateLCD(); refreshState();
  };
  $d('dbgResult').onclick = () => {
    SE.unlock();
    showResult({ title: 'BIG BONUS 終了', num: 204,
      sub: 'ビタ押し 2/3 成功<br><span class="hit">AT 当選!!</span>' });
  };
  $d('dbgAt3').onclick = () => {
    // カウントダウンを確認したいときに、AT残りを3Gまで飛ばす
    if (!G.at) enterAT(3); else G.atG = 3;
    updateLCD(); refreshState();
  };
  /* 鳴らせる音の一覧。sound.js に足したらここにも追加する。
     [表示名, SEのメソッド名, ...引数] の形で、引数付きの音も撃ち分けられる */
  const SE_TESTS = [
    ['BET', 'bet'], ['レバー', 'lever'], ['停止', 'stop'],
    ['子役払出', 'payout'], ['メダル', 'medal', 8], ['リプレイ', 'replay'],
    ['スイカ', 'melon'], ['チェリー', 'cherry'], ['チャンス', 'chance'],
    ['カットイン', 'cutin'], ['溜め', 'charge'], ['確定', 'reveal'],
    ['BIG確定音', 'bonusStart', 'BIG'], ['REG確定音', 'bonusStart', 'REG'],
    ['ビタ○', 'vitaOk'], ['ビタ×', 'vitaNg'],
    ['フリーズ', 'freeze'], ['AT突入', 'atStart'],
    ['リザルト', 'result'], ['カウント3', 'countdown', 3], ['カウントLAST', 'countdown', 1],
  ];
  const soundBox = $d('dbgSounds');
  SE_TESTS.forEach(([label, key, ...args]) => {
    const b = document.createElement('button');
    b.textContent = label; b.title = key + (args.length ? `(${args.join(',')})` : '');
    b.onclick = () => { SE.unlock(); SE[key](...args); };
    soundBox.appendChild(b);
  });

  /* ---- 速度 ---- */
  $d('dbgSpeed').onclick = e => {
    if (e.target.tagName !== 'BUTTON') return;
    DBG.speed = Number(e.target.dataset.s);
    [...e.currentTarget.children].forEach(c => c.classList.remove('on'));
    e.target.classList.add('on');
    refreshState();
  };

  /* ---- 自動プレイ ---- */
  let autoStop = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  $d('dbgAutoGo').onclick = async () => {
    autoStop = false;
    const n = Number($d('dbgAutoN').value) || 100;
    const $g = id => document.getElementById(id);
    $g('titleov').style.display = 'none';
    for (let i = 0; i < n && !autoStop; i++) {
      const w = Math.max(8, 60 / DBG.speed);
      $g('bet').click(); await sleep(w / 3);
      $g('lever').click(); await sleep(w);
      $g('s0').click(); await sleep(w / 2);
      $g('s1').click(); await sleep(w / 2);
      $g('s2').click(); await sleep(w);
      let guard = 0;
      while ($g('bet').disabled && guard++ < 600 && !autoStop) await sleep(50);
    }
    refreshState();
  };
  $d('dbgAutoStop').onclick = () => { autoStop = true; };

  refreshState();
  console.info('[debug] デバッグモード有効。通常起動は ?debug=1 を外してください。');
}
