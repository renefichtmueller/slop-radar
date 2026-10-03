# Contributing to slop-radar

Thanks for helping fight AI slop! Contributors are credited in the README and in [CHANGELOG.md](CHANGELOG.md).

## Adding Phrases

The easiest way to contribute is adding new AI-typical phrases to the databases.

### English phrases: `src/database/phrases-en.json`
### German phrases: `src/database/phrases-de.json`

Each file is a JSON array of lowercase strings. Keep entries:
- **Lowercase** (matching is case-insensitive)
- **Unique** (no duplicates; `npm test` checks this)
- **Grouped** with related entries
- **Actually AI-typical** (not just formal language)

### How inflections are matched

- **English:** a plural or third-person `-s` on the last word is matched automatically, so add `stakeholder`, not `stakeholders`. Other forms that are strong signals on their own (`leveraging`, `delving`) are separate entries.
- **German:** write the base form, with umlauts (`maßgeschneidert`) or the ASCII spelling the list uses (`massgeschneidert`). Both spellings match, and common endings (`-e`, `-en`, `-er`, `-es`, `-em`, `-n`, `-s`) are accepted, so `maßgeschneiderte Lösungen` matches the entry `massgeschneiderte loesungen`. Prefer the short core of a phrase (`wichtig zu beachten`) so other word orders match too.
- **Overlaps are fine:** when `a myriad of` and `myriad` both match, only the longest phrase counts.

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
- `pattern`: Regex string (always matched globally; add `u` to `flags` for `\p{...}` classes)
- `flags`: Optional regex flags (default `gi`)
- `weight`: Penalty points per hit (1-10)
- `maxCount`: Optional cap on how many hits count toward the score (for list-style patterns)
- `description`: Why this pattern is suspicious

## Code Changes

1. Fork the repo
2. Create a feature branch
3. Make changes and add tests in `test/unit/` or `test/regression/`
4. Run `npm test` (build, unit tests, CLI regression tests)
5. If you changed the engine, the scorer or the database, run `npm run build:demo` and commit `demo/lib/`
6. Submit a PR

## Releasing (maintainers)

1. Bump `version` in `package.json` and `package-lock.json`, and move the `Unreleased` entries in CHANGELOG.md under the new version.
2. Merge to `main` with green CI.
3. Create a GitHub release with the tag `vX.Y.Z` (matching `package.json`). The `Release` workflow tests and publishes to npm through trusted publishing, with provenance.

## Reporting False Positives

If slop-radar flags legitimate human writing, open an issue with:
- The flagged text (or a representative sample)
- The phrases/patterns that were incorrectly flagged
- Why you believe this is a false positive
