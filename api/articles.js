const SITE = "https://www.chatgenius.pro";
const FEED = "https://realtyflow.chatgenius.pro/api/public/website-content?brand=chatgenius&destination=artikler&limit=100";

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function readableDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  return new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Oslo" }).format(new Date(value));
}

export default async function handler(_req, res) {
  let items;
  try {
    const response = await fetch(FEED, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Article feed unavailable");
    const payload = await response.json();
    items = Array.isArray(payload.items) ? payload.items : [];
  } catch {
    res.setHeader("Cache-Control", "no-store");
    res.status(503).send("Artiklene er midlertidig utilgjengelige");
    return;
  }

  const articles = items.filter(item =>
    item && typeof item.slug === "string" &&
    /^[a-z0-9][a-z0-9-]{0,99}$/.test(item.slug) && item.title
  );
  const cards = articles.map(item => {
    const url = "/artikler/" + encodeURIComponent(item.slug);
    const title = escapeHtml(item.title);
    const summary = escapeHtml(item.summary || "");
    const date = readableDate(item.published_at || item.created_at);
    return '<article class="article-card"><div class="article-body">' +
      (date ? '<p class="article-meta">' + escapeHtml(date) + '</p>' : '') +
      '<h2><a href="' + url + '">' + title + '</a></h2>' +
      (summary ? '<p>' + summary + '</p>' : '') +
      '<a class="text-link" href="' + url + '" aria-label="Les ' + title + '">Les artikkelen →</a>' +
      '</div></article>';
  }).join("\n");

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": SITE + "/artikler/#collection",
    url: SITE + "/artikler/",
    name: "Artikler | ChatGenius.pro",
    description: "Artikler fra ChatGenius.pro om AI, automatisering og digitale arbeidsflyter.",
    isPartOf: { "@id": SITE + "/#website" }
  };

  const html = '<!doctype html><html lang="no"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Artikler om AI og automatisering | ChatGenius.pro</title>' +
    '<meta name="description" content="Fagartikler og praktiske case fra ChatGenius.pro om AI, automatisering, salgssystemer og digitale arbeidsflyter.">' +
    '<link rel="canonical" href="' + SITE + '/artikler/">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:title" content="Artikler om AI og automatisering | ChatGenius.pro">' +
    '<meta property="og:url" content="' + SITE + '/artikler/">' +
    '<script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, "\\u003c") + '</script>' +
    '<link rel="stylesheet" href="/assets/styles.css">' +
    '<link rel="stylesheet" href="/artikler/styles.css">' +
    '<style>.article-list{grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));margin:2rem auto;max-width:1200px}.article-card a{color:var(--blue)}.article-card h2{line-height:1.3}</style>' +
    '</head><body>' +
    '<header class="site-header"><a class="brand" href="/">ChatGenius.pro</a>' +
    '<nav class="site-nav" aria-label="Hovedmeny"><a href="/">Forside</a><a href="/artikler/" aria-current="page">Artikler</a></nav>' +
    '<a class="header-action" href="/#contact">Kontakt</a></header>' +
    '<main><section class="articles-shell"><div class="hero-content"><p class="eyebrow">Fra praksis</p>' +
    '<h1>Artikler om AI, automatisering og digitale produkter</h1>' +
    '<p class="hero-copy">Forklaringer, erfaringer og eksempler fra ChatGenius.pro.</p></div>' +
    (cards ? '<div class="article-list">' + cards + '</div>' : '<p class="articles-state">Ingen publiserte artikler ennå.</p>') +
    '</section></main>' +
    '<script src="/assets/search-discovery.js" defer></script></body></html>';

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  res.status(200).send(html);
}
