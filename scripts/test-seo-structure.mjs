import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pages = [
  ["index.html", "https://www.chatgenius.pro/"],
  ["apper/index.html", "https://www.chatgenius.pro/apper/"],
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
    "/guider/",
    "/guider/slik-kommer-bedriften-i-gang-med-ai/",
    "/guider/hva-er-en-ai-agent/",
    "/guider/ai-automatisering-eksempler/",
    "/guider/chatgpt-claude-gemini-perplexity-bedrift/"
  ]) assert.ok(source.includes('"' + path + '"'), "missing sitemap path " + path);
});
