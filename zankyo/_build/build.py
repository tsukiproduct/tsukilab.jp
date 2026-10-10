# -*- coding: utf-8 -*-
"""残響 — 小説サイトの静的生成。

使い方:  python3 zankyo/_build/build.py
入力:    zankyo/_build/src/*.md（読書版原稿）, data.py
出力:    zankyo/ 以下の HTML と assets/search.json

原稿を直したら、このスクリプトを一度実行するだけでよい。
画像は zankyo/assets/img/<スロット名>.png を置けば自動で表示される（ビルド不要）。
"""
import html, json, pathlib, re, sys, datetime
from urllib.parse import quote

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
SRC = HERE / "src"
sys.path.insert(0, str(HERE))
import data  # noqa: E402

SITE = "https://tsukilab.jp/zankyo/"
SITE_NAME = "残響"
VERSION = datetime.date.today().strftime("%Y%m%d")

# ------------------------------------------------------------------ 文字処理
def esc(s):
    return html.escape(s, quote=True)

def inline(t):
    """エスケープ → 強調 → 縦中横（1〜2桁の数字）"""
    t = esc(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\*\w])\*([^*\n]+?)\*(?!\*)", r"<em>\1</em>", t)
    # タグの外側にある 1〜2 桁の半角数字だけを包む
    parts = re.split(r"(<[^>]+>)", t)
    for i, p in enumerate(parts):
        if p.startswith("<"):
            continue
        parts[i] = re.sub(r"(?<![0-9A-Za-z.,:/%])([0-9]{1,2})(?![0-9A-Za-z,:/%])", r'<span class="tcy">\1</span>', p)
    return "".join(parts)

def plain(t):
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+?)\*(?!\*)", r"\1", t)
    return t.strip().strip("　").strip()

DOC_KINDS = [
    ("掲示板", "board"), ("スレッド", "board"),
    ("SNS", "sns"), ("アートスフィア", "sns"),
    ("蒼穹の間", "log"), ("深層メモリア", "log"),
    ("システム通知", "system"),
    ("検索履歴", "history"), ("検索結果", "results"),
    ("緊急速報", "flash"), ("速報", "flash"), ("最終報道", "flash"),
    ("運行情報", "notice"), ("一斉配信", "notice"), ("お知らせ", "notice"),
    ("公式サイト", "notice"), ("OFFICIAL", "notice"),
    ("深夜の図書館", "oldweb"),
]

def doc_kind(title):
    for k, v in DOC_KINDS:
        if k in title:
            return v
    return "article"

# ------------------------------------------------------------------ 原稿 → 章
def split_chapters(md):
    """'## ' で章に分ける。最初の '## ' より前は preamble として返す。"""
    md = re.sub(r"^# .*\n", "", md, count=1)
    md = re.sub(r"^\*Project ZANKYOU.*\*\n", "", md, flags=re.M)
    chunks = re.split(r"^## (.+)$", md, flags=re.M)
    pre = chunks[0]
    chs = []
    for i in range(1, len(chunks), 2):
        chs.append((chunks[i].strip(), chunks[i + 1]))
    return pre, chs

def parse_title(t):
    """'第1章　静寂の雨' -> ('第1章', '静寂の雨')"""
    m = re.match(r"^(プロローグ|エピローグ|第[0-9一二三四五六七八九十]+[章話](?:　前編|　後編)?)(?:　(.*))?$", t)
    if m:
        return m.group(1).replace("　", " "), (m.group(2) or "").strip()
    return t, ""

