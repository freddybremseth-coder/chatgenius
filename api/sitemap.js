export default async function handler(_req, res) {
  const base = "https://www.chatgenius.pro";
  const locales = ["no", "fr", "es", "de", "ru"];
  const localizedRoutes = ["/", "/demosites/", "/apper/"];
  const localizedPaths = new Set(
    localizedRoutes.flatMap(route => locales.map(lang =>
      lang === "no" ? route : "/" + lang + (route === "/" ? "/" : route)
    ))
  );
  const staticUrls = [
    "/", "/fr/", "/es/", "/de/", "/ru/",
    "/demo/", "/demosites/demo/",
    "/demosites/", "/fr/demosites/", "/es/demosites/", "/de/demosites/", "/ru/demosites/",
    "/apper/", "/fr/apper/", "/es/apper/", "/de/apper/", "/ru/apper/",
    "/ai-opplaering/", "/ai-resepsjonist/", "/nettsider-med-ai/", "/ai-automatisering/", "/skreddersydde-ai-systemer/",
    "/bruksomrader/", "/ai-for-sma-bedrifter/", "/ai-for-kundeservice/", "/ai-for-markedsforing/", "/ai-for-salg/", "/ai-for-eiendomsmeglere/",
    "/guider/", "/guider/slik-kommer-bedriften-i-gang-med-ai/", "/guider/hva-er-en-ai-agent/", "/guider/ai-automatisering-eksempler/", "/guider/chatgpt-claude-gemini-perplexity-bedrift/",
    "/case/", "/case/realtyflow/", "/case/olivia/", "/case/corporate-intelligence/", "/case/demosites/", "/case/familyhub/", "/case/remaster-reels/", "/integrasjoner/",
    "/om-chatgenius/", "/slik-jobber-vi/", "/kom-i-gang/",
    "/artikler/", "/privacy-policy"
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
    ...staticUrls.map(path => {
      const route = localizedRoutes.find(candidate =>
        locales.some(lang => path === (lang === "no" ? candidate : "/" + lang + (candidate === "/" ? "/" : candidate)))
      );
      const alternates = route && localizedPaths.has(path)
        ? locales.map(lang => ({
            lang,
            url: base + (lang === "no" ? route : "/" + lang + (route === "/" ? "/" : route))
          }))
        : [];
      if (alternates.length) alternates.push({ lang: "x-default", url: base + route });
      return { loc: base + path, lastmod: "", alternates };
    }),
    ...items.filter(item => {
      if (!item || !item.slug) return false;
      const title = String(item.title || "");
      return !/(privacy policy|personvernerklæring|\barticle \((instagram|facebook|nettside)\))/i.test(title);
    }).map(item => ({
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
      item.lastmod && Number.isFinite(Date.parse(item.lastmod))
        ? "    <lastmod>" + new Date(item.lastmod).toISOString() + "</lastmod>" : "",
      ...(item.alternates || []).map(alt =>
        '    <xhtml:link rel="alternate" hreflang="' + escapeXml(alt.lang) +
        '" href="' + escapeXml(alt.url) + '"/>'
      ),
      "  </url>"
    ].filter(Boolean).join("\n"))
    .join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + body + '\n</urlset>\n');
}
