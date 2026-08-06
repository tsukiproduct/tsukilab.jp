/**
 * 攻略ページ（guide/index.html）を実テーブルから生成する。
 *
 *   node tools/gen_guide.mjs
 *
 * 【重要】数値は必ず src/core/ から算出する。HTMLに直接書かないこと。
 * tables.js や reelControl.js を変更したらこれを再実行する。
 *
 * 機械割だけは tests/simulate.js のモンテカルロ結果なので PAYOUT に手で反映する
 * （node tests/simulate.js 3000000 の値。テーブル変更時は測り直すこと）。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SETTINGS, ROLE_GROUPS, roleRates, bonusRates, rareExpectation,
  reelTable, symbolCounts, SYM_LABEL,
} from './guide_data.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** node tests/simulate.js 3000000 の実測値（300万G） */
const PAYOUT = { 1: '95.4%', 2: '97.0%', 3: '98.3%', 4: '100.5%', 5: '102.8%', 6: '105.2%' };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- 各表を組み立てる ---------- */
const specRows = SETTINGS.map(s => {
  const b = bonusRates(s);
  return `<tr><th>設定${s}</th><td>${b.big}</td><td>${b.reg}</td><td class="hl">${b.total}</td><td class="hl">${PAYOUT[s]}</td></tr>`;
}).join('\n');

const roleLabels = Object.keys(ROLE_GROUPS);
const roleRows = roleLabels.map(label =>
  `<tr><th>${label}</th>${SETTINGS.map(s => `<td>${roleRates(s)[label]}</td>`).join('')}</tr>`
).join('\n');

const rare1 = rareExpectation(1), rare6 = rareExpectation(6);
const rareRows = Object.keys(rare1).map(label => {
  const a = rare1[label], b = rare6[label];
  const noteClass = a.totalRaw >= 1 ? ' class="kakujitsu"' : '';
  const note = a.totalRaw >= 1 ? '<span class="tag-hot">ボーナス濃厚</span>' : '';
  return `<tr${noteClass}><th>${label} ${note}</th><td>${a.rate}</td><td>${a.big}</td><td>${a.reg}</td>` +
         `<td class="hl">${a.total}</td><td class="hl">${b.total}</td></tr>`;
}).join('\n');

const reelRows = reelTable().map(([i, l, m, r]) =>
  `<tr><th>${String(i).padStart(2, '0')}</th>` +
  [l, m, r].map(k => `<td class="s s-${k}">${SYM_LABEL[k]}</td>`).join('') + '</tr>'
).join('\n');

const counts = symbolCounts();
const countRows = Object.entries(counts).map(([k, v]) =>
  `<tr><th>${SYM_LABEL[k]}</th><td>${v[0]}</td><td>${v[1]}</td><td>${v[2]}</td></tr>`
).join('\n');

/* ---------- HTML ---------- */
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>スロットぱちんかす｜機種スペック・解析</title>
<meta name="description" content="スロットぱちんかす（A+AT）の機種スペック。ボーナス確率・機械割・小役確率・レア役のボーナス期待度・リール配列・打ち方をまとめた解析ページ。">
<style>
:root{
  --ink:#0f1015; --panel:#171922; --line:#2b2f3d; --txt:#e9eaf0; --sub:#9aa0b4;
  --hot:#ff2d2d; --gold:#f0c24b; --acc:#ff8a00; --ok:#00e85a; --blue:#00a8e8;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--ink);color:var(--txt);
 font:15px/1.75 -apple-system,"Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif;
 padding-bottom:4em}
.wrap{max-width:860px;margin:0 auto;padding:0 16px}
header{background:linear-gradient(180deg,#1b1d27,#0f1015);border-bottom:2px solid var(--acc);
 padding:28px 0 22px;margin-bottom:28px}
header .cat{color:var(--acc);font-size:12px;letter-spacing:.22em;font-weight:700}
header h1{font-size:clamp(24px,6vw,38px);line-height:1.25;margin:6px 0 10px;letter-spacing:.02em}
header .meta{color:var(--sub);font-size:13px}
header .meta b{color:var(--txt)}
h2{font-size:19px;margin:36px 0 12px;padding-left:12px;border-left:5px solid var(--acc);line-height:1.4}
h3{font-size:15px;margin:22px 0 8px;color:var(--gold)}
p{margin:10px 0}
.lead{color:var(--sub);font-size:14px;margin-bottom:6px}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;
 background:var(--panel);border:1px solid var(--line)}
