#!/usr/bin/env python3
"""チャンネルのブランド素材(ロゴ・アイコン・バナー)を書き出す。
  python3 tools/brand.py    -> assets/brand/ と out/brand/ に保存
"""
import sys, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import build as B  # デザイン定義(色・フォント・ステッカー)を動画と共通にする

OUT = ROOT / "out" / "brand"
CYAN, MAGENTA = (60, 200, 230), (240, 90, 170)


def glitch_text(text, size, fill=(255, 255, 255), stroke=None, sw=None):
    """太い縁取りの文字に、ずれた色版(シアン/マゼンタ)と横ずれの帯を入れた「バグった」文字"""
    f = B.F_TITLE(size)
    sw = sw if sw is not None else max(6, size // 9)
    w, h = int(f.getlength(text)) + sw * 2 + 40, int(size * 1.45) + sw * 2
    def layer(col, scol, swidth):
        im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((w // 2, h // 2), text, font=f, fill=col, anchor="mm", stroke_width=swidth, stroke_fill=scol)
        return im
    base = layer(fill, stroke or B.INK, sw)
    out = Image.new("RGBA", (w + 24, h), (0, 0, 0, 0))
    out.alpha_composite(layer(CYAN + (200,), CYAN + (200,), sw), (6, 0))     # 色ずれ
    out.alpha_composite(layer(MAGENTA + (200,), MAGENTA + (200,), sw), (18, 0))
    out.alpha_composite(base, (12, 0))
    # 横ずれの帯(2本)
    for (y0, y1, dx) in [(0.30, 0.38, 14), (0.66, 0.72, -10)]:
        band = out.crop((0, int(h * y0), out.width, int(h * y1)))
        out.paste((0, 0, 0, 0), (0, int(h * y0), out.width, int(h * y1)))
        out.alpha_composite(band, (dx, int(h * y0)) if dx > 0 else (0, int(h * y0)))
    return out


def logo(scale=1.0):
    """「この世界の / バグ図鑑」ロゴ"""
    small = B.F_POP(int(64 * scale))
    big = glitch_text("バグ図鑑", int(170 * scale))
    tag_w = int(small.getlength("この世界の")) + int(60 * scale)
    tag, pad = B.sticker(tag_w, int(84 * scale), int(42 * scale), B.MARKER, shadow=B.INK + (255,), off=(5, 5), ow=max(3, int(5 * scale)))
    W_ = max(big.width, tag.width) + 40
    H_ = big.height + tag.height - int(30 * scale)
    im = Image.new("RGBA", (W_, H_), (0, 0, 0, 0))
    im.alpha_composite(big, ((W_ - big.width) // 2, tag.height - int(40 * scale)))
    tg = tag.rotate(4, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(tg, (int(30 * scale), 0))
    ImageDraw.Draw(im).text((int(30 * scale) + tg.width // 2, tg.height // 2 + 2), "この世界の", font=small, fill=B.INK, anchor="mm")
    return im


def face(key, emote, size, flip=False):
    """立ち絵から顔まわりを切り出す(ステッカー縁取りつき)"""
    sp = B.sprite(key, f"{emote}_open_open" if emote != "happy" else "happy_half_open", 1.0)
    w, h = sp.size
    box = (int(w * 0.17), int(h * 0.0), int(w * 0.83), int(h * 0.37))
    im = sp.crop(box)
    im = im.resize((size, int(size * im.height / im.width)), Image.LANCZOS)
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im


def bg(w, h, dot=40):
    im = Image.new("RGBA", (w, h), B.CREAM + (255,))
    d = ImageDraw.Draw(im)
    for gy, y in enumerate(range(dot // 2, h, dot * 2)):
        for x in range(dot // 2 + (gy % 2) * dot, w, dot * 2):
            d.ellipse([x - dot // 6, y - dot // 6, x + dot // 6, y + dot // 6], fill=(255, 214, 160, 255))
    return im


def icon_characters():
    """アイコンA: 2人の顔 + 「バグ」札。小さく表示されても顔で見分けがつく"""
    S = 800
    im = Image.new("RGBA", (S, S), B.MARKER + (255,))
    d = ImageDraw.Draw(im)
    for i in range(0, S * 2, 70):  # 斜めストライプ
        d.polygon([(i, 0), (i + 35, 0), (i + 35 - S, S), (i - S, S)], fill=(255, 238, 160, 255))
    t = face("tsumugi", "normal", 500)
    z = face("zunda", "surprise", 500)
    im.alpha_composite(t, (-20, S - t.height + 30))
    im.alpha_composite(z, (S - z.width + 20, S - z.height + 30))
    lg = glitch_text("バグ", 190, sw=22)
    im.alpha_composite(lg, ((S - lg.width) // 2, 20))
    return im


def icon_mark():
    """アイコンB: ロゴだけ(文字中心)"""
    S = 800
    im = bg(S, S, 50)
    lg = glitch_text("バグ", 300, sw=30)
    im.alpha_composite(lg, ((S - lg.width) // 2, (S - lg.height) // 2 - 60))
    sub = glitch_text("図鑑", 150, sw=18)
    im.alpha_composite(sub, ((S - sub.width) // 2, (S - lg.height) // 2 + lg.height - 120))
    return im


def banner():
    W_, H_ = 2560, 1440
    im = bg(W_, H_, 44)
    d = ImageDraw.Draw(im)
    sy0, sy1 = (H_ - 423) // 2, (H_ + 423) // 2   # 全端末で見える帯(1546x423)
    d.rectangle([0, sy0 - 30, W_, sy1 + 30], fill=B.MARKER + (255,))
    d.rectangle([0, sy0 - 30, W_, sy0 - 22], fill=B.INK + (255,))
    d.rectangle([0, sy1 + 22, W_, sy1 + 30], fill=B.INK + (255,))
    sx0 = (W_ - 1546) // 2
    lg = logo(1.25)
    lg.thumbnail((760, 250))
    im.alpha_composite(lg, (sx0 + 40, sy0 + 6))
    sub = B.F_BOLD(42)
    d.text((sx0 + 60, sy1 - 92), "ニュースで見つかった", font=sub, fill=B.INK, anchor="lm")
    d.text((sx0 + 60, sy1 - 38), "“この世界の仕様の不具合” を毎日報告", font=sub, fill=B.INK, anchor="lm")
    band = Image.new("RGBA", (W_, sy1 + 22 - (sy0 - 22)), (0, 0, 0, 0))  # 帯の中だけに描く(はみ出しを切る)
    t = B.sprite("tsumugi", "happy_half_open", 0.50)
    z = B.sprite("zunda", "surprise_open_open", 0.50)
    band.alpha_composite(t, (sx0 + 1546 - 640, 0))
    band.alpha_composite(z, (sx0 + 1546 - 330, 20))
    im.alpha_composite(band, (0, sy0 - 22))
    return im


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    lg = logo(1.0); lg.save(ROOT / "assets/brand/logo.png")
    a = icon_characters(); a.save(OUT / "icon_A_characters.png")
    b = icon_mark(); b.save(OUT / "icon_B_logo.png")
    bn = banner(); bn.convert("RGB").save(OUT / "banner_2560x1440.png", optimize=True)
    # 確認用: 実際の表示サイズ(丸アイコン98px、バナーのスマホ表示域)
    prev = Image.new("RGB", (1000, 360), (255, 255, 255))
    for i, ic in enumerate((a, b)):
        sm = ic.resize((98, 98), Image.LANCZOS)
        m = Image.new("L", (98, 98), 0); ImageDraw.Draw(m).ellipse([0, 0, 97, 97], fill=255)
        prev.paste(sm.convert("RGB"), (40 + i * 140, 40), m)
        big = ic.resize((240, 240), Image.LANCZOS)
        m2 = Image.new("L", (240, 240), 0); ImageDraw.Draw(m2).ellipse([0, 0, 239, 239], fill=255)
        prev.paste(big.convert("RGB"), (330 + i * 300, 40), m2)
    prev.save(OUT / "preview_icons.png")
    safe = bn.crop(((2560 - 1546) // 2, (1440 - 423) // 2, (2560 + 1546) // 2, (1440 + 423) // 2))
    safe.convert("RGB").save(OUT / "preview_banner_mobile.png")
    print("->", OUT)


if __name__ == "__main__":
    main()
