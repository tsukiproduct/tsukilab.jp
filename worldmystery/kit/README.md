# 掛け合い解説動画キット(テンプレート一式)

**別のチャットで、別ジャンル・別の見た目のチャンネルを立ち上げるための土台**です。
「この世界のバグ図鑑」を作ったときの手順・調べ方・失敗の教訓と、動画を作るプログラムをまとめてあります。
同じ動画を複製するものではありません。チャンネル名・型・キャラ・色・構成は、新しいチャットで一から設計します。
(バグ図鑑の台本は `examples/` に参考として1本だけ入れてあります。)

作れるもの: キャラクター(VOICEVOX の声 + 立ち絵)が解説する横長動画、サムネ3案・タイトル3案・概要欄、
縦型ショートとそのサムネ、投稿の予約表。

## 中身
| ファイル | 役割 |
|---|---|
| `01_CHANNEL_BRIEF.md` | **最初に記入するシート**。ジャンル・キャラ・決めごとを書く |
| `02_PROMPT_launch.md` | 新チャンネルを立ち上げるときに Claude Code へ渡すプロンプト |
| `03_PROMPT_episode.md` | 毎日1本作るときのプロンプト |
| `04_PROMPT_batch.md` | 数本をまとめて作り、ショートと予約表まで作るプロンプト |
| `05_CHECKLIST.md` | 仕上げの確認項目と、実際に起きた失敗の一覧 |
| `templates/` | 運営仕様書・題材リスト・台本・CLAUDE.md のひな形 |
| `engine/` | 動画を作るプログラム一式とフォント(下記) |

`engine/` の中身:
- `scripts/build.py` … 台本JSON → 声(VOICEVOX)→ 口パク付き動画
- `scripts/package.py` … サムネイル3案・タイトル3案・概要欄
- `scripts/shorts.py` … 本編から縦型ショート2本 + ショート用サムネイル
- `tools/produce.sh` … 上の3つを1回で実行(声 → 動画 → 投稿一式 → ショート → 確認画像)
- `tools/figs.py` / `tools/geo_maps.py` … 動く図(年表・グラフ・スケール・地図・3D地球儀など)
- `tools/make_sprites.py` … 立ち絵PSDから表情・口パクの画像を書き出す
- `tools/brand.py` … アイコン・バナー・ロゴ
- `tools/topics.py` … 題材の重複チェック / `tools/fetch_bgm.py` … BGMの取得
- `assets/fonts/` … Zen Maru Gothic・Dela Gothic One・Hachi Maru Pop(SIL OFL 1.1。動画への使用・再配布可)

## 使い方(3ステップ)
1. **シートに記入**: `01_CHANNEL_BRIEF.md` を埋める(分からない所は「おまかせ」でよい。Claude が調べて提案する)。
2. **新しいチャットを開く**: Claude Code(Web版、ネットワーク「フル」、保存先の GitHub リポジトリを選ぶ)で新しい会話を始め、
   `video_channel_kit.zip`・記入したシート・立ち絵PSD を添付する。
3. **プロンプトを貼る**: `02_PROMPT_launch.md` の `---` から下を貼る。Claude が zip を新しいフォルダに展開して進める。
   以後は同じチャットか、そのリポジトリを開いた新しいチャットで、毎日 `03_…`、まとめて作るときは `04_…` を貼る。

## 自分で用意するもの
- **立ち絵PSD**(2人分): 利用規約で「動画・収益化OK」を必ず確認。リポジトリには入れない(公開されるため)。
  会話の中でアップロードすると `assets/psd/` に置いてもらえる。
- **声**: VOICEVOX のキャラクターごとに利用規約が違う。クレジット表記(例「VOICEVOX:ずんだもん」)を概要欄に入れる。
- **BGM**(任意): CC0 / CC BY のみ。`assets/bgm/sources.json` に出典を書くと概要欄に自動で載る。

## 動かす環境
- Python 3.10 以上、ffmpeg、`pip install pillow numpy psd-tools pyproj pyshp`
- VOICEVOX エンジン(Linux CPU版でよい)。Claude Code の Web 版なら、Claude が GitHub のリリースから取得して起動する。
  場所が既定と違うときは `VOICEVOX_DIR=/path/to/engine bash tools/produce.sh …`

## チャンネルごとに変える所
- 台本JSONの `"brand"`: 札の言葉(例「バグ報告」→「事件ファイル」)、報告書の見出しと項目名、コメント募集文、強調色
- 台本JSONの `"characters"`: キャラの名前・VOICEVOX 名・左右・速さ・抑揚・字幕色(`colors`)
- `tools/make_sprites.py` の `CHARS`: PSD のレイヤー名(表情・口・まばたき)。PSDごとに違うので Claude に合わせてもらう
- ロゴ: `tools/brand.py` で作り、`assets/brand/logo.png` に置く(オープニングで使う)
