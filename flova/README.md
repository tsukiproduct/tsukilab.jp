# flova — ハロテイ宣伝動画「ローソク出せ」

Flova CLI（AI動画エージェント）で、ハロテイ（`/game/halotei/`）の宣伝用ショート動画を作るための作業フォルダです。

| ファイル | 内容 |
| --- | --- |
| `storyboard.md` | 絵コンテ（約45秒・11カット） |
| `request.md` | Flova にそのまま渡す依頼文（スタイル指定込み） |
| `ref/donchan-3view.jpg` | ドンちゃん三面図（キャラ参照） |

## Flova CLI の手順（公式: https://www.flova.ai/agent-cli.md）

1. インストール: `curl -fsSL https://cli.flova.ai/install.sh | sh`
2. Skill: `$HOME/.flova/SKILL.md` を読み、その手順に従う
3. 認証: https://www.flova.ai/en/agent-cli/ で API キーを発行（Account → Agent API Key）
   - キーはリポジトリにコミットしない
4. プロジェクト作成 → `request.md` の本文を送信 → 状態を CLI で確認 → 書き出し

1分以下の動画は、スタイルや音楽などの定型的な確認を自動で進めるおまかせモードで回せます（第三者ガイドによる情報）。
