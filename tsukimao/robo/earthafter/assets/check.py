#!/usr/bin/env python3
"""制作室の点検。公開の前に必ず実行する:  python3 assets/check.py
見るもの:
 1. 新しい物語の正本（story/data.js）の形と、番号の重複
 2. 尺の予算の初期値が計画の上限に収まっているか
 3. 判断基準の正本（review/data.js）の上限の合計
 4. 旧作のデータ（data.js と script/data.js）のカット順と合計秒数の一致
 5. 各ページが読み込むファイルの版（?v=）が揃っているか
 6. ページ内のリンク切れ（このフォルダの中だけ）
終了コード 0 なら問題なし。"""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bad = []
def ng(m): bad.append(m); print('不合格', m)
def ok(m): print('合格  ', m)

js = r'''global.window={};const r=process.argv[1];require(r+"/story/data.js");require(r+"/review/data.js");require(r+"/data.js");
const EA=window.EA;require(r+"/script/data.js");const S=window.SCRIPT;
const sc=[];(S.scenes||[]).forEach(s=>(s.cuts||[]).forEach(c=>sc.push(c.id)));
console.log(JSON.stringify({n:window.N3,r:window.N3R,ea:{ids:EA.cuts.map(c=>c.id),total:EA.total,sum:EA.cuts.reduce((a,c)=>a+c.sec,0)},sc:{ids:sc,total:S.total}}))'''
D = json.loads(subprocess.check_output(['node', '-e', js, ROOT]))
N, R = D['n'], D['r']

ids = [it['id'] for k in ('kakutei', 'hikitsugi', 'teian', 'mitei', 'katei') for it in N[k]]
dup = sorted({i for i in ids if ids.count(i) > 1})
ng(f'番号の重複: {dup}') if dup else ok(f'新しい物語の項目 {len(ids)} 件、番号の重複なし')
nosrc = [it['id'] for it in N['kakutei'] if not it.get('src')]
ng(f'出典のない確定事項: {nosrc}') if nosrc else ok('確定事項はすべて出典つき')
text = json.dumps(N, ensure_ascii=False)
refs = set(re.findall(r'\b([KHTQA]\d\d)\b', text)) - set(ids)
ng(f'存在しない番号への言及: {sorted(refs)}') if refs else ok('項目どうしの言及先はすべて存在')

b = N['budget']; tot = sum(r['s'] for r in b['rows'])
ng(f'尺の予算の初期値 {tot}秒 が計画の上限 {b["plan"]}秒 を超過') if tot > b['plan'] else ok(f'尺の予算の初期値 {tot//60}:{tot%60:02d}（計画の上限 {b["plan"]//60}:00 以内）')

for i, s in enumerate(R['stages']):
    cap = sum(c['cap'][i] for c in R['crit'])
    ng(f'{s["t"]}の上限 {s["cap"]} と内訳の合計 {cap} が不一致') if cap != s['cap'] else ok(f'{s["t"]}の段階の上限 {cap}点')
si = [s['id'] for s in R['stages']].index(R['now']['stage'])
for sc in R['now']['score']:
    c = next(c for c in R['crit'] if c['id'] == sc['id'])
    if sc['p'] > c['cap'][si]: ng(f'{c["t"]}の見立て {sc["p"]} が上限 {c["cap"][si]} を超過')
if len(R['gate']) != 12: ng(f'関門の検査が {len(R["gate"])} 件（本文は十二と書いている）')

ea, sc = D['ea'], D['sc']
ng('旧作: data.js と script/data.js のカット順が不一致') if ea['ids'] != sc['ids'] else ok(f'旧作のカット順は一致（{len(ea["ids"])}カット）')
ng(f'旧作: 合計秒数が不一致 {ea["total"]} / {ea["sum"]} / {sc["total"]}') if not (ea['total'] == ea['sum'] == sc['total']) else ok(f'旧作の合計秒数は一致（{ea["total"]}秒）')

pages = [os.path.join(dp, f) for dp, dn, fs in os.walk(ROOT) if '_backup' not in dp and os.sep + 'media' not in dp for f in fs if f.endswith('.html')]
vers = {}
for p in pages:
    html = open(p, encoding='utf-8').read(); rel = os.path.relpath(p, ROOT); base = os.path.dirname(p)
    for m in re.finditer(r'(?:src|href)="([^"#?]+\.(?:js|css))\?v=(\d+)"', html):
        if m.group(1).startswith('http'): continue
        key = os.path.relpath(os.path.normpath(os.path.join(base, m.group(1))), ROOT)
        vers.setdefault(key, {}).setdefault(m.group(2), []).append(rel)
    for m in re.finditer(r'href="([^"]+)"', html):
        h = m.group(1)
        if re.match(r'(https?:|mailto:|#|data:|javascript:)', h) or '${' in h or "'" in h or '+' in h: continue
        path, _, frag = h.partition('#'); path = path.split('?')[0]
        t = os.path.normpath(os.path.join(base, path))
        if os.path.isdir(t): t = os.path.join(t, 'index.html')
        if not os.path.exists(t): ng(f'リンク切れ: {rel} → {h}'); continue
        if frag and t.endswith('.html'):
            th = open(t, encoding='utf-8').read()
            dyn = re.match(r'^([KHTQAG]\d\d|cut-|s\d)', frag)
            if not dyn and f'id="{frag}"' not in th: ng(f'行き先の見出しがない: {rel} → {h}')
for key, v in sorted(vers.items()):
    if len(v) > 1: ng(f'版が揃っていない: {key} {dict((k, x) for k, x in v.items())}')
if not any('版が' in b_ or 'リンク' in b_ or '見出し' in b_ for b_ in bad): ok(f'{len(pages)}ページの版とリンク')

print('\n問題は %d 件です。' % len(bad)); sys.exit(1 if bad else 0)
