import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf-8");

test("both skill files are identical", () => {
  assert.equal(read("superpowers-skill/SKILL.md"), read("skill/SKILL.md"));
});

test("the skill has the frontmatter Claude Code and Codex require", () => {
  const match = read("skill/SKILL.md").match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
  assert.ok(match, "frontmatter with name and description");
  assert.equal(match[1], "slop-radar");
  assert.ok(match[2].length <= 1024, "description must fit the 1024-character limit");
});
