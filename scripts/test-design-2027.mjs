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
