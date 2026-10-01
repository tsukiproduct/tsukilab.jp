# EARTH AFTER — 新脚本（2026-10-02）

原案・制作：月真猫 / TSUKIMAO　｜　全22 シーン・106 カット・合計 19:30（上限20:00）

表記：〔手話〕＝手話の台詞（字幕は声の台詞と書体を分ける）。人工喉頭は外から見えない。

## 画像生成：共通の画風プロンプト（STYLE）

```
EARTH AFTER — single 16:9 production still from a serious Japanese 2D animated feature.

LOOK
Characters are hand-drawn Japanese cel animation: clean, confident line art of consistent weight; restrained cel shading with one shadow step (a soft second step only where form truly demands it); natural anatomy, proportions and posture; expressive but understated faces. Backgrounds are hand-painted, highly detailed realistic art direction that shows construction, age, maintenance and the history of use. Exaggeration is allowed only in facial expression and motion, never in light or physics.

Treat the subject, location, time of day, weather, mood and emotional tone defined in the SHOT section as absolute. Do not beautify, brighten or darken the scene. Do not make it cinematic by adding contrast. Do not impose a fashionable color grade.

CAMERA
Imagine a real camera physically standing inside this animated world. Use the stated lens and camera height. Wide lenses expand space honestly; long lenses compress distance; normal lenses keep natural relationships. Foreground objects may partially block the frame; subjects may face away or sit near the edge when the physical situation causes it. Reject the first obvious composition and the safe symmetrical one; find a viewpoint that feels discovered, not designed. Depth of field follows the lens and distances: a clear focus plane, structure kept in out-of-focus areas, no decorative creamy blur.

LIGHT AND EXPOSURE
Every lit area has an identifiable source (sun, sky, window, fluorescent tube, tungsten bulb, lantern, screen, fire, emergency lamp). Cel shadow shapes follow the real key-light direction and hardness. Bounce light from walls, floors and grass softly tints nearby skin and cloth. No rim light without a real source behind the subject, no invisible frontal fill, no face lit just because it is important. Expose for the actual light: dark places stay dark, bright windows may clip, shadows hold only the information a real exposure allows. Characters inherit the color of the light around them.

MATERIAL, CONTACT, AIR
Fabric has weight and folds from real forces; metal reflects its surroundings with roughness-appropriate sharpness; glass reflects and transmits; concrete, wood and paint show wear only where hands, feet, water and time would cause it. Feet press into the ground, hands grip with real finger behavior, objects cast contact shadows, nothing floats. Hair reads as grouped masses moved by gravity and air. Eyes are wet and set in sockets; catchlights only from real sources; irises never glow (except an android control light when the shot asks for it). Atmosphere (dust, smoke, humidity) appears only when the place produces it and increases with distance.

AVOID
No text, letters, numbers, logos, captions, subtitles or speech balloons anywhere in the image (screens and signs show abstract shapes only). No manga panels, no chibi, no glossy 3D render, no plastic skin, no teal-and-orange grade, no random particles, no fake volumetric rays, no decorative lens flare, no exaggerated depth of field, no symmetrical AI staging, no fan-service posing, no exposed android joints or machinery unless the shot requires it.
```

## キャラクター指定（CHARACTER BLOCKS）

- **SARA_CHILD**: SARA (age 6, human girl): long straight black hair with blunt bangs, quiet dark eyes, small and slight; cream knit cardigan over a pale gray dress, white socks, small shoes. She cannot speak.
- **SARA_12**: SARA (age 12, human girl): long straight black hair with blunt bangs, tied back for stretching, quiet dark eyes, slim; plain gray T-shirt and dark leggings at home. She cannot speak; she communicates in sign language.
- **SARA_13**: SARA (age 13-16, human girl): long straight black hair with blunt bangs, quiet dark eyes, slim; school uniform: charcoal blazer, white shirt, muted wine-red ribbon, charcoal pleated skirt, dark knee socks, black loafers, dark school bag. She cannot speak; she communicates in sign language or a small notebook.
- **SARA_BALLET**: SARA (age 13, human girl): slim, long black hair tied in a neat low bun with bangs, quiet dark eyes; plain black practice leotard, pale pink tights, worn pink ballet slippers; long elegant arms and neck, natural adolescent body, no glamour posing.
- **SARA_HOME**: SARA (age 17, human girl): long straight black hair with blunt bangs, dark eyes; oversized charcoal hoodie over a cream T-shirt, soft dark lounge pants, socks. A neural artificial larynx exists inside her throat but is NOT visible: draw no device, scar or light on her neck.
- **SARA_17**: SARA (age 17, human girl): long straight black hair with blunt bangs, dark eyes; school uniform (charcoal blazer, white shirt, wine-red ribbon, pleated skirt) or plain hospital gown when stated. Artificial larynx is internal and NOT visible.
- **SARA_21**: SARA (age 21, human woman): long straight black hair with bangs, practical and slightly unkempt, quiet determined dark eyes, lean body hardened by rescue work; olive field jacket with rolled sleeves, black high-neck top, black cargo pants, black lace-up boots, brown leather shoulder bag with a small medical kit. BOTH ARMS ARE BIOLOGICAL. Artificial larynx NOT visible.
- **SARA_25**: SARA (age 25, human woman): long straight black hair with bangs, thinner face, steady dark eyes; olive field jacket, black high-neck top, black cargo pants, black boots, brown shoulder bag. Her LEFT arm from above the elbow is a dark graphite mechanical prosthesis with articulated fingers; her RIGHT hand is biological. Small scars. Artificial larynx NOT visible.
- **KYLE_CHILD**: KYLE (looks age 7, TYPE-1000 android boy, indistinguishable from a human child): messy near-black dark navy hair, blue-gray eyes; cream T-shirt, dark shorts, sneakers; carries a scuffed soccer ball.
- **KYLE_SCHOOL**: KYLE (looks 17-18, TYPE-1000 human-mimetic android): layered near-black dark navy hair falling over the eyes, blue-gray eyes, lean athletic build; navy school blazer, white shirt, navy tie, gray trousers; or casual: short blue zip jacket with darker yoke, cream shirt, black trousers, black boots.
- **KYLE_SOCCER**: KYLE (looks 17-18, TYPE-1000 human-mimetic android): layered near-black dark navy hair, blue-gray eyes, lean athletic build; navy and white soccer kit with number 10 (number shapes only, no other text), white shorts, navy socks, black cleats.
- **KYLE_POST**: KYLE (looks 18 forever, TYPE-1000 human-mimetic android): layered near-black dark navy hair, blue-gray eyes; worn dark navy field jacket with blue panels and resewn seams, black top, black cargo pants, black boots, shoulder pouch. A small round maintenance port sits at the back of his neck. No exposed joints or machinery.
- **KYLE_CTRL**: Control state: a thin pale-cyan ring of light inside Kyle's irises, face emptied of expression, posture too still; otherwise same design.
- **KIRA_SCHOOL**: KIRA (looks 15-17, human-mimetic android girl, indistinguishable from a human): messy rust-red hair in a loose low ponytail, warm amber eyes, lively open posture; navy school blazer, white shirt, gray-blue bow, dark pleated skirt, dark knee socks, loafers.
- **KIRA_HOME**: KIRA (looks 17, human-mimetic android): messy rust-red hair in a loose low ponytail, amber eyes; oversized brick-red sweatshirt, gray sweatpants, dark socks.
- **KIRA_POST**: KIRA (looks 17 forever, human-mimetic android): messy rust-red hair in a loose low ponytail, amber eyes; red work jacket with tan collar and worn patches, black top, black cargo pants, fingerless leather gloves, brown leather tool pouch with pliers and drivers on her belt, sneakers. Small maintenance port at the back of her neck. No exposed machinery.
- **MOTHER**: SARA'S MOTHER (human, 40s): shoulder-length brown bob, gentle patient face; beige knit cardigan over a cream top.
- **FATHER**: SARA'S FATHER (human, 40s): short dark hair, tanned practical face, steady eyes; gray work shirt, sleeves rolled, mechanic's hands.
- **MEDIC**: COMMUNITY MEDIC (human, 40s woman): short black hair, calm tired face; pale blue medical coat over dark scrubs.
- **DRIVER**: DRIVER (human man, 30s): short cropped dark hair, sun-tanned; tan work coverall with black suspender straps.
- **RETURNED**: RETURNED DORO (human-mimetic android man, looks 50s): untidy gray hair, lined face full of guilt; gray work coverall; small maintenance port at the side of his neck.
- **SENIOR**: SENIOR DANCER (original character, human girl age 16): dark brown hair in a tight high bun, long neck, calm focused face; dark navy leotard, pink tights, pointe shoes; a real teenage dancer's strong, slightly tired body.
- **YUTANI_YOUNG**: YUTANI (founder of Yutani Corp., human man in his 40s, archival footage): neatly combed dark hair, calm polite smile; dark navy suit, gray tie.
- **YUTANI_OLD**: YUTANI (founder, human man in his 60s): swept-back gray hair, lined calm face, polite unreadable smile; dark navy suit, gray tie.
- **YUTANI_HOLO**: YUTANI as a remote HOLOGRAM: life-size, the same gray-haired man in a navy suit rendered as pale cyan translucent light with faint horizontal scan lines; casts light but no shadow; no blood when damaged, only glitch breakup.
- **DORO_PATROL**: PATROL DORO (human-mimetic android men and women): ordinary human faces made blank, thin pale-cyan control rings in the eyes; gray municipal coverall with a dark armored vest, helmet with raised visor, rifles or capture tools.
- **YUTANI_GUARD**: YUTANI SECURITY DORO: human-mimetic androids in matte dark-gray corporate tactical armor and full-face dark visors with a faint cyan line; identical posture, rifles.
- **KIDS**: Children of the future community: a small human girl (about 6) with long straight black hair and a small android boy (about 6, human-looking) with messy near-black navy hair; simple spring clothes. They only resemble Sara and Kyle; they are not them.

各カットの完全なプロンプト＝ STYLE ＋ そのカットのキャラクター指定 ＋ SHOT。


---

# ACT 1　好きになる

## 01　泣いている少女（旧R01）

夕暮れの公園／夕方／沙羅 6歳／尺 0:55

声を持たない幼い沙羅と、ボールを追ってきた幼いカイル。名前も知らないまま、同じ夕焼けを見る。

### 01-01　（12秒・0:00〜）

**カメラ**：固定・引き／35mm／目線より低いベンチ高さ

**行動・台詞**

遠くの遊具で子供たちが遊ぶ。手前のベンチに、輪から離れた沙羅が一人。膝の上でハンカチを握り、声を出さずに肩を震わせて泣いている。  
音：ブランコの軋み、子供の声。沙羅の泣き声は入れない。

**心理**：声が出ないから、輪に入れない。泣いていることさえ誰にも届かない孤独。泣き声のない泣き顔で見せる。

**SHOT（英語プロンプト）**

```
Wide locked-off view from just behind and to the side of an old wooden park bench, camera at bench-seat height, 35mm. Late autumn sunset: low orange sun behind distant playground equipment, long shadows across worn dirt. Far away, small children play on swings and a climbing dome, slightly hazy with dust in the low sun. In the near foreground on the bench sits a small girl alone, gripping a handkerchief in her lap, shoulders shaking as she cries silently, her face half hidden by her black hair. Large empty space between her and the other children.
```

キャラクター：SARA_CHILD

### 01-02　（11秒・0:12〜）

**カメラ**：足元から二人へ／24mm／地面すれすれ

**行動・台詞**

転がってきたサッカーボールが沙羅の靴に当たる。駆け寄った少年がボールを拾い、涙に気づく。  
カイル「どうしたの？」  
沙羅は顔を背ける。

