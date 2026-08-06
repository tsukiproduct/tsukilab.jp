# -*- coding: utf-8 -*-
"""
素材切り出しツール（仕様書 §14）

assets/_source/ の元シートから assets/ 配下の各素材を再生成する。
このプロジェクト内だけで完結する。外部フォルダを参照しないこと。

    python tools/crop.py

【重要】assets/ 配下の生成物は直接編集しないこと。編集してもここを再実行すると消える。
        素材を直したいときは座標をこのファイルで直す。

元シート（すべて assets/_source/）:
    symbols_v2_source.png  図柄8種×通常/発光。docs/STYLE.md 準拠でGPT生成
                            （docs/prompts/02_symbols.md）→ assets/symbols/
    16_41_33 (1672x941)  ステージ背景 8種       → assets/bg/
    16_41_41 (1672x941)  メニュー枠のみ流用      → assets/frame/menu_bg
    16_41_19, 16_41_22, 16_41_27, 16_41_36, 16_41_45
        未使用（旧図柄シート・旧筐体・キャラ表情差分・旧告知/カットイン・エフェクト）
    panel_logo_v2_source.png  下パネル専用。docs/STYLE.md 準拠でGPT生成
                               （docs/prompts/01_panel_logo.md）→ assets/frame/panel_logo*
    cabinet_bezel_source.png    リール窓ベゼル（§5.5実写寄り。docs/prompts/03_cabinet.md A）
    cabinet_buttons_source.png  STOP/MAX BET各状態（同 B）
    cabinet_lever_source.png    レバー通常/作動時（同 C）
    cabinet_seg_source.png      7セグ表示枠（同 D）→ いずれも assets/frame/
    an_{title,big,regb,atstart,s6}_v2_source.png  告知5点。メインキャラクター専用
                               （docs/prompts/04_character_announce.md）→ assets/announce/
    cutin_v2_source.png         カットイン3段階（同上・縦3段）→ assets/cutin/
"""
from PIL import Image, ImageDraw, ImageEnhance
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "_source")
OUT = os.path.join(ROOT, "assets")

written = []


def load(stamp):
    return Image.open(os.path.join(SRC, f"ChatGPT_Image_2026年7月16日_{stamp}.png")).convert("RGB")


def out_dir(sub):
    d = os.path.join(OUT, sub)
    os.makedirs(d, exist_ok=True)
    return d


def save_jpg(im, sub, key, maxw=None, q=82):
    if maxw and im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    path = os.path.join(out_dir(sub), key + ".jpg")
    im.save(path, quality=q)
    written.append((f"{sub}/{key}.jpg", im.width, im.height))


def save_png(im, sub, key, maxw=None):
    if maxw and im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    path = os.path.join(out_dir(sub), key + ".png")
    im.save(path)
    written.append((f"{sub}/{key}.png", im.width, im.height))


