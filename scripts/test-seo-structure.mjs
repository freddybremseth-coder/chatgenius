import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pages = [
  ["index.html", "https://www.chatgenius.pro/"],
  ["apper/index.html", "https://www.chatgenius.pro/apper/"],
  ["demo/index.html", "https://www.chatgenius.pro/demo/"],
  ["demosites/index.html", "https://www.chatgenius.pro/demosites/"],
  ["demosites/demo/index.html", "https://www.chatgenius.pro/demosites/demo/"],
  ["guider/index.html", "https://www.chatgenius.pro/guider/"],
  ["guider/slik-kommer-bedriften-i-gang-med-ai/index.html", "https://www.chatgenius.pro/guider/slik-kommer-bedriften-i-gang-med-ai/"],
  ["guider/hva-er-en-ai-agent/index.html", "https://www.chatgenius.pro/guider/hva-er-en-ai-agent/"],
  ["guider/ai-automatisering-eksempler/index.html", "https://www.chatgenius.pro/guider/ai-automatisering-eksempler/"],
  ["guider/chatgpt-claude-gemini-perplexity-bedrift/index.html", "https://www.chatgenius.pro/guider/chatgpt-claude-gemini-perplexity-bedrift/"],
  ["case/index.html", "https://www.chatgenius.pro/case/"],
  ["case/realtyflow/index.html", "https://www.chatgenius.pro/case/realtyflow/"],
  ["case/demosites/index.html", "https://www.chatgenius.pro/case/demosites/"],
  ["case/familyhub/index.html", "https://www.chatgenius.pro/case/familyhub/"],
  ["case/remaster-reels/index.html", "https://www.chatgenius.pro/case/remaster-reels/"],
  ["integrasjoner/index.html", "https://www.chatgenius.pro/integrasjoner/"],
  ["om-chatgenius/index.html", "https://www.chatgenius.pro/om-chatgenius/"],
  ["slik-jobber-vi/index.html", "https://www.chatgenius.pro/slik-jobber-vi/"],
  ["kom-i-gang/index.html", "https://www.chatgenius.pro/kom-i-gang/"],
  ["ai-opplaering/index.html", "https://www.chatgenius.pro/ai-opplaering/"],
  ["ai-resepsjonist/index.html", "https://www.chatgenius.pro/ai-resepsjonist/"],
  ["nettsider-med-ai/index.html", "https://www.chatgenius.pro/nettsider-med-ai/"],
  ["ai-automatisering/index.html", "https://www.chatgenius.pro/ai-automatisering/"],
  ["skreddersydde-ai-systemer/index.html", "https://www.chatgenius.pro/skreddersydde-ai-systemer/"],
  ["bruksomrader/index.html", "https://www.chatgenius.pro/bruksomrader/"],
  ["ai-for-sma-bedrifter/index.html", "https://www.chatgenius.pro/ai-for-sma-bedrifter/"],
  ["ai-for-kundeservice/index.html", "https://www.chatgenius.pro/ai-for-kundeservice/"],
  ["ai-for-markedsforing/index.html", "https://www.chatgenius.pro/ai-for-markedsforing/"],
  ["ai-for-salg/index.html", "https://www.chatgenius.pro/ai-for-salg/"],
  ["ai-for-eiendomsmeglere/index.html", "https://www.chatgenius.pro/ai-for-eiendomsmeglere/"]
];

