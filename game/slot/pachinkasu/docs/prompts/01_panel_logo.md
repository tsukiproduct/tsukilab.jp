# キービジュアル①: 下パネル（機種ロゴ）

**これが全素材のトーンの基準になる。** これを確定させてから他に進むこと。
判定基準は `docs/STYLE.md` の5原則。良く見えても原則に反していたら採用しない。

- 出力先: `assets/_source/` に置いて `python tools/crop.py`
- サイズ: 横長 16:8 程度（実使用は 366x182 相当）
- 生成後: 原則2（6色以内）と原則5（情報量のメリハリ）を必ず目視で確認

---

## プロンプト

```
A horizontal signboard panel for a 1990s Japanese pachislot machine.

Subject: the machine's name logo "スロットぱちんかす" as the dominant element,
occupying roughly 60% of the panel. Chunky rounded katakana/hiragana in the style
of 1990s Japanese arcade game logos — thick strokes, heavy white-then-black double
outline, filled with a stepped three-tone gold gradient (light gold top, mid gold,
dark gold bottom, hard edges between steps, no smooth blending).

Background: pure black with a simple radial burst of straight fluorescent rays
behind the logo — one single geometric pattern only, nothing else. Rays alternate
fluorescent red and fluorescent orange, flat fills, no glow blur.

Accent: a few flat coin shapes scattered at the lower corners, drawn as simple
circles with a bold outline and two tone steps. Keep them small and sparse.

Style: 1990s Japanese pachislot cabinet panel art, screen-printed on backlit
fluorescent acrylic. Flat vector-like fills, bold uniform black outlines,
limited palette of 6 colors on pure black, stepped 3-tone shading only,
single light source from upper front, high contrast, poster-like composition
with clear focal hierarchy. Slight offset-print misregistration for authenticity.

Palette (use only these): #0A0A0F black, #FF2D2D red, #FF8A00 orange,
#FFE100 yellow, #F0C24B light gold, #B8860B dark gold, #FFFFFF white.

Negative: photorealistic reflections, ambient occlusion, volumetric lighting,
airbrush gradients, soft focus, excessive micro-detail, uniform detail density,
muted colors, pastel, purple-grey, 3D render, glossy plastic sheen, lens flare,
generic AI fantasy ornamentation, cracked stone texture, floating particles.
```

---

## 発光差分（`panel_logo_g`）について

**別々に生成しない。** 同一構図で光だけが変わったものでないと、切り替えたときにガタつく。
上のプロンプトで1枚出したあと、「同じ絵のまま、ロゴのゴールドを白熱させ、放射光を
フルオレセントイエローに寄せた発光版」として**画像編集で作る**か、生成するなら
必ず元画像を参照として渡すこと（`docs/STYLE.md` 原則4「光源は1つ」を維持）。

---

## 却下の目安

以下が出たら作り直し。

- 色数が7色を超えている／中間色が混ざっている
- ロゴ以外の場所にも同じ密度で描き込みがある（原則5違反）
- 光沢・反射がロゴの複数面に散っている（原則4違反）
- 輪郭が場所によって太さが変わる、ぼけている（原則1違反）
- 石・ヒビ・浮遊粒子など、頼んでいない「それっぽい」装飾が付いている
