#!/usr/bin/env python3
"""assets/bgm/sources.json のBGMを取得する(容量が大きいのでリポジトリには含めない)。"""
import json, subprocess, sys
from pathlib import Path
D = Path(__file__).resolve().parent.parent / "assets/bgm"
for t in json.loads((D / "sources.json").read_text()):
    f = D / t["file"]
    if f.exists():
        print("あり", f.name); continue
    subprocess.run(["curl", "-sSL", "-A", "tsukilab-worldmystery/1.0", "-o", str(f), t["url"]], check=True)
    print("取得", f.name, f.stat().st_size)
