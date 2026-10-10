# 残響 — サイトの組み立て

公開URL: https://tsukilab.jp/zankyo/

## 原稿を直したとき

1. `src/` の原稿（ARTIFICIAL_SALVATION.md / ZANKYOU.md / MEGALAVANIA.md）を編集
2. `python3 zankyo/_build/build.py` を実行（HTML と検索用データを作り直す）
3. PDF も直すなら `python3 zankyo/_build/make_pdf.py`（weasyprint が必要）

段落の規則：全角スペース1つで始まる行＝地の文、「で始まる行＝会話、全角スペース3つ＝詩や画面の文字、
`###` ＝資料（記事・掲示板など）の見出し、`---` ＝資料の区切り、`＊` ＝場面転換。

## 画像を足すとき

`IMAGE_PROMPTS.md` のプロンプトで作った画像を、指定のファイル名（PNG）で `zankyo/assets/img/` に置くだけ。
ビルドは不要。置かない枠は文字組みだけで成立する。

## 資料室・人物録・年表

`data.py` を編集して `build.py` を実行。
`unlock` はその章を読み終えたら表示、`after1` は残響 第三話の読了後、`after2` は残響 エピローグの読了後の記載。

## 保存しているもの

すべて閲覧者のブラウザの localStorage（`zk.` で始まるキー）。サーバーには何も送らない。
