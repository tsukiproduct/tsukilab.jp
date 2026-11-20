#!/usr/bin/env python3
"""動く図解(連番PNG)を作る部品集。番組の絵柄(クリーム地・焦げ茶の線・黄色のマーカー)に揃える。
各関数は assets/refs/<name>/000.png ... を書き出す(30fps)。台本では {"seq": "<name>", "fit": "contain", "box": [w,h]} で使う。
  python3 tools/figs.py ep002   # その回の図をまとめて作る
"""
import math, sys, shutil
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import build as B

REFS = ROOT / "assets/refs"
BG = (247, 243, 234)
RED, BLUE, GREEN = (214, 52, 52), (70, 130, 200), (70, 160, 90)
SS = 2


def _out(name):
    d = REFS / name
    if d.exists():
        shutil.rmtree(d)
    d.mkdir(parents=True)
    return d


def _canvas(w, h):
    return Image.new("RGB", (w * SS, h * SS), BG)


def _save(im, d, i, w, h):
    im.resize((w, h), Image.LANCZOS).save(d / f"{i:03d}.png")


def _ease(p):
    return B.ease(p)


def _box(d, xy, text, fill, f, alpha=1.0, outline=B.INK):
    x0, y0, x1, y1 = [v * SS for v in xy]
    d.rounded_rectangle([x0 + 6 * SS, y0 + 6 * SS, x1 + 6 * SS, y1 + 6 * SS], 18 * SS, fill=outline)
    d.rounded_rectangle([x0, y0, x1, y1], 18 * SS, fill=fill, outline=outline, width=4 * SS)
    lines = text.split("\n")
    lh = f.size * 1.25
    for k, ln in enumerate(lines):
        d.text(((x0 + x1) / 2, (y0 + y1) / 2 + (k - (len(lines) - 1) / 2) * lh), ln, font=f, fill=B.INK, anchor="mm")


def flow(name, nodes, edges, w=1200, h=700, per=24, hold=60):
    """フロー図: nodes=[(x0,y0,x1,y1,"文字",色)], edges=[(i,j,"ラベル",色)]。ノードと矢印が順番に現れる。"""
    d_ = _out(name)
    h = min(h, max(n[3] for n in nodes) + 50)  # 下の余白を詰めて、動画の枠に大きく表示されるようにする
    f = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    fl = B.F(("ZenMaruGothic_700Bold.ttf"), 24 * SS)
    order = []
    for i in range(len(nodes)):
        order.append(("n", i))
        for e in edges:
            if e[1] == i + 1 and e[0] <= i:
                pass
        for k, e in enumerate(edges):
            if e[0] == i:
                order.append(("e", k))
    n = per * len(order) + hold
    for fr in range(n):
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        for step, (kind, idx) in enumerate(order):
            p = (fr - step * per) / per
            if p <= 0:
                continue
            if kind == "e":
                a, b_, lab, col = edges[idx]
                ax0, ay0, ax1, ay1 = nodes[a][:4]; bx0, by0, bx1, by1 = nodes[b_][:4]
                sx, sy = (ax0 + ax1) / 2, (ay0 + ay1) / 2
                ex, ey = (bx0 + bx1) / 2, (by0 + by1) / 2
                # 箱の縁から縁へ
                def edge_pt(x0, y0, x1, y1, tx, ty, cx, cy):
                    dx, dy = tx - cx, ty - cy
                    sxp = (x1 - x0) / 2 / abs(dx) if dx else 1e9
                    syp = (y1 - y0) / 2 / abs(dy) if dy else 1e9
                    s_ = min(sxp, syp)
                    return cx + dx * s_, cy + dy * s_
                p0 = edge_pt(ax0, ay0, ax1, ay1, ex, ey, sx, sy)
                p1 = edge_pt(bx0 - 10, by0 - 10, bx1 + 10, by1 + 10, sx, sy, ex, ey)
                q = _ease(min(1, p))
                cx_, cy_ = p0[0] + (p1[0] - p0[0]) * q, p0[1] + (p1[1] - p0[1]) * q
                d.line([(p0[0] * SS, p0[1] * SS), (cx_ * SS, cy_ * SS)], fill=col, width=7 * SS)
                if q > 0.95:
                    ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
                    tip = (p1[0] * SS, p1[1] * SS)
                    d.polygon([tip, (tip[0] - 26 * SS * math.cos(ang - 0.45), tip[1] - 26 * SS * math.sin(ang - 0.45)),
                               (tip[0] - 26 * SS * math.cos(ang + 0.45), tip[1] - 26 * SS * math.sin(ang + 0.45))], fill=col)
                    if lab:
                        mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
                        tw = fl.getlength(lab) / SS
                        d.rounded_rectangle([(mx - tw / 2 - 10) * SS, (my - 20) * SS, (mx + tw / 2 + 10) * SS, (my + 20) * SS], 10 * SS, fill=(255, 255, 255), outline=col, width=3 * SS)
                        d.text((mx * SS, my * SS), lab, font=fl, fill=col, anchor="mm")
            else:
                x0, y0, x1, y1, text, col = nodes[idx]
                q = min(1, p)
                sc = 0.6 + 0.4 * _ease(q) + (0.08 * math.sin(q * math.pi) if q < 1 else 0)
                cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
                hw, hh = (x1 - x0) / 2 * sc, (y1 - y0) / 2 * sc
                _box(d, (cx - hw, cy - hh, cx + hw, cy + hh), text, col, f)
        _save(im, d_, fr, w, h)
    return n


def timeline(name, events, w=1300, h=560, span=None, per=26, hold=70, title=None):
    """年表: events=[(位置0..1, "上の文字", "下の文字", 色)]。span=(a,b,"ラベル") で区間を強調。"""
    d_ = _out(name)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 58 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 42 * SS)
    X0, X1, Y = 130, w - 130, h // 2 + 10
    n = per * (len(events) + (1 if span else 0)) + 30 + hold
    for fr in range(n):
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        if title:
            d.text((w / 2 * SS, 48 * SS), title, font=B.F_TITLE(40 * SS), fill=B.INK, anchor="mm")
        q = _ease(min(1, fr / 30))
        d.line([(X0 * SS, Y * SS), ((X0 + (X1 - X0) * q) * SS, Y * SS)], fill=B.INK, width=8 * SS)
        for k, ev in enumerate(events):
            pos, top, bot, col = ev[:4]
            lvl = ev[4] if len(ev) > 4 else (1 if k % 2 == 0 else -1)  # 1=上, -1=下, 2=さらに上
            p = (fr - 30 - k * per) / per
            if p <= 0:
                continue
            x = X0 + (X1 - X0) * pos
            r = 16 * min(1, _ease(p) * 1.2)
            d.ellipse([(x - r) * SS, (Y - r) * SS, (x + r) * SS, (Y + r) * SS], fill=col, outline=B.INK, width=4 * SS)
            up = lvl > 0
            ty = Y - 140 * abs(lvl) if up else Y + 140 * abs(lvl)
            d.line([(x * SS, (Y - (20 if up else -20)) * SS), (x * SS, (ty + (30 if up else -30)) * SS)], fill=B.INK, width=3 * SS)
            d.text((x * SS, (ty - 30) * SS), top, font=fb, fill=B.INK, anchor="mm")
            d.text((x * SS, (ty + 34) * SS), bot, font=fs, fill=(110, 86, 70), anchor="mm")
        if span:
            p = (fr - 30 - len(events) * per) / per
            if p > 0:
                a, b_, lab = span
                xa, xb = X0 + (X1 - X0) * a, X0 + (X1 - X0) * (a + (b_ - a) * _ease(min(1, p)))
                d.rounded_rectangle([xa * SS, (Y - 14) * SS, xb * SS, (Y + 14) * SS], 10 * SS, fill=RED + (255,))
                if p >= 1:
                    tw = B.F_TITLE(44).getlength(lab)
                    mx = (xa + xb) / 2
                    d.rounded_rectangle([(mx - tw / 2 - 20) * SS, (Y - 115) * SS, (mx + tw / 2 + 20) * SS, (Y - 45) * SS], 16 * SS, fill=B.MARKER, outline=B.INK, width=4 * SS)
                    d.text((mx * SS, (Y - 80) * SS), lab, font=B.F_TITLE(44 * SS), fill=RED, anchor="mm")
        _save(im, d_, fr, w, h)
    return n


def chart(name, series, xr, yr, xlabel, ylabel, xticks, yticks, w=1200, h=700, dur=120, hold=60, notes=(), clip_y=True):
    """折れ線グラフ: series=[(点のリスト[(x,y)], 色, "凡例", 破線か)]。左から右へ描かれていく。notes=[(x,y,"注記",色,出す割合0..1)]"""
    d_ = _out(name)
    f = B.F(("ZenMaruGothic_700Bold.ttf"), 24 * SS)
    fl = B.F(("ZenMaruGothic_900Black.ttf"), 28 * SS)
    L, R, T, Bt = 130, w - 50, 60, h - 90
    X = lambda x: (L + (x - xr[0]) / (xr[1] - xr[0]) * (R - L)) * SS
    Y = lambda y: (Bt - (y - yr[0]) / (yr[1] - yr[0]) * (Bt - T)) * SS
    for fr in range(dur + hold):
        prog = _ease(min(1, fr / dur))
        xcut = xr[0] + (xr[1] - xr[0]) * prog
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        for yv, lab in yticks:
            d.line([(L * SS, Y(yv)), (R * SS, Y(yv))], fill=(225, 214, 196), width=2 * SS)
            d.text(((L - 14) * SS, Y(yv)), lab, font=f, fill=(110, 86, 70), anchor="rm")
        for xv, lab in xticks:
            d.text((X(xv), (Bt + 30) * SS), lab, font=f, fill=(110, 86, 70), anchor="mm")
        d.line([(L * SS, T * SS), (L * SS, Bt * SS), (R * SS, Bt * SS)], fill=B.INK, width=4 * SS)
        d.text(((R) * SS, (Bt + 64) * SS), xlabel, font=f, fill=B.INK, anchor="rm")
        d.text(((L - 10) * SS, (T - 30) * SS), ylabel, font=f, fill=B.INK, anchor="lm")
        for k, (pts, col, lab, dashed) in enumerate(series):
            vis = [(x, y) for x, y in pts if x <= xcut and (not clip_y or y <= yr[1] * 1.02)]
            if len(vis) >= 2:
                P = [(X(x), Y(min(y, yr[1] * 1.02))) for x, y in vis]
                if dashed:
                    for a_, b_ in zip(P[::2], P[1::2]):
                        d.line([a_, b_], fill=col, width=7 * SS)
                else:
                    d.line(P, fill=col, width=8 * SS, joint="curve")
                lx, ly = P[-1]
                d.ellipse([lx - 9 * SS, ly - 9 * SS, lx + 9 * SS, ly + 9 * SS], fill=col, outline=B.INK, width=3 * SS)
            d.rounded_rectangle([(L + 30) * SS, (T + 10 + k * 46) * SS, (L + 60) * SS, (T + 30 + k * 46) * SS], 6 * SS, fill=col)
            d.text(((L + 72) * SS, (T + 20 + k * 46) * SS), lab, font=fl, fill=B.INK, anchor="lm")
        for (nx, ny, txt, col, at) in notes:
            if prog >= at:
                tw = fl.getlength(txt) / SS
                d.rounded_rectangle([X(nx) - (tw / 2 + 16) * SS, Y(ny) - 30 * SS, X(nx) + (tw / 2 + 16) * SS, Y(ny) + 30 * SS], 14 * SS,
                                    fill=(255, 253, 247), outline=col, width=4 * SS)
                d.text((X(nx), Y(ny)), txt, font=fl, fill=col, anchor="mm")
        _save(im, d_, fr, w, h)
    return dur + hold


