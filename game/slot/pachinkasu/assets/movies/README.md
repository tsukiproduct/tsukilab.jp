# 液晶ムービー置き場（仕様書 §14.6）

## 動画の追加手順

1. 下表のファイル名でこのフォルダに動画を置く
2. `npm run movies` を実行（`manifest.json` が更新される）

以上。**コード変更は一切不要。** 未配置のものは静止画演出に自動フォールバックするので、
14本を一度に揃える必要はなく、できたものから1本ずつ入れていける。

> `manifest.json` はアプリが「どれが配置済みか」を知るための索引。
> これがあるおかげで存在しない動画を取りに行かず、404も初回再生のもたつきも起きない。
> 手順2を忘れると動画は再生されない（静止画のまま）ので注意。

## 規格（仕様書 §14.1）

- 形式: **WebM(VP9) 推奨**。互換用に MP4(H.264) も可（同名で置けば webm → mp4 の順に探す）
  - ただし **iOS Safari が主ターゲットなら MP4(H.264+AAC) を選ぶ**。
    iOS の WebM/VP9 対応は端末とOSバージョンで差があり、Opus音声だと鳴らないことがある
- 解像度/fps: 横幅960px前後・30fps。表示は `object-fit: cover` なので**縦横比は自由**
  （液晶の比は端末により 1.36:1〜1.70:1 で動くため、寄せても無駄。中央に主題を置く）
- 音声:
  - **一発再生(`playMovie`)は常にミュート**。ボーナス確定などの短い演出用
  - **背景ループ(`setLoopMovie`)は音アリで流せる**。`mv_big_loop` / `mv_reg_loop` が該当。
    自動再生ポリシーで弾かれた場合はミュートで鳴らし直すので、映像が消えることはない
- ループ動画は先頭・末尾フレーム完全一致（BIGは14ゲーム＝1分前後なので、
  尺が2分以上あるMVならループ点はほぼ踏まない）

### 変換コマンド（元動画を web 用に落とす）

```bash
ffmpeg -i 元動画.mp4 -vf "scale=960:-2" -c:v libx264 -preset slow -crf 26 \
  -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart \
  assets/movies/mv_big_loop.mp4
```

## ファイル名一覧（14本）

| ファイル名 | 用途 | ループ | 組み込み状況 |
|---|---|---|---|
| `mv_big_kakutei.webm` | BIG確定（赤7揃い時） | 不可 | ✅ 再生される |
| `mv_reg_kakutei.webm` | REG確定（BAR揃い時） | 不可 | ✅ 再生される |
| `mv_big_loop.mp4` | **BIG消化中の背景（音アリ）** | 可 | ✅ 再生される |
| `mv_reg_loop.webm` | REG消化中の背景（音アリ） | 可 | ✅ 再生される |
| `mv_freeze.webm` | フリーズ（BIG入賞時 1/64） | 不可 | ✅ 再生される |
| `mv_at_start.webm` | AT「MOON TIME」突入 | 不可 | ✅ 再生される |
| `mv_at_loop_a.webm` | AT中背景ループ（前半） | 必須 | ✅ 再生される |
| `mv_at_loop_b.webm` | AT中背景ループ（残り10G以下） | 必須 | ✅ 再生される |
| `mv_kanso_ending.webm` | 完走エンディング（差枚+2400 / 1500G） | 不可 | ✅ 再生される |
| `mv_demo_loop.webm` | 待機デモ（通常時60秒無操作） | 可 | ✅ 再生される |
| `mv_renzoku_a_dev.webm` | 連続演出A 発展共通 | 不可 | 🔜 キー予約済み（前兆システム実装後） |
| `mv_renzoku_a_win.webm` | 連続演出A 成功→ボーナス | 不可 | 🔜 キー予約済み |
| `mv_renzoku_a_lose.webm` | 連続演出A 失敗 | 不可 | 🔜 キー予約済み |
| `mv_renzoku_b_dev.webm` | 連続演出B 発展共通 | 不可 | 🔜 キー予約済み |
| `mv_renzoku_b_win.webm` | 連続演出B 成功→ボーナス | 不可 | 🔜 キー予約済み |
| `mv_renzoku_b_lose.webm` | 連続演出B 失敗 | 不可 | 🔜 キー予約済み |

キーとファイル名の対応は `src/ui/movies.js` の `MOVIES` に定義してある。
追加の動画スロットが必要になったら `MOVIES` に1行足して `playMovie('キー')` を呼ぶ。
