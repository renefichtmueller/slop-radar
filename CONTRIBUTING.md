# Contributing to slop-radar

Thanks for helping fight AI slop!

## Adding Phrases

The easiest way to contribute is adding new AI-typical phrases to the databases.

### English phrases: `src/database/phrases-en.json`
### German phrases: `src/database/phrases-de.json`

Each file is a JSON array of lowercase strings. Keep entries:
- **Lowercase** (matching is case-insensitive)
- **Unique** (no duplicates)
- **Sorted alphabetically** within their section
- **Actually AI-typical** (not just formal language)

### How to decide if a phrase belongs

**YES** -- phrases that AI uses disproportionately more than humans:
- "delve into the intricacies"
- "it's worth noting that"
- "let me break this down"

**NO** -- phrases that humans also use frequently:
- "I think"
- "for example"
- "in my opinion"

## Adding Patterns

Structural patterns go in `src/database/patterns.json`. Each pattern has:
- `name`: Human-readable identifier
- `pattern`: Regex string
- `weight`: Penalty points (1-10)
- `description`: Why this pattern is suspicious

## Code Changes

1. Fork the repo
2. Create a feature branch
3. Make changes
4. Run `npm run build` to verify TypeScript compiles
5. Test with sample text: `echo "your test text" | node dist/cli.js`
6. Submit a PR

## Reporting False Positives

If slop-radar flags legitimate human writing, open an issue with:
- The flagged text (or a representative sample)
- The phrases/patterns that were incorrectly flagged
- Why you believe this is a false positive
