# -*- coding: utf-8 -*-
"""OG画像とアイコンを作る（画像生成AIは使わない。文字だけで組む）。"""
import pathlib
from PIL import Image, ImageDraw, ImageFont, ImageChops
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets"
SERIF_B = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Black.ttc"
SERIF_R = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc"
SERIF_M = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Medium.ttc"
SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
SANS_B = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
JP = 0  # ttc index: JP

def font(path, size):
    # NotoCJK の ttc は 0=JP
    return ImageFont.truetype(path, size, index=JP)

PAPER, INK, PENCIL, GRID, PEN = (230, 233, 229), (28, 32, 36), (93, 101, 108), (205, 212, 214), (42, 69, 176)

def grid(img, step=19, color=GRID):
    d = ImageDraw.Draw(img)
    for x in range(0, img.width, step):
        d.line([(x, 0), (x, img.height)], fill=color, width=1)
    for y in range(0, img.height, step):
        d.line([(0, y), (img.width, y)], fill=color, width=1)

def vtext(d, x, y, text, f, fill, gap=0):
    """縦書き（vert 字形）。gap は字間。"""
    d.text((x, y), text, font=f, fill=fill, direction="ttb", features=["vert"], spacing=gap)
    return y

def misregistered(img, x, y, text, size, ink=INK, pen=PEN, off=(-5, 4), vertical=True):
    """インク層とボールペン層をわずかにずらして重ねる。"""
    f = font(SERIF_B, size)
    layer_pen = Image.new("RGB", img.size, (255, 255, 255))
    dp = ImageDraw.Draw(layer_pen)
    if vertical: vtext(dp, x + off[0], y + off[1], text, f, pen)
    else: dp.text((x + off[0], y + off[1]), text, font=f, fill=pen)
    base = ImageChops.multiply(img, layer_pen)
    d = ImageDraw.Draw(base)
    if vertical: vtext(d, x, y, text, f, ink)
    else: d.text((x, y), text, font=f, fill=ink)
    return base

def og_site():
    img = Image.new("RGB", (1200, 630), PAPER); grid(img)
    img = misregistered(img, 930, 70, "残響", 230)
    d = ImageDraw.Draw(img)
    vtext(d, 820, 110, "詩集は三日前から", font(SERIF_M, 30), INK)
    vtext(d, 770, 110, "同じページで開いていた。", font(SERIF_M, 30), INK)
    d.text((80, 450), "三つの小説と、その資料室。", font=font(SERIF_M, 40), fill=INK)
    d.text((80, 515), "ARTIFICIAL SALVATION ／ 残響 ／ メガラバニア", font=font(SANS, 22), fill=PENCIL)
    d.text((80, 552), "tsukilab.jp/zankyo", font=font(SANS, 22), fill=PENCIL)
    img.save(OUT / "og" / "og-site.png", optimize=True)

def og_as():
    img = Image.new("RGB", (1200, 630), INK)
    d = ImageDraw.Draw(img)
    d.text((80, 90), "第一部", font=font(SANS, 24), fill=(170, 176, 180))
    f = font(SERIF_B, 92)
    d.text((80 - 4, 150 + 3), "ARTIFICIAL", font=f, fill=(70, 92, 190))
    d.text((80, 150), "ARTIFICIAL", font=f, fill=PAPER)
    d.text((80 - 4, 260 + 3), "SALVATION", font=f, fill=(70, 92, 190))
    d.text((80, 260), "SALVATION", font=f, fill=PAPER)
    d.text((84, 400), "証拠を信じる探偵と、娘を覚えている父親。", font=font(SERIF_M, 38), fill=PAPER)
    d.text((84, 530), "残響 ／ tsukilab.jp/zankyo", font=font(SANS, 22), fill=(150, 156, 160))
    img.save(OUT / "og" / "og-as.png", optimize=True)

def og_echo():
    img = Image.new("RGB", (1200, 630), PAPER); grid(img)
    img = misregistered(img, 920, 60, "残響", 240)
    d = ImageDraw.Draw(img)
    d.text((80, 90), "第二部", font=font(SANS, 24), fill=PENCIL)
    d.text((80, 380), "記事、レビュー、掲示板。", font=font(SERIF_M, 40), fill=INK)
    d.text((80, 440), "読んでいるうちに、あなたの記憶が証拠になる。", font=font(SERIF_M, 34), fill=INK)
    d.text((80, 540), "tsukilab.jp/zankyo", font=font(SANS, 22), fill=PENCIL)
    img.save(OUT / "og" / "og-echo.png", optimize=True)

def og_mega():
    img = Image.new("RGB", (1200, 630), (201, 207, 198))
    d = ImageDraw.Draw(img)
    d.rectangle([60, 60, 1140, 570], outline=(125, 134, 127), width=2)
    d.rectangle([60, 60, 1140, 110], fill=(170, 178, 171))
    d.text((84, 70), "深夜の図書館（ミラー）", font=font(SANS, 24), fill=(34, 40, 42))
    d.text((84, 170), "メガラバニア", font=font(SANS_B, 96), fill=(34, 40, 42))
    d.text((88, 300), "作：楓", font=font(SANS, 30), fill=(60, 66, 68))
    d.text((88, 400), "第3話　手紙", font=font(SANS, 34), fill=(110, 118, 112))
    d.line([(88, 422), (300, 422)], fill=(110, 118, 112), width=2)
    d.rectangle([318, 398, 400, 440], outline=(110, 118, 112), width=2)
    d.text((330, 402), "404", font=font(SANS, 28), fill=(110, 118, 112))
    d.text((88, 500), "残響 関連作 ／ tsukilab.jp/zankyo", font=font(SANS, 22), fill=(60, 66, 68))
    img.save(OUT / "og" / "og-mega.png", optimize=True)

def icons():
    img = Image.new("RGB", (180, 180), PAPER); grid(img, step=12)
    img = misregistered(img, 34, 22, "残", 112, off=(-3, 2), vertical=False)
    img.save(OUT / "apple-touch-icon.png", optimize=True)
    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#e6e9e5"/><circle cx="32" cy="32" r="23" fill="none" stroke="#1c2024" stroke-width="3.5"/><line x1="32" y1="32" x2="32" y2="15" stroke="#1c2024" stroke-width="4" stroke-linecap="round"/><line x1="32" y1="32" x2="45" y2="32" stroke="#1c2024" stroke-width="4" stroke-linecap="round"/><line x1="29" y1="35" x2="31" y2="12" stroke="#2a45b0" stroke-width="2"/></svg>"""
    (OUT / "favicon.svg").write_text(svg, encoding="utf-8")

og_site(); og_as(); og_echo(); og_mega(); icons()
print("ok")
