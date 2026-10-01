#!/usr/bin/env python3
"""台本JSON -> 音声(VOICEVOX) -> 口パク付き動画(mp4)。
  python3 scripts/build.py scripts/sample_sailing_stones.json            # VOICEVOXがあれば音声合成
  python3 scripts/build.py scripts/sample_sailing_stones.json --dry      # 音声なし(文字数から時間を推定)
環境変数 VOICEVOX_URL (既定 http://127.0.0.1:50021)
"""
import argparse, json, math, os, subprocess, sys, wave, struct, urllib.request, urllib.parse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SPR = ROOT / "assets/sprites"
W, H, FPS = 1920, 1080, 30
FONT = next(p for p in ["/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
                        "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf",
                        "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf"] if os.path.exists(p))
font = lambda s: ImageFont.truetype(FONT, s)
GAP, TAIL_CHARS_PER_SEC = 0.35, 6.5

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
    wav = vv(url, f"/synthesis?speaker={sid}", q, "POST")
    Path(out).write_bytes(wav)

def read_wav(p):
    with wave.open(str(p)) as w:
        n, sr = w.getnframes(), w.getframerate()
        raw = w.readframes(n)
    return sr, struct.unpack("<%dh" % n, raw)

def rms_track(samples, sr, start, dur):
    """FPS刻みの音量(0..1)"""
    out = []
    for f in range(int(dur * FPS) + 1):
        a, b = int(f / FPS * sr), int((f + 1) / FPS * sr)
        seg = samples[a:b]
        out.append(math.sqrt(sum(s * s for s in seg) / max(len(seg), 1)) / 32768 if seg else 0)
    return out