# ========== 1. 図柄: docs/STYLE.md 準拠でGPT生成した専用ソース（8行×2列・左=通常/右=発光） ==========
# 旧シート(16_41_27)由来の図柄は配色がスタイルガイド外だったため廃止。
# docs/prompts/02_symbols.md のプロンプトで生成した画像をここに置く。
#
# 【重要】行の高さは均等ではない（AIの生成グリッドがズレている。BAR/リプレイの行は
# 7/ベル/スイカ等より縦に狭い）。1254/8の均等割りで切ると隣の図柄が写り込む。
# SYM_ROW_BOUNDS はグリッド線を重ねた画像で実測した値（tools/ の測定手順は
# docs/prompts/02_symbols.md 参照）。生成し直した場合は必ず測定し直すこと。
SYM_NAMES = ["red7", "blue7", "bar", "replay", "bell", "melon", "cherry", "star"]
SYM_ROW_BOUNDS = [0, 182, 349, 487, 630, 776, 925, 1065, 1254]  # 1254想定。別サイズなら比例配分
_sym_src = os.path.join(SRC, "symbols_v2_source.png")
if os.path.exists(_sym_src):
    import numpy as np
    sym2 = Image.open(_sym_src).convert("RGB")
    sw, sh = sym2.size
    col_split = sw // 2   # 生成時に列境界が中央からずれる場合はここを実測値に直す
    scale = sh / 1254      # SYM_ROW_BOUNDS は1254基準。生成解像度が違っても比例で追従する
    A = np.asarray(sym2).astype(int)
    spread = A.max(axis=2) - A.min(axis=2)
    # 区切り線は薄いグレー(R≈G≈B)なので、彩度(最大-最小)か十分な明るさで図柄本体と区別する
    mask = (A.sum(axis=2) > 260) | (spread > 25)
    PAD = 5
    for i, nm in enumerate(SYM_NAMES):
        y0, y1 = round(SYM_ROW_BOUNDS[i] * scale), round(SYM_ROW_BOUNDS[i + 1] * scale)
        left = mask[y0:y1, 0:col_split]
        right = mask[y0:y1, col_split:sw]
        ys_l, xs_l = np.where(left)
        ys_r, xs_r = np.where(right)
        if len(xs_l) == 0 or len(xs_r) == 0:
            print(f"⚠ {nm}: bbox検出失敗。symbols_v2_source.png を確認"); continue
        # 通常/発光で縦範囲がズレるとリール上で図柄がガタつくので、両方合わせた範囲に揃える
        ty0 = min(ys_l.min(), ys_r.min()); ty1 = max(ys_l.max(), ys_r.max())
        ny0, ny1 = max(y0, y0 + ty0 - PAD), min(y1, y0 + ty1 + PAD)
        nx0, nx1 = max(0, xs_l.min() - PAD), min(col_split, xs_l.max() + PAD)
        gx0, gx1 = max(0, col_split + xs_r.min() - PAD), min(sw, col_split + xs_r.max() + PAD)
        save_jpg(sym2.crop((nx0, ny0, nx1, ny1)), "symbols", f"sym_{nm}", maxw=300, q=85)
        save_jpg(sym2.crop((gx0, ny0, gx1, ny1)), "symbols", f"sym_{nm}_g", maxw=300, q=85)
else:
    print("⚠ symbols_v2_source.png が無いので図柄をスキップ（docs/prompts/02_symbols.md 参照）")

# ========== 2. ステージ背景 (16_41_33) 2行 × 4列 ==========
# 仕様書§14.4の順: 通常A／通常B／高確／前兆／BIG中／REG中／AT中／完走
BG_MAP = {
    (0, 0): "bg_st_a",    (0, 1): "bg_st_b", (0, 2): "bg_koukaku", (0, 3): "bg_zencho",
    (1, 0): "bg_big",     (1, 1): "bg_reg",  (1, 2): "bg_at",      (1, 3): "bg_kanso",
}
bg = load("16_41_33")
for (r, c), key in BG_MAP.items():
    x0, y0 = c * 418 + 6, r * 470 + 3
    save_jpg(bg.crop((x0, y0, x0 + 406, y0 + 462)), "bg", key, maxw=480, q=80)

# ========== 3. 告知パネル: メニュー枠のみ旧シート(16_41_41)から流用 ==========
an = load("16_41_41")
# メニュー／データ表示画面の枠（仕様書§14.4「タイトル・メニュー背景」の2枚目）
save_jpg(an.crop((425, 4, 689, 471)), "frame", "menu_bg", maxw=440, q=80)

# ========== 3b. 告知（タイトル/BIG/REG/AT START/設定6）: メインキャラクター専用ソース ==========
# 2026-08-05 ユーザー指定のキャラクター(assets/_source/character_ref.jpeg)に変更。
# docs/prompts/04_character_announce.md のプロンプトで生成した画像をここに置く。
# an_title のみ #titleov（画面全体オーバーレイ）用で縦長のまま。他4点は #announce
# （液晶ストリップ内・実測1.6:1の横長）用なので横長で作ること。均等割りしない場合は
# 実測して座標を直す（docs/prompts/02_symbols.md の測定手順を参照）。
AN_V2 = ["an_title", "an_big", "an_regb", "an_atstart", "an_s6"]
for key in AN_V2:
    _src = os.path.join(SRC, f"{key}_v2_source.png")
    if os.path.exists(_src):
        save_jpg(Image.open(_src).convert("RGB"), "announce", key, maxw=900, q=85)
    else:
        print(f"⚠ {key}_v2_source.png が無いのでスキップ（docs/prompts/04_character_announce.md 参照）")

