import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("assets/design-2027.css", "utf8");
const js = fs.readFileSync("assets/design-2027.js", "utf8");

test("homepage pilot loads the scoped 2027 design system", () => {
  assert.match(html, /<body class="home-2027">/);
  assert.match(html, /href="assets\/design-2027\.css"/);
  assert.match(html, /src="assets\/design-2027\.js"/);
  assert.match(css, /body\.home-2027/);
});

test("design pilot preserves core SEO identity and conversion paths", () => {
  assert.equal((html.match(/<h1\b/gi) || []).length, 1);
  assert.match(html, /rel="canonical" href="https:\/\/www\.chatgenius\.pro\/"/);
  assert.match(html, /href="\/demo\/"/);
  assert.match(html, /href="\/case\/"/);
  assert.match(html, /href="\/kom-i-gang\/"/);
  assert.match(html, /application\/ld\+json/i);
});

test("motion layer is progressive and respects reduced motion", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(js, /prefers-reduced-motion:\s*reduce/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /requestAnimationFrame/);
});

test("2027 palette avoids legacy neon glow as the primary visual language", () => {
  assert.match(css, /--glow:\s*none/);
  assert.match(css, /--ds27-sand:/);
  assert.match(css, /--ds27-sage:/);
  assert.match(css, /--ds27-cobalt:/);
  assert.doesNotMatch(css, /text-shadow:\s*0\s+0\s+[2-9][0-9]px/i);
});


const contentPages = [
  "demo/index.html",
  "guider/index.html",
  "guider/slik-kommer-bedriften-i-gang-med-ai/index.html",
  "guider/hva-er-en-ai-agent/index.html",
  "guider/ai-automatisering-eksempler/index.html",
  "guider/chatgpt-claude-gemini-perplexity-bedrift/index.html",
  "case/index.html",
  "case/realtyflow/index.html",
  "case/demosites/index.html",
  "case/familyhub/index.html",
  "case/remaster-reels/index.html",
  "integrasjoner/index.html",
  "om-chatgenius/index.html",
  "slik-jobber-vi/index.html",
  "kom-i-gang/index.html",
  "ai-opplaering/index.html",
  "ai-resepsjonist/index.html",
  "nettsider-med-ai/index.html",
  "ai-automatisering/index.html",
  "skreddersydde-ai-systemer/index.html",
  "bruksomrader/index.html",
  "ai-for-sma-bedrifter/index.html",
  "ai-for-kundeservice/index.html",
  "ai-for-markedsforing/index.html",
  "ai-for-salg/index.html",
  "ai-for-eiendomsmeglere/index.html"
];

test("strategic content pages use the shared 2027 design layer", () => {
  for (const file of contentPages) {
    const page = fs.readFileSync(file, "utf8");
    assert.match(page, /<body class="[^"]*design-2027[^"]*"/, file + " should opt into design-2027");
    assert.match(page, /href="\/assets\/design-2027\.css"/, file + " should load shared 2027 CSS");
    assert.match(page, /src="\/assets\/design-2027\.js"/, file + " should load progressive motion layer");
  }
});

test("dynamic article surfaces use the shared 2027 design layer", () => {
  for (const file of ["api/article.js", "api/articles.js"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /design-2027 content-2027/, file + " should emit 2027 body classes");
    assert.match(source, /\/assets\/design-2027\.css/, file + " should emit 2027 CSS");
    assert.match(source, /\/assets\/design-2027\.js/, file + " should emit 2027 motion layer");
  }
});
