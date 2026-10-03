---
name: slop-radar
description: Score prose for AI slop (buzzwords, filler phrases, chatbot tells, formulaic structure) in English and German with the slop-radar engine, then suggest concrete rewrites. Use when the user asks to check text for AI slop or buzzwords, to make writing sound less AI-generated, or before finalizing a README, documentation, post or email they asked you to polish.
---

# slop-radar

Measure AI-style writing with the real slop-radar engine instead of judging by eye. The score runs from 0 to 100; higher means more human.

## 1. Run the engine

```bash
npx -y slop-radar json path/to/file.md            # a file
printf '%s' "$TEXT" | npx -y slop-radar json      # inline text
```

Use `slop-radar json …` instead of `npx -y slop-radar json …` when it is installed globally (`npm install -g slop-radar`). Add `--lang de` or `--lang en` when auto-detection picks the wrong language.

The JSON contains `score`, `rating`, `language`, `phrases` (`phrase`, `count`), `patterns` (`name`, `count`, `weight`, optional `maxCount`) and `breakdown` (every deduction and bonus).

## 2. Report

- The score and rating (90-100 HUMAN, 70-89 MOSTLY CLEAN, 50-69 SUSPICIOUS, 30-49 LIKELY AI, 0-29 PURE SLOP).
- Each flagged phrase and pattern with a concrete replacement. Quote the passage; do not list categories in the abstract.
- The largest items from `breakdown`, so the user sees what costs the most points.

## 3. Rewrite (when asked, or offer it below 70)

- Replace buzzwords with plain words: "leverage" → "use", "utilize" → "use", "robust" → say what makes it reliable, "seamless" → describe the actual experience.
- Name specifics instead of hype: "cutting-edge" → the technology, "stakeholders" → the people, "transformative" → the change.
- Delete filler: "moreover", "it's worth noting that", "in today's fast-paced world", "I hope this helps".
- Break formulas: "It's not X, it's Y" → state Y; "not only X but also Y" → two plain sentences; emoji headers and bold numbered lists → prose where prose works.
- German: "maßgeschneiderte Lösungen", "einen Mehrwert schaffen", "tauchen wir ein", "auf das nächste Level" → say concretely what the thing does.

Run the engine again on the rewrite and report the score before and after. Keep the author's meaning and facts; never invent numbers or examples.

## Without Node.js

If `npx` is unavailable, check the text by hand for the categories above and say clearly that the result is an estimate, not a slop-radar score.
