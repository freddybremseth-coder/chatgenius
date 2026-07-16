/*
 * Genererer indekserbare språksider for chatgenius.pro.
 *
 * Norsk er kildespråket (index.html, demosites/, apper/). Dette scriptet
 * oversetter alle [data-i18n]-elementer og [data-i18n-ph]-placeholdere med
 * ordbøkene i assets/i18n-dict.js og skriver komplette sider til
 * /fr, /es, /de og /ru. Det setter også <html lang>, oversatt <title> og
 * meta-beskrivelse, skriver om interne lenker og ressursstier, og legger
 * hreflang + canonical inn i både språksidene og de norske kildesidene
 * (mellom <!-- i18n:hreflang -->-markørene, så kjøringen er idempotent).
 *
 *   node scripts/build-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Apex-domenet 307-omdirigerer til www — canonical/hreflang må bruke www.
const SITE = "https://www.chatgenius.pro";
const LANGS = ["fr", "es", "de", "ru"];

const PAGES = [
  { src: "index.html", id: "index", urlPath: "/" },
  { src: "demosites/index.html", id: "demo", urlPath: "/demosites/" },
  { src: "apper/index.html", id: "apper", urlPath: "/apper/" },
];

// Interne lenker som skal peke til samme språk. Alt annet (artikler, selger,
// eksterne domener, ankere) beholdes som de er.
const LOCALIZED_LINKS = ["/", "/demosites/", "/apper/", "/#contact"];

function loadDict() {
  const code = fs.readFileSync(path.join(root, "assets/i18n-dict.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  if (!sandbox.window.CG_DICT) throw new Error("Fant ikke window.CG_DICT i assets/i18n-dict.js");
  return sandbox.window.CG_DICT;
}

/** Finn slutten på et element ved å telle åpne/lukkede tagger av samme navn. */
function findElementEnd(html, tagName, contentStart) {
  const openRe = new RegExp(`<${tagName}(\\s|>)`, "gi");
  const closeRe = new RegExp(`</${tagName}\\s*>`, "gi");
  let depth = 1;
  let pos = contentStart;
  while (depth > 0) {
    closeRe.lastIndex = pos;
    const close = closeRe.exec(html);
    if (!close) throw new Error(`Fant ikke lukkende </${tagName}>`);
    openRe.lastIndex = pos;
    let open = openRe.exec(html);
    while (open && open.index < close.index) {
      depth += 1;
      openRe.lastIndex = open.index + 1;
      const next = openRe.exec(html);
      pos = open.index + 1;
      open = next;
    }
    depth -= 1;
    pos = close.index + close[0].length;
    if (depth === 0) return { contentEnd: close.index, afterClose: pos };
  }
  throw new Error("unreachable");
}

function translateMarked(html, dict, warn) {
  const re = /<([a-zA-Z0-9]+)([^>]*\sdata-i18n="([^"]+)"[^>]*)>/g;
  let out = "";
  let cursor = 0;
  let match;
  while ((match = re.exec(html))) {
    const [full, tag, , key] = match;
    const value = dict[key];
    const contentStart = match.index + full.length;
    if (/\/>$/.test(full)) continue; // selvlukkende — ingenting å oversette
    const { contentEnd } = findElementEnd(html, tag, contentStart);
    out += html.slice(cursor, contentStart);
    if (value != null) out += value;
    else {
      warn(key);
      out += html.slice(contentStart, contentEnd);
    }
    out += html.slice(contentEnd, contentEnd); // no-op for lesbarhet
    cursor = contentEnd;
    re.lastIndex = contentEnd;
  }
  out += html.slice(cursor);
  return out;
}

function translatePlaceholders(html, dict, warn) {
  return html.replace(/<[^>]*data-i18n-ph="([^"]+)"[^>]*>/g, (tag, key) => {
    const value = dict[key];
    if (value == null) {
      warn(key);
      return tag;
    }
    const safe = String(value).replace(/"/g, "&quot;");
    return tag.replace(/placeholder="[^"]*"/, `placeholder="${safe}"`);
  });
}

