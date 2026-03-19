# slop-radar

AI slop detection skill for Claude Code. Scans text for AI buzzwords, structural patterns, and scoring.

## Usage

When reviewing or writing text, check it for AI slop patterns. Run slop-radar on any text file, clipboard content, or inline text to get a quality score.

## Instructions

When the user asks to check text for AI slop, buzzwords, or writing quality:

1. Read the target text (file, selection, or inline)
2. Scan for these categories:

### Buzzword detection (English)
Check for these high-frequency AI phrases (partial list -- see full database in slop-radar repo):
- Filler: "dive into", "delve", "landscape", "journey", "tapestry", "realm", "endeavor"
- Hype: "game-changer", "cutting-edge", "revolutionary", "transformative", "unprecedented", "groundbreaking"
- Corporate: "leverage", "synergy", "stakeholder", "bandwidth", "paradigm shift", "value-add"
- Connectors: "moreover", "furthermore", "additionally", "it's worth noting", "needless to say"
- Openers: "in today's world", "as we navigate", "let me break this down", "here's the thing"
- Actions: "streamline", "optimize", "harness", "unlock", "empower", "catalyze", "reimagine"

### Buzzword detection (German)
- "bahnbrechend", "wegweisend", "transformativ", "ganzheitlich", "massgeschneidert"
- "darueber hinaus", "nichtsdestotrotz", "in anbetracht", "zusammenfassend"
- "potenzial entfalten", "impulse setzen", "massstaebe setzen"

### Structural patterns
- Excessive em-dash usage (3+ per paragraph)
- "Let me [verb]" sentence starters
- "Here's the thing/what" openers
- Binary contrasts ("Not just X, but Y")
- Wh- question headers ("What makes this", "Why this matters")
- Bullet-point overload (6+ consecutive bullets)
- Triple adjective chains
- Meta-references ("In this article/post/guide")
- High passive voice density (>30% of sentences)
- Emoji + bold header combinations

### Scoring
Start at 100, deduct:
- -2 per buzzword found
- -1 to -5 per structural pattern (by weight)
- -10 for high passive voice density
- -3 per "Let me" / "Here's" opener
Bonus +5 for questions, +5 for varied sentence length.

Rating: 90-100 HUMAN, 70-89 MOSTLY CLEAN, 50-69 SUSPICIOUS, 30-49 LIKELY AI, 0-29 PURE SLOP

### Output format
Report the score, list found buzzwords, list detected patterns, and suggest concrete replacements:
- Replace "leverage" with "use"
- Replace "utilize" with "use"
- Replace "comprehensive" with "complete" or "full"
- Replace "robust" with "solid" or "strong"
- Replace "seamless" with "smooth"
- Replace "innovative" with describe what is actually new
- Replace "transformative" with describe the actual change
- Drop filler connectors entirely ("moreover", "furthermore", "additionally")
- Replace "it's worth noting" with just state the thing
- Replace "in today's fast-paced world" with be specific about what changed