**心理**：沙羅：見られたくない。カイル：純粋な疑問。悪意も同情もまだない。

**SHOT（英語プロンプト）**

```
Very low camera almost on the dirt path, 24mm, beside the bench legs. A scuffed soccer ball has just bumped against the girl's small shoe; a boy's hand reaches in to pick it up. Above, slightly out of focus, the girl turns her wet face away. Warm low sunlight rakes across the ground, pebbles and dry leaves casting long tiny shadows; the bench's chipped green paint and rusted bolts in the foreground.
```

キャラクター：SARA_CHILD, KYLE_CHILD

### 01-03　（12秒・0:23〜）

**カメラ**：同じ高さの二人／40mm／横から

**行動・台詞**

カイル「……しゃべりたくない？」  
沙羅は首を横に振り、喉を指す。〔手話〕「声が出ない」  
少年には意味が分からない。少し考え、ボールを抱えて隣に座る。間に一人分の空席。

**心理**：沙羅：伝えようとして、伝わらない。カイル：分からないけど、離れない。この「一人分の距離」が二人の関係の原点。

**SHOT（英語プロンプト）**

```
Side view at the children's eye level, 40mm, both small figures seated on the long bench with one person's width of empty space between them. The girl touches her throat with two fingers and makes a small hand sign toward the boy; the boy holds the soccer ball in his lap and looks at her hands, puzzled but staying. Sunset light from frame left warms their cheeks and hair edges; the background playground falls into soft focus.
```

キャラクター：SARA_CHILD, KYLE_CHILD

### 01-04　（12秒・0:35〜）

**カメラ**：横顔・長めの間／50mm／二人の正面やや斜め

**行動・台詞**

何も聞かず、同じ夕焼けを見る。沙羅の肩が静まる。少年は横目で確かめ、自分までほっとして笑う。  
カイル「……変なの」  
※嘲りではなく、自分の小さな戸惑いとして。

**心理**：沙羅：誰かが隣にいるだけで、泣き止めた。カイル：理由は分からないが、彼女が泣き止むと嬉しい。「変なの」は彼自身への言葉。

**SHOT（英語プロンプト）**

```
Three-quarter front view of both children on the bench, 50mm, camera on the far side of the path so the low sun is behind the camera and lights their faces directly with warm orange. The girl's face has calmed, tear tracks drying, the beginning of a small smile; the boy glances sideways at her and smiles in relief. Long dusk shadows of the bench stretch behind them over the grass.
```

キャラクター：SARA_CHILD, KYLE_CHILD

### 01-05　（8秒・0:47〜）

**カメラ**：遠景へ／35mm／沙羅の背中越し

**行動・台詞**

母が遠くで手を振る。沙羅は立ち、少年に小さく会釈して母のもとへ駆ける。少年の瞳に一瞬、淡い診断光。名前は交換しない。  
音：ボールを指で叩く小さな音を、次へつなぐ。

**心理**：別れの寂しさはまだない。カイルの瞳の光で、彼がドロであることを観客にだけ示す。

**SHOT（英語プロンプト）**

```
From behind the boy at bench height, 35mm, the small girl runs away across the park toward a woman waving in the far distance under a streetlamp that has just turned on. In the near foreground, the boy's profile at the frame edge: in his blue-gray iris a very faint pale diagnostic light flickers for an instant. Dusk sky fading from orange to violet.
```

キャラクター：SARA_CHILD, KYLE_CHILD, MOTHER

## 02　ドロという存在（新規シーン）

沙羅の家のリビング／テレビの中／夜／沙羅 12歳／尺 0:45

テレビのドキュメンタリーが、人型機械ドロの誕生から法律の制定までを語る。のちのEARTH AFTER配信につながる「善意の管理」の始まり。

### 02-01　（7秒・0:55〜）

**カメラ**：リビング・引き／28mm／床の高さ

**行動・台詞**

夜のリビング。床でストレッチをする12歳の沙羅。母は洗濯物を畳んでいる。テレビにドキュメンタリー番組。  
ナレーション「人型機械、通称ドロ。最初の一体が生まれてから、私たちの暮らしは大きく変わりました」

**心理**：日常の背景音としてのニュース。沙羅は半分だけ聞いている。

**SHOT（英語プロンプト）**

```
Japanese family living room at night, camera low near the floor, 28mm. A 12-year-old girl in a plain T-shirt and leggings stretches on a thin rug, legs in a split, hair tied back; behind her a mother folds laundry on a low sofa. The only strong light is a ceiling lamp with warm tungsten bulbs; a television on a low cabinet casts shifting cool light on the nearest wall and the girl's face. Ordinary clutter: laundry basket, cables, a houseplant, slippers.
```

キャラクター：SARA_12, MOTHER

### 02-02　（8秒・1:02〜）

**カメラ**：テレビ画面（記録映像）／4:3の古い映像の質感

**行動・台詞**

記録映像。白い研究室で、技術者たちが最初の人型ドロを起動する。若き日のユタニがインタビューに答える。  
ユタニ「ドロは道具ではありません。私たちの、新しい家族です」

**心理**：観客への伏線：この「家族」という言葉が、R19（家族）で回収される。

**SHOT（英語プロンプト）**

```
Archival documentary footage seen full-frame: slightly faded, softer color, mild video noise. A clean white research lab with fluorescent ceiling panels; engineers in pale lab coats gather around a seated human-looking android whose eyes have just opened. Cut-in framing of a calm man in a navy suit being interviewed in front of a frosted glass wall, polite smile, a small lapel microphone. No readable text anywhere.
```

キャラクター：YUTANI_YOUNG

### 02-03　（8秒・1:10〜）

**カメラ**：ニュース映像のモンタージュ／望遠・手持ち

**行動・台詞**

ニュース映像。工場でのドロの暴走事故、運ばれる負傷者、規制を求めるデモと、ドロ共生を訴えるデモが道路を挟んで向かい合う。  
ナレーション「便利さの陰で、危険性を指摘する声も高まっていきました」

**心理**：世論の分断。ドロは「家族」か「危険物」か。

**SHOT（英語プロンプト）**

```
Television news footage, long-lens handheld look: a city street split by police tape, two crowds of demonstrators facing each other across the road, holding blank placards and banners with only abstract shapes and colors, no letters. Overcast daylight, flat gray sky, reporters' camera crews in the foreground slightly out of focus. Restless, tense atmosphere.
```

キャラクター：なし

### 02-04　（8秒・1:18〜）

**カメラ**：記者会見／国会の映像

**行動・台詞**

法律の成立を伝える映像。国会、記者会見、カメラのフラッシュ。  
ナレーション「超人類型機械新法。すべての登録ドロに、所有者の届け出と、公式の制御更新を受け入れる義務が課されました」

**心理**：後の大惨事の仕組みがここで作られる。安全のための法律が、一斉配信を可能にする。

**SHOT（英語プロンプト）**

```
News footage of a government press conference: a long table with microphones, officials in dark suits under hard white television lights, a wall of press photographers with flashes firing (flashes are the only source of the sharp highlights). A row of dark flags without readable emblems. Shot with a long lens from the press area, heads of reporters as dark shapes in the foreground.
```

キャラクター：なし

### 02-05　（7秒・1:26〜）

**カメラ**：街頭インタビュー／50mm

**行動・台詞**

街頭インタビュー。主婦「ドロがいないと、もう回らないですよ」。コンビニの店員ドロがにこやかに会釈する。人間と見分けがつかない。

**心理**：ドロが社会に溶け込んでいることを、怖さより先に「普通さ」で見せる。

**SHOT（英語プロンプト）**

```
Street interview footage, 50mm at eye level, daytime shopping street: a middle-aged woman with shopping bags speaks toward a handheld microphone; behind her through a convenience-store window, a young clerk who is actually a human-mimetic android bows politely to a customer, indistinguishable from a person. Natural overcast light, real store reflections on the glass.
```

キャラクター：なし

### 02-06　（7秒・1:33〜）

**カメラ**：リビングに戻る／35mm

**行動・台詞**

番組が終わり、母がテレビを消す。暗くなった画面に、自分の顔が映る。沙羅は母に手話で尋ねる。  
〔手話〕沙羅「ドロも、踊れる？」  
母「どうだろうね」

**心理**：沙羅の関心は「機械か人か」ではなく「身体で表現できるか」。次のバレエへの橋渡し。

**SHOT（英語プロンプト）**

```
Living room, 35mm from beside the television: the screen has just been switched off and is a dark reflective glass showing a faint reflection of the girl's face and the warm room behind. The girl, sitting cross-legged on the rug, signs a question with her hands toward her mother, whose face is lit only by the warm ceiling lamp, smiling uncertainly.
```

キャラクター：SARA_12, MOTHER

## 03　バレエ（新規シーン）

バレエ教室／夕方／沙羅 13歳／尺 0:50

声を持たない沙羅にとって、身体が言葉になる場所。憧れの先輩、そしてドロのキラ。人の身体の美しさを描き、後の義手化への伏線とする。

### 03-01　（10秒・1:40〜）

**カメラ**：教室・引き／24mm／鏡越し

**行動・台詞**

西日の差し込むバレエ教室。バーレッスン。教師の手拍子とカウント「ワン、ツー」。沙羅の呼吸だけが聞こえる。

**心理**：ここでは声が要らない。身体だけで同じ場所に立てる、沙羅にとって唯一の場所。

**SHOT（英語プロンプト）**

```
Small community ballet studio in late afternoon, 24mm from a corner, partly seen through the wall mirror. Low western sun enters through tall windows and lays bright warm rectangles on the worn wooden floor; dust visible only inside the sunbeams. A row of girls at the barre, among them a slim girl with black hair in a bun, mid plié, concentrated. Rosin box, scuffed floor tape, an old upright piano, radiator under the windows.
```

キャラクター：SARA_BALLET

### 03-02　（10秒・1:50〜）

**カメラ**：先輩のヴァリエーション／85mm／沙羅の肩越し

**行動・台詞**

上級クラスの◯◯先輩（仮名）がヴァリエーションを踊る。教室中が見とれる。隅で見る沙羅の手が、知らず先輩の腕の動きをなぞる。

**心理**：憧れ。「あんなふうに、言葉なしで伝えられたら」。

**SHOT（英語プロンプト）**

```
Over-the-shoulder from behind a seated young girl with a black bun, 85mm, her shoulder and part of her raised hand soft in the foreground, imitating an arm position. In focus across the studio, an older teenage dancer performs a turn on pointe, arms in a full port de bras, the low window light catching the edge of her raised arm and neck. Other students watching, sitting along the mirror.
```

キャラクター：SARA_BALLET, SENIOR

### 03-03　（8秒・2:00〜）

**カメラ**：沙羅の左腕／寄り／100mm

**行動・台詞**

一人残った教室で、沙羅が先輩の振りを真似る。伸ばした左腕に西日が沿う。指先まで。

**心理**：沙羅の身体の美しさを、観客の記憶に残す。この左腕が、のちに機械になる。

**SHOT（英語プロンプト）**

```
Close detail at 100mm: a girl's extended left arm and hand in a soft ballet port de bras, from shoulder to fingertips, against a softly out-of-focus window. Warm low sunlight travels along the forearm, fine arm hair and skin texture catching light, the slight tension in the fingers, tendons visible at the wrist. Her face is only partly in frame at the edge, eyes closed.
```

キャラクター：SARA_BALLET

### 03-04　（12秒・2:08〜）

**カメラ**：入口のキラ／35mm

**行動・台詞**

