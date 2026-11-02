#!/usr/bin/env python3
"""EARTH AFTER サイト横断検索インデックスを作る。
各ページのHTML（section[id] と h2/h3）と data.js（シーン・カット）から assets/ea-index.js を生成。
更新のたびに:  python3 assets/build_index.py
"""
import json, os, re, subprocess
from bs4 import BeautifulSoup
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [('', '制作ガイド'), ('world/', '世界観ガイド'), ('script/', '脚本'),
         ('design/', 'デザイン資料'), ('gadgets/', 'ガジェット'), ('review/', '審査シミュ')]
clean = lambda s: re.sub(r'\s+', ' ', s or '').strip()
items = []
def add(k, t, s, u, x='', img=None):
    it = {'k': k, 't': clean(t), 's': clean(s), 'u': u}
    if x: it['x'] = clean(x)[:600]
    if img: it['i'] = img
    items.append(it)

for path, pname in PAGES:
    soup = BeautifulSoup(open(os.path.join(ROOT, path, 'index.html'), encoding='utf-8'), 'html.parser')
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
    add('cut', f"{c['id']} {cam}", f"{c['scene']} {st.get(c['scene'], '')}", f"#cut-{c['id']}", (c['act'] or '') + ' ' + lines,
        f"img/sb3/{c['id']}.webp" if c['img'] else None)

out = 'window.EA_INDEX=' + json.dumps({'n': len(items), 'items': items}, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'assets', 'ea-index.js'), 'w', encoding='utf-8').write(out)
print(len(items), 'items', len(out) // 1024, 'KB')
