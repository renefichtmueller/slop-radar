# slop-radar

> **[🚀 Live Demo](https://slop-radar-demo.pages.dev)** — Try it in your browser, no installation needed.

**Detect AI slop in text.** A living buzzword database, structural pattern matcher, and scoring engine -- available as CLI tool, Node.js library, and Claude Code skill.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

---

## What it does

> **[🚀 Live Demo](https://slop-radar-demo.pages.dev)** — Try it in your browser, no installation needed.

Slop-radar scans text for:

- **200+ AI buzzwords** (English) and **120+ German AI phrases**
- **14 structural patterns** like em-dash abuse, "Let me" starters, bullet overload, and passive voice density
- **Fuzzy matching** to catch variations and reformulations

It returns a score from 0 to 100:

| Score | Rating | Meaning |
|-------|--------|---------|
| 90-100 | HUMAN | Clean, natural writing |
| 70-89 | MOSTLY CLEAN | Minor AI signals |
| 50-69 | SUSPICIOUS | Multiple AI patterns found |
| 30-49 | LIKELY AI | Strong AI writing signals |
| 0-29 | PURE SLOP | Heavy buzzword and pattern use |

---

## Quick start

```bash
# Check a file
npx slop-radar check essay.md

# Pipe text
echo "Let me dive deep into this transformative journey" | npx slop-radar

# Score only
npx slop-radar score article.txt

# JSON output (for CI/scripts)
npx slop-radar json draft.md
```

## Install

```bash
npm install -g slop-radar
```

Or use directly with npx (no install needed).

## CLI

```
slop-radar check <file>         Full analysis with color output
slop-radar score <file>         Score + rating badge only
slop-radar json <file>          Machine-readable JSON
cat text.md | slop-radar        Pipe text for analysis
```

### Options

```
--lang en|de|auto    Force language detection (default: auto)
--help               Show help
--version            Show version
```

## Library usage

```typescript
import { detect, score, formatFull } from "slop-radar";

const text = "This transformative journey leverages cutting-edge innovation.";
const detection = detect(text, "en");
const result = score(detection);

console.log(result.score);   // 88
console.log(result.rating);  // "MOSTLY CLEAN"
```

## How scoring works

Starting score: **100**

**Deductions:**
- -2 per buzzword/phrase found
- -weight per structural pattern match (weight varies 1-5)
- -10 for passive voice density above 30%
- -3 per "Let me" / "Here's the thing" opener

**Bonuses:**
- +5 if text contains questions
- +5 if sentence lengths vary naturally

Score is clamped to 0-100.

## Example

**Input:**
> Let me dive deep into this transformative journey. Here's the thing -- in today's
> fast-paced landscape, it's worth noting that leveraging cutting-edge solutions is
> crucial. Moreover, this holistic approach empowers stakeholders to unlock
> unprecedented synergy.

**Output:**
```
  Score: 28/100  PURE SLOP

  Buzzwords found: 12
    "dive deep", "transformative", "journey", "in today's fast-paced",
    "landscape", "it's worth noting", "leveraging", "cutting-edge",
    "crucial", "moreover", "holistic", "empower", "stakeholders",
    "unlock", "unprecedented", "synergy"

  Patterns detected: 3
    let-me-starter, heres-the-thing, worth-noting
```

**Cleaned version:**
> How do we make our product development faster? We found that using modern tools
> cut our deployment time by 40%. The team now ships weekly instead of monthly,
> and customer complaints dropped.

Score: **95/100 HUMAN** -- specific, concrete, no filler.

## Phrase database

The phrase databases are plain JSON arrays in `src/database/`:

- `phrases-en.json` -- 200+ English AI phrases
- `phrases-de.json` -- 120+ German AI phrases
- `patterns.json` -- 14 structural patterns with regex

### Adding phrases

Edit the JSON files and submit a PR. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on what qualifies as an AI phrase.

## Claude Code skill

Drop `skill/SKILL.md` into your `.claude/skills/` directory to use slop-radar as a Claude Code slash command. See the skill file for details.

## Why this exists

AI-generated text has a recognizable style: filler words, hedge phrases, artificial enthusiasm, and predictable structure. Slop-radar does not detect AI authorship (that is a harder, different problem). Instead, it detects **AI-style writing** -- the buzzwords and patterns that make text feel generic and low-effort, regardless of who wrote it.

Use it to:
- Clean up your own writing
- Audit content before publishing
- Score AI drafts and iterate until they sound human
- Enforce quality standards in a CI pipeline

## Related Projects

- **[claude-cortex](https://github.com/renefichtmueller/claude-cortex)** — Persistent memory for Claude Code sessions.
- **[claude-sync](https://github.com/renefichtmueller/claude-sync)** — Multi-device sync for Claude Code.

## License

MIT
