# -*- coding: utf-8 -*-
"""A5のPDFを作る（zankyo/dl/）。サイトと同じ原稿・同じ段落規則を使う。
使い方: python3 zankyo/_build/make_pdf.py   （weasyprint が必要）"""
import pathlib, sys, html
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build, data  # noqa: E402
from weasyprint import HTML  # noqa: E402

OUT = HERE.parent / "dl"
OUT.mkdir(exist_ok=True)

CSS = """
@page { size: A5; margin: 17mm 15mm 19mm 15mm;
  @bottom-center { content: counter(page); font-family: "Noto Serif CJK JP"; font-size: 8pt; color: #666; } }
@page :first { @bottom-center { content: ""; } }
body { font-family: "Noto Serif CJK JP", serif; font-size: 9.4pt; line-height: 1.85; color: #111; margin: 0; }
p { margin: 0; text-align: justify; }
.t { text-indent: 1em; } .d, .n { margin: .1em 0; }
.verse { margin: .2em 0 .2em 2em; }
.break { text-align: center; margin: 1.4em 0; color: #666; letter-spacing: .4em; }
h2.chapter { page-break-before: always; font-size: 15pt; margin: 18mm 0 9mm; letter-spacing: .06em; }
h2.chapter small { display: block; font-size: 9pt; color: #666; font-weight: normal; margin-bottom: 2mm; }
.doc { margin: 1.4em 0; border-top: .8pt solid #222; }
.doc-src { font-family: "Noto Sans CJK JP"; font-weight: bold; font-size: 8.4pt; margin: .4em 0 0; }
.doc-sub { font-family: "Noto Sans CJK JP"; font-size: 7.8pt; color: #555; }
.doc-head { border-bottom: .4pt solid #bbb; padding-bottom: .3em; margin-bottom: .6em; }
.doc--board .doc-body, .doc--sns .doc-body, .doc--history .doc-body, .doc--results .doc-body, .doc--oldweb .doc-body, .doc--notice .doc-body, .doc--system .doc-body, .doc--flash .doc-body
  { font-family: "Noto Sans CJK JP"; font-size: 8.4pt; }
.doc .t { text-indent: 0; } .doc--article .t { text-indent: 1em; }
.doc--log { background: #1c2024; color: #e6e9e5; padding: .2em .8em .8em; }
.doc--log .doc-src { color: #e6e9e5; }
.doc--system { text-align: center; border: .8pt solid #222; padding: .6em; }
.void { font-family: "Noto Sans CJK JP"; font-size: 8pt; color: #666; border: .5pt dashed #999; padding: .3em .6em; margin: .6em 0; }
.lead, .post { font-weight: bold; margin-top: .6em; }
.stamp { font-family: "Noto Sans CJK JP"; font-size: 7.6pt; color: #666; margin-top: .6em; }
em { font-style: normal; color: #555; }
.title { page-break-after: always; text-align: center; padding-top: 55mm; }
.title .part { font-size: 8.5pt; letter-spacing: .3em; color: #777; margin-bottom: 14mm; }
.title h1 { font-size: 24pt; letter-spacing: .12em; margin: 0; line-height: 1.4; }
.title .sub { font-size: 10pt; letter-spacing: .3em; color: #555; margin-top: 4mm; }
.title .blurb { font-size: 8.8pt; line-height: 2; color: #444; text-align: left; margin: 16mm 6mm 0; text-indent: 1em; }
.toc { page-break-after: always; padding-top: 12mm; }
.toc h2 { text-align: center; font-size: 12pt; letter-spacing: .3em; margin-bottom: 10mm; }
.toc li { list-style: none; margin: .8em 0; border-bottom: .4pt dotted #bbb; }
.colophon { page-break-before: always; padding-top: 70mm; text-align: center; font-size: 8.5pt; color: #555; line-height: 2.2; }
.ep { font-family: "Noto Sans CJK JP"; font-size: 11pt; margin: 2em 0 1em; border-top: .5pt solid #999; border-bottom: .5pt solid #999; padding: .3em 0; }
"""

def one(book):
    md = (HERE / "src" / book["md"]).read_text(encoding="utf-8")
    pre, chs = build.split_chapters(md)
    parts, toc = [], []
    counter = [0]
    if pre.strip():
        h, _ = build.render_body(pre, counter); parts.append(h)
    for title, body in chs:
        num, name = build.parse_title(title)
        h, _ = build.render_body(body, counter)
        if book["key"] == "mega":
            parts.append(f'<h3 class="ep">{html.escape(num)}　{html.escape(name)}</h3>{h}')
        else:
            label = f"<small>{html.escape(num)}</small>{html.escape(name)}" if name else html.escape(num)
            parts.append(f'<h2 class="chapter">{label}</h2>{h}')
            toc.append(f"<li>{html.escape(num)}　{html.escape(name)}</li>")
    title = f"""<div class="title"><div class="part">{html.escape(book['part'])}</div><h1>{html.escape(book['title'])}</h1>
{f'<div class="sub">{html.escape(book["sub"])}</div>' if book['sub'] else ''}<p class="blurb">{html.escape(book['blurb'])}</p></div>"""
    tocb = f'<div class="toc"><h2>目次</h2><ol>{"".join(toc)}</ol></div>' if toc else ""
    colo = """<div class="colophon">残響　ARTIFICIAL SALVATION　メガラバニア<br>作　月真猫（TSUKI PRODUCT）<br>tsukilab.jp/zankyo/<br><br>本作はフィクションです。実在の人物・団体・作品とは関係ありません。</div>"""
    doc = f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{title}{tocb}{"".join(parts)}{colo}</body></html>'
    out = OUT / book["md"].replace(".md", ".pdf")
    HTML(string=doc).write_pdf(out)
    print("pdf", out.name)

for b in data.BOOKS:
    one(b)
