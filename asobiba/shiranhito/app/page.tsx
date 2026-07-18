"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "home" | "diary" | "gallery" | "bbs" | "links";
type Person = {
  slug: string;
  name: string;
  ruby: string;
  title: string;
  handle: string;
  born: string;
  town: string;
  job: string;
  hobby: string;
  since: string;
  updated: string;
  base: number;
  icon: string;
  intro: string[];
  facts: string[];
  diaries: { date: string; title: string; body: string }[];
  photos: { title: string; caption: string; cell: number }[];
  posts: { no: number; author: string; date: string; body: string }[];
  friends: { slug: string; note: string }[];
  palette: string[];
  pattern: string;
  portrait: number;
};

const people: Person[] = [
  {
    slug: "hoshizora-kazuhiko", name: "柴田和彦", ruby: "しばた かずひこ", title: "和彦の星空観測所", handle: "かずさん", born: "1959年11月3日", town: "埼玉県与野市", job: "精密機器会社勤務", hobby: "天体観測・光学機器", since: "1997.10.12", updated: "2001.07.18", base: 18472, icon: "★", portrait: 0,
    intro: ["夜空は、見上げればいつも同じだと思っていました。けれど同じ望遠鏡を同じ場所に置いても、昨夜見えたものが今夜は見えない。星より先に、こちらの目が変わっているのかもしれません。", "ベランダから見える狭い空と、自作した観測道具の記録です。雲の多い夜のほうが、なぜか文章は長くなります。"],
    facts: ["愛機：口径10cm反射望遠鏡（自作）", "好きな星：アルビレオ", "苦手：徹夜した翌朝の会議"],
    diaries: [{date:"2001.07.18",title:"赤い星ではなかった",body:"東の低空に赤い光。火星に違いないと思い、妻まで呼んだ。双眼鏡で確かめると、工事現場のクレーンだった。笑われたが、雲の切れ間から本物の火星も見えた。"},{date:"2001.07.12",title:"杉浦さんから届いた基板",body:"モーター制御の基板が届く。配線は美しい。ただ、説明書の最後に『逆につなぐと煙が出ます』とだけある。今夜は眺めるだけにした。"},{date:"2001.06.29",title:"午前二時の電話",body:"片岡さんからフクロウの声を聞いたと電話。こちらは土星を見ていた。別のものを追っているのに、同じ暗闇の中にいるのが妙に可笑しい。"}],
    photos:[{title:"ベランダ観測所",caption:"洗濯物を取り込んだ後が開所時間です。",cell:1},{title:"梅雨の木星",caption:"三晩待って、十秒だけ見えました。",cell:0},{title:"接眼部の改造",caption:"杉浦さんの助言で、少しだけ滑らかに。",cell:7}],
    posts:[{no:42,author:"杉浦 明",date:"2001/07/19 00:14",body:"基板、無事だったようで安心しました。煙は本当に出ます（笑）"},{no:41,author:"片岡信夫",date:"2001/07/18 23:02",body:"今夜は雲が厚いですね。こちらではアオバズクが鳴きました。"},{no:40,author:"和彦",date:"2001/07/18 21:47",body:"赤い星の件は、しばらく家で語り継がれそうです。"}], friends:[{slug:"denshi-akira",note:"自動追尾装置の師匠です"},{slug:"toridori-nobuo",note:"夜更かし仲間（鳥の人）"}], palette:["#05051b","#17254a","#397bd5","#f7f8ff"], pattern:"stars"
  },
  {
    slug:"miporin-kitchen",name:"野上美穂",ruby:"のがみ みほ",title:"みほの小さなお菓子工房",handle:"みぽりん",born:"1968年4月16日",town:"神奈川県藤沢市",job:"市立図書館勤務",hobby:"焼き菓子・紅茶",since:"1999.02.14",updated:"2001.07.21",base:7321,icon:"♨",portrait:1,
    intro:["シフォンケーキは、ふくらんだ瞬間より、冷ましている時間のほうが落ち着きません。うまくいったに違いない。そう思うほど、型を外したところで腰折れするのです。", "失敗した日の台所も含めて、焼いたものを記録しています。甘さは控えめですが、日記は少し甘めです。"],facts:["得意：レモンシフォン", "紅茶：ウバを濃く", "夢：小さな喫茶店"],
    diaries:[{date:"2001.07.21",title:"桃のタルトと夕立",body:"桃を並べ終えたところで空が暗くなった。停電したら焼けない、と心配したが、雨は十分で止んだ。焼き上がりの艶が夕立の道に似ていた。"},{date:"2001.07.15",title:"大庭さんのカップ",body:"白いカップを譲っていただく。写真では普通に見えるけれど、口当たりが薄い。紅茶が少し上手になった気がした。"},{date:"2001.07.03",title:"三度目のスポンジ",body:"二度失敗。三度目は卵を急がせなかった。待つことも手順なのだと、今ごろ気づいた。"}],photos:[{title:"桃のタルト",caption:"夕立の前に焼けました。",cell:2},{title:"日曜日のシフォン",caption:"高さ18センチ。記録更新です。",cell:2},{title:"白いティーカップ",caption:"大庭さんの喫茶店から。",cell:5}],posts:[{no:18,author:"大庭志保",date:"2001/07/22 08:31",body:"桃のタルト、写真だけでも香りがしそうです。カップも喜んでいます。"},{no:17,author:"北村理恵",date:"2001/07/21 22:14",body:"娘と見ています。今度いっしょに作ってみますね。"},{no:16,author:"みほ",date:"2001/07/21 20:02",body:"夕立の音を聞きながら食べました。"}],friends:[{slug:"kissa-shiho",note:"器と珈琲の先生"},{slug:"rie-ehon",note:"図書館の絵本仲間"}],palette:["#fff6df","#6d321d","#e38b67","#fffdf5"],pattern:"checks"
  },
  {
    slug:"kurata-rail",name:"倉田正志",ruby:"くらた まさし",title:"倉田正志の鉄道写真館",handle:"くらっち",born:"1955年9月8日",town:"千葉県船橋市",job:"印刷会社営業",hobby:"ローカル線撮影",since:"1996.08.24",updated:"2001.07.16",base:29405,icon:"◆",portrait:2,
    intro:["列車が来るまでの駅には、写真に写らない時間があります。踏切が鳴る。待っていた人が立ち上がる。ところが目当ての車両が来た瞬間、私はたいてい構図を外します。", "うまく撮れなかった一枚も捨てずに残しました。端に写った傘や自転車のほうが、あとで見ればその日のことを覚えているからです。"],facts:["カメラ：Nikon F3", "フィルム：主にリバーサル", "好きな駅：小湊鐵道 月崎駅"],diaries:[{date:"2001.07.16",title:"雨の月崎駅",body:"紫陽花を入れようとして列車の頭を切った。失敗である。ただ、ホームの端で傘を差す親子が残った。十年後に見たいのはこちらかもしれない。"},{date:"2001.07.08",title:"相馬さんの旅行記",body:"会津のページを見て時刻表を開く。秋まで待つつもりだったが、待てるだろうか。"},{date:"2001.06.30",title:"古いネガ",body:"押入れから昭和五十三年のネガ。父と乗った列車が一本だけ写っていた。"}],photos:[{title:"雨の月崎駅",caption:"列車より傘が気に入っています。",cell:0},{title:"夕方の一両",caption:"田んぼに風が渡った直後。",cell:0},{title:"父と乗った日",caption:"退色したネガから。",cell:0}],posts:[{no:66,author:"相馬由美",date:"2001/07/17 19:44",body:"会津は秋も良いですよ。でも夏の夕方も捨てがたいです。"},{no:65,author:"柴田和彦",date:"2001/07/16 23:10",body:"雨粒が線路の光を拾っていますね。"},{no:64,author:"くらっち",date:"2001/07/16 21:09",body:"頭が切れた写真をトップにするとは思いませんでした。"}],friends:[{slug:"tabi-yumi",note:"旅先の空気まで伝わる旅行記"},{slug:"kaze-film-keiko",note:"映画と写真の話"}],palette:["#f3f1e6","#182f2b","#7b1d1d","#ffffff"],pattern:"lines"
  },
  {
    slug:"mii-catroom",name:"森下美奈子",ruby:"もりした みなこ",title:"みーの猫部屋",handle:"みー",born:"1974年2月22日",town:"東京都中野区",job:"文具店勤務",hobby:"猫・落書き",since:"2000.04.02",updated:"2001.07.22",base:4519,icon:"♪",portrait:3,
    intro:["うちのトラ吉は、パソコンの上が自分の席だと思っています。温かいからでしょう。そう思っていました。電源を切ったあとも座っているので、たぶん私の画面を見張っているのです。", "猫の写真と、仕事から帰ってきてから描いた絵を置いています。更新が止まった日は、たいていキーボードを取られています。"],facts:["同居猫：トラ吉（7歳）", "好き：色鉛筆、深夜ラジオ", "最近：デジカメ貯金中"],diaries:[{date:"2001.07.22",title:"午前一時の足あと",body:"掲示板に意味不明な文字が投稿されていた。誰かと思ったらトラ吉がキーボードを歩いたらしい。投稿できない設定に直した。犯人は今、モニターの上で寝ている。"},{date:"2001.07.14",title:"真紀ちゃんの毛糸玉",body:"綾部さんにもらった余り毛糸が一晩で廊下まで伸びていた。猫には完成品より材料がいい。"},{date:"2001.07.01",title:"雨を見る背中",body:"窓辺でずっと雨を見ていた。猫にも待っているものがあるのだろうか。"}],photos:[{title:"パソコン番",caption:"電源を切っても降りません。",cell:3},{title:"雨を見る",caption:"しっぽだけ時々動きます。",cell:3},{title:"毛糸事件",caption:"廊下まで約4メートル。",cell:3}],posts:[{no:25,author:"綾部真紀",date:"2001/07/22 12:08",body:"毛糸はトラ吉くんに進呈します（笑）"},{no:24,author:"みー",date:"2001/07/22 01:12",body:"先ほどの『jjjjjj』は猫です。書き込み欄は閉じました。"},{no:23,author:"宮田淳",date:"2001/07/21 23:49",body:"うちのミニトマトも猫に見張ってほしいです。"}],friends:[{slug:"maki-knit",note:"毛糸をくれるやさしい人"},{slug:"veranda-jun",note:"ベランダ仲間？"}],palette:["#fff0f7","#65205a","#ff77aa","#ffffff"],pattern:"paws"
  },
  {
    slug:"bando-fishing",name:"坂東修一",ruby:"ばんどう しゅういち",title:"週末釣行記・潮の向こう",handle:"ばんちゃん",born:"1962年6月11日",town:"静岡県沼津市",job:"自動車整備工",hobby:"海釣り・魚料理",since:"1998.05.05",updated:"2001.07.20",base:11082,icon:"～",portrait:4,
    intro:["大物を釣った日より、何も釣れなかった日の海をよく覚えています。悔しいからに違いない。ところが写真を見返すと、空の色まで残っているのは坊主の日ばかりです。", "釣果は正直に書きます。魚がいない日も、海はありました。"],facts:["ホーム：沼津港", "仕掛け：自作サビキ", "好きな魚：釣れた魚"],diaries:[{date:"2001.07.20",title:"サバ一匹",body:"朝四時から八時まで粘り、サバ一匹。小さいので逃がした。帰り道、藤岡さんの古本屋で海の図鑑を買った。今日は魚より本が重い。"},{date:"2001.07.07",title:"雨天中止",body:"道具を磨いて一日が終わる。釣りに行かない日のほうが、道具はきれいになる。"},{date:"2001.06.24",title:"西村さんの押し花",body:"海辺の花の名前を教えてもらった。ハマヒルガオ。今まで全部『浜の花』だった。"}],photos:[{title:"夜明けの堤防",caption:"釣果ゼロ、朝焼け百点。",cell:5},{title:"サバ一匹",caption:"撮影後、海へ帰しました。",cell:5},{title:"自作の仕掛け",caption:"魚より人がよく釣れます。",cell:7}],posts:[{no:31,author:"藤岡一郎",date:"2001/07/20 18:20",body:"図鑑、お買い上げありがとうございました。魚拓の本も入りました。"},{no:30,author:"西村雪絵",date:"2001/07/09 09:11",body:"ハマヒルガオ、今度押し花にしてみます。"},{no:29,author:"ばんちゃん",date:"2001/07/07 17:02",body:"雨は上がりましたが、本日は撤収です。"}],friends:[{slug:"furuhon-ichiro",note:"帰りに寄る古本屋さん"},{slug:"oshibana-yukie",note:"海辺の花の先生"}],palette:["#e9fbff","#063f5b","#168aad","#ffffff"],pattern:"waves"
  },
  {
    slug:"kaori-garden",name:"安西香織",ruby:"あんざい かおり",title:"香織の庭だより",handle:"かおり",born:"1965年3月27日",town:"栃木県宇都宮市",job:"小学校事務",hobby:"園芸・押し花",since:"1999.03.21",updated:"2001.07.19",base:8860,icon:"✿",portrait:5,
    intro:["種の袋には『丈夫で育てやすい』と書いてありました。安心したのですが、丈夫だったのは雑草のほうです。それでも朝顔が一輪、今朝ようやく咲きました。", "狭い庭の栽培記録です。虫食いの葉も、うまくいかなかった鉢も、そのまま載せています。"],facts:["庭：南向き六坪", "得意：ハーブ", "天敵：ヨトウムシ"],diaries:[{date:"2001.07.19",title:"最初の朝顔",body:"青い花が一輪。種を蒔いた場所とは少し離れている。雨で流れたのだろうか。予定どおりでない場所ほど、よく育つ。"},{date:"2001.07.10",title:"宮田さんのミニトマト",body:"写真を見る。立派だ。うちの株は葉ばかり茂っている。肥料をやりすぎたらしい。親切も多すぎると実がつかない。"},{date:"2001.06.28",title:"押し花の手紙",body:"雪絵さんから紫陽花の押し花。雨の日の色が、そのまま薄く残っている。"}],photos:[{title:"朝顔一号",caption:"予定外の場所で咲きました。",cell:4},{title:"ローズマリー",caption:"触ると一日、手に香りが残ります。",cell:4},{title:"庭の見取り図",caption:"六坪にも迷う場所があります。",cell:4}],posts:[{no:14,author:"宮田淳",date:"2001/07/20 06:44",body:"うちも最初は葉ばかりでした。水を少し我慢したら実がつきました。"},{no:13,author:"西村雪絵",date:"2001/07/19 20:17",body:"朝顔の青、とてもきれいです。押し花には難しいかな。"},{no:12,author:"かおり",date:"2001/07/19 07:31",body:"出勤前に撮りました。遅刻ぎりぎりです。"}],friends:[{slug:"veranda-jun",note:"トマト情報交換"},{slug:"oshibana-yukie",note:"花を残す人"}],palette:["#f6fff0","#285727","#6aaa45","#ffffff"],pattern:"leaves"
  },
  {
    slug:"tape-toru",name:"水島透",ruby:"みずしま とおる",title:"Toru's TAPE LIBRARY",handle:"TORU",born:"1971年12月1日",town:"大阪府豊中市",job:"レコード店員",hobby:"カセット編集・ギター",since:"1997.06.09",updated:"2001.07.13",base:21550,icon:"▶",portrait:6,
    intro:["好きな曲だけを一本のテープに詰めれば、最高の六十分になるはずでした。ところが曲順を変えるたび、最後に四十秒だけ余ります。その無音が嫌で、何年も同じテープを作り直しています。", "架空ラジオ番組『深夜二時の選曲室』の曲目と、ギターの録音日誌。音は置けないので、文字から鳴らしてください。"],facts:["デッキ：3ヘッド機", "愛用：46分テープ", "バンド：現在休止中"],diaries:[{date:"2001.07.13",title:"A面の最後",body:"四十秒余った。短い曲を入れると流れが壊れる。無音のままにしたら、そこがいちばん良かった。"},{date:"2001.07.06",title:"早川さんのピアノ",body:"掲示板で教えてもらった和音をギターで試す。指は届かない。音だけは少し近づいた。"},{date:"2001.06.22",title:"中古デッキ",body:"片側だけ音が曇る。ヘッドを磨くと、昔録った自分の声が急にはっきりした。消したくなった。"}],photos:[{title:"MIX TAPE No.36",caption:"A面最後の四十秒は無音。",cell:6},{title:"深夜のデッキ",caption:"窓を閉めて録音します。",cell:6},{title:"古いギター",caption:"三弦だけ新しい。",cell:6}],posts:[{no:77,author:"早川久美子",date:"2001/07/14 10:26",body:"指が届かない和音は、音を一つ抜いても大丈夫ですよ。"},{no:76,author:"TORU",date:"2001/07/13 02:19",body:"無音を残して完成とします。たぶん。"},{no:75,author:"森下美奈子",date:"2001/07/09 00:42",body:"深夜ラジオの選曲、猫と聴いてみたいです。"}],friends:[{slug:"piano-kumiko",note:"和音の相談相手"},{slug:"mii-catroom",note:"深夜リスナー"}],palette:["#171717","#f4f0d0","#e63946","#fefefe"],pattern:"grid"
  },
  {
    slug:"kaze-film-keiko",name:"橋本景子",ruby:"はしもと けいこ",title:"景子の映画と風の部屋",handle:"Kei",born:"1967年8月30日",town:"京都府京都市",job:"ミニシアター受付",hobby:"映画・街歩き",since:"1998.11.01",updated:"2001.07.18",base:12009,icon:"☆",portrait:7,
    intro:["映画館を出た直後、街の色が少し変わって見えることがあります。作品が傑作だったからでしょうか。そうとは限りません。雨上がりの舗道や、終電前の静けさが続きを撮っているのです。", "観た映画の感想と、帰り道で拾った場面を書いています。結末には触れません。たぶん。"],facts:["年間鑑賞：約180本", "好きな席：後ろから三列目", "収集：半券"],diaries:[{date:"2001.07.18",title:"エンドロールのあと",body:"最後まで席を立たなかった客が一人。掃除のため声をかけると、昔ここで初めて映画を見たという。上映作品より、その話を長く覚えそうだ。"},{date:"2001.07.02",title:"倉田さんの雨の駅",body:"写真を見て、無人駅の映画を思い出した。列車の頭が切れているからこそ、待っている人の時間が残っている。"},{date:"2001.06.18",title:"赤い傘",body:"三条通で赤い傘を追う。映画のようだと思ったが、信号二つで見失った。"}],photos:[{title:"閉館後のロビー",caption:"ポスターを外した壁。",cell:1},{title:"雨上がりの三条",caption:"赤い傘はもう見えません。",cell:0},{title:"半券の箱",caption:"題名より日付を見ます。",cell:6}],posts:[{no:39,author:"倉田正志",date:"2001/07/19 22:10",body:"写真をそんなふうに見てもらえるとは。切れてよかったのかもしれません。"},{no:38,author:"藤岡一郎",date:"2001/07/18 23:37",body:"映画パンフレット、また何冊か入りました。"},{no:37,author:"Kei",date:"2001/07/18 01:03",body:"閉館後の映画館は、少しだけ船に似ています。"}],friends:[{slug:"kurata-rail",note:"雨の時間を撮る人"},{slug:"furuhon-ichiro",note:"古いパンフレットの宝庫"}],palette:["#f5f0e8","#382f44","#8d5a97","#ffffff"],pattern:"film"
  },
  {
    slug:"nifty-yano",name:"矢野泰文",ruby:"やの やすふみ",title:"YANO-NET 電脳工作室",handle:"YANO",born:"1964年1月19日",town:"東京都町田市",job:"電機メーカー技術",hobby:"パソコン通信・HTML",since:"1996.01.07",updated:"2001.07.22",base:39881,icon:"■",portrait:8,
    intro:["電話線につないだ先に、顔を知らない人がいる。それだけで十分に未来でした。通信速度は遅く、画像一枚に二分かかる。だから待っている間に、その人の部屋まで想像できたのです。", "古いパソコンの改造記録と、仲間のホームページ更新情報。表示が崩れた方は画面を640×480にしてください。私の責任かもしれません。"],facts:["愛機：PC-9821", "モデム：33.6kbps", "巡回：毎晩23時"],diaries:[{date:"2001.07.22",title:"リンク切れ一件",body:"三か月ぶりに巡回すると、相馬さんの古い旅行記が消えていた。移転先は見つかった。ただ、消えたページの青い背景をもう一度見たかった。"},{date:"2001.07.17",title:"カウンター桁あふれ",body:"五桁で十分と思っていた。杉浦さんから六桁目を足す回路を教わる。そこまで誰が来るのだろう。"},{date:"2001.07.01",title:"掲示板を読むだけに",body:"広告書き込みが増えたため、過去ログだけ残す。静かになった。少し静かすぎる。"}],photos:[{title:"通信中",caption:"家族が電話を使えません。",cell:6},{title:"PC-9821",caption:"まだ現役です。",cell:7},{title:"リンク台帳",caption:"紙にも控えています。",cell:6}],posts:[{no:108,author:"杉浦 明",date:"2001/07/22 21:11",body:"六桁目、配線図を送りました。十万まで続けてください。"},{no:107,author:"相馬由美",date:"2001/07/22 12:52",body:"移転のお知らせが遅れてすみません。古い青背景は私も好きでした。"},{no:106,author:"YANO",date:"2001/07/22 00:05",body:"この掲示板は過去ログの展示のみです。新規投稿はできません。"}],friends:[{slug:"denshi-akira",note:"ハード方面の先生"},{slug:"tabi-yumi",note:"移転先を発見"}],palette:["#c0c0c0","#000080","#008080","#ffffff"],pattern:"windows"
  },
  {
    slug:"oshibana-yukie",name:"西村雪絵",ruby:"にしむら ゆきえ",title:"雪絵の押し花小箱",handle:"ゆき",born:"1958年12月24日",town:"長野県松本市",job:"薬局勤務",hobby:"押し花・手紙",since:"1999.09.09",updated:"2001.07.15",base:6470,icon:"❀",portrait:9,
    intro:["花を本にはさめば、その日の色が残ると思っていました。けれど青は紫に、白は薄茶に変わります。残るのは色ではなく、変わっていった時間のほうでした。", "庭や旅先で出会った草花を、小さなカードにしています。採らないで写真だけにした花も、同じように記録します。"],facts:["好き：すみれ", "道具：古い植物図鑑", "約束：一輪だけ採る"],diaries:[{date:"2001.07.15",title:"ハマヒルガオ",body:"坂東さんに教えた海辺の花。押してみたいとは思う。ただ、砂浜で咲く姿がよい。写真だけ送ってもらうことにした。"},{date:"2001.07.05",title:"紫陽花の色",body:"香織さんへ手紙。乾いた花は雨の日より薄い。それでも封筒を開くころ、あの日の湿った空気を思い出してくれたらよい。"},{date:"2001.06.21",title:"図鑑のすみれ",body:"四十年前にはさんだ花が出てきた。母の字で日付がある。"}],photos:[{title:"紫陽花のカード",caption:"安西さんへ送りました。",cell:4},{title:"四十年前のすみれ",caption:"母の植物図鑑から。",cell:4},{title:"採らなかった花",caption:"海辺ではこのままがよい。",cell:5}],posts:[{no:11,author:"安西香織",date:"2001/07/16 07:20",body:"紫陽花の手紙、届きました。封筒までよい香りです。"},{no:10,author:"坂東修一",date:"2001/07/15 21:44",body:"次の釣行で写真を撮ってきます。花はそのままに。"},{no:9,author:"ゆき",date:"2001/07/15 18:03",body:"採らない記録も、少しずつ増えています。"}],friends:[{slug:"kaori-garden",note:"花の手紙を交換"},{slug:"bando-fishing",note:"海辺の観察員"}],palette:["#fffaf4","#6d4057","#b77997","#ffffff"],pattern:"flowers"
  },
  {
    slug:"run-go-koizumi",name:"小泉剛",ruby:"こいずみ つよし",title:"走れ！剛の健康日記",handle:"GO",born:"1956年5月4日",town:"大阪府堺市",job:"スポーツ用品店経営",hobby:"市民マラソン",since:"1998.03.25",updated:"2001.07.20",base:15662,icon:"●",portrait:10,
    intro:["走れば健康になる。それは間違いないと思っていました。膝を痛めたのは、そう信じて休まなかったからです。今は距離より、翌朝また歩けるかを記録しています。", "市民ランナーの練習日誌です。速い人の参考にはなりません。休んだ日も赤字にせず書きます。"],facts:["自己ベスト：3時間58分", "朝練：6時から", "課題：休む勇気"],diaries:[{date:"2001.07.20",title:"五キロでやめる",body:"脚が軽く、十キロいけそうだった。だから五キロでやめた。以前なら失敗に数えたが、今日はこれでよい。"},{date:"2001.07.11",title:"橋の上の向かい風",body:"帰り道だけ追い風になるはずだった。風向きが変わった。人生と同じ、と書くには少し疲れすぎた。"},{date:"2001.07.02",title:"宮田さんのトマト",body:"練習後に一個いただく。塩なしで甘い。赤いものは元気が出る。"}],photos:[{title:"朝の河川敷",caption:"五キロで折り返しました。",cell:1},{title:"完走メダル",caption:"四時間を一分だけ切った日。",cell:0},{title:"古いシューズ",caption:"捨てられず玄関に。",cell:7}],posts:[{no:54,author:"宮田淳",date:"2001/07/21 06:15",body:"五キロで止められるのが本当の強さですね。トマトまた持っていきます。"},{no:53,author:"GO",date:"2001/07/20 07:23",body:"本日の走行5km。膝に違和感なし。"},{no:52,author:"片岡信夫",date:"2001/07/13 05:41",body:"朝の河川敷でカワセミを見ましたよ。"}],friends:[{slug:"veranda-jun",note:"給水ならぬ給トマト"},{slug:"toridori-nobuo",note:"河川敷の鳥情報"}],palette:["#fffce8","#153c75","#e84a27","#ffffff"],pattern:"sport"
  },
  {
    slug:"rie-ehon",name:"北村理恵",ruby:"きたむら りえ",title:"りえの絵本の森",handle:"りえ",born:"1970年10月10日",town:"神奈川県鎌倉市",job:"保育士",hobby:"絵本・読み聞かせ",since:"2000.01.10",updated:"2001.07.17",base:5138,icon:"♣",portrait:11,
    intro:["子どもは、こちらが大事だと思った場面では黙り、何でもない帽子の絵で笑います。読み方を教えているつもりでした。たぶん、教わっているのはこちらです。", "読み聞かせで出会った言葉と、自分で描いた小さなお話を置いています。子どもの名前はすべて仮名です。"],facts:["担当：4歳児", "好き：見返しの絵", "制作中：月の帽子"],diaries:[{date:"2001.07.17",title:"怖くないおおかみ",body:"おおかみが出る前に泣いた子が、最後には『ぜんぜん怖くない』と言った。本を閉じたあと、廊下を走って戻った。"},{date:"2001.07.09",title:"みほさんのレモンケーキ",body:"読み聞かせ会のあと、みんなで食べた。絵本より静かな時間は、おやつの最初の一分だけだった。"},{date:"2001.06.30",title:"月の帽子",body:"帽子をかぶると月がついてくる話。結末が決まらない。子どもに聞くと『朝になれば消える』。それでよい気がした。"}],photos:[{title:"読み聞かせの椅子",caption:"今日はおおかみのお話。",cell:1},{title:"月の帽子",caption:"まだ途中の一枚です。",cell:4},{title:"本棚の見返し",caption:"ここにも小さな絵があります。",cell:6}],posts:[{no:22,author:"野上美穂",date:"2001/07/18 19:11",body:"レモンケーキ、よく食べてもらえてうれしいです。"},{no:21,author:"りえ",date:"2001/07/17 23:07",body:"走って戻ったことは内緒にしておきます。"},{no:20,author:"早川久美子",date:"2001/07/12 16:34",body:"『月の帽子』に小さな曲をつけてみたいです。"}],friends:[{slug:"miporin-kitchen",note:"読み聞かせ会のおやつ係"},{slug:"piano-kumiko",note:"お話に音をくれる人"}],palette:["#effff7","#275d4b","#e7a840","#ffffff"],pattern:"forest"
  },
  {
    slug:"furuhon-ichiro",name:"藤岡一郎",ruby:"ふじおか いちろう",title:"古本・青灯書房の帳場",handle:"店主",born:"1952年7月7日",town:"静岡県三島市",job:"古書店主",hobby:"古地図・映画パンフレット",since:"1997.11.03",updated:"2001.07.14",base:9082,icon:"〒",portrait:12,
    intro:["古本には、前の持ち主が挟んだものが残っています。レシート、切符、読めない電話番号。本の価値とは関係ない。ところが私は、値札をつける手がそこで止まります。", "入荷案内と、帳場で見つけた紙片の記録です。通信販売はしておりません。探している本の相談だけ、手紙でどうぞ。"],facts:["開店：昭和54年", "得意：郷土資料", "看板猫：いません"],diaries:[{date:"2001.07.14",title:"昭和四十年の映画半券",body:"詩集の間から半券。景子さんに見せると、もうない映画館だという。題名より、裏に書かれた待ち合わせ時刻が気になった。"},{date:"2001.07.08",title:"釣り帰りの坂東さん",body:"海の図鑑を一冊。魚は釣れなかったそうだ。本は釣れた、と言って笑った。"},{date:"2001.06.26",title:"地図の赤い丸",body:"古い市街図に赤丸が三つ。今は全部駐車場になっている。"}],photos:[{title:"青灯書房の入口",caption:"雨の日は青い庇が暗くなります。",cell:1},{title:"半券と詩集",caption:"待ち合わせは午後六時。",cell:6},{title:"古い市街図",caption:"赤い丸の意味は不明です。",cell:6}],posts:[{no:28,author:"橋本景子",date:"2001/07/15 00:28",body:"その映画館は昭和五十二年に閉館したようです。半券、大切にしてください。"},{no:27,author:"坂東修一",date:"2001/07/14 21:02",body:"魚の名前、少しずつ覚えています。"},{no:26,author:"店主",date:"2001/07/14 19:10",body:"半券は詩集にはさんだまま、店に置くことにしました。"}],friends:[{slug:"kaze-film-keiko",note:"映画館の記憶を調べる人"},{slug:"bando-fishing",note:"海帰りのお客様"}],palette:["#f2ead8","#3f2d20","#8c6b42","#fffdf6"],pattern:"paper"
  },
  {
    slug:"kissa-shiho",name:"大庭志保",ruby:"おおば しほ",title:"喫茶みずうみ・窓辺通信",handle:"志保",born:"1961年2月18日",town:"山梨県甲府市",job:"喫茶店店主",hobby:"珈琲・器",since:"1999.11.11",updated:"2001.07.20",base:7828,icon:"♨",portrait:13,
    intro:["店が静かな日は、商売としては困ります。けれど午後三時、誰もいない窓辺に湯気が上がると、この静けさを売っているのだと思うことがあります。", "本日の豆、窓から見えたもの、お客様が忘れていった言葉。小さな喫茶店の営業日誌です。"],facts:["席：12席", "定休日：水曜日", "名物：固めのプリン"],diaries:[{date:"2001.07.20",title:"窓辺の青い帽子",body:"青い帽子のお客様が一時間、本を読んで帰った。テーブルに砂糖を使わなかった。誰だったのだろう。帽子の色だけ残っている。"},{date:"2001.07.15",title:"みほさんのカップ",body:"使わなくなった白いカップを三客譲る。店では目立たなかったのに、写真ではきれいだった。器にも場所がある。"},{date:"2001.07.04",title:"雨とレコード",body:"客足なし。水島さんにもらったテープを一周半聴いた。無音の四十秒が店によく合う。"}],photos:[{title:"午後三時の窓",caption:"青い帽子の人が座った席。",cell:1},{title:"固めのプリン",caption:"少し苦いカラメルです。",cell:2},{title:"白いカップ",caption:"みほさんの家へ行きました。",cell:5}],posts:[{no:19,author:"野上美穂",date:"2001/07/21 18:42",body:"カップ、大切に使っています。口当たりがとても良いです。"},{no:18,author:"水島透",date:"2001/07/20 02:03",body:"無音が似合う店と言ってもらえるのは、最高の感想です。"},{no:17,author:"志保",date:"2001/07/20 17:10",body:"青い帽子のお客様、また来るでしょうか。"}],friends:[{slug:"miporin-kitchen",note:"お菓子と器の交換"},{slug:"tape-toru",note:"店内選曲係"}],palette:["#fff8e7","#49372a","#9d6b45","#fffdf8"],pattern:"coffee"
  },
  {
    slug:"denshi-akira",name:"杉浦明",ruby:"すぎうら あきら",title:"杉浦電子工作研究室",handle:"AKIRA",born:"1957年5月30日",town:"東京都調布市",job:"大学技術職員",hobby:"電子工作・無線",since:"1996.12.15",updated:"2001.07.21",base:26201,icon:"＋",portrait:14,
    intro:["回路図どおりにつなげば動く。若いころはそう思っていました。実際には、はんだの量、部品の向き、昨日まで動いていた理由まで疑うことになります。だから動いた瞬間より、動かなかった記録を残します。", "測定器、自作回路、修理の覚え書き。高電圧の作業は真似しないでください。"],facts:["資格：第一級アマチュア無線技士", "得意：電源回路", "標語：煙もデータ"],diaries:[{date:"2001.07.21",title:"六桁カウンター",body:"矢野さんのカウンターを六桁にする。誰が十万人目になるかは分からない。だが桁は、足りなくなってから増やすと面倒だ。"},{date:"2001.07.18",title:"望遠鏡のモーター",body:"柴田さんの追尾装置、逆回転。配線は正しい。北半球用と南半球用の設定を取り違えていた。世界の向きまで疑うところだった。"},{date:"2001.07.03",title:"古いラジオ",body:"音が出ない。真空管を替えても出ない。最後にボリュームを回すと出た。修理前の確認がいちばん難しい。"}],photos:[{title:"六桁カウンター",caption:"十万人目はまだ先です。",cell:7},{title:"追尾装置の基板",caption:"逆につなぐと煙が出ます。",cell:7},{title:"古いラジオ",caption:"故障していませんでした。",cell:6}],posts:[{no:93,author:"矢野泰文",date:"2001/07/22 22:01",body:"配線図ありがとうございます。六桁目が点灯しました。"},{no:92,author:"柴田和彦",date:"2001/07/21 23:47",body:"今夜は正しい向きに追尾しています！"},{no:91,author:"AKIRA",date:"2001/07/21 20:31",body:"煙が出なければ、だいたい成功です。"}],friends:[{slug:"nifty-yano",note:"ソフトとカウンター担当"},{slug:"hoshizora-kazuhiko",note:"望遠鏡の共同工作"}],palette:["#101510","#b4ff9d","#33aa55","#ffffff"],pattern:"circuit"
  },
  {
    slug:"tabi-yumi",name:"相馬由美",ruby:"そうま ゆみ",title:"由美の気ままな各駅停車",handle:"ゆみ",born:"1969年9月14日",town:"宮城県仙台市",job:"旅行代理店勤務",hobby:"一人旅・駅弁",since:"1998.07.20",updated:"2001.07.19",base:14330,icon:"◇",portrait:15,
    intro:["旅行の仕事をしているのだから、旅は上手なはずでした。けれど自分の切符になると、乗り遅れ、道を間違え、予定にない町で降ります。写真に残るのは、たいていその先です。", "各駅停車で歩いた町と、駅前で食べたものの記録。役に立つ情報は少し古いかもしれません。"],facts:["好きな席：進行方向右側", "旅の相棒：赤いリュック", "収集：駅スタンプ"],diaries:[{date:"2001.07.19",title:"古い青背景",body:"ページを移転。矢野さんがリンク切れを知らせてくれた。古い青い背景は目が疲れると思っていたのに、なくすと夜の駅のようで寂しい。"},{date:"2001.07.08",title:"会津の午後",body:"一本乗り遅れ、次の列車まで二時間。倉田さんなら喜ぶ駅だと思い、ベンチから写真を三枚撮った。"},{date:"2001.06.25",title:"駅弁の箸",body:"箸を落とした。隣の人が予備をくれた。名前も聞かなかった旅の知人。"}],photos:[{title:"会津の無人駅",caption:"乗り遅れた二時間。",cell:0},{title:"赤いリュック",caption:"修理しながら八年目。",cell:1},{title:"駅弁と時刻表",caption:"箸は二膳持つこと。",cell:2}],posts:[{no:47,author:"倉田正志",date:"2001/07/20 21:56",body:"二時間待ち、うらやましいです。秋に行こうと思います。"},{no:46,author:"矢野泰文",date:"2001/07/19 23:11",body:"新しい住所にリンクを直しました。青背景も保存してあります。"},{no:45,author:"ゆみ",date:"2001/07/19 21:05",body:"移転できました。古いページもどこかに残します。"}],friends:[{slug:"kurata-rail",note:"列車を待てる人"},{slug:"nifty-yano",note:"迷子ページを見つける人"}],palette:["#eef7ff","#153b67","#e36d42","#ffffff"],pattern:"map"
  },
  {
    slug:"toridori-nobuo",name:"片岡信夫",ruby:"かたおか のぶお",title:"信夫の野鳥手帖",handle:"のぶ",born:"1949年4月5日",town:"埼玉県川越市",job:"郵便局勤務",hobby:"野鳥観察・散歩",since:"1997.04.05",updated:"2001.07.18",base:17509,icon:"∧",portrait:19,
    intro:["鳥の名前を覚えれば、散歩は退屈しないと思っていました。覚えるほど、分からない声が増えました。木の上にいるのは一羽なのか、三羽なのか。姿が見えない朝のほうが長く歩きます。", "川沿いで見た鳥、見られなかった鳥、聞こえた声を記録しています。写真は小さいです。鳥も小さいので。"],facts:["双眼鏡：8×32", "得意：鳴き声", "会いたい鳥：ヤマセミ"],diaries:[{date:"2001.07.18",title:"アオバズクの声",body:"午後十一時、近所の神社。二声だけ。柴田さんに電話したら土星を見ていた。空を見上げる人は忙しい。"},{date:"2001.07.13",title:"河川敷のカワセミ",body:"小泉さんの走る横を青い光が横切った。本人は気づかなかったらしい。速く走ると見えない鳥もいる。"},{date:"2001.07.01",title:"見えない三十分",body:"葉の中で声だけ。待ったが出てこない。写真はない。記録には残す。"}],photos:[{title:"河川敷の朝",caption:"カワセミは中央の青い点。",cell:5},{title:"神社の森",caption:"アオバズクは声だけでした。",cell:4},{title:"古い双眼鏡",caption:"父から譲られたもの。",cell:7}],posts:[{no:36,author:"小泉剛",date:"2001/07/19 06:33",body:"あの青い鳥がカワセミでしたか。次は少しゆっくり走ります。"},{no:35,author:"柴田和彦",date:"2001/07/18 23:25",body:"電話のあとベランダでも耳を澄ませました。こちらは車の音ばかり。"},{no:34,author:"のぶ",date:"2001/07/18 22:54",body:"今夜も二声。姿は見えません。"}],friends:[{slug:"run-go-koizumi",note:"河川敷を走る人"},{slug:"hoshizora-kazuhiko",note:"夜空方面の観測員"}],palette:["#eef6e9","#233d2a","#617d4b","#ffffff"],pattern:"birds"
  },
  {
    slug:"maki-knit",name:"綾部真紀",ruby:"あやべ まき",title:"真紀のあみもの日和",handle:"まき",born:"1973年1月8日",town:"北海道札幌市",job:"医療事務",hobby:"編み物・雑貨",since:"2000.02.02",updated:"2001.07.21",base:3791,icon:"∞",portrait:16,
    intro:["冬に間に合わせるつもりで、春から編み始めました。七月になっても片袖です。遅れているのではありません。たぶん、今年の冬が少し早すぎるのです。", "編みかけのもの、ほどいたもの、余った毛糸。完成写真より途中経過が多い部屋です。"],facts:["得意：アラン模様", "苦手：左右を同じ大きさに", "在庫：毛糸42玉"],diaries:[{date:"2001.07.21",title:"片袖の夏",body:"外は二十八度。毛糸を触るだけで暑い。それでも一段進んだ。冬の自分は、この一段を知らない。"},{date:"2001.07.14",title:"トラ吉の毛糸",body:"森下さんへ余り毛糸を送る。猫のおもちゃになるなら、編みかけより早く役に立つ。"},{date:"2001.07.02",title:"左右が合わない",body:"右手袋が一センチ長い。ほどくべきだろうか。手は左右で少し違う、と言い張ることにした。"}],photos:[{title:"片袖のセーター",caption:"冬までには、たぶん。",cell:6},{title:"毛糸の箱",caption:"数えたら42玉ありました。",cell:6},{title:"左右ちがう手袋",caption:"右手用と、少し大きい右手用。",cell:6}],posts:[{no:15,author:"森下美奈子",date:"2001/07/22 00:58",body:"毛糸ありがとうございました。廊下まで伸びました。"},{no:14,author:"まき",date:"2001/07/21 21:47",body:"本日の進み、一段。暑いです。"},{no:13,author:"西村雪絵",date:"2001/07/16 18:20",body:"左右が違う手袋、なんだか愛着がわきますね。"}],friends:[{slug:"mii-catroom",note:"毛糸の行き先"},{slug:"oshibana-yukie",note:"手仕事の時間仲間"}],palette:["#fff5fb","#59364f","#c97fa8","#ffffff"],pattern:"knit"
  },
  {
    slug:"veranda-jun",name:"宮田淳",ruby:"みやた じゅん",title:"淳のベランダ菜園",handle:"JUN",born:"1966年6月6日",town:"東京都江戸川区",job:"区役所職員",hobby:"家庭菜園・料理",since:"1999.05.30",updated:"2001.07.22",base:6904,icon:"▲",portrait:17,
    intro:["ベランダでも野菜は作れる。園芸書にはそう書いてありました。作れるのは本当です。ただし一個のトマトに、家族四人が毎朝声をかけることになります。", "プランター六個の収穫記録。日当たりは午前中だけ。それでも今年は赤くなりました。"],facts:["栽培：トマト、しそ、ねぎ", "広さ：1.5坪", "収穫係：娘"],diaries:[{date:"2001.07.22",title:"十一個目のトマト",body:"娘が数える前に私が一個食べた。記録は十個になっている。正直に話すべきだろうか。夕食まで考える。"},{date:"2001.07.10",title:"葉ばかりの理由",body:"安西さんの株は肥料が多いらしい。うちも去年は同じだった。世話を減らすのは、世話をするより難しい。"},{date:"2001.07.02",title:"走ったあとの一個",body:"小泉さんにトマトを渡す。塩なしで食べてくれた。育てたものを外で食べる人を見るのは、不思議にうれしい。"}],photos:[{title:"十一個目",caption:"記録上は十個目です。",cell:4},{title:"プランター全景",caption:"午前十時まで日が当たります。",cell:4},{title:"しその森",caption:"使っても使っても増えます。",cell:4}],posts:[{no:24,author:"小泉剛",date:"2001/07/22 07:02",body:"トマト、ごちそうさまでした。今日も五キロだけ走りました。"},{no:23,author:"安西香織",date:"2001/07/21 19:30",body:"水を我慢するの、やってみます。世話をしないのは難しいですね。"},{no:22,author:"JUN",date:"2001/07/22 12:12",body:"十一個目の件は、夕食前に申告しました。"}],friends:[{slug:"run-go-koizumi",note:"朝の試食係"},{slug:"kaori-garden",note:"肥料と水の相談"}],palette:["#f4ffe8","#31551f","#d54b2a","#ffffff"],pattern:"tomato"
  },
  {
    slug:"piano-kumiko",name:"早川久美子",ruby:"はやかわ くみこ",title:"久美子のピアノ小品集",handle:"KUMI",born:"1960年9月1日",town:"兵庫県西宮市",job:"ピアノ講師",hobby:"作曲・散歩",since:"1998.09.01",updated:"2001.07.16",base:10337,icon:"♫",portrait:18,
    intro:["間違えずに弾けた日は、上手だったと思っていました。録音を聞くと、正しい音だけが並んでいて息がありません。少し迷った日のほうが、旋律は前へ進んでいました。", "短いピアノ曲の覚え書きと、生徒たちが置いていった言葉。音声ファイルは重いので、譜面の断片だけです。"],facts:["ピアノ：古いアップライト", "好きな調：変ホ長調", "作曲中：月の帽子"],diaries:[{date:"2001.07.16",title:"一音ぬいた和音",body:"水島さんの指が届かないという。真ん中の音を一つ抜けば、響きは残る。足すことより、抜いてよいと決めるほうが難しい。"},{date:"2001.07.12",title:"月の帽子の三小節",body:"北村さんの絵を見て三小節。朝になれば消える帽子なら、最後の音は鳴らさないほうがいい。"},{date:"2001.07.01",title:"雨の日のレッスン",body:"生徒が傘で鍵盤のふたを叩いた。注意する前に、よいリズムだと思ってしまった。"}],photos:[{title:"三小節の譜面",caption:"最後の音はまだありません。",cell:6},{title:"古いアップライト",caption:"少し低いラの音。",cell:7},{title:"雨の日の傘",caption:"鍵盤は叩かないでください。",cell:1}],posts:[{no:33,author:"水島透",date:"2001/07/17 01:04",body:"一音抜いたら弾けました。響きもこちらのほうが好きです。"},{no:32,author:"北村理恵",date:"2001/07/16 20:17",body:"三小節、いつか子どもたちに聴かせたいです。"},{no:31,author:"KUMI",date:"2001/07/16 18:05",body:"最後の音は、まだ書かないでおきます。"}],friends:[{slug:"tape-toru",note:"違う楽器の相談相手"},{slug:"rie-ehon",note:"絵と音のお手紙"}],palette:["#f8f5ff","#352d57","#8c78b8","#ffffff"],pattern:"music"
  },
  {
    slug:"retro-game-ken",name:"石原健太",ruby:"いしはら けんた",title:"ケンタの8bit秘密基地",handle:"KENTA",born:"1978年8月8日",town:"愛知県名古屋市",job:"家電量販店アルバイト",hobby:"中古ゲーム・ドット絵",since:"2000.08.08",updated:"2001.07.22",base:9134,icon:"★",portrait:0,
    intro:["攻略本がなくても、何度も遊べば隠し部屋は見つかると思っていました。二百回落ちたあと、弟が最初の壁を押して開けました。近すぎる秘密ほど見えないものです。", "中古で見つけた名も知らないゲームと、自作ドット絵の保管庫。画面は派手ですが、音は鳴りません。"],facts:["愛機：8bit機各種", "制作：迷路ゲーム", "募集：青い鍵の場所"],diaries:[{date:"2001.07.22",title:"青い鍵は壁の中",body:"矢野さんからメール。画像を拡大すると、壁の一部だけ色が違うという。押してみたら開いた。半年探した鍵は、最初の部屋にあった。"},{date:"2001.07.18",title:"ドットの猫",body:"森下さんのトラ吉を16×16で描く。耳を一マス大きくすると猫、戻すとねずみになる。"},{date:"2001.07.05",title:"中古屋の裸カセット",body:"ラベルなし百円。起動すると知らない人の名前が主人公だった。前の持ち主の冒険を続ける。"}],photos:[{title:"青い鍵の画面",caption:"最初の部屋にありました。",cell:6},{title:"16×16のトラ吉",caption:"耳を一マス大きく。",cell:3},{title:"ラベルなしカセット",caption:"前の人の続きから。",cell:6}],posts:[{no:61,author:"矢野泰文",date:"2001/07/22 23:01",body:"壁の色番号が一か所だけ違っていました。見つかってよかったです。"},{no:60,author:"森下美奈子",date:"2001/07/19 00:12",body:"ドットのトラ吉、ちゃんと似ています！"},{no:59,author:"KENTA",date:"2001/07/22 22:40",body:"青い鍵、解決しました。半年かかりました。"}],friends:[{slug:"nifty-yano",note:"解析の先生"},{slug:"mii-catroom",note:"ドット絵モデルの飼い主"}],palette:["#000044","#ffffff","#ff33cc","#00ffff"],pattern:"pixels"
  },
  {
    slug:"mini4-hiroshi",name:"田辺宏",ruby:"たなべ ひろし",title:"宏の模型工作机",handle:"ヒロ",born:"1963年3月3日",town:"群馬県高崎市",job:"金型工",hobby:"鉄道模型・ジオラマ",since:"1998.12.06",updated:"2001.07.12",base:11820,icon:"□",portrait:1,
    intro:["小さく作れば、町全体を机に置ける。そう考えて始めました。ところが一軒の駅舎に三か月かかり、町はまだホームの端で止まっています。", "縮尺1/150の工作記録。完成予定図だけは壮大です。作業机の散らかりも、ときどき写ります。"],facts:["縮尺：1/150", "制作中：山間の無人駅", "苦手：樹木を作ること"],diaries:[{date:"2001.07.12",title:"ホームの傘",body:"倉田さんの写真に写っていた親子を小さく作る。列車はまだない。人を置くと、来ない列車を待っているように見える。"},{date:"2001.07.01",title:"杉浦さんの街灯",body:"LEDを一個もらう。明るすぎて駅前が都会になった。抵抗を足し、ようやく田舎の夜になる。"},{date:"2001.06.18",title:"木が一本",body:"針金とスポンジで木を作る。森まであと四十九本。"}],photos:[{title:"山間の無人駅",caption:"列車はまだ来ません。",cell:0},{title:"夜の街灯",caption:"抵抗を足して暗くしました。",cell:7},{title:"一本目の木",caption:"森まであと49本。",cell:4}],posts:[{no:29,author:"倉田正志",date:"2001/07/13 21:14",body:"写真の親子が模型になるとは驚きました。列車を待っていますね。"},{no:28,author:"杉浦明",date:"2001/07/12 23:00",body:"田舎の夜には1kΩくらいがちょうど良さそうです。"},{no:27,author:"ヒロ",date:"2001/07/12 20:08",body:"列車より先に待つ人ができました。"}],friends:[{slug:"kurata-rail",note:"風景資料をお借りしています"},{slug:"denshi-akira",note:"小さな電気の先生"}],palette:["#e8e3d6","#2c4238","#9b4f32","#ffffff"],pattern:"model"
  },
  {
    slug:"mayu-aquarium",name:"岡本麻友",ruby:"おかもと まゆ",title:"麻友の水槽日記",handle:"MAYU",born:"1976年5月12日",town:"広島県広島市",job:"歯科助手",hobby:"熱帯魚・写真",since:"2000.03.01",updated:"2001.07.20",base:4028,icon:"○",portrait:2,
    intro:["小さな魚なら、小さな水槽で十分だと思っていました。魚は収まります。水の変化は収まりません。三十リットルの中で、毎日ちがう天気が起きています。", "グッピーとコリドラス、水草の成長記録。水槽のガラスに私の顔が写っている写真がありますが、気にしないでください。"],facts:["水槽：60cm一本", "魚：グッピー12匹", "課題：苔"],diaries:[{date:"2001.07.20",title:"一匹いない",body:"朝、グッピーが十一匹しかいない。床まで探した。夕方、水草の陰から稚魚が三匹出てきた。減ったと思った数が増えていた。"},{date:"2001.07.09",title:"照明時間",body:"苔が増えるので一時間短くする。水草も少し元気がない。明るさは多ければよいわけではない。"},{date:"2001.06.27",title:"坂東さんの海",body:"同じ魚でも海は広い。写真を見たあと、水槽の水換えをした。"}],photos:[{title:"水草の陰",caption:"ここから稚魚が三匹。",cell:5},{title:"夕方の水槽",caption:"ガラスに少し私が写っています。",cell:7},{title:"コリドラス",caption:"底を掃除しているように見えます。",cell:5}],posts:[{no:13,author:"坂東修一",date:"2001/07/21 05:52",body:"増えていてよかったですね。海でも魚はすぐ隠れます。"},{no:12,author:"MAYU",date:"2001/07/20 22:16",body:"十一匹＋稚魚三匹でした。数え直します。"},{no:11,author:"安西香織",date:"2001/07/10 07:11",body:"水草も庭と同じで、光が難しいですね。"}],friends:[{slug:"bando-fishing",note:"広い水の魚の人"},{slug:"kaori-garden",note:"水の中の園芸相談"}],palette:["#e7ffff","#095b68","#27a9b5","#ffffff"],pattern:"bubbles"
  }
].slice(0, 20);

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "トップ", icon: "⌂" }, { id: "diary", label: "日記", icon: "✎" },
  { id: "gallery", label: "写真館", icon: "▣" }, { id: "bbs", label: "掲示板", icon: "▤" },
  { id: "links", label: "リンク集", icon: "∞" }
];