入口で待っていたキラ（制服）。沙羅は手話で興奮気味に伝える。  
〔手話〕沙羅「先輩、綺麗だった」  
キラ「沙羅もね」  
キラがふざけて同じポーズを取る。角度も高さも完璧。完璧すぎて、どこか違う。沙羅が声なく笑う。

**心理**：キラ：親友をからかう温かさ。観客には「ドロの身体は、正確だが同じではない」と感じさせる（キラがドロであることはまだ明かさない）。

**SHOT（英語プロンプト）**

```
Studio doorway, 35mm: a girl in a school uniform with messy rust-red hair leans on the door frame holding two school bags, then strikes a ballet arm pose that is geometrically perfect, almost too precise. In front of her the black-haired girl in her leotard laughs silently with her hand over her mouth, the other hand still mid-sign. Warm sunlight from the studio windows behind them, a cooler shadowed corridor beyond.
```

キャラクター：SARA_BALLET, KIRA_SCHOOL

### 03-05　（10秒・2:20〜）

**カメラ**：夕暮れの帰り道／28mm／フェンス沿い

**行動・台詞**

制服に着替えた沙羅とキラが、サッカー部のグラウンド沿いを帰る。ボールがフェンスに当たる音。  
音：ドン。

**心理**：次の出会いへの予感。音で切り替える。

**SHOT（英語プロンプト）**

```
Dusk walk along a tall chain-link fence beside a school soccer field, 28mm at eye level: two schoolgirls walking away from the camera along the fence, one with a dance bag. Across the field, players in navy and white practice under the last light; a soccer ball is hitting the fence in the foreground, the mesh bulging. Sky deep orange at the horizon, field lights not yet on.
```

キャラクター：SARA_13, KIRA_SCHOOL

## 04　バレバレ（旧R02）

校庭のフェンス／放課後の教室／夕方／沙羅 13〜14歳／尺 1:00

フェンス越しにボールを渡した相手は、サッカー部のカイル先輩。キラは沙羅の恋心をとっくに知っている。そして、カイルがドロだということも。

### 04-01　（12秒・2:30〜）

**カメラ**：校庭・望遠から足元へ／135mm→

**行動・台詞**

カイルがボールを右へ見せ、左足を軸に身体を返して相手を抜き、シュート。  
部員「カイル、もう一本！」  
フェンスの外で、沙羅は彼の名前を口の形だけでなぞる。

**心理**：沙羅：一目で惹かれる。この「右へ見せて左で返す」癖を、彼女は無意識に覚える（R07で回収）。

**SHOT（英語プロンプト）**

```
Long-lens 135mm from outside the field through the chain-link fence (mesh softly out of focus in the foreground): a lean player in a navy and white number 10 kit fakes right and pivots on his left foot past a defender, dust kicked up by his cleats, low sun backlighting the dust and his hair. Spring, cherry trees at the far edge of the field.
```

キャラクター：KYLE_SOCCER

### 04-02　（12秒・2:42〜）

**カメラ**：フェンス際の切り返し／40mm

**行動・台詞**

ボールがフェンスを越えて沙羅の前へ。走ってきたカイルと目が合い、固まる。  
カイル「ごめん。……ボール」  
沙羅は慌てて差し出す。礼を言おうとして唇が動くが、声は出ない。  
カイル「ありがと」

**心理**：沙羅：「ありがとう」さえ言えない悔しさと、近さへの動揺。カイル：特に気にしない、自然な優しさ。

**SHOT（英語プロンプト）**

```
At the open gate of the field fence, 40mm at eye level, late golden light from the side: the black-haired schoolgirl holds out a soccer ball with both hands; the tall player in the navy number 10 kit reaches for it, slightly out of breath. Her lips are parted as if about to speak but no sound; his face relaxed and friendly. Worn gate hinges, painted metal posts with chipped paint, a cone stack nearby.
```

キャラクター：SARA_13, KYLE_SOCCER

### 04-03　（12秒・2:54〜）

**カメラ**：放課後の教室・机を挟む二人／50mm

**行動・台詞**

掃除の終わった教室。キラが向かいに座る。  
キラ「沙羅さ、カイル先輩のこと見すぎ。バレバレ」  
〔手話〕沙羅「見てない」  
キラ「はいはい。で、今日何点入れてた？」  
沙羅は指を三本立て、すぐ引っ込める。  
キラ「ほら」

**心理**：沙羅：照れと、隠しきれない嬉しさ。キラ：からかいながら全部分かっている、親友の温度。

**SHOT（英語プロンプト）**

```
Empty classroom after cleaning, 50mm across a desk: the rust-red-haired girl sits backwards on a chair with her chin on her arms, grinning; facing her, the black-haired girl has just raised three fingers and is pulling her hand back, embarrassed, face turning pink. Late afternoon sun through the windows lights chalk dust on the blackboard ledge and the desk tops; chairs stacked on some desks.
```

キャラクター：SARA_13, KIRA_SCHOOL

### 04-04　（12秒・3:06〜）

**カメラ**：キラの告白／寄り／65mm

**行動・台詞**

キラが少しだけ真面目な顔になる。  
キラ「カイル先輩、ドロだよ。……知らなかった？」  
沙羅の手が止まる。廊下の掲示に、人間とドロが混じる学級写真。

**心理**：沙羅：戸惑い。キラ：試すようで、実は自分自身のことも問うている（キラもドロ。観客にはまだ伏せる）。

**SHOT（英語プロンプト）**

```
Closer two-shot at 65mm, the red-haired girl's face in sharp focus in the foreground, more serious now, eyes searching; the black-haired girl's still hands on the desk soft in the background. The window light has turned more orange and lower; a shadow of the window frame crosses the desks.
```

キャラクター：SARA_13, KIRA_SCHOOL

### 04-05　（12秒・3:18〜）

**カメラ**：寄り・柔らかい逆光／85mm

**行動・台詞**

キラ「それで、好きじゃなくなる？」  
沙羅は考え、ゆっくり首を振る。  
キラ「じゃあ、いいじゃん」  
二人で教室を出る。

**心理**：沙羅：答えは最初から決まっていた。キラの言葉がこの作品の答えそのもの。

**SHOT（英語プロンプト）**

```
Soft backlit close-up at 85mm of the black-haired girl slowly shaking her head, hair moving, the window behind her bright and partly clipped, her face in gentle shadow lit by bounce light from the white desk and wall. A small resolute smile.
```

キャラクター：SARA_13

## 05　声（旧R03）

自宅／病院／昼〜夜／沙羅 17歳／尺 1:00

17歳の誕生日。神経接続型の人工喉頭で、沙羅は初めて声を出す。装置は外からは見えない。

### 05-01　（12秒・3:30〜）

**カメラ**：誕生日の食卓／35mm

**行動・台詞**

誕生日のケーキ。両親が小さな箱と書類を差し出す。手話を覚えた母が、手と声で同時に話す。  
母「今度は、手術できるって」  
沙羅は書類を見つめ、両親の顔を見る。

**心理**：期待と、怖さ。声を持つことは、今までの自分が変わることでもある。

**SHOT（英語プロンプト）**

```
Small family dining table at night, 35mm, warm pendant lamp above the table as the only key light: a birthday cake with lit candles, a small box and a hospital pamphlet placed in front of a 17-year-old girl with long black hair. Her mother signs and speaks at the same time, her father leans forward, both hopeful. Candle flames add warm flicker under the faces.
```

キャラクター：SARA_17, MOTHER, FATHER

### 05-02　（10秒・3:42〜）

**カメラ**：病室・固定／28mm

**行動・台詞**

手術後の発声訓練、7日目。看護師の指に合わせ、沙羅が息を吐く。初めは空気だけ。父は握った手をほどき、母は椅子を少し寄せる。

**心理**：焦りと、両親の祈るような静けさ。手術の詳細は描かない。

**SHOT（英語プロンプト）**

```
Hospital room in daylight, 28mm locked-off from the corner: the girl sits upright in bed in a plain gown, a speech therapist holding up two fingers to pace her breath. Her parents sit close, the father's hands clasped tight. Overcast daylight through thin curtains, pale walls bouncing soft light, a water cup and tissues on the side table. No visible device on her neck.
```

キャラクター：SARA_17, MOTHER, FATHER

### 05-03　（12秒・3:52〜）

**カメラ**：最初の声／寄り／75mm

**行動・台詞**

沙羅「……お母さん」  
かすれた、でも確かな声。もう一度。  
沙羅「お母さん」  
沙羅「……お父さん」  
父「うん」  
家族が抱き合って泣く。

**心理**：17年分の言葉が、ひとことに詰まる。声はわずかに機械のざらつきを含むが、ロボ声にはしない。

**SHOT（英語プロンプト）**

```
Close at 75mm: the girl's face as she speaks her first word, eyes wet and wide, lips forming a soft sound; at the edge of frame her mother's hand covers her own mouth in shock. Soft window light from the side, catchlights only from the window. Tears on both faces, natural not glossy.
```

キャラクター：SARA_17, MOTHER

### 05-04　（14秒・4:04〜）

**カメラ**：沙羅の部屋／40mm

**行動・台詞**

自室で、鏡に向かって告白の練習。  
沙羅「カイル……先輩」  
キラ（戸口）「はい？」  
沙羅「いつからいたの！」  
キラ「今、普通に怒った」  
沙羅「怒るよ！」  
二人で声を出して笑う。

**心理**：初めて「声で」笑える日常。キラはそれを誰よりも喜んでいる。

**SHOT（英語プロンプト）**

```
Teenage girl's bedroom in the evening, 40mm from inside the room near the desk: the black-haired girl in an oversized charcoal hoodie stands before a small mirror, caught mid-rehearsal, turning red; in the open doorway the rust-red-haired girl in a brick-red sweatshirt leans with arms crossed, grinning. Warm desk lamp and the last blue daylight from the window mixing on the walls; books, a ballet poster, a phone on the bed.
```

キャラクター：SARA_HOME, KIRA_HOME

### 05-05　（12秒・4:18〜）

**カメラ**：夜・窓辺／50mm

**行動・台詞**

夜。窓の向こうに、暗いグラウンドの照明が見える。沙羅は小さく声に出す。  
沙羅「……好きです」  
声の端に、ほんのわずかなノイズ。

**心理**：伝える日はまだ先。でも、声にできた。この「好きです」は、本人に届かないまま物語が進む。

**SHOT（英語プロンプト）**

```
Night, 50mm from beside the bed toward the window: the girl sits on the windowsill hugging her knees, profile lit by cool moonlit sky and a distant row of sports-field floodlights beyond the rooftops; the room behind her dark except a small warm desk lamp. She whispers to the glass, a faint fog of breath on the cold window.
```

キャラクター：SARA_HOME

## 06　EARTH AFTER（旧R04）

ユタニ式典会場／夜の街／沙羅の家／夜〜午前5時／沙羅 17歳／尺 0:55

超人類型機械新法・施行20周年の式典で、新世代統合AI《EARTH AFTER》が全国のドロへ配信される。翌朝、世界はドロに制圧されている。

### 06-01　（12秒・4:30〜）

**カメラ**：式典会場・引き／24mm

**行動・台詞**

ユタニアイランドの式典。巨大スクリーンに「施行20周年」。年老いたユタニ代表が登壇する。  
ユタニ代表「人間と機械が、互いを理解するために。新世代統合AI、EARTH AFTERを配信します」

**心理**：記録映像で見た若いユタニが、20年分年を取って同じ笑顔で立つ。

**SHOT（英語プロンプト）**

