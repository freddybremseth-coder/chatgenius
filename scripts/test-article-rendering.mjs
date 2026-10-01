import test from "node:test";
import assert from "node:assert/strict";
import { renderInlineMarkdown, markdownToHtml } from "../api/article.js";

test("article renderer preserves safe internal links", () => {
  const html = renderInlineMarkdown("Les [AI-automatisering](/ai-automatisering/) videre.");
  assert.equal(html, 'Les <a href="/ai-automatisering/">AI-automatisering</a> videre.');
});

test("article renderer preserves https source links and marks them external", () => {
  const html = renderInlineMarkdown("Kilde: [OpenAI](https://openai.com/)");
  assert.match(html, /href="https:\/\/openai\.com\/"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("article renderer refuses unsafe protocols", () => {
  const html = renderInlineMarkdown("[Klikk](javascript:alert(1))");
  assert.ok(!html.includes("<a "));
  assert.ok(!html.includes('href="javascript:'));
});

test("markdown lists and paragraphs keep safe links clickable", () => {
  const html = markdownToHtml("# Tittel\n\nLes [demoen](/demo/).\n\n- Se [case](/case/)");
  assert.match(html, /<p>Les <a href="\/demo\/">demoen<\/a>\.<\/p>/);
  assert.match(html, /<li>Se <a href="\/case\/">case<\/a><\/li>/);
});
