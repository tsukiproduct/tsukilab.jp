# キービジュアル②: リール図柄シート（8種 × 通常/発光）

`docs/STYLE.md` の5原則に従う。判定基準は同ファイル末尾の「却下の目安」。
常時表示される最重要素材なので、下パネル以上に厳しく見ること。

- 出力先: `assets/_source/` に `symbols_v2_source.png` として保存 → `python tools/crop.py`
- レイアウト: **正方形キャンバス・8行×2列**（左列=通常／右列=発光）。既存の切り出しロジックが
  この配置を前提にしているため、レイアウト指定は変えないこと

---

## プロンプト

```
Generate this image. A reference sheet of 8 Japanese pachislot reel symbols,
arranged in a square canvas as an 8-row by 2-column grid with thin dark grey
gutter lines separating every cell. Left column = normal (matte flat colors).
Right column = the exact same symbol, same pose, same proportions, but with a
backlit fluorescent glow — brighter fill and a soft colored glow just outside
the black outline, as if lit from behind by an acrylic panel light.

Row order, top to bottom (each symbol centered in its cell, filling ~70% of
cell height, on pure black background):

1. Red "7" — bold slab-serif numeral, red fill with a stepped 3-tone gold
   outline frame around it (light gold outer edge, mid gold, dark gold inner).
2. Blue "7" — identical style to row 1 but blue fill instead of red.
3. "BAR" — the word BAR in bold blocky letters inside a rectangular gold-framed
   badge, black fill with gold outline.
4. Replay symbol — a circular arrow / recycle icon in green, simple 2-arrow
   loop, flat fill.
5. Bell — a golden bell with a red ribbon bow, classic slot-bell shape.
6. Watermelon slice — a single watermelon wedge, green rind, red flesh, black
   seeds, cut in half.
7. Cherry — two red cherries on a shared brown stem with green leaf.
8. Star medallion — a five-point star inside a circular badge outline, gold
   and yellow.

Style: 1990s Japanese pachislot reel symbol art, screen-printed flat colors.
Bold uniform black outlines on every symbol (2-3px equivalent weight), no
outline for the glow column instead use a soft colored halo. Flat vector-like
fills, stepped 2-3 tone shading only where noted, single light source from
upper front on the normal column, symmetrical and centered composition, high
contrast, poster-like clarity.

Palette (use only these plus the specific fills named per row):
#0A0A0F black background, #FF2D2D red, #FF8A00 orange, #FFE100 yellow,
#00E85A green, #00A8E8 blue, #F0C24B light gold, #B8860B dark gold,
#6B4E0F dark gold shadow, #FFFFFF white.

Avoid: photorealistic reflections, ambient occlusion, volumetric lighting,
airbrush gradients, soft focus, excessive micro-detail, uniform detail
density outside the symbols, muted colors, pastel, purple-grey, 3D render,
glossy plastic sheen, lens flare, generic AI fantasy ornamentation, cracked
stone texture, floating particles, extra symbols beyond the 8 listed, text
labels or numbers other than "7" and "BAR".

Aspect ratio: 1:1 (square).
```

---

## 取り込み手順

1. 生成された画像を保存し、`assets/_source/symbols_v2_source.png` として配置
2. `python tools/crop.py` を実行 — グリッドがずれていないか `symbols/sym_*.jpg` を目視確認
3. ズレていたら座標を測り直す（下記手順）

### 行境界の測り直し方（重要）

**AIの生成グリッドは8等分ではない。** BAR・リプレイの行は7・ベル・スイカ等より縦に狭く、
均等割り（1254÷8）で切ると隣の図柄の縁が写り込む。`tools/crop.py` の `SYM_ROW_BOUNDS` は
実測値なので、シートを生成し直したら必ず測り直すこと。

1. 画像に10px間隔のグリッド線を重ねた確認用画像を作る（Pillowで `ImageDraw.line` を
   10px刻みに引き、50px刻みは目立つ色にしてy座標をテキストで焼き込む）
2. その画像を上半分・下半分に分けて読み、各行の**上端と下端**（通常列・発光列の広い方）
   を読み取る
3. 隣り合う行の間の中間値を境界として採用する（どちらの図柄にも余裕を持たせるため）
4. `SYM_ROW_BOUNDS` を9個の値（0始まり・sh終わり）で更新

## 却下の目安（`docs/STYLE.md` に加えて）

- 8種の配置順が崩れている、または図柄が増減している
- 通常列と発光列で**構図が違う**（同一構図でないと切替時にガタつく）
- 図柄がセルからはみ出す／セル境界を跨いでいる
- 発光列が単に明るいだけでなく色相まで変わっている（原則4の光源一貫性が崩れる）