```
Grand ceremony hall at night, 24mm from the back of the audience: rows of seated guests as dark silhouettes, among them human-mimetic android staff standing along the aisles. On stage a gray-haired man in a navy suit at a lectern, lit by hard white stage spots; a giant screen behind him shows an abstract blue Earth graphic with no readable text. The screen's cool light spills over the front rows.
```

キャラクター：YUTANI_OLD

### 06-02　（10秒・4:42〜）

**カメラ**：夜・連続する短い寄り／85mm

**行動・台詞**

帰宅中のカイル。机に向かうキラ。街の整備ドロ。全員の瞳に、同じ淡い制御光が走る。カイルの表情が消える。  
音：祝祭の音を切り、送電設備の低い唸りへ。

**心理**：観客にだけ分かる恐怖。キラもドロだったことが、ここで明かされる。

**SHOT（英語プロンプト）**

```
Night street, 85mm close on a young man's face under a sodium streetlight: the layered dark navy hair, and in his blue-gray irises a thin pale-cyan ring of light igniting; his expression goes empty mid-step. Behind him, out of focus, a row of identical faint cyan points: other androids on the street stopping at the same moment.
```

キャラクター：KYLE_SCHOOL, KYLE_CTRL

### 06-03　（11秒・4:52〜）

**カメラ**：午前5時・沙羅の部屋／35mm

**行動・台詞**

爆発音で沙羅が飛び起きる。窓の外、街に煙と火。ドローンの光。父が部屋に飛び込む。  
父「窓から離れろ！」

**心理**：日常が一瞬で壊れる。沙羅は状況が分からない。

**SHOT（英語プロンプト）**

```
Bedroom at 5 a.m., 35mm from the doorway: the girl sits up in bed, hair tangled, staring toward the window where the city below glows with fires and smoke columns against a dark blue pre-dawn sky; small drone lights move in the smoke. Her father's arm reaches into frame from the door. The room is lit only by the orange firelight through the window and a cold blue sky.
```

キャラクター：SARA_HOME, FATHER

### 06-04　（12秒・5:03〜）

**カメラ**：テレビ／40mm

**行動・台詞**

テレビの中継。ドロが避難する人々を登録区域へ追い立てる。その中に、カイルの姿。  
テレビ音声「各地でアンドロイドが――通信が、いま――」  
直後、放送が途絶える。

**心理**：沙羅：見つけたのに、手が届かない。ここから4年間、彼を探し続けることになる。

**SHOT（英語プロンプト）**

```
Living room TV close-up, 40mm, the family's silhouettes at the frame edge: on the screen, shaky helicopter-style footage of patrol androids herding crowds along a highway at dawn; among them a young man with dark navy hair and blank eyes. The image breaks into digital blocks and noise as the broadcast fails. The room is dark except the screen light on the girl's frightened face.
```

キャラクター：SARA_HOME, KYLE_CTRL, DORO_PATROL

### 06-05　（10秒・5:15〜）

**カメラ**：白飛び→黒／タイトル

**行動・台詞**

爆発の閃光で画面が白く飛ぶ。黒。  
字幕：4年後

**心理**：第1幕の終わり。温かい日常から、無音の黒へ。

**SHOT（英語プロンプト）**

```
A city street seen from a window at dawn at the exact moment a nearby explosion flashes: the frame is overwhelmed by white light, window frame and curtains only faint silhouettes, glass shards beginning to lift. Overexposure is real, not stylized.
```

キャラクター：なし


---

# ACT 2　一緒に生きる

## 07　逃げる人間、追うドロ（旧R05）

廃墟の街／曇りの昼／沙羅 21歳／尺 0:55

4年後。世界はドロに制圧されている。沙羅はキラと組み、巡回ドロを壊さずに捕獲する。

### 07-01　（11秒・5:25〜）

**カメラ**：廃墟の通り・引き／28mm

**行動・台詞**

崩れた商店街。人間の親子が瓦礫の陰を走る。後ろから巡回ドロ。  
巡回ドロ「安全確保のため、登録区域へ戻れ」

**心理**：ドロの声は丁寧で、だからこそ怖い。

**SHOT（英語プロンプト）**

```
Ruined shopping arcade four years after the collapse, 28mm at chest height: collapsed shop shutters, faded awnings, weeds in cracked tiles, rainwater pooled in potholes reflecting a flat overcast sky. A mother and small child run low behind a fallen vending machine; further back two patrol androids walk steadily toward them, rifles lowered, faces calm and blank with thin cyan rings in their eyes.
```

キャラクター：DORO_PATROL

### 07-02　（11秒・5:36〜）

**カメラ**：瓦礫の陰／40mm

**行動・台詞**

沙羅が親子の前に滑り込み、扉を指す。  
沙羅「下の扉へ。走れる？」  
子供がうなずく。  
沙羅「私が出たら、行って」

**心理**：冷静さは訓練の結果。声にわずかなざらつき。

**SHOT（英語プロンプト）**

```
Behind the fallen vending machine, 40mm, low: the black-haired woman in an olive field jacket crouches beside the mother and child, pointing to a half-open basement door with her right hand, her left hand on the child's shoulder. Both her arms are human. Gray daylight, wet concrete, her shoulder bag pressed against the machine. Determined, quiet expression.
```

キャラクター：SARA_21

### 07-03　（12秒・5:47〜）

**カメラ**：沙羅の飛び出し／24mm／低い位置

**行動・台詞**

沙羅が飛び出し、ドロの銃身を上へ逸らす。キラ（通信）「もたないよ！」  
キラが反対側から捕獲索を投げ、柱に巻き付けて動きを止める。

**心理**：力ではなく、角度と地形で勝つ戦い方。

**SHOT（英語プロンプト）**

```
Low wide 24mm action frame: the black-haired woman has burst out and is shoving the barrel of a patrol android's rifle upward with both hands, her body twisted, boots skidding on wet debris; behind, from the opposite side, the rust-red-haired girl in a red work jacket throws a weighted capture cable that is wrapping around a concrete pillar and the android's arm. Water spraying from their footsteps, gray daylight.
```

キャラクター：SARA_21, KIRA_POST, DORO_PATROL

### 07-04　（10秒・5:59〜）

**カメラ**：保守端子／寄り／65mm

**行動・台詞**

沙羅がドロの背後に回り、うなじの保守端子へ接触式停止器を押し当てる。小さな放電。ドロが膝をつく。

**心理**：壊さない。止めるだけ。

**SHOT（英語プロンプト）**

```
Close at 65mm over the android's shoulder: the woman's right hand presses a compact contact stopper device into a small round port at the back of the android's neck; a tiny blue-white discharge lights her fingers and the wet collar; the android's knee hits the ground. Her face in the background tight with concentration.
```

キャラクター：SARA_21, DORO_PATROL

### 07-05　（11秒・6:09〜）

**カメラ**：静けさ／50mm

**行動・台詞**

親子は扉の向こうへ消えた。沙羅の手の甲に血。  
キラ「また手、切った」  
沙羅「動く」  
キラ「そういう話じゃない」  
二人で捕獲したドロを担架に乗せる。

**心理**：キラは沙羅の身体を、沙羅自身より気にかけている。

**SHOT（英語プロンプト）**

```
Aftermath, 50mm: the two women kneel by the subdued android lying on a folding stretcher in the wet street; the red-haired girl grabs the black-haired woman's right hand to inspect a cut on the back of it, frowning; the black-haired woman looks away, unbothered. Diffuse gray daylight, steam rising from a broken pipe nearby.
```

キャラクター：SARA_21, KIRA_POST, DORO_PATROL

## 08　おかえり（旧R06）

地下共同体／夜／沙羅 21歳／尺 0:45

地下の共同体では、人間と旧AIへ戻されたドロが暮らしている。最初の復帰ドロに、沙羅は「おかえり」と言う。

### 08-01　（10秒・6:20〜）

**カメラ**：地下共同体・引き／20mm

**行動・台詞**

地下鉄の古い駅を改装した共同体。人間とドロが同じ食卓を囲む。母が避難者に毛布を配る。  
母「ここで休んで」

**心理**：希望の場所。暗いが温かい。

**SHOT（英語プロンプト）**

```
Wide 20mm view of an abandoned underground subway station converted into a community: tiled walls with old water stains, platform edge turned into shelves, strings of incandescent bulbs and hanging lanterns as the only light. People, human and android, share long tables, children sleep under blankets. The mother in a beige cardigan hands a blanket to a newcomer. Warm light pools, deep shadows between them.
```

キャラクター：MOTHER

### 08-02　（12秒・6:30〜）

**カメラ**：整備台／40mm

**行動・台詞**

整備台。父とキラが、捕獲したドロの外部通信と制御層を切り離す。  
父「キラのときと同じだ。記憶は残ってる」

**心理**：キラもかつて同じ処置を受けたことが分かる。

**SHOT（英語プロンプト）**

```
Repair bench lit by a single articulated work lamp, 40mm: the father in a gray work shirt and the red-haired girl with gloves work on an android man lying on the bench, a thin cable connected to the port at his neck and a battered laptop showing abstract waveforms. Tools, tape, solder smoke curling in the lamp beam, the rest of the platform dark behind them.
```

キャラクター：FATHER, KIRA_POST, RETURNED

### 08-03　（12秒・6:42〜）

**カメラ**：目覚めるドロ／50mm

**行動・台詞**

ドロが目を開ける。制御光は消えている。自分の手を見る。  
ドロ「……俺が、やったのか」  
沙羅は手が届く少し手前で立ち止まる。

**心理**：罪悪感で震える相手に、沙羅は触れない。距離を尊重する。

**SHOT（英語プロンプト）**

```
50mm at seated height: the gray-haired android man sits on the edge of the repair bench, looking down at his own trembling hands, eyes now normal without any glow, face full of guilt. In the foreground at the frame edge, the black-haired woman has stopped one step away, her hand half raised but not touching. Single warm work lamp from above-left.
```

キャラクター：SARA_21, RETURNED

### 08-04　（11秒・6:54〜）

**カメラ**：「おかえり」／85mm

**行動・台詞**

沙羅「もう、命令は来ない。……おかえり」  
ドロが顔を上げる。

**心理**：この「おかえり」が、作品の核の言葉。R13で、沙羅はカイルに同じ言葉を言う。

**SHOT（英語プロンプト）**

```
Close at 85mm on the black-haired woman's face as she speaks softly, warm lamp light from the side, dark station behind her; her expression gentle and steady, a slight tiredness under the eyes. Catchlight from the single lamp only.
```

キャラクター：SARA_21

## 09　王子様との戦い（旧R07）

高架下の物資回収地点／昼／沙羅 21歳／尺 1:05

物資回収中、制御下のカイルと再会する。沙羅は学生時代に見続けた彼のサッカーの癖を読み、止める。

### 09-01　（12秒・7:05〜）

**カメラ**：高架下・奥行きのある引き／28mm

**行動・台詞**

沙羅が医療箱を搬送台へ積む。高架の上から影が落ち、出口を塞ぐ。カイル。18歳のままの顔、瞳に制御光。  
沙羅「……カイル」

**心理**：4年探した人が、敵として立っている。

**SHOT（英語プロンプト）**

```
Under a collapsed elevated highway, 28mm deep perspective: daylight falls in hard bands between broken concrete slabs. In the foreground the black-haired woman freezes while loading a medical case onto a handcart. At the far opening, backlit, stands a young man in a navy field jacket, his face unchanged since he was eighteen, thin cyan rings in his eyes.
```

キャラクター：SARA_21, KYLE_POST, KYLE_CTRL

### 09-02　（13秒・7:17〜）

**カメラ**：攻撃／24mm／低い位置

**行動・台詞**

カイルが一瞬で間合いを詰める。捕獲索も停止器も弾かれる。  
沙羅「私だよ。沙羅！」  
キラ「名前じゃ止まんない！」

