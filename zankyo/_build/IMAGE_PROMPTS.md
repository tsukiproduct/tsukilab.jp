# 残響 — 画像プロンプト集（GPT 画像生成用）

## 使い方

1. 下の「場面プロンプト」を一つ選ぶ。
2. その後ろに、「共通スタイル：ECHO CEL」を**全文そのまま**続けて貼る。
3. 出てきた画像を PNG のまま、指定のファイル名で `zankyo/assets/img/` に置く。
   置くだけで、サイトに自動で表示されます（ビルド不要）。置かない枠は、画像なしの文字組みのまま成立します。

| 比率 | GPT のサイズ指定 | 使う場所 |
|---|---|---|
| 2:3 縦 | 1024×1536 | トップ、本の表紙 |
| 3:2 横 | 1536×1024 | 各章の扉 |
| 1:1 | 1024×1024 | 資料室のカード |

- 画像の中に**読める文字は入れません**（日本語は崩れるため）。看板や紙面は「読めない灰色の線」として描かせています。
- **時計の文字盤を「3時」にしない**のが全体のルールです。三時は、本文の中でだけ意味を持たせます。
- 遺体、流血、刃物は一枚も描きません。事件は「残された物」で示します。

---

## 共通スタイル：ECHO CEL（残響セル）

添付いただいた実写用の物理リアリズム指示を、アニメ表現へ移し替えたものです。核は一つだけ。

> **背景（記録の層）は、実在のカメラが受け取る光と物質の通りに描く。人物と、誰かが覚えている物（記憶の層）は、手で塗ったセル画として描く。そして二つの層は、ぴったりとは重ならない。**

アニメ制作の工程そのもの（背景美術、セル、仕上げ、撮影、原画の青鉛筆、影指定の赤線、色指定の番号）を、完成画面に意味として残します。誰も見たことがない理由は、技法ではなく**「どれだけ覚えられているかで、描かれ方が変わる」**という規則にあります。