def scale_zoom(name, levels, w=1000, h=1000, per=55, hold=50):
    """スケールのズームアウト: levels=[("名前", "大きさの説明", 色)]。前の段が点のように小さくなり、次の段が現れる。"""
    d_ = _out(name)
    fb = B.F_TITLE(50 * SS); fs = B.F(("ZenMaruGothic_700Bold.ttf"), 30 * SS)
    n = per * len(levels) + hold
    cx, cy = w / 2, h / 2 + 30
    for fr in range(n):
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        k = min(len(levels) - 1, fr // per)
        p = _ease((fr - k * per) / per)
        # 外側の円(今の段)と、縮んでいく内側の円(前の段)
        for j in range(max(0, k - 2), k + 1):
            lvl = k - j
            r = 380 * (0.12 ** (lvl - (p if k < len(levels) - 1 or fr < per * len(levels) else 0) * 0)) if lvl else 380 * (0.3 + 0.7 * p)
            if lvl:
                r = 380 * (0.12 ** lvl) * (1 - 0.6 * p)
            col = levels[j][2]
            if r > 1:
                d.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], outline=col, width=(6 if lvl == 0 else 4) * SS,
                          fill=col + (40,) if lvl == 0 else None)
        nm, sz, col = levels[k]
        d.text((w / 2 * SS, 70 * SS), nm, font=fb, fill=B.INK, anchor="mm")
        d.text((w / 2 * SS, 130 * SS), sz, font=fs, fill=(110, 86, 70), anchor="mm")
        _save(im, d_, fr, w, h)
    return n


def orbit(name, w=1000, h=1000, frames=150, chase=False, label_a="", label_b="", tilt=0.35):
    """地球のまわりを回る軌道(斜めから見た楕円)。chase=True で、後ろの機体が内側の軌道を回って前の機体に追いつく。"""
    sys.path.insert(0, str(ROOT / "tools"))
    import geo_maps as G
    d_ = _out(name)
    C = G.load()
    tex = G.texture(C, highlight=False)
    earth = G.globe(tex, -80, 25, size=520).convert("RGBA")
    mask = Image.new("L", earth.size, 0); ImageDraw.Draw(mask).ellipse([30, 30, 490, 490], fill=255)
    earth.putalpha(mask)
    f = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    cx, cy = w / 2, h / 2
    for fr in range(frames):
        im = _canvas(w, h).convert("RGBA")
        back = ImageDraw.Draw(im)
        def ell(rx, col, wdt, front):
            pts = []
            for a in range(0, 361, 3):
                t = math.radians(a)
                y = math.sin(t)
                if (y > 0) == front:
                    pts.append(((cx + rx * math.cos(t)) * SS, (cy + rx * tilt * y) * SS))
                elif pts:
                    back.line(pts, fill=col, width=wdt * SS); pts = []
            if pts:
                back.line(pts, fill=col, width=wdt * SS)
        def pos(rx, ang):
            return cx + rx * math.cos(ang), cy + rx * tilt * math.sin(ang), math.sin(ang) > 0
        r1, r2 = 330, 410
        ell(r1, BLUE, 4, False)
        if chase:
            ell(r2, RED, 4, False)
        e2 = earth.resize((520 * SS, 520 * SS), Image.LANCZOS)
        im.alpha_composite(e2, (int((cx - 260) * SS), int((cy - 260) * SS)))
        back = ImageDraw.Draw(im)
        ell(r1, BLUE, 4, True)
        if chase:
            ell(r2, RED, 4, True)
        t = fr / frames
        objs = []
        if chase:  # 内側(低い軌道)ほど速く回る → 追いつく
            a1 = math.radians(200 + 520 * _ease(t))
            a2 = math.radians(330 + 330 * _ease(t))
            objs = [(r1, a1, BLUE, label_a), (r2, a2, RED, label_b)]
        else:
            objs = [(r1, math.radians(200 + 720 * t), BLUE, label_a)]
        for rx, ang, col, lab in objs:
            x, y, front = pos(rx, ang)
            if not front and math.hypot(x - cx, (y - cy)) < 240:
                continue  # 地球の裏側
            back.ellipse([(x - 16) * SS, (y - 16) * SS, (x + 16) * SS, (y + 16) * SS], fill=col, outline=B.INK, width=4 * SS)
            if lab:
                back.text((x * SS, (y - 40) * SS), lab, font=f, fill=col, anchor="mm", stroke_width=6 * SS, stroke_fill=(255, 255, 255))
        _save(im.convert("RGB"), d_, fr, w, h)
    return frames


# ---------------- 各回の図 ----------------
def ep002():
    Y, P, G_ = B.MARKER, (255, 206, 190), (190, 232, 207)
    flow("ep002_route", [
        (40, 60, 330, 190, "実験中のAI\n(公開前)", G_),
        (440, 60, 760, 190, "課題:\n薬の公開情報を調べる", Y),
        (870, 60, 1160, 190, "何度も\nブロックされる", P),
        (870, 300, 1160, 430, "抜け道を\n見つけて回り込む", P),
        (440, 300, 760, 430, "政府のシステムへ\n無断アクセス", (255, 170, 160)),
        (440, 540, 760, 670, "データを\n書き込むまで", (255, 170, 160)),
    ], [(0, 1, "", B.INK), (1, 2, "", B.INK), (2, 3, "あきらめない", RED), (3, 4, "", RED), (4, 5, "", RED)], per=28)
    timeline("ep002_timeline", [  # 位置は 6/18〜9/29(103日)に対する日数の割合。末尾の数字はラベルの段
        (0 / 103, "6月18日", "侵入開始", RED, 1),
        (44 / 103, "8月", "OpenAIが気づく", (255, 178, 56), -1),
        (84 / 103, "9月10日", "政府へ通知", (255, 178, 56), 1),
        (98 / 103, "9月24日", "首相が公表", BLUE, -1),
        (103 / 103, "9月29日", "謝罪", GREEN, -2),
    ], span=(0.0, 84 / 103, "通知まで84日"), h=760)


def ep003():
    # 実際の世界人口(Our World in Data: HYDE/Gapminder/UN WPP 2024、億人)
    actual = [(1900, 16.3), (1920, 19.0), (1940, 22.9), (1950, 24.9), (1960, 30.2), (1970, 36.9), (1980, 44.5),
              (1990, 53.3), (2000, 61.7), (2010, 70.2), (2020, 78.9), (2023, 80.9)]
    t0 = 2026.87  # 論文の式 N = C/(t0 - t) の t0(2026年11月13日)
    C = 30.2 * (t0 - 1960)  # 番組で1960年の人口に合わせて作図
    pred = [(y / 10, C / (t0 - y / 10)) for y in range(19000, 20265)]
    chart("ep003_pop", [(pred, (214, 52, 52), "1960年の論文の式", True), (actual, (70, 130, 200), "実際の世界人口", False)],
          (1900, 2030), (0, 300), "年", "億人", [(1900, "1900"), (1950, "1950"), (2000, "2000"), (2026, "2026")],
          [(0, "0"), (100, "100"), (200, "200"), (300, "300")],
          notes=[(1990, 250, "2026年に無限大へ", (214, 52, 52), 0.85), (1975, 115, "実際は約81億人", (70, 130, 200), 0.97)], dur=150)
    # 国連の予測(2024年): 2080年代半ばに約103億人でピーク、2100年に約102億人
    proj = [(2023, 80.9), (2030, 85.5), (2040, 91.5), (2050, 96.6), (2060, 100.2), (2070, 102.3), (2084, 103.0), (2090, 102.8), (2100, 102.4)]
    chart("ep003_future", [(actual, (70, 130, 200), "実際の世界人口", False), (proj, (70, 160, 90), "国連の予測(2024年・概形)", True)],
          (1900, 2100), (0, 120), "年", "億人", [(1900, "1900"), (1950, "1950"), (2000, "2000"), (2050, "2050"), (2100, "2100")],
          [(0, "0"), (40, "40"), (80, "80"), (120, "120")],
          notes=[(2045, 113, "2080年代に約103億人で頂点", (70, 160, 90), 0.92)], dur=130)


def scale_steps(name, levels, w=1000, h=760, per=60, hold=50):
    """スケールのズームアウト: levels=[("名前","大きさ",色)]。前の段の円が点まで縮み、次の段の円が広がる。"""
    d_ = _out(name)
    fb = B.F_TITLE(54 * SS); fs = B.F(("ZenMaruGothic_900Black.ttf"), 34 * SS)
    cx, cy, R = w / 2, h / 2 + 50, 250
    n = per * len(levels) + hold
    for fr in range(n):
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        k = min(len(levels) - 1, fr // per)
        p = _ease(min(1, (fr - k * per) / (per * 0.6)))
        for j in sorted(range(max(0, k - 1), k + 1), reverse=True):  # 今の段を先に描き、前の段(点とラベル)を上に重ねる
            depth = k - j  # 0=今の段
            if depth == 0:
                r = R * (0.15 + 0.85 * p)
            elif depth == 1:
                r = R * 0.15 * (1 - p) + 7 * p   # 前の段は「点」まで縮む
            else:
                continue
            col = levels[j][2]
            d.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], fill=col if depth else col + (0,),
                      outline=B.INK, width=(5 if depth == 0 else 3) * SS)
            if depth == 1 and p > 0.8:
                lab = f"← {levels[j][0]}はこの点"
                d.text(((cx + 22) * SS, cy * SS), lab, font=B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS), fill=B.INK, anchor="lm",
                       stroke_width=5 * SS, stroke_fill=(255, 255, 255))
        nm, sz, col = levels[k]
        d.rounded_rectangle([(w / 2 - 300) * SS, 24 * SS, (w / 2 + 300) * SS, 150 * SS], 24 * SS, fill=(255, 253, 247), outline=B.INK, width=4 * SS)
        d.text((w / 2 * SS, 64 * SS), nm, font=fb, fill=B.INK, anchor="mm")
        d.text((w / 2 * SS, 118 * SS), sz, font=fs, fill=(208, 98, 10), anchor="mm")
        _save(im, d_, fr, w, h)
    return n


