export default async function handler(_req, res) {
  const base = "https://www.chatgenius.pro";
  const staticUrls = [
    "/", "/fr/", "/es/", "/de/", "/ru/",
    "/demosites/", "/fr/demosites/", "/es/demosites/", "/de/demosites/", "/ru/demosites/",
    "/apper/", "/fr/apper/", "/es/apper/", "/de/apper/", "/ru/apper/",
    "/artikler/"
  ];

  let items = [];
  try {
    const response = await fetch("https://realtyflow.chatgenius.pro/api/public/website-content?brand=chatgenius&destination=artikler&limit=100");
    if (response.ok) {
      const payload = await response.json();
      items = Array.isArray(payload.items) ? payload.items : [];
    }
  } catch (_) {}

  const urls = [
    ...staticUrls.map(path => ({ loc: base + path, lastmod: "" })),
    ...items.filter(item => item && item.slug).map(item => ({
      loc: base + "/artikler/" + encodeURIComponent(item.slug),
      lastmod: item.updated_at || item.published_at || item.created_at || ""
    }))
  ];

  const seen = new Set();
  const escapeXml = value => String(value).replace(/[<>&'"]/g, ch => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;" }[ch]));
  const body = urls
    .filter(item => !seen.has(item.loc) && seen.add(item.loc))
    .map(item => [
      "  <url>",
      "    <loc>" + escapeXml(item.loc) + "</loc>",
      item.lastmod ? "    <lastmod>" + new Date(item.lastmod).toISOString() + "</lastmod>" : "",
      "  </url>"
    ].filter(Boolean).join("\n"))
    .join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + '\n</urlset>\n');
}