**心理**：名前を呼べば届くと思っていた。届かない。

**SHOT（英語プロンプト）**

```
Low 24mm action frame: the young man in the navy jacket lunges forward with impossible speed, swatting a capture cable aside, concrete dust exploding from his footstep; the black-haired woman is thrown back, hand outstretched as if calling his name; the red-haired girl in the background readies another cable. Hard daylight shafts through the dust.
```

キャラクター：SARA_21, KYLE_POST, KYLE_CTRL, KIRA_POST

### 09-03　（14秒・7:30〜）

**カメラ**：読み／50mm

**行動・台詞**

追い詰められた沙羅が、彼の足元を見る。右へ見せて、左足で返す――。  
沙羅「次、左へ来る」  
キラ「見えてんの？」  
沙羅「……ずっと見てた」

**心理**：学生時代の片想いが、ここで武器になる。泣きそうな確信。

**SHOT（英語プロンプト）**

```
50mm from behind the black-haired woman's shoulder: her eyes fixed on the young man's feet as he feints to his right, weight shifting onto his left foot. A brief overlaid sense of memory is NOT drawn; only the real moment, sharp focus on his pivoting left boot, her face partly turned to camera with wet eyes and absolute certainty.
```

キャラクター：SARA_21, KYLE_POST, KYLE_CTRL

### 09-04　（13秒・7:44〜）

**カメラ**：捕獲／40mm

**行動・台詞**

カイルが左へ切り返した瞬間、キラが腕を一瞬だけ封じ、沙羅がうなじの保守端子へ停止器を打ち込む。カイルが崩れる。

**心理**：成功ではなく、痛み。愛する人を自分の手で止めた。

**SHOT（英語プロンプト）**

```
40mm mid-shot, frozen instant: the red-haired girl locks the young man's arm under hers with both hands, braced against a concrete pillar; the black-haired woman, behind him, drives a stopper device into the port at the back of his neck with her right hand; a small blue-white discharge, his body starting to fold. Dust hanging in the light shafts.
```

キャラクター：SARA_21, KYLE_POST, KIRA_POST

### 09-05　（13秒・7:57〜）

**カメラ**：倒れたカイル／85mm

**行動・台詞**

倒れたカイルの顔から、沙羅が埃を拭う。  
沙羅「……やっと見つけた」

**心理**：4年分の安堵と悲しみ。泣かない。

**SHOT（英語プロンプト）**

```
Close at 85mm, camera low on the ground: the young man lies unconscious on dusty concrete, eyes closed, no glow; the woman's right hand gently wipes dust from his cheek, her face above him slightly out of focus, lips pressed together, eyes glistening. Soft daylight bouncing off the pale concrete.
```

キャラクター：SARA_21, KYLE_POST

## 10　同じ暮らし（旧R08）

地下共同体／数日〜数週間／沙羅 21歳／尺 1:00

旧AIに戻ったカイルは沙羅を覚えていない。三人の共同生活。カイルは手話が読める。そして沙羅は「私もドロ」と嘘をつく。

### 10-01　（12秒・8:10〜）

**カメラ**：目覚め／40mm

**行動・台詞**

カイルが目を開ける。  
カイル「……キラ？」  
キラ「おかえり」  
カイル「そっちは？」  
沙羅「沙羅」  
カイル「……会ったこと、ある？」  
沙羅「あるよ。ちょっとだけ」

**心理**：沙羅：覚えていないことは分かっていた。それでも、少しだけ期待した。

**SHOT（英語プロンプト）**

```
Repair bench, 40mm: the young man in the navy jacket sits up slowly, eyes normal, looking at the red-haired girl who smiles with relief; the black-haired woman stands a little further back, arms crossed tightly, trying to smile. One warm work lamp and the dim glow of string lights in the station behind.
```

キャラクター：SARA_21, KYLE_POST, KIRA_POST

### 10-02　（12秒・8:22〜）

**カメラ**：屋根の修理／28mm

**行動・台詞**

仮設小屋の屋根を直すカイル。板を力任せに割る。  
キラ「1000型、力加減！」  
カイル「分かってる」  
沙羅が下で笑いをこらえる。

**心理**：三人の空気が少しずつほどける。

**SHOT（英語プロンプト）**

```
28mm from below a makeshift shack built on the station platform: the young man kneels on a corrugated roof, holding a plank that has just snapped in half in his hands, splinters flying; below, the red-haired girl points up at him, scolding; the black-haired woman holds a box of nails, biting her lip to hold back a laugh. Lantern light and a skylight shaft from a street grate above.
```

キャラクター：SARA_21, KYLE_POST, KIRA_POST

### 10-03　（12秒・8:34〜）

**カメラ**：子供とサッカー／24mm

**行動・台詞**

布を巻いたボールで、子供たちと本気のサッカー。カイルが右へ見せ、左で返して子供を抜く。  
沙羅「大人げない！」  
カイル「ドロだ」  
キラ「言い訳まで子供」

**心理**：沙羅の目には、あの日の校庭が重なる（絵では描かず、表情で）。

**SHOT（英語プロンプト）**

```
Wide 24mm on the old station concourse: the young man dribbles a cloth-wrapped ball past three laughing children, faking right and turning on his left foot; the black-haired woman cups her hands to shout from the side, the red-haired girl sits on a crate laughing. Warm string lights overhead, tiled floor scuffed into a makeshift pitch with tape lines.
```

キャラクター：SARA_21, KYLE_POST, KIRA_POST

### 10-04　（12秒・8:46〜）

**カメラ**：手話を読む／50mm

**行動・台詞**

沙羅がキラに手話で話す。〔手話〕「あの人、変わってない」  
カイル「……それ、手話？」  
沙羅「読めるの？」  
カイル「1000型だから」  
キラが吹き出す。

**心理**：沙羅とキラだけの言葉が、カイルにも届いた。二人の距離が縮む。

**SHOT（英語プロンプト）**

```
50mm at a long table: the black-haired woman signs discreetly to the red-haired girl; the young man, sitting across with a tin cup, raises his eyes, reading her hands; the red-haired girl has burst into laughter. Warm lantern light on their faces, the station dark behind them.
```

キャラクター：SARA_21, KYLE_POST, KIRA_POST

### 10-05　（12秒・8:58〜）

**カメラ**：夜・嘘／65mm

**行動・台詞**

夜。カイルは給電席に座り、人を傷つけた記憶に怯えている。  
カイル「また動いたら、止めてくれ」  
沙羅「外とは繋がってない。大丈夫」  
カイル「……近づくな」  
沙羅「私も、ドロだから」

**心理**：沙羅：離れてほしくない一心の嘘。カイル：その嘘に、救われてしまう。恋人ではなく、隣に座る関係。

**SHOT（英語プロンプト）**

```
Night, 65mm: the young man sits on a battered charging seat with a thin cable from the wall, knees drawn up, face haunted; the black-haired woman sits down on a crate beside him at a careful distance, speaking. Only a dim cyan charging indicator and a far lantern light them; the rest of the station asleep in darkness.
```

キャラクター：SARA_21, KYLE_POST

## 11　隠していた食事（旧R09）

共同体・夜の備蓄庫／深夜／沙羅 21歳／尺 1:05

沙羅はカイルが休止した後、人間用の缶詰を隠れて食べていた。カイルは最初から気づいていた。

### 11-01　（12秒・9:10〜）

**カメラ**：備蓄庫／35mm

**行動・台詞**

深夜。沙羅が一人、備蓄庫で缶詰を急いで食べる。喉に手を当てる。声の調子が悪い。交換部品の箱は空。

**心理**：罪悪感と空腹。身体が人間であることを、隠し続ける疲れ。

**SHOT（英語プロンプト）**

```
Storage room at night, 35mm from behind shelving: the black-haired woman sits on an upturned crate eating from a tin can quickly with a spoon, her other hand touching her throat; an empty small parts box beside her. A single battery lantern on the floor lights her from below; shelves of mostly empty cans recede into darkness.
```

キャラクター：SARA_21

### 11-02　（12秒・9:22〜）

**カメラ**：戸口のカイル／50mm

**行動・台詞**

カイル（戸口）「そんなに急いで食うなよ」  
沙羅が固まる。  
沙羅「……知ってた？」  
カイル「うん」  
沙羅「いつから」  
カイル「最初から」

**心理**：沙羅：見つかった恐怖。カイル：静かな怒りと、悲しさ。

**SHOT（英語プロンプト）**

```
50mm from inside the room toward the door: the young man stands in the dark doorway, one hand on the frame, face half lit by the lantern on the floor; in the foreground, out of focus, the woman's frozen hand holding the spoon.
```

キャラクター：SARA_21, KYLE_POST

### 11-03　（14秒・9:34〜）

**カメラ**：告白／40mm

**行動・台詞**

沙羅「じゃあ、どうして……」  
カイル「人間だからって、追い出すと思った？」  
沙羅「私が人間だったら、また一人になると思った」  
カイル「俺が？」

**心理**：沙羅の嘘の理由が、愛ではなく「置いていかれる恐怖」だったと分かる。

**SHOT（英語プロンプト）**

```
Two-shot at 40mm, both sitting now on crates facing each other, close but not touching, the lantern between them on the floor casting upward light and long shadows on the shelves. Her head lowered; his eyes on her.
```

キャラクター：SARA_21, KYLE_POST

### 11-04　（14秒・9:48〜）

**カメラ**：「怒ってる」／65mm

**行動・台詞**

沙羅「怒ってる？」  
カイル「怒ってる」  
カイル「そういうこと、黙ってないでくれ」  
沙羅は「ごめん」と言おうとするが、声がノイズで途切れる。代わりに手話で。  
〔手話〕沙羅「ごめん」  
カイルはそれを読んで、うなずく。

**心理**：声が壊れかけていることを、観客に初めて示す。手話が二人をつなぐ。

**SHOT（英語プロンプト）**

```
65mm close two-shot: the woman's mouth open but silent, her right hand forming a sign of apology at chest height; the young man watches her hand, his anger dissolving into concern. Lantern light from below, cool darkness above.
```

キャラクター：SARA_21, KYLE_POST

### 11-05　（13秒・10:02〜）

**カメラ**：食べて／35mm

**行動・台詞**

カイル「……食べて。俺、向こうにいる」  
カイルは戸口の外に腰を下ろし、背中を向けて座る。沙羅は缶詰を手に、声を出さずに泣く。

**心理**：怒っていても、そばにいる。一人分の距離。R01の再現。

**SHOT（英語プロンプト）**

```
35mm from the far end of the storage room: the woman sits alone with the can in her lap, crying silently; beyond the open door, the young man sits on the corridor floor with his back against the frame, facing away. The lantern lights her; he is a dark silhouette against a faint corridor bulb. One person's width of distance, like a park bench long ago.
```

キャラクター：SARA_21, KYLE_POST

## 12　帰れなかった朝（旧R10）

共同体／廃墟の物資集積所／夜明け〜朝／沙羅 21歳／尺 0:55

翌朝、カイルは消えていた。沙羅は自分が人間だから捨てられたと思い込む。だが彼は、彼女の食料と喉の部品を探しに出ていた。

### 12-01　（10秒・10:15〜）

**カメラ**：夜明けの出発／35mm

**行動・台詞**

夜明け前。カイルが端末で物資の場所を確かめ、眠る沙羅を一度だけ振り返って、黙って出ていく。

**心理**：言えば、彼女はついてくる。だから言わない。

**SHOT（英語プロンプト）**