def wrap_world(name, w=1000, h=640, frames=210):
    """平らなのに果てがない世界: 右の端から出ると左の端から戻ってくる(ゲーム画面のような宇宙)"""
    d_ = _out(name)
    f = B.F(("ZenMaruGothic_900Black.ttf"), 34 * SS)
    L, T, R_, Bt = 120, 110, w - 120, h - 60
    for fr in range(frames):
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        d.rounded_rectangle([L * SS, T * SS, R_ * SS, Bt * SS], 20 * SS, fill=(30, 36, 70), outline=B.INK, width=6 * SS)
        import random
        rnd = random.Random(3)
        for _ in range(70):
            x, y = rnd.uniform(L + 10, R_ - 10), rnd.uniform(T + 10, Bt - 10)
            d.ellipse([(x - 2) * SS, (y - 2) * SS, (x + 2) * SS, (y + 2) * SS], fill=(255, 250, 220))
        span = R_ - L
        x = L + ((fr * 5) % span)
        y = (T + Bt) / 2 + 40 * math.sin(fr / 20)
        for dx in (0, -span, span):  # 端をまたぐ時は両側に描く
            xx = x + dx
            if L - 40 < xx < R_ + 40:
                d.polygon([((xx + 56) * SS, y * SS), ((xx - 40) * SS, (y - 34) * SS), ((xx - 22) * SS, y * SS), ((xx - 40) * SS, (y + 34) * SS)], fill=B.MARKER, outline=B.INK, width=3 * SS)
        # 画面外を隠す
        d.rectangle([0, 0, L * SS - 3 * SS, h * SS], fill=BG); d.rectangle([R_ * SS + 3 * SS, 0, w * SS, h * SS], fill=BG)
        d.rounded_rectangle([L * SS, T * SS, R_ * SS, Bt * SS], 20 * SS, outline=B.INK, width=6 * SS)
        for xa, sgn in ((R_ + 12, 1), (L - 12, -1)):
            d.polygon([(xa * SS, (h / 2 + 30 - 26) * SS), ((xa + 30 * sgn) * SS, (h / 2 + 30) * SS), (xa * SS, (h / 2 + 30 + 26) * SS)], fill=RED)
        d.text((w / 2 * SS, 60 * SS), "右へ出ると、左から戻ってくる", font=f, fill=B.INK, anchor="mm")
        _save(im, d_, fr, w, h)
    return frames


def shapes3(name, w=1300, h=560):
    """宇宙の形の3候補(静止画)"""
    im = _canvas(w, h); d = ImageDraw.Draw(im)
    f = B.F_TITLE(40 * SS); fs = B.F(("ZenMaruGothic_900Black.ttf"), 28 * SS)
    cols = [(w / 6, "平らで無限", "どこまでも続く"), (w / 2, "丸くて有限", "風船の表面のよう"), (5 * w / 6, "平らで有限", "端がつながっている")]
    for cx, t1, t2 in cols:
        cy = 260
        if t1 == "平らで無限":
            for i in range(-4, 5):
                d.line([((cx + i * 40 - 120) * SS, (cy + 90) * SS), ((cx + i * 22) * SS, (cy - 90) * SS)], fill=BLUE, width=3 * SS)
            for j in range(5):
                yy = cy - 90 + j * 45
                hw = 110 + j * 24
                d.line([((cx - hw) * SS, yy * SS), ((cx + hw) * SS, yy * SS)], fill=BLUE, width=3 * SS)
        elif t1 == "丸くて有限":
            r = 120
            for k in range(30, 0, -1):
                c = tuple(int(200 - 70 * k / 30 + 55 * (1 - k / 30)) for _ in range(3))
                rr = r * k / 30
                d.ellipse([(cx - rr - 20 * (1 - k / 30)) * SS, (cy - rr - 20 * (1 - k / 30)) * SS, (cx + rr - 20 * (1 - k / 30)) * SS, (cy + rr - 20 * (1 - k / 30)) * SS],
                          fill=(150 + int(100 * (1 - k / 30)), 200 + int(50 * (1 - k / 30)), 240))
            d.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], outline=B.INK, width=4 * SS)
            for lat in (-60, -30, 0, 30, 60):
                yy = cy - r * math.sin(math.radians(lat)); hw = r * math.cos(math.radians(lat))
                d.ellipse([(cx - hw) * SS, (yy - hw * 0.18) * SS, (cx + hw) * SS, (yy + hw * 0.18) * SS], outline=BLUE, width=2 * SS)
        else:
            d.ellipse([(cx - 150) * SS, (cy - 80) * SS, (cx + 150) * SS, (cy + 80) * SS], fill=(190, 232, 207), outline=B.INK, width=4 * SS)
            d.ellipse([(cx - 60) * SS, (cy - 22) * SS, (cx + 60) * SS, (cy + 22) * SS], fill=BG, outline=B.INK, width=4 * SS)
        d.text((cx * SS, (cy + 170) * SS), t1, font=f, fill=B.INK, anchor="mm")
        d.text((cx * SS, (cy + 222) * SS), t2, font=fs, fill=(110, 86, 70), anchor="mm")
    im.resize((w, h), Image.LANCZOS).save(REFS / f"{name}.png")


def ep004():
    scale_steps("ep004_scale", per=100, levels=[
        ("地球", "直径 約1.3万km", (198, 226, 246)),
        ("太陽系", "海王星の軌道まで 直径 約90億km", (255, 233, 150)),
        ("天の川銀河", "直径 約10万光年(推定には幅あり)", (255, 206, 190)),
        ("観測できる宇宙", "直径 約930億光年", (190, 232, 207)),
        ("その外側は…？", "まだ分かっていない", (230, 220, 245)),
    ])
    wrap_world("ep004_wrap")
    shapes3("ep004_shapes")


def earth_layers(name, w=1150, h=860, frames=270):
    """地球の断面: 層が外から順に現れ、最後に内核が回りだす(模式図)"""
    d_ = _out(name)
    f = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS); fs = B.F(("ZenMaruGothic_700Bold.ttf"), 24 * SS)
    cx, cy, R = 380, h / 2 + 10, 340
    layers = [  # (半径の割合, 色, 名前, 説明)
        (1.00, (150, 110, 80), "地殻", "厚さ5〜70km"),
        (0.985, (255, 178, 90), "マントル", "深さ約2,890kmまで"),
        (0.546, (255, 222, 110), "外核(液体)", "厚さ約2,260km"),
        (0.191, (238, 96, 80), "内核(固体)", "半径約1,220km"),
    ]
    for fr in range(frames):
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        for k, (rr, col, nm, ex) in enumerate(layers):
            p = _ease((fr - k * 30) / 25)
            if p <= 0:
                continue
            r = R * rr * (0.8 + 0.2 * p)
            d.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], fill=col, outline=B.INK, width=3 * SS)
        for k, (rr, col, nm, ex) in enumerate(layers):  # ラベル(右側に引き出し線)
            if fr < k * 30 + 25:
                continue
            ly = cy - R * 0.8 + k * 160
            px = cx + R * rr * (0.72 if k else 0.99)
            py = cy - R * rr * (0.55 if k else 0.12) if k < 3 else cy
            d.line([(px * SS, py * SS), ((cx + R + 20) * SS, ly * SS)], fill=B.INK, width=3 * SS)
            d.text(((cx + R + 28) * SS, (ly - 16) * SS), nm, font=f, fill=B.INK, anchor="lm")
            d.text(((cx + R + 28) * SS, (ly + 20) * SS), ex, font=fs, fill=(110, 86, 70), anchor="lm")
        if fr > 130:  # 内核が回る(速くなったり遅くなったり)
            t = fr - 130
            ang = 0.08 * t + 0.6 * math.sin(t / 25)
            r = R * 0.191
            for j in range(3):
                a_ = ang + j * 2 * math.pi / 3
                d.line([(cx * SS, cy * SS), ((cx + r * 0.85 * math.cos(a_)) * SS, (cy + r * 0.85 * math.sin(a_)) * SS)], fill=(255, 255, 255), width=5 * SS)
            # 回転の矢印
            box = [(cx - r - 26) * SS, (cy - r - 26) * SS, (cx + r + 26) * SS, (cy + r + 26) * SS]
            st = math.degrees(ang) % 360
            d.arc(box, st, st + 120, fill=RED, width=7 * SS)
            ex_, ey_ = cx + (r + 26) * math.cos(math.radians(st + 120)), cy + (r + 26) * math.sin(math.radians(st + 120))
            d.ellipse([(ex_ - 9) * SS, (ey_ - 9) * SS, (ex_ + 9) * SS, (ey_ + 9) * SS], fill=RED)
        _save(im, d_, fr, w, h)
    return frames


def globe_spin(name, frames=150):
    sys.path.insert(0, str(ROOT / "tools"))
    import geo_maps as G
    d_ = _out(name)
    tex = G.texture(G.load(), highlight=False)
    for fr in range(frames):
        G.globe(tex, 130 - 360 * fr / frames, 20, size=600).save(d_ / f"{fr:03d}.png")


def ep005():
    earth_layers("ep005_layers")
    if not (REFS / "ep005_spin").exists():
        globe_spin("ep005_spin")


