# Changelog

## Unreleased

- Agent skill rewritten for Claude Code and Codex: valid frontmatter, runs the real engine via `npx slop-radar json`, rewrite guidance, before/after scoring. `superpowers-skill/SKILL.md` is now the same file.

## 1.1.0 (2026-10-03)

Scores change in this release. Text with multi-word buzzwords scores higher than before (no more double counting), dense buzzword text and repeated "Let me …" lines score lower, and German text with umlauts is now actually checked.

### Contributed by Terry Sweetser ([@tcsweetser](https://github.com/tcsweetser))

- **CLI:** `slop-radar file.md` analyses the file. Before, the file name was taken as the command and stdin was scored instead, without a warning ([#2](https://github.com/renefichtmueller/slop-radar/pull/2)).
- **Tests:** first unit test suite (detector, scorer, formatter, database integrity) and a CLI regression suite, both run in CI ([#2](https://github.com/renefichtmueller/slop-radar/pull/2)).
- **Counting:** multi-word phrases were counted twice; patterns without the `g` flag reported 1 + the number of capture groups instead of the number of occurrences; the duplicate "by the same token" entry was removed ([#3](https://github.com/renefichtmueller/slop-radar/issues/3), [#4](https://github.com/renefichtmueller/slop-radar/pull/4)).
- **Version:** `--version` and the report banner read the version from `package.json` ([#4](https://github.com/renefichtmueller/slop-radar/pull/4)).

### Fixed

- Overlapping phrases stacked up: "a myriad of" counted as three hits (`myriad`, `myriad of`, `a myriad of`). The longest match now claims the span.
- Typographic apostrophes and quotes (`here’s`, `today’s`) never matched.
- The German list is written as ae/oe/ue/ss, so real German text with ä/ö/ü/ß never matched. Both spellings match now, and German inflected forms ("maßgeschneiderte", "einer entscheidenden Rolle") match their entry.
- Word boundaries treated umlauts and accented letters as non-letters.
- `emoji-header` missed common emoji such as ✅ and ⚡ and markdown headings like `## 🚀 Launch`.
- The phrase `not only...but also` could never match real text. It was removed, and `binary-contrast` now matches the form without a comma.
- The demo used its own outdated copy of the phrase list, its own scoring on an inverted scale, and inserted pasted text as HTML. It now runs the real engine and escapes all text.
- Invalid `--lang` values were silently ignored. The CLI now exits with code 2.
- Reports written to a pipe or file contained ANSI color codes.

### Added

- 197 English and 83 German phrases: chatbot pleasantries, stock openers, marketing hype, significance inflation, hedges, closers and recent tells such as "let that sink in" or "load-bearing". High-signal verb forms ("leveraging", "delving") are separate entries.
- Patterns `negation-pivot` ("It's not X, it's Y") and `binary-contrast-de` ("nicht nur …, sondern auch").
- Optional `maxCount` per pattern. List-style patterns report every hit but only the first few count.
- Buzzword density deduction: −10 above 5 and −20 above 10 hits per 100 words, for texts of 30+ words.
- English plural/third-person `-s` on the last word of a phrase matches automatically.
- Library exports `detectWith`, `loadDatabase`, `normalizeText`, `detectLanguage`; phrase matches include `lengths`.
- CI: Node 18, 20, 22 and 24; a smoke test that installs the packed tarball; a check that the demo matches the engine.
- Published on npm: `npm install -g slop-radar` or `npx slop-radar`. A `prepare` script builds GitHub checkouts on install.

## 1.0.0 (2026-03-19)

- Initial release: CLI, Node.js library, Claude Code skill, 245 English and 127 German phrases, 14 structural patterns.
