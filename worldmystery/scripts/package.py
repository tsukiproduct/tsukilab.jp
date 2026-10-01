#!/usr/bin/env python3
"""投稿用一式(サムネイル3案・タイトル3案・概要欄)を out/<台本名>_publish/ に書き出す。
先に build.py で動画を作っておくこと(チャプターの時刻を使うため)。
  python3 scripts/package.py scripts/ep001_sailing_stones.json

サムネイルの考え方(調査より):
  ・顔(強い表情)を大きく / ・文字は短く(8文字前後・2行まで) / ・高コントラスト
  ・タイトルと同じことを書かず、タイトルの「続き」になる言葉にする(好奇心のすき間)
  ・右下は再生時間の表示で隠れるので何も置かない / ・シリーズ共通の黄色と「バグ報告 #番号」札で見分けやすく
  ・YouTube Studio の「テストと比較」に3案を入れると、表示1回あたりの総再生時間で勝者が決まる(釣りは勝てない)
"""
import json, sys, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageFilter
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import build as B

TW, TH = 1280, 720
RED = (226, 40, 40)


def big_text(lines, size, accent_idx=1):
    """2行までの太い見出し。強調行は黄色、ほかは白。どちらも太い焦げ茶の縁取り"""
    f = B.F_TITLE(size)
    lh = int(size * 1.12)
    w = int(max(f.getlength(l) for l in lines)) + 60
    im = Image.new("RGBA", (w, lh * len(lines) + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        y = 20 + lh * i + lh // 2
        col = B.MARKER if i == accent_idx else (255, 255, 255)
        d.text((30 + 8, y + 8), l, font=f, fill=B.INK, anchor="lm", stroke_width=size // 7, stroke_fill=B.INK)  # 影
        d.text((30, y), l, font=f, fill=col, anchor="lm", stroke_width=size // 7, stroke_fill=B.INK)
    return im


def photo_block(path, size, focus=0.5, circle=None, rot=-3, crop=None):
    ph = Image.open(path).convert("RGB")
    if crop:  # 見せたい部分を拡大(x0,y0,x1,y1 を0〜1の割合で)
        ph = ph.crop((int(crop[0] * ph.width), int(crop[1] * ph.height), int(crop[2] * ph.width), int(crop[3] * ph.height)))
    ph = ImageOps.fit(ph, size, Image.LANCZOS, centering=(0.5, focus))
    ph = ph.filter(ImageFilter.UnsharpMask(2, 60, 2))
    from PIL import ImageEnhance
    ph = ImageEnhance.Brightness(ImageEnhance.Contrast(ImageEnhance.Color(ph).enhance(1.3)).enhance(1.25)).enhance(1.12)  # 小さく表示されても沈まないように
    im = Image.new("RGBA", (size[0] + 24, size[1] + 24), B.INK + (255,))
    im.paste(ph, (12, 12))
    if circle:  # 注目点を赤丸で囲む(手描き風に2重線)
        d = ImageDraw.Draw(im)
        cx, cy, r = circle[0] * size[0] + 12, circle[1] * size[1] + 12, circle[2] * size[0]
        for k, (dx, dy) in enumerate([(0, 0), (4, -3)]):
            d.ellipse([cx - r + dx, cy - r * 0.8 + dy, cx + r + dx, cy + r * 0.8 + dy], outline=RED, width=14 - k * 5)
    return im.rotate(rot, expand=True, resample=Image.BICUBIC)


def face(key, emote, height):
    sp = B.sprite(key, f"{emote}_open_open", 1.0)
    w, h = sp.size
    im = sp.crop((int(w * 0.08), 0, int(w * 0.92), int(h * 0.40)))  # 顔と肩まで(顔を大きく見せる)
    return im.resize((int(im.width * height / im.height), height), Image.LANCZOS)


def thumbnail(sc, v):
    im = Image.new("RGBA", (TW, TH), B.MARKER + (255,))
    d = ImageDraw.Draw(im)
    for i in range(-TH, TW + TH, 70):  # シリーズ共通の斜めストライプ
        d.polygon([(i, 0), (i + 35, 0), (i + 35 - TH, TH), (i - TH, TH)], fill=(255, 238, 160, 255))
    if v.get("photo"):
        pw, ph_ = v.get("photo_size", (760, 470))
        pb = photo_block(B.REFS / v["photo"], (pw, ph_), v.get("focus", 0.5), v.get("circle"), crop=v.get("crop"))
        pos = v.get("photo_pos") or (TW - pb.width - (60 if pw < 600 else 10), 70 if ph_ < 520 else 6)
        im.alpha_composite(pb, tuple(pos))
    faces = v.get("faces", [])
    for k, (key, emo) in enumerate(faces):
        fc = face(key, emo, 470 if len(faces) == 1 else 520)
        if len(faces) == 1:
            x = -30
        else:
            x = 120 if k == 0 else 600
        im.alpha_composite(fc, (x, TH - fc.height + 30))
    bt = big_text(v["text"], v.get("size", 150))
    if bt.width > 760:
        bt = bt.resize((760, int(bt.height * 760 / bt.width)), Image.LANCZOS)
    im.alpha_composite(bt, (10, 20))
    # 「バグ報告 #番号」札(左上はロゴの位置として固定)
    tagtxt = f"バグ報告 {sc.get('episode', '')}"
    tag, pad = B.sticker(int(B.F_POP(40).getlength(tagtxt)) + 60, 66, 33, B.PAPER, shadow=B.INK + (255,), off=(4, 4), ow=4)
    ImageDraw.Draw(tag).text((tag.width // 2 - 2, tag.height // 2 - 2), tagtxt, font=B.F_POP(40), fill=B.INK, anchor="mm")
    im.alpha_composite(tag.rotate(-4, expand=True, resample=Image.BICUBIC), (TW - tag.width - 30, 6))
    return im.convert("RGB")


def fmt(t):
    t = int(t)
    return f"{t // 60}:{t % 60:02d}"


def description(sc, meta, credits):
    pub = sc["publish"]
    ch_titles = sc.get("chapter_titles", sc.get("chapters", []))
    lines = [*pub["hook"], "", "▼チャプター"]
    for t, c in meta["chapters"]:
        lines.append(f"{fmt(t)} {ch_titles[c]}")
    r = sc.get("report")
    if r:
        lines += ["", f"▼今回のバグ報告書 No.{r['no']}", f"対象：{r['name']}", f"発生場所：{r['place']}",
                  f"原因の報告：{r['reporter']}", f"ステータス：{r['status']}"]
    lines += ["", "あなたが見つけた「この世界のバグ」も、コメントで報告してください。次回以降の報告書で取り上げるかもしれません。",
              "", credits.strip(), "", " ".join(pub.get("hashtags", []))]
    return "\n".join(lines) + "\n"


def main():
    sp = Path(sys.argv[1])
    sc = json.loads(sp.read_text())
    name = sp.stem
    meta_p = ROOT / "out" / f"{name}_meta.json"
    cred_p = ROOT / "out" / f"{name}_credits.txt"
    if not meta_p.exists():
        raise SystemExit("先に build.py で動画を作ってください(チャプターの時刻を使います)")
    meta = json.loads(meta_p.read_text())
    od = ROOT / "out" / f"{name}_publish"
    od.mkdir(parents=True, exist_ok=True)
    thumbs = []
    for k, v in enumerate(sc["publish"]["thumbnails"]):
        th = thumbnail(sc, v)
        p = od / f"thumbnail_{'ABC'[k]}.jpg"
        q = 92
        th.save(p, quality=q)
        while p.stat().st_size > 1_900_000 and q > 60:  # YouTubeの上限2MB
            q -= 6; th.save(p, quality=q)
        thumbs.append(th)
    # 確認用: スマホの一覧表示に近い小ささ(幅168px)と、おすすめ欄(幅360px)
    sheet = Image.new("RGB", (40 + 3 * 400, 470), (245, 245, 245))
    dd = ImageDraw.Draw(sheet)
    for k, th in enumerate(thumbs):
        sheet.paste(th.resize((360, 203), Image.LANCZOS), (20 + k * 400, 20))
        sheet.paste(th.resize((168, 95), Image.LANCZOS), (20 + k * 400, 250))
        dd.text((20 + k * 400 + 180, 360), f"案{'ABC'[k]}", font=B.F_BOLD(28), fill=(60, 60, 60))
    sheet.save(od / "preview_small.png")
    titles = sc["publish"]["titles"]
    (od / "titles.txt").write_text("\n".join(f"案{'ABC'[i]}：{t}  ({len(t)}文字)" for i, t in enumerate(titles)) + "\n", encoding="utf-8")
    (od / "description.txt").write_text(description(sc, meta, cred_p.read_text() if cred_p.exists() else ""), encoding="utf-8")
    print("->", od)


if __name__ == "__main__":
    main()