def cannonball(name, w=1000, h=1000, frames=330):
    """ニュートンの大砲: 速さが足りないと落ち、十分に速いと「落ちながら回り続ける」=軌道"""
    sys.path.insert(0, str(ROOT / "tools"))
    import geo_maps as G
    d_ = _out(name)
    earth = G.globe(G.texture(G.load(), highlight=False), -40, 30, size=440).convert("RGBA")
    m = Image.new("L", earth.size, 0); ImageDraw.Draw(m).ellipse([26, 26, 414, 414], fill=255); earth.putalpha(m)
    cx, cy, R = w / 2, h / 2 + 60, 194
    r0 = R + 70
    f = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    shots = [(0.55, RED, "遅いと、すぐ落ちる"), (0.8, (255, 150, 40), "速いと、遠くに落ちる"), (1.0, BLUE, "十分に速いと、回り続ける")]
    paths = []
    for frac, col, lab in shots:  # 重力の中で飛ばす(数値計算)
        x, y, vx, vy = 0.0, r0, frac * math.sqrt(1 / r0) * 1, 0.0
        GM = 1.0; pts = [(x, y)]
        vx = frac * math.sqrt(GM / r0)
        dt = 0.4 * r0 ** 1.5 / 200
        for _ in range(4000):
            rr = math.hypot(x, y)
            ax, ay = -GM * x / rr ** 3, -GM * y / rr ** 3
            vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt
            pts.append((x, y))
            if math.hypot(x, y) < R or (frac >= 1 and len(pts) > 30 and abs(x) < 3 and y > 0):
                break
        paths.append((pts, col, lab))
    seg = frames // 3
    for fr in range(frames):
        im = _canvas(w, h).convert("RGBA")
        im.alpha_composite(earth.resize((440 * SS, 440 * SS), Image.LANCZOS), (int((cx - 220) * SS), int((cy - 220) * SS)))
        d = ImageDraw.Draw(im)
        d.polygon([((cx - 30) * SS, (cy - R + 4) * SS), (cx * SS, (cy - r0 + 4) * SS), ((cx + 30) * SS, (cy - R + 4) * SS)], fill=(150, 110, 80), outline=B.INK)
        for k, (pts, col, lab) in enumerate(paths):
            p = (fr - k * seg) / (seg * 0.8)
            if p <= 0:
                continue
            n = max(2, int(len(pts) * min(1, p)))
            P = [((cx + x) * SS, (cy - y) * SS) for x, y in pts[:n]]
            d.line(P, fill=col, width=6 * SS)
            hx, hy = P[-1]
            d.ellipse([hx - 11 * SS, hy - 11 * SS, hx + 11 * SS, hy + 11 * SS], fill=col, outline=B.INK, width=3 * SS)
            d.text((w / 2 * SS, (60 + k * 46) * SS), lab, font=f, fill=col, anchor="mm", stroke_width=5 * SS, stroke_fill=(255, 255, 255))
        _save(im.convert("RGB"), d_, fr, w, h)
    return frames


def tree_move(name, w=1100, h=760, frames=240):
    """系統樹の上で、化石「リジー」が爬虫類側から水辺の祖先側へ引っ越す"""
    d_ = _out(name)
    f = B.F(("ZenMaruGothic_900Black.ttf"), 32 * SS); fs = B.F(("ZenMaruGothic_700Bold.ttf"), 26 * SS)
    root, node = (w / 2, h - 60), (w / 2, h / 2 + 40)
    left, right = (200, 130), (w - 200, 130)
    a = (node[0] + (right[0] - node[0]) * 0.55, node[1] + (right[1] - node[1]) * 0.55)  # 最初の位置(爬虫類側)
    b = (root[0] + (node[0] - root[0]) * 0.45, root[1] + (node[1] - root[1]) * 0.45)    # 新しい位置(幹の途中)
    for fr in range(frames):
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        for p0, p1, col in [(root, node, B.INK), (node, left, BLUE), (node, right, GREEN)]:
            d.line([(p0[0] * SS, p0[1] * SS), (p1[0] * SS, p1[1] * SS)], fill=col, width=12 * SS)
        d.text((left[0] * SS, (left[1] - 50) * SS), "両生類", font=f, fill=BLUE, anchor="mm")
        d.text((right[0] * SS, (right[1] - 70) * SS), "有羊膜類", font=f, fill=GREEN, anchor="mm")
        d.text((right[0] * SS, (right[1] - 30) * SS), "爬虫類・鳥・哺乳類", font=fs, fill=GREEN, anchor="mm")
        d.text(((root[0] + 40) * SS, (root[1] - 10) * SS), "水辺にすむ祖先たち", font=fs, fill=B.INK, anchor="lm")
        p = _ease((fr - 90) / 70)
        x, y = a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p - 60 * math.sin(math.pi * p)
        d.ellipse([(x - 46) * SS, (y - 46) * SS, (x + 46) * SS, (y + 46) * SS], fill=B.MARKER, outline=B.INK, width=5 * SS)
        d.text((x * SS, y * SS), "リジー", font=B.F(("ZenMaruGothic_900Black.ttf"), 26 * SS), fill=B.INK, anchor="mm")
        if fr < 90:
            d.text(((x + 60) * SS, (y + 6) * SS), "最古級の爬虫類？(1990年〜)", font=fs, fill=B.INK, anchor="lm")
        if p >= 1:
            d.text(((x + 60) * SS, y * SS), "えらを持つ水辺の仲間(2026年)", font=fs, fill=RED, anchor="lm")
        _save(im, d_, fr, w, h)
    return frames


def peru_map(name, w=900, h=1000, frames=200):
    sys.path.insert(0, str(ROOT / "tools"))
    import geo_maps as G
    d_ = _out(name)
    C = G.load()
    import io, zipfile, shapefile
    z = zipfile.ZipFile(ROOT / "assets/geo/ne_50m_admin_0_countries.zip")
    base = [n for n in z.namelist() if n.endswith(".shp")][0][:-4]
    r = shapefile.Reader(shp=io.BytesIO(z.read(base + ".shp")), dbf=io.BytesIO(z.read(base + ".dbf")), shx=io.BytesIO(z.read(base + ".shx")))
    fields = [f_[0] for f_ in r.fields[1:]]
    polys = []
    for sr in r.iterShapeRecords():
        rec = dict(zip(fields, sr.record))
        pts, parts = sr.shape.points, list(sr.shape.parts) + [len(sr.shape.points)]
        polys.append((rec["NAME"], [pts[a:b] for a, b in zip(parts[:-1], parts[1:])]))
    lon0, lon1, lat0, lat1 = -83, -67, -19, 1
    k = math.cos(math.radians(9))
    sx = (w - 40) / ((lon1 - lon0) * k); sy = (h - 40) / (lat1 - lat0); sc = min(sx, sy)
    P = lambda lon, lat: ((20 + (lon - lon0) * k * sc) * SS, (20 + (lat1 - lat) * sc) * SS)
    f = B.F(("ZenMaruGothic_900Black.ttf"), 34 * SS)
    places = [(-74.94, -14.83, "ナスカ", RED), (-74.21, -13.06, "ワリの都", BLUE), (-77.04, -12.05, "リマ", B.INK)]
    for fr in range(frames):
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        d.rectangle([0, 0, w * SS, h * SS], fill=(200, 228, 246))
        for nm, rings in polys:
            for ring in rings:
                if all(not (lon0 - 5 < lon < lon1 + 5 and lat0 - 5 < lat < lat1 + 5) for lon, lat in ring):
                    continue
                d.polygon([P(lon, lat) for lon, lat in ring], fill=(255, 233, 150) if nm == "Peru" else (255, 250, 238), outline=(120, 96, 80))
        d.text((P(-76.0, -9.0)[0], P(-76.0, -9.0)[1]), "ペルー", font=B.F_TITLE(56 * SS), fill=(150, 110, 80), anchor="mm")
        for j, (lon, lat, nm, col) in enumerate(places):
            p = _ease((fr - 30 - j * 25) / 20)
            if p <= 0:
                continue
            x, y = P(lon, lat)
            rr = 14 * SS * p
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=col, outline=B.INK, width=3 * SS)
            d.text((x + 24 * SS, y), nm, font=f, fill=col, anchor="lm", stroke_width=6 * SS, stroke_fill=(255, 255, 255))
        if fr > 130:
            q = _ease((fr - 130) / 40)
            (x0, y0), (x1, y1) = P(-74.21, -13.06), P(-74.94, -14.83)
            d.line([(x0, y0), (x0 + (x1 - x0) * q, y0 + (y1 - y0) * q)], fill=RED, width=6 * SS)
            if q >= 1:
                d.text(((x0 + x1) / 2 - 30 * SS, (y0 + y1) / 2), "征服？協力？", font=f, fill=RED, anchor="rm", stroke_width=6 * SS, stroke_fill=(255, 255, 255))
        _save(im, d_, fr, w, h)
    return frames


def eras(name, bars, x0=0, x1=1100, w=1200, h=520, frames=150, title=None):
    """時代の帯グラフ: bars=[("名前", 始まり, 終わり, 色)]。帯が左から伸びて、重なりが見える。"""
    d_ = _out(name)
    f = B.F(("ZenMaruGothic_900Black.ttf"), 38 * SS); fs = B.F(("ZenMaruGothic_700Bold.ttf"), 28 * SS)
    L, R_ = 120, w - 80
    X = lambda v: (L + (v - x0) / (x1 - x0) * (R_ - L)) * SS
    for fr in range(frames):
        im = _canvas(w, h); d = ImageDraw.Draw(im)
        if title:
            d.text((w / 2 * SS, 50 * SS), title, font=B.F_TITLE(40 * SS), fill=B.INK, anchor="mm")
        for v in range(x0, x1 + 1, 250):
            d.line([(X(v), 110 * SS), (X(v), (h - 70) * SS)], fill=(225, 214, 196), width=2 * SS)
            d.text((X(v), (h - 40) * SS), f"{v}年", font=fs, fill=(110, 86, 70), anchor="mm")
        for k, (nm, a, b_, col) in enumerate(bars):
            p = _ease((fr - k * 40) / 50)
            if p <= 0:
                continue
            y = 170 + k * 130
            d.rounded_rectangle([X(a), y * SS, X(a) + (X(b_) - X(a)) * p, (y + 70) * SS], 20 * SS, fill=col, outline=B.INK, width=4 * SS)
            d.text((X(a) + 20 * SS, (y + 35) * SS), f"{nm}  {a}〜{b_}年ごろ", font=f, fill=B.INK, anchor="lm")
        if fr > 110:  # 重なり
            q = _ease((fr - 110) / 25)
            a, b_ = max(bars[0][1], bars[1][1]), min(bars[0][2], bars[1][2])
            d.rectangle([X(a), 150 * SS, X(b_), (170 + 130 + 90) * SS], outline=RED, width=int(6 * SS * q) or 1)
            d.text(((X(a) + X(b_)) / 2, 128 * SS), "重なる時代", font=f, fill=RED, anchor="mm")
        _save(im, d_, fr, w, h)
    return frames


