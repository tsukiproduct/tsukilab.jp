#!/usr/bin/env python3
"""題材リスト(topics.json)の確認。
  python3 tools/topics.py list              # 状態ごとの一覧
  python3 tools/topics.py check 隕石 クレーター   # 既存の題材と重複していないか(キーワードの一致で判定)
"""
import json, sys
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / "topics.json"
ORDER = ["published", "produced", "planned", "candidate", "rejected"]
LABEL = {"published": "公開済み", "produced": "制作済み", "planned": "次に作る", "candidate": "候補", "rejected": "扱わない"}


def load():
    return json.loads(DB.read_text())["topics"]


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
    T = load()
    if cmd == "list":
        for st in ORDER:
            rows = [t for t in T if t["status"] == st]
            if rows:
                print(f"■ {LABEL[st]}({len(rows)})")
                for t in rows:
                    print(f"  #{t['id'] or '---'} {t['title']}")
    elif cmd == "check":
        words = [w.lower() for w in sys.argv[2:]]
        hits = []
        for t in T:
            pool = [k.lower() for k in t.get("keywords", [])] + [t["title"].lower()]
            score = sum(any(w in p or p in w for p in pool) for w in words)
            if score:
                hits.append((score, t))
        if not hits:
            print("重複なし: 新しい題材として使えます")
        for score, t in sorted(hits, key=lambda x: -x[0]):
            print(f"注意 一致{score}語: [{LABEL[t['status']]}] #{t['id'] or '---'} {t['title']}")
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
