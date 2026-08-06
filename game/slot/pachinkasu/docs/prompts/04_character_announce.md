# キービジュアル④: メインキャラクター・告知・カットイン

**方針転換（2026-08-05）**: 告知・カットインの主人公キャラクターを、ユーザー指定の
リファレンス画像（`assets/_source/character_ref.jpeg`）のキャラクターに変更する。
既存の背景・旧告知にいた黒髪男性キャラは使わない。

この4点だけ `docs/STYLE.md` の対象外。写実寄りの実写調（リファレンスに準拠）で作る。
下パネル・図柄・筐体は既存のトーンのまま変更しない。

## キャラクター設定（リファレンスからの記述）

- 金髪（プラチナブロンド寄り）・襟足短めのマッシュ系、前髪で右目が隠れる
- 見えている左目は青〜紫がかった色
- 色白、中性的な顔立ち
- 耳にフープピアス＋スタッドピアス
- 黒のジップアップパーカー（襟の高いタートルネックを下に重ね着）
- シルバーのチェーンネックレス、指に複数のシルバーリング
- 黒のスキニーパンツ、黒のレースアップブーツ（Dr.Martens系）
- 全身黒コーデ。雰囲気は退廃的・耽美・クール

## 生成方法

**同一チャット内で1枚ずつ生成する**（会話を継続すると顔の一貫性が保たれやすい）。
1枚目でリファレンス画像をアップロードして生成し、2枚目以降は「同じキャラクターで」と
参照して続ける。新しいチャットを開き直さないこと。

---

## ① タイトル画面 → `an_title_v2_source.png`

```
[reference image attached]
Using the exact character from the attached reference photos (the blond young
man with the hoodie, chain necklace, and rings — keep his face, hairstyle, and
outfit identical), generate a dramatic vertical key visual for a Japanese
pachislot (slot machine) title screen.

Composition: the character in a three-quarter pose, confident smirk, looking
toward camera, one hand reaching slightly forward. Cinematic moody lighting,
single dramatic light source from the side, dark background with subtle red
and purple ambient light (matches a neon-lit back-alley atmosphere), shallow
depth of field.

Include bold Japanese logo text "スロットぱちんかす" integrated into the lower
third of the composition, in a sharp modern metallic silver/white typographic
style that fits the character's aesthetic (not the gold cartoon style used
elsewhere).

Style: photographic, cinematic, high contrast, moody color grading (teal
shadows, warm rim light), shallow depth of field, portrait photography quality.

Aspect ratio: 3:4 (portrait).
```

---

## 液晶比率について（重要）

タイトル画面(`an_title`)は `#titleov` という**画面全体を覆うオーバーレイ**で表示されるため
縦長(3:4)のままでよい。しかし BIG BONUS / REG BONUS / AT START / 設定6 は `#announce` —
**液晶ストリップ内（実測 373:230 ≒ 1.6:1 の横長）に収まる形式**なので、縦長で作ると
文字が小さく潰れて窮屈になる。**必ず横長（16:10 前後）で、キャラクターを画面の片側に寄せ、
大きな文字がもう半分を占める構図**にする。中央に全身を置いて下に小さく文字を置く縦長ポスター
の構図は流用できない。

## ② BIG BONUS 告知 → `an_big_v2_source.png`

```
Using the same character (same face, hair, outfit as before in this
conversation), generate a dramatic horizontal (landscape) announcement banner
for a "BIG BONUS" win in a pachislot game, sized to fit a wide short display
strip (aspect ratio 16:10).

Composition: the character positioned in the LEFT third of the frame,
close-up chest-up crop, fist raised toward camera with intensity, confident/
excited expression, cropped tight so his figure reads clearly even at small
size. The RIGHT two-thirds of the frame is dominated by huge bold text
"BIG BONUS" stacked in 2 lines, filling most of the vertical space, red and
gold coloring, sharp modern condensed typography, with explosive red-orange
light burst and sparks filling the background behind both the character and
text.

Style: photographic, cinematic, high contrast, dramatic rim lighting, shallow
depth of field, dynamic motion energy. Design this so the text is legible
even when the whole image is displayed at only ~230px tall.

Aspect ratio: 16:10 (landscape).
```

---

## ③ REG BONUS 告知 → `an_regb_v2_source.png`