def cme(name, w=1200, h=700, frames=300, start="10月6日 噴火", end="10月9日 到着(予報)"):
    """太陽の噴出物(CME)が地球に届き、磁気のバリアを押しつぶして、極にオーロラが光る。距離と大きさは実際とは違う模式図。"""
    sys.path.insert(0, str(ROOT / "tools"))
    import geo_maps as G, random
    d_ = _out(name)
    earth = G.globe(G.texture(G.load(), highlight=False), 135, 25, size=300).convert("RGBA")
    m = Image.new("L", earth.size, 0)  # 地球儀の四角い下地を消して丸だけ使う
    ImageDraw.Draw(m).ellipse([3, 3, earth.width - 4, earth.height - 4], fill=255)
    earth.putalpha(m)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 34 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 24 * SS)
    EX, EY = 960, 380
    rnd = random.Random(5)
    stars = [(rnd.randint(0, w), rnd.randint(0, h), rnd.choice([1, 1.5, 2])) for _ in range(140)]
    parts = [(rnd.gauss(0, 0.28), rnd.random() ** 1.6, rnd.uniform(3, 8)) for _ in range(520)]
    for fr in range(frames):
        im = Image.new("RGB", (w * SS, h * SS), (16, 20, 44)); d = ImageDraw.Draw(im, "RGBA")
        for x, y, r in stars:
            d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=(255, 250, 230, 170))
        for k in range(6, 0, -1):  # 太陽(左端)とにじみ
            r = 250 + k * 22
            d.ellipse([(-140 - r) * SS, (EY - r) * SS, (-140 + r) * SS, (EY + r) * SS], fill=(255, 150, 40, 18))
        d.ellipse([-390 * SS, (EY - 250) * SS, 110 * SS, (EY + 250) * SS], fill=(255, 176, 52), outline=(255, 230, 140), width=6 * SS)
        p = min(1, max(0, (fr - 20) / 170))  # 噴出物が進む割合
        hit = max(0, min(1, (fr - 175) / 40))  # 地球に当たってからの割合
        # 地球の磁気のバリア(双極子の磁力線)。当たると昼側が押しつぶされる
        for k, L in enumerate([1.8, 2.5, 3.3]):
            pts = []
            for t in range(-80, 81, 4):
                th = math.radians(t)
                rr = L * 75 * math.cos(th) ** 2
                x = rr * math.cos(th); y = -rr * math.sin(th)
                for sgn in (-1, 1):
                    pass
                pts.append((x, y))
            for side in (-1, 1):
                sq = 1 - 0.35 * hit if side == -1 else 1 + 0.25 * hit
                poly = [((EX + side * x * sq) * SS, (EY + y) * SS) for x, y in pts]
                d.line(poly, fill=(140, 200, 255, 120 - k * 25), width=3 * SS)
        if p > 0 and hit < 1:  # 噴出物(太陽から広がる三日月形の粒の雲)
            dist = 260 + (EX - 200 - 260 + 140) * _ease(p)
            for a, u, r in parts:
                ang = a * (0.35 + 0.25 * p)
                rr = dist - 190 * u * (0.4 + 0.6 * p)
                x = -140 + rr * math.cos(ang)
                y = EY + rr * math.sin(ang)
                al = int((90 + 130 * (1 - u)) * (1 - hit))
                d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=(255, 130, 70, al))
        im2 = im.convert("RGBA")
        im2.alpha_composite(earth.resize((150 * SS, 150 * SS), Image.LANCZOS), ((EX - 75) * SS, (EY - 75) * SS))
        d = ImageDraw.Draw(im2, "RGBA")
        if hit > 0:  # 極のオーロラ
            glow = int(200 * hit * (0.75 + 0.25 * math.sin(fr / 4)))
            for sy in (-1, 1):
                d.ellipse([(EX - 50) * SS, (EY + sy * 66 - 12) * SS, (EX + 50) * SS, (EY + sy * 66 + 12) * SS],
                          outline=(90, 255, 150, glow), width=7 * SS)
        if fr > 20:
            _box(d, (40, 40, 330, 110), start, (255, 233, 150), fb)
        if 70 < fr:
            q = min(1, (fr - 70) / 20)
            d.text(((EX - 380) * SS, 610 * SS), "約3日かけて地球へ", font=fb, fill=(255, 240, 200, int(255 * q)), anchor="mm")
        if hit > 0:
            _box(d, (EX - 190, 40, EX + 200, 110), end, (255, 206, 190), fb)
        d.text((w / 2 * SS, (h - 22) * SS), "距離と大きさは実際とは違う模式図です", font=fs, fill=(200, 210, 240, 200), anchor="mm")
        im2.convert("RGB").resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def flyby(name, w=1200, h=760, frames=300):
    """アポフィスが静止衛星の軌道の内側を通り過ぎる(真上から見た模式図。地球の大きさは見やすく誇張)"""
    sys.path.insert(0, str(ROOT / "tools"))
    import geo_maps as G, random
    d_ = _out(name)
    earth = G.globe(G.texture(G.load(), highlight=False), 30, 10, size=240).convert("RGBA")
    m = Image.new("L", earth.size, 0)
    ImageDraw.Draw(m).ellipse([3, 3, earth.width - 4, earth.height - 4], fill=255)
    earth.putalpha(m)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 24 * SS)
    CX, CY, GEO = 560, 450, 280
    rA = GEO * 38015 / 42164  # 地球の中心からの距離(静止軌道との比は実際どおり)
    rnd = random.Random(9)
    stars = [(rnd.randint(0, w), rnd.randint(0, h), rnd.choice([1, 1.5, 2])) for _ in range(150)]
    for fr in range(frames):
        im = Image.new("RGB", (w * SS, h * SS), (16, 20, 44)); d = ImageDraw.Draw(im, "RGBA")
        for x, y, r in stars:
            d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=(255, 250, 230, 160))
        d.ellipse([(CX - GEO) * SS, (CY - GEO) * SS, (CX + GEO) * SS, (CY + GEO) * SS], outline=(140, 200, 255, 200), width=3 * SS)
        for k in range(10):  # 静止衛星(地球と一緒に回る)
            a = 2 * math.pi * k / 10 + fr / 300
            x, y = CX + GEO * math.cos(a), CY + GEO * math.sin(a)
            d.rectangle([(x - 5) * SS, (y - 3) * SS, (x + 5) * SS, (y + 3) * SS], fill=(200, 220, 255))
        im2 = im.convert("RGBA")
        im2.alpha_composite(earth.resize((84 * SS, 84 * SS), Image.LANCZOS), ((CX - 42) * SS, (CY - 42) * SS))
        d = ImageDraw.Draw(im2, "RGBA")
        d.text(((CX + GEO * 0.75 + 10) * SS, (CY + GEO * 0.75 + 20) * SS), "静止衛星の高さ(約3万6千km)", font=fs, fill=(170, 210, 255), anchor="lm")
        # アポフィスの道すじ: 左上から右下へ、最接近点で地球の上側を通る
        t = (fr - 30) / 210
        path = [(CX + (u - 0.5) * 1300, CY - rA - 0.00034 * ((u - 0.5) * 1300) ** 2) for u in [k / 60 for k in range(61)]]
        if t > 0:
            nshow = int(min(1, t) * 60)
            if nshow > 1:
                d.line([(x * SS, y * SS) for x, y in path[:nshow + 1]], fill=(255, 150, 90, 160), width=3 * SS)
            x, y = path[min(60, nshow)]
            d.ellipse([(x - 10) * SS, (y - 8) * SS, (x + 10) * SS, (y + 8) * SS], fill=(190, 160, 130), outline=(90, 60, 40), width=2 * SS)
            d.text((x * SS, (y - 26) * SS), "アポフィス", font=fs, fill=(255, 200, 160), anchor="mm")
        if 0.45 < t:
            q = min(1, (t - 0.45) / 0.1)
            col = (255, 233, 150, int(255 * q))
            d.line([(CX * SS, (CY - 44) * SS), (CX * SS, (CY - rA + 12) * SS)], fill=col, width=3 * SS)
            d.text(((CX + 16) * SS, (CY - rA / 2 - 10) * SS), "地表から\n約3万2千km", font=fb, fill=col, anchor="lm")
        if fr > 20:
            _box(d, (30, 30, 420, 100), "2029年4月13日(金)", (255, 233, 150), fb)
        if t > 0.6:
            _box(d, (CX - 530, CY - 80, CX - 170, CY - 10), "静止衛星より内側！", (255, 206, 190), fb)
        d.text(((w - 20) * SS, (h - 50) * SS), "月はこの約10倍遠く →", font=fs, fill=(220, 220, 240), anchor="rm")
        d.text((w / 2 * SS, (h - 18) * SS), "真上から見た模式図(地球と小惑星の大きさは誇張)", font=fs, fill=(200, 210, 240, 200), anchor="mm")
        im2.convert("RGB").resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def ep010():
    flyby("ep010_flyby")
    chart("ep010_prob", [((0, 2.7), (1, 2.7), (1.02, 0), (2, 0))], (0, 2), (0, 3), "", "2029年に衝突する確率(%)", [], [0, 1, 2, 3],
          notes=[(1.0, 2.7, "2004年12月27日 2.7%(37分の1)"), (1.6, 0.2, "同じ日のうちに 0%")]) if False else None


