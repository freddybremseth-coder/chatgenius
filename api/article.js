const SITE = "https://www.chatgenius.pro";
const FEED = "https://realtyflow.chatgenius.pro/api/public/website-content";

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const html = [];
  let list = [];
  let isFirstHeading = true;
  function flushList() {
    if (!list.length) return;
    html.push("<ul>" + list.map(item => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>");
    list = [];
  }
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }
    if (/^[-*]\s+/.test(line)) {
      list.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    flushList();
    const heading = line.match(/^#{1,6}\s+(.+)/);
    if (heading) {
      if (isFirstHeading) { isFirstHeading = false; continue; }
      html.push("<h2>" + escapeHtml(heading[1]) + "</h2>");
    } else {
      isFirstHeading = false;
      html.push("<p>" + escapeHtml(line) + "</p>");
    }
  }
  flushList();
  return html.join("\n");
}

export default async function handler(req, res) {
  let slug = typeof req.query?.slug === "string" ? req.query.slug : "";
  if (!slug) {
    try {
      const parsed = new URL(req.url || "/", SITE);
      slug = parsed.searchParams.get("slug") || parsed.pathname.split("/").filter(Boolean).pop() || "";
    } catch {}
  }
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)) {
    res.status(404).send("Artikkel ikke funnet");
    return;
  }

  let article;
  try {
    const response = await fetch(
      FEED + "?brand=chatgenius&destination=artikler&slug=" + encodeURIComponent(slug),
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) throw new Error("Article feed unavailable");
    article = (await response.json()).item;
  } catch {
    res.setHeader("Cache-Control", "no-store");
    res.status(503).send("Artikkel er midlertidig utilgjengelig");
    return;
  }
  if (!article || article.slug !== slug) {
    res.status(404).send("Artikkel ikke funnet");
    return;
  }

  const title = String(article.title || "Artikkel");
  const description = String(article.summary || "Fagartikkel om AI og digitale arbeidsflyter fra ChatGenius.pro").slice(0, 250);
  const url = SITE + "/artikler/" + encodeURIComponent(slug);
  const image = /^https:\/\//i.test(String(article.image_url || "")) ? article.image_url : "";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": url + "#article",
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || article.published_at || undefined,
    image: image || undefined,
    author: { "@type": "Organization", "@id": SITE + "/#organization", name: "ChatGenius.pro" },
    publisher: { "@type": "Organization", "@id": SITE + "/#organization", name: "ChatGenius.pro" }
  };
  const html = '<!doctype html><html lang="no"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(title) + ' | ChatGenius.pro</title>' +
    '<meta name="description" content="' + escapeHtml(description) + '">' +
    '<link rel="canonical" href="' + escapeHtml(url) + '">' +
    '<meta property="og:type" content="article">' +
    '<meta property="og:url" content="' + escapeHtml(url) + '">' +
    '<meta property="og:title" content="' + escapeHtml(title) + '">' +
    '<meta property="og:description" content="' + escapeHtml(description) + '">' +
    (image ? '<meta property="og:image" content="' + escapeHtml(image) + '">' : '') +
    '<script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, "\\u003c") + '</script>' +
    '<link rel="stylesheet" href="/assets/styles.css">' +
    '<link rel="stylesheet" href="/artikler/styles.css">' +
    '</head><body>' +
    '<header class="site-header"><a class="brand" href="/">ChatGenius.pro</a>' +
    '<nav class="site-nav" aria-label="Hovedmeny"><a href="/">Forside</a><a href="/artikler/">Artikler</a></nav></header>' +
    '<main><section class="articles-shell"><article class="detail-panel" style="max-width:860px;margin:4rem auto;padding:2rem">' +
    '<div class="detail-body"><a class="detail-back" href="/artikler/">← Tilbake til artikler</a>' +
    '<h1>' + escapeHtml(title) + '</h1>' +
    (description ? '<p class="detail-summary">' + escapeHtml(description) + '</p>' : '') +
    (image ? '<img class="detail-cover" src="' + escapeHtml(image) + '" alt="' + escapeHtml(title) + '">' : '') +
    '<div class="markdown">' + markdownToHtml(article.markdown) + '</div>' +
    '</div></article></section></main>' +
    '<script src="/assets/search-discovery.js" defer></script></body></html>';

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  res.status(200).send(html);
}
