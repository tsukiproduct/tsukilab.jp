#!/usr/bin/env python3
"""月真猫さんから届いた ChatGPT の絵を、制作台に置く。
使い方:  python3 assets/place_images.py <届いた絵のフォルダ>
 ・BG-R1.png のような素材（素材表の番号）→ production/img/asset/BG-R1.webp（横1600px）
 ・SB-01.png のような基準画（2×2）→ 境目を探して4つに切り、各カットの番号で production/img/cut/<カット>.webp（横1280px）
 ・置いたものを production/img/have.js に書き足す
名前が素材表にないファイルは置かずに一覧で知らせる。置いたあとは build_index.py と check.py を実行し、制作台で目で確かめること。"""
import json, os, re, subprocess, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROD = os.path.join(ROOT, 'production')
P = json.loads(subprocess.check_output(['node', '-e', r'''global.window={};require(process.argv[1]+"/production/data.js");console.log(JSON.stringify(window.N3P))''', ROOT]))
ASSETS = {a['id'] for a in P['assets']}
SHEETS = {s['id']: s['cuts'] for s in P['sheets']}
have_js = os.path.join(PROD, 'img', 'have.js')
have = json.loads(re.search(r'window\.N3HAVE=(\[.*?\]);', open(have_js, encoding='utf-8').read(), re.S).group(1))

def gutter(prof, n):
    """明るさの一番低い帯（境目）を真ん中あたりで探す"""
    lo, hi = int(n * .4), int(n * .6)
    return min(range(lo, hi), key=lambda i: prof[i])

def save(im, dst, w):
    im = im.convert('RGB')
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True); im.save(dst, 'WEBP', quality=86)

src = sys.argv[1]; skipped = []; placed = []
for f in sorted(os.listdir(src)):
    stem, ext = os.path.splitext(f)
    if ext.lower() not in ('.png', '.jpg', '.jpeg', '.webp'): continue
    stem = stem.upper().replace('_', '-')
    im = Image.open(os.path.join(src, f))
    if stem in ASSETS:
        save(im, f'{PROD}/img/asset/{stem}.webp', 1600); placed.append(f'asset/{stem}.webp')
    elif stem in SHEETS:
        g = im.convert('L'); W, H = g.size; px = g.load()
        col = [sum(px[x, y] for y in range(0, H, 4)) for x in range(W)]
        row = [sum(px[x, y] for x in range(0, W, 4)) for y in range(H)]
        gx, gy = gutter(col, W), gutter(row, H)
        boxes = [(0, 0, gx, gy), (gx, 0, W, gy), (0, gy, gx, H), (gx, gy, W, H)]
        for cid, (x0, y0, x1, y1) in zip(SHEETS[stem], boxes):
            pad = 6; part = im.crop((x0 + pad, y0 + pad, x1 - pad, y1 - pad))
            # 16:9 に切りそろえる
            pw, ph = part.size; tw = min(pw, round(ph * 16 / 9)); th = round(tw * 9 / 16)
            part = part.crop(((pw - tw) // 2, (ph - th) // 2, (pw - tw) // 2 + tw, (ph - th) // 2 + th))
            save(part, f'{PROD}/img/cut/{cid}.webp', 1280); placed.append(f'cut/{cid}.webp')
    else:
        skipped.append(f)
have = sorted(set(have) | set(placed))
open(have_js, 'w', encoding='utf-8').write('/* 制作台に置いた絵の一覧。assets/place_images.py が書く。 */\nwindow.N3HAVE=' + json.dumps(have, ensure_ascii=False) + ';\n')
print('置いた:', len(placed)); [print('  ', p) for p in placed]
if skipped: print('名前が素材表にないので置かなかった:', skipped)
