#!/usr/bin/env python3
"""テンプレート一式を zip にまとめる(配布用)。
  python3 kit/make_kit.py            # -> out/video_channel_kit.zip
中身: kit の文書とひな形 + engine/(動画を作るプログラムとフォント)+ examples/(実際の台本1本)。
立ち絵・BGM・生成物は入れない(権利と容量のため)。zip 内のファイル名は英数字のみ(Windows の文字化け対策)。
"""
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "kit"
OUT = ROOT / "out" / "video_channel_kit.zip"
ENGINE = ["scripts/build.py", "scripts/package.py", "scripts/shorts.py",
          "tools/produce.sh", "tools/figs.py", "tools/geo_maps.py", "tools/make_sprites.py", "tools/brand.py",
          "tools/topics.py", "tools/fetch_bgm.py", "tools/yt_upload.py", "assets/bgm/sources.json"]
GITIGNORE = """assets/psd/
assets/sprites/
assets/bgm/*.mp3
assets/bgm/*.wav
assets/refs/*/
out/
tools/client_secret*.json
tools/token.json
__pycache__/
"""


def main():
    OUT.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(KIT.rglob("*")):
            if f.is_file() and f.name != "make_kit.py":
                z.write(f, "video_channel_kit/" + str(f.relative_to(KIT)))
        for rel in ENGINE:
            z.write(ROOT / rel, "video_channel_kit/engine/" + rel)
        for f in sorted((ROOT / "assets/fonts").iterdir()):
            z.write(f, "video_channel_kit/engine/assets/fonts/" + f.name)
        for f in sorted((ROOT / "assets/geo").glob("*.zip")):  # Natural Earth(パブリックドメイン)の国境データ
            z.write(f, "video_channel_kit/engine/assets/geo/" + f.name)
        z.writestr("video_channel_kit/engine/.gitignore", GITIGNORE)
        z.write(ROOT / "scripts/ep006_starship.json", "video_channel_kit/examples/ep006_starship.json")
    names = zipfile.ZipFile(OUT).namelist()
    bad = [n for n in names if not n.isascii()]
    assert not bad, f"英数字以外のファイル名: {bad}"
    print(f"-> {OUT} ({OUT.stat().st_size / 1e6:.1f}MB, {len(names)} files)")


if __name__ == "__main__":
    main()