```
ART DIRECTION: ECHO CEL

Treat the subject, location, time of day, weather, mood, and emotional tone defined in the scene description as absolute.

This image is a frame of hand-made Japanese animation, built from two physically separate layers that were photographed together under one camera, and that do not perfectly align.

THE TWO LAYERS

The record layer is everything that would still exist if no one remembered it: architecture, streets, rooms, furniture, weather, screens, signage, light itself. Paint the record layer as a background painting with full physical credibility. Determine how this exact place would appear if a real camera were present at this exact moment. Light must come from identifiable sources: sky, cloud cover, windows, fluorescent tubes, sodium or LED streetlights, screens, signage. Respect direction, color temperature, falloff and occlusion. Surfaces bounce light softly onto nearby surfaces. Wet pavement stretches reflections according to its roughness. Glass transmits, reflects and refracts at the same time and carries fingerprints, dust and water marks where hands and weather would leave them. Distant objects lose contrast through real air. Do not brighten, do not darken, do not apply a fashionable grade. If the place is dark, let it be dark. If it is mundane, keep it mundane. Allow cables, vents, drains, stains, seams and repairs to exist because the place needs them.

The memory layer is everything that exists because someone remembers it: people, and the small personal objects a person would keep. Paint the memory layer as traditional cel animation: clean ink trace lines of even weight, flat opaque fills, exactly one shadow tone and at most one highlight tone per material. No gradients, no airbrush, no soft rendering inside the cel. The cel layer inherits the scene's light only through its fill colors: under fluorescent light the shadow tone leans green, under sodium light it leans amber, in rain it loses saturation. It never receives photographic texture.

REGISTRATION DRIFT

The memory layer sits slightly off its peg. Offset the entire cel layer by a small, consistent distance relative to where it should sit on the background, and offset each paint fill a little from its own ink line, as if the paint was applied to the back of a cel that later slipped. The drift amount is meaningful: the more an element is being forgotten, the larger its drift. A remembered object drifts by a hair. A person who is being forgotten drifts visibly. Nothing drifts so far that the image becomes a glitch effect. Never use digital glitch, RGB split, scanlines or datamosh. The misalignment is physical, like two sheets of acetate and paper under glass.

THE FORGETTING GRADIENT

Draw each person and object only to the degree that it is remembered in this scene.
- Fully remembered: finished ink line, full flat paint, one shadow, one highlight.
- Fading: paint fills begin to fall away inside the ink line, leaving patches of bare transparent cel through which the background painting shows.
- Nearly forgotten: no paint, only the clean-up ink line.
- Forgotten: only the rough animation drawing in light blue construction pencil, with faint red shadow-indication lines and small handwritten color-reference numbers placed where paint was never applied. These production marks are the only "text" allowed, and they must be tiny, sparse and illegible as words.
Faces follow the same rule first. The face is always the first thing to be forgotten.

ONE COLOR THAT SOMEONE KEPT

Exactly one object in the frame is painted in a saturated ballpoint-pen blue (close to #2A45B0). It is the thing someone in this scene is holding on to. Everything else uses colors sampled from the actual light of the place, restrained and believable. Do not add any other saturated accent.

RAIN AS OVERWRITE

When there is rain, render the rain and any wet glass in the record layer with photographic accuracy. Where a water streak or droplet crosses the memory layer, the ink line beneath it softens and bleeds slightly, as if water-based ink was touched. Rain may only ever erase memory, never add to it. Do not add rain where the scene does not have rain.

CAMERA AND COMPOSITION

The camera is a physical object in the space, at a believable height and distance. Reject the first obvious composition and the safe professional one. Let the frame be discovered: foreground objects may partially block the view, a subject may face away, important information may sit near the edge, unused space may remain unused. Lens behavior must be consistent with the implied focal length. Depth of field follows real optics, applied to the record layer only; the cel layer stays crisp even when it should be out of focus, which is itself part of the effect.

EXPOSURE

Expose for the actual light. Some of the background may fall into shadow or clip in highlights. The cel layer is never lit by invisible fill light. A person standing under weak light has dim, desaturated fills.

MATERIALS IN THE RECORD LAYER

Paper has fiber, thickness and handled edges. Concrete has aggregate, seams and water stains. Painted metal shows the earlier coats where it has chipped. Plastic keeps its molding and wear. Imperfection always has a cause: touch, weather, friction, age.

WHAT TO AVOID

No glossy anime light rays, no bloom haze, no lens flare unless a real source causes it, no particles, no sparkles, no teal and orange grade, no symmetrical staging, no concept-art spectacle, no beauty-retouched faces, no idol poses. No legible text anywhere in the image: posters, screens, books and signs show only illegible gray marks. No clock face showing three o'clock. No weapons, no blood, no bodies. No real people, logos, brands or existing characters.

CONSISTENCY

Maintain this art direction exactly: physically accurate painted background, flat-painted cel characters with clean ink line, small physical registration drift, the forgetting gradient, and a single ballpoint-blue object. Maintain each character's design and the art style across every image in this series.

FINAL PRINCIPLE

Do not ask how to make this frame more cinematic. Ask what a real camera would have received from this place, and then ask how much of each person in it is still remembered. Paint exactly that much.
```

---

## 人物の見た目アンカー（全画像で共通）

場面に登場するときは、この記述を場面プロンプトの [Subject] にそのまま入れてください。

| 人物 | アンカー（英語でそのまま使う） |
|---|---|
| 高橋 誠 | Japanese man in his late forties, lean, short dark hair graying at the temples, light stubble, tired attentive eyes, a worn navy waterproof coat with frayed cuffs, plain gray shirt. |
| 高橋 由花 | Japanese woman aged twenty, shoulder-length black hair loosely tied back with a few strands loose, plain gray hoodie under an unzipped dark track jacket, worn white canvas sneakers, small contained posture. |
| 水島 美咲 | Japanese high school girl aged seventeen, short black bob, generic dark navy school blazer without any emblem, gray pleated skirt, a pale blue plastic pencil case. |
| 翔 | Japanese doctor in his early thirties, navy scrubs under a loose gray cardigan, hospital ID card turned backward on a lanyard, short hair, tired posture. |
| 英明 | Japanese man in his sixties, thin, brown wool cardigan, reading glasses on a cord, careful hands. |
| 月詠 | Japanese woman in her early fifties, slim, plain off-white blouse and dark slacks, hair tied back in a single low knot, a canvas tote bag on her shoulder. |
| 楓 | Japanese boy aged fifteen in 2012, short-sleeved white summer school shirt, slightly too-long black hair, thin wrists. Shown from behind or at the edge of frame. |

---

## 場面プロンプト