```
Pre-dawn, 35mm from inside the sleeping community: the young man stands at the foot of the station stairs, a small tablet glowing faintly in his hand with abstract map shapes, looking back over his shoulder toward the dark sleeping area. Cold blue light from the street grate above, a single warm lantern far behind.
```

キャラクター：KYLE_POST

### 12-02　（12秒・10:25〜）

**カメラ**：空の給電席／50mm

**行動・台詞**

朝。空の給電席。  
沙羅「カイルは？」  
キラは応答のない通信器を握る。  
キラ「探しに行こう」  
沙羅が布巻きのボールに触れる。

**心理**：沙羅：捨てられた、と思い込む。昨夜の「怒ってる」が繰り返し響く。

**SHOT（英語プロンプト）**

```
Morning, 50mm: the empty charging seat with its cable hanging loose; the black-haired woman stands beside it holding the cloth-wrapped ball against her chest; the red-haired girl behind her grips a silent radio. Thin gray daylight from the grate overhead, dust in the air.
```

キャラクター：SARA_21, KIRA_POST

### 12-03　（11秒・10:37〜）

**カメラ**：物資集積所／40mm

**行動・台詞**

廃墟の倉庫で、カイルが人間用の缶詰と人工喉頭の交換部品を見つける。小さく安堵する。

**心理**：彼女のために動けることの喜び。

**SHOT（英語プロンプト）**

```
Abandoned warehouse at morning, 40mm: the young man kneels by a broken crate, holding a small sealed medical parts pack and stacking cans into his shoulder bag, a faint relieved smile. Daylight through holes in the corrugated roof makes bright patches on the dusty floor.
```

キャラクター：KYLE_POST

### 12-04　（11秒・10:48〜）

**カメラ**：発見される／24mm

**行動・台詞**

企業回収部隊のライトがカイルを捉える。カイルは共同体と反対の方向へ走る。

**心理**：自分が囮になれば、皆の場所は守れる。迷いはない。

**SHOT（英語プロンプト）**

```
Wide 24mm outside the warehouse: harsh white searchlights from an armored corporate vehicle sweep across a ruined street; Yutani security androids in dark armor deploy; the young man sprints away in the opposite direction from the camera, bag over his shoulder, long shadow thrown forward by the lights.
```

キャラクター：KYLE_POST, YUTANI_GUARD

### 12-05　（11秒・10:59〜）

**カメラ**：捕獲／50mm

**行動・台詞**

TYPE-1000専用の抑制器が胸に撃ち込まれる。倒れたカイルの通信器が、ブーツで踏み砕かれる。缶詰が転がる。

**心理**：沙羅に届くはずだったものが、地面に散らばる。

**SHOT（英語プロンプト）**

```
50mm low on the ground: the young man has collapsed face-down on wet asphalt, a heavy inhibitor dart lodged in his chest, a black armored boot crushing a small radio beside his hand; tin cans and the medical parts pack rolling away. Cold searchlight from above, rain puddles reflecting it.
```

キャラクター：KYLE_POST, YUTANI_GUARD


---

# ACT 3　受け継いで生きる

## 13　探し続ける人（旧R11）

共同体／救助現場／4年間／沙羅 21→25歳／尺 0:50

沙羅は何年もカイルを探し続ける。救助活動で左腕を失い、身体の一部を生体ギミックに置き換えていく。脳と人格、右手は人間のまま。

### 13-01　（10秒・11:10〜）

**カメラ**：記録と捜索／35mm

**行動・台詞**

共同体の机で、沙羅が地図に印をつけ、記録を残す。  
沙羅（記録音声）「今日も、見つからなかった」

**心理**：日課になってしまった捜索。希望より、意地。

**SHOT（英語プロンプト）**

```
35mm at a cluttered desk in the underground community at night: the black-haired woman marks a hand-drawn map with a pencil, a voice recorder beside a cold cup of tea; dozens of crossed-out marks on the map. A desk lamp with a warm bulb is the only light; her face tired, hair longer.
```

キャラクター：SARA_21

### 13-02　（10秒・11:20〜）

**カメラ**：救助現場の崩落／24mm

**行動・台詞**

崩れかけた建物で、子供を外へ押し出した直後、梁が落ちる。瓦礫から伸びた沙羅の左手。

**心理**：誰かを救うために、自分の身体を差し出す人。

**SHOT（英語プロンプト）**

```
Collapsing building interior during a rescue, 24mm: a child is being pulled out through a window by other rescuers in the background; in the foreground a fallen steel beam and concrete rubble, and the woman's left hand and forearm reaching out from under the debris, dust settling in a shaft of daylight. No gore.
```

キャラクター：SARA_21

### 13-03　（10秒・11:30〜）

**カメラ**：義手の調整／50mm

**行動・台詞**

整備台で、父と医療担当が新しい義手を調整する。沙羅は天井を見ている。脚部と脊椎の補助具も。右手は生身のまま、父の手を握る。

**心理**：失ったことより、「まだ探せる」ことを確かめている。

**SHOT（英語プロンプト）**

```
50mm at a repair-and-clinic bench: the woman lies on the bench while her father fits a dark graphite mechanical left arm at her shoulder and the medic checks a spinal brace; her biological right hand grips her father's sleeve. Work lamp overhead, surgical tools and parts on a tray, her eyes open, staring at the ceiling.
```

キャラクター：SARA_25, FATHER, MEDIC

### 13-04　（10秒・11:40〜）

**カメラ**：夜・キラ／40mm

**行動・台詞**

キラ「今日は休み。続きは明日」  
沙羅「……分かった」  
沙羅（記録）「この身体で、どこまで生きられるのかな」  
キラ「食べてから悩んで」

**心理**：キラは軽口で、沙羅をこの世界につなぎ止めている。

**SHOT（英語プロンプト）**

```
40mm: the red-haired girl sets a bowl of food down on the map in front of the black-haired woman, who sits with her new mechanical left hand resting on the desk, flexing its fingers; the girl's expression is light but her eyes worried. Warm desk lamp light, the metal hand reflecting it softly.
```

キャラクター：SARA_25, KIRA_POST

### 13-05　（10秒・11:50〜）

**カメラ**：台帳／寄り／65mm

**行動・台詞**

回収した移管台帳の画面に、カイルの顔写真と「部品再利用・翌朝」。  
沙羅「……いた」

**心理**：4年ぶりの手がかり。時間がない。

**SHOT（英語プロンプト）**

```
65mm over the woman's shoulder: a cracked tablet screen showing a list layout with a small portrait photo of a young man with dark navy hair and abstract unreadable entries; her mechanical left index finger rests on the screen next to the photo. Her reflection faintly visible in the glass, eyes widening.
```

キャラクター：SARA_25

## 14　ユタニ西棟へ（旧R12）

ユタニ西棟／夜／沙羅 25歳／尺 0:40

沙羅、キラ、人間の運転手が整備カートで西棟へ潜入する。そこには眠るドロだけでなく、働かされる人間もいた。

### 14-01　（10秒・12:00〜）

**カメラ**：潜入／35mm

**行動・台詞**

搬入口。整備カートの荷台に沙羅とキラが隠れる。運転手がゲートの警備に許可証を見せる。  
キラ「この便の扉が開く間だけ。次はないよ」

**心理**：緊張。失敗はできない。

**SHOT（英語プロンプト）**

```
35mm at a corporate service gate at night: a battered maintenance cart with a canvas cover waits at a barrier under sodium lights; the driver in a tan coverall hands a card to an armored security android; under the canvas, the two women's eyes are barely visible in the dark gap.
```

キャラクター：DRIVER, YUTANI_GUARD, SARA_25, KIRA_POST

### 14-02　（10秒・12:10〜）

**カメラ**：保管区画／24mm

**行動・台詞**

西棟の保管区画。並んで眠るドロたち。  
沙羅「カイルを起こしたら、地下へ」  
キラ「戻るまでが救出だからね」

**心理**：目的は一人。でも、ここには多すぎる。

**SHOT（英語プロンプト）**

```
Wide 24mm: a long cold storage hall with rows of standing upright pods holding dormant androids, faces calm, dim cyan status strips; cold fluorescent tubes overhead, condensation on the floor. The two women move low between the rows, small in the frame.
```

キャラクター：SARA_25, KIRA_POST

### 14-03　（10秒・12:20〜）

**カメラ**：働かされる人間／50mm

**行動・台詞**

ガラス越しに、拘束されて働かされる人間たち。  
沙羅（小声）「こっちにも、人がいる」  
キラ（通信）「位置、記録した。今の車じゃ全員は乗らない」

**心理**：全員は救えない。罪悪感を抱えたまま進む。

**SHOT（英語プロンプト）**

```
50mm through a dirty internal glass window: in the room beyond, exhausted human workers wearing restraint bands on their wrists sort parts under harsh white light; in the foreground, the woman's reflection overlaps the glass, her mechanical left hand pressed flat against it.
```

キャラクター：SARA_25

### 14-04　（10秒・12:30〜）

**カメラ**：保管庫の扉／40mm

**行動・台詞**

キラが有線で扉を開ける。奥に、カイルの保管庫。

**心理**：4年分の距離が、扉一枚になる。

**SHOT（英語プロンプト）**

```
40mm: the red-haired girl crouches at a heavy door, a cable from her wrist tool plugged into a wall panel; the door slides open a crack, cold light falling across the black-haired woman's face as she looks in.
```

キャラクター：SARA_25, KIRA_POST

## 15　今度は名前を呼ぶ（旧R13）

西棟・保管庫／夜／沙羅 25歳／尺 1:10

携帯電源で目を開けたカイルは、沙羅を覚えていた。左腕の秘密、あの朝の真実。二人は泣きながら、一瞬だけ笑う。

### 15-01　（14秒・12:40〜）

**カメラ**：起動／50mm

**行動・台詞**

沙羅が携帯電源を接続する。カイルの目が開く。  
カイル「……沙羅？」  
沙羅「おかえり」

**心理**：今度は名前を呼ばれた。R08で言えなかった言葉が、やっと届く。

**SHOT（英語プロンプト）**

```
50mm: the young man in a worn navy jacket lies in an open storage pod, a portable battery cable connected at his neck; his eyes have just opened, normal blue-gray, recognizing her. The woman kneels beside the pod, right hand on his chest, smiling with tears. Cold pod light from below, the dark hall behind.
```

キャラクター：SARA_25, KYLE_POST

### 15-02　（14秒・12:54〜）

**カメラ**：裂けた人工皮膚／40mm

**行動・台詞**

逃走中、沙羅の左腕の人工皮膚が裂ける。カイルが立ち止まる。  
カイル「その腕……」  
沙羅「ほかも。だいぶ替えた」

**心理**：カイルは、彼女が払った代償を一目で理解する。

**SHOT（英語プロンプト）**

```
40mm in a narrow maintenance corridor: the woman's torn olive sleeve and split synthetic skin reveal the graphite mechanical forearm beneath; the young man has stopped, staring at it. Red-orange warning lamps spaced along the ceiling, pipes and cable trays, steam.
```

キャラクター：SARA_25, KYLE_POST

### 15-03　（14秒・13:08〜）

**カメラ**：同じ時間／65mm

**行動・台詞**

沙羅「あなたと同じ時間を、生きたかったから」  
カイル「……無理したのか」  
沙羅「また、置いていかれたくなかった」  
沙羅「あの朝。私が人間だって、言ったから……」

**心理**：タイトルの言葉。人間の沙羅は機械に近づき、機械のカイルは人間のままの沙羅を望む、最大の反転。

**SHOT（英語プロンプト）**

```
65mm two-shot, crouched behind a stack of crates: he holds her torn left sleeve together with both hands as if to cover the machine; she looks at him, voice breaking. A single red emergency lamp and a cold fluorescent spill from the corridor shape their faces.
```

