# キービジュアル③: 筐体パーツ（ベゼル／ボタン・レバー／7セグ枠）

**この4点だけ `docs/STYLE.md` §5.5「筐体ハードウェアの例外」に従う。**
液晶側（下パネル・図柄）はフラットイラストのままだが、ベゼル・ボタン・レバー・7セグ枠は
「実物に近い質感」＝金属のブラッシュ目・樹脂の艶・写実的な陰影を許可する。ただし光源は
1つに固定し、輪郭線は使わない（実物に縁取り線は無い）。完全フォトリアルではなく
「触れそうな質感」が目標。

4枚に分けて生成する（1枚に詰め込むとAIが崩れやすいため）。

- 出力先: `assets/_source/` に指定のファイル名で保存 → `python tools/crop.py`
- 各生成後、下記「却下の目安」で判定してから取り込むこと

---

## A. リール窓ベゼル → `cabinet_bezel_source.png`

```
Generate this image. A photorealistic slot machine reel-window bezel frame,
viewed straight-on, for 3 vertical reel windows side by side sharing one
continuous frame. The frame itself is the only content; the 3 window openings
are pure flat black (nothing drawn inside — reels are composited behind this
in code, so the openings must stay perfectly flat #000000, no gradient, no
vignette inside the windows).

Material: injection-molded gold-lacquered plastic/metal trim, like a real
1990s Japanese pachislot cabinet. Brushed-metal micro-texture on the flat
faces, a crisp specular highlight along the top edge from a single light
source above-front, soft realistic ambient occlusion in the inner corners
where the frame meets the black windows, subtle drop shadow. Straight bars
and sharp angular corner brackets (no jewels, no gemstones, no ornate curling
filigree — this is a mass-produced cabinet part, not jewelry). Small flat
Phillips-head screw details at the corners, realistic but not shiny chrome.

No outline strokes anywhere — this is a physical object, not an illustration.
Single consistent light source from upper-front; do not add rim lighting or
glow effects.

Palette: base gold tones near #F0C24B / #B8860B / #6B4E0F with realistic
metallic value variation from the lighting (not flat steps), on a pure black
background outside the frame.

Avoid: gemstones, jewels, red accents, ornate baroque scrollwork, cartoon
outlines, flat vector shading, neon glow, lens flare, fantasy ornamentation,
cracked textures, floating particles, multiple light sources.

Aspect ratio: 3:2 (landscape).
```

---

## B. ボタン類（STOP×3状態 + MAX BET×2状態） → `cabinet_buttons_source.png`

```
Generate this image. A reference sheet of photorealistic pachislot cabinet
buttons, arranged in a 2-row by 3-column grid on pure flat black background,
thin dark grey gutter lines between cells, each button centered and filling
~75% of its cell, all lit from the same single upper-front light source.

Row 1 — round STOP button (real arcade-style pushbutton), 3 states left to
right:
1. Normal: glossy red injection-molded plastic dome, realistic specular
   highlight near the top, subtle reflection, black plastic bezel ring around
   it with a faint brushed-metal texture.
2. Pressed: same button visibly recessed into its housing, slightly darker
   red, highlight compressed and dimmer, small realistic shadow gap around
   the rim showing it's pushed in.
3. Lit (navi active): same button, unpressed, but the black bezel ring has a
   bright warm amber-orange backlit glow emanating from a thin internal ring
   light (like a real illuminated arcade button), button face slightly
   brighter red-orange from the glow.

Row 2 — round MAX BET button, 2 states, then repeat state 1 in the 3rd cell:
1. Normal: brushed silver metal button face with realistic metallic sheen,
   black plastic outer bezel, "MAX BET" engraved/printed in black bold
   sans-serif text across the middle, realistic small drop shadow under the
   text.
2. Pressed: same button recessed, slightly darker metal tone, text unchanged.
3. (repeat) Normal STOP button again, identical to row 1 cell 1.

Material: real injection-molded plastic and brushed metal, photographic
lighting, no illustration outlines anywhere. Single consistent light source
from upper-front across all six cells.

Avoid: cartoon outlines, flat vector shading, multiple light sources,
unrealistic rainbow reflections, lens flare, fantasy ornamentation, extra
buttons beyond those specified.

Aspect ratio: 3:2 (landscape).
```

---

## C. レバー（通常／作動時） → `cabinet_lever_source.png`

**注意（2026-08-05 修正・2回）**:

1回目の失敗: 黒い箱状のハウジングが大きすぎて「工場の産業用スイッチ」に見えた。
実機のレバーは**筐体パネルから短いシャフトと球状グリップが突き出しているだけ**で、
大きな箱型の台座は無い。