def render_body(text, counter):
    """原稿の一章ぶんを HTML にする。counter は段落番号（章内通し）。"""
    lines = text.split("\n")
    out = []
    in_doc = False
    doc_head_open = False
    plain_lines = []  # 検索用

    def close_doc():
        nonlocal in_doc
        if in_doc:
            out.append("</div></section>")
            in_doc = False

    i = 0
    while i < len(lines):
        raw = lines[i].rstrip("\n").rstrip()
        s = raw.strip()
        if not s:
            i += 1
            continue
        if s == "---":
            close_doc()
            i += 1
            continue
        m = re.match(r"^(#{3,4})\s+(.*)$", s)
        if m:
            # 連続する ### は同じ資料の見出しとしてまとめる
            heads = [m.group(2)]
            j = i + 1
            while j < len(lines):
                nxt = lines[j].strip()
                if not nxt:
                    j += 1
                    continue
                m2 = re.match(r"^(#{3,4})\s+(.*)$", nxt)
                if m2:
                    heads.append(m2.group(2))
                    j += 1
                    continue
                break
            close_doc()
            kind = doc_kind(heads[0])
            h = "".join(
                f'<p class="doc-src">{inline(heads[0])}</p>' if n == 0 else f'<p class="doc-sub">{inline(x)}</p>'
                for n, x in enumerate(heads))
            out.append(f'<section class="doc doc--{kind}"><header class="doc-head">{h}</header><div class="doc-body">')
            in_doc = True
            i = j
            continue
        if s == "＊":
            close_doc()
            out.append('<p class="break" aria-hidden="true">＊</p>')
            i += 1
            continue

        counter[0] += 1
        n = counter[0]
        if raw.startswith("　　　") or raw.startswith("　　"):
            cls = "verse"
        elif raw.startswith("　"):
            cls = "t"
        elif s[0] in "「『（":
            cls = "d"
        elif re.match(r"^\*\*［.*］\*\*$", s) or re.match(r"^［(この|ページ|この記事|アクセス).*］$", s):
            cls = "void"
        elif re.match(r"^［\d{4}年.*］$", s):
            cls = "stamp"
        elif s.startswith("**") and s.endswith("**") and in_doc:
            cls = "lead"
        elif re.match(r"^\*\*[^*]+\*\*　", s) and in_doc:
            cls = "post"
        elif re.match(r"^\*\*[^*]+\*\*$", s) and in_doc:
            cls = "post"
        elif s.startswith("――") or re.match(r"^\*\*[^*]{1,12}\*\*　", s):
            cls = "qa"
        else:
            cls = "n"
        body = inline(s)
        out.append(f'<p class="{cls}" id="p{n}">{body}</p>')
        plain_lines.append((n, plain(s)))
        i += 1
    close_doc()
    return "\n".join(out), plain_lines

# ------------------------------------------------------------------ 共通テンプレート
FONTS = ("https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700;800"
         "&family=BIZ+UDPGothic:wght@400;700&display=swap")

NAV = [
    ("", "本棚"),
    ("archive/", "資料室"),
    ("timeline/", "年表"),
    ("people/", "人物録"),
    ("notes/", "記憶ノート"),
    ("about/", "この場所について"),
]

def page(*, path, title, desc, body, kind, root, og="og-site.png", extra_head="", data_attrs=None, bodycls=""):
    """path: zankyo/ からの相対パス（'' はトップ）"""
    url = SITE + path
    full_title = title if title == SITE_NAME else f"{title}｜{SITE_NAME}"
    attrs = " ".join(f'data-{k}="{esc(str(v))}"' for k, v in (data_attrs or {}).items())
    nav = "".join(
        f'<li><a href="{root}{href}" data-nav="{href or "home"}">{label}</a></li>' for href, label in NAV)
    return f"""<!DOCTYPE html>
<html lang="ja" data-theme="auto">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="theme-color" content="#e6e9e5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1317" media="(prefers-color-scheme: dark)">
<link rel="canonical" href="{url}">
<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{root}assets/apple-touch-icon.png">
<meta property="og:type" content="{'article' if kind == 'chapter' else 'website'}">
<meta property="og:site_name" content="tsukilab.jp">
<meta property="og:title" content="{esc(full_title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}assets/og/{og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@Atg_Tsukimao">
<meta name="twitter:title" content="{esc(full_title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{SITE}assets/og/{og}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="{root}assets/zk.css?v={VERSION}">
<script>/* 表示設定は描画前に当てる（ちらつき防止） */
(function(){{try{{var s=JSON.parse(localStorage.getItem('zk.settings')||'{{}}');var d=document.documentElement;
if(s.theme)d.dataset.theme=s.theme;if(s.size)d.dataset.size=s.size;if(s.lh)d.dataset.lh=s.lh;
if(s.face)d.dataset.face=s.face;if(s.dir)d.dataset.dir=s.dir;}}catch(e){{}}}})();</script>
{extra_head}
</head>
<body class="k-{kind} {bodycls}" data-root="{root}" {attrs}>
<a class="skip" href="#main">本文へ移動</a>
<header class="bar" id="bar">
  <a class="mark" href="{root}" aria-label="残響 トップへ"><span class="mark-ink">残響</span><span class="mark-pen" aria-hidden="true">残響</span></a>
  <nav class="nav" aria-label="サイト内">
    <ul>{nav}</ul>
  </nav>
  <div class="tools">
    <span class="clock" role="img" aria-label="現在時刻">
      <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14.5" class="c-face"/><line class="c-h" x1="16" y1="16" x2="16" y2="9"/><line class="c-m" x1="16" y1="16" x2="16" y2="5"/><line class="c-s" x1="16" y1="18.5" x2="16" y2="4"/><circle cx="16" cy="16" r="1.4" class="c-pin"/></svg>
    </span>
    <button class="tool" type="button" data-act="rain" aria-pressed="false" title="雨音">雨音</button>
    <button class="tool" type="button" data-act="search" title="本文を検索">検索</button>
    <button class="tool" type="button" data-act="settings" title="表示の設定">文字</button>
    <button class="tool tool--menu" type="button" data-act="menu" aria-expanded="false" aria-controls="drawer">目次</button>
  </div>
  <div class="progress" aria-hidden="true"><i></i></div>
</header>
<div class="drawer" id="drawer" hidden>
  <nav aria-label="サイト内（モバイル）"><ul>{nav}</ul></nav>
</div>
<main id="main">
{body}
</main>
<footer class="foot">
  <div class="foot-in">
    <p class="foot-title">残響　ARTIFICIAL SALVATION　メガラバニア</p>
    <p>作　月真猫（TSUKI PRODUCT）</p>
    <p class="foot-links"><a href="{root}about/">この場所について</a><a href="{root}notes/">記憶ノート</a><a href="https://x.com/Atg_Tsukimao" rel="noopener">X　@Atg_Tsukimao</a><a href="https://tsukilab.jp/tsukimao/official/">月真猫 公式</a></p>
    <p class="foot-small">本作はフィクションです。実在の人物・団体・作品とは関係ありません。</p>
  </div>
</footer>
{overlays(root)}
<script src="{root}assets/zk.js?v={VERSION}" defer></script>
</body>
</html>
"""