# ========== 4. カットイン: メインキャラクター専用ソース（縦3段・各コマ横長） ==========
_cutin_src = os.path.join(SRC, "cutin_v2_source.png")
if os.path.exists(_cutin_src):
    cutsheet = Image.open(_cutin_src).convert("RGB")
    cw, ch = cutsheet.size
    row_h = ch / 3
    for i, key in enumerate(["cut_w", "cut_m", "cut_s"]):  # 弱 / 中 / 強
        y0, y1 = round(i * row_h), round((i + 1) * row_h)
        save_jpg(cutsheet.crop((0, y0, cw, y1)), "cutin", key, maxw=700, q=85)
else:
    print("⚠ cutin_v2_source.png が無いのでカットインをスキップ（docs/prompts/04_character_announce.md 参照）")

# ========== 5. 筐体ハードウェア: docs/STYLE.md §5.5（実写寄りの例外）準拠でGPT生成 ==========
# 旧シート(16_41_22)由来のベゼル・ボタン・レバー・7セグは宝飾調で例外規定にも合わないため全廃止。
# docs/prompts/03_cabinet.md のプロンプトで生成した4枚をここに置く。

# ①リール窓ベゼル（単一画像。窓の位置は実測して .reel の配置%をCSS側で合わせてある）
_bezel_src = os.path.join(SRC, "cabinet_bezel_source.png")
if os.path.exists(_bezel_src):
    save_jpg(Image.open(_bezel_src).convert("RGB"), "frame", "bezel", q=88)
else:
    print("⚠ cabinet_bezel_source.png が無いのでベゼルをスキップ（docs/prompts/03_cabinet.md 参照）")