### hero.png（トップ　2:3　1024×1536）
**内容**：駅前の柱時計。雨の夕方。今の駅前（記録）の中に、撤去されたはずの時計だけが記憶として立っている。
```
[Scene]
A modern Japanese train station plaza at late afternoon in steady fine rain. Wet asphalt, a bus shelter with LED route signs, a tall thin steel pole topped by a horizontal LED information display, commuters' umbrellas at the far edge of frame. Overcast sky, the light flat and cool, the LED display giving a faint amber spill on the wet ground.
Standing in the exact place of that modern pole, slightly overlapping it, is an old four-faced station pillar clock: a round head on a slender iron column with a flared base, green paint chipped to reveal gray and then vermilion underneath. The old clock is drawn in the memory layer as finished cel with clean ink line, and it drifts noticeably from the position of the modern pole beneath it. Its hands are hidden by a water streak running down the camera's protective glass, so the time cannot be read.
[Camera]
Low viewpoint from about knee height, 35mm, close to a puddle at the bottom edge which reflects the LED display as a smeared amber line. The clock sits in the upper third, off center to the right.
[Kept color]
The only ballpoint-blue element: a child's small plastic wristwatch lying face down in the puddle in the foreground, drawn as cel, barely drifting.
```

### cover-as.png（ARTIFICIAL SALVATION 表紙　2:3）
```
[Scene]
A detective's small office on the third floor of an old mixed-use building at night, rain on the window. One of the two ceiling fluorescent tubes is failing. Through the wet window, a neon sign across the street where only one character-shaped section still glows; it must read as an abstract lit shape, not a legible character. A steel shelf of unsorted folders, three unopened envelopes on the desk edge, an empty paper cup.
[Subject]
Takahashi (use the anchor) sits at the desk seen from behind and slightly to the side, shoulders only, face turned away toward the window. He is in the "fading" state: his paint fills have partly fallen away so the office background shows through his coat.
[Action]
His right hand holds a small softcover poetry book open with his thumb. His left hand rests beside a smartphone lying face up whose screen shows a single unanswered message as a pale rectangle with no readable text.
[Camera]
Over-the-shoulder from behind his left shoulder, 40mm, the phone in focus on the record layer, the window soft.
[Kept color]
The only ballpoint-blue element: a child's blue plastic wristwatch half visible in a slightly open desk drawer, finished cel, almost no drift.
```

### cover-echo.png（残響 表紙　2:3）
```
[Scene]
A Japanese city street in cold rain under an overcast sky, early afternoon light that feels like evening. Dense digital signage on every building, all showing blurred, illegible content. Pedestrians with clear umbrellas, all rendered as record-layer silhouettes reflected in the wet pavement rather than as people.
[Subject]
In the foreground, at the bottom of the frame, a schoolgirl's hands (Misaki, use the anchor for the sleeve and skin only) hold an open ruled school notebook. Seven handwritten lines are on the page as illegible pencil-gray strokes. The hands and notebook are in the memory layer, finished cel.
[Camera]
Top-down tilted view from her eye height looking past the notebook to the street below, 28mm, the street falling away into the frame.
[Kept color]
The only ballpoint-blue element: the ink of the seventh line on the page, a single short stroke, slightly bleeding where a raindrop has landed on it.
```

### cover-mega.png（メガラバニア 表紙　2:3）
```
[Scene]
A Japanese high school corridor in June 2012, late afternoon, empty. A long row of old sliding windows with aluminum frames, the glass slightly warped so the sports field outside bends a little. Fluorescent tubes, a fire extinguisher, a faded bulletin board with illegible notices.
[Subject]
Kaede (use the anchor) stands at the far end of the corridor, seen from behind, almost entirely in the "forgotten" state: only light blue construction pencil lines and a few tiny red shadow-indication marks, no ink, no paint.
[Composition]
One-point perspective down the corridor from a low, slightly crooked handheld height, 24mm. One windowpane in the foreground shows its reflection displaced sideways by a few centimeters compared with the others, a physical defect in the glass, not a glitch.
[Kept color]
The only ballpoint-blue element: a small folded square of paper lying on the windowsill nearest the camera, finished cel, crisp.
```

### ch-as-00.png（プロローグ　3:2　1536×1024）
```
[Scene] The same detective office as the cover, night, rain. A coat thrown over a chair back, a poetry book's corner sticking out of the inner pocket.
[Subject] No people. Only the coat (memory layer, finished cel) and the room (record layer).
[Action] On the desk, a smartphone screen lights the ceiling from below; a pale empty text field glows on it.
[Camera] From the doorway, 35mm, the failing fluorescent tube cutting the frame at the top edge.
[Kept color] The poetry book's pencil-lined page edge shows a single blue thread used as a bookmark.
```

