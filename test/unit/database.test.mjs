import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (name) =>
  JSON.parse(readFileSync(new URL(`../../src/database/${name}`, import.meta.url), "utf-8"));

for (const file of ["phrases-en.json", "phrases-de.json"]) {
  test(`${file} is a non-empty array of trimmed, non-empty strings`, () => {
    const phrases = load(file);
    assert.ok(Array.isArray(phrases) && phrases.length > 0);
    for (const p of phrases) {
      assert.equal(typeof p, "string");
      assert.ok(p.length > 0, "empty phrase");
      assert.equal(p, p.trim(), `untrimmed phrase: "${p}"`);
    }
  });
}

test("phrases-de.json has no duplicate phrases", () => {
  const low = load("phrases-de.json").map((p) => p.toLowerCase());
  assert.deepEqual(low.filter((p, i) => low.indexOf(p) !== i), []);
});

test("phrases-en.json has no duplicate phrases", () => {
  const low = load("phrases-en.json").map((p) => p.toLowerCase());
  assert.deepEqual(low.filter((p, i) => low.indexOf(p) !== i), []);
});

test("patterns.json entries are well-formed and compile", () => {
  const patterns = load("patterns.json");
  assert.ok(patterns.length > 0);
  const names = new Set();
  for (const p of patterns) {
    assert.equal(typeof p.name, "string");
    assert.ok(!names.has(p.name), `duplicate pattern name: ${p.name}`);
    names.add(p.name);
    assert.equal(typeof p.description, "string");
    assert.ok(Number.isFinite(p.weight) && p.weight > 0, `${p.name}: bad weight`);
    assert.doesNotThrow(() => new RegExp(p.pattern, p.flags ?? "gi"), `${p.name}: invalid regex`);
  }
});