th,td{border:1px solid var(--line);padding:7px 9px;text-align:center}
thead th{background:#20232f;color:var(--gold);font-size:13px;white-space:nowrap}
tbody th{background:#1b1e28;font-weight:700;white-space:nowrap;text-align:left}
td.hl{color:var(--gold);font-weight:700}
tr.kakujitsu td.hl{color:var(--hot)}
.tag-hot{display:inline-block;background:var(--hot);color:#fff;font-size:10px;font-weight:700;
 padding:1px 6px;border-radius:2px;margin-left:6px;vertical-align:middle;letter-spacing:.04em}
.note{background:#191c26;border-left:4px solid var(--blue);padding:11px 14px;margin:14px 0;
 font-size:13.5px;color:#c9cee0}
.note b{color:var(--txt)}
.warn{border-left-color:var(--acc)}
.scroll{overflow-x:auto}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:640px){.two{grid-template-columns:1fr}}
/* リール配列の図柄色分け */
td.s{font-weight:700;font-size:13px}
.s-red7{color:#ff4a4a}.s-blue7{color:#4ab4ff}.s-bar{color:var(--gold)}
.s-replay{color:#8fe3a8}.s-bell{color:#ffd75e}.s-melon{color:#5ce07a}
.s-cherry{color:#ff6b8a}.s-star{color:#c9a6ff}
.reel-tbl th{width:12%}
footer{margin-top:44px;padding-top:18px;border-top:1px solid var(--line);
 color:var(--sub);font-size:12.5px}
a{color:var(--acc)}
.back{display:inline-block;margin:18px 0;padding:9px 18px;background:var(--panel);
 border:1px solid var(--acc);color:var(--acc);text-decoration:none;font-weight:700;font-size:14px}
.back:hover{background:var(--acc);color:#0f1015}
</style>
</head>
<body>

<header>
  <div class="wrap">
    <div class="cat">PACHISLOT / A+AT</div>
    <h1>スロットぱちんかす</h1>
    <div class="meta">
      タイプ: <b>A+AT</b>　｜　純増: <b>約+0.5枚/G</b>　｜
      ボーナス合算: <b>1/154.6〜1/113.8</b>　｜　機械割: <b>95.4〜105.2%</b>
    </div>
  </div>
</header>

<div class="wrap">

<p class="lead">
実機と同じ<b>16bit乱数・分母65536・減算方式</b>で内部抽選を行うシミュレーター。
このページの数値は実装の抽選テーブルから直接算出している。
</p>

<a class="back" href="../">▶ 実際に打つ</a>

<h2>基本スペック</h2>
<div class="scroll">
<table>
<thead><tr><th></th><th>BIG</th><th>REG</th><th>合算</th><th>機械割</th></tr></thead>
<tbody>
${specRows}
</tbody>
</table>
</div>
<div class="note">
<b>機械割は技術介入なしの実測値</b>（300万ゲームのシミュレーション）。
BIG中のビタ押しを全て成功させると、さらに上乗せが期待できる。
</div>

<h2>通常時の小役確率</h2>
<div class="scroll">
<table>
<thead><tr><th></th>${SETTINGS.map(s => `<th>設定${s}</th>`).join('')}</tr></thead>
<tbody>
${roleRows}
</tbody>
</table>
</div>
<div class="note">
リプレイ・ベル・スイカ単独は全設定共通。<b>設定差があるのはボーナス重複と1枚役のみ</b>。
</div>

<h2>レア役のボーナス期待度</h2>
<p class="lead">レア役を引いたとき、同時にボーナスが成立している割合。</p>
<div class="scroll">
<table>
<thead><tr><th>成立役</th><th>出現率(設定1)</th><th>BIG</th><th>REG</th><th>合算(設定1)</th><th>合算(設定6)</th></tr></thead>
<tbody>
${rareRows}
</tbody>
</table>
</div>
<div class="note warn">
<b>リーチ目役はボーナス濃厚。</b>
この役には単独成立が存在せず、必ずBIGかREGを伴う。
成立時は強カットインが発生する。
</div>

<h2>ボーナス</h2>
<div class="two">
<div>
<h3>BIG BONUS</h3>
<table>
<tbody>
<tr><th>作動図柄</th><td>赤7・赤7・赤7</td></tr>
<tr><th>獲得枚数</th><td class="hl">204枚</td></tr>
<tr><th>消化G数</th><td>14G（15枚役）</td></tr>
<tr><th>技術介入</th><td>ビタ押し 計3回</td></tr>
<tr><th>AT期待度</th><td class="hl">50.0〜52.0%</td></tr>
</tbody>
</table>
</div>
<div>
<h3>REG BONUS</h3>
<table>
<tbody>
<tr><th>作動図柄</th><td>BAR・BAR・BAR</td></tr>
<tr><th>獲得枚数</th><td class="hl">60枚</td></tr>
<tr><th>消化G数</th><td>8G（8枚役）</td></tr>
<tr><th>技術介入</th><td>なし</td></tr>
<tr><th>AT期待度</th><td class="hl">6.3%（1/16）</td></tr>
</tbody>
</table>
</div>
</div>
<div class="note">
<b>BIG中のビタチャレンジ</b>は累計60枚・120枚・180枚の到達時に発生。
成功で<b>AT+10G かつ AT濃厚</b>、失敗でも救済+2G。3回とも成功すれば+30G。<br>
また、BIG入賞時の<b>1/64でフリーズ</b>が発生。この場合はAT濃厚＋50G。
</div>

<h2>AT「MOON TIME」</h2>
<table>
<tbody>
<tr><th>純増</th><td>約+0.5枚/G</td></tr>
<tr><th>初期G数</th><td>40G（＋BIG中のビタ獲得分 最大+30G）</td></tr>
<tr><th>突入契機</th><td>BIG終了時 50〜52% ／ REG終了時 1/16 ／ ビタ成功・フリーズで濃厚</td></tr>
<tr><th>上乗せ</th><td>AT中スイカ 50%で+10G ／ AT中BIG +30G</td></tr>
<tr><th>終了条件</th><td>残りG数0 ／ 差枚+2400 or 1500G（完走）</td></tr>
</tbody>
</table>
<div class="note">
AT自体の出玉は控えめで、<b>AT中にボーナスを引いて延命するループ構造</b>。
メインの抽選テーブルはAT中も一切変わらないため、ボーナス確率は通常時と同じ。
</div>

<h2>リール配列</h2>
<div class="scroll">
<table class="reel-tbl">
<thead><tr><th>コマ</th><th>左リール</th><th>中リール</th><th>右リール</th></tr></thead>
<tbody>
${reelRows}
</tbody>
</table>
</div>

<h3>図柄配置数</h3>
<div class="scroll">
<table>
<thead><tr><th>図柄</th><th>左</th><th>中</th><th>右</th></tr></thead>
<tbody>
${countRows}
</tbody>
</table>
</div>
<div class="note">
<b>チェリーは左リールのみ</b>に配置。7・BARは各リール1コマずつの配置で、
最大4コマスベリの範囲でしか引き込めない。
</div>

<h2>打ち方・リーチ目</h2>
<h3>通常時</h3>
<p>左リールから停止させる。成立役は最大4コマの範囲で自動的に引き込まれるため、
現状のバージョンでは取りこぼしは発生しない。</p>

<h3>リーチ目</h3>
<div class="note warn">
<b>左リール中段に「7」または「BAR」が停止して、何も揃わなかった出目はボーナス濃厚。</b><br>
この形はハズレ時には<b>絶対に出現しない</b>ようリール制御されている。
出現パターンは全<b>144通り</b>。
</div>
<p>単独ボーナス成立時のみこの出目が出る。チェリー・スイカとの重複時は
先に小役が入賞するため、リーチ目は出現しない。</p>

<h3>内部中</h3>
<p>ボーナス成立後、実際に揃うまでの状態を「内部中」と呼ぶ。
この間は液晶が前兆ステージに変化し、<b>「チャンス!?」</b>と表示される。
内部中は小役確率が変わらず、ハズレを引いた次ゲームでボーナス図柄が揃う。</p>

<h2>設定判別</h2>
<table>
<tbody>
<tr><th>REG確率</th><td>設定1と設定6で<b>約1.78倍</b>の差。最重要の判別要素</td></tr>
<tr><th>チェリー+REG</th><td>24/65536 → 64/65536。カウント推奨</td></tr>
<tr><th>1枚役</th><td>緩やかな設定差。補助要素</td></tr>
<tr><th>設定6示唆</th><td>AT終了時に専用画面が出れば設定6濃厚</td></tr>
</tbody>
</table>
<div class="note">
リプレイ・ベル・スイカ単独に設定差はないため、カウントしても判別材料にならない。
<b>REG確率を軸に、チェリー+REGの重複回数を併せて見る</b>のが基本。
</div>

<a class="back" href="../">▶ 実際に打つ</a>

<footer>
  <p>本ページの数値は実装の抽選テーブル（<code>src/core/tables.js</code>）および
  リール配列（<code>src/core/reelControl.js</code>）から自動生成している。
  機械割はモンテカルロシミュレーション300万ゲームの実測値。</p>
  <p style="margin-top:8px">
  本アプリはシミュレーターであり、実際の金銭を賭ける機能は含みません。
  実在の遊技機・機種とは一切関係ありません。</p>
</footer>

</div>
</body>
</html>
`;

const outDir = join(ROOT, 'guide');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), html, 'utf8');
console.log(`生成: guide/index.html (${(html.length / 1024).toFixed(1)} KB)`);
console.log('※ 機械割は tests/simulate.js の実測値。テーブル変更時は PAYOUT を更新すること');