for (const [file, canonical] of pages) {
  test(file + " has one clear SEO identity", () => {
    const html = fs.readFileSync(file, "utf8");
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, "expected exactly one H1");
    assert.equal((html.match(/<title\b/gi) || []).length, 1, "expected exactly one title");
    assert.equal((html.match(/<meta\s+name=["']description["']/gi) || []).length, 1, "expected exactly one meta description");
    assert.equal((html.match(/rel=["']canonical["']/gi) || []).length, 1, "expected exactly one canonical");
    assert.ok(
      html.includes('href="' + canonical + '"') || html.includes("href='" + canonical + "'"),
      "expected canonical href " + canonical
    );
    assert.ok(!/noindex/i.test(html), "pillar/use-case pages should be indexable");
    assert.ok(/application\/ld\+json/i.test(html), "expected structured data");
  });
}

test("use-case pages link back to the use-case hub", () => {
  for (const [file] of pages.filter(([file]) => file.startsWith("ai-for-"))) {
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /href=["']\/bruksomrader\/["']/);
  }
});

test("homepage links to solution and use-case hubs", () => {
  const html = fs.readFileSync("index.html", "utf8");
  assert.match(html, /href=["']\/bruksomrader\/["']/);
  assert.match(html, /href=["']\/ai-opplaering\/["']/);
  assert.match(html, /href=["']\/ai-automatisering\/["']/);
  assert.match(html, /href=["']\/nettsider-med-ai\/["']/);
});


test("sitemap source includes all strategic cluster paths", () => {
  const source = fs.readFileSync("api/sitemap.js", "utf8");
  for (const path of [
    "/ai-opplaering/",
    "/ai-resepsjonist/",
    "/nettsider-med-ai/",
    "/ai-automatisering/",
    "/skreddersydde-ai-systemer/",
    "/bruksomrader/",
    "/ai-for-sma-bedrifter/",
    "/ai-for-kundeservice/",
    "/ai-for-markedsforing/",
    "/ai-for-salg/",
    "/ai-for-eiendomsmeglere/",
    "/demo/",
    "/demosites/demo/",
    "/guider/",
    "/guider/slik-kommer-bedriften-i-gang-med-ai/",
    "/guider/hva-er-en-ai-agent/",
    "/guider/ai-automatisering-eksempler/",
    "/guider/chatgpt-claude-gemini-perplexity-bedrift/",
    "/om-chatgenius/",
    "/slik-jobber-vi/",
    "/kom-i-gang/"
  ]) assert.ok(source.includes('"' + path + '"'), "missing sitemap path " + path);
});


test("demo pages do not advertise nonexistent localized alternates", () => {
  const source = fs.readFileSync("api/sitemap.js", "utf8");
  const localizedMatch = source.match(/const localizedRoutes = \[([^\]]+)\]/);
  assert.ok(localizedMatch, "localizedRoutes declaration missing");
  assert.ok(!localizedMatch[1].includes('"/demo/"'), "demo hub has no translated routes yet");
  assert.ok(!localizedMatch[1].includes('"/demosites/demo/"'), "DemoSites walkthrough has no translated routes yet");
});


test("strategic journey pages expose a next-step path", () => {
  const files = [
    "ai-for-sma-bedrifter/index.html",
    "ai-for-kundeservice/index.html",
    "ai-for-markedsforing/index.html",
    "ai-for-salg/index.html",
    "ai-for-eiendomsmeglere/index.html",
    "ai-opplaering/index.html",
    "ai-resepsjonist/index.html",
    "nettsider-med-ai/index.html",
    "ai-automatisering/index.html",
    "skreddersydde-ai-systemer/index.html",
    "guider/slik-kommer-bedriften-i-gang-med-ai/index.html",
    "guider/hva-er-en-ai-agent/index.html",
    "guider/ai-automatisering-eksempler/index.html",
    "guider/chatgpt-claude-gemini-perplexity-bedrift/index.html",
    "case/realtyflow/index.html",
    "case/demosites/index.html",
    "case/familyhub/index.html",
    "case/remaster-reels/index.html",
    "demo/index.html"
  ];
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /href=["']\/kom-i-gang\/["']/, file + " should link to /kom-i-gang/");
  }
});


test("dynamic article surfaces expose conversion journey", () => {
  for (const file of ["api/article.js", "api/articles.js"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /\/kom-i-gang\//, file + " should link to /kom-i-gang/");
    assert.match(source, /\/demo\//, file + " should link to /demo/");
    assert.match(source, /search-discovery\.js/, file + " should load privacy-safe discovery/conversion tracker");
  }
});


test("all static strategic JSON-LD blocks parse as valid JSON", () => {
  for (const [file] of pages) {
    const html = fs.readFileSync(file, "utf8");
    const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    assert.ok(blocks.length > 0, file + " should include JSON-LD");
    for (const block of blocks) {
      assert.doesNotThrow(
        () => JSON.parse(block[1]),
        file + " contains invalid JSON-LD"
      );
    }
  }
});


test("ChatGenius about page exposes a restrained Freddy Bremseth project network", () => {
  const html = fs.readFileSync("om-chatgenius/index.html", "utf8");
  assert.match(html, /https:\/\/www\.freddybremseth\.com\/#person/);
  for (const url of [
    "https://www.freddybremseth.com/",
    "https://www.zenecohomes.com/",
    "https://www.pinosoecolife.com/",
    "https://www.donaanna.com/",
    "https://remaster.freddybremseth.com/",
    "https://books.freddybremseth.com/",
    "https://art.freddybremseth.com/"
  ]) assert.ok(html.includes(url), "missing contextual project link " + url);
  assert.match(html, /"@type":"ItemList"/);
  assert.match(html, /id="project-network"/);
});


test("homepage branded Freddy link points to the authority hub", () => {
  const html = fs.readFileSync("index.html", "utf8");
  assert.match(html, /href=["']https:\/\/www\.freddybremseth\.com\/["'][^>]*>Freddy Bremseth<\/a>/);
});