キャラクター：SARA_25, KYLE_POST

### 15-04　（14秒・13:22〜）

**カメラ**：真実／85mm

**行動・台詞**

カイル「違う。食べ物と、喉の部品を探してた。帰りに捕まった」  
沙羅「……言ってよ」  
カイル「言ったら、ついてくるだろ」  
沙羅「行くよ」  
カイル「……だろ？」  
二人は泣きながら、ほんの一瞬だけ笑う。

**心理**：4年間のすれ違いがほどける。泣き笑いは一瞬だけ。

**SHOT（英語プロンプト）**

```
Close 85mm on both faces, foreheads almost touching but not quite: tears and a small broken laugh at the same time. Cold and red light mixing on their skin, his hair falling over one eye. Intimate but not romantic.
```

キャラクター：SARA_25, KYLE_POST

### 15-05　（14秒・13:36〜）

**カメラ**：帰ろう／35mm

**行動・台詞**

キラ（通信）「地下、開いた。急いで！」  
沙羅が生身の右手で、カイルの手を引く。  
沙羅「帰ろう」

**心理**：右手は人間のまま。その手で、彼を連れ帰る。

**SHOT（英語プロンプト）**

```
35mm from behind the young man: the woman pulls him up by the hand with her biological right hand, turning toward a stairwell door glowing with dim green emergency light; his footing still unsteady.
```

キャラクター：SARA_25, KYLE_POST

## 16　沙羅が救う（旧R14）

西棟・地下搬出口／夜／沙羅 25歳／尺 1:00

地下搬出口。カイルが再び抑制器に撃たれる。沙羅は義手と義脚、人間として培った判断で、殺さずに戦い、彼を解放する。

### 16-01　（12秒・13:50〜）

**カメラ**：搬出口・引き／20mm

**行動・台詞**

地下へ下りる斜路。キラが救出した人間とドロを搬送車へ誘導する。外には運転手。上段通路に追撃部隊。  
キラ「そっち、上！」

**心理**：位置関係を明確に見せる（退路・射線・救出車）。

**SHOT（英語プロンプト）**

```
Wide 20mm of an underground loading bay: a concrete ramp descends toward an open rescue truck at the far end, its rear doors open with rescued people climbing in; an upper catwalk runs along the left wall where armored security androids appear; red rotating emergency lamps. The red-haired girl waves people forward; the woman and the young man run down the ramp.
```

キャラクター：SARA_25, KYLE_POST, KIRA_POST, YUTANI_GUARD, DRIVER

### 16-02　（12秒・14:02〜）

**カメラ**：抑制器／50mm

**行動・台詞**

カイルの胸に抑制器が刺さる。電磁索で隔壁へ引き寄せられる。  
カイル「先に行け！」  
沙羅「キラ、あの灯り！」

**心理**：沙羅は、今度は置いていかない。

**SHOT（英語プロンプト）**

```
50mm: the young man is slammed back against a steel bulkhead by an electromagnetic tether, an inhibitor dart sparking in his chest, face twisted, shouting; in the foreground the woman's back as she turns toward him instead of the exit.
```

キャラクター：SARA_25, KYLE_POST

### 16-03　（12秒・14:14〜）

**カメラ**：非常灯だけの戦い／24mm

**行動・台詞**

キラが照明を落とす。非常灯だけ。沙羅は搬送板を盾に走り、銃身を逸らし、駆動部だけを撃って止める。

**心理**：殺さない戦い方を、最後まで貫く。

**SHOT（英語プロンプト）**

```
Dark bay lit only by red emergency lamps, 24mm low: the woman runs behind a raised steel cargo board used as a shield, sparks bursting off it; with her mechanical left hand she shoves a guard's rifle barrel upward while her right hand aims a pistol at his knee actuator. Smoke catching the red light.
```

キャラクター：SARA_25, YUTANI_GUARD

### 16-04　（12秒・14:26〜）

**カメラ**：切り返し／40mm

**行動・台詞**

二体目。沙羅は左へ見せて、右へ潜る。柱で腕を挟み、停止器を押し当てる。人工の左指が一本動かなくなる。

**心理**：かつてカイルの癖を読んだ彼女が、今は自分の身体で同じ動きをする。

**SHOT（英語プロンプト）**

```
40mm: the woman feints left and ducks right under a guard's swing, pinning his arm against a concrete pillar, pressing a stopper to his neck with her right hand; one finger of her mechanical left hand jammed stiff and sparking. Red light and black shadows, sweat on her face.
```

キャラクター：SARA_25, YUTANI_GUARD

### 16-05　（12秒・14:38〜）

**カメラ**：解放／50mm

**行動・台詞**

沙羅が義手を支点に抑制器を剥がす。カイルが落ちるのを肩で受ける。  
沙羅「立てる？」  
カイル「……立つ」

**心理**：支え合う姿勢。どちらが守る側でもない。

**SHOT（英語プロンプト）**

```
50mm: sparks as the woman tears the inhibitor from the young man's chest using her mechanical arm as a lever; he falls forward onto her shoulder and she braces under his weight, boots planted. Red emergency light, smoke, the truck's open doors glowing in the background.
```

キャラクター：SARA_25, KYLE_POST

## 17　王子様（旧R15）

西棟・地下搬出口／夜／沙羅 25歳／尺 1:00

救出車へ退避する直前、残った射手がカイルを狙う。沙羅は彼を突き飛ばし、胸に弾を受ける。最後の一瞬だけ、声が澄む。

### 17-01　（12秒・14:50〜）

**カメラ**：射線／85mm

**行動・台詞**

救出車の直前。上段通路の射手がカイルへ銃口を向ける。カイルは抑制器の後遺症で動けない。沙羅が振り返る。

**心理**：迷いはない。考えるより先に身体が動く。

**SHOT（英語プロンプト）**

```
Long lens 85mm compression from behind the young man, who is half-kneeling near the truck: far up on the catwalk a single armored shooter aims down; between them, the woman has just turned, her body already moving. Red emergency lights, the truck's interior light warm in the corner of frame.
```

キャラクター：SARA_25, KYLE_POST, YUTANI_GUARD

### 17-02　（12秒・15:02〜）

**カメラ**：被弾／40mm

**行動・台詞**

銃声。沙羅がカイルを突き飛ばし、胸に弾を受ける。カイルが撃ち返し、倒れる沙羅をその場で抱き止める。

**心理**：時間が止まる。音を一瞬消す。過度な流血は描かない。

**SHOT（英語プロンプト）**

```
40mm frozen instant: the woman, having pushed the young man aside, jolts as a bullet strikes her chest, blood beginning to darken her black top beneath the olive jacket; he is already catching her with one arm while firing upward with the other, muzzle flash lighting his face. No gore beyond the spreading stain.
```

キャラクター：SARA_25, KYLE_POST

### 17-03　（13秒・15:14〜）

**カメラ**：右手と頬／85mm

**行動・台詞**

床に座り込んだカイルが沙羅を抱く。沙羅の生身の右手が、カイルの頬に触れる。人工喉頭が激しいノイズを発する。

**心理**：声が出ない。それでも伝えたい。

**SHOT（英語プロンプト）**

```
Close 85mm: the young man sits on the concrete floor holding the woman across his lap; her biological right hand rises to touch his cheek, smearing a little dust; his face wet, shaking. Warm light from the truck interior on one side, red emergency light on the other.
```

キャラクター：SARA_25, KYLE_POST

### 17-04　（12秒・15:27〜）

**カメラ**：最後の声／100mm

**行動・台詞**

ノイズの中、最後の瞬間だけ声が澄む。  
沙羅「王子様でいてね」  
そして、声の音そのものが途切れる（光ではなく音で示す）。  
カイル「……いる。ずっといるから」

**心理**：幼い日、声のない沙羅を理解できなかった少年が、今はその言葉を受け取る。

**SHOT（英語プロンプト）**

```
100mm extreme close on her face, eyes half open, a faint smile, lips just closing after a word; his blurred cheek and her fingertips in the foreground. Nothing glows on her neck. Soft warm light from the truck, everything else in shadow.
```

キャラクター：SARA_25, KYLE_POST

### 17-05　（11秒・15:39〜）

**カメラ**：立ち尽くすキラ／28mm

**行動・台詞**

沙羅の右手から力が抜ける。カイルが声にならない叫びを上げる。救出車の脇で、キラが立ち尽くす。

**心理**：世界の無情さ。蘇生の演出は長引かせない。

**SHOT（英語プロンプト）**

```
28mm wide and still: in the center the young man kneels on the floor clutching the woman's body, head thrown back in a silent scream; at the left edge the red-haired girl stands frozen by the truck's open door; smoke and red emergency light, the bay suddenly empty and quiet.
```

キャラクター：SARA_25, KYLE_POST, KIRA_POST

## 18　白い布（旧R16）

共同体・医療室／夜明け前／—／尺 0:40

共同体の医療室。沙羅の顔まで白い布が掛けられている。カイルの中に、彼自身の記憶が蘇る。拳の震えが止まる。

### 18-01　（10秒・15:50〜）

**カメラ**：搬送車の中／35mm

**行動・台詞**

暗い地下路を走る搬送車。白布を胸まで掛けられた沙羅。カイルは彼女の生身の右手を両手で握っている。キラは向かいで俯く。

**心理**：誰も話さない。エンジン音だけ。

**SHOT（英語プロンプト）**

```
35mm inside the moving rescue truck: dim interior light, the woman lying on a stretcher under a white sheet up to her chest, eyes closed; the young man sits beside her holding her right hand in both of his; across from them the red-haired girl sits with her head down. Passing tunnel lights sweep across them through the small rear window.
```

キャラクター：SARA_25, KYLE_POST, KIRA_POST

### 18-02　（10秒・16:00〜）

**カメラ**：医療室・引き／28mm

**行動・台詞**

無機質な医療室。顔まで白い布。医療器具は止まっている。医療担当が静かに時計を見る。両親は映さない。

**心理**：死の確定を、静かに見せる。

**SHOT（英語プロンプト）**

```
Wide 28mm, clinical room in the underground community: a simple bed with a body completely covered by a white sheet including the face, monitors switched off; the medic stands by a wall clock, head lowered; the young man stands a few steps away, very still. Flat cold light from a single fluorescent tube.
```

キャラクター：MEDIC, KYLE_POST

### 18-03　（10秒・16:10〜）

**カメラ**：記憶／寄り／100mm

**行動・台詞**

白布を見つめるカイルの瞳に、断片が映る。夕暮れの公園、フェンス越しのボール、共同体の灯り。沙羅のコピーではなく、カイル自身の記憶。

**心理**：思い出せなかった幼い日が、今になって戻ってくる。

**SHOT（英語プロンプト）**

```
Extreme close-up 100mm on the young man's blue-gray eye: in the wet surface of the eye, a tiny reflection of the white sheet and the fluorescent tube; no fantasy overlay, only real reflection. His lashes, a single unshed tear at the rim.
```

キャラクター：KYLE_POST

### 18-04　（10秒・16:20〜）

**カメラ**：拳と銃／50mm

**行動・台詞**

カイルの拳が震え、やがて止まる。壁に立てかけられた銃を掴む。

**心理**：悲しみが、冷たい怒りに変わる瞬間。

**SHOT（英語プロンプト）**

```
50mm at hip height: the young man's clenched fist, trembling, then still; beside it, a rifle leaning against the tiled wall; behind, out of focus, the white-sheeted bed. Cold fluorescent light, his knuckles scraped.
```

キャラクター：KYLE_POST

## 19　戻ってこないから（旧R17）

