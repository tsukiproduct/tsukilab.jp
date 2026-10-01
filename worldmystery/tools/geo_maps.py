#!/usr/bin/env python3
"""地図の図版を、パブリックドメインの Natural Earth データから自前で描く(権利表記が不要で、番組の絵柄に揃えられる)。
  python3 tools/geo_maps.py   -> assets/refs/ に地図画像と、グリーンランド移動アニメの連番を書き出す
"""
import io, math, sys, zipfile
from pathlib import Path
import shapefile
from pyproj import Transformer, Geod
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import build as B

OCEAN, LAND, EDGE = (200, 228, 246), (255, 250, 238), (120, 96, 80)
GREEN_C, AFRICA_C = (255, 150, 170), (255, 214, 90)
SS = 2


def load():
    z = zipfile.ZipFile(ROOT / "assets/geo/ne_50m_admin_0_countries.zip")
    base = [n for n in z.namelist() if n.endswith(".shp")][0][:-4]
    r = shapefile.Reader(shp=io.BytesIO(z.read(base + ".shp")), dbf=io.BytesIO(z.read(base + ".dbf")), shx=io.BytesIO(z.read(base + ".shx")))
    fields = [f[0] for f in r.fields[1:]]
    out = []
    for sr in r.iterShapeRecords():
        rec = dict(zip(fields, sr.record))
        pts, parts = sr.shape.points, list(sr.shape.parts) + [len(sr.shape.points)]
        rings = [pts[a:b] for a, b in zip(parts[:-1], parts[1:])]
        tag = "greenland" if rec["NAME"] == "Greenland" else ("africa" if rec["CONTINENT"] == "Africa" else "")
        out.append((tag, rings))
    return out


def projector(name):
    t = Transformer.from_crs("EPSG:4326", {"merc": "+proj=merc +datum=WGS84", "eqearth": "+proj=eqearth +datum=WGS84"}[name], always_xy=True)
    return lambda lon, lat: t.transform(lon, max(-82, min(83, lat)) if name == "merc" else lat)


def draw_map(countries, proj, size, highlight=True, extra=None, lat_range=(-60, 83)):
    W_, H_ = size
    # 表示範囲(経度-180〜180、緯度は南極を除く)
    xs = [proj(-180, 0)[0], proj(180, 0)[0]]
    ys = [proj(0, lat_range[0])[1], proj(0, lat_range[1])[1]]
    if "eq" in str(proj):
        pass
    sx = (W_ * SS - 40 * SS) / (xs[1] - xs[0])
    sy = (H_ * SS - 40 * SS) / (ys[1] - ys[0])
    s = min(sx, sy)
    ox = (W_ * SS - (xs[1] - xs[0]) * s) / 2 - xs[0] * s
    oy = (H_ * SS + (ys[1] - ys[0]) * s) / 2 + ys[0] * s
    P = lambda lon, lat: (ox + proj(lon, lat)[0] * s, oy - proj(lon, lat)[1] * s)
    im = Image.new("RGB", (W_ * SS, H_ * SS), OCEAN)
    d = ImageDraw.Draw(im)
    for tag, rings in countries:
        col = (GREEN_C if tag == "greenland" else AFRICA_C if tag == "africa" else LAND) if highlight else LAND
        for ring in rings:
            if all(lat < lat_range[0] for _, lat in ring):
                continue
            d.polygon([P(lon, lat) for lon, lat in ring], fill=col, outline=EDGE, width=SS)
    if extra:
        for ring in extra:
            d.polygon([P(lon, lat) for lon, lat in ring], fill=GREEN_C + (0,), outline=(214, 52, 52), width=4 * SS)
    return im.resize((W_, H_), Image.LANCZOS), P


def area_on_plane(rings, proj):
    tot = 0
    for ring in rings:
        pts = [proj(lon, lat) for lon, lat in ring]
        tot += abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1])) / 2)
    return tot


def rotate_rings(rings, frm, to, t):
    """球面上で frm(経度,緯度) から to へ、割合 t だけ形を保ったまま移動する(大きさは本当の大きさのまま)"""
    def vec(lon, lat):
        lo, la = math.radians(lon), math.radians(lat)
        return (math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la))
    a, b = vec(*frm), vec(*to)
    ax = (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
    n = math.sqrt(sum(c * c for c in ax)); k = tuple(c / n for c in ax)
    ang = math.acos(max(-1, min(1, sum(x * y for x, y in zip(a, b))))) * t
    c, s_ = math.cos(ang), math.sin(ang)
    def rot(v):
        kv = sum(x * y for x, y in zip(k, v))
        kx = (k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0])
        return tuple(v[i] * c + kx[i] * s_ + k[i] * kv * (1 - c) for i in range(3))
    out = []
    for ring in rings:
        r2 = []
        for lon, lat in ring:
            x, y, z = rot(vec(lon, lat))
            r2.append((math.degrees(math.atan2(y, x)), math.degrees(math.asin(max(-1, min(1, z))))))
        out.append(r2)
    return out