### ch-as-01.png（第1章 静寂の雨　3:2）
```
[Scene] A tidy study in a high-rise apartment at night. A laptop placed exactly parallel to the desk edge, a mouse pad squared to it, a rubber-banded stack of business cards. Rain on a large window with the city behind.
[Subject] No people. On the desk's edge, a CD-R without a case, label side up, handwritten marker on it as illegible black strokes. Next to it on the floor, a detective's grid-ruled notebook lies open with neat handwritten entries as illegible marks.
[Camera] Low, from the floor near the notebook, 28mm, the CD-R at the top edge of the desk catching the window light.
[Constraint] No body, no blood, no forensic tape, no people.
[Kept color] The handwriting in the grid notebook is ballpoint blue, finished cel; it is the only element that does not drift.
```

### ch-as-02.png（第2章 蝶の羽音　3:2）
```
[Scene] A quiet museum gallery in daytime. On a pale wall, a lighter rectangle where a framed painting hung for forty years, with two small pencil marks at the hook positions. Polished wooden floor reflecting the skylight.
[Subject] Four visitors stand scattered in the gallery, each wearing a simple folded white paper butterfly mask with black stripes. All four are in the "nearly forgotten" state: ink line only, no paint, the gallery visible through them.
[Camera] Wide, 24mm, from the corner of the room at chest height, the empty rectangle on the wall slightly off center.
[Kept color] None of the people. The only ballpoint-blue element is a short handwritten line in a small open ledger on a guard's chair by the door.
```

### ch-as-03.png（第3章 月の裏側　3:2）
```
[Scene] A small local politician's office above a shopping arcade, morning. A desk, a pile of printed A4 summary sheets held by a binder clip, a red fountain pen. Group photographs pinned to the stair landing wall in the background, faces in them unreadable at this distance.
[Subject] Asano is not shown. Only the secretary's hands (memory layer, fading) holding the summary sheets.
[Camera] Close, 50mm, from across the desk, sheets in focus, window light from the left.
[Kept color] A single ballpoint-blue underline on the top sheet, the one line the secretary marked herself.
```

### ch-as-04.png（第4章 時計の針　3:2）
```
[Scene] A Japanese train station's south roundabout at early evening in clear, dry weather, a little after sunset. Where an old pillar clock used to stand, there is now a new concrete base with a slim steel pole and a horizontal LED display showing an illegible amber line. People pass, no one stops.
[Subject] Takahashi (anchor) stands near the pole, three-quarter back view, in the "fading" state. He has just arrived too late.
[Camera] From across the roundabout behind a parked bicycle that partially blocks the lower frame, 85mm, compressing the space between him and the empty base.
[Kept color] Nothing on Takahashi. The ballpoint-blue element is a small folding umbrella, half open and drying, lying forgotten on the bench at the edge of frame although the ground is dry.
```

### ch-as-05.png（第5章 鏡の中の世界　3:2）
```
[Scene] A detective's desk at night. Two copies of the same report lie side by side: on the left a printed paper copy, on the right the same page shown on a laptop screen. The two pages are nearly identical; one paragraph differs as illegible gray lines of a different length.
[Subject] Takahashi's hand (memory layer) presses a finger onto the paper copy.
[Camera] Top-down, 35mm, the laptop's glow cooling the right half of the frame, a desk lamp warming the left half.
[Kept color] The paper copy's handwritten date in the margin is ballpoint blue. The screen version of the same page has no handwriting.
```

### ch-as-06a.png（第6章前編 新しい夜明け　3:2）
```
[Scene] A tidy one-bedroom apartment, daylight from a balcony door. A bookshelf ordered perfectly by author name. On the floor in front of it, four objects stacked vertically: a caseless CD-R, a folded white paper butterfly mask, a hardcover novel, and on top a small softcover poetry book.
[Subject] No people. The stacked objects are in the memory layer, finished cel, each drifting a little more than the one below it.
[Camera] Floor level, 50mm, the stack in the right third, the ordered shelf soft behind.
[Kept color] Pencil writing on the poetry book's inside cover, visible at its edge, is ballpoint blue.
```

