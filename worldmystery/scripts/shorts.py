#!/usr/bin/env python3
"""完成した本編から、縦型ショート(1080x1920)を切り抜く。
台本JSONの "shorts" に区間を書く:
  "shorts": [{"from": 0, "to": 3, "hook": ["グリーンランドは", "アフリカより大きい？"], "title": "...#Shorts"}]
  from/to は台本の行番号(to の行まで含む)。60秒以内を目安にする。
  python3 scripts/shorts.py scripts/ep001_world_map.json out/ep001_world_map.mp4
  python3 scripts/shorts.py scripts/ep001_world_map.json out/ep001_world_map.mp4 --thumbs-only   # サムネだけ
上: 大きな見出し / 中央: 本編の映像 / 下: 「続きは本編で」とシリーズ札。背景は本編をぼかして敷く。
ショートごとに縦型サムネイル(thumb_N.jpg, 1080x1920)も作る。図は "thumb_photo" で指定、無ければ本編サムネの図を使う。
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import build as B

VW, VH = 1080, 1920


def hook_png(lines, path):
    im = Image.new("RGBA", (VW, 520), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    n = len(lines)
    f = B.F_TITLE(min(96 if max(len(l) for l in lines) <= 9 else 80, 88 if n >= 3 else 96))
    sp = 130 if n >= 3 else 150
    for i, l in enumerate(lines):
        y = 400 - (n - 1 - i) * sp  # 最後の行の位置をそろえ、3行でも本編の映像に重ならないように
        col = B.MARKER if i == len(lines) - 1 else (255, 255, 255)
        d.text((VW // 2 + 6, y + 6), l, font=f, fill=B.INK, anchor="mm", stroke_width=14, stroke_fill=B.INK)
        d.text((VW // 2, y), l, font=f, fill=col, anchor="mm", stroke_width=14, stroke_fill=B.INK)
    im.save(path)


def footer_png(sc, path):
    im = Image.new("RGBA", (VW, 520), (0, 0, 0, 0))
    card, pad = B.sticker(760, 120, 60, B.MARKER, shadow=B.INK + (255,), off=(6, 6), ow=5)
    im.alpha_composite(card, ((VW - card.width) // 2, 60))
    d = ImageDraw.Draw(im)
    d.text((VW // 2 - 30, 60 + pad + 60), "続きは本編で", font=B.F_TITLE(60), fill=B.INK, anchor="mm")
    tx = VW // 2 - 30 + B.F_TITLE(60).getlength("続きは本編で") // 2 + 30
    ty = 60 + pad + 60
    d.polygon([(tx, ty - 24), (tx, ty + 24), (tx + 38, ty)], fill=B.INK)  # 三角の矢印(フォントに無い記号は図形で描く)
    tag = f"{sc['series']}  バグ報告 {sc.get('episode', '')}"
    d.text((VW // 2, 300), tag, font=B.F_POP(46), fill=(255, 255, 255), anchor="mm", stroke_width=8, stroke_fill=B.INK)
    im.save(path)


def centered_text(lines, size):
    """中央ぞろえの太い見出し。最後の行を黄色にする"""
    f = B.F_TITLE(size)
    lh = int(size * 1.15)
    w = int(max(f.getlength(l) for l in lines)) + 80
    im = Image.new("RGBA", (w, lh * len(lines) + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        y = 20 + lh * i + lh // 2
        col = B.MARKER if i == len(lines) - 1 else (255, 255, 255)
        d.text((w // 2 + 8, y + 8), l, font=f, fill=B.INK, anchor="mm", stroke_width=size // 7, stroke_fill=B.INK)
        d.text((w // 2, y), l, font=f, fill=col, anchor="mm", stroke_width=size // 7, stroke_fill=B.INK)
    return im


def thumb_png(sc, sh, k, path):
    """ショート用の縦型サムネイル。本編サムネと同じ黄色ストライプ・見出し・顔で、シリーズとして見分けやすく"""
    import package as P
    im = Image.new("RGBA", (VW, VH), B.MARKER + (255,))
    d = ImageDraw.Draw(im)
    for i in range(-VH, VW + VH, 80):
        d.polygon([(i, 0), (i + 40, 0), (i + 40 - VH, VH), (i - VH, VH)], fill=(255, 238, 160, 255))
    photos = [v for v in sc.get("publish", {}).get("thumbnails", []) if v.get("photo")]
    ph = sh.get("thumb_photo", photos[min(k - 1, len(photos) - 1)] if photos else None)  # false で図なし
    if isinstance(ph, str):
        ph = {"photo": ph}
    bt = centered_text(sh["hook"], 140 if ph else 165)
    if bt.width > VW - 40:
        bt = bt.resize((VW - 40, int(bt.height * (VW - 40) / bt.width)), Image.LANCZOS)
    y = 150 if ph else 380  # 図が無いときは見出しを大きく、画面の中ほどに
    if ph:
        src = Image.open(B.REFS / ph["photo"])
        c = ph.get("crop") or (0, 0, 1, 1)
        aspect = src.width * (c[2] - c[0]) / (src.height * (c[3] - c[1]))
        pb = P.photo_block(B.REFS / ph["photo"], (900, int(min(640, max(420, 900 / aspect)))), ph.get("focus", 0.5), crop=ph.get("crop"))
        im.alpha_composite(pb, ((VW - pb.width) // 2, y + bt.height + 10))
    names = ["tsumugi", "zunda"]
    for j, key in enumerate(names):
        fc = P.face(key, "surprise", 520 if ph else 600)
        x = -40 if j == 0 else VW - fc.width + 40
        im.alpha_composite(fc, (x, VH - fc.height + 30))
    im.alpha_composite(bt, ((VW - bt.width) // 2, y))
    tagtxt = f"バグ報告 {sc.get('episode', '')}"
    tag, pad = B.sticker(int(B.F_POP(48).getlength(tagtxt)) + 70, 80, 40, B.PAPER, shadow=B.INK + (255,), off=(4, 4), ow=4)
    ImageDraw.Draw(tag).text((tag.width // 2 - 2, tag.height // 2 - 2), tagtxt, font=B.F_POP(48), fill=B.INK, anchor="mm")
    im.alpha_composite(tag.rotate(-4, expand=True, resample=Image.BICUBIC), ((VW - tag.width) // 2, 30))
    im.convert("RGB").save(path, quality=90)


def main():
    sp, video = Path(sys.argv[1]), Path(sys.argv[2])
    sc = json.loads(sp.read_text())
    name = sp.stem
    meta = json.loads((ROOT / "out" / f"{name}_meta.json").read_text())
    starts = {i: (s, d) for i, s, d in meta["lines"]}
    od = ROOT / "out" / f"{name}_publish"
    od.mkdir(parents=True, exist_ok=True)
    if "--thumbs-only" in sys.argv:  # サムネイルだけ作り直す
        for k, sh in enumerate(sc.get("shorts", []), 1):
            thumb_png(sc, sh, k, od / f"thumb_{k}.jpg")
        txt = od / "shorts.txt"
        if txt.exists() and "thumb_1.jpg" not in txt.read_text(encoding="utf-8"):
            txt.write_text(txt.read_text(encoding="utf-8") + "サムネイル: ショート1は thumb_1.jpg、ショート2は thumb_2.jpg(パソコンの Studio で設定)。\n", encoding="utf-8")
        return
    titles = []
    for k, sh in enumerate(sc.get("shorts", []), 1):
        t0 = max(0.0, starts[sh["from"]][0] - 0.25)
        t1 = starts[sh["to"]][0] + starts[sh["to"]][1] + 0.5
        if t1 - t0 > 179:
            sys.exit(f"ショート{k}が3分を超えています")
        hp, fp = od / f"_hook{k}.png", od / "_footer.png"
        hook_png(sh["hook"], hp); footer_png(sc, fp)
        out = od / f"short_{k}.mp4"
        fc = (f"[0:v]split=2[a][b];"
              f"[a]scale=-2:{VH},crop={VW}:{VH},boxblur=24:4,eq=brightness=-0.12[bg];"
              f"[b]crop=1640:1080:140:0,scale={VW}:-2[fg];"
              f"[bg][fg]overlay=0:(H-h)/2[v1];[v1][1:v]overlay=0:140[v2];[v2][2:v]overlay=0:H-560[v]")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t0:.2f}", "-to", f"{t1:.2f}", "-i", str(video),
                        "-i", str(hp), "-i", str(fp), "-filter_complex", fc, "-map", "[v]", "-map", "0:a",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-r", "30",
                        "-c:a", "aac", "-b:a", "160k", str(out)], check=True)
        hp.unlink()
        thumb_png(sc, sh, k, od / f"thumb_{k}.jpg")
        titles.append(f"ショート{k}({t1 - t0:.0f}秒)：{sh['title']}")
        print("->", out, f"{t1 - t0:.1f}s")
    (od / "_footer.png").unlink(missing_ok=True)
    (od / "shorts.txt").write_text("\n".join(titles) + "\n\n概要欄(共通): 本編はチャンネルのホームから。\n"
                                   "投稿後、Studio のショートの編集で「関連動画」に本編を設定すると、本編への導線が付きます。\n"
                                   "サムネイル: ショート1は thumb_1.jpg、ショート2は thumb_2.jpg(パソコンの Studio で設定)。\n",
                                   encoding="utf-8")


if __name__ == "__main__":
    main()