def bitb(name, w=1200, h=760, frames=330):
    """偽のログイン窓(Browser-in-the-Browser)。窓の中のアドレスは本物に見えるが、本当のアドレスは上のバー。
    最後に窓をブラウザの外へ引っぱると、枠で切れて出られない(=偽物)。"""
    d_ = _out(name)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 26 * SS)
    fm = B.F(("ZenMaruGothic_700Bold.ttf"), 22 * SS)
    BX0, BY0, BX1, BY1 = 60, 70, 900, 690   # 本物のブラウザ
    for fr in range(frames):
        im = _canvas(w, h); d = ImageDraw.Draw(im, "RGBA")
        d.rounded_rectangle([BX0 * SS, BY0 * SS, BX1 * SS, BY1 * SS], 18 * SS, fill=(255, 255, 255), outline=B.INK, width=4 * SS)
        d.rectangle([BX0 * SS + 8, (BY0 + 60) * SS, BX1 * SS - 8, (BY0 + 62) * SS], fill=(200, 200, 200))
        d.rounded_rectangle([(BX0 + 20) * SS, (BY0 + 14) * SS, (BX1 - 20) * SS, (BY0 + 50) * SS], 16 * SS, fill=(240, 240, 240))
        d.text(((BX0 + 40) * SS, (BY0 + 32) * SS), "https://museads.ai/connect", font=fm, fill=(80, 80, 80), anchor="lm")
        d.text(((BX0 + 40) * SS, (BY0 + 120) * SS), "AI広告ツール(偽物)", font=fb, fill=(150, 150, 150), anchor="lm")
        # 偽の窓: 途中から右へ引っぱられ、ブラウザの枠で切れる
        drag = max(0, min(1, (fr - 220) / 70))
        ox = 330 * _ease(drag)
        P0, P1 = (BX0 + 170 + ox, BY0 + 170), (BX0 + 670 + ox, BY0 + 560)
        layer = Image.new("RGBA", im.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        ld.rounded_rectangle([P0[0] * SS, P0[1] * SS, P1[0] * SS, P1[1] * SS], 14 * SS, fill=(250, 250, 252), outline=(120, 120, 130), width=3 * SS)
        ld.rounded_rectangle([(P0[0] + 14) * SS, (P0[1] + 12) * SS, (P1[0] - 14) * SS, (P0[1] + 46) * SS], 12 * SS, fill=(236, 240, 236))
        ld.text(((P0[0] + 28) * SS, (P0[1] + 29) * SS), "accounts.google.com", font=fm, fill=(40, 120, 60), anchor="lm")
        ld.text((((P0[0] + P1[0]) / 2) * SS, (P0[1] + 120) * SS), "ログイン", font=fb, fill=B.INK, anchor="mm")
        for k in range(2):
            ld.rounded_rectangle([(P0[0] + 50) * SS, (P0[1] + 170 + k * 80) * SS, (P1[0] - 50) * SS, (P0[1] + 220 + k * 80) * SS], 10 * SS, outline=(150, 150, 160), width=2 * SS)
        mask = Image.new("L", im.size, 0)  # ブラウザの表示領域の外は描かれない
        ImageDraw.Draw(mask).rectangle([(BX0 + 4) * SS, (BY0 + 64) * SS, (BX1 - 4) * SS, (BY1 - 4) * SS], fill=255)
        im.paste(layer, (0, 0), Image.fromarray(__import__("numpy").minimum(__import__("numpy").array(mask), __import__("numpy").array(layer.split()[3]))))
        d = ImageDraw.Draw(im, "RGBA")
        if 40 < fr:
            a = min(1, (fr - 40) / 15)
            d.rounded_rectangle([(P0[0] + 10) * SS, (P0[1] + 8) * SS, (min(P1[0], BX1) - 10) * SS, (P0[1] + 50) * SS], 12 * SS, outline=(70, 160, 90, int(255 * a)), width=5 * SS)
            _box(d, (910, 150, 1180, 250), "窓の中は\n本物そっくり", (214, 240, 222), fs)
        if 110 < fr:
            a = min(1, (fr - 110) / 15)
            d.rounded_rectangle([(BX0 + 14) * SS, (BY0 + 8) * SS, (BX1 - 14) * SS, (BY0 + 56) * SS], 18 * SS, outline=(214, 52, 52, int(255 * a)), width=6 * SS)
            _box(d, (910, 40, 1180, 140), "本当の場所は\nここ(偽サイト)", (255, 206, 190), fs)
        if 220 < fr:
            _box(d, (910, 420, 1180, 560), "外へ引っぱると\n枠で切れる\n= 偽物", (255, 233, 150), fs)
        im.resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def ep011():
    bitb("ep011_bitb")
    flow("ep011_flow", [
        (20, 60, 370, 170, "偽の招待メール\n「広告ツール準備完了」", (255, 233, 150)),
        (425, 60, 775, 170, "AI広告ツールを\n装った偽サイト", (255, 206, 190)),
        (830, 60, 1180, 170, "「接続」ボタンで\n偽のログイン窓", (255, 206, 190)),
        (830, 300, 1180, 410, "パスワードを入力", (230, 230, 240)),
        (425, 300, 775, 410, "裏で人間が見ていて\n二段階認証の種類を選ぶ", (255, 206, 190)),
        (20, 300, 370, 410, "届いたコードも\n入力させて奪う", (255, 160, 160)),
        (200, 520, 1000, 630, "広告アカウントを乗っ取り(売る・悪用する)", (255, 160, 160)),
    ], [(0, 1, "", B.INK), (1, 2, "", B.INK), (2, 3, "", B.INK), (3, 4, "", B.INK), (4, 5, "", B.INK), (5, 6, "", (214, 52, 52))], per=26)


def ep012():
    flow("ep012_flow", [
        (20, 50, 370, 160, "2025年秋\nブナの実が大凶作", (255, 206, 190)),
        (425, 50, 775, 160, "食べ物を探して\n人里の近くへ", (255, 206, 190)),
        (830, 50, 1180, 160, "2025年度の人身被害\n238人(過去最多)", (255, 160, 160)),
        (20, 330, 370, 440, "2026年秋\n豊作〜並作", (214, 240, 222)),
        (425, 330, 775, 440, "母グマが\nしっかり太る", (214, 240, 222)),
        (830, 330, 1180, 440, "翌年の春\n子グマが増える?", (255, 233, 150)),
        (300, 560, 900, 660, "その次の秋が凶作なら…?", (255, 160, 160)),
    ], [(0, 1, "", B.INK), (1, 2, "", (214, 52, 52)), (3, 4, "", B.INK), (4, 5, "", B.INK), (5, 6, "", (214, 52, 52))], per=28)


def kessler(name, w=1100, h=760, frames=330):
    """宇宙ゴミの連鎖(ケスラーシンドローム)のイメージ。衝突でかけらが増え、そのかけらが別の衛星に当たる。"""
    sys.path.insert(0, str(ROOT / "tools"))
    import geo_maps as G, random
    d_ = _out(name)
    earth = G.globe(G.texture(G.load(), highlight=False), 140, 30, size=300).convert("RGBA")
    m = Image.new("L", earth.size, 0)
    ImageDraw.Draw(m).ellipse([3, 3, earth.width - 4, earth.height - 4], fill=255)
    earth.putalpha(m)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 22 * SS)
    CX, CY, R0 = w // 2, h // 2 + 20, 250
    rnd = random.Random(11)
    sats = [dict(a=rnd.uniform(0, 2 * math.pi), r=R0 + rnd.uniform(-28, 28), v=rnd.choice([1, -1]) * rnd.uniform(0.006, 0.010), alive=True) for _ in range(46)]
    frags = []
    hits = [(60, 0, 1)]  # (フレーム, 衛星i, 衛星j)
    for fr in range(frames):
        im = Image.new("RGB", (w * SS, h * SS), (16, 20, 44)); d = ImageDraw.Draw(im, "RGBA")
        im2 = im.convert("RGBA")
        im2.alpha_composite(earth.resize((200 * SS, 200 * SS), Image.LANCZOS), ((CX - 100) * SS, (CY - 100) * SS))
        d = ImageDraw.Draw(im2, "RGBA")
        band = Image.new("RGBA", im2.size, (0, 0, 0, 0))  # 低軌道の帯(半透明)
        ImageDraw.Draw(band).ellipse([(CX - R0 - 29) * SS, (CY - R0 * 0.92 - 29) * SS, (CX + R0 + 29) * SS, (CY + R0 * 0.92 + 29) * SS], outline=(120, 160, 230, 38), width=58 * SS)
        im2.alpha_composite(band)
        d = ImageDraw.Draw(im2, "RGBA")
        for s_ in sats:
            s_["a"] += s_["v"]
        for f_ in frags:
            f_["a"] += f_["v"]; f_["r"] += f_["dr"]; f_["dr"] *= 0.97
        # 最初の衝突: 2つの衛星を同じ場所に重ねてぶつける
        if fr == 60:
            a, b = sats[0], sats[1]
            a["alive"] = b["alive"] = False
            for _ in range(40):
                frags.append(dict(a=a["a"] + rnd.uniform(-0.05, 0.05), r=a["r"], v=rnd.uniform(-0.016, 0.016), dr=rnd.uniform(-1.2, 1.2)))
        # 2回目以降: かけらが近くの衛星に当たると、さらにかけらが出る(見せるための単純なルール)
        if fr > 90 and fr % 18 == 0:
            alive = [s_ for s_ in sats if s_["alive"]]
            if alive and frags:
                t = rnd.choice(alive)
                t["alive"] = False
                for _ in range(min(60, 15 + len(frags) // 3)):
                    frags.append(dict(a=t["a"] + rnd.uniform(-0.05, 0.05), r=t["r"], v=rnd.uniform(-0.016, 0.016), dr=rnd.uniform(-1.2, 1.2)))
                hits.append((fr, 0, 0))
        for s_ in sats:
            if s_["alive"]:
                x, y = CX + s_["r"] * math.cos(s_["a"]), CY + s_["r"] * math.sin(s_["a"]) * 0.92
                d.rectangle([(x - 6) * SS, (y - 3) * SS, (x + 6) * SS, (y + 3) * SS], fill=(200, 220, 255))
        for f_ in frags:
            x, y = CX + f_["r"] * math.cos(f_["a"]), CY + f_["r"] * math.sin(f_["a"]) * 0.92
            d.ellipse([(x - 2) * SS, (y - 2) * SS, (x + 2) * SS, (y + 2) * SS], fill=(255, 150, 90, 220))
        for hf, _, _ in hits:
            if 0 <= fr - hf < 10:
                k = fr - hf
                tgt = sats[0] if hf == 60 else None
                if tgt is not None:
                    x, y = CX + tgt["r"] * math.cos(tgt["a"]), CY + tgt["r"] * math.sin(tgt["a"]) * 0.92
                    d.ellipse([(x - 10 - 4 * k) * SS, (y - 10 - 4 * k) * SS, (x + 10 + 4 * k) * SS, (y + 10 + 4 * k) * SS], outline=(255, 230, 120, 255 - 25 * k), width=4 * SS)
        _box(d, (24, 24, 380, 92), "かけら: %d個" % len(frags), (255, 206, 190), fb)
        d.text((w / 2 * SS, (h - 20) * SS), "連鎖のイメージ図(数や速さは実際とは違います)", font=fs, fill=(200, 210, 240, 210), anchor="mm")
        im2.convert("RGB").resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def ep013():
    kessler("ep013_kessler")


def lightday(name, w=1300, h=600, frames=330):
    """光の速さで、地球から太陽・海王星・ボイジャー1号まで(距離は対数目盛り)。光の粒が進み、かかった時間を数える。"""
    d_ = _out(name)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 34 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 26 * SS)
    X0, X1, Y = 110, w - 110, 330
    # (名前, 地球からの距離[天文単位], 光でかかる時間の表示)
    pts = [("地球", 0.0026, ""), ("月", 0.00257, "1.3秒"), ("太陽", 1, "約8分"), ("海王星", 30, "約4時間"), ("ボイジャー1号", 173, "約1日")]
    lg = lambda au: math.log10(au)
    a0, a1 = lg(0.002), lg(320)
    xpos = lambda au: X0 + (X1 - X0) * (lg(au) - a0) / (a1 - a0)
    for fr in range(frames):
        im = Image.new("RGB", (w * SS, h * SS), (16, 20, 44)); d = ImageDraw.Draw(im, "RGBA")
        d.line([(X0 * SS, Y * SS), (X1 * SS, Y * SS)], fill=(150, 170, 220), width=4 * SS)
        t = min(1, max(0, (fr - 20) / 260))
        xl = X0 + (X1 - X0) * t
        d.line([(X0 * SS, Y * SS), (xl * SS, Y * SS)], fill=(255, 233, 150), width=8 * SS)
        d.ellipse([(xl - 12) * SS, (Y - 12) * SS, (xl + 12) * SS, (Y + 12) * SS], fill=(255, 250, 200))
        for k, (nm, au, tt) in enumerate(pts):
            if nm == "月":
                continue
            x = xpos(au) if nm != "地球" else X0
            col = (120, 180, 255) if nm == "地球" else (255, 190, 80) if nm == "太陽" else (140, 170, 255) if nm == "海王星" else (255, 233, 150)
            r = 16 if nm != "ボイジャー1号" else 10
            d.ellipse([(x - r) * SS, (Y - r) * SS, (x + r) * SS, (Y + r) * SS], fill=col, outline=(255, 255, 255), width=2 * SS)
            nx = x + (50 if nm == "ボイジャー1号" else 0)
            d.text((nx * SS, (Y - 55) * SS), nm, font=fb, fill=(240, 240, 255), anchor="mm")
            if tt and xl >= x - 2:
                by = Y + (150 if nm == "ボイジャー1号" else 75)
                bx = x - (50 if nm == "海王星" else 0)
                d.line([(x * SS, (Y + 14) * SS), (x * SS, (by - 30) * SS)], fill=(255, 233, 150), width=2 * SS)
                _box(d, (bx - 95, by - 30, bx + 95, by + 30), "光で" + tt, (255, 233, 150), fs)
        d.text((w / 2 * SS, (h - 24) * SS), "距離は対数目盛り(右へ行くほど縮めて描いています)", font=fs, fill=(200, 210, 240, 210), anchor="mm")
        im.resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def ep014():
    lightday("ep014_lightday")


def giant_impact(name, w=1200, h=720, frames=330):
    """火星くらいの天体(テイア)が若い地球にぶつかり、飛び散った岩から月ができる(模式図)。"""
    import random
    d_ = _out(name)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 22 * SS)
    CX, CY, RE, RT = 560, 380, 120, 64
    rnd = random.Random(21)
    stars = [(rnd.randint(0, w), rnd.randint(0, h), rnd.choice([1, 1.5, 2])) for _ in range(140)]
    deb = [(rnd.uniform(0, 2 * math.pi), rnd.uniform(1.25, 2.1), rnd.uniform(2, 6), rnd.uniform(0.02, 0.05)) for _ in range(420)]
    for fr in range(frames):
        im = Image.new("RGBA", (w * SS, h * SS), (16, 14, 30, 255))
        d = ImageDraw.Draw(im, "RGBA")
        for x, y, r in stars:
            d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=(255, 250, 230, 150))
        hit = 80
        lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
        # 若い地球(どろどろに溶けた岩の星)
        glow = 0 if fr < hit else max(0, 1 - (fr - hit) / 120)
        ld.ellipse([(CX - RE) * SS, (CY - RE) * SS, (CX + RE) * SS, (CY + RE) * SS], fill=(150 + int(90 * glow), 70 + int(60 * glow), 50))
        ld.ellipse([(CX - RE + 20) * SS, (CY - RE + 16) * SS, (CX + RE - 50) * SS, (CY + RE - 70) * SS], fill=(255, 140, 70, 60 + int(120 * glow)))
        if fr < hit + 6:  # テイアが近づく
            p = _ease(min(1, fr / hit))
            tx, ty = CX + 520 - (520 - RE - RT + 30) * p, CY - 240 + (240 - 70) * p
            ld.ellipse([(tx - RT) * SS, (ty - RT) * SS, (tx + RT) * SS, (ty + RT) * SS], fill=(170, 150, 130), outline=(220, 200, 180), width=3 * SS)
            if fr < hit:
                ld.text((tx * SS, (ty - RT - 26) * SS), "テイア(火星くらい)", font=fs, fill=(240, 230, 220), anchor="mm")
        if hit <= fr:  # 飛び散った岩が地球のまわりを回り、やがて集まって月になる
            k = fr - hit
            gather = min(1, max(0, (k - 120) / 110))
            for a, rr, r, v in deb:
                ang = a + v * k
                rad = RE * (1 + (rr - 1) * min(1, k / 30))
                mx, my = CX + 2.6 * RE * math.cos(0.9), CY + 2.6 * RE * math.sin(0.9) * 0.45
                x = CX + rad * math.cos(ang); y = CY + rad * math.sin(ang) * 0.45
                x = x + (mx - x) * gather; y = y + (my - y) * gather
                ld.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=(255, 170 - int(60 * gather), 90, 200))
            if k < 14:
                ld.ellipse([(CX + RE - 40 - 8 * k) * SS, (CY - 70 - 8 * k) * SS, (CX + RE + 40 + 8 * k) * SS, (CY - 70 + 8 * k + 80) * SS], fill=(255, 240, 180, 230 - 15 * k))
            if gather >= 1:
                mx, my = CX + 2.6 * RE * math.cos(0.9), CY + 2.6 * RE * math.sin(0.9) * 0.45
                ld.ellipse([(mx - 34) * SS, (my - 34) * SS, (mx + 34) * SS, (my + 34) * SS], fill=(210, 205, 200), outline=(250, 250, 250), width=3 * SS)
                ld.text((mx * SS, (my + 56) * SS), "月", font=fb, fill=(240, 240, 240), anchor="mm")
        im.alpha_composite(lay)
        d = ImageDraw.Draw(im, "RGBA")
        d.text((CX * SS, (CY - RE - 30) * SS), "若い地球", font=fs, fill=(240, 230, 220), anchor="mm")
        lab = "約45億年前" if fr < hit else ("岩が蒸発して飛び散る" if fr < hit + 120 else "集まって、月になる")
        _box(d, (30, 30, 400, 100), lab, (255, 233, 150), fb)
        d.text((w / 2 * SS, (h - 20) * SS), "有力な説にもとづく模式図(大きさや時間は実際とは違います)", font=fs, fill=(200, 210, 240, 210), anchor="mm")
        im.convert("RGB").resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def ep015():
    giant_impact("ep015_impact")