### ch-as-06b.png（第6章後編 由花という証拠　3:2）
```
[Scene] A convenience store front at the end of April, fine rain, late afternoon. The store's automatic door, the eave above it, wet pavement reflecting the store's white light.
[Subject] Takahashi (anchor) stands under the eave holding a closed umbrella, in the "fading" state. Yuka (anchor) stands half outside the eave with one hand held out palm up into the rain, three-quarter back view. Yuka is drawn in finished cel, but her face is in the "nearly forgotten" state, ink line only.
[Camera] From inside the store looking out through the glass door, 35mm, the glass carrying faint reflections of shelves and fingerprints near the handle.
[Kept color] The only ballpoint-blue element is a drop of rain on Yuka's palm.
```

### ch-as-07.png（エピローグ　3:2）
```
[Scene] The same south roundabout as Chapter 4, now in the middle of an August afternoon under sudden thin rain. Commuters with umbrellas, an old woman glancing up at the LED display, two students running.
[Subject] Takahashi (anchor) stands without opening his umbrella at the base of the pole, back view, drawn in the "finished" state for the first time in the series: full paint, clean line, almost no drift.
[Camera] Long lens, 135mm, from across the plaza through passing umbrellas that partially block the frame.
[Kept color] His right hand is in his coat pocket; the edge of a child's blue plastic wristwatch strap shows between his fingers.
```

### ch-echo-00.png（残響 プロローグ　3:2）
```
[Scene] A café table with a film magazine open to an interview spread: a large still of a young man in a rainy street holding something small in his hand, and dense illegible columns of gray text. A cinema ticket stub and a seven-inch vinyl single in a plain sleeve beside it.
[Subject] No people at the table. The young man inside the magazine still is a cel figure printed on paper; the paper itself is record layer.
[Camera] Top-down, slightly rotated, 40mm, window light.
[Kept color] Nothing yet. This is the only image in the series with no ballpoint-blue element.
```

### ch-echo-01.png（第一話 記憶　3:2）
```
[Scene] A small living room at night, a turntable playing a twelve-inch record, the platter's motion slightly blurred. A smartphone lies next to the turntable showing a music app's progress bar as a plain line.
[Subject] No people. A cheap round wall clock above the shelf, drawn as memory layer, drifting; its hands are hidden behind the edge of a hanging plant so the time cannot be read.
[Camera] Low from the floor across the turntable plinth, 35mm, a warm lamp to the right, the phone's cool glow to the left.
[Kept color] The record's center label is ballpoint blue.
```

### ch-echo-02.png（第二話 境界　3:2）
```
[Scene] A library's closed stacks seen as an animation frame: one tall bookshelf filled with books.
[Subject] The same shelf is painted twice, once as background painting and once as cel, laid over each other. In the background painting the spines are in one order; in the cel overlay seven books are in different positions, so their colors do not line up and a few spines appear doubled.
[Camera] Straight-on, 50mm, a single aisle light above.
[Kept color] One thin spine, present in the background painting and missing from the cel overlay, is ballpoint blue.
```

### ch-echo-03.png（第三話 約束　3:2）
```
[Scene] A kitchen table at dawn in a Japanese apartment. Gray first light from a window. A smartphone lies face down. Three sheets of lined paper sit squared on the table, covered in handwriting as illegible gray strokes.
[Subject] No people. The three sheets are the only memory-layer element, finished cel, perfectly still.
[Camera] Seated eye height across the table, 50mm, the sheets in focus, the dark hallway door soft behind.
[Kept color] The handwriting on the three sheets is ballpoint blue.
[Constraint] Quiet and ordinary. No bodies, no emergency imagery.
```

### ch-echo-04.png（第四話 記憶　3:2）
```
[Scene] A high school classroom on a rainy morning in late November. A window left open a few centimeters. The desk in the right-front of the frame has its outer five centimeters darkened by rain blowing in. Four desks in the room are empty; two of them have their chairs missing.
[Subject] Misaki (anchor) at her desk, seen from behind and to the side, finished cel. At the empty desk diagonally in front of her, a girl's figure is in the "forgotten" state: only blue construction pencil and tiny color-reference numbers, no line, no paint.
[Camera] From the back corner of the classroom at standing height, 35mm.
[Kept color] An eraser on Misaki's desk with a tiny handwritten mark on its corner.
```