def overlays(root):
    return f"""<div class="sheet" id="sheet-settings" role="dialog" aria-modal="true" aria-labelledby="st-title" hidden>
  <div class="sheet-in">
    <h2 id="st-title">表示の設定</h2>
    <fieldset><legend>文字の大きさ</legend>
      <div class="seg" data-set="size"><button data-v="s">小</button><button data-v="m">中</button><button data-v="l">大</button><button data-v="xl">特大</button></div></fieldset>
    <fieldset><legend>行の間隔</legend>
      <div class="seg" data-set="lh"><button data-v="tight">狭い</button><button data-v="normal">ふつう</button><button data-v="loose">広い</button></div></fieldset>
    <fieldset><legend>書体</legend>
      <div class="seg" data-set="face"><button data-v="mincho">明朝</button><button data-v="gothic">ゴシック</button></div></fieldset>
    <fieldset><legend>組み方（本文）</legend>
      <div class="seg" data-set="dir"><button data-v="yoko">横書き</button><button data-v="tate">縦書き</button></div></fieldset>
    <fieldset><legend>背景</legend>
      <div class="seg" data-set="theme"><button data-v="auto">端末に合わせる</button><button data-v="paper">紙</button><button data-v="night">夜</button></div></fieldset>
    <fieldset class="st-spoil"><legend>資料の表示</legend>
      <label class="check"><input type="checkbox" data-set-check="spoil"> 読んでいない章の資料も表示する（内容に触れます）</label></fieldset>
    <button class="btn" type="button" data-close>閉じる</button>
  </div>
</div>
<div class="sheet sheet--search" id="sheet-search" role="dialog" aria-modal="true" aria-labelledby="sr-title" hidden>
  <div class="sheet-in">
    <h2 id="sr-title">本文を検索</h2>
    <form class="sr-form" role="search">
      <input type="search" id="sr-q" placeholder="ことばを入れてください（例：午後三時）" autocomplete="off" enterkeyhint="search">
      <button class="btn" type="submit">探す</button>
    </form>
    <div class="sr-notice" hidden></div>
    <div class="sr-hist"></div>
    <ol class="sr-res" aria-live="polite"></ol>
    <button class="btn btn--ghost" type="button" data-close>閉じる</button>
  </div>
</div>
<div class="toast" role="status" aria-live="polite" hidden></div>"""

# ------------------------------------------------------------------ 画像スロット
def slot(name, ratio, cls="", alt=""):
    return (f'<figure class="slot {cls}" data-slot="{name}" style="--ratio:{ratio}">'
            f'<span class="slot-alt">{esc(alt)}</span></figure>')

