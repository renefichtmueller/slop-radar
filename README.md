# slop-radar

**Find AI slop in English and German text.** slop-radar flags the buzzwords, filler phrases and formatting habits that make writing read like a chatbot draft, and turns them into a score from 0 to 100.

**[Try the live demo](https://slop-radar-demo.pages.dev)** in your browser. It runs the same engine and phrase database as the CLI.

[![CI](https://github.com/renefichtmueller/slop-radar/actions/workflows/ci.yml/badge.svg)](https://github.com/renefichtmueller/slop-radar/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

slop-radar does not try to prove who wrote a text. It measures **AI-style writing**: the phrases and structures that make text generic, whether a model or a person typed them. Use it as a linter for prose.

---

## What it checks

- **437 English and 210 German phrases**: chatbot pleasantries ("I hope this helps"), stock openers ("in today's digital age"), hype ("game changer", "unlock the full potential"), filler connectors ("moreover"), significance inflation ("plays a pivotal role") and their German counterparts ("tauchen wir ein", "maßgeschneiderte Lösungen", "auf das nächste Level").
- **16 structural patterns**: "Let me …" starters, "It's not X, it's Y" pivots, "not only … but also" contrasts, em-dash chains, emoji headers, bullet overload, bold numbered lists, passive-voice density and more.
- **Buzzword density**: a short text packed with buzzwords loses extra points.

Matching is built for everyday text, not just exact copies of the list:

| Case | Example |
|---|---|
| Case-insensitive, Unicode word boundaries | `Leverage` matches, `leveragement` does not |
| Typographic quotes | `here’s the thing` matches `here's the thing` |
| German umlaut spellings | `außergewöhnlich` and `aussergewoehnlich` match the same entry |
| German inflections | `maßgeschneiderte Lösungen`, `einer entscheidenden Rolle` |
| English plural / third person | `stakeholders`, `unlocks` |
| Loose separators | `dive, deep` matches `dive deep` |
| Longest match wins | `a myriad of` counts once, not three times |

## Score

| Score | Rating | Meaning |
|-------|--------|---------|
| 90-100 | HUMAN | Clean, natural writing |
| 70-89 | MOSTLY CLEAN | Minor AI signals |
| 50-69 | SUSPICIOUS | Multiple AI patterns found |
| 30-49 | LIKELY AI | Strong AI writing signals |
| 0-29 | PURE SLOP | Heavy buzzword and pattern use |

---

## Install

The npm package is not published yet ([#1](https://github.com/renefichtmueller/slop-radar/issues/1)). Until then, install straight from GitHub:

```bash
npm install -g github:renefichtmueller/slop-radar
```

Requires Node.js 18 or newer. Once the package is on npm, `npm install -g slop-radar` and `npx slop-radar` will work as well.

## CLI

```bash
slop-radar essay.md                  # full report (same as: slop-radar check essay.md)
slop-radar score article.txt         # score and rating only
slop-radar json draft.md             # machine-readable JSON, e.g. for CI
cat text.md | slop-radar             # read from stdin
cat text.md | slop-radar score
```

```
--lang en|de|auto    Force the language (default: auto-detect)
--help               Show help
--version            Show version
```

Colors are used only when writing to a terminal. Set `NO_COLOR=1` to turn them off, `FORCE_COLOR=1` to force them.

## Library

```typescript
import { detect, score } from "slop-radar";

const detection = detect("This transformative journey leverages cutting-edge innovation.", "en");
const result = score(detection);

console.log(result.score);   // 92
console.log(result.rating);  // "HUMAN"
console.log(detection.phraseMatches.map((m) => m.phrase));
// [ "leverage", "cutting-edge", "transformative", "journey" ]
```

Every phrase match carries `positions` and `lengths`, so you can highlight hits in the original text. `detectWith(database, text, language)` runs the engine against your own phrase lists; it has no Node.js dependencies and works in the browser.

## How scoring works

Start at **100**, then:

| Rule | Points |
|---|---|
| Each buzzword or phrase hit | −2 |
| Buzzword density above 5 / above 10 hits per 100 words (texts of 30+ words) | −10 / −20 |
| Each structural pattern hit | −weight (1 to 5) |
| Each "Let me …" / "Here's the thing" opener | −3 |
| Passive voice in more than 30% of sentences | −10 |
| Text contains a question | +5 |
| Sentence lengths vary naturally | +5 |

List-style patterns (bold numbered items, emoji headers, bullet blocks) report every hit but count at most a few times, so one long list cannot sink a document. The score is clamped to 0-100.

## Example

**Input:**
> Let me dive deep into this transformative journey. Here's the thing -- in today's
> fast-paced landscape, it's worth noting that leveraging cutting-edge solutions is
> crucial. Moreover, this holistic approach empowers stakeholders to unlock
> unprecedented synergy.

**Output** (`slop-radar check`, abbreviated):
```
  Score: 40/100   LIKELY AI

  Buzzwords found: 17
    "dive deep", "crucial", "landscape", "cutting-edge", "transformative",
    "unprecedented", "unlock", "empower", "synergy", "journey", "moreover",
    "it's worth noting", "in today's fast-paced", "stakeholder",
    "here's the thing", "holistic approach", "leveraging"

  Patterns detected: 2
    let-me-starter, heres-the-thing

  Score breakdown:
    Buzzwords:               -34
    Buzzword density:        -20
    Let me / Here's:         -6
    Final:                    40
```

**Rewritten:**
> How do we make our product development faster? We found that using modern tools
> cut our deployment time by 40%. The team now ships weekly instead of monthly,
> and customer complaints dropped.

Score: **100/100 HUMAN**. Specific, concrete, no filler.

German works the same way. This paragraph scores **64/100 SUSPICIOUS** with 8 phrase hits:

> In der heutigen schnelllebigen Welt ist es wichtig zu beachten, dass maßgeschneiderte
> Lösungen einen echten Mehrwert schaffen. Tauchen wir ein: Dieser ganzheitliche Ansatz
> spielt eine entscheidende Rolle und hebt Ihr Unternehmen auf das nächste Level.

## Phrase database

The databases are plain JSON in `src/database/`:

- `phrases-en.json`: 437 English phrases
- `phrases-de.json`: 210 German phrases
- `patterns.json`: 16 structural patterns (regex, weight, optional `maxCount`)

New phrases are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) explains what qualifies and how inflections are handled.

## Browser demo

`demo/` is a static page that imports the compiled engine from `demo/lib/`. After changing the engine or the database, regenerate it:

```bash
npm run build:demo
```

CI fails if `demo/lib/` is out of date, so the demo cannot drift from the CLI again.

## Claude Code skill

Copy `skill/SKILL.md` (or `superpowers-skill/SKILL.md`) into `.claude/skills/slop-radar/` to use slop-radar from Claude Code.

## Why this exists

Text written by language models has a recognizable style: filler words, hedges, forced enthusiasm and a predictable structure. Once you notice it, you see it everywhere, and readers do too. slop-radar makes those habits visible so you can cut them.

Use it to:
- Clean up your own drafts
- Check content before publishing
- Score AI drafts and revise until they read like a person wrote them
- Enforce a writing standard in CI

## Contributors

- [@renefichtmueller](https://github.com/renefichtmueller): creator and maintainer
- [Terry Sweetser (@tcsweetser)](https://github.com/tcsweetser): first test suite and CI test runs, the bare-file CLI fix, the three counting bugs in [#3](https://github.com/renefichtmueller/slop-radar/issues/3) and their fixes ([#2](https://github.com/renefichtmueller/slop-radar/pull/2), [#4](https://github.com/renefichtmueller/slop-radar/pull/4))

Thank you! See [CHANGELOG.md](CHANGELOG.md) for who changed what.

## Related projects

- **[claude-cortex](https://github.com/renefichtmueller/claude-cortex)**: persistent memory for Claude Code sessions.
- **[claude-sync](https://github.com/renefichtmueller/claude-sync)**: multi-device sync for Claude Code.

## License

MIT