### ch-echo-05.png（エピローグ 残響　3:2）
```
[Scene] A hospital night-duty room. A metal locker half open. On the bench, a thick bundle of plain A4 sheets held by a rubber band, handwriting on the top sheet as illegible strokes. A vending machine milk-tea can, unopened, beside it.
[Subject] Sho's hands (anchor) are just pulling back from the bundle, fading state.
[Camera] 50mm at bench height, fluorescent light from above, the locker door partly blocking the left side.
[Kept color] One line at the top right of the first sheet, written in round handwriting, is ballpoint blue.
```

### ch-mega.png（メガラバニア 第3話の頭　3:2）
```
[Scene] A Japanese high school shoe locker area in the morning, June 2012. Rows of wooden shoe cubbies, a concrete floor scuffed by years of feet, an open entrance door with daylight.
[Subject] A hand (Kaede, anchor, sleeve only) holds a small square of paper folded in four, just taken from a cubby. The hand is in the "nearly forgotten" state; the paper is finished cel.
[Camera] Close, 40mm, at chest height.
[Kept color] The folded paper's handwriting, seen through the fold as a faint line, is ballpoint blue.
```

---

## 資料室のカード（1:1　1024×1024）

すべて「物だけ」。人は描きません。背景は記録の層、物は記憶の層。青は各カードに一点だけ。

| ファイル名 | 内容（英語プロンプト） |
|---|---|
| arc-menou.png | A small softcover poetry book with no author photo, lying open on a wooden desk at page forty-seven, a faint pencil line under one line of illegible text. A thin blue thread lies in the gutter as a bookmark. Night desk lamp. |
| arc-bugfix.png | A caseless CD-R on a dark wooden surface, label side up, a short handwritten marker scribble as illegible black strokes, the recordable side's rainbow edge just visible. A blue rubber band lies beside it. Window light, top-down. |
| arc-genchou.png | A folded white paper butterfly mask with black stripes, the folds soft from handling, resting on a gallery bench. One fold has a tiny blue pen mark. Skylight, 50mm. |
| arc-lunar.png | A small silver disc pendant on a thin chain, engraved with moon phases, lying on dark park gravel at night under a streetlight. The pendant is cel; the gravel is photographic. A blue fleck of paint on the chain clasp. |
| arc-eien.png | Two identical hardcover copies of the same novel side by side, both open to the last pages, the text illegible gray lines whose final paragraphs have different lengths. A blue paper strip marks one of them. Workshop desk with a watchmaker's loupe. |
| arc-ghost.png | A laptop screen in a dark room showing two columns of illegible gray text side by side, one column slightly shorter. A sticky note on the bezel with a single blue pen line. |
| arc-machi.png | A worn cinema ticket stub and a 16mm film reel can on a café table, rain on the window behind. The can's label is illegible. A blue pen circle drawn on the ticket. |
| arc-maboroshi.png | A twelve-inch vinyl record half out of a plain sleeve on a turntable mat, the run-out groove catching light. The center label is ballpoint blue and has no readable text. |
| arc-toumei.png | An old library borrowing card in a paper pocket, handwritten dates as illegible strokes, three of them clustered together. One stamp is in ballpoint blue. Library desk, lamp light. |
| arc-kiokusouchi.png | A hardcover novel with a soft, thick paper cover that a finger presses into, a gold foil band on the spine. The fingertip is cel, faint. A blue pencil note in the margin at the edge of a page. |
| arc-sankyuu.png | A cheap round wall clock on a recording-studio wall covered with acoustic foam, its face hidden behind a hanging cable so the time cannot be read. A blue strip of tape on the clock's rim. |
| arc-megalavania.png | An old CRT-era web page printed on paper and folded, a gray box in the middle where an episode list has one struck-through line. A blue pen check mark beside the struck line. Classroom desk. |

---

## 置き場所の早見表

```
zankyo/assets/img/
  hero.png
  cover-as.png  cover-echo.png  cover-mega.png
  ch-as-00.png  ch-as-01.png  ch-as-02.png  ch-as-03.png  ch-as-04.png
  ch-as-05.png  ch-as-06a.png ch-as-06b.png ch-as-07.png
  ch-echo-00.png … ch-echo-05.png
  ch-mega.png
  arc-menou.png arc-bugfix.png arc-genchou.png arc-lunar.png arc-eien.png arc-ghost.png
  arc-machi.png arc-maboroshi.png arc-toumei.png arc-kiokusouchi.png arc-sankyuu.png arc-megalavania.png
```

画像は重くなりやすいので、置く前に長辺 1600px 前後へ縮小すると表示が速くなります。形式は PNG のままで構いません。
