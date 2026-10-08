#!/usr/bin/env python3
"""台本JSON -> 音声(VOICEVOX) -> 口パク付き動画(mp4)。
  python3 scripts/build.py scripts/sample_sailing_stones.json              # VOICEVOXがあれば音声合成して動画化
  python3 scripts/build.py scripts/sample_sailing_stones.json --dry        # 音声なし(文字数から時間を推定)
  python3 scripts/build.py scripts/sample_sailing_stones.json --still 30 out/still.png   # 30秒時点の静止画
  python3 scripts/build.py scripts/sample_sailing_stones.json --voice-only # 声(WAV)だけ作る。立ち絵・フォントは不要
  python3 scripts/build.py scripts/sample_sailing_stones.json --use-wavs   # 作成済みWAVで動画を作る
  --no-bgm でBGMなし。 環境変数 VOICEVOX_URL (既定 http://127.0.0.1:50021)

台本JSONの主な項目:
  characters.<key>: name / voicevox / side(left|right) / speed / intonation
  chapters: ["謎","調査",...]   各行の "chapter": 番号 でその行から章が切り替わる(上部の章バー)
  bgm: {"file": "assets/bgm/xxx.mp3", "credit": "...", "license": "...", "url": "..."}
各行(lines):
  who, text, emote(normal/happy/surprise/think)   textの [[語]] は強調(マーカー)、TTSでは無視
  mode   : "full"=全身(冒頭の挨拶用) / "bust"=上半身アップ(既定)
  telop  : 中央に出す数字や要点カード("\\n"で改行)
  image  : 参照画像(assets/refs/) + credit / license / url / fit(contain) / focus / note
  panel  : "none" で中央のカードを消す(image/telopは次の指定まで出続ける)
  sfx    : pon / kira / chan / bubu    punch: true で話者が一瞬ズームする
  seq    : 連番PNGのフォルダ名(assets/refs/<seq>/NNN.png, 30fps)= 動く図。box: [幅,高さ] で表示枠
  pop    : 話者の横に出る吹き出しの一言     chapter: 章番号(その行から章が切り替わる)
  report : true で報告書カード / stamp: true でステータスの判子を押す
  {"sting": true} の行 = オープニング(約2.6秒、ロゴ + 「<tag> #番号」)
台本の "brand" で札・報告書の言葉・強調色を差し替えられる(BRAND を参照)。
キャラごとの字幕色は characters.<key>.colors = {"text": [R,G,B], "main": [R,G,B]}。
"""
import argparse, functools, json, math, os, random, re, subprocess, sys, wave, struct, urllib.request, urllib.parse, hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SPR, REFS, FONTS = ROOT / "assets/sprites", ROOT / "assets/refs", ROOT / "assets/fonts"
W, H, FPS = 1920, 1080, 30
GAP, CHARS_PER_SEC, CUE_MAX = 0.30, 6.5, 44

# ---------- デザイン定義 ----------
INK = (74, 52, 46)            # 黒ではなく焦げ茶のインク
CREAM = (255, 246, 228)
PAPER = (255, 253, 247)
DOT = (255, 232, 196)
MINT, PEACH, LEMON, SKY = (190, 232, 207), (255, 206, 190), (255, 233, 150), (198, 226, 246)
MARKER = (255, 226, 110)
TAPE = [(255, 190, 200, 205), (190, 225, 255, 205), (255, 236, 150, 205)]
PALETTE = {  # text=字幕の文字色 / main=名札と縁
    "zunda":   dict(text=(40, 132, 52),  main=(118, 200, 82)),
    "tsumugi": dict(text=(208, 98, 10),  main=(255, 178, 56)),
}
F = lambda name, size: ImageFont.truetype(str(FONTS / name), size)
F_BODY = lambda s: F("ZenMaruGothic_900Black.ttf", s)
F_BOLD = lambda s: F("ZenMaruGothic_700Bold.ttf", s)
F_TITLE = lambda s: F("DelaGothicOne_400Regular.ttf", s)
F_POP = lambda s: F("HachiMaruPop_400Regular.ttf", s)
SS = 2  # 図形はこの倍率で描いて縮小(ジャギー防止)

# チャンネル固有の言葉と色。台本JSONの "brand" で上書きできる(別ジャンルのチャンネルに流用するため)
BRAND = {
    "tag": "バグ報告",                 # 「バグ報告 #001」の札(オープニング・サムネ・ショート)
    "report_title": "バグ報告書",      # 締めの報告書カードの見出し
    "report_labels": ["対象", "発生場所", "原因の報告", "深刻度", "ステータス"],
    "comment_cta": "あなたが見つけた「この世界のバグ」も、コメントで報告してください。次回以降の報告書で取り上げるかもしれません。",
    "shorts_more": "続きは本編で",
    "marker": None,                    # 強調色 [R,G,B](null ならそのまま)
}


# 背景のテーマ。回ごとに台本の "theme" で切り替え、毎回同じ見た目(テンプレ感)にならないようにする。
# 字幕・カード・報告書は読みやすさのため紙色のまま。変えるのは下地・大きな丸・流れる模様・枠線。
THEMES = {
    "pop":    dict(base=(255, 246, 228), blobs=[(190, 232, 207), (255, 206, 190), (255, 233, 150), (198, 226, 246)],
                   pattern="dots", pat=(255, 214, 160, 255), frame=(216, 176, 130, 255)),
    "night":  dict(base=(24, 30, 62), blobs=[(38, 52, 104), (58, 40, 96), (30, 72, 100), (48, 44, 92)],
                   pattern="stars", pat=(200, 214, 255, 150), frame=(120, 140, 210, 255), stars=True),
    "alert":  dict(base=(40, 36, 40), blobs=[(92, 36, 40), (70, 40, 34), (96, 70, 30), (60, 46, 52)],
                   pattern="stripes", pat=(255, 196, 60, 34), frame=(230, 160, 60, 255)),
    "lab":    dict(base=(234, 244, 246), blobs=[(204, 232, 238), (220, 230, 250), (214, 240, 222), (236, 226, 246)],
                   pattern="grid", pat=(150, 196, 210, 120), frame=(120, 170, 190, 255)),
    "forest": dict(base=(238, 244, 224), blobs=[(198, 226, 176), (226, 210, 170), (176, 214, 186), (240, 226, 180)],
                   pattern="dots", pat=(196, 222, 160, 255), frame=(150, 170, 110, 255)),
}
THEME = dict(THEMES["pop"])


def set_brand(sc):
    """台本の "brand" を既定値に重ねる。強調色も差し替える。"theme" で背景を切り替える"""
    global MARKER
    th = sc.get("theme", "pop")
    THEME.clear(); THEME.update(THEMES[th] if isinstance(th, str) else {**THEMES["pop"], **th})
    BRAND.update(sc.get("brand", {}))
    if BRAND.get("marker"):
        MARKER = tuple(BRAND["marker"])
    for key, ch in sc.get("characters", {}).items():  # 別のキャラは "colors": {"text": [R,G,B], "main": [R,G,B]}
        if ch.get("colors"):
            PALETTE[key] = {k: tuple(v) for k, v in ch["colors"].items()}