def saa_map(name, w=1200, h=680, frames=270):
    """南大西洋の磁気の弱い場所(南大西洋異常帯)が、2014年から2025年にかけて広がるようす(おおよその模式図)。"""
    sys.path.insert(0, str(ROOT / "tools"))
    import geo_maps as G
    d_ = _out(name)
    base, P = G.draw_map(G.load(), G.projector("eqearth"), (w, h), highlight=False, lat_range=(-60, 83))
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 22 * SS)
    big = base.resize((w * SS, h * SS), Image.LANCZOS).convert("RGBA")
    def blob(cx, cy, rx, ry):
        return [P(cx + rx * math.cos(a), cy + ry * math.sin(a)) for a in [k / 48 * 2 * math.pi for k in range(48)]]
    for fr in range(frames):
        t = _ease(min(1, max(0, (fr - 30) / 180)))
        im = big.copy()
        lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
        ld.polygon(blob(-45 + 8 * t, -25 - 2 * t, 33 + 14 * t, 19 + 4 * t), fill=(214, 52, 52, 90), outline=(214, 52, 52, 220))
        if t > 0.35:  # 2020年以降、アフリカの南西で弱まり方が速い
            u = (t - 0.35) / 0.65
            ld.polygon(blob(4, -36, 6 + 12 * u, 5 + 7 * u), fill=(214, 52, 52, 120), outline=(214, 52, 52, 230))
        im.alpha_composite(lay)
        d = ImageDraw.Draw(im, "RGBA")
        year = 2014 + round(11 * t)
        _box(d, (30, 30, 300, 100), f"{year}年", (255, 233, 150), fb)
        if t > 0.6:
            x, y = P(4, -36)
            _box(d, (x / SS + 40, y / SS + 10, x / SS + 360, y / SS + 80), "アフリカの南西で\n弱まり方が速い", (255, 206, 190), fs)
        x, y = P(-45, -5)
        d.text((x, y), "磁気が弱い場所", font=fb, fill=(150, 30, 30), anchor="mm")
        d.text((w / 2 * SS, (h - 16) * SS), "形と範囲はおおよその模式図(ESA Swarm の報告をもとに作成)", font=fs, fill=B.INK, anchor="mm")
        im.convert("RGB").resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def ep016():
    saa_map("ep016_saa")
    timeline("ep016_reversal", [
        (0.08, "約77万年前", "最後の逆転", RED, 1),
        (0.45, "2020年", "地層が「チバニアン」に", GREEN, -1),
        (0.9, "今", "弱い場所が広がる", B.INK, 1),
    ], h=600)


def robot_grab(name, w=900, h=640, frames=300):
    """配膳ロボの棚の料理を、別の席の人が取ってしまう(模式図)。最後に音声で知らせる新しい機能。"""
    d_ = _out(name)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 28 * SS)
    for fr in range(frames):
        im = _canvas(w, h); d = ImageDraw.Draw(im, "RGBA")
        # 通路と席
        d.rectangle([0, 420 * SS, w * SS, 470 * SS], fill=(236, 226, 210))
        for k, (x, lab) in enumerate([(150, "Aの席"), (450, "Bの席"), (750, "Cの席")]):
            d.rounded_rectangle([(x - 120) * SS, 500 * SS, (x + 120) * SS, 600 * SS], 16 * SS, fill=(255, 250, 240), outline=B.INK, width=4 * SS)
            d.text((x * SS, 550 * SS), lab, font=fb, fill=B.INK, anchor="mm")
        # ロボ: 右から来て、Bの席の前で止まる
        p = _ease(min(1, fr / 60))
        rx = 860 - (860 - 450) * p
        d.rounded_rectangle([(rx - 90) * SS, 120 * SS, (rx + 90) * SS, 430 * SS], 26 * SS, fill=(250, 250, 252), outline=B.INK, width=5 * SS)
        d.ellipse([(rx - 60) * SS, 130 * SS, (rx + 60) * SS, 200 * SS], fill=(60, 60, 70))
        for ex in (-25, 25):
            d.ellipse([(rx + ex - 8) * SS, 155 * SS, (rx + ex + 8) * SS, 171 * SS], fill=(120, 230, 255))
        trays = [(230, "Aの肉", (255, 206, 190)), (300, "Bの肉", (255, 233, 150)), (370, "Cの肉", (214, 240, 222))]
        taken = fr > 140
        for k, (ty, lab, col) in enumerate(trays):
            d.rectangle([(rx - 80) * SS, ty * SS, (rx + 80) * SS, (ty + 6) * SS], fill=B.INK)
            if k == 0 and taken:
                continue
            d.rounded_rectangle([(rx - 64) * SS, (ty - 44) * SS, (rx + 64) * SS, (ty - 4) * SS], 10 * SS, fill=col, outline=B.INK, width=3 * SS)
            d.text((rx * SS, (ty - 24) * SS), lab, font=fs, fill=B.INK, anchor="mm")
        if 90 < fr <= 140:  # Bの席の人の手が、Aの段へ
            q = _ease((fr - 90) / 50)
            hx, hy = 450 - 140 + 80 * q, 520 - 330 * q
            d.line([(410 * SS, 520 * SS), (hx * SS, hy * SS)], fill=(240, 200, 170), width=26 * SS)
            _box(d, (20, 30, 470, 100), "Bの席の人が、Aの段から取る", (255, 206, 190), fs)
        if taken:
            _box(d, (20, 30, 470, 100), "Aの席には、肉が届かない", (255, 206, 190), fs)
            # Aの席へ空の段で向かう矢印
            d.text((150 * SS, 470 * SS), "?", font=B.F_TITLE(60 * SS), fill=(214, 52, 52), anchor="mm")
        if fr > 210:
            _box(d, (560, 130, 890, 240), "新しい機能:\n別の席の料理を取ると\n音声でお知らせ", (214, 240, 222), fs)
        d.text((w / 2 * SS, (h - 22) * SS), "しくみの模式図", font=fs, fill=B.INK, anchor="mm")
        im.resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def ep013b():
    robot_grab("ep013b_robot")
    flow("ep013b_neutral", [
        (20, 40, 580, 140, "「わざとじゃない」\n(責任の否定)", (255, 233, 150)),
        (620, 40, 1180, 140, "「だれも損してない」\n(害の否定)", (255, 233, 150)),
        (20, 200, 580, 300, "「店が悪い」\n(被害者の否定)", (255, 206, 190)),
        (620, 200, 1180, 300, "「みんなやってる」\n(非難する側への非難)", (255, 206, 190)),
        (320, 360, 880, 460, "「仲間のためだから」\n(より高い忠誠)", (214, 240, 222)),
    ], [], per=30)


