---
name: slop-radar
description: Detect AI slop patterns in generated text. Use before finalizing any prose, documentation, README, or written content to check for AI buzzwords, structural patterns, and generic filler. Returns a score and actionable replacements.
allowed-tools: ["Bash", "Read", "Glob"]
argument-hint: "[file-or-text]"
---

# Slop Radar

Scan text for AI-generated writing patterns before finalizing output.

## When to Use

- After generating documentation, READMEs, blog posts, or any prose
- When reviewing or editing written content
- Before committing markdown files
- When user asks to "check for slop", "check quality", or "make it sound human"
- Automatically after creating any substantial text output (500+ words)

## How It Works

1. **Buzzword scan**: Check against 245 English and 127 German AI phrases
2. **Structural patterns**: Detect em-dash abuse, "Let me" starters, bullet overload, passive voice density, triple-adjective stacking, hedge phrases
3. **Score**: 0-100 scale (100 = fully human, 0 = pure AI slop)

## Instructions

When triggered, analyze the text (from `$ARGUMENTS` file path or the most recently generated prose):

### Step 1: Identify the text to check

If `$ARGUMENTS` is a file path, read that file. Otherwise, check the most recently generated text output in the conversation.

### Step 2: Run the slop scan

Check the text against these pattern categories:

**Buzzwords (deduct 2 points each):**
"dive deep", "transformative", "journey", "landscape", "leverage", "cutting-edge", "holistic", "empower", "stakeholders", "synergy", "unprecedented", "robust", "streamline", "innovative", "paradigm", "ecosystem", "scalable", "game-changer", "best-in-class", "actionable", "at the end of the day", "in today's fast-paced", "it's worth noting", "moreover", "furthermore", "crucial", "pivotal", "seamless", "comprehensive", "elevate", "foster", "harness", "spearhead", "drive", "unlock", "reimagine", "navigate the complexities", "delve into", "underscore"

**Structural Patterns (deduct 3-5 points each):**
- Sentences starting with "Let me..." or "Here's the thing..."
- Em-dash abuse (more than 1 per 200 words)
- Triple bullet point lists where a paragraph would work
- Passive voice density above 30%
- Paragraphs ending with punchy one-liners
- "Not X -- it's Y" contrast structures
- Rhetorical question followed by immediate answer

**Bonuses (add points):**
- +5 for natural sentence length variation
- +5 for concrete numbers, names, or specific examples
- +3 for conversational tone without being forced

### Step 3: Calculate and report score

```
Score: [X]/100  [RATING]

Rating scale:
  90-100  HUMAN          Clean, natural writing
  70-89   MOSTLY CLEAN   Minor AI signals
  50-69   SUSPICIOUS     Multiple AI patterns
  30-49   LIKELY AI      Strong AI writing signals
  0-29    PURE SLOP      Heavy buzzword and pattern use
```

### Step 4: Show flagged items with replacements

For each flagged buzzword or pattern, suggest a concrete replacement:

| Found | Replacement |
|-------|-------------|
| "leverage" | "use" |
| "cutting-edge" | (name the specific technology) |
| "stakeholders" | (name the actual people: "customers", "engineers") |
| "it's worth noting that" | (delete -- just state the thing) |
| "dive deep into" | "look at" or "examine" |
| "transformative" | (describe the actual change) |
| "comprehensive" | (be specific about what it covers) |
| "seamless" | (describe the actual experience) |
| "robust" | (state what makes it reliable) |
| "innovative" | (describe what is actually new) |

### Step 5: Offer to rewrite

If score is below 70, offer to rewrite the flagged sections with concrete, specific language. Apply these principles:
- Replace vague adjectives with specific facts
- Replace buzzwords with plain words
- Break formulaic structures
- Add concrete examples where generalities exist
- Use active voice with named subjects

## Example Output

```
Slop Radar Results
------------------
Score: 42/100  LIKELY AI

Buzzwords (8 found):
  "transformative", "leverage", "cutting-edge", "holistic",
  "stakeholders", "ecosystem", "seamless", "robust"

Patterns (3 found):
  - Let-me starter (line 1)
  - Em-dash overuse (4 in 200 words)
  - Punchy one-liner ending (line 12)

Suggested rewrites provided for 11 items.
Rewrite flagged sections? [y/n]
```

## Integration

For automated checking, slop-radar is available as a CLI tool:

```bash
npx slop-radar check <file>    # Full analysis
npx slop-radar score <file>    # Score only
npx slop-radar json <file>     # Machine-readable output
```

## License

MIT