```
Using the same character (same face, hair, outfit as before in this
conversation), generate a dramatic horizontal (landscape) announcement banner
for a "REG BONUS" win in a pachislot game, sized to fit a wide short display
strip (aspect ratio 16:10).

Composition: the character positioned in the LEFT third of the frame,
close-up chest-up crop, cooler sharper pose than a BIG-bonus version — arms
crossed or a sideways glance, calm confident expression. The RIGHT two-thirds
of the frame is dominated by huge bold text "REG BONUS" stacked in 2 lines,
filling most of the vertical space, purple and silver coloring, sharp modern
condensed typography, with purple-blue light burst and sparks filling the
background.

Style: photographic, cinematic, high contrast, dramatic rim lighting, shallow
depth of field. Design this so the text is legible even when the whole image
is displayed at only ~230px tall.

Aspect ratio: 16:10 (landscape).
```

---

## ④ AT突入画面 → `an_atstart_v2_source.png`

```
Using the same character (same face, hair, outfit as before in this
conversation), generate a dramatic horizontal (landscape) announcement banner
for entering the bonus AT mode "MOON TIME" in a pachislot game, sized to fit
a wide short display strip (aspect ratio 16:10).

Composition: the character positioned in the LEFT third of the frame,
close-up chest-up crop, strong confident presence, dramatic backlight rim.
The RIGHT two-thirds of the frame is dominated by huge bold text "AT START"
in sharp lettering filling most of the vertical space, cool blue-white and
silver coloring, moonlight-blue and purple color grading with atmospheric
fog/haze filling the background.

Style: photographic, cinematic, high contrast, dramatic rim lighting, shallow
depth of field, moody nighttime atmosphere. Design this so the text is
legible even when the whole image is displayed at only ~230px tall.

Aspect ratio: 16:10 (landscape).
```

---

## ⑤ 設定6示唆画面 → `an_s6_v2_source.png`

```
Using the same character (same face, hair, outfit as before in this
conversation), generate a dramatic horizontal (landscape) announcement banner
implying the best machine setting ("設定6") in a pachislot game, sized to fit
a wide short display strip (aspect ratio 16:10).

Composition: the character positioned in the LEFT third of the frame,
close-up chest-up crop, triumphant confident pose, slight smile. The RIGHT
two-thirds of the frame is dominated by huge bold text "設定6" filling most
of the vertical space, gold and white coloring, warm golden light bursting
and filling the background (this screen should feel like the best possible
outcome, warm and premium).

Style: photographic, cinematic, high contrast, warm golden rim lighting,
shallow depth of field, premium/triumphant mood. Design this so the text is
legible even when the whole image is displayed at only ~230px tall.

Aspect ratio: 16:10 (landscape).
```

---

## ⑥ カットイン（弱・中・強の3段階） → `cutin_v2_source.png`

カットインも `#cutin`（液晶内・幅92%、高さは横長比率に応じて自動）に表示するため、
**各コマは横長**（実測に近い 2.2:1 程度）にする。3コマを縦に積んだシートにする。

```
Using the same character (same face, hair, outfit as before in this
conversation), generate a reference sheet of 3 pachislot "cut-in" reaction
shots stacked vertically on a dark background, thin gutter lines between
them, each cell a WIDE horizontal crop (aspect ratio about 2.2:1 — chest-up,
cropped close, filling the wide short frame) of the character with escalating
intensity of expression and lighting from top to bottom:

1. Weak (弱): subtle half-smile, calm lighting, soft blue-purple ambient glow.
2. Medium (中): more intense smirk, brighter red-orange rim light, slight
   motion in hair.
3. Strong (強): intense direct stare at camera, dramatic bright light burst
   behind him, sparks, maximum energy — this is the most exciting reaction.

Each cell must be a wide landscape crop, NOT a tall portrait crop — the
character's face/shoulders should fill the wide short frame edge-to-edge.

Style: photographic, cinematic, high contrast, consistent face/outfit across
all 3, shallow depth of field, dramatic rim lighting escalating in intensity.

Aspect ratio: overall sheet about 1:1.5 (3 rows of 2.2:1 cells stacked).
```

---

## 取り込み手順

1. 各画像を保存し、指定ファイル名で `assets/_source/` に配置
2. `tools/crop.py` に読み込み処理を追加（既存の `*_v2_source.png` パターンを踏襲）
3. カットインシートは境界を実測してから切り出す（`docs/prompts/02_symbols.md` の手順を参照）
4. `python tools/crop.py` → ブラウザで目視確認

## 却下の目安

- 顔立ち・髪型・服装が参照画像と別人になっている（会話を跨ぐと起きやすい。その場合は
  リファレンス画像を再アップロードして仕切り直す）
- 実在の有名人に酷似している（AIの写実生成でまれに起きる。似ていたら作り直す）
- 3枚のカットインで顔つきが違って見える（同一構図・同一人物でないと違和感が出る）