function rewritePaths(html, lang) {
  // Ressurser: rot-absolutte stier virker fra alle språkmapper.
  html = html
    .replace(/(href|src)="\.\.\/assets\//g, '$1="/assets/')
    .replace(/(href|src)="assets\//g, '$1="/assets/')
    .replace(/(href|src)="\.\.\/logo\.jpeg"/g, '$1="/logo.jpeg"')
    .replace(/(href|src)="logo\.jpeg"/g, '$1="/logo.jpeg"');
  // og:image som full URL.
  html = html.replace(/content="\/?assets\/(apps\/[^"]+)"/g, `content="${SITE}/assets/$1"`);
  // Interne lenker til samme språk.
  for (const link of LOCALIZED_LINKS) {
    const re = new RegExp(`href="${link.replace(/[/#]/g, "\\$&")}"`, "g");
    html = html.replace(re, `href="/${lang}${link}"`);
  }
  return html;
}

function hreflangBlock(urlPath) {
  const lines = [
    `  <link rel="alternate" hreflang="no" href="${SITE}${urlPath}">`,
    ...LANGS.map((l) => `  <link rel="alternate" hreflang="${l}" href="${SITE}/${l}${urlPath}">`),
    `  <link rel="alternate" hreflang="x-default" href="${SITE}${urlPath}">`,
  ];
  return lines.join("\n");
}

function injectHead(html, block) {
  const marked = /\n?[ \t]*<!-- i18n:hreflang -->[\s\S]*?<!-- \/i18n:hreflang -->/;
  const wrapped = `\n  <!-- i18n:hreflang -->\n${block}\n  <!-- /i18n:hreflang -->`;
  if (marked.test(html)) return html.replace(marked, wrapped);
  return html.replace(/\n<\/head>/, `${wrapped}\n</head>`);
}

const dict = loadDict();
const missing = new Set();

for (const page of PAGES) {
  const sourcePath = path.join(root, page.src);
  let source = fs.readFileSync(sourcePath, "utf8");

  // Norske kildesider: canonical + hreflang.
  const noBlock = `  <link rel="canonical" href="${SITE}${page.urlPath}">\n${hreflangBlock(page.urlPath)}`;
  fs.writeFileSync(sourcePath, injectHead(source, noBlock));
  source = fs.readFileSync(sourcePath, "utf8");

  for (const lang of LANGS) {
    const d = dict[lang];
    if (!d) throw new Error(`Mangler ordbok for ${lang}`);
    const warn = (key) => missing.add(`${lang}:${key}`);

    let html = source;
    html = html.replace(/<html lang="no">/, `<html lang="${lang}">`);
    if (d[`pg_${page.id}_title`]) {
      html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${d[`pg_${page.id}_title`]}</title>`);
      html = html.replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${d[`pg_${page.id}_title`].replace(/"/g, "&quot;")}$2`);
    }
    if (d[`pg_${page.id}_desc`]) {
      html = html.replace(/(<meta name="description" content=")[^"]*(">)/, `$1${d[`pg_${page.id}_desc`].replace(/"/g, "&quot;")}$2`);
      html = html.replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${d[`pg_${page.id}_desc`].replace(/"/g, "&quot;")}$2`);
    }
    html = translateMarked(html, d, warn);
    html = translatePlaceholders(html, d, warn);
    html = rewritePaths(html, lang);
    const langBlock = `  <link rel="canonical" href="${SITE}/${lang}${page.urlPath}">\n${hreflangBlock(page.urlPath)}`;
    html = injectHead(html, langBlock);

    const outPath = path.join(root, lang, page.src);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(`✓ ${lang}/${page.src}`);
  }
}

// Sitemap med alle språkversjoner, med hreflang-annotasjoner.
const urls = PAGES.flatMap((page) => [
  { loc: `${SITE}${page.urlPath}`, page },
  ...LANGS.map((l) => ({ loc: `${SITE}/${l}${page.urlPath}`, page })),
]);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map((u) => {
    const alts = [
      `    <xhtml:link rel="alternate" hreflang="no" href="${SITE}${u.page.urlPath}"/>`,
      ...LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}/${l}${u.page.urlPath}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${u.page.urlPath}"/>`,
    ].join("\n");
    return `  <url>\n    <loc>${u.loc}</loc>\n${alts}\n  </url>`;
  })
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
console.log("✓ sitemap.xml");

if (missing.size > 0) {
  console.warn(`\nManglende nøkler (${missing.size}):`);
  for (const key of [...missing].sort()) console.warn(`  - ${key}`);
  process.exitCode = 1;
} else {
  console.log("\nAlle nøkler oversatt.");
}