def sticker(w, h, radius, fill, outline=INK, ow=5, shadow=(0, 0, 0, 0), off=(8, 8)):
    """太い縁取りとずらし影のステッカー風の角丸カード"""
    pad = 16
    im = Image.new("RGBA", ((w + pad * 2) * SS, (h + pad * 2) * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    box = lambda dx, dy: [(pad + dx) * SS, (pad + dy) * SS, (pad + dx + w) * SS, (pad + dy + h) * SS]
    if shadow[3]:
        d.rounded_rectangle(box(*off), radius * SS, fill=shadow)
    d.rounded_rectangle(box(0, 0), radius * SS, fill=fill, outline=outline, width=ow * SS)
    return im.resize((im.width // SS, im.height // SS), Image.LANCZOS), pad


def dashed_frame(d, inset, color, width=3, dash=16, gap=12, r=34):
    x0, y0, x1, y1 = inset, inset, W * SS - inset, H * SS - inset
    for (ax, ay, bx, by) in [(x0 + r, y0, x1 - r, y0), (x0 + r, y1, x1 - r, y1),
                             (x0, y0 + r, x0, y1 - r), (x1, y0 + r, x1, y1 - r)]:
        L = math.hypot(bx - ax, by - ay)
        n = int(L // ((dash + gap) * SS))
        for i in range(n + 1):
            a = i * (dash + gap) * SS / L
            b = min((i * (dash + gap) + dash) * SS / L, 1)
            d.line([(ax + (bx - ax) * a, ay + (by - ay) * a), (ax + (bx - ax) * b, ay + (by - ay) * b)],
                   fill=color, width=width * SS)
    for cx, cy, st in [(x0 + r, y0 + r, 180), (x1 - r, y0 + r, 270), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90)]:
        d.arc([cx - r, cy - r, cx + r, cy + r], st, st + 90, fill=color, width=width * SS)


def star(d, cx, cy, r, fill, outline=None, ow=0, rot=0):
    pts = []
    for i in range(10):
        a = math.radians(rot - 90 + i * 36)
        rr = r if i % 2 == 0 else r * 0.46
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill, outline=outline, width=ow)


def background(series, title, episode):
    """(下地, 流れる水玉, 固定の飾り) を返す。水玉だけ毎フレームずらして動きを出す"""
    T = THEME
    base = Image.new("RGBA", (W * SS, H * SS), T["base"] + (255,))
    d = ImageDraw.Draw(base, "RGBA")
    for (cx, cy, rx, ry), col in zip([(120, 1010, 430, 300), (1830, 1000, 470, 320), (1750, 190, 250, 150), (130, 230, 230, 140)],
                                     T["blobs"]):
        d.ellipse([(cx - rx) * SS, (cy - ry) * SS, (cx + rx) * SS, (cy + ry) * SS], fill=tuple(col) + (255,))
    if T.get("stars"):  # 夜空: 動かない星をちりばめる(繰り返し模様にならないよう乱数で)
        rnd = random.Random(7)
        for _ in range(170):
            x, y, r = rnd.randint(0, W), rnd.randint(0, H), rnd.choice([1, 1, 1.5, 2, 2.5])
            a = rnd.randint(90, 230)
            d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=(255, 250, 230, a))
    base = base.resize((W, H), Image.LANCZOS)
    dots = Image.new("RGBA", ((W + 156) * SS, (H + 156) * SS), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dots)
    pat, pc = T["pattern"], tuple(T["pat"])
    if pat == "dots":
        for gy, y in enumerate(range(0, H + 156, 78)):  # 水玉(78px周期なのでループして継ぎ目が出ない)
            for x in range((gy % 2) * 39, W + 156, 78):
                dd.ellipse([(x - 6) * SS, (y - 6) * SS, (x + 6) * SS, (y + 6) * SS], fill=pc)
    elif pat == "grid":  # 方眼(実験ノート風)
        for x in range(0, W + 156, 78):
            dd.line([(x * SS, 0), (x * SS, (H + 156) * SS)], fill=pc, width=2 * SS)
        for y in range(0, H + 156, 78):
            dd.line([(0, y * SS), ((W + 156) * SS, y * SS)], fill=pc, width=2 * SS)
    elif pat == "stripes":  # 注意テープ風の斜線(x+y が78の倍数)
        for k in range(-(H + 156), W + 156 + H + 156, 78):
            dd.line([(k * SS, 0), ((k - (H + 156)) * SS, (H + 156) * SS)], fill=pc, width=22 * SS)
    elif pat == "stars":  # 流れる小さな光の粒
        for gy, y in enumerate(range(0, H + 156, 78)):
            for x in range((gy % 2) * 39, W + 156, 78):
                dd.ellipse([(x - 2) * SS, (y - 2) * SS, (x + 2) * SS, (y + 2) * SS], fill=pc)
                dd.ellipse([(x + 27) * SS, (y + 41) * SS, (x + 28.5) * SS, (y + 42.5) * SS], fill=pc[:3] + (pc[3] // 2,))
    dots = dots.resize((W + 156, H + 156), Image.LANCZOS)
    ov = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    dashed_frame(ImageDraw.Draw(ov, "RGBA"), 20 * SS, tuple(T["frame"]))
    im = ov.resize((W, H), Image.LANCZOS)
    tf = F_TITLE(50)  # タイトルのリボン
    tw = int(tf.getlength(title)) + 140
    card, pad = sticker(tw, 88, 44, PAPER, shadow=PEACH + (255,))
    im.alpha_composite(card, ((W - tw) // 2 - pad, 24 - pad))
    ImageDraw.Draw(im).text((W // 2, 68), title, font=tf, fill=INK, anchor="mm")
    sf = F_POP(34)  # 左: シリーズのロゴ札
    sw = int(sf.getlength(series)) + 100
    tag, pad = sticker(sw, 70, 35, LEMON, shadow=INK + (255,), off=(5, 5), ow=4)
    im.alpha_composite(tag, (48 - pad + 8, 28 - pad + 8))
    ImageDraw.Draw(im).text((56 + sw // 2, 63), series, font=sf, fill=INK, anchor="mm")
    badge, bp = sticker(112, 112, 56, PEACH, shadow=INK + (255,), off=(5, 5), ow=4)  # 右: エピソード札
    im.alpha_composite(badge, (W - 168 - bp, 22 - bp + 8))
    ImageDraw.Draw(im).text((W - 112, 86), episode, font=F_POP(24 if len(episode) > 3 else 30), fill=INK, anchor="mm")
    return base, dots, im


# ---------- テキスト ----------
NOBREAK = "ーぁぃぅぇぉっゃゅょ、。！？」』）"


def parse_marks(raw):
    """'abc[[強調]]def' -> [(文字, 強調か)]"""
    out, emph, i = [], False, 0
    while i < len(raw):
        if raw.startswith("[[", i):
            emph = True; i += 2
        elif raw.startswith("]]", i):
            emph = False; i += 2
        else:
            out.append((raw[i], emph)); i += 1
    return out


def plain(raw):
    return re.sub(r"\[\[|\]\]", "", raw)


def split_cues(raw, maxc=CUE_MAX):
    """長い台詞を、読みやすい長さ(2行以内)の字幕に区切る"""
    pl = lambda s: len(plain(s))
    parts = [p for p in re.split(r"(?<=[。！？])", raw) if p]
    out = []
    for p in parts:
        if pl(p) <= maxc:
            out.append(p); continue
        cur = ""
        for s in [x for x in re.split(r"(?<=、)", p) if x]:
            if cur and pl(cur + s) > maxc:
                out.append(cur); cur = s
            else:
                cur += s
        if cur:
            out.append(cur)
    merged = []
    for p in out:
        if merged and pl(merged[-1] + p) <= maxc:
            merged[-1] += p
        else:
            merged.append(p)
    return merged


def cue_weight(raw):
    p = plain(raw)
    return len(p) + 4 * p.count("、") + 8 * sum(p.count(c) for c in "。！？")


def wrap_marks(chars, f, maxw):
    lines, cur, w = [], [], 0
    for ch, em in chars:
        cw = f.getlength(ch)
        if w + cw > maxw and cur and ch not in NOBREAK:
            brk = max((j for j, (c_, _) in enumerate(cur) if c_ == "、"), default=-1)  # 読点の後ろで折り返す
            if brk >= len(cur) * 0.45 and brk < len(cur) - 1:
                lines.append(cur[:brk + 1]); cur = cur[brk + 1:]
                w = sum(f.getlength(c_) for c_, _ in cur)
            else:
                lines.append(cur); cur, w = [], 0
        cur.append((ch, em)); w += cw
    return lines + ([cur] if cur else [])


def subtitle_img(char, raw, side):
    """キャラ色の文字 + 強調マーカー + キャラ色の名札つき吹き出し"""
    pal = PALETTE[char["key"]]
    f, nf = F_BOLD(52), F_POP(32)
    bw = 1320
    lines = wrap_marks(parse_marks(raw), f, bw - 120)
    lh = 70
    h = 58 + lh * len(lines) + 18
    card, pad = sticker(bw, h, 40, PAPER, shadow=pal["main"] + (255,), off=(9, 9), ow=5)
    nw = int(nf.getlength(char["name"])) + 70
    tail = Image.new("RGBA", (120 * SS, 70 * SS), (0, 0, 0, 0))
    td = ImageDraw.Draw(tail)
    td.polygon([(x * SS, y * SS) for x, y in [(10, 70), (60, 8), (112, 70)]], fill=PAPER + (255,), outline=INK + (255,), width=5 * SS)
    td.line([(14 * SS, 70 * SS), (108 * SS, 70 * SS)], fill=PAPER + (255,), width=8 * SS)
    tail = tail.resize((120, 70), Image.LANCZOS)
    cw = bw + pad * 2
    out = Image.new("RGBA", (cw, card.height + 90), (0, 0, 0, 0))
    ty = 40
    out.alpha_composite(card, (0, ty + 30))
    tx = pad + 40 + nw + 40 if side == "left" else cw - pad - 40 - nw - 40 - 120
    out.alpha_composite(tail, (tx, ty + 46 - 60))
    ntag, npad = sticker(nw, 58, 29, pal["main"], shadow=INK + (255,), off=(4, 4), ow=4)
    nx = pad + 40 if side == "left" else cw - pad - 40 - nw
    out.alpha_composite(ntag, (nx - npad, ty - 4 - npad + 16))
    d = ImageDraw.Draw(out)
    d.text((nx + nw // 2, ty + 16 + 29 - 2), char["name"], font=nf, fill="white", anchor="mm", stroke_width=3, stroke_fill=INK)
    dark = tuple(int(c * 0.78) for c in pal["text"])
    y0 = ty + 30 + pad + 42
    for i, ln in enumerate(lines):
        x, cy = pad + 52, y0 + lh * i + lh // 2
        spans, run = [], None  # 強調の連続区間をマーカーで塗る
        xs = x
        for ch, em in ln:
            cwid = f.getlength(ch)
            if em and run is None:
                run = xs
            if not em and run is not None:
                spans.append((run, xs)); run = None
            xs += cwid
        if run is not None:
            spans.append((run, xs))
        for a, b in spans:
            d.rounded_rectangle([a - 5, cy - 24, b + 5, cy + 30], 12, fill=MARKER)
        for ch, em in ln:
            d.text((x, cy), ch, font=f, fill=INK if em else pal["text"], anchor="lm",
                   stroke_width=0 if em else 1, stroke_fill=dark)
            x += f.getlength(ch)
    return out


def chapter_strips(chapters):
    """上部の章バー。いま何章かが分かり、まだ先があることも見える(離脱防止)"""
    f = F_POP(34)
    labels = [f"{i + 1} {c}" for i, c in enumerate(chapters)]
    ws = [int(f.getlength(l)) + 52 for l in labels]
    total = sum(ws) + 14 * (len(ws) - 1)
    strips = []
    for cur in range(len(chapters)):
        im = Image.new("RGBA", (total + 40, 76), (0, 0, 0, 0))
        x = 20
        for i, (l, w) in enumerate(zip(labels, ws)):
            if i == cur:
                c, pad = sticker(w, 50, 25, MARKER, shadow=INK + (255,), off=(3, 3), ow=3)
            elif i < cur:
                c, pad = sticker(w, 50, 25, MINT, ow=3)
            else:
                c, pad = sticker(w, 50, 25, PAPER, outline=(160, 130, 95), ow=3)
            im.alpha_composite(c, (x - pad, 10 - pad + 8))
            d = ImageDraw.Draw(im)
            d.text((x + w // 2, 36), l, font=f,
                   fill=INK if i <= cur else (140, 112, 80), anchor="mm")
            x += w + 14
        strips.append(im)
    return strips


def marker_text(lines, size, color_hl):
    f = F_TITLE(size)
    w = int(max(f.getlength(l) for l in lines)) + 80
    lh = int(size * 1.45)
    h = lh * len(lines) + 30
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        tw = f.getlength(l)
        y = 15 + lh * i + lh // 2
        d.rounded_rectangle([(w - tw) / 2 - 14, y + size * 0.05, (w + tw) / 2 + 14, y + size * 0.50], size * 0.2, fill=color_hl)
        d.text((w / 2, y), l, font=f, fill=INK, anchor="mm")
    return im


def telop_img(text):
    lines = text.split("\n")
    body = marker_text(lines, 78, LEMON + (255,))
    w, h = body.width + 70, body.height + 50
    card, pad = sticker(w, h, 44, PAPER, shadow=MINT + (255,), off=(10, 10))
    out = Image.new("RGBA", card.size, (0, 0, 0, 0))
    out.alpha_composite(card)
    out.alpha_composite(body, (pad + 35, pad + 25))
    star(ImageDraw.Draw(out), pad + 6, pad + 6, 30, PEACH + (255,), INK + (255,), 4, rot=-10)
    return out


def split_title(title, size, maxw):
    """題名が長いときは、助詞の後ろなど自然な所で2行に分ける(全身の2人の間に収めるため)"""
    f = F_TITLE(size)
    if f.getlength(title) <= maxw:
        return [title]
    kind = lambda c: "h" if "ぁ" <= c <= "ゖ" else "k" if "ァ" <= c <= "ヺ" or c == "ー" else "d" if c.isascii() else "c"
    best, bscore = len(title) // 2, 1e9
    for i in range(2, len(title) - 1):
        a, b = title[:i], title[i:]
        if b[0] in NOBREAK or b[0] in "がをはにでとものへや":
            continue
        # 助詞の後ろ > 文字の種類が変わる所(漢字→ひらがな など)> それ以外(単語の途中になりやすい)
        pen = 0 if a[-1] in "がをはにでとも、" else 250 if kind(a[-1]) != kind(b[0]) else 2000
        score = max(f.getlength(a), f.getlength(b)) + pen
        if score < bscore:
            best, bscore = i, score
    return [title[:best], title[best:]]


def title_card(series, title, episode):
    size = 84
    lines = split_title(title, size, 760)
    while max(F_TITLE(size).getlength(l) for l in lines) > 760 and size > 56:
        size -= 4
    body = marker_text(lines, size, PEACH + (255,))
    w, h = max(body.width + 90, 760), body.height + 150
    card, pad = sticker(w, h, 52, PAPER, shadow=MINT + (255,), off=(12, 12), ow=6)
    out = Image.new("RGBA", card.size, (0, 0, 0, 0))
    out.alpha_composite(card)
    d = ImageDraw.Draw(out)
    d.text((out.width // 2, pad + 56), f"{series}  {episode}", font=F_POP(40), fill=(214, 104, 16), anchor="mm")
    out.alpha_composite(body, ((out.width - body.width) // 2, pad + 90))
    star(d, pad + 20, pad + 20, 38, LEMON + (255,), INK + (255,), 4, rot=-12)
    star(d, out.width - pad - 20, out.height - pad - 20, 32, MINT + (255,), INK + (255,), 4, rot=14)
    return out


def photo_card(entry, img=None):
    """ポラロイド風の写真枠(出典つき)。画像が無い間は「画像待ち」の枠を出す。img を渡すとその画像を使う(連番アニメ用)"""
    box_w, box_h = entry.get("box") or (600, 340)
    path = REFS / entry["image"]
    if img is not None or path.exists():
        ph = (img if img is not None else Image.open(path)).convert("RGB")
        if entry.get("crop"):  # 図の一部を切り出す(x0,y0,x1,y1 を0〜1の割合で)
            x0, y0, x1, y1 = (float(v) for v in entry["crop"])
            ph = ph.crop((int(x0 * ph.width), int(y0 * ph.height), int(x1 * ph.width), int(y1 * ph.height)))
        if entry.get("fit") == "contain":  # 図版など、切らずに全体を見せる
            ph = ImageOps.contain(ph, (box_w, box_h), Image.LANCZOS)
            base = Image.new("RGB", (box_w, box_h), (247, 243, 234))
            base.paste(ph, ((box_w - ph.width) // 2, (box_h - ph.height) // 2))
            ph = base
        else:
            ph = ImageOps.fit(ph, (box_w, box_h), Image.LANCZOS, centering=(0.5, float(entry.get("focus") or 0.5)))
    else:
        ph = Image.new("RGB", (box_w, box_h), (244, 236, 220))
        d = ImageDraw.Draw(ph)
        d.rectangle([14, 14, box_w - 15, box_h - 15], outline=(190, 170, 140), width=4)
        d.text((box_w // 2, box_h // 2 - 24), "ここに参照画像", font=F_BODY(44), fill=(170, 146, 112), anchor="mm")
        d.text((box_w // 2, box_h // 2 + 36), entry["image"], font=F_BOLD(28), fill=(170, 146, 112), anchor="mm")
    cap, lic = entry.get("credit", ""), entry.get("license", "")
    cw, chh = box_w + 56, box_h + 56 + 70
    card, pad = sticker(cw, chh, 14, PAPER, shadow=INK + (70,), off=(10, 12), ow=4)
    out = Image.new("RGBA", (card.width + 40, card.height + 40), (0, 0, 0, 0))
    out.alpha_composite(card, (20, 20))
    out.paste(ph, (20 + pad + 28, 20 + pad + 28))
    d = ImageDraw.Draw(out)
    cf = F_BOLD(26)
    txt = f"出典: {cap}" + (f"  /  {lic}" if lic else "")
    while cf.getlength(txt) > cw - 50 and cf.size > 16:
        cf = F_BOLD(cf.size - 2)
    d.text((20 + pad + cw // 2, 20 + pad + 28 + box_h + 36), txt, font=cf, fill=INK, anchor="mm")
    for (tx, ty, col, rot) in [(70, 8, TAPE[0], -18), (out.width - 190, 4, TAPE[1], 14)]:
        tp = Image.new("RGBA", (130, 46), col).rotate(rot, expand=True, resample=Image.BICUBIC)
        out.alpha_composite(tp, (tx, ty))
    return out.rotate(-2.2, expand=True, resample=Image.BICUBIC)


def pop_img(text, color):
    """決めの一言を、ステッカー風の大きな文字スタンプにする"""
    f = F_TITLE(118)
    tw, th = int(f.getlength(text)) + 90, 190
    im = Image.new("RGBA", (tw * SS, th * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((tw // 2 * SS, th // 2 * SS), text, font=ImageFont.truetype(str(FONTS / "DelaGothicOne_400Regular.ttf"), 118 * SS), fill=color,
           anchor="mm", stroke_width=22 * SS, stroke_fill=INK)
    d.text((tw // 2 * SS, th // 2 * SS), text, font=ImageFont.truetype(str(FONTS / "DelaGothicOne_400Regular.ttf"), 118 * SS), fill=(255, 255, 255),
           anchor="mm", stroke_width=12 * SS, stroke_fill=(255, 255, 255))
    d.text((tw // 2 * SS, th // 2 * SS), text, font=ImageFont.truetype(str(FONTS / "DelaGothicOne_400Regular.ttf"), 118 * SS), fill=color,
           anchor="mm")
    im = im.resize((tw, th), Image.LANCZOS)
    return im.rotate(-7, expand=True, resample=Image.BICUBIC)


def burst_img():
    """マンガの集中線(中心から放射する細い三角形)"""
    n, R = 42, 760
    im = Image.new("RGBA", (R * 2 * SS // 2, R * 2 * SS // 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = R * SS // 2
    for i in range(n):
        a = 2 * math.pi * i / n
        w = math.pi / n * 0.55
        d.polygon([(c + math.cos(a - w) * R * SS // 2, c + math.sin(a - w) * R * SS // 2),
                   (c + math.cos(a + w) * R * SS // 2, c + math.sin(a + w) * R * SS // 2),
                   (c + math.cos(a) * 130 * SS // 2, c + math.sin(a) * 130 * SS // 2)], fill=(255, 214, 90, 150))
    return im.resize((R, R), Image.LANCZOS)


def chapter_band(num, label):
    """章の切り替えで画面を横切る帯(テレビ番組のタイトル風)"""
    h = 170
    im = Image.new("RGBA", (W, h + 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 15 + 10, W, 15 + h + 10], fill=INK + (255,))
    d.rectangle([0, 15, W, 15 + h], fill=MARKER + (255,))
    d.rectangle([0, 15, W, 15 + 8], fill=INK + (255,))
    d.rectangle([0, 15 + h - 8, W, 15 + h], fill=INK + (255,))
    big, small = F_TITLE(96), F_POP(44)
    d.text((W // 2 - 20, 15 + h // 2 + 6), label, font=big, fill=INK, anchor="mm")
    d.text((W // 2 - 20 - big.getlength(label) // 2 - 50, 15 + h // 2 + 6), f"CHAPTER {num}", font=small, fill=(208, 98, 10), anchor="rm")
    return im


def report_card(rep_, stamped):
    """報告書カード(既定は「バグ報告書」)。stamped=True でステータス欄に判子が押された状態"""
    w, h = 860, 470
    card, pad = sticker(w, h, 24, PAPER, shadow=INK + (255,), off=(10, 10), ow=6)
    out = Image.new("RGBA", card.size, (0, 0, 0, 0)); out.alpha_composite(card)
    d = ImageDraw.Draw(out)
    d.rounded_rectangle([pad + 6, pad + 6, pad + w - 6, pad + 86], 18, fill=MARKER)
    d.line([(pad + 6, pad + 86), (pad + w - 6, pad + 86)], fill=INK, width=5)
    d.text((pad + 34, pad + 46), BRAND["report_title"], font=F_TITLE(48), fill=INK, anchor="lm")
    d.text((pad + w - 34, pad + 48), f"No.{rep_['no']}", font=F_TITLE(40), fill=(208, 98, 10), anchor="rm")
    lb = BRAND["report_labels"]
    rows = [(lb[0], rep_["name"]), (lb[1], rep_["place"]), (lb[2], rep_["reporter"]),
            (lb[3], "★" * rep_["severity"] + "☆" * (5 - rep_["severity"])), (lb[4], "")]
    y = pad + 128
    for k, v in rows:
        d.text((pad + 40, y), k, font=F_BOLD(30), fill=(150, 120, 90), anchor="lm")
        f = F_BOLD(36)
        while f.getlength(v) > w - 290 and f.size > 20:
            f = F_BOLD(f.size - 2)
        d.text((pad + 250, y), v, font=f, fill=INK, anchor="lm")
        d.line([(pad + 40, y + 32), (pad + w - 40, y + 32)], fill=(230, 214, 190), width=2)
        y += 68
    if stamped:
        out.alpha_composite(status_stamp(rep_["status"]), (pad + 240, y - 68 - 52))
    return out


def status_stamp(text):
    f = F_TITLE(54)
    tw = int(f.getlength(text)) + 60
    im = Image.new("RGBA", (tw * SS, 100 * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    red = (214, 52, 52, 235)
    d.rounded_rectangle([6 * SS, 6 * SS, (tw - 6) * SS, 94 * SS], 16 * SS, outline=red, width=7 * SS)
    d.text((tw // 2 * SS, 50 * SS), text, font=F(("DelaGothicOne_400Regular.ttf"), 54 * SS), fill=red, anchor="mm")
    im = im.resize((tw, 100), Image.LANCZOS)
    return im.rotate(-6, expand=True, resample=Image.BICUBIC)


def sting_frames(sc):
    """オープニング(約2.6秒): 黄色の背景 + ロゴがバグりながら登場 + 話数の札"""
    logo_p = ROOT / "assets/brand/logo.png"
    logo = Image.open(logo_p).convert("RGBA") if logo_p.exists() else None
    base = Image.new("RGBA", (W, H), MARKER + (255,))
    d = ImageDraw.Draw(base)
    for i in range(-H, W + H, 90):
        d.polygon([(i, 0), (i + 45, 0), (i + 45 - H, H), (i - H, H)], fill=(255, 238, 160, 255))
    tag = sticker(int(F_POP(46).getlength(f"{BRAND['tag']} {sc.get('episode', '')}")) + 70, 76, 38, PAPER, shadow=INK + (255,), off=(5, 5))[0]
    ImageDraw.Draw(tag).text((tag.width // 2 - 4, tag.height // 2 - 2), f"{BRAND['tag']} {sc.get('episode', '')}", font=F_POP(46), fill=INK, anchor="mm")
    keys = sorted(sc["characters"], key=lambda c: sc["characters"][c].get("side") != "left")  # 左の担当から
    return base, logo, tag, keys


def render_sting(frame, sting, age):
    base, logo, tag = sting[:3]
    keys = sting[3] if len(sting) > 3 else ["tsumugi", "zunda"]
    import random
    out = base.copy()
    if logo is not None:
        p = age / 0.35
        sc_ = 0.4 + 0.75 * ease(p) if p < 1 else (1.15 - 0.15 * ease((age - 0.35) / 0.2) if age < 0.55 else 1.0)
        L = logo.resize((int(logo.width * 1.5 * sc_), int(logo.height * 1.5 * sc_)), Image.LANCZOS)
        rnd = random.Random(int(age * 30))
        jx, jy = (rnd.randint(-14, 14), rnd.randint(-6, 6)) if 0.6 < age < 0.9 or 1.6 < age < 1.75 else (0, 0)  # バグっぽい揺れ
        out.alpha_composite(L, ((W - L.width) // 2 + jx, (H - L.height) // 2 - 60 + jy))
    for k, (key, name, x) in enumerate([(keys[0], "happy_open_open", 330), (keys[-1], "surprise_open_open", W - 330)]):
        q = ease((age - 0.25 - 0.12 * k) / 0.3)  # 下から順番に飛び出す
        if q > 0:
            sp = sprite(key, name, 0.62)
            out.alpha_composite(sp, (int(x - sp.width / 2), int(H - 360 + (1 - q) * 520)))
    if age > 0.7:
        q = ease((age - 0.7) / 0.25)
        out.alpha_composite(tag, ((W - tag.width) // 2, int(H - 230 + (1 - q) * 200)))
    a = 1.0 if age < 2.35 else max(0.0, 1 - (age - 2.35) / 0.25)
    return Image.blend(frame, out, a) if a < 1 else out


def mark_surprise():
    im = Image.new("RGBA", (150 * SS, 170 * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for a in (-50, -25, 0):
        x0, y0 = 75 * SS, 160 * SS
        d.line([(x0 + math.sin(math.radians(a)) * 70 * SS, y0 - math.cos(math.radians(a)) * 70 * SS),
                (x0 + math.sin(math.radians(a)) * 120 * SS, y0 - math.cos(math.radians(a)) * 120 * SS)], fill=INK, width=9 * SS)
    return im.resize((150, 170), Image.LANCZOS)


# ---------- 立ち絵 ----------
SPAD = 40  # 縁取りがはみ出さないための余白(px)


def _grow(alpha, r):
    return alpha.filter(ImageFilter.GaussianBlur(r * 0.6)).point(lambda v: 255 if v > 12 else 0)


@functools.lru_cache(maxsize=48)
def sprite(key, name, scale):
    """立ち絵に、白い縁取り + 焦げ茶の細い輪郭(ステッカー風)を付ける。位置は余白(SPAD)ぶんずれる"""
    im = Image.open(SPR / key / f"{name}.png")
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (im.width + SPAD * 2, im.height + SPAD * 2), (0, 0, 0, 0))
    canvas.paste(im, (SPAD, SPAD))
    a = canvas.split()[3]
    r = max(6, int(15 * scale / 0.8))
    ink = Image.new("RGBA", canvas.size, INK + (255,)); ink.putalpha(_grow(a, r + 4))
    white = Image.new("RGBA", canvas.size, (255, 255, 255, 255)); white.putalpha(_grow(a, r))
    out = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    out.alpha_composite(ink); out.alpha_composite(white); out.alpha_composite(canvas)
    return out


# カメラ: s=立ち絵の倍率(1400px基準), edge=画面端から立ち絵中心まで, top=立ち絵上端のy
CAM = {"full": dict(s=0.63, edge=300, top=190), "bust": dict(s=0.80, edge=300, top=300)}


def ease(p):
    p = max(0.0, min(1.0, p))
    return p * p * (3 - 2 * p)


def camera(tl, ts):
    held = [e for e in tl if e["start"] <= ts]
    if not held:
        return CAM[tl[0]["mode"]]
    cur = held[-1]
    prev = held[-2]["mode"] if len(held) > 1 else cur["mode"]
    if prev == cur["mode"]:
        return CAM[cur["mode"]]
    p = ease((ts - cur["start"]) / 0.75)
    a, b = CAM[prev], CAM[cur["mode"]]
    return {k: a[k] + (b[k] - a[k]) * p for k in a}


# ---------- 効果音(コードで合成。著作権の心配なし) ----------
def _env(n, decay):
    return [math.exp(-decay * i / n) for i in range(n)]


def sfx_samples(name, sr):
    def tone(freq, dur, decay=6, wave_="sin", vol=1.0):
        n = int(sr * dur)
        e = _env(n, decay)
        out = []
        for i in range(n):
            ph = 2 * math.pi * freq * i / sr
            v = math.sin(ph) if wave_ == "sin" else (1 if math.sin(ph) > 0 else -1) * 0.5
            a = min(1.0, i / (sr * 0.004))  # クリック防止
            out.append(v * e[i] * a * vol)
        return out
    def seq(notes, step, **kw):
        total = int(sr * (step * (len(notes) - 1) + kw.get("dur", 0.2)))
        buf = [0.0] * total
        for k, fr in enumerate(notes):
            t = tone(fr, kw.get("dur", 0.2), kw.get("decay", 6))
            o = int(sr * step * k)
            for i, v in enumerate(t):
                if o + i < total:
                    buf[o + i] += v
        return buf
    if name == "pon":
        return seq([784, 1047], 0.07, dur=0.18, decay=7)
    if name == "kira":
        return seq([1319, 1568, 1976, 2637], 0.065, dur=0.28, decay=5)
    if name == "chan":
        return seq([523, 659, 784], 0.0, dur=0.55, decay=4) if False else \
            [a + b + c for a, b, c in zip(tone(523, 0.55, 4), tone(659, 0.55, 4), tone(784, 0.55, 4))]
    if name == "jingle":  # オープニング: 上がる3音 + ザザッというノイズ(バグ感)
        import random
        rnd = random.Random(7)
        notes = seq([784, 988, 1175, 1568], 0.11, dur=0.35, decay=5)
        noise = [rnd.uniform(-1, 1) * math.exp(-8 * i / (sr * 0.18)) * 0.5 for i in range(int(sr * 0.18))]
        return noise + [0.0] * int(sr * 0.05) + notes
    if name == "don":  # 判子を押す音
        n = int(sr * 0.32)
        return [math.sin(2 * math.pi * (95 - 40 * i / n) * i / sr) * math.exp(-9 * i / n) * 1.6 for i in range(n)]
    if name == "bubu":
        return seq([185, 139], 0.16, dur=0.26, decay=3.5)
    raise SystemExit(f"未定義の効果音: {name}")


# ---------- VOICEVOX ----------
def vv(url, path, data=None, method="GET"):
    req = urllib.request.Request(url + path, data=data, method=method,
                                 headers={"Content-Type": "application/json"} if data else {})
    return urllib.request.urlopen(req, timeout=120).read()


def speaker_id(url, name):
    for sp in json.loads(vv(url, "/speakers")):
        if sp["name"] == name:
            st = next((s for s in sp["styles"] if s["name"] == "ノーマル"), sp["styles"][0])
            return st["id"]
    raise SystemExit(f"VOICEVOXに話者 {name} がいません")


def synth(url, text, sid, out, speed=1.0, intonation=1.0):
    q = json.loads(vv(url, f"/audio_query?text={urllib.parse.quote(text)}&speaker={sid}", b"", "POST"))
    q["speedScale"], q["intonationScale"] = speed, intonation
    Path(out).write_bytes(vv(url, f"/synthesis?speaker={sid}", json.dumps(q).encode(), "POST"))


def read_wav(p):
    with wave.open(str(p)) as w:
        n, sr = w.getnframes(), w.getframerate()
        raw = w.readframes(n)
    return sr, struct.unpack("<%dh" % n, raw)


def rms_track(samples, sr, dur):
    out = []
    for f in range(int(dur * FPS) + 1):
        a, b = int(f / FPS * sr), int((f + 1) / FPS * sr)
        seg = samples[a:b]
        out.append(math.sqrt(sum(s * s for s in seg) / max(len(seg), 1)) / 32768 if seg else 0)
    return out


def mouth_state(vol, f, phase):
    if vol is None:
        return ("closed", "half", "open", "half")[(f // 3 + phase) % 4]
    return "closed" if vol < 0.02 else ("half" if vol < 0.09 else "open")


# ---------- タイムライン ----------
def wav_name(i, ln, ch):
    spec = f"{ln['who']}|{plain(ln['text'])}|{ch.get('speed', 1.0)}|{ch.get('intonation', 1.0)}"
    return f"{i:03d}_{hashlib.md5(spec.encode()).hexdigest()[:6]}.wav"


def build_timeline(sc, tmp, url, use_voice, sids, chars):
    t, tl = 0.8, []
    panel, pstart, prev_mode, chapter = None, 0.8, None, 0
    for i, ln in enumerate(sc["lines"]):
        if ln.get("sting"):  # オープニング(声なし)
            tl.append(dict(ln, who=None, text="", i=i, start=t, dur=2.6, vols=None, mode=prev_mode or "bust", panel=panel,
                           pstart=pstart, chapter=chapter, chapter_new=False, sfx="jingle", cues=[], wav=None))
            t += 2.6 + 0.1
            continue
        ch = chars[ln["who"]]
        wav = tmp / wav_name(i, ln, ch)
        if use_voice:
            if not wav.exists():
                if not sids:
                    raise SystemExit(f"WAVが足りません: {wav.name}  (先に --voice-only で作ってください)")
                synth(url, plain(ln["text"]), sids[ln["who"]], wav, ch.get("speed", 1.0), ch.get("intonation", 1.0))
            sr, samples = read_wav(wav)
            dur, vols = len(samples) / sr, rms_track(samples, sr, len(samples) / sr)
        else:
            dur, vols = max(1.4, len(plain(ln["text"])) / CHARS_PER_SEC), None
        mode = ln.get("mode", "bust")
        settle = t + (0.75 if prev_mode and prev_mode != mode else 0)  # 全身→上半身の移動が終わってから出す
        if ln.get("panel") == "none":
            panel = None
        elif "image" in ln:
            panel, pstart = ("image", {k: ln.get(k, "") for k in ("image", "credit", "license", "fit", "focus", "url", "note", "crop", "box")}), settle
        elif "seq" in ln:  # 連番画像のアニメ(assets/refs/<seq>/000.png ...)
            panel, pstart = ("seq", {k: ln.get(k, "") for k in ("seq", "credit", "license", "fit", "crop", "box", "url", "note")} | {"image": ln["seq"]}), settle
        elif "telop" in ln:
            panel, pstart = ("telop", ln["telop"]), settle
        elif ln.get("report"):
            panel, pstart = ("report", "card"), settle
        if ln.get("stamp"):
            panel, pstart = ("report", "stamped"), settle
        prev_mode = mode
        sfx = ln.get("sfx") or ("don" if ln.get("stamp") else None)
        chapter_new = False
        if "chapter" in ln and ln["chapter"] != chapter:
            chapter, chapter_new = ln["chapter"], True
            sfx = sfx or "chan"
        # 字幕を短く区切り、文字量に比例して時間を割り当てる
        cues = split_cues(ln["text"])
        wts = [max(1, cue_weight(c)) for c in cues]
        acc, cue_t = 0, []
        for c, w in zip(cues, wts):
            cue_t.append((t + dur * acc / sum(wts), t + dur * (acc + w) / sum(wts), c))
            acc += w
        tl.append(dict(ln, i=i, start=t, dur=dur, vols=vols, mode=mode, panel=panel, pstart=pstart, chapter=chapter, chapter_new=chapter_new,
                       sfx=sfx, cues=cue_t, wav=wav if use_voice else None))
        t += dur + GAP
    return tl, t + 1.2


def credits_text(sc, tl):
    out = ["【音声】", *[f"VOICEVOX:{c['voicevox']}" for c in sc["characters"].values()], "",
           "【立ち絵】", *sc.get("tachie_credits", []), "", "【使用した画像】"]
    seen = set()
    for e in tl:
        if e["panel"] and e["panel"][0] in ("image", "seq") and e["panel"][1]["image"] not in seen:
            im = e["panel"][1]; seen.add(im["image"])
            out += [f"・{im['credit']} / {im['license']}" + (f"({im['note']})" if im.get("note") else ""),
                    f"  {im['url']}" if im.get("url") else ""]
    b = sc.get("bgm")
    if b:
        out += ["", "【BGM】", f"・{b['credit']} / {b['license']}", f"  {b.get('url', '')}"]
    out += ["", "【参考】", *[f"・{x}" for x in sc.get("sources", [])]]
    return "\n".join(x for i, x in enumerate(out) if x or (i and out[i - 1])) + "\n"


def lufs(path, t=None):
    cmd = ["ffmpeg", "-nostats", "-i", str(path)] + (["-t", str(t)] if t else []) + ["-af", "ebur128", "-f", "null", "-"]
    return float(re.findall(r"I:\s+(-?\d+\.\d) LUFS", subprocess.run(cmd, capture_output=True, text=True).stderr)[-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script"); ap.add_argument("--dry", action="store_true")
    ap.add_argument("--voice-only", action="store_true"); ap.add_argument("--use-wavs", action="store_true")
    ap.add_argument("--no-bgm", action="store_true")
    ap.add_argument("--out"); ap.add_argument("--frames", type=int)
    ap.add_argument("--still", nargs=2, metavar=("SEC", "PNG"))
    a = ap.parse_args()
    sc = json.loads(Path(a.script).read_text())
    set_brand(sc)
    name = Path(a.script).stem
    tmp = ROOT / "out" / name
    tmp.mkdir(parents=True, exist_ok=True)
    url = os.environ.get("VOICEVOX_URL", "http://127.0.0.1:50021")
    chars = {k: dict(c, key=k) for k, c in sc["characters"].items()}

    use_voice, sids = not a.dry, {}
    if a.use_wavs:
        pass
    elif use_voice:
        try:
            vv(url, "/version")
            sids = {k: speaker_id(url, c["voicevox"]) for k, c in chars.items()}
        except Exception as e:
            print(f"VOICEVOXに接続できないため --dry で続行します ({e})", file=sys.stderr)
            use_voice = False
    tl, total = build_timeline(sc, tmp, url, use_voice, sids, chars)
    if a.voice_only:
        if not use_voice:
            raise SystemExit("VOICEVOXに接続できませんでした。VOICEVOXを起動してから実行してください")
        print(f"-> {tmp} に {len(tl)} 個のWAVを作りました。このフォルダのWAVをzipにして渡してください")
        return

    # 音声トラック(声 + 効果音)
    audio = tmp / "audio.wav"
    sr0 = read_wav(next(e["wav"] for e in tl if e["wav"]))[0] if use_voice else 24000
    buf = [0.0] * int(total * sr0)
    if use_voice:
        for e in tl:
            if not e["wav"]:
                continue
            s = read_wav(e["wav"])[1]
            o = int(e["start"] * sr0)
            for k, v in enumerate(s):
                buf[o + k] = v / 32768
    for e in tl:
        if e["sfx"]:
            o = max(0, int((e["start"] - 0.04) * sr0))
            for k, v in enumerate(sfx_samples(e["sfx"], sr0)):
                if o + k < len(buf):
                    buf[o + k] += v * 0.2
    with wave.open(str(audio), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr0)
        w.writeframes(struct.pack("<%dh" % len(buf), *[max(-32767, min(32767, int(v * 32767))) for v in buf]))

    # 素材
    ep = sc.get("episode", "")
    bg_base, bg_dots, bg_over = background(sc["series"], sc["title"], ep)
    pops = {e["i"]: pop_img(e["pop"], PALETTE[e["who"]]["text"]) for e in tl if e.get("pop")}
    burst = burst_img()
    subs, telops, photos = {}, {}, {}
    for e in tl:
        for k, (_, _, c) in enumerate(e["cues"]):
            subs[e["i"], k] = subtitle_img(chars[e["who"]], c, chars[e["who"]]["side"])
        if e["panel"] and e["panel"][0] == "telop":
            telops.setdefault(e["panel"][1], telop_img(e["panel"][1]))
        if e["panel"] and e["panel"][0] == "image":
            photos.setdefault(e["panel"][1]["image"], photo_card(e["panel"][1]))
        if e["panel"] and e["panel"][0] == "seq" and e["panel"][1]["seq"] not in photos:
            frames = sorted((REFS / e["panel"][1]["seq"]).glob("*.png"))
            photos[e["panel"][1]["seq"]] = [photo_card(e["panel"][1], Image.open(fp)) for fp in frames]
    tcard = title_card(sc["series"], sc["title"], ep)
    reports = {k: report_card(sc["report"], k == "stamped") for k in ("card", "stamped")} if sc.get("report") else {}
    sting = sting_frames(sc)
    surprise = mark_surprise()
    strips = chapter_strips(sc["chapters"]) if sc.get("chapters") else None
    bands = [chapter_band(i + 1, c) for i, c in enumerate(sc["chapters"])] if sc.get("chapters") else []
    (tmp.parent / f"{name}_credits.txt").write_text(credits_text(sc, tl), encoding="utf-8")

    def render_frame(f):
        ts = f / FPS
        act = next((e for e in tl if e["start"] <= ts < e["start"] + e["dur"]), None)
        sting_age = ts - act["start"] if act and act.get("sting") else None
        if sting_age is not None:
            act = None
        held = [e for e in tl if e["start"] <= ts and not e.get("sting")]
        cam = camera(tl, ts)
        cur_mode = held[-1]["mode"] if held else tl[0]["mode"]
        frame = bg_base.copy()
        frame.alpha_composite(bg_dots, (-int((ts * 16) % 78) - 0, -int((ts * 9) % 78)))  # 水玉が斜めにゆっくり流れる
        frame.alpha_composite(bg_over)
        if strips:
            ch_i = held[-1]["chapter"] if held else 0
            s_ = strips[ch_i]
            frame.alpha_composite(s_, ((W - s_.width) // 2, 112))
        panel = held[-1]["panel"] if held else None
        center = None
        settled_full = cur_mode == "full" and abs(cam["s"] - CAM["full"]["s"]) < 0.01
        settled_bust = cur_mode == "bust" and abs(cam["s"] - CAM["bust"]["s"]) < 0.01
        if settled_full:
            center = tcard
        elif settled_bust and panel and panel[0] == "telop":
            center = telops[panel[1]]
        elif settled_bust and panel and panel[0] == "image":
            center = photos[panel[1]["image"]]
        elif settled_bust and panel and panel[0] == "seq":
            seqc = photos[panel[1]["seq"]]
            center = seqc[min(len(seqc) - 1, max(0, int((ts - held[-1]["pstart"] - 0.4) * 30)))]
        elif settled_bust and panel and panel[0] == "report":
            center = reports[panel[1]]
        if center is not None:
            age = ts - (tl[0]["start"] if center is tcard else held[-1]["pstart"])
            pop = 1.0 if (panel and panel[0] == "report" and panel[1] == "stamped") else ease(age / 0.35)
            cy = max(186, 200 + (520 - center.height) // 2) + int((1 - pop) * 40)
            c = center
            if pop < 1:
                c = center.copy(); c.putalpha(c.split()[3].point(lambda v: int(v * pop)))
            frame.alpha_composite(c, ((W - center.width) // 2, cy))
        for k, c in chars.items():
            talking = act is not None and act["who"] == k
            mine = [e for e in held if e["who"] == k]
            emote = mine[-1].get("emote", "normal") if mine else "normal"
            if talking:
                vol = act["vols"][min(int((ts - act["start"]) * FPS), len(act["vols"]) - 1)] if act["vols"] else None
                m = mouth_state(vol, f, act["i"])
            else:
                m = "closed"
            blink = "blink" if ((f + (0 if c["side"] == "left" else 37)) % 105) < 4 else "open"
            age = ts - act["start"] if talking else 99
            punch = 0.07 * max(0.0, 1 - age / 0.45) if talking and act.get("punch") else 0.0
            sp = sprite(k, f"{emote}_{m}_{blink}", round(cam["s"] * (1 + punch), 2) if punch else round(cam["s"], 3))
            sway = 5 * math.sin(ts * 1.9 + (0 if c["side"] == "left" else 2))
            bounce = 10 * abs(math.sin(age * 9)) if talking else 0
            cx = cam["edge"] if c["side"] == "left" else W - cam["edge"]
            px, py = int(cx - sp.width / 2), int(cam["top"] - bounce + sway) - SPAD
            if talking and (act.get("pop") or act.get("punch")) and age < 0.55:  # 集中線(話者の背後)
                b = burst.copy(); b.putalpha(b.split()[3].point(lambda v, a_=1 - age / 0.55: int(v * a_)))
                hy = int(cam["top"] + 0.17 * 1400 * cam["s"])
                frame.alpha_composite(b, (int(cx - b.width / 2), int(hy - b.height / 2)))
            frame.alpha_composite(sp, (px, py))
            if talking and emote == "surprise" and age < 0.9 and not act.get("pop"):
                mx = int(cx + (95 if c["side"] == "left" else -95 - 150) * cam["s"] / 0.92) + (40 if c["side"] == "left" else 0)
                frame.alpha_composite(surprise, (mx, int(cam["top"] + 40 * cam["s"] / 0.92)))
            if talking and act.get("pop") and age < 1.3:  # 大きな文字スタンプ(ポンと出て、少し弾んで、消える)
                pm = pops[act["i"]]
                sc_ = 0.3 + 0.95 * ease(age / 0.16) if age < 0.16 else (1.25 - 0.25 * ease((age - 0.16) / 0.14) if age < 0.30 else 1.0)
                al = 1.0 if age < 1.0 else max(0.0, 1 - (age - 1.0) / 0.3)
                q = pm.resize((max(1, int(pm.width * sc_)), max(1, int(pm.height * sc_))), Image.LANCZOS)
                if al < 1: q.putalpha(q.split()[3].point(lambda v, a_=al: int(v * a_)))
                tx_ = cx + (370 if c["side"] == "left" else -400)
                frame.alpha_composite(q, (int(tx_ - q.width / 2), int(cam["top"] + 10 - q.height / 2)))
        cn = next((e for e in reversed(held) if e["chapter_new"]), None) if bands else None
        if cn is not None and ts - cn["start"] < 1.6:
            q = ts - cn["start"]
            x = -int(W * (1 - ease(q / 0.28))) if q < 0.28 else (int(W * ease((q - 1.3) / 0.3)) if q > 1.3 else 0)
            frame.paste(bands[cn["chapter"]], (x, 360), bands[cn["chapter"]])
            if q < 0.22:  # 一瞬の白フラッシュ
                frame = Image.blend(frame, Image.new("RGBA", frame.size, (255, 255, 255, 255)), 0.45 * (1 - q / 0.22))
        if act:
            k = next((j for j, (t0, t1, _) in enumerate(act["cues"]) if t0 <= ts < t1), len(act["cues"]) - 1)
            s = subs[act["i"], k]
            pop = ease((ts - act["cues"][k][0]) / 0.12)  # 字幕が切り替わるたびに軽くポップ
            dy = int((1 - pop) * 14)
            frame.alpha_composite(s, ((W - s.width) // 2, H - s.height - 10 + dy))
        if sting_age is not None:
            frame = render_sting(frame, sting, sting_age)
        return frame.convert("RGB")

    # 概要欄・サムネ作成用の情報(チャプターの実際の時刻など)
    meta = dict(total=total, lines=[(e["i"], e["start"], e["dur"]) for e in tl], chapters=[(0.0 if not k else e["start"], e["chapter"]) for k, e in enumerate([x for x in tl if x["chapter_new"] or x is tl[0]])])
    (tmp.parent / f"{name}_meta.json").write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")

    if a.still:
        render_frame(int(float(a.still[0]) * FPS)).save(a.still[1])
        print("->", a.still[1]); return

    nframes = int(total * FPS)
    if a.frames:
        nframes = min(nframes, a.frames)
    out = Path(a.out) if a.out else ROOT / "out" / f"{name}.mp4"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", str(audio)]
    bgm = sc.get("bgm")
    bgm_path = ROOT / bgm["file"] if bgm else None
    if bgm and not a.no_bgm and bgm_path.exists():
        # BGMは声より約11LU小さく揃え、声が出ている間は約3dB下げる。発話中は声がBGMより約20dB大きい(実測)。最後に -16 LUFS へ
        gain = lufs(audio) - 11 - lufs(bgm_path, min(total, 120))
        cmd += ["-stream_loop", "-1", "-i", str(bgm_path), "-filter_complex",
                f"[2:a]atrim=0:{total:.2f},asetpts=N/SR/TB,volume={gain:.1f}dB,afade=t=in:d=2,afade=t=out:st={total - 3:.2f}:d=3[bg];"
                "[1:a]asplit=2[v1][v2];[bg][v1]sidechaincompress=threshold=0.06:ratio=2:attack=20:release=700[duck];"
                "[v2][duck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]",
                "-map", "0:v", "-map", "[a]"]
        print(f"BGM: {bgm['credit']}  ({gain:+.1f} dB, 声より約20dB下(発話中) + ダッキング)")
    elif bgm and not a.no_bgm:
        print(f"注意: BGMファイルがありません: {bgm_path}  (tools/fetch_bgm.py で取得できます)", file=sys.stderr)
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(nframes):
        ff.stdin.write(render_frame(f).tobytes())
    ff.stdin.close(); ff.wait()
    print(f"-> {out}  ({total:.1f}s, voice={'VOICEVOX' if use_voice else 'なし(--dry)'})")


if __name__ == "__main__":
    main()