# ------------------------------------------------------------------ 本の生成
def build_book(book, search_rows):
    md = (SRC / book["md"]).read_text(encoding="utf-8")
    pre, chs = split_chapters(md)
    root_book = "../"
    chapters = []
    if book["key"] == "mega":
        return build_mega(book, pre, chs, search_rows)
    for idx, (title, body) in enumerate(chs):
        num, name = parse_title(title)
        suffix = ["00", "01", "02", "03", "04", "05", "06a", "06b", "07"][idx] if book["key"] == "as" else f"{idx:02d}"
        key = f'{book["key"]}-{suffix}'
        chapters.append(dict(num=num, name=name, key=key, slug=suffix, body=body))
    # 章ページ
    for i, c in enumerate(chapters):
        counter = [0]
        html_body, plain_lines = render_body(c["body"], counter)
        chars = sum(len(t) for _, t in plain_lines)
        minutes = max(1, round(chars / 550))
        prev = chapters[i - 1] if i > 0 else None
        nxt = chapters[i + 1] if i + 1 < len(chapters) else None
        root = "../../"
        head_title = f'{c["num"]}　{c["name"]}'.strip("　")
        for n, t in plain_lines:
            search_rows.append([book["key"], c["key"], f'{book["dir"]}/{c["slug"]}/', head_title, n, t])
        nav_prev = (f'<a class="pn pn--prev" href="../{prev["slug"]}/"><span class="pn-k">前の章</span>'
                    f'<span class="pn-t">{esc(prev["num"])}　{esc(prev["name"])}</span></a>') if prev else '<span></span>'
        if nxt:
            nav_next = (f'<a class="pn pn--next" href="../{nxt["slug"]}/"><span class="pn-k">次の章</span>'
                        f'<span class="pn-t">{esc(nxt["num"])}　{esc(nxt["name"])}</span></a>')
        else:
            other = {"as": ("echo", "残響を読む"), "echo": ("megalavania", "関連作『メガラバニア』を読む")}.get(book["key"])
            nav_next = (f'<a class="pn pn--next" href="{root}{other[0]}/"><span class="pn-k">この本はここまで</span>'
                        f'<span class="pn-t">{other[1]}</span></a>') if other else ""
        first = plain_lines[0][1] if plain_lines else ""
        desc = f'{book["title"]} {head_title}。{first[:70]}'
        body_html = f"""<article class="reader" data-book="{book['key']}" data-key="{c['key']}">
  <header class="ch-head">
    <p class="ch-book"><a href="../">{esc(book['title'])}</a></p>
    <h1 class="ch-title"><span class="ch-num">{esc(c['num'])}</span>{f'<span class="ch-name">{esc(c["name"])}</span>' if c['name'] else ''}</h1>
    <p class="ch-meta">約{minutes}分　{chars:,}字</p>
    {slot('ch-' + c['key'], '3/2', 'slot--chapter', '')}
  </header>
  <div class="resume" hidden><p>前回は、この章の途中まで読んでいました。</p><button class="btn" type="button" data-act="resume">続きから</button><button class="btn btn--ghost" type="button" data-act="dismiss">最初から</button></div>
  <div class="text" id="text" tabindex="0" lang="ja">
    <h2 class="tate-title" aria-hidden="true"><span class="tt-book">{esc(book['title'])}</span><span class="tt-num">{inline(c['num'])}</span>{f'<span class="tt-name">{esc(c["name"])}</span>' if c['name'] else ''}</h2>
{html_body}
    <p class="end-mark" id="end" aria-hidden="true">了</p>
  </div>
  <footer class="ch-end">
    <div class="unlocked" hidden></div>
    <div class="memo">
      <label for="memo-text">この章で覚えておきたいこと</label>
      <textarea id="memo-text" rows="3" placeholder="書いた内容は、この端末の中にだけ保存されます。"></textarea>
      <p class="memo-saved" aria-live="polite"></p>
    </div>
    <nav class="pn-row" aria-label="章の移動">{nav_prev}{nav_next}</nav>
    <p class="share"><a class="share-x" href="https://x.com/intent/post?text={quote(book['title'] + '　' + head_title)}&amp;url={quote(SITE + book['dir'] + '/' + c['slug'] + '/', safe='')}" rel="noopener" target="_blank">この章をXで共有</a></p>
  </footer>
</article>"""
        out = OUT / book["dir"] / c["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page(path=f'{book["dir"]}/{c["slug"]}/', title=f'{head_title}｜{book["title"]}',
                            desc=desc, body=body_html, kind="chapter", root=root, og=f'og-{book["key"]}.png',
                            data_attrs={"book": book["key"], "key": c["key"]}), encoding="utf-8")
    # 本の扉
    build_book_index(book, chapters)
    return chapters

def build_book_index(book, chapters):
    root = "../"
    toc = "".join(
        f'<li data-key="{c["key"]}"><a href="{c["slug"]}/"><span class="toc-num">{esc(c["num"] if c["name"] else "")}</span>'
        f'<span class="toc-name">{esc(c["name"] or c["num"])}</span><span class="toc-state"></span></a></li>' for c in chapters)
    first = chapters[0]["slug"]
    body = f"""<section class="book-top" data-book="{book['key']}">
  <div class="book-cover">
    {slot('cover-' + book['key'], '2/3', 'slot--cover', '')}
    <div class="cover-type" aria-hidden="true"><span class="cover-part">{esc(book['part'])}</span><span class="cover-title">{esc(book['title'])}</span>{f'<span class="cover-sub">{esc(book["sub"])}</span>' if book['sub'] else ''}</div>
  </div>
  <div class="book-info">
    <p class="book-part">{esc(book['part'])}</p>
    <h1 class="book-title">{esc(book['title'])}</h1>
    {f'<p class="book-sub">{esc(book["sub"])}</p>' if book['sub'] else ''}
    <p class="book-blurb">{esc(book['blurb'])}</p>
    <p class="book-note">{esc(book['note'])}</p>
    <p class="book-go"><a class="btn btn--ink" href="{first}/">最初から読む</a><a class="btn btn--ghost book-resume" href="#" hidden>続きから読む</a></p>
    <p class="book-dl"><a href="{root}dl/{book['md'].replace('.md', '.pdf')}" download>PDFで読む（A5）</a></p>
  </div>
</section>
<section class="toc" aria-labelledby="toc-h">
  <h2 id="toc-h">目次</h2>
  <ol class="toc-list">{toc}</ol>
</section>"""
    out = OUT / book["dir"] / "index.html"
    out.write_text(page(path=f'{book["dir"]}/', title=book["title"], desc=book["blurb"], body=body, kind="book",
                        root=root, og=f'og-{book["key"]}.png', data_attrs={"book": book["key"]}), encoding="utf-8")

