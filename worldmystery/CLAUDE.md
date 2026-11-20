# worldmystery(YouTube「この世界のバグ図鑑」の制作一式)

作業の前に必ず読むこと:
- `CHANNEL_SPEC.md` … 運営仕様書(構成・事実確認・画像/音のルール・収益化の注意)。ここに反する作り方はしない。
- `topics.json` … 題材の管理リスト。新しい題材は `python3 tools/topics.py check キーワード` で重複を確認してから着手し、
  制作したら status と id を更新する。

素材の注意:
- 立ち絵PSDは `assets/psd/`(リポジトリには入れない)。無ければ利用者に再アップロードを頼む。
- VOICEVOXエンジンは `/home/user/voicevox/engine/run --host 127.0.0.1 --port 50021` で起動(無ければ GitHub リリースから linux-cpu-x64 の .vvpp を取得して展開)。
- BGMは `python3 tools/fetch_bgm.py`、地図データは `assets/geo/`(Natural Earth)。
