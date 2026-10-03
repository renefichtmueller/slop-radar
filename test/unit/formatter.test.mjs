import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detect, score, formatJson, formatScore, formatFull, VERSION } from "../../dist/index.js";

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json"), "utf-8")
);

const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const text = "Let me explain how we leverage synergy.";
const d = detect(text, "en");
const s = score(d);

test("formatJson emits parseable JSON consistent with detect/score", () => {
  const j = JSON.parse(formatJson(d, s));
  assert.equal(j.score, s.score);
  assert.equal(j.rating, s.rating);
  assert.equal(j.language, "en");
  assert.equal(j.totalPhraseHits, d.totalPhraseHits);
  assert.equal(j.phraseMatches, d.phraseMatches.length);
  assert.deepEqual(j.breakdown, s.breakdown);
  assert.ok(j.phrases.some((p) => p.phrase === "leverage"));
});

test("formatScore starts with the numeric score", () => {
  assert.match(strip(formatScore(s)), new RegExp(`^\\s*${s.score}\\b`));
});

test("formatFull includes the score and rating", () => {
  const out = strip(formatFull(d, s));
  assert.match(out, new RegExp(`Score: ${s.score}`));
  assert.ok(out.includes(s.rating));
});

test("VERSION matches package.json and appears in the full report banner", () => {
  assert.equal(VERSION, pkg.version);
  assert.match(strip(formatFull(d, s)), new RegExp(`v${pkg.version.replaceAll(".", "\\.")}\\b`));
});