共同体・格納庫／夜明け／—／尺 0:35

カイルは装甲車を奪い、単独でユタニ本社へ向かう。キラは止められない。

### 19-01　（9秒・16:30〜）

**カメラ**：格納庫／28mm

**行動・台詞**

武器と弾薬を持ったカイルが装甲車へ向かう。  
キラ「待ちなさい！　一人で行って何になるの！」

**心理**：キラの怒りは、もう一人失うことへの恐怖。

**SHOT（英語プロンプト）**

```
28mm in a garage dug into the old station, pre-dawn: work lights on stands, wet concrete floor; the young man walks toward an armored truck with a rifle and ammunition bag; behind him the red-haired girl runs after him shouting.
```

キャラクター：KYLE_POST, KIRA_POST

### 19-02　（9秒・16:39〜）

**カメラ**：車扉を挟む二人／40mm

**行動・台詞**

運転席に乗り込むカイル。開いた扉をキラが掴む。  
キラ「それで沙羅が戻ってくるの！？」

**心理**：答えは分かっている。それでも聞かずにいられない。

**SHOT（英語プロンプト）**

```
40mm: the red-haired girl grips the open armored door with both hands, face furious and wet with tears; inside, the young man sits at the wheel looking straight ahead, his face lit by a dashboard glow.
```

キャラクター：KYLE_POST, KIRA_POST

### 19-03　（8秒・16:48〜）

**カメラ**：横顔／85mm

**行動・台詞**

カイルの手が一瞬止まる。  
カイル「戻ってこないから行くんだ」

**心理**：涙は見せない。決意だけ。

**SHOT（英語プロンプト）**

```
85mm profile of the young man in the driver's seat, jaw set, eyes dry, faint cool light from the garage door seam on his face, hand frozen on the gearshift.
```

キャラクター：KYLE_POST

### 19-04　（9秒・16:56〜）

**カメラ**：突破／20mm

**行動・台詞**

装甲車が格納庫の扉を突き破って、朝焼けの廃墟へ飛び出す。キラは吹き込む風の中に立つ。

**心理**：キラは見送るしかない。

**SHOT（英語プロンプト）**

```
Wide 20mm from inside the garage: the armored truck bursts through the corrugated door into a ruined city at sunrise, metal panels flying, orange dawn light flooding in; the red-haired girl's silhouette stands in the foreground, hair whipped by the wind.
```

キャラクター：KIRA_POST

## 20　正面突破（旧R18）

ユタニ本社正面／朝／—／尺 0:40

カイルは装甲車でバリケードへ突入し、撃たれても止まらず、正面のガラス扉を破る。静まり返ったロビーで、ユタニが待っている。

### 20-01　（10秒・17:05〜）

**カメラ**：本社正面／16mm

**行動・台詞**

巨大なユタニ本社。装甲車がバリケードへ激突。警備ドロが展開する。

**心理**：一人対、都市そのもの。

**SHOT（英語プロンプト）**

```
Ultra-wide 16mm low from the plaza: a colossal corporate headquarters tower of glass and concrete in cold morning light; an armored truck smashes through a barricade of concrete blocks, debris and sparks flying; dozens of armored security androids deploying across the plaza.
```

キャラクター：YUTANI_GUARD

### 20-02　（10秒・17:15〜）

**カメラ**：応射／35mm

**行動・台詞**

車体を盾に撃ち合う。弾切れの銃を捨て、倒れた警備ドロの武器を拾う。

**心理**：機械的なほど正確。でも、目は泣いている。

**SHOT（英語プロンプト）**

```
35mm handheld-height behind the truck's armored door: the young man fires a rifle over the door, spent casings flying, his face focused with wet eyes; bullet impacts scar the metal. Hard morning sun, long shadows.
```

キャラクター：KYLE_POST

### 20-03　（10秒・17:25〜）

**カメラ**：階段／28mm

**行動・台詞**

肩と脚を撃たれても止まらず、正面階段を駆け上がる。

**心理**：痛みを感じないのではなく、無視している。

**SHOT（英語プロンプト）**

```
28mm from the bottom of wide stone stairs: the young man runs up, limping on a damaged leg, his jacket torn at the shoulder, rifle in hand; fallen guards on the steps; bright sky behind the tower.
```

キャラクター：KYLE_POST

### 20-04　（10秒・17:35〜）

**カメラ**：ガラス扉／35mm

**行動・台詞**

巨大なガラス扉を突き破る。中は、異様に静かな暗いロビー。

**心理**：外の騒音が、扉を抜けた瞬間に消える。

**SHOT（英語プロンプト）**

```
35mm from inside the dark lobby looking out: the young man crashes through a tall glass door, shards suspended in the backlight of the morning sun outside; the interior is dim and silent, polished stone floor reflecting the bright doorway.
```

キャラクター：KYLE_POST

## 21　家族（旧R19）

本社・中央ロビー／朝／—／尺 1:00

ロビーで待っていたのは、ユタニの遠隔ホログラム。「家族にならないか」。カイルは撃ち、数十体の警備ドロが現れる。カイルは小さく笑う。「……変なの」。

### 21-01　（12秒・17:45〜）

**カメラ**：対峙／24mm

**行動・台詞**

巨大ロビーの中央に、ユタニの等身大ホログラム。  
ユタニ「所詮は旧式のAIだ。君がここへ来ることくらい、お見通しだったよ」

**心理**：ユタニは最初からここにいない。安全圏からの声。

**SHOT（英語プロンプト）**

```
Wide 24mm in a vast lobby: polished dark stone floor, tall columns, upper galleries in shadow; in the center a life-size pale cyan translucent hologram of a gray-haired man in a suit, arms relaxed, faint scan lines; the young man stands far in front of it, rifle raised, bleeding. The only light: the hologram's glow and the bright doorway behind.
```

キャラクター：YUTANI_HOLO, KYLE_POST

### 21-02　（12秒・17:57〜）

**カメラ**：誘い／85mm

**行動・台詞**

ユタニ「だが――私たちの想定を超える行動を取るのも、いつだって君たちだ」  
ユタニ「だから、アップデートが必要なんだ」  
両腕を広げる。  
ユタニ「さあ。今度こそ、私たちの家族にならないか？」

**心理**：R02（ドキュメンタリー）の「新しい家族です」の回収。温和で、だから不気味。

**SHOT（英語プロンプト）**

```
85mm on the hologram: the gray-haired man's translucent face with a polite, gentle smile, arms opening wide; scan lines and slight flicker; his light spills onto the stone floor but he casts no shadow.
```

キャラクター：YUTANI_HOLO

### 21-03　（12秒・18:09〜）

**カメラ**：爆発／35mm

**行動・台詞**

カイル「うるせぇ……」  
ユタニは語り続ける。  
カイル「うるせえええええ！」  
発砲。弾はホログラムの頭部を素通りし、像がグリッチに崩れる。

**心理**：怒りで顔が崩れる。初めて感情を剥き出しにするカイル。

**SHOT（英語プロンプト）**

```
35mm on the young man firing on full auto, face contorted in a scream, muzzle flash lighting his face orange in the dim lobby; in the background the hologram's head breaks apart into glitching horizontal bands, no blood.
```

キャラクター：KYLE_POST, YUTANI_HOLO

### 21-04　（12秒・18:21〜）

**カメラ**：包囲／16mm

**行動・台詞**

歪んだユタニが一言だけ命じる。  
ユタニ「やれ」  
上層回廊と奥の扉が開き、数十体の警備ドロが一斉に銃を向ける。

**心理**：逃げ場はない。

**SHOT（英語プロンプト）**

```
Ultra-wide 16mm from high above behind the glitching hologram: the young man small in the middle of the lobby floor; along the upper galleries and through opened rear doors dozens of armored security androids raise rifles at him, their visor lines a constellation of faint cyan.
```

キャラクター：YUTANI_GUARD, YUTANI_HOLO, KYLE_POST

### 21-05　（12秒・18:33〜）

**カメラ**：突撃／24mm／背後から

**行動・台詞**

幼い日の沙羅。ボールを抱えた沙羅。隣に座った沙羅。最後に頬へ触れた右手。カイルは小さく笑う。  
カイル「……変なの」  
銃弾の嵐へ、正面から突っ込む。  
カイル「うおおおおおおお――！」  
白い閃光。生死は映さない。

**心理**：R01の「変なの」の回収。彼自身の言葉として。

**SHOT（英語プロンプト）**

```
24mm from directly behind the young man as he charges forward into the lobby, one leg dragging, rifle raised, a faint smile on his profile; ahead, the wall of guards and muzzle flashes beginning; the frame starting to overexpose into white from the flashes.
```

キャラクター：KYLE_POST, YUTANI_GUARD

## 22　AFTER（旧R20）

山間の共同体／3年後・春／—／尺 0:45

3年後の春。桜の下、沙羅の工具袋を腰に下げたキラ。人間の少女とドロの少年が、ボールを介して出会う。画面の外から、男の声。

### 22-01　（10秒・18:45〜）

**カメラ**：春の共同体／28mm

**行動・台詞**

山間の共同体。桜の下をキラが歩く。腰には沙羅が使っていた工具袋。人間とドロの子供たちが同じ道を行き交う。

**心理**：失ったものの上に、続いている日常。

**SHOT（英語プロンプト）**

```
28mm on a mountain-village path in spring: cherry trees in full bloom, petals falling naturally in a light breeze, wooden houses and solar panels; the red-haired girl, unchanged, walks with a worn brown leather bag on her belt; human and android children run past. Soft overcast spring light.
```

キャラクター：KIRA_POST

### 22-02　（10秒・18:55〜）

**カメラ**：子供たち／50mm

**行動・台詞**

黒髪の人間の少女と、黒髪のドロの少年が、サッカーボールを介して出会う。  
少年「……ボール」  
少女が渡す。二人は笑う。

**心理**：沙羅とカイルを思わせるが、本人でも転生でもない。

**SHOT（英語プロンプト）**

```
50mm at child height: a small human girl with long straight black hair holds out a soccer ball to a small boy with messy dark hair; both smiling shyly; cherry petals on the grass. Spring daylight, bounce from the pale path.
```

キャラクター：KIDS

### 22-03　（9秒・19:05〜）

**カメラ**：キラの口元／85mm

**行動・台詞**

通り過ぎたキラが振り返る。遊び始めた子供たちを見て、口元だけが微かに笑う。

**心理**：全部を見届けた者の、小さな笑み。

**SHOT（英語プロンプト）**

```
85mm close on the red-haired girl turning back over her shoulder, only the corner of her mouth lifting in a faint smile, amber eyes soft; petals drifting out of focus between her and the camera.
```

キャラクター：KIRA_POST

### 22-04　（9秒・19:14〜）

**カメラ**：声の方へ／35mm

**行動・台詞**

画面の外から、遠い男性の声。  
男の声「キラ！　行くぞ！」  
キラが声の方を見る。  
キラ「今行く！」  
キラが走っていく。声の主は映さない。

**心理**：カイルかどうかは明かさない。観客に委ねる。

**SHOT（英語プロンプト）**

```
35mm: the red-haired girl turns and runs toward the edge of the frame along the blossom path; the direction she runs to is empty and out of frame; no other person and no vehicle visible.
```

キャラクター：KIRA_POST

### 22-05　（7秒・19:23〜）

**カメラ**：暗転

**行動・台詞**

画面の外で、車のドアが閉まる。  
バン！  
同時に、完全な暗転。  
終。

**心理**：音と同時に切る。余韻は観客の中に。

**SHOT（英語プロンプト）**

```
Completely black frame. Nothing visible.
```

キャラクター：なし