def build_mega(book, pre, chs, search_rows):
    """メガラバニアは一枚のミラーページとして読む。"""
    root = "../"
    counter = [0]
    pre_html, pre_plain = render_body(pre, counter)
    parts = [pre_html]
    plain_all = list(pre_plain)
    toc = ['<li><a href="#mirror-thread">発掘スレ</a></li>', '<li><a href="#mirror-page">作品ページ</a></li>']
    for idx, (title, body) in enumerate(chs):
        num, name = parse_title(title)
        h, pl = render_body(body, counter)
        plain_all += pl
        anchor = f"ep{idx + 1}"
        art = slot('ch-mega', '3/2', 'slot--chapter', '') if idx == 2 else ''
        parts.append(f'<h2 class="ep" id="{anchor}"><span class="ep-num">{esc(num)}</span><span class="ep-name">{esc(name)}</span></h2>\n{art}\n{h}')
        if idx == 2:  # 第3話はミラーの目次では辿れない
            toc.append(f'<li class="toc-404"><span>{esc(num)}　{esc(name)}</span><span class="e404">404</span></li>')
        else:
            toc.append(f'<li><a href="#{anchor}">{esc(num)}　{esc(name)}</a></li>')
    for n in (6, 7, 8):
        toc.append(f'<li class="toc-ann"><span>第{n}話</span><span class="e404">告知のみ</span></li>')
    for n, t in plain_all:
        search_rows.append(["mega", "mega", "megalavania/", "メガラバニア", n, t])
    body = "\n".join(parts)
    # 掲示板と作品ページにアンカーを付ける
    body = body.replace('<section class="doc doc--board">', '<section class="doc doc--board" id="mirror-thread">', 1)
    body = body.replace('<section class="doc doc--oldweb">', '<section class="doc doc--oldweb" id="mirror-page">', 1)
    chars = sum(len(t) for _, t in plain_all)
    page_html = f"""<article class="reader reader--mega" data-book="mega" data-key="mega">
  <header class="ch-head mega-head">
    <p class="ch-book">関連作</p>
    <h1 class="ch-title"><span class="ch-num">メガラバニア</span><span class="ch-name">作　楓</span></h1>
    <p class="ch-meta">約{max(1, round(chars / 550))}分　{chars:,}字</p>
    {slot('cover-mega', '2/3', 'slot--cover slot--mega', '')}
    <nav class="mirror-toc" aria-label="ミラーの目次"><p>ミラー目次</p><ol>{''.join(toc)}</ol></nav>
  </header>
  <div class="resume" hidden><p>前回は、途中まで読んでいました。</p><button class="btn" type="button" data-act="resume">続きから</button><button class="btn btn--ghost" type="button" data-act="dismiss">最初から</button></div>
  <div class="text" id="text" tabindex="0" lang="ja">
{body}
    <p class="end-mark" id="end" aria-hidden="true">了</p>
  </div>
  <footer class="ch-end">
    <div class="unlocked" hidden></div>
    <div class="memo">
      <label for="memo-text">この作品で覚えておきたいこと</label>
      <textarea id="memo-text" rows="3" placeholder="書いた内容は、この端末の中にだけ保存されます。"></textarea>
      <p class="memo-saved" aria-live="polite"></p>
    </div>
    <nav class="pn-row" aria-label="移動"><a class="pn pn--prev" href="{root}"><span class="pn-k">本棚へ</span><span class="pn-t">ほかの本を読む</span></a><a class="pn pn--next" href="{root}archive/"><span class="pn-k">資料室へ</span><span class="pn-t">記録を見る</span></a></nav>
    <p class="book-dl"><a href="{root}dl/MEGALAVANIA.pdf" download>PDFで読む（A5）</a></p>
  </footer>
</article>"""
    out = OUT / "megalavania" / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page(path="megalavania/", title="メガラバニア", desc=book["blurb"], body=page_html,
                        kind="chapter", root=root, og="og-mega.png", data_attrs={"book": "mega", "key": "mega"},
                        bodycls="is-mega"), encoding="utf-8")
    return [dict(num="メガラバニア", name="", key="mega", slug="")]

