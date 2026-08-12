# -*- coding: utf-8 -*-
"""
液晶ムービーのマニフェスト生成（仕様書 §14.6）

    python tools/scan_movies.py

assets/movies/ を走査して manifest.json を書き出す。
アプリはこれを見て「存在する動画だけ」を読みに行くため、404も初回再生の待ちも発生しない。

マニフェストが無い／キーが載っていない場合はアプリ側が自動プローブに切り替わるので、
動画ファイルを置くだけでも動く（その場合は初回だけ404が出る）。動画を追加したらここを再実行するのが正道。
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOVIE_DIR = os.path.join(ROOT, "assets", "movies")

# src/ui/movies.js の MOVIES と対応させること
KEYS = {
    "demo": "mv_demo_loop",
    "renzoku_a_dev": "mv_renzoku_a_dev",
    "renzoku_a_win": "mv_renzoku_a_win",
    "renzoku_a_lose": "mv_renzoku_a_lose",
    "renzoku_b_dev": "mv_renzoku_b_dev",
    "renzoku_b_win": "mv_renzoku_b_win",
    "renzoku_b_lose": "mv_renzoku_b_lose",
    "big": "mv_big_kakutei",
    "reg": "mv_reg_kakutei",
    "big_loop": "mv_big_loop",
    "reg_loop": "mv_reg_loop",
    "freeze": "mv_freeze",
    "at_start": "mv_at_start",
    "at_loop_a": "mv_at_loop_a",
    "at_loop_b": "mv_at_loop_b",
    "kanso": "mv_kanso_ending",
}
EXTS = [".webm", ".mp4"]  # 優先順

os.makedirs(MOVIE_DIR, exist_ok=True)
found = {}
for key, name in KEYS.items():
    for ext in EXTS:
        if os.path.exists(os.path.join(MOVIE_DIR, name + ext)):
            found[key] = name + ext
            break

with open(os.path.join(MOVIE_DIR, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(found, f, ensure_ascii=False, indent=1)
    f.write("\n")

print(f"manifest.json を生成: {len(found)}/{len(KEYS)} 本が配置済み")
# Windowsの既定コンソールは cp932 なので '✓' や '·' を出すと UnicodeEncodeError で落ちる。
# ASCII 記号だけを使うこと
for key in KEYS:
    print(f"  {'[o]' if key in found else '[ ]'} {key:<14} {found.get(key, '(未配置)')}")

# 想定外のファイルが置かれていたら知らせる（命名ミスの早期発見）
known = set(found.values())
for f in sorted(os.listdir(MOVIE_DIR)):
    if f.lower().endswith((".webm", ".mp4")) and f not in known:
        print(f"\n⚠ 命名が一致しないファイル: {f}  → README.md の一覧を確認")
