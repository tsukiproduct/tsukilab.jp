#!/usr/bin/env python3
"""台本JSON -> 音声(VOICEVOX) -> 口パク付き動画(mp4)。
  python3 scripts/build.py scripts/sample_sailing_stones.json            # VOICEVOXがあれば音声合成
  python3 scripts/build.py scripts/sample_sailing_stones.json --dry      # 音声なし(文字数から時間を推定)
  python3 scripts/build.py scripts/sample_sailing_stones.json --dry --still 30 out/still.png   # 30秒時点の静止画
  python3 scripts/build.py scripts/sample_sailing_stones.json --voice-only   # 声(WAV)だけ作る。立ち絵・フォントは不要
  python3 scripts/build.py scripts/sample_sailing_stones.json --use-wavs     # 作成済みWAV(out/<台本名>/NNN.wav)で動画を作る
環境変数 VOICEVOX_URL (既定 http://127.0.0.1:50021)

台本の各行(lines)で使える項目:
  who, text, emote(normal/happy/surprise/think)
  mode   : "full"=全身(冒頭用) / "bust"=上半身アップ(本編・既定)
  telop  : 中央に出す数字や要点カード("\n"で改行)
  image  : 参照画像(assets/refs/ からの相対パス) + credit(出典表記) + license
  panel  : "none" で中央のカードを消す(image/telopは次の指定まで表示され続ける)
"""
import argparse, functools, json, math, os, subprocess, sys, wave, struct, urllib.request, urllib.parse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SPR, REFS, FONTS = ROOT / "assets/sprites", ROOT / "assets/refs", ROOT / "assets/fonts"
W, H, FPS = 1920, 1080, 30
GAP, CHARS_PER_SEC = 0.35, 6.5

# ---------- デザイン定義 ----------
INK = (74, 52, 46)            # 黒ではなく焦げ茶のインク
CREAM = (255, 246, 228)
PAPER = (255, 253, 247)
DOT = (255, 232, 196)
MINT, PEACH, LEMON, SKY = (190, 232, 207), (255, 206, 190), (255, 233, 150), (198, 226, 246)
TAPE = [(255, 190, 200, 205), (190, 225, 255, 205), (255, 236, 150, 205)]
# キャラごとの色: text=字幕の文字色 / main=名札と縁 / soft=吹き出しの薄い地色
PALETTE = {
    "zunda":   dict(text=(46, 140, 58),  main=(118, 200, 82),  soft=(240, 252, 232)),
    "tsumugi": dict(text=(214, 104, 16), main=(255, 178, 56),  soft=(255, 245, 224)),
}
F = lambda name, size: ImageFont.truetype(str(FONTS / name), size)
F_BODY = lambda s: F("ZenMaruGothic_900Black.ttf", s)
F_BOLD = lambda s: F("ZenMaruGothic_700Bold.ttf", s)
F_TITLE = lambda s: F("DelaGothicOne_400Regular.ttf", s)
F_POP = lambda s: F("HachiMaruPop_400Regular.ttf", s)

