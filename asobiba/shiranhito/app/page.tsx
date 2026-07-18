"use client";

import { useEffect, useMemo, useState } from "react";
import { peopleBySlug, peopleV2 } from "./people-v2";
import type { Block, PersonV2 } from "./people-v2";

type Route = { slug: string; page: string };
const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE || "";

function routeFromHash(): Route {
  if (typeof window === "undefined") return { slug: "", page: "" };
  const q = new URLSearchParams(window.location.hash.replace(/^#\??/, ""));
  return { slug: q.get("person") || "", page: q.get("page") || "" };
}

function go(slug = "", page = "") {
  window.location.hash = slug ? `person=${slug}&page=${page}` : "top";
}

function Counter({ value, narrow = false }: { value: number; narrow?: boolean }) {
  const digits = String(value).padStart(narrow ? 5 : 6, "0");
  return <span className="counter" aria-label={`${value}人目`}>{digits.split("").map((digit, index) => <b key={`${digit}-${index}`}>{digit}</b>)}</span>;
}

function ContactCrop({ kind, sheet, cell, label, compact = false }: { kind: "portrait" | "scene"; sheet: string; cell: number; label: string; compact?: boolean }) {
  const position = `${cell * 25}% 50%`;
  return <div className={`${kind}-crop ${compact ? "compact" : ""}`} role="img" aria-label={label} style={{ backgroundImage: `url(${assetBase}/assets/v2/${kind}-${sheet}.png)`, backgroundSize: "500% 100%", backgroundPosition: position }} />;
}

function Archive({ count }: { count: number }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => peopleV2.filter((person) => {
    const haystack = `${person.name}${person.title}${person.job}${person.town}${person.tagline}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (filter === "all" || person.mood === filter);
  }), [query, filter]);

  return <main className="archive-v2">
    <header className="archive-banner">
      <div className="archive-stars">★ ☆ ★ ☆ ★　WELCOME TO MY LINK PAGE　★ ☆ ★ ☆ ★</div>
      <h1>知らん人のホームページ集</h1>
      <p>顔も知らない。なのに三ページ読むと、少しだけ心配になる。</p>
      <div className="archive-marquee"><span>NEW! 午前3時17分の受信記録／500円昼めし投票受付終了／閉じた隧道の東口情報は募集していません</span></div>
    </header>

    <div className="archive-status">
      <span>最終更新：2001年7月24日</span>
      <span>あなたは <Counter value={count} /> 人目の迷子です</span>
    </div>

    <div className="archive-layout">
      <aside className="archive-control">
        <h2>◆ ページを探す ◆</h2>
        <label>名前・職業・気になる言葉<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="mood-buttons">
          {[["all", "全部"], ["bright", "楽しい"], ["quiet", "真面目"], ["strange", "変"], ["dark", "不穏"]].map(([id, label]) => <button className={filter === id ? "selected" : ""} key={id} onClick={() => setFilter(id)}>{label}</button>)}
        </div>
        <div className="archive-note">
          <b>このリンク集について</b>
          <p>二十人は全員架空です。ただし、ページの中では互いを知っています。</p>
          <p>掲示板は保存ログのため、書き込みできません。</p>
        </div>
        <div className="construction">工事中<br />UNDER<br />CONSTRUCTION</div>
      </aside>

      <section className="archive-list" id="people">
        <div className="archive-intro"><b>登録ページ {filtered.length}件</b><span>［怖いページには印を付けていません］</span></div>
        {filtered.map((person, index) => <article className={`directory-card mood-${person.mood} card-${person.layout}`} key={person.slug}>
          <button className="directory-photo" onClick={() => go(person.slug, person.pages[0].id)} aria-label={`${person.title}を開く`}><ContactCrop kind="portrait" sheet={person.portraitSheet} cell={person.portraitCell} label={`${person.name}の写真`} compact /></button>
          <div className="directory-number">{String(index + 1).padStart(2, "0")} {person.icon}</div>
          <div className="directory-copy">
            <button className="directory-title" onClick={() => go(person.slug, person.pages[0].id)}>{person.title}</button>
            <p className="directory-tagline">{person.tagline}</p>
            <p><b>{person.name}</b>（{person.age}）／{person.job}／{person.town}</p>
            <small>更新 {person.updated}　雰囲気：{person.mood === "bright" ? "だいたい安心" : person.mood === "quiet" ? "静か" : person.mood === "strange" ? "妙" : "閲覧は昼間に"}</small>
          </div>
        </article>)}
      </section>
    </div>

    <footer className="archive-footer">
      <div className="webring">← 前の知らん人　［知らん人WEB RING］　次の知らん人 →</div>
      <p>リンク切れ報告は受け付けていません。切れたリンクも記録の一部です。</p>
      <p>※人物・団体・出来事はすべて架空です。実在の個人とは関係ありません。</p>
    </footer>
  </main>;
}

function BlockView({ block, person, index }: { block: Block; person: PersonV2; index: number }) {
  if (block.type === "photo") return <article className="block block-photo">
    <ContactCrop kind="scene" sheet={person.sceneSheet} cell={person.sceneCell} label={block.title} />
    <div className="photo-copy"><h3>{block.title}</h3><p className="caption">{block.caption}</p>{block.body?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
  </article>;

  if (block.type === "diary") return <article className="block block-diary">
    <header><time>{block.date}</time><h3>{block.title}</h3></header>
    <ContactCrop kind="scene" sheet={person.sceneSheet} cell={person.sceneCell} label={`${block.title}の日記写真`} compact />
    <div>{block.body?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
  </article>;

  if (block.type === "warning") return <article className="block block-warning"><h3>！ {block.title} ！</h3>{block.body?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</article>;
  if (block.type === "letter") return <article className="block block-letter"><h3>{block.title}</h3>{block.body?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}<div className="letter-fold">―― 折り目 ――</div></article>;
  if (block.type === "bbs") return <article className="block block-bbs"><h3>{block.title} <small>［保存ログ・投稿不可］</small></h3>{block.rows?.map((row, i) => <div className="bbs-row" key={i}><b>{row[0]}</b><p>{row[1]}</p><span>［返信］［削除］</span></div>)}</article>;
  if (block.type === "quiz") return <article className="block block-quiz"><h3>{block.title}</h3>{block.rows?.map((row, i) => <label key={i}><input type="radio" disabled name={`quiz-${person.slug}-${index}`} /> <b>{row[0]}</b>　{row[1]}</label>)}<button disabled>投票する（終了）</button></article>;

  const className = block.type === "log" ? "block-log" : block.type === "collection" ? "block-collection" : "block-table";
  return <article className={`block ${className}`}><h3>{block.title}</h3><table><tbody>{block.rows?.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></article>;
}

function ThemeToy({ person }: { person: PersonV2 }) {
  const [opened, setOpened] = useState(false);
  if (person.layout === "occult") return <div className="theme-toy occult-toy"><button onClick={() => setOpened(!opened)}>{opened ? "閉じる" : "三枚目を開く"}</button>{opened && <p>画像はありません。あなたの画面が暗くなったとき、後ろだけがよく見えます。</p>}</div>;
  if (person.layout === "receipt") return <div className="theme-toy budget-toy"><b>本日の残金</b><meter min="0" max="500" value="0" /> 0円</div>;
  if (person.layout === "ledger") return <div className="theme-toy stamp-toy">点検済<br /><small>異常なし</small></div>;
  if (person.layout === "pixel") return <div className="theme-toy pixel-toy">LIFE ■■■□<br />ROOM 19 / ?</div>;
  if (person.layout === "radio") return <div className="theme-toy wave-toy">⌁⌁⌁ ▂▅▇▃▁ ⌁⌁⌁</div>;
  if (person.layout === "party") return <div className="theme-toy party-toy">祝・別々の門出！</div>;
  if (person.layout === "security") return <div className="theme-toy security-toy"><i /> 戸締まり：確認したつもり</div>;
  return <div className="theme-toy simple-toy">{person.icon} {person.tagline}</div>;
}

function PersonalSite({ person, pageId, count }: { person: PersonV2; pageId: string; count: number }) {
  const page = person.pages.find((item) => item.id === pageId) || person.pages[0];
  const style = { "--bg": person.colors[0], "--ink": person.colors[1], "--accent": person.colors[2], "--paper": person.colors[3] } as React.CSSProperties;

  return <main className={`personal-v2 theme-${person.layout} mood-${person.mood}`} style={style}>
    <div className="personal-shell">
      <header className="personal-header">
        <div className="header-icon">{person.icon}</div>
        <div><h1>{person.title}</h1><p>{person.tagline}</p></div>
        <div className="header-since">SINCE {person.since}<br />LAST UPDATE {person.updated}</div>
      </header>

      <nav className="personal-nav" aria-label={`${person.title}のメニュー`}>
        {person.pages.map((item) => <button key={item.id} className={page.id === item.id ? "active" : ""} onClick={() => go(person.slug, item.id)}>{item.label}</button>)}
        <button onClick={() => go()}>リンク集へ戻る</button>
      </nav>

      <aside className="personal-owner">
        <ContactCrop kind="portrait" sheet={person.portraitSheet} cell={person.portraitCell} label={`${person.name}の肖像`} />
        <h2>管理人</h2>
        <p className="owner-name">{person.name}<small>（{person.kana}）</small></p>
        <dl><dt>年齢</dt><dd>{person.age}歳</dd><dt>職業</dt><dd>{person.job}</dd><dt>所在地</dt><dd>{person.town}</dd></dl>
        <ul>{person.profile.map((line) => <li key={line}>{line}</li>)}</ul>
        <div className="owner-counter">あなたは<br /><Counter value={count} narrow /><br />人目のお客様</div>
      </aside>

      <section className="personal-content">
        <div className="personal-intro">{person.intro.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
        <ThemeToy person={person} />
        <div className="page-title"><span>{person.icon}</span><h2>{page.label}</h2><span>{person.icon}</span></div>
        <div className="blocks">{page.blocks.map((block, index) => <BlockView block={block} person={person} index={index} key={`${block.title}-${index}`} />)}</div>
      </section>

      <aside className="personal-links">
        <h2>相互リンク</h2>
        {person.links.map((link) => { const friend = peopleBySlug.get(link.slug); return friend ? <button key={link.slug} onClick={() => go(friend.slug, friend.pages[0].id)}><b>{friend.icon} {friend.title}</b><small>{link.note}</small></button> : null; })}
        <p>当サイトはリンクフリーです。バナーはお持ち帰りください。</p>
      </aside>

      <footer className="personal-footer">
        <p>このページに掲載された文章・写真の無断転載を禁じます。</p>
        <p>Copyright (C) 1996-2001 {person.name}. All Rights Reserved.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>▲ PAGE TOP</button>
      </footer>
    </div>
  </main>;
}

export default function Home() {
  const [route, setRoute] = useState<Route>({ slug: "", page: "" });
  const [counts, setCounts] = useState<Record<string, number>>({ archive: 88214 });

  useEffect(() => {
    const sync = () => setRoute(routeFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    const key = route.slug || "archive";
    const person = peopleBySlug.get(route.slug);
    const base = person?.counter || 88213;
    const timer = window.setTimeout(() => {
      let visits = 1;
      try {
        const storageKey = `shiran-v2-counter-${key}`;
        visits = Number(localStorage.getItem(storageKey) || "0") + 1;
        localStorage.setItem(storageKey, String(visits));
      } catch { /* private mode */ }
      setCounts((current) => ({ ...current, [key]: base + visits }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [route.slug]);

  const person = peopleBySlug.get(route.slug);
  if (!person) return <Archive count={counts.archive || 88214} />;
  return <PersonalSite person={person} pageId={route.page} count={counts[person.slug] || person.counter + 1} />;
}