# ------------------------------------------------------------------ 補助ページ
def json_script(obj, id_):
    return f'<script type="application/json" id="{id_}">{json.dumps(obj, ensure_ascii=False)}</script>'

def chapter_index(all_chapters):
    """章キー → 表示名とリンク"""
    idx = {}
    for book, chs in all_chapters:
        for c in chs:
            href = f'{book["dir"]}/{c["slug"]}/' if c["slug"] else f'{book["dir"]}/'
            label = f'{book["title"]}　{c["num"]}' if book["key"] != "mega" else "メガラバニア"
            idx[c["key"]] = dict(label=label, href=href, book=book["key"])
    return idx


def hero_clock():
    """駅前の柱時計（線画）。インクの層とボールペンの層を少しずらして重ねる。針は現在時刻。"""
    ticks = []
    import math
    for i in range(60):
        a = math.radians(i * 6)
        r1 = 70 if i % 5 else 63
        x1, y1 = 100 + 76 * math.sin(a), 112 - 76 * math.cos(a)
        x2, y2 = 100 + r1 * math.sin(a), 112 - r1 * math.cos(a)
        w = 2.2 if i % 5 == 0 else 1
        ticks.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke-width="{w}"/>')
    face = "".join(ticks)
    def layer(cls):
        return f"""<g class="{cls}">
  <path d="M60 30 Q100 6 140 30" />
  <circle cx="100" cy="112" r="88"/>
  <circle cx="100" cy="112" r="81"/>
  {face}
  <line class="hc-h" x1="100" y1="112" x2="100" y2="68" stroke-width="5" stroke-linecap="round"/>
  <line class="hc-m" x1="100" y1="112" x2="100" y2="46" stroke-width="3" stroke-linecap="round"/>
  <line class="hc-s" x1="100" y1="126" x2="100" y2="40" stroke-width="1.2"/>
  <circle cx="100" cy="112" r="3.5" class="hc-pin"/>
  <path d="M92 200 L92 396 M108 200 L108 396"/>
  <path d="M78 396 L122 396 L128 410 L72 410 Z"/>
  <path d="M86 200 L114 200"/>
</g>"""
    return f"""<svg class="hero-clock" viewBox="0 0 200 420" role="img" aria-label="駅前の柱時計。針は、いまの時刻を指しています">
{layer('hc-pen')}{layer('hc-ink')}</svg>"""

def build_home(all_chapters, chidx):
    root = ""
    spines = []
    for book, chs in all_chapters:
        n = len(chs) if book["key"] != "mega" else 1
        spines.append(f"""<li class="spine spine--{book['key']}" data-book="{book['key']}">
  <a href="{book['dir']}/">
    <span class="spine-part">{esc(book['part'])}</span>
    <span class="spine-title">{esc(book['title'])}</span>
    <span class="spine-meta">{ {'as': '全九章', 'echo': '全六話', 'mega': '五話と掲示板'}[book['key']] }</span>
    <span class="spine-read" aria-hidden="true"></span>
  </a>
  <div class="spine-card">
    <p class="spine-hook">{esc(book['hook'])}</p>
    <p class="spine-blurb">{esc(book['blurb'])}</p>
  </div>
</li>""")
    cards = [
        ("archive/", "資料室", "作中に出てくる作品の記録。読み進めると、棚に資料が増えていく。"),
        ("timeline/", "年表", "記録に残っていることと、誰かが覚えていることを、並べて置いています。"),
        ("people/", "人物録", "登場人物の記録。「覚えておく」を押すと、あなたのノートに写しが残ります。"),
        ("notes/", "記憶ノート", "あなたが書いたこと、覚えておいたこと。この端末の中にだけあります。"),
    ]
    card_html = "".join(f"""<li class="lcard" data-page="{href}">
  <a href="{href}">
    <span class="lcard-title">{t}</span>
    <span class="lcard-desc">{d}</span>
    <span class="lcard-table" aria-label="あなたの閲覧日"><span class="lcard-th">閲覧日</span><span class="lcard-rows"></span></span>
  </a>
</li>""" for href, t, d in cards)
    HERO_CLOCK = hero_clock()
    body = f"""<section class="hero" aria-labelledby="hero-title">
  <canvas class="rain" aria-hidden="true"></canvas>
  <div class="hero-in">
    <h1 class="hero-title" id="hero-title"><span class="ht-ink">残響</span><span class="ht-pen" aria-hidden="true">残響</span></h1>
    <div class="hero-line">
      <p class="hl-first">詩集は三日前から同じページで開いていた。</p>
      <p class="hl-return" hidden><span class="hl-k">前回、あなたはここまで読んでいました</span><span class="hl-t"></span></p>
    </div>
    <div class="hero-act">
      <a class="btn btn--ink" href="as/00/" data-first>最初の一行から読む</a>
      <a class="btn btn--ghost" href="#" data-continue hidden>続きを読む</a>
      <p class="hero-sub">三つの小説と、その資料室。</p>
    </div>
    <div class="hero-art">
      {slot('hero', '2/3', 'slot--hero', '')}
      {HERO_CLOCK}
    </div>
  </div>
</section>
<section class="shelf" aria-labelledby="shelf-h">
  <h2 id="shelf-h">本棚</h2>
  <p class="shelf-guide">はじめての方は、左の『ARTIFICIAL SALVATION』から。二冊目の『残響』で、一冊目の意味が変わります。『メガラバニア』はいつ読んでも構いません。</p>
  <ol class="spines">{''.join(spines)}</ol>
</section>
<section class="cards" aria-labelledby="cards-h">
  <h2 id="cards-h">本を閉じたあとに</h2>
  <ul class="lcards">{card_html}
  <li class="lcard lcard--check" data-page="check/" hidden><a href="check/"><span class="lcard-title">記憶照合</span><span class="lcard-desc">あなたの記憶と、いまの記録を照らし合わせます。</span><span class="lcard-table"><span class="lcard-th">閲覧日</span><span class="lcard-rows"></span></span></a></li>
  </ul>
</section>"""
    (OUT / "index.html").write_text(page(
        path="", title=SITE_NAME,
        desc="三つの小説と、その資料室。ARTIFICIAL SALVATION／残響／メガラバニア。記録と記憶が食い違いはじめる世界の、モキュメンタリーと小説。",
        body=body, kind="home", root=root), encoding="utf-8")