# ---------- 画面 ----------
def background():
    bg = Image.new("RGB", (W, H))
    px = bg.load()
    for y in range(H):
        t = y / H
        c = (int(24 + 20 * t), int(34 + 30 * t), int(64 + 40 * t))
        for x in range(0, W, 1):
            px[x, y] = c
    d = ImageDraw.Draw(bg, "RGBA")
    for i in range(0, W, 120):  # 地図の経線っぽい飾り
        d.line([(i, 0), (i - 300, H)], fill=(255, 255, 255, 10), width=2)
    for r in (260, 420, 600):
        d.ellipse([W // 2 - r, 470 - r, W // 2 + r, 470 + r], outline=(255, 255, 255, 14), width=2)
    return bg

def title_bar(bg, series, title):
    d = ImageDraw.Draw(bg, "RGBA")
    d.rectangle([0, 0, W, 112], fill=(10, 16, 36, 215))
    d.rectangle([0, 112, W, 118], fill=(255, 196, 64, 255))
    d.text((48, 56), f"{series}", font=font(34), fill=(255, 196, 64), anchor="lm")
    d.text((W // 2, 56), title, font=font(60), fill="white", anchor="mm")
    return bg

def wrap(text, f, maxw):
    lines, cur = [], ""
    for ch in text:
        if f.getlength(cur + ch) > maxw and cur:
            lines.append(cur); cur = ch
        else:
            cur += ch
    return lines + ([cur] if cur else [])

def subtitle_img(name, color, text):
    f, nf = font(46), font(34)
    lines = wrap(text, f, 1380)
    h = 40 + 62 * len(lines) + 20
    im = Image.new("RGBA", (1540, h + 44), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 44, 1540, h + 44], 28, fill=(8, 12, 28, 225), outline=color + (255,), width=5)
    d.rounded_rectangle([34, 0, 34 + nf.getlength(name) + 52, 62], 28, fill=color + (255,))
    d.text((60, 31), name, font=nf, fill="white", anchor="lm")
    for i, ln in enumerate(lines):
        d.text((50, 44 + 38 + 62 * i + 31), ln, font=f, fill="white", anchor="lm",
               stroke_width=2, stroke_fill=(0, 0, 0))
    return im

def telop_img(text):
    f = font(76)
    lines = text.split("\n")
    w = int(max(f.getlength(l) for l in lines)) + 120
    h = 100 * len(lines) + 50
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w, h], 30, fill=(255, 250, 235, 245), outline=(255, 160, 40, 255), width=8)
    for i, l in enumerate(lines):
        d.text((w // 2, 25 + 50 + 100 * i), l, font=f, fill=(30, 36, 70), anchor="mm")
    return im

def load_sprite(key, name, scale):
    im = Image.open(SPR / key / f"{name}.png")
    return im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)

# ---------- 口パク ----------
def mouth_state(vol, f, text_phase):
    """音量(音声あり) または 疑似パターン(音声なし)から口の形を返す"""
    if vol is None:
        return ("closed", "half", "open", "half")[(f // 3 + text_phase) % 4]
    return "closed" if vol < 0.02 else ("half" if vol < 0.09 else "open")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script"); ap.add_argument("--dry", action="store_true")
    ap.add_argument("--out"); ap.add_argument("--frames", type=int, help="先頭Nフレームだけ(確認用)")
    a = ap.parse_args()
    sc = json.loads(Path(a.script).read_text())
    name = Path(a.script).stem
    tmp = ROOT / "out" / name
    tmp.mkdir(parents=True, exist_ok=True)
    url = os.environ.get("VOICEVOX_URL", "http://127.0.0.1:50021")
    chars = sc["characters"]

    use_voice = not a.dry
    if use_voice:
        try:
            vv(url, "/version")
        except Exception:
            print("VOICEVOXに接続できないため --dry で続行します", file=sys.stderr)
            use_voice = False
    if use_voice:
        sids = {k: speaker_id(url, c["voicevox"]) for k, c in chars.items()}

    # --- タイムライン ---
    t, tl = 0.8, []
    for i, ln in enumerate(sc["lines"]):
        wav = tmp / f"{i:03d}.wav"
        if use_voice:
            if not wav.exists():
                synth(url, ln["text"], sids[ln["who"]], wav)
            sr, samples = read_wav(wav)
            dur = len(samples) / sr
            vols = rms_track(samples, sr, 0, dur)
        else:
            dur = max(1.6, len(ln["text"]) / TAIL_CHARS_PER_SEC)
            vols = None
        tl.append(dict(ln, i=i, start=t, dur=dur, vols=vols, wav=wav if use_voice else None))
        t += dur + GAP
    total = t + 1.2

    # --- 音声トラック ---
    audio = tmp / "audio.wav"
    sr0 = 24000
    if use_voice:
        sr0 = read_wav(tl[0]["wav"])[0]
    buf = [0] * int(total * sr0)
    if use_voice:
        for e in tl:
            _, s = read_wav(e["wav"])
            o = int(e["start"] * sr0)
            buf[o:o + len(s)] = s
    with wave.open(str(audio), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr0)
        w.writeframes(struct.pack("<%dh" % len(buf), *buf))

    # --- 画像素材 ---
    bg = title_bar(background(), sc["series"], sc["title"])
    d = ImageDraw.Draw(bg, "RGBA")
    d.text((W - 36, 140), sc["credits"], font=font(24), fill=(255, 255, 255, 190), anchor="rt")
    scale = 0.98
    sprites = {}
    for k in chars:
        for emo in ("normal", "happy", "surprise", "think"):
            for m in ("closed", "half", "open"):
                for b in ("open", "blink"):
                    sprites[k, emo, m, b] = load_sprite(k, f"{emo}_{m}_{b}", scale)
    subs = {e["i"]: subtitle_img(chars[e["who"]]["name"], tuple(chars[e["who"]]["color"]), e["text"]) for e in tl}
    telops = {e["i"]: telop_img(e["telop"]) for e in tl if e.get("telop")}
    # 直前の発話者の表情を維持するため、各キャラの現在の表情を追う
    nframes = int(total * FPS)
    if a.frames: nframes = min(nframes, a.frames)

    out = Path(a.out) if a.out else ROOT / "out" / f"{name}.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", str(audio),
                           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)], stdin=subprocess.PIPE)
    cur_emote = {k: "normal" for k in chars}
    x_of = {"left": 90, "right": W - 90}
    for f in range(nframes):
        ts = f / FPS
        act = next((e for e in tl if e["start"] <= ts < e["start"] + e["dur"]), None)
        held = [e for e in tl if e["start"] <= ts]
        if held:
            cur_emote[held[-1]["who"]] = held[-1].get("emote", "normal")
        # 話していない間は「直前の自分の台詞の表情」を引き継ぐ。まだ話していなければ normal。
        for k in chars:
            mine = [e for e in held if e["who"] == k]
            cur_emote[k] = mine[-1].get("emote", "normal") if mine else "normal"
        frame = bg.copy().convert("RGBA")
        for k, c in chars.items():
            talking = act is not None and act["who"] == k
            if talking:
                vol = act["vols"][min(int((ts - act["start"]) * FPS), len(act["vols"]) - 1)] if act["vols"] else None
                m = mouth_state(vol, f, act["i"])
            else:
                m = "closed"
            blink = "blink" if (f % 105) < 4 else "open"
            sp = sprites[k, cur_emote[k], m, blink]
            bounce = int(8 * abs(math.sin((ts - act["start"]) * 9))) if talking else 0
            y = 150 - bounce
            x = x_of[c["side"]] if c["side"] == "left" else x_of["right"] - sp.width
            frame.alpha_composite(sp, (x, y))
        if act:
            tel = telops.get(act["i"])
            if tel:
                frame.alpha_composite(tel, ((W - tel.width) // 2, 190))
            s = subs[act["i"]]
            frame.alpha_composite(s, ((W - s.width) // 2, H - s.height - 36))
        ff.stdin.write(frame.convert("RGB").tobytes())
    ff.stdin.close(); ff.wait()
    print(f"-> {out}  ({total:.1f}s, voice={'VOICEVOX' if use_voice else 'なし(--dry)'})")

if __name__ == "__main__":
    main()