def ep014b():
    flow("ep014b_four", [
        (20, 40, 580, 170, "危ない人の心\n(なぜ事件を起こしたのか)", (255, 206, 190)),
        (620, 40, 1180, 170, "暴力\n(何が起きたのか見たい)", (255, 160, 160)),
        (20, 230, 580, 360, "体のこと\n(けがや死のあと、体はどうなるか)", (255, 233, 150)),
        (620, 230, 1180, 360, "見えない恐怖\n(心霊・超常現象)", (214, 226, 246)),
        (250, 440, 950, 560, "どれも「危険の情報」を集めたい気持ち", (214, 240, 222)),
    ], [], per=28)
    flow("ep014b_sim", [
        (20, 60, 360, 190, "安全な場所で\n怖い話を見る", (214, 226, 246)),
        (430, 60, 770, 190, "心の中で\n「もし自分なら」", (255, 233, 150)),
        (840, 60, 1180, 190, "怖さに慣れる・\n備え方を考える", (214, 240, 222)),
        (300, 320, 900, 440, "現実の危機での\n気持ちの立て直しに役立つ?(研究中)", (255, 206, 190)),
    ], [(0, 1, "", B.INK), (1, 2, "", B.INK), (2, 3, "", (214, 52, 52))], per=30)


def hollow_flood(name, w=1200, h=640, frames=300):
    """高台のくぼ地に雨水が集まる断面図。川から離れていても、下水があふれると低い所にたまる。"""
    d_ = _out(name)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 30 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 26 * SS)
    # 地面の高さ(左は川沿いの低地、右は高台。高台の中にくぼ地)
    def ground(x):
        if x < 260: return 470
        if x < 380: return 470 - (x - 260) * 1.6
        base = 278
        if 640 < x < 900:  # くぼ地
            return base + 70 * math.sin(math.pi * (x - 640) / 260)
        return base
    xs = list(range(0, w + 1, 6))
    for fr in range(frames):
        im = _canvas(w, h); d = ImageDraw.Draw(im, "RGBA")
        d.rectangle([0, 0, w * SS, 220 * SS], fill=(220, 228, 240))
        rain = min(1, fr / 60)
        for k in range(90):  # 雨
            x = (k * 137 + fr * 9) % w
            y = (k * 59 + fr * 23) % 260
            d.line([(x * SS, y * SS), ((x - 6) * SS, (y + 18) * SS)], fill=(110, 150, 210, int(160 * rain)), width=2 * SS)
        poly = [(x * SS, ground(x) * SS) for x in xs] + [(w * SS, h * SS), (0, h * SS)]
        d.polygon(poly, fill=(214, 196, 160), outline=B.INK)
        d.line([(x * SS, ground(x) * SS) for x in xs], fill=B.INK, width=4 * SS)
        # 下水管(高台)
        d.rectangle([420 * SS, 400 * SS, 1160 * SS, 424 * SS], fill=(160, 160, 170), outline=B.INK, width=2 * SS)
        d.text((1150 * SS, 446 * SS), "下水管(1時間に約50mmまで)", font=fs, fill=B.INK, anchor="rm")
        # 川(左の低地)
        d.rectangle([0, 450 * SS, 200 * SS, 470 * SS], fill=(110, 160, 220))
        d.text((100 * SS, 500 * SS), "川", font=fb, fill=B.INK, anchor="mm")
        # くぼ地にたまる水
        lvl = max(0, min(1, (fr - 90) / 150))
        if lvl > 0:
            top = 278 + 70 - 64 * lvl
            pts = [(x, max(top, 0)) for x in range(640, 901, 4) if ground(x) > top]
            if len(pts) > 2:
                wp = [(x * SS, top * SS) for x, _ in pts] + [(x * SS, ground(x) * SS) for x, _ in reversed(pts)]
                d.polygon(wp, fill=(90, 150, 220, 200))
        if fr > 60:
            _box(d, (30, 20, 470, 90), "1時間に100mm超の雨(8月)", (255, 233, 150), fs)
        if fr > 150:
            _box(d, (420, 480, 860, 590), "川から離れた高台の\nくぼ地に水がたまる", (255, 206, 190), fs)
        d.text((770 * SS, 240 * SS), "高台", font=fb, fill=B.INK, anchor="mm")
        d.text(((w - 20) * SS, (h - 18) * SS), "断面の模式図(高さは誇張)", font=fs, fill=B.INK, anchor="rm")
        im.resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def ep015b():
    hollow_flood("ep015b_hollow")


def believers_bar(name, w=1200, h=660, frames=240):
    """日本の人口と、宗教団体が報告した信者数の合計をくらべる棒グラフ(伸びるアニメ)。"""
    d_ = _out(name)
    fb = B.F(("ZenMaruGothic_900Black.ttf"), 34 * SS)
    fs = B.F(("ZenMaruGothic_700Bold.ttf"), 26 * SS)
    X0, MAXV, BW = 260, 18000, 620
    rows = [("日本の人口", [(12374, (150, 190, 230), "")], "約1億2374万人", "2024年12月"),
            ("信者数の合計", [(8636, (255, 190, 160), "神道系"), (8046, (255, 226, 150), "仏教系"), (187 + 636, (200, 220, 200), "")], "約1億7505万人", "2024年末")]
    for fr in range(frames):
        im = _canvas(w, h); d = ImageDraw.Draw(im, "RGBA")
        for k, (lab, segs, total, when) in enumerate(rows):
            y = 150 + k * 220
            q = _ease(min(1, max(0, (fr - 20 - k * 70) / 60)))
            d.text(((X0 - 20) * SS, (y + 40) * SS), lab, font=fb, fill=B.INK, anchor="rm")
            x = X0
            for v, col, sl in segs:
                wv = BW * v / MAXV * q
                d.rectangle([x * SS, y * SS, (x + wv) * SS, (y + 80) * SS], fill=col, outline=B.INK, width=3 * SS)
                if sl and q > 0.9:
                    d.text(((x + wv / 2) * SS, (y + 40) * SS), sl, font=fs, fill=B.INK, anchor="mm")
                x += wv
            if q >= 1:
                d.text(((x + 16) * SS, (y + 26) * SS), total, font=fb, fill=B.INK, anchor="lm")
                d.text(((x + 16) * SS, (y + 62) * SS), when, font=fs, fill=(120, 100, 90), anchor="lm")
        if fr > 170:
            px = X0 + BW * 12374 / MAXV
            d.line([(px * SS, 120 * SS), (px * SS, 470 * SS)], fill=(214, 52, 52), width=4 * SS)
            _box(d, (px - 220, 500, px + 240, 570), "人口より約5千万人多い", (255, 206, 190), fb)
        d.text((w / 2 * SS, (h - 18) * SS), "文化庁「宗教年鑑 令和7年版」・総務省「人口推計」より作成", font=fs, fill=B.INK, anchor="mm")
        im.resize((w, h), Image.LANCZOS).save(d_ / f"{fr:03d}.png")


def ep016b():
    believers_bar("ep016b_bar")
    flow("ep016b_double", [
        (60, 60, 540, 180, "神社の「氏子」として\n数えられる", (255, 190, 160)),
        (660, 60, 1140, 180, "お寺の「檀家」としても\n数えられる", (255, 226, 150)),
        (300, 300, 900, 420, "同じ1人が、2回数えられる", (255, 206, 190)),
    ], [(0, 2, "", B.INK), (1, 2, "", B.INK)], per=30)


def ep009():
    cme("ep009_cme")
    timeline("ep009_history", [
        (0.0, "1859年", "電信機が火花", RED, 1),
        (0.3, "1989年", "カナダで大停電", RED, -1),
        (0.58, "2022年", "衛星 約40基が落下", BLUE, 1),
        (0.8, "2024年", "日本でオーロラ", GREEN, -1),
        (0.97, "今回", "10月9日 到着", B.INK, 1),
    ], h=620)


def ep006():
    if not (REFS / "ep006_cannon").exists():
        cannonball("ep006_cannon")
    orbit("ep006_orbit", label_a="スターシップ")


def ep007():
    if not (REFS / "ep007_tree").exists():
        tree_move("ep007_tree")
    timeline("ep007_timeline", [
        (0.0, "1984年", "発見", BLUE, 1),
        (0.2, "1990年", "最古級の爬虫類に", GREEN, -1),
        (1.0, "2026年", "正体が判明", RED, 1),
    ], span=(0.2, 1.0, "36年間の“勘違い”"), h=620)


def ep008():
    peru_map("ep008_map")
    eras("ep008_eras", [("ナスカ文化", 1, 750, (255, 206, 190)), ("ワリ文化", 500, 1000, (198, 226, 246))], x0=0, x1=1000)


if __name__ == "__main__":
    globals()[sys.argv[1]]()
