#!/usr/bin/env python3
"""EARTH AFTER サイト横断検索インデックスを作る。
各ページのHTML（section[id] と h2/h3）と data.js（シーン・カット）から assets/ea-index.js を生成。
更新のたびに:  python3 assets/build_index.py
"""
import json, os, re, subprocess
from bs4 import BeautifulSoup
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# (ページの場所, 表示名, HTMLファイル)
PAGES = [('', 'いまの制作', 'index.html'), ('story/', '新しい物語', 'story/index.html'),
         ('review/', '判断基準', 'review/index.html'), ('rules/', '応募規定', 'rules/index.html'),
         ('record/', '作り方と記録', 'record/index.html'),
         ('design/', '人物の設定画', 'design/index.html'), ('gadgets/', '小道具とエナ', 'gadgets/index.html'),
         ('v1.html', '旧・制作ガイド', 'v1.html'), ('world/', '旧・世界観', 'world/index.html'),
         ('script/', '旧・脚本', 'script/index.html'), ('review/v1.html', '旧・審査の記録', 'review/v1.html')]
clean = lambda s: re.sub(r'\s+', ' ', s or '').strip()
items = []
def add(k, t, s, u, x='', img=None):
    it = {'k': k, 't': clean(t), 's': clean(s), 'u': u}
    if x: it['x'] = clean(x)[:600]
    if img: it['i'] = img
    items.append(it)

for path, pname, fname in PAGES:
    soup = BeautifulSoup(open(os.path.join(ROOT, fname), encoding='utf-8'), 'html.parser')
    for sec in soup.select('section[id], article[id], header[id]'):
        if sec.find_parent(attrs={'id': True}) and sec.find_parent(attrs={'id': True}).name in ('section', 'article'):
            continue
        h2 = sec.find('h2')
        label = sec.get('data-ea-label') or (clean(h2.get_text(' ')) if h2 else '')
        if not label: continue
        sid = sec['id']
        body = clean(sec.get_text(' '))[:400]
        h2t = clean(h2.get_text(' ')) if h2 else ''
        title = h2t if h2t and label in h2t else (label + ('　' + h2t if h2t and h2t != label else ''))
        add('sec', title, pname, f'{path}#{sid}', body)
        for h3 in sec.find_all(['h3']):
            t = clean(h3.get_text(' '))
            if 2 <= len(t) <= 40:
                par = h3.find_parent(['li', 'article', 'div', 'a'])
                body = par.get_text(' ') if par else ''
                if len(clean(body)) > 700:
                    body = ' '.join(x.get_text(' ') for x in h3.find_next_siblings(limit=2))
                add('item', t, f'{pname} › {label}', f'{path}#{sid}', body)
        for nm in sec.select('.pf .nm'):
            par = nm.find_parent('article')
            add('char', clean(nm.get_text(' ')), f'{pname} › {label}', f'{path}#{sid}', par.get_text(' ') if par else '')

js = r'''global.window={};require(process.argv[1]+"/data.js");const E=window.EA;
console.log(JSON.stringify({scenes:E.scenes.map(s=>({id:s.id,title:s.title,act:s.act,age:s.age,place:s.place,sum:s.sum,paras:s.paras})),
cuts:E.cuts.map(c=>({id:c.id,scene:c.scene,cam:c.cam,act:c.act,img:c.img,lines:c.lines}))}))'''
D = json.loads(subprocess.check_output(['node', '-e', js, ROOT]))
ACT = {1: '第1幕', 2: '第2幕', 3: '第3幕'}
for s in D['scenes']:
    add('scene', f"{s['id']} {s['title']}", f"{ACT.get(s['act'], '')} · {s['age']} · {s['place']}", f"script/#s{s['id']}",
        (s['sum'] or '') + ' ' + ' '.join(s['paras'] or []))
st = {s['id']: s['title'] for s in D['scenes']}
for c in D['cuts']:
    cam = re.sub(r'／\d+mm.*$', '', c['cam'] or '')
    lines = ' '.join(f'{w}「{x}」' for w, x in (c['lines'] or []))
    add('cut', f"{c['id']} {cam}", f"{c['scene']} {st.get(c['scene'], '')}", f"v1.html#cut-{c['id']}", (c['act'] or '') + ' ' + lines,
        f"img/sb3/{c['id']}.webp" if c['img'] else None)

# 新しい物語の正本（story/data.js）と、判断基準の正本（review/data.js）
js2 = r'''global.window={};require(process.argv[1]+"/story/data.js");require(process.argv[1]+"/review/data.js");
console.log(JSON.stringify({n:window.N3,r:window.N3R}))'''
D2 = json.loads(subprocess.check_output(['node', '-e', js2, ROOT]))
N3, N3R = D2['n'], D2['r']
for key, label, anchor in (('kakutei', '確定', 'kakutei'), ('mitei', '未決定の問い', 'mitei'), ('hikitsugi', '引き継ぎ候補', 'hikitsugi'),
                           ('teian', '提案', 'teian'), ('katei', '仮定', 'katei')):
    for it in N3[key]:
        add('fact', f"{it['id']} {it.get('q') or it['t']}", f"新しい物語 › {label}", f"story/#{it['id']}",
            ' '.join([it.get('n', ''), it.get('why', ''), ' '.join(it.get('opts', []))]))
for g in N3R['gate']:
    add('fact', f"{g['id']} {g['t']}", '判断基準 › 関門', f"review/#{g['id']}", g['rule'] + ' ' + g['why'])

out = 'window.EA_INDEX=' + json.dumps({'n': len(items), 'items': items}, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'assets', 'ea-index.js'), 'w', encoding='utf-8').write(out)
print(len(items), 'items', len(out) // 1024, 'KB')
