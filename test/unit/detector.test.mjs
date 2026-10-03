import { test } from "node:test";
import assert from "node:assert/strict";
import { detect } from "../../dist/index.js";

const phrase = (d, p) => d.phraseMatches.find((m) => m.phrase === p);
const pattern = (d, n) => d.patternMatches.find((m) => m.name === n);

test("clean text has no phrase or pattern hits", () => {
  const d = detect("The build took four minutes. I fixed the cache key.", "en");
  assert.equal(d.totalPhraseHits, 0);
  assert.equal(d.totalPatternHits, 0);
  assert.deepEqual(d.phraseMatches, []);
});

test("single-word buzzword is found case-insensitively with its position", () => {
  const d = detect("We Leverage caching.", "en");
  const m = phrase(d, "leverage");
  assert.ok(m, "leverage should match");
  assert.equal(m.count, 1);
  assert.deepEqual(m.positions, [3]);
});

test("buzzwords only match on word boundaries", () => {
  const d = detect("Unleverage and leveragement are different words.", "en");
  assert.equal(phrase(d, "leverage"), undefined);
});

test("repeated single-word buzzword is counted per occurrence", () => {
  const d = detect("Leverage this. Leverage that. Leverage everything.", "en");
  assert.equal(phrase(d, "leverage").count, 3);
});

test("totalPhraseHits is the sum of per-phrase counts", () => {
  const d = detect("We leverage synergy to leverage the paradigm.", "en");
  const sum = d.phraseMatches.reduce((s, m) => s + m.count, 0);
  assert.equal(d.totalPhraseHits, sum);
  assert.ok(d.totalPhraseHits >= 3);
});

test("auto language detection picks English for English text", () => {
  assert.equal(detect("This is the text and it is in English.").language, "en");
});

test("auto language detection picks German for German text", () => {
  const d = detect("Das ist ein Text und er ist nicht auf Englisch, sondern auf Deutsch.");
  assert.equal(d.language, "de");
});

test("forced language overrides auto detection", () => {
  const text = "Das ist ein Text und er ist nicht auf Englisch.";
  assert.equal(detect(text, "en").language, "en");
});

test("German phrase list is used for German text", () => {
  const d = detect("Diese Lösung ist bahnbrechend und das ist nicht alles.", "de");
  assert.ok(phrase(d, "bahnbrechend"), "bahnbrechend should match");
});

test("em-dash abuse needs three em dashes on one line", () => {
  assert.equal(pattern(detect("One — two — three.", "en"), "em-dash-abuse"), undefined);
  assert.ok(pattern(detect("One — two — three — four.", "en"), "em-dash-abuse"));
});

test("let-me starter is detected at the start of a line only", () => {
  assert.ok(pattern(detect("Let me explain the fix.", "en"), "let-me-starter"));
  assert.equal(pattern(detect("Nobody will let me explain.", "en"), "let-me-starter"), undefined);
});

test("bullet overload needs six consecutive bullets", () => {
  const five = "- a\n- b\n- c\n- d\n- e\n";
  const six = five + "- f\n";
  assert.equal(pattern(detect(five, "en"), "bullet-overload"), undefined);
  assert.ok(pattern(detect(six, "en"), "bullet-overload"));
});

test("meta-reference is detected", () => {
  assert.ok(pattern(detect("In this article we cover caching.", "en"), "meta-reference"));
});

test("pattern matches carry the weight from the database", () => {
  const m = pattern(detect("Let me explain.", "en"), "let-me-starter");
  assert.equal(m.weight, 3);
});

// Counting regressions (see issue #3).

test("multi-word phrase occurring once is counted once", () => {
  const d = detect("We should dive deep into this.", "en");
  assert.equal(phrase(d, "dive deep").count, 1);
});

test("non-global pattern counts every occurrence", () => {
  const d = detect("Let me explain.\nLet me show you.\nLet me be clear.", "en");
  assert.equal(pattern(d, "let-me-starter").count, 3);
});

test("pattern count does not depend on capture groups", () => {
  const d = detect("Here's the thing about caching.", "en");
  assert.equal(pattern(d, "heres-the-thing").count, 1);
});

test("multi-word phrase with loose separators is counted once", () => {
  const d = detect("We should dive,  deep into this.", "en");
  assert.equal(phrase(d, "dive deep").count, 1);
});

test("multi-word phrase respects word boundaries", () => {
  const d = detect("We should dive deeper into this.", "en");
  assert.equal(phrase(d, "dive deep"), undefined);
});

test("phrase count always equals the number of positions", () => {
  const d = detect(
    "Let me dive deep. In today's fast-paced world we dive deep and leverage, leverage.",
    "en"
  );
  for (const m of d.phraseMatches) {
    assert.equal(m.count, m.positions.length, m.phrase);
  }
});

test("patterns with a flags override still count every occurrence", () => {
  const d = detect("In this article, we cover X. In this guide, we cover Y.", "en");
  assert.equal(pattern(d, "meta-reference").count, 2);
});
