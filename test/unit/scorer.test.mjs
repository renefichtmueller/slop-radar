import { test } from "node:test";
import assert from "node:assert/strict";
import { score } from "../../dist/index.js";

// Build a DetectionResult by hand so scorer tests don't depend on the database.
function detection({ text = "Plain text.", phrases = 0, patterns = [] } = {}) {
  return {
    text,
    phraseMatches: [],
    patternMatches: patterns.map((p) => ({ description: "", ...p })),
    totalPhraseHits: phrases,
    totalPatternHits: patterns.reduce((s, p) => s + p.count, 0),
    language: "en",
  };
}

test("clean text scores 100 and rates HUMAN", () => {
  const r = score(detection());
  assert.equal(r.score, 100);
  assert.equal(r.rating, "HUMAN");
});

test("each phrase hit deducts 2", () => {
  const r = score(detection({ phrases: 7 }));
  assert.equal(r.breakdown.phraseDeductions, 14);
  assert.equal(r.score, 86);
});

test("generic patterns deduct count * weight", () => {
  const r = score(detection({ patterns: [{ name: "meta-reference", count: 2, weight: 4 }] }));
  assert.equal(r.breakdown.patternDeductions, 8);
  assert.equal(r.score, 92);
});

test("let-me and heres-the-thing deduct 3 per hit regardless of weight", () => {
  const r = score(
    detection({
      patterns: [
        { name: "let-me-starter", count: 2, weight: 99 },
        { name: "heres-the-thing", count: 1, weight: 99 },
      ],
    })
  );
  assert.equal(r.breakdown.letMeDeduction, 9);
  assert.equal(r.breakdown.patternDeductions, 0);
  assert.equal(r.score, 91);
});

test("passive voice deducts 10 only above 30% of sentences", () => {
  const text = "One. Two. Three. Four. Five. Six. Seven. Eight. Nine. Ten.";
  const at30 = score(detection({ text, patterns: [{ name: "passive-voice-density", count: 3, weight: 1 }] }));
  const above = score(detection({ text, patterns: [{ name: "passive-voice-density", count: 4, weight: 1 }] }));
  assert.equal(at30.breakdown.passiveVoiceDeduction, 0);
  assert.equal(above.breakdown.passiveVoiceDeduction, 10);
});

test("a question earns a 5 point bonus", () => {
  const r = score(detection({ text: "Does it work?", phrases: 5 }));
  assert.equal(r.breakdown.questionBonus, 5);
  assert.equal(r.score, 95);
});

test("varied sentence length earns a 5 point bonus", () => {
  const text =
    "Short. " +
    "This sentence is quite a lot longer than the one before it by design. " +
    "Tiny. " +
    "And here is another long sentence that keeps going for many more words than needed.";
  const r = score(detection({ text, phrases: 5 }));
  assert.equal(r.breakdown.sentenceLengthBonus, 5);
});

test("uniform sentence length earns no bonus", () => {
  const r = score(detection({ text: "One two three. Four five six. Seven eight nine." }));
  assert.equal(r.breakdown.sentenceLengthBonus, 0);
});

test("score is clamped to 0..100", () => {
  assert.equal(score(detection({ phrases: 500 })).score, 0);
  assert.equal(score(detection({ text: "Why? Because." })).score, 100);
});

test("rating thresholds", () => {
  const cases = [
    [0, "HUMAN"],
    [5, "HUMAN"], // 90
    [6, "MOSTLY CLEAN"], // 88
    [15, "MOSTLY CLEAN"], // 70
    [16, "SUSPICIOUS"], // 68
    [25, "SUSPICIOUS"], // 50
    [26, "LIKELY AI"], // 48
    [35, "LIKELY AI"], // 30
    [36, "PURE SLOP"], // 28
  ];
  for (const [phrases, rating] of cases) {
    const r = score(detection({ phrases }));
    assert.equal(r.rating, rating, `score ${r.score} should be ${rating}`);
  }
});

test("maxCount caps the deduction of a pattern, not its reported count", () => {
  const r = score(detection({ patterns: [{ name: "number-list-pattern", count: 10, weight: 2, maxCount: 3 }] }));
  assert.equal(r.breakdown.patternDeductions, 6);
});

const words = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ") + ".";

test("buzzword density deducts 10 above 5 and 20 above 10 hits per 100 words", () => {
  const text = words(100);
  assert.equal(score(detection({ text, phrases: 5 })).breakdown.densityDeduction, 0);
  assert.equal(score(detection({ text, phrases: 6 })).breakdown.densityDeduction, 10);
  assert.equal(score(detection({ text, phrases: 11 })).breakdown.densityDeduction, 20);
});

test("buzzword density is ignored for texts under 30 words", () => {
  assert.equal(score(detection({ text: words(29), phrases: 10 })).breakdown.densityDeduction, 0);
});
