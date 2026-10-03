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

for (const file of ["phrases-en.json", "phrases-de.json"]) {
  test(`${file} entries are lowercase`, () => {
    for (const p of load(file)) assert.equal(p, p.toLowerCase(), `not lowercase: "${p}"`);
  });
}

test("phrases-en.json has no entry that is another entry plus a plural -s", () => {
  const set = new Set(load("phrases-en.json"));
  const redundant = [...set].filter((p) => p.endsWith("s") && set.has(p.slice(0, -1)));
  assert.deepEqual(redundant, [], "the matcher already adds -s to the last word");
});

test("patterns.json maxCount, when set, is a positive integer", () => {
  for (const p of load("patterns.json")) {
    if (p.maxCount === undefined) continue;
    assert.ok(Number.isInteger(p.maxCount) && p.maxCount > 0, `${p.name}: bad maxCount`);
  }
});

test("phrases-de.json has no two entries with the same stem form", () => {
  // Mirrors engine.ts: German entries match by stem plus any common ending.
  const fold = (w) => w.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  const stem = (w) => {
    const e = ["ern", "en", "er", "es", "em", "e"].find((x) => w.endsWith(x) && w.length - x.length >= 4);
    return e ? w.slice(0, -e.length) : w;
  };
  const keys = load("phrases-de.json").map((p) => p.split(/\s+/).map((w) => stem(fold(w))).join(" "));
  assert.deepEqual(keys.filter((k, i) => keys.indexOf(k) !== i), []);
});