SS = 2  # 図形はこの倍率で描いて縮小(ジャギー防止)


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
    im = Image.new("RGBA", (W * SS, H * SS), CREAM + (255,))
    d = ImageDraw.Draw(im, "RGBA")
    # 水玉
    for gy, y in enumerate(range(40, H, 78)):
        for x in range(40 + (gy % 2) * 39, W, 78):
            d.ellipse([(x - 5) * SS, (y - 5) * SS, (x + 5) * SS, (y + 5) * SS], fill=DOT + (255,))
    # 手でちぎった紙のような大きなブロブ
    for (cx, cy, rx, ry, col) in [(120, 1010, 430, 300, MINT), (1830, 1000, 470, 320, PEACH),
                                  (1750, 190, 250, 150, LEMON), (130, 230, 230, 140, SKY)]:
        d.ellipse([(cx - rx) * SS, (cy - ry) * SS, (cx + rx) * SS, (cy + ry) * SS], fill=col + (255,))
    dashed_frame(d, 20 * SS, (216, 176, 130, 255))
    im = im.resize((W, H), Image.LANCZOS)
    # タイトルのリボン
    tf = F_TITLE(54)
    tw = int(tf.getlength(title)) + 150
    card, pad = sticker(tw, 96, 48, PAPER, shadow=PEACH + (255,))
    im.alpha_composite(card, ((W - tw) // 2 - pad, 26 - pad))
    d2 = ImageDraw.Draw(im)
    d2.text((W // 2, 74), title, font=tf, fill=INK, anchor="mm")
    # 左: シリーズのロゴ札
    sf = F_POP(34)
    sw = int(sf.getlength(series)) + 100
    tag, pad = sticker(sw, 70, 35, LEMON, shadow=INK + (255,), off=(5, 5), ow=4)
    im.alpha_composite(tag, (48 - pad + 8, 28 - pad + 8))
    d3 = ImageDraw.Draw(im)
    d3.text((56 + sw // 2, 63), series, font=sf, fill=INK, anchor="mm")
    # 右: エピソード札(丸)
    badge, bp = sticker(112, 112, 56, PEACH, shadow=INK + (255,), off=(5, 5), ow=4)
    im.alpha_composite(badge, (W - 168 - bp, 22 - bp + 8))
    d4 = ImageDraw.Draw(im)
    d4.text((W - 112, 86), episode, font=F_POP(24 if len(episode) > 3 else 30), fill=INK, anchor="mm")
    return im


def wrap(text, f, maxw):
    lines, cur = [], ""
    for ch in text:
        if f.getlength(cur + ch) > maxw and cur and ch not in "ーぁぃぅぇぉっゃゅょ、。！？」』）":  # 行頭禁則
            lines.append(cur); cur = ch
        else:
            cur += ch
    return lines + ([cur] if cur else [])


def subtitle_img(char, text, side):
    """キャラ色の文字 + キャラ色の名札つき吹き出し"""
    pal = PALETTE[char["key"]]
    f, nf = F_BOLD(44), F_POP(32)
    bw = 1320
    lines = wrap(text, f, bw - 120)
    h = 58 + 60 * len(lines) + 16
    card, pad = sticker(bw, h, 40, PAPER, shadow=pal["main"] + (255,), off=(9, 9), ow=5)
    # しっぽ(話している側のキャラへ向ける)
    tail = Image.new("RGBA", (120 * SS, 70 * SS), (0, 0, 0, 0))
    td = ImageDraw.Draw(tail)
    pts = [(10, 70), (60, 8), (112, 70)] if side == "left" else [(10, 70), (60, 8), (112, 70)]
    td.polygon([(x * SS, y * SS) for x, y in pts], fill=PAPER + (255,), outline=INK + (255,), width=5 * SS)
    td.line([(14 * SS, 70 * SS), (108 * SS, 70 * SS)], fill=PAPER + (255,), width=8 * SS)
    tail = tail.resize((120, 70), Image.LANCZOS)
    cw = bw + pad * 2
    out = Image.new("RGBA", (cw, card.height + 90), (0, 0, 0, 0))
    ty = 40
    out.alpha_composite(card, (0, ty + 30))
    tx = pad + 40 + int(nf.getlength(char["name"])) + 70 + 40 if side == "left" else cw - pad - 40 - int(nf.getlength(char["name"])) - 70 - 40 - 120
    out.alpha_composite(tail, (tx, ty + 46 - 60))
    # 名札
    name = char["name"]
    nw = int(nf.getlength(name)) + 70
    ntag, npad = sticker(nw, 58, 29, pal["main"], shadow=INK + (255,), off=(4, 4), ow=4)
    nx = pad + 40 if side == "left" else cw - pad - 40 - nw
    out.alpha_composite(ntag, (nx - npad, ty - 4 - npad + 16))
    d = ImageDraw.Draw(out)
    d.text((nx + nw // 2, ty + 16 + 29 - 2), name, font=nf, fill="white", anchor="mm",
           stroke_width=3, stroke_fill=INK)
    # 本文(キャラ色)
    for i, ln in enumerate(lines):
        d.text((pad + 52, ty + 30 + pad + 42 + 60 * i + 30), ln, font=f, fill=pal["text"], anchor="lm",
               stroke_width=1, stroke_fill=tuple(int(c * 0.78) for c in pal["text"]))
    return out


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
        d.rounded_rectangle([(w - tw) / 2 - 14, y + size * 0.05, (w + tw) / 2 + 14, y + size * 0.50],
                            size * 0.2, fill=color_hl)
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
    d = ImageDraw.Draw(out)
    star(d, pad + 6, pad + 6, 30, PEACH + (255,), INK + (255,), 4, rot=-10)
    return out


def title_card(series, title, episode):
    lines = [title]
    body = marker_text(lines, 92, PEACH + (255,))
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


def photo_card(entry):
    """ポラロイド風の写真枠。画像が無い間は「画像待ち」の枠を出す"""
    box_w, box_h = 640, 384
    path = REFS / entry["image"]
    if path.exists():
        ph = Image.open(path).convert("RGB")
        ph = ImageOps.fit(ph, (box_w, box_h), Image.LANCZOS)
    else:
        ph = Image.new("RGB", (box_w, box_h), (244, 236, 220))
        d = ImageDraw.Draw(ph)
        d.rectangle([14, 14, box_w - 15, box_h - 15], outline=(190, 170, 140), width=4)
        d.text((box_w // 2, box_h // 2 - 24), "ここに参照画像", font=F_BODY(44), fill=(170, 146, 112), anchor="mm")
        d.text((box_w // 2, box_h // 2 + 36), entry["image"], font=F_BOLD(28), fill=(170, 146, 112), anchor="mm")
    cap = entry.get("credit", "")
    lic = entry.get("license", "")
    cw, chh = box_w + 56, box_h + 56 + 76
    card, pad = sticker(cw, chh, 14, PAPER, shadow=INK + (70,), off=(10, 12), ow=4)
    out = Image.new("RGBA", (card.width + 40, card.height + 40), (0, 0, 0, 0))
    out.alpha_composite(card, (20, 20))
    out.paste(ph, (20 + pad + 28, 20 + pad + 28))
    d = ImageDraw.Draw(out)
    cf = F_BOLD(24)
    txt = f"出典: {cap}" + (f"  /  {lic}" if lic else "")
    while cf.getlength(txt) > cw - 60 and cf.size > 16:
        cf = F_BOLD(cf.size - 2)
    d.text((20 + pad + cw // 2, 20 + pad + 28 + box_h + 38), txt, font=cf, fill=INK, anchor="mm")
    for (tx, ty, col, rot) in [(70, 8, TAPE[0], -18), (out.width - 190, 4, TAPE[1], 14)]:
        tp = Image.new("RGBA", (130, 46), col)
        tp = tp.rotate(rot, expand=True, resample=Image.BICUBIC)
        out.alpha_composite(tp, (tx, ty))
    return out.rotate(-2.2, expand=True, resample=Image.BICUBIC)


def mark_surprise():
    im = Image.new("RGBA", (150 * SS, 170 * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, a in enumerate((-50, -25, 0)):
        x0, y0 = 75 * SS, 160 * SS
        ex = x0 + math.sin(math.radians(a)) * 120 * SS
        ey = y0 - math.cos(math.radians(a)) * 120 * SS
        sx = x0 + math.sin(math.radians(a)) * 70 * SS
        sy = y0 - math.cos(math.radians(a)) * 70 * SS
        d.line([(sx, sy), (ex, ey)], fill=INK, width=9 * SS)
    return im.resize((150, 170), Image.LANCZOS)


# ---------- 立ち絵 ----------
@functools.lru_cache(maxsize=48)
def sprite(key, name, scale):
    im = Image.open(SPR / key / f"{name}.png")
    return im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)


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


# ---------- VOICEVOX ----------
def vv(url, path, data=None, method="GET"):
    req = urllib.request.Request(url + path, data=data, method=method,
                                 headers={"Content-Type": "application/json"} if data else {})
    return urllib.request.urlopen(req, timeout=60).read()


def speaker_id(url, name):
    for sp in json.loads(vv(url, "/speakers")):
        if sp["name"] == name:
            st = next((s for s in sp["styles"] if s["name"] == "ノーマル"), sp["styles"][0])
            return st["id"]
    raise SystemExit(f"VOICEVOXに話者 {name} がいません")


def synth(url, text, sid, out):
    q = vv(url, f"/audio_query?text={urllib.parse.quote(text)}&speaker={sid}", b"", "POST")
    Path(out).write_bytes(vv(url, f"/synthesis?speaker={sid}", q, "POST"))


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


# ---------- 本体 ----------
def build_timeline(sc, tmp, url, use_voice, sids):
    t, tl = 0.8, []
    panel, pstart, prev_mode = None, 0.8, None
    for i, ln in enumerate(sc["lines"]):
        wav = tmp / f"{i:03d}.wav"
        if use_voice:
            if not wav.exists():
                synth(url, ln["text"], sids[ln["who"]], wav)
            sr, samples = read_wav(wav)
            dur, vols = len(samples) / sr, rms_track(samples, sr, len(samples) / sr)
        else:
            dur, vols = max(1.6, len(ln["text"]) / CHARS_PER_SEC), None
        mode = ln.get("mode", "bust")
        settle = t + (0.75 if prev_mode and prev_mode != mode else 0)  # 全身→上半身の移動が終わってから出す
        if ln.get("panel") == "none":
            panel = None
        elif "image" in ln:
            panel, pstart = ("image", {k: ln.get(k, "") for k in ("image", "credit", "license")}), settle
        elif "telop" in ln:
            panel, pstart = ("telop", ln["telop"]), settle
        prev_mode = mode
        tl.append(dict(ln, i=i, start=t, dur=dur, vols=vols, mode=mode, panel=panel, pstart=pstart,
                       wav=wav if use_voice else None))
        t += dur + GAP
    return tl, t + 1.2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script"); ap.add_argument("--dry", action="store_true")
    ap.add_argument("--voice-only", action="store_true"); ap.add_argument("--use-wavs", action="store_true")
    ap.add_argument("--out"); ap.add_argument("--frames", type=int)
    ap.add_argument("--still", nargs=2, metavar=("SEC", "PNG"))
    a = ap.parse_args()
    sc = json.loads(Path(a.script).read_text())
    name = Path(a.script).stem
    tmp = ROOT / "out" / name
    tmp.mkdir(parents=True, exist_ok=True)
    url = os.environ.get("VOICEVOX_URL", "http://127.0.0.1:50021")
    chars = {k: dict(c, key=k) for k, c in sc["characters"].items()}

    use_voice = not a.dry
    sids = {}
    if a.use_wavs:
        missing = [i for i in range(len(sc["lines"])) if not (tmp / f"{i:03d}.wav").exists()]
        if missing:
            raise SystemExit(f"WAVが足りません: {tmp} に {[f'{i:03d}.wav' for i in missing]}")
    elif use_voice:
        try:
            vv(url, "/version")
            sids = {k: speaker_id(url, c["voicevox"]) for k, c in chars.items()}
        except Exception as e:
            print(f"VOICEVOXに接続できないため --dry で続行します ({e})", file=sys.stderr)
            use_voice = False
    tl, total = build_timeline(sc, tmp, url, use_voice, sids)
    if a.voice_only:
        if not use_voice:
            raise SystemExit("VOICEVOXに接続できませんでした。VOICEVOXを起動してから実行してください")
        print(f"-> {tmp} に {len(tl)} 個のWAVを作りました。このフォルダのWAVをzipにして渡してください")
        return

    # 音声トラック
    audio = tmp / "audio.wav"
    sr0 = read_wav(tl[0]["wav"])[0] if use_voice else 24000
    buf = [0] * int(total * sr0)
    if use_voice:
        for e in tl:
            s = read_wav(e["wav"])[1]
            o = int(e["start"] * sr0)
            buf[o:o + len(s)] = s
    with wave.open(str(audio), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr0)
        w.writeframes(struct.pack("<%dh" % len(buf), *buf))

    # 素材
    ep = sc.get("episode", "")
    bg = background(sc["series"], sc["title"], ep)
    d0 = ImageDraw.Draw(bg)
    d0.text((W // 2, H - 22), sc["credits"], font=F_BOLD(22), fill=INK + (200,), anchor="mm")
    subs = {e["i"]: subtitle_img(chars[e["who"]], e["text"], chars[e["who"]]["side"]) for e in tl}
    telops, photos = {}, {}
    for e in tl:
        if e["panel"] and e["panel"][0] == "telop":
            telops.setdefault(e["panel"][1], telop_img(e["panel"][1]))
        if e["panel"] and e["panel"][0] == "image":
            photos.setdefault(e["panel"][1]["image"], photo_card(e["panel"][1]))
    tcard = title_card(sc["series"], sc["title"], ep)
    surprise = mark_surprise()

    def render_frame(f):
        ts = f / FPS
        act = next((e for e in tl if e["start"] <= ts < e["start"] + e["dur"]), None)
        held = [e for e in tl if e["start"] <= ts]
        cam = camera(tl, ts)
        cur_mode = held[-1]["mode"] if held else tl[0]["mode"]
        frame = bg.copy()
        # 中央のカード(スライドインで登場)
        panel = held[-1]["panel"] if held else None
        center = None
        if cur_mode == "full" and (not held or held[-1]["mode"] == "full") and abs(cam["s"] - CAM["full"]["s"]) < 0.01:
            center = tcard
        elif panel and panel[0] == "telop":
            center = telops[panel[1]]
        elif panel and panel[0] == "image":
            center = photos[panel[1]["image"]]
        if center is not None and not (cur_mode == "bust" and abs(cam["s"] - CAM["bust"]["s"]) > 0.01):
            age = ts - (tl[0]["start"] if center is tcard else held[-1]["pstart"])
            pop = ease(age / 0.35)
            cy = 138 + (540 - center.height) // 2 + int((1 - pop) * 40)
            if cur_mode == "full":
                cy = 190 + (560 - center.height) // 2
            c = center
            if pop < 1:
                c = center.copy(); c.putalpha(c.split()[3].point(lambda v: int(v * pop)))
            frame.alpha_composite(c, ((W - center.width) // 2, cy))
        # キャラ
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
            sp = sprite(k, f"{emote}_{m}_{blink}", round(cam["s"], 3))
            sway = 5 * math.sin(ts * 1.9 + (0 if c["side"] == "left" else 2))
            bounce = 10 * abs(math.sin((ts - act["start"]) * 9)) if talking else 0
            cx = cam["edge"] if c["side"] == "left" else W - cam["edge"]
            frame.alpha_composite(sp, (int(cx - sp.width / 2), int(cam["top"] - bounce + sway)))
            if talking and emote == "surprise" and ts - act["start"] < 0.9:
                mx = int(cx + (95 if c["side"] == "left" else -95 - 150) * cam["s"] / 0.92) + (40 if c["side"] == "left" else 0)
                frame.alpha_composite(surprise, (mx, int(cam["top"] + 40 * cam["s"] / 0.92)))
        # 字幕
        if act:
            s = subs[act["i"]]
            frame.alpha_composite(s, ((W - s.width) // 2, H - s.height - 10))
        return frame.convert("RGB")

    if a.still:
        render_frame(int(float(a.still[0]) * FPS)).save(a.still[1])
        print("->", a.still[1]); return

    nframes = int(total * FPS)
    if a.frames:
        nframes = min(nframes, a.frames)
    out = Path(a.out) if a.out else ROOT / "out" / f"{name}.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", str(audio),
                           "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)], stdin=subprocess.PIPE)
    for f in range(nframes):
        ff.stdin.write(render_frame(f).tobytes())
    ff.stdin.close(); ff.wait()
    print(f"-> {out}  ({total:.1f}s, voice={'VOICEVOX' if use_voice else 'なし(--dry)'})")


if __name__ == "__main__":
    main()