2回目の失敗: 箱は消えたが**カメラアングルが真横**で、床に立っている置物に見えた。
実機のレバーは水平な操作パネル上にあり、**プレイヤーは斜め上から見下ろす**。つまり
クロームのベースリングは「真円の楕円（パネル面に寝ている）」に見え、シャフトは
強く foreshorten されてほぼ見えない。**見下ろし角度の指定が必須**。

最終的に採用したのは、球をほぼ真上から見下ろし、クロームリングが楕円に見える構図。
出力は左右ともほぼ正方形（320x375前後）になり、他のボタンと同じ面に並べられる。

```
Generate this image. Two states of a photorealistic Japanese pachislot (slot
machine) start lever, side by side on pure flat black background with a thin
dark grey gutter line between them, each centered in its half, viewed
straight-on at a slight downward angle.

IMPORTANT REFERENCE: a real Japanese pachislot start lever is just a large
glossy sphere on a SHORT chrome shaft, protruding directly out of the machine's
control panel through a small round chrome escutcheon/base ring. There is NO
large rectangular box housing, NO industrial switch enclosure, NO tall pedestal.
The ball is the dominant element (roughly 60-65% of the frame height), the
shaft is short (about 25% of the frame height), and the base is just a thin
circular chrome collar where it meets the panel.

Left = normal: deep translucent red glossy acrylic ball grip catching a single
crisp specular highlight from upper-front, short polished chrome shaft, thin
circular chrome base collar, subtle contact shadow.

Right = activated (lever pulled / lit): identical composition, proportions,
camera angle and framing, but the red ball glows warmly from within with an
amber-orange internal light, and the chrome shaft and collar pick up warm
reflected light from the glow.

Material: real glossy translucent acrylic and polished chrome, photographic
studio lighting, no illustration outlines. Single consistent light source from
upper-front on both states.

Avoid: rectangular box housings, industrial switch enclosures, tall pedestals,
gold trim bands, cartoon outlines, flat vector shading, multiple light sources,
lens flare, fantasy ornamentation.

Aspect ratio: 1:1.4 (two cells side by side, each roughly 1:2.8 tall).
```

---

## D. 7セグ表示枠 → `cabinet_seg_source.png`

```
Generate this image. A photorealistic horizontal display bezel for a
pachislot cabinet, containing 3 equal rectangular recessed display windows
side by side, each with a label engraved/printed above it: "CREDIT",
"PAYOUT", "GAME" in bold gold small-caps lettering matching real cabinet
signage fonts. The windows themselves are pure flat black recesses (digits
are drawn in code, not here — do not draw any digits or numbers inside).

Material: black injection-molded plastic panel with a brushed gold-metal trim
outline around the whole bezel and around each individual window, realistic
recessed depth (subtle inner shadow where each window sinks into the panel).
Small round indicator lights near the left and right edges (2-3 tiny red
LEDs), realistic glossy LED look with a small bright specular point, faint
glow.

Lighting: single consistent light source from upper-front, realistic but
restrained — this is a mass-produced cabinet part, not a jewel.

Avoid: orange/cyan sci-fi tech accents, circuit-board motifs, italic or
script fonts, cartoon outlines, flat vector shading, lens flare, any digits
or numbers drawn in the windows, multiple light sources.

Aspect ratio: 4:1 (wide horizontal strip).
```

---

## 取り込み手順（共通）

1. 各画像を保存し、指定ファイル名で `assets/_source/` に配置
2. `tools/crop.py` に読み込み処理を追加（`panel_logo_v2_source.png` / `symbols_v2_source.png` と同じ
   フォールバックパターン）。生成物の実際のグリッド位置は必ず実測してから座標を決める
   （`docs/prompts/02_symbols.md` の「行境界の測り直し方」を参照。均等割りを信用しない）
3. `python tools/crop.py` → ブラウザで目視確認

## 却下の目安

- ベゼルに宝石・曲線的な唐草模様が入っている（旧素材と同じ失敗）
- イラスト風の輪郭線が付いている（この4点は縁取り線を使わない）
- 光源が複数ある、または反射がバラバラの方向を向いている
- 7セグ枠にオレンジ／シアンなど配色表にない色が混ざっている、または窓に数字が焼き込まれている
- プラスチックのテカリ・金属反射が過剰でファンタジー装飾寄りになっている
- **レバーが真横アングルで「床に立つ置物」に見える**（見下ろし角度でないと実機に見えない）
- レバーに箱型ハウジング・産業用スイッチのような台座が付いている
