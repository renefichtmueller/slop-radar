import { test } from "node:test";
import assert from "node:assert/strict";
import { detect, detectWith, normalizeText, score } from "../../dist/index.js";

const phrase = (d, p) => d.phraseMatches.find((m) => m.phrase === p);
const pattern = (d, n) => d.patternMatches.find((m) => m.name === n);

test("typographic apostrophes match straight-quote phrases and patterns", () => {
  const d = detect("Here’s the thing: in today’s fast-paced world we move.", "en");
  assert.equal(phrase(d, "here's the thing")?.count, 1);
  assert.equal(phrase(d, "in today's fast-paced")?.count, 1);
  assert.equal(pattern(d, "heres-the-thing")?.count, 1);
});

test("normalizeText keeps the length, so positions point into the original text", () => {
  const text = "“Well,” she said. Let’s unpack it.";
  assert.equal(normalizeText(text).length, text.length);
  const m = phrase(detect(text, "en"), "let's unpack");
  assert.equal(text.slice(m.positions[0], m.positions[0] + 12), "Let’s unpack");
});

test("German phrases match real umlauts and the ASCII spelling alike", () => {
  const umlaut = detect("Das ist außergewöhnlich. Zusammenfassend lässt sich sagen: gut.", "de");
  const ascii = detect("Das ist aussergewoehnlich. Zusammenfassend laesst sich sagen: gut.", "de");
  for (const d of [umlaut, ascii]) {
    assert.equal(phrase(d, "aussergewoehnlich")?.count, 1);
    assert.equal(phrase(d, "zusammenfassend laesst sich sagen")?.count, 1);
  }
});

test("German inflected forms match the base entry", () => {
  const d = detect("Wir liefern maßgeschneiderte Lösungen, die einer entscheidenden Rolle gerecht werden.", "de");
  assert.equal(phrase(d, "massgeschneiderte loesungen")?.count, 1);
  assert.equal(phrase(d, "eine entscheidende rolle")?.count, 1);
});

test("German entries match other inflections and word orders of their core", () => {
  const d = detect("Dabei ist es wichtig zu beachten, dass dieser ganzheitliche Ansatz Synergien schafft.", "de");
  assert.equal(phrase(d, "wichtig zu beachten")?.count, 1);
  assert.equal(phrase(d, "ganzheitlicher ansatz")?.count, 1);
});

test("German endings do not turn a phrase into a prefix match", () => {
  assert.equal(phrase(detect("Die Robustheit ist gut und das ist nicht alles.", "de"), "robust"), undefined);
});

test("English plural -s on the last word matches the base entry", () => {
  const d = detect("This empowers stakeholders across many landscapes.", "en");
  assert.equal(phrase(d, "stakeholder")?.count, 1);
  assert.equal(phrase(d, "landscape")?.count, 1);
});

test("word boundaries treat umlauts and accented letters as letters", () => {
  assert.equal(phrase(detect("Das Ärealm und éleverage.", "en"), "realm"), undefined);
  assert.equal(phrase(detect("Das Ärealm und éleverage.", "en"), "leverage"), undefined);
});

test("the longest overlapping phrase wins and is counted once", () => {
  const d = detect("There is a myriad of options and a holistic approach.", "en");
  assert.equal(phrase(d, "a myriad of")?.count, 1);
  assert.equal(phrase(d, "myriad of"), undefined);
  assert.equal(phrase(d, "myriad"), undefined);
  assert.equal(phrase(d, "holistic approach")?.count, 1);
  assert.equal(phrase(d, "holistic"), undefined);
  assert.equal(d.totalPhraseHits, 2);
});

test("emoji headers include symbols outside the old range and markdown headings", () => {
  const d = detect("✅ **Done**\ntext\n## 🚀 Launch\ntext\n⚡️ **Fast**\n", "en");
  assert.equal(pattern(d, "emoji-header")?.count, 3);
});

test("list-style patterns report every hit but the scorer caps them", () => {
  const list = "Overview:\n" + Array.from({ length: 10 }, (_, i) => `${i + 1}. **Item ${i + 1}** text`).join("\n");
  const d = detect(list, "en");
  const m = pattern(d, "number-list-pattern");
  assert.equal(m.count, 10);
  assert.equal(m.maxCount, 3);
  assert.equal(score(d).breakdown.patternDeductions, 3 * m.weight + pattern(d, "colon-list-intro").weight);
});

test("negation pivot catches 'it's not X, it's Y' in one or two sentences", () => {
  assert.ok(pattern(detect("It's not a tool, it's a teammate.", "en"), "negation-pivot"));
  assert.ok(pattern(detect("This isn't about speed. It's about trust.", "en"), "negation-pivot"));
  assert.equal(pattern(detect("It is not clear why the job failed.", "en"), "negation-pivot"), undefined);
});

test("binary contrast matches with or without the comma", () => {
  assert.ok(pattern(detect("It is not only fast but also cheap.", "en"), "binary-contrast"));
  assert.ok(pattern(detect("It is not just a tool, but a partner.", "en"), "binary-contrast"));
  assert.ok(pattern(detect("Das ist nicht nur schnell, sondern auch günstig.", "de"), "binary-contrast-de"));
});

test("detectWith runs the engine against a caller-supplied database", () => {
  const db = { phrasesEn: ["frobnicate"], phrasesDe: [], patterns: [] };
  const d = detectWith(db, "We frobnicate daily.", "en");
  assert.deepEqual(d.phraseMatches, [{ phrase: "frobnicate", count: 1, positions: [3], lengths: [10] }]);
});

test("em-dash abuse counts once per line however many dashes it has", () => {
  const d = detect("a — b — c — d — e — f\nplain line\ng — h — i — j", "en");
  assert.equal(pattern(d, "em-dash-abuse")?.count, 2);
});

test("matching stays fast on long, buzzword-dense text", () => {
  // ~660 KB; an overlap check that scans all earlier hits needed ~10 s here.
  const text = "leverage synergy to unlock value ".repeat(20000);
  const t0 = performance.now();
  const d = detect(text, "en");
  const ms = performance.now() - t0;
  assert.equal(phrase(d, "leverage").count, 20000);
  assert.ok(ms < 4000, `took ${Math.round(ms)} ms`);
});
