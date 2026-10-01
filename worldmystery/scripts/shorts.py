#!/usr/bin/env python3
"""完成した本編から、縦型ショート(1080x1920)を切り抜く。
台本JSONの "shorts" に区間を書く:
  "shorts": [{"from": 0, "to": 3, "hook": ["グリーンランドは", "アフリカより大きい？"], "title": "...#Shorts"}]
  from/to は台本の行番号(to の行まで含む)。60秒以内を目安にする。
  python3 scripts/shorts.py scripts/ep001_world_map.json out/ep001_world_map.mp4
上: 大きな見出し / 中央: 本編の映像 / 下: 「続きは本編で」とシリーズ札。背景は本編をぼかして敷く。
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
    f = B.F_TITLE(96 if max(len(l) for l in lines) <= 9 else 80)
    for i, l in enumerate(lines):
        y = 150 + i * 150
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


def main():
    sp, video = Path(sys.argv[1]), Path(sys.argv[2])
    sc = json.loads(sp.read_text())
    name = sp.stem
    meta = json.loads((ROOT / "out" / f"{name}_meta.json").read_text())
    starts = {i: (s, d) for i, s, d in meta["lines"]}
    od = ROOT / "out" / f"{name}_publish"
    od.mkdir(parents=True, exist_ok=True)
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
        titles.append(f"ショート{k}({t1 - t0:.0f}秒)：{sh['title']}")
        print("->", out, f"{t1 - t0:.1f}s")
    (od / "_footer.png").unlink(missing_ok=True)
    (od / "shorts.txt").write_text("\n".join(titles) + "\n\n概要欄(共通): 本編はチャンネルのホームから。\n"
                                   "投稿後、Studio のショートの編集で「関連動画」に本編を設定すると、本編への導線が付きます。\n",
                                   encoding="utf-8")


if __name__ == "__main__":
    main()