def circle_png(im, box, key):
    """ボタン類は円形に切り抜いて透過PNG化"""
    c = im.crop(box).convert("RGBA")
    s = min(c.size)
    c = c.crop(((c.width - s) // 2, (c.height - s) // 2, (c.width + s) // 2, (c.height + s) // 2))
    mask = Image.new("L", (s * 4, s * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, s * 4 - 1, s * 4 - 1), fill=255)
    c.putalpha(mask.resize((s, s), Image.LANCZOS))
    save_png(c, "frame", key, maxw=220)


# ②③ ボタン類: 2行×3列（生成グリッドはほぼ均等だったので均等割り＋タイトbboxで十分）
_btn_src = os.path.join(SRC, "cabinet_buttons_source.png")
if os.path.exists(_btn_src):
    import numpy as np
    btn = Image.open(_btn_src).convert("RGB")
    bw, bh = btn.size
    A = np.asarray(btn).astype(int)
    nonblack = A.sum(axis=2) > 30
    BTN_CELLS = [  # (row, col, key)
        (0, 0, "btn_stop"), (0, 1, "btn_stop_p"), (0, 2, "btn_stop_n"),
        (1, 0, "btn_max"), (1, 1, "btn_max_p"),
    ]
    PAD = 10
    for r, c, key in BTN_CELLS:
        y0, y1 = round(r * bh / 2), round((r + 1) * bh / 2)
        x0, x1 = round(c * bw / 3), round((c + 1) * bw / 3)
        cell = nonblack[y0:y1, x0:x1]
        ys, xs = np.where(cell)
        if len(xs) == 0:
            print(f"⚠ {key}: bbox検出失敗"); continue
        bx0, bx1 = max(x0, x0 + xs.min() - PAD), min(x1, x0 + xs.max() + PAD)
        by0, by1 = max(y0, y0 + ys.min() - PAD), min(y1, y0 + ys.max() + PAD)
        circle_png(btn, (bx0, by0, bx1, by1), key)
else:
    print("⚠ cabinet_buttons_source.png が無いのでボタンをスキップ（docs/prompts/03_cabinet.md 参照）")

# ④ レバー: 左=通常/右=作動時。実機と同じく「パネルを見下ろした角度」で球とクロームリングが
# 写っている素材を、球の周りだけタイトに切り出す（周囲の黒いパネル面は不要）。
# 通常/作動時で切り出し高さが違うと画面上でガタつくので、両者の縦範囲を揃える。
_lever_src = os.path.join(SRC, "cabinet_lever_source.png")
if os.path.exists(_lever_src):
    import numpy as np
    lever = Image.open(_lever_src).convert("RGB")
    lw, lh = lever.size
    LA = np.asarray(lever).astype(int)
    # 背景の黒パネルと区別: 彩度が高い(赤/橙)か十分明るい(クローム)画素だけを拾う
    lobj = ((LA.max(axis=2) - LA.min(axis=2)) > 60) | (LA.sum(axis=2) > 400)
    PAD = 14
    boxes = []
    for x0, x1 in [(0, lw // 2), (lw // 2, lw)]:
        ys, xs = np.where(lobj[:, x0:x1])
        if len(xs) == 0:
            boxes.append(None); continue
        boxes.append((x0 + xs.min(), ys.min(), x0 + xs.max() + 1, ys.max() + 1))
    if all(boxes):
        ty0 = min(b[1] for b in boxes) - PAD
        ty1 = max(b[3] for b in boxes) + PAD
        ty0, ty1 = max(0, ty0), min(lh, ty1)
        for (bx0, _, bx1, _), key in zip(boxes, ["lever", "lever_on"]):
            save_jpg(lever.crop((max(0, bx0 - PAD), ty0, min(lw, bx1 + PAD), ty1)),
                     "frame", key, maxw=320, q=88)
    else:
        print("⚠ レバーのbbox検出に失敗。cabinet_lever_source.png を確認")
else:
    print("⚠ cabinet_lever_source.png が無いのでレバーをスキップ（docs/prompts/03_cabinet.md 参照）")

# ⑤ 7セグ表示枠: スタジオ撮影のグレー背景が写っているので、実測済みの座標でパネル本体だけ
# タイトに切る（マウント用の耳・タブは除外。座標を測り直す手順は docs/prompts/03_cabinet.md 参照）。
# 数字はコード側で描画するため窓は生成時から空（塗り消し不要）。
_seg_src = os.path.join(SRC, "cabinet_seg_source.png")
if os.path.exists(_seg_src):
    seg2 = Image.open(_seg_src).convert("RGB")
    save_jpg(seg2.crop((135, 48, 2378, 578)), "frame", "seg_frame", q=88)
else:
    print("⚠ cabinet_seg_source.png が無いので7セグ枠をスキップ（docs/prompts/03_cabinet.md 参照）")

# ========== 5b. 下パネル（機種ロゴ）: docs/STYLE.md 準拠でGPT生成した専用ソース ==========
# 旧シート(16_41_22)由来の下パネルは配色がスタイルガイド外だったため廃止。
# docs/prompts/01_panel_logo.md のプロンプトで生成した画像をここに置く。
_panel_src = os.path.join(SRC, "panel_logo_v2_source.png")
if os.path.exists(_panel_src):
    panel = Image.open(_panel_src).convert("RGB")
    save_jpg(panel, "frame", "panel_logo", maxw=520, q=85)
    # 発光版は同一構図のまま明度・彩度を上げて作る（原則4: 光源を1つに保つ＝構図を変えない）
    glow = ImageEnhance.Color(ImageEnhance.Brightness(panel).enhance(1.22)).enhance(1.35)
    save_jpg(glow, "frame", "panel_logo_g", maxw=520, q=85)
else:
    print("⚠ panel_logo_v2_source.png が無いので下パネルをスキップ（docs/prompts/01_panel_logo.md 参照）")

# ========== 結果 ==========
print(f"生成: {len(written)}点\n")
for name, w, h in sorted(written):
    print(f"  {name:<28} {w}x{h}")
