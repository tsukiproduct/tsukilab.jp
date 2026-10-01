#!/usr/bin/env python3
"""PSD立ち絵から表情・口パク・まばたきのPNG差分を書き出す。
PSDは worldmystery/assets/psd/{zunda,tsumugi}.psd に置く(リポジトリには含めない)。
使い方: python3 tools/make_sprites.py [zunda|tsumugi ...]
"""
import sys, itertools
from pathlib import Path
from psd_tools import PSDImage
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PSD_DIR, OUT = ROOT / "assets/psd", ROOT / "assets/sprites"
HEIGHT = 980  # 出力高さ

# 各表情: (眉, 目, 頬) / 口は閉・開で別指定 / 腕は任意
CHARS = {
    "zunda": {
        "mouth": {"closed": "んー", "half": "ほあ", "open": "ほあー"},
        "blink": "にっこり",
        "emotes": {
            "normal":   dict(brow="普通眉",  eye=None,       cheek="ほっぺ"),
            "happy":    dict(brow="上がり眉", eye="にっこり",  cheek="ほっぺ2"),
            "surprise": dict(brow="上がり眉", eye="eyeset:見開き白目", cheek="ほっぺ"),
            "think":    dict(brow="困り眉1", eye=None,       cheek="ほっぺ", larm="考える"),
        },
        "groups": dict(brow="!眉", eye="!目", cheek="!顔色", mouth="!口"),
    },
    "tsumugi": {
        "mouth": {"closed": "ほほえみ", "half": "お", "open": "わあ"},
        "blink": "閉じ",
        "emotes": {
            "normal":   dict(brow="普通眉",    eye=None,      cheek="基本"),
            "happy":    dict(brow="ごきげん眉", eye="にっこり", cheek="赤面"),
            "surprise": dict(brow="普通眉",    eye="eyeset:白目見開き", cheek="基本"),
            "think":    dict(brow="困り眉",    eye=None,      cheek="基本"),
        },
        "groups": dict(brow="!まゆ", eye="!目", cheek="!ほっぺ", mouth="!口"),
    },
}

def child(group, name):
    for c in group:
        if c.name.lstrip("*") == name.lstrip("*"):
            return c
    raise KeyError(f"{name} not in {group.name}: {[c.name for c in group]}")

def only(group, name):
    child(group, name)  # 存在確認
    for c in group:
        c.visible = c.name.lstrip("*") == name.lstrip("*")

def apply(psd, cfg, emote, mouth, blink):
    g = cfg["groups"]
    grp = lambda n: next(l for l in psd.descendants() if l.name == n and l.is_group())
    only(grp(g["brow"]), emote["brow"])
    only(grp(g["cheek"]), emote["cheek"])
    only(grp(g["mouth"]), mouth)
    eyes = grp(g["eye"])
    if blink:
        only(eyes, cfg["blink"])
    else:
        e = emote["eye"]
        if e is None or e.startswith("eyeset:"):
            for c in eyes:  # 目セット(白目+黒目)のみ表示
                c.visible = c.is_group() and "セット" in c.name
            if e:
                wset = child(next(c for c in eyes if c.is_group()), e.split(":")[1])
                for c in wset.parent:
                    if not c.is_group():
                        c.visible = c is wset
        else:
            only(eyes, e)
    if "larm" in emote and cfg is CHARS["zunda"]:
        for a in [l for l in psd.descendants() if l.name == "!左腕" and l.is_group()]:
            if a.parent.visible:
                only(a, emote["larm"])

def render(key):
    cfg = CHARS[key]
    out = OUT / key
    out.mkdir(parents=True, exist_ok=True)
    for ename, emote in cfg["emotes"].items():
        for mname, mouth in cfg["mouth"].items():
            for blink in (False, True):
                psd = PSDImage.open(PSD_DIR / f"{key}.psd")
                apply(psd, cfg, emote, mouth, blink)
                img = psd.composite(force=True).convert("RGBA")
                img = img.crop(img.getbbox()) if False else img
                w = round(img.width * HEIGHT / img.height)
                img = img.resize((w, HEIGHT), Image.LANCZOS)
                img.save(out / f"{ename}_{mname}_{'blink' if blink else 'open'}.png")
        print(key, ename, "ok", flush=True)

if __name__ == "__main__":
    for k in (sys.argv[1:] or CHARS):
        render(k)