def build_archive(chidx):
    root = "../"
    body = f"""<section class="sub-top">
  <h1 class="sub-title">資料室</h1>
  <p class="sub-lead">作中に出てくる作品の記録です。章を読み終えるたびに、棚に資料が増えます。</p>
  <p class="sub-note" data-converged-note hidden>この棚の記載は、最新の記録に合わせて更新されています。</p>
</section>
<ol class="arc" id="arc"></ol>
{json_script(dict(items=data.ARCHIVE, ch=chidx), 'zk-archive')}"""
    p = OUT / "archive" / "index.html"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(page(path="archive/", title="資料室", desc="作中に出てくる作品の記録。読み進めると増えていく資料の棚。",
                      body=body, kind="archive", root=root), encoding="utf-8")

def build_people(chidx):
    root = "../"
    body = f"""<section class="sub-top">
  <h1 class="sub-title">人物録</h1>
  <p class="sub-lead">登場人物の記録です。「覚えておく」を押すと、その時点の記載があなたの記憶ノートに写されます。</p>
  <p class="sub-count" data-people-count></p>
</section>
<div class="ppl" id="ppl"></div>
{json_script(dict(items=data.PEOPLE, ch=chidx, books={b['key']: b['title'] for b in data.BOOKS}), 'zk-people')}"""
    p = OUT / "people" / "index.html"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(page(path="people/", title="人物録", desc="登場人物の記録。覚えておいた記載は、あなたのノートに残ります。",
                      body=body, kind="people", root=root), encoding="utf-8")

def build_timeline(chidx):
    root = "../"
    body = f"""<section class="sub-top">
  <h1 class="sub-title">年表</h1>
  <p class="sub-lead">左に記録、右に記憶。どちらか一方にしか残っていない出来事もあります。</p>
</section>
<div class="tl-head" aria-hidden="true"><span>記録</span><span></span><span>記憶</span></div>
<ol class="tl" id="tl"></ol>
{json_script(dict(items=data.TIMELINE, ch=chidx), 'zk-timeline')}"""
    p = OUT / "timeline" / "index.html"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(page(path="timeline/", title="年表", desc="記録に残っていることと、誰かが覚えていること。",
                      body=body, kind="timeline", root=root), encoding="utf-8")

def build_notes(chidx):
    root = "../"
    body = f"""<section class="sub-top">
  <h1 class="sub-title">記憶ノート</h1>
  <p class="sub-lead">あなたが書いたことと、覚えておいたこと。この記録は、あなたのブラウザの中にだけあります。サーバーには届きません。</p>
</section>
<div class="nb" id="nb"></div>
<section class="nb-tools">
  <button class="btn btn--ghost" type="button" data-act="export">テキストで保存する</button>
  <button class="btn btn--ghost" type="button" data-act="wipe">ノートを空にする</button>
</section>
{json_script(dict(ch=chidx, archive=data.ARCHIVE, people=data.PEOPLE), 'zk-notes')}"""
    p = OUT / "notes" / "index.html"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(page(path="notes/", title="記憶ノート", desc="あなたが書いたこと、覚えておいたこと。この端末の中にだけある記録。",
                      body=body, kind="notes", root=root), encoding="utf-8")

