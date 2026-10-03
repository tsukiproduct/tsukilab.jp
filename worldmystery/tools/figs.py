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
