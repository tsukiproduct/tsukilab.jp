#!/bin/bash
# 1話を最後まで作る: 声 → 動画 → 投稿一式 → ショート → 送信用(30MB以内)の圧縮版 → 確認用の静止画
# 使い方: bash tools/produce.sh scripts/ep002_ai_breach.json
set -e
cd "$(dirname "$0")/.."
S="$1"; N=$(basename "$S" .json)
curl -sS -m 3 http://127.0.0.1:50021/version >/dev/null 2>&1 || { (cd /home/user/voicevox/engine && nohup ./run --host 127.0.0.1 --port 50021 > ../engine.log 2>&1 &); for i in $(seq 1 30); do sleep 2; curl -sS -m 2 http://127.0.0.1:50021/version >/dev/null 2>&1 && break; done; }
python3 scripts/build.py "$S" --voice-only | tail -1
python3 scripts/build.py "$S" --use-wavs --out "out/$N.mp4" | grep -E "^->|BGM"
python3 scripts/package.py "$S"
python3 scripts/shorts.py "$S" "out/$N.mp4"
mb=$(du -m "out/$N.mp4" | cut -f1)
if [ "$mb" -ge 29 ]; then ffmpeg -y -loglevel error -i "out/$N.mp4" -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -c:a copy "out/${N}_publish/video.mp4"; else cp "out/$N.mp4" "out/${N}_publish/video.mp4"; fi
du -h "out/${N}_publish/video.mp4"
# 確認用: 本編の4場面を1枚に
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/$N.mp4")
python3 - "$N" "$D" <<'PY'
import subprocess,sys
from PIL import Image
n,d=sys.argv[1],float(sys.argv[2]); ims=[]
for k,f in enumerate([0.06,0.3,0.55,0.8]):
    p=f"out/{n}_publish/_chk{k}.png"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-ss",str(d*f),"-i",f"out/{n}.mp4","-frames:v","1","-vf","scale=960:-1",p])
    ims.append(Image.open(p))
c=Image.new("RGB",(1920,1080))
for k,im in enumerate(ims): c.paste(im,((k%2)*960,(k//2)*540))
c.save(f"out/{n}_publish/check.png")
import os
for k in range(4): os.remove(f"out/{n}_publish/_chk{k}.png")
PY
echo "done: out/${N}_publish"