def build_check(chidx):
    root = "../"
    body = f"""<section class="sub-top">
  <h1 class="sub-title">記憶照合</h1>
  <p class="sub-lead">本を見返さずに答えてください。正解は表示しません。いまの記録と、あなたの記憶を並べるだけです。</p>
</section>
<div class="qz" id="qz"><p class="qz-lock">『残響』を最後まで読むと、ここが開きます。</p></div>
{json_script(dict(items=data.QUIZ), 'zk-quiz')}"""
    p = OUT / "check" / "index.html"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(page(path="check/", title="記憶照合", desc="あなたの記憶と、いまの記録を照らし合わせる。",
                      body=body, kind="check", root=root), encoding="utf-8")

def build_about():
    root = "../"
    body = f"""<section class="sub-top">
  <h1 class="sub-title">この場所について</h1>
</section>
<div class="prose">
  <h2>三つの小説</h2>
  <p>『ARTIFICIAL SALVATION』は、探偵の高橋誠が、創作物をめぐる事件を追う長編です。『残響』は、記事やレビューや掲示板の資料を読み進めるうちに小説へ変わっていく作品です。『メガラバニア』は、2012年の投稿小説と、それを掘り起こした掲示板の記録です。</p>
  <p>どれから読んでも成立します。はじめての方には、『ARTIFICIAL SALVATION』から『残響』への順番をおすすめします。</p>
  <h2>読み方</h2>
  <p>右上の「文字」から、文字の大きさ、行の間隔、書体、縦書きと横書き、背景を変えられます。読んでいた位置は自動で覚えておき、次に開いたときに「続きから」を表示します。</p>
  <p>「雨音」を押すと、雨の音が流れます。音は端末の中で作っているもので、外部から読み込んでいません。</p>
  <h2>このサイトは、読み進めると変わります</h2>
  <p>資料室、年表、人物録は、あなたがどこまで読んだかに合わせて記載が増えます。読んでいない章の内容には触れません。</p>
  <p>ある章を読み終えると、記載が書き換わることがあります。書き換わる前の記載を残しておきたいときは、「覚えておく」を押してください。あなたの記憶ノートに、その時点の写しが残ります。</p>
  <h2>保存しているもの</h2>
  <p>読んだ位置、読み終えた章、表示の設定、記憶ノート、検索の履歴を、あなたのブラウザの中（localStorage）に保存します。サーバーには送りません。アクセス解析も入れていません。</p>
  <p>記録を最初の状態に戻したいときは、下のボタンを押してください。記憶ノートも含めて、すべて消えます。</p>
  <p><button class="btn btn--ghost" type="button" data-act="reset-all">すべての記録を消す</button></p>
  <h2>内容について</h2>
  <p>殺人事件、大規模な死、いじめや暴力の示唆を含みます。</p>
  <p>本作はフィクションです。実在の人物、団体、作品とは関係ありません。</p>
  <h2>PDF</h2>
  <ul class="dl-list">
    <li><a href="{root}dl/ARTIFICIAL_SALVATION.pdf" download>ARTIFICIAL SALVATION（A5）</a></li>
    <li><a href="{root}dl/ZANKYOU.pdf" download>残響（A5）</a></li>
    <li><a href="{root}dl/MEGALAVANIA.pdf" download>メガラバニア（A5）</a></li>
  </ul>
  <h2>作者</h2>
  <p>月真猫（TSUKI PRODUCT）。静岡を拠点に、AI映像、音楽、ゲーム、ウェブの作品を作っています。</p>
</div>"""
    p = OUT / "about" / "index.html"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(page(path="about/", title="この場所について", desc="三つの小説について。読み方と、このサイトが保存するもの。",
                      body=body, kind="about", root=root), encoding="utf-8")

# ------------------------------------------------------------------ 実行
def main():
    search_rows = []
    all_chapters = []
    for b in data.BOOKS:
        chs = build_book(b, search_rows)
        all_chapters.append((b, chs))
    chidx = chapter_index(all_chapters)
    order = [k for _, chs in all_chapters for k in [c["key"] for c in chs]]
    build_home(all_chapters, chidx)
    build_archive(chidx)
    build_people(chidx)
    build_timeline(chidx)
    build_notes(chidx)
    build_check(chidx)
    build_about()
    (OUT / "assets").mkdir(exist_ok=True)
    (OUT / "assets" / "search.json").write_text(json.dumps(dict(rows=search_rows), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "assets" / "data.json").write_text(json.dumps(dict(archive=data.ARCHIVE, people=data.PEOPLE), ensure_ascii=False), encoding="utf-8")
    (OUT / "assets" / "chapters.json").write_text(json.dumps(dict(order=order, ch=chidx), ensure_ascii=False), encoding="utf-8")
    print(f"pages built. chapters={len(order)} search_rows={len(search_rows)}")

if __name__ == "__main__":
    main()
