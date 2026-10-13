"""Inspect alpha silhouettes and emit source rectangles/anchors; do not modify images."""
from PIL import Image
import numpy as np,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def groups(mask,gap=4):
 runs=[];start=None;last=None
 for i,yes in enumerate(mask):
  if yes:
   if start is None:start=i
   last=i
  elif start is not None and i-last>gap:runs.append((start,last));start=None
 if start is not None:runs.append((start,last))
 return runs
def inspect(name,cols):
 a=np.asarray(Image.open(ROOT/'assets'/name))[:,:,3]>200
 rows=groups(a.sum(1)>10,2)
 assert len(rows)==6,(name,rows)
 out=[]
 for y0,y1 in rows:
  sub=a[y0:y1+1]; xs=groups(sub.sum(0)>3,5)
  assert len(xs)==cols,(name,y0,xs)
  frames=[]
  for x0,x1 in xs:
   piece=sub[:,x0:x1+1]; yy,xx=np.where(piece)
   sy=y0+int(yy.min());ey=y0+int(yy.max());sx=x0+int(xx.min());ex=x0+int(xx.max())
   head=piece[:max(1,round(piece.shape[0]*.27))];hy,hx=np.where(head)
   ax=x0+float(np.median(hx))
   frames.append({'x':sx,'y':sy,'w':ex-sx+1,'h':ey-sy+1,'anchorX':round(ax-sx,2)})
  out.append(frames)
 return out
front=inspect('heroes.png',3);motion=inspect('motion.png',4)
# All frames in a row share one scale, so changing pose never resizes the body.
scales=[round(76/max(f['h'] for f in front[r]+motion[r]),6) for r in range(6)]
result={'front':front,'motion':motion,'scales':scales}
(ROOT/'sprite-data.mjs').write_text('export default '+json.dumps(result,separators=(',',':'))+';\n')
print('Validated 42 source rectangles; 6 shared scales; anchored to head center and feet.')