def texture(C, w=2048, h=1024, highlight=True):
    """正距円筒(経度・緯度がそのまま縦横)の地図テクスチャ。地球儀に貼る"""
    im = Image.new("RGB", (w, h), OCEAN)
    d = ImageDraw.Draw(im)
    P = lambda lon, lat: ((lon + 180) / 360 * w, (90 - lat) / 180 * h)
    for tag, rings in C:
        col = (GREEN_C if tag == "greenland" else AFRICA_C if tag == "africa" else LAND) if highlight else (214, 236, 196)
        for ring in rings:
            d.polygon([P(lon, lat) for lon, lat in ring], fill=col, outline=EDGE)
    return im


def globe(tex, lon0, lat0, size=640):
    """3Dの地球儀を1枚描く(正射影 + 光の陰影 + 大気のふち)"""
    import numpy as np
    T = np.asarray(tex).astype(np.float32)
    th, tw = T.shape[:2]
    n = size
    y, x = np.mgrid[0:n, 0:n].astype(np.float32)
    x = (x - n / 2) / (n * 0.44); y = -(y - n / 2) / (n * 0.44)
    r2 = x * x + y * y
    inside = r2 <= 1
    z = np.sqrt(np.clip(1 - r2, 0, 1))
    la0, lo0 = math.radians(lat0), math.radians(lon0)
    # 視点の回転(画面座標 -> 地球の座標)
    lat = np.arcsin(np.clip(y * math.cos(la0) + z * math.sin(la0), -1, 1))
    lon = lo0 + np.arctan2(x, z * math.cos(la0) - y * math.sin(la0))
    u = ((np.degrees(lon) + 180) % 360) / 360 * (tw - 1)
    v = (90 - np.degrees(lat)) / 180 * (th - 1)
    col = T[v.astype(int), u.astype(int)]
    light = np.array([-0.45, 0.5, 0.74]); light /= np.linalg.norm(light)
    shade = 0.62 + 0.38 * np.clip(x * light[0] + y * light[1] + z * light[2], 0, 1)
    col = col * shade[..., None]
    out = np.zeros((n, n, 4), np.float32)
    out[..., :3] = col; out[..., 3] = inside * 255
    # 大気のふち(やわらかい水色の輪)
    rim = np.clip(1 - np.abs(np.sqrt(r2) - 1.0) / 0.035, 0, 1) * (r2 > 0.9)
    out[..., :3] = out[..., :3] * (1 - rim[..., None] * 0.6) + np.array([150, 205, 245]) * rim[..., None] * 0.6
    out[..., 3] = np.maximum(out[..., 3], rim * 255)
    im = Image.fromarray(out.clip(0, 255).astype("uint8"), "RGBA")
    bg = Image.new("RGBA", (n, n), (247, 243, 234, 255)); bg.alpha_composite(im)
    return bg.convert("RGB")


def main():
    C = load()
    merc, eqe = projector("merc"), projector("eqearth")
    gl = [r for tag, rings in C if tag == "greenland" for r in rings]
    af = [r for tag, rings in C if tag == "africa" for r in rings]
    ratio_merc = area_on_plane(af, merc) / area_on_plane(gl, merc)
    ratio_eq = area_on_plane(af, eqe) / area_on_plane(gl, eqe)
    print(f"メルカトル図法の地図上: アフリカはグリーンランドの {ratio_merc:.2f} 倍に見える / Equal Earth: {ratio_eq:.1f} 倍")
    out = ROOT / "assets/refs"
    draw_map(C, merc, (1280, 1000))[0].save(out / "map_mercator.png")
    draw_map(C, eqe, (1280, 640))[0].save(out / "map_equal_earth.png")
    # グリーンランドを本当の大きさのまま、アフリカの上へ動かすアニメ(メルカトル上で縮んでいく)
    seq = out / "seq_greenland_move"; seq.mkdir(exist_ok=True)
    n = 72
    for i in range(n + 1):
        t = B.ease(i / n)
        moved = rotate_rings(gl, (-41, 72), (20, 4), t)
        im, _ = draw_map(C, merc, (1280, 1000), extra=moved)
        im.save(seq / f"{i:03d}.png")
    # 3Dの地球儀: グリーンランドから、ゆっくり回ってアフリカへ
    tex = texture(C)
    gs = out / "seq_globe_rotate"; gs.mkdir(exist_ok=True)
    n = 90
    for i in range(n + 1):
        t = B.ease(i / n)
        globe(tex, -42 + (20 - -42) * t, 62 + (12 - 62) * t).save(gs / f"{i:03d}.png")
    print("->", out)


if __name__ == "__main__":
    main()