function parseHash() {
  if (typeof window === "undefined") return { slug: "", tab: "home" as Tab };
  const q = new URLSearchParams(window.location.hash.replace(/^#\??/, ""));
  const tab = q.get("tab") as Tab;
  return { slug: q.get("person") || "", tab: tabs.some(x => x.id === tab) ? tab : "home" as Tab };
}

function Counter({ value }: { value: number }) {
  return <span className="counter" aria-label={String(value)}>{String(value).padStart(6, "0").split("").map((d, i) => <b key={i}>{d}</b>)}</span>;
}

function Portrait({ person }: { person: Person }) {
  const sheet = person.portrait < 8 ? "assets/portrait-sheet-a.png" : person.portrait < 16 ? "assets/portrait-sheet-b.png" : "assets/portrait-sheet-c.png";
  const cell = person.portrait < 16 ? person.portrait % 8 : person.portrait - 16;
  const col = cell % 4; const row = Math.floor(cell / 4);
  const rows = person.portrait < 16 ? 2 : 1;
  return <div className="portrait" role="img" aria-label={`${person.name}の肖像写真`} style={{backgroundImage:`url(${sheet})`,backgroundSize:`400% ${rows * 100}%`,backgroundPosition:`${col * 33.333}% ${rows === 1 ? 0 : row * 100}%`}} />;
}

function HobbyPhoto({ cell, title }: { cell: number; title: string }) {
  const col = cell % 4; const row = Math.floor(cell / 4);
  return <div className="hobby-photo" role="img" aria-label={title} style={{backgroundImage:"url(assets/hobby-sheet.png)",backgroundSize:"400% 200%",backgroundPosition:`${col * 33.333}% ${row * 100}%`}} />;
}

function setLocation(slug = "", tab: Tab = "home") {
  window.location.hash = slug ? `person=${slug}&tab=${tab}` : "top";
}

function Archive({ count, onOpen }: { count: number; onOpen: (slug: string) => void }) {
  const [query, setQuery] = useState("");
  const list = useMemo(() => people.filter(p => `${p.name}${p.title}${p.hobby}${p.town}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <main className="archive-wrap">
    <header className="archive-head">
      <div className="tiny-stars">★　☆　★　☆　★</div>
      <h1>知らん人のホームページ集</h1>
      <p className="subtitle">～ どこかで暮らす、だれかの部屋へ ～</p>
      <div className="marquee"><span>祝★リンク20件達成！　相互リンク歓迎（現在受付休止中）　ゆっくり見ていってくださいネ！</span></div>
    </header>
    <table className="archive-info"><tbody><tr><td>最終更新日：2001年7月22日</td><td className="right">あなたは <Counter value={count} /> 人目のお客様です</td></tr></tbody></table>
    <div className="archive-grid">
      <aside className="archive-side">
        <div className="bevel-title">◆ MENU ◆</div>
        <a href="#top">● はじめに</a><a href="#people">● 登録ページ</a><a href="#new">● 更新情報</a><a href="#about">● このリンク集について</a>
        <hr />
        <p className="mini">ページ検索</p>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="名前・趣味など" aria-label="ページ検索" />
        <p className="mini">現在 {list.length} 件表示中</p>
        <div className="under-construction">🚧<br />工事中<br /><small>Since 2001</small></div>
      </aside>
      <section className="archive-main">
        <div className="notice" id="about"><h2>★ はじめに</h2><p>インターネットの海で偶然見つけた、ちょっと気になる個人ページを集めました。顔も暮らしも知らないのに、何度か通ううち、日記の続きを待っている自分に気づきます。</p><p>リンクの先では、昔の掲示板や写真館もそのまま読めます。書き込みはできません。静かになった部屋を、そっと覗くようにご覧ください。</p></div>
        <h2 id="people" className="section-bar">登録ホームページ一覧　＜全20件＞</h2>
        <div className="link-list">{list.map((p,i)=><article key={p.slug} className="link-row">
          <div className="link-no">{String(i+1).padStart(2,"0")}</div><div className="link-icon">{p.icon}</div><div><button onClick={()=>onOpen(p.slug)}>{p.title}</button><b>　管理人：{p.name}</b><p>{p.hobby}の記録。{p.intro[0].slice(0,54)}…</p><span>最終更新：{p.updated}　［{p.town}］</span></div>
        </article>)}</div>
        <div id="new" className="updates"><h2>★ 最近の更新</h2><p>07/22　淳さん「十一個目のトマト」更新／みーさんの掲示板を保存ログに変更</p><p>07/21　真紀さん「片袖の夏」／杉浦電子工作研究室のカウンター改造</p><p>07/20　志保さんの窓辺通信／剛さん、今日は5kmで終了</p></div>
      </section>
    </div>
    <footer className="archive-foot"><p>このリンク集はリンクフリーです（バナーはお持ち帰りください）</p><div className="fake-banner">知らん人<br /><b>HOMEPAGE</b></div><p>Copyright (C) 2001 知らん人のホームページ集 管理人</p><p className="fiction">※本作品に登場する人物・団体・記録はすべて架空です。</p></footer>
  </main>
}

function HomeTab({ p }: { p: Person }) {
  return <><section className="welcome"><h2>{p.icon} ごあいさつ {p.icon}</h2>{p.intro.map((x,i)=><p key={i}>{x}</p>)}</section>
    <section><h2>◆ プロフィール</h2><div className="profile-box"><Portrait person={p}/><dl><dt>名前</dt><dd>{p.name}（{p.ruby}）</dd><dt>ハンドル</dt><dd>{p.handle}</dd><dt>生年月日</dt><dd>{p.born}</dd><dt>住んでいる所</dt><dd>{p.town}</dd><dt>仕事</dt><dd>{p.job}</dd><dt>趣味</dt><dd>{p.hobby}</dd></dl></div><ul className="facts">{p.facts.map(x=><li key={x}>{x}</li>)}</ul></section>
    <section><h2>◆ 更新情報</h2>{p.diaries.map(d=><p className="update-line" key={d.date}><u>{d.date}</u>　{d.title}</p>)}</section>
  </>;
}

function DiaryTab({ p }: { p: Person }) { return <section><h2>✎ {p.handle}の日記</h2><p className="readonly">古い順の日記も少しずつ整理しています。</p>{p.diaries.map(d=><article className="diary" key={d.date}><h3>{d.date}　{d.title}</h3><p>{d.body}</p></article>)}</section> }
function GalleryTab({ p }: { p: Person }) { return <section><h2>▣ 写真館</h2><p className="readonly">画像をクリックしても大きくなりません。回線にやさしいサイズです。</p><div className="photo-grid">{p.photos.map((ph,i)=><figure key={i}><HobbyPhoto cell={ph.cell} title={ph.title}/><figcaption><b>{ph.title}</b><br />{ph.caption}</figcaption></figure>)}</div></section> }
function BbsTab({ p }: { p: Person }) { return <section><h2>▤ 掲示板（保存ログ）</h2><div className="readonly">この掲示板は展示のみです。新しい書き込み・返信・削除はできません。</div>{p.posts.map(post=><article className="post" key={post.no}><h3>No.{post.no}　{post.author}　投稿日：{post.date}</h3><p>{post.body}</p><div className="dead-actions">［返信］［削除］</div></article>)}</section> }
function LinksTab({ p, onOpen }: { p: Person; onOpen:(s:string)=>void }) { return <section><h2>∞ おすすめリンク</h2><p>{p.name}さんがお世話になっているページです。</p>{p.friends.map(f=>{const friend=people.find(x=>x.slug===f.slug)!;return <article className="friend" key={f.slug}><span className="friend-icon">{friend.icon}</span><div><button onClick={()=>onOpen(friend.slug)}>{friend.title}</button><p>{f.note}。管理人：{friend.name}さん</p></div></article>})}<hr/><p><a href="#top" onClick={(e)=>{e.preventDefault();setLocation()}}>知らん人のホームページ集へ戻る</a></p></section> }

function PersonalSite({ p, tab, count, onTab, onOpen, onBack }: { p:Person;tab:Tab;count:number;onTab:(t:Tab)=>void;onOpen:(s:string)=>void;onBack:()=>void }) {
  const style = {"--bg":p.palette[0],"--ink":p.palette[1],"--accent":p.palette[2],"--paper":p.palette[3]} as React.CSSProperties;
  return <main className={`personal pattern-${p.pattern}`} style={style}>
    <div className="site-shell">
      <header className="site-head"><div className="ornament">{p.icon}　{p.icon}　{p.icon}</div><h1>{p.title}</h1><p>ようこそ！ {p.handle} のホームページへ</p></header>
      <div className="lastline"><span>最終更新日：{p.updated}</span><span>あなたは <Counter value={count}/> 人目の訪問者です</span></div>
      <div className="site-grid">
        <aside className="site-side"><Portrait person={p}/><div className="bevel-title">■ MENU ■</div>{tabs.map(t=><button key={t.id} className={tab===t.id?"active":""} onClick={()=>onTab(t.id)}><span>{t.icon}</span>{t.label}</button>)}<hr/><p>SINCE {p.since}</p><Counter value={count}/><p className="mini">このサイトはリンクフリーです</p><button className="back-button" onClick={onBack}>← リンク集へ戻る</button></aside>
        <div className="site-content">{tab==="home"&&<HomeTab p={p}/>} {tab==="diary"&&<DiaryTab p={p}/>} {tab==="gallery"&&<GalleryTab p={p}/>} {tab==="bbs"&&<BbsTab p={p}/>} {tab==="links"&&<LinksTab p={p} onOpen={onOpen}/>}</div>
      </div>
      <footer className="site-foot"><p>管理人：{p.name}　／　メールは現在受付を休止しています</p><p>Copyright (C) 1996-2001 {p.handle}. All Rights Reserved.</p><p>文章・写真の無断転載を禁じます。</p></footer>
    </div>
  </main>
}

export default function Home() {
  const [route,setRoute]=useState({slug:"",tab:"home" as Tab});
  const [counts,setCounts]=useState<Record<string,number>>({archive:32106});
  useEffect(()=>{const sync=()=>setRoute(parseHash());sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync)},[]);
  useEffect(()=>{const key=route.slug||"archive";const person=people.find(p=>p.slug===route.slug);const base=person?.base??32105;const storageKey=`shiran-counter-${key}`;const timer=window.setTimeout(()=>{let n=1;try{n=Number(localStorage.getItem(storageKey)||"0")+1;localStorage.setItem(storageKey,String(n))}catch{}setCounts(c=>({...c,[key]:base+n}))},0);return()=>window.clearTimeout(timer)},[route.slug]);
  const person=people.find(p=>p.slug===route.slug);
  if(!person)return <Archive count={counts.archive||32106} onOpen={s=>setLocation(s,"home")}/>;
  return <PersonalSite p={person} tab={route.tab} count={counts[person.slug]||person.base+1} onTab={t=>setLocation(person.slug,t)} onOpen={s=>setLocation(s,"home")} onBack={()=>setLocation()}/>;
}
