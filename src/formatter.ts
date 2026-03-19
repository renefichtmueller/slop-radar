import type { DetectionResult } from "./detector.js";
import type { ScoreResult } from "./scorer.js";

// ANSI color codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BG_RED = "\x1b[41m";
const BG_YELLOW = "\x1b[43m";
const BG_GREEN = "\x1b[42m";
const WHITE = "\x1b[37m";

function scoreColor(s: number): string {
  if (s >= 90) return GREEN;
  if (s >= 70) return GREEN;
  if (s >= 50) return YELLOW;
  if (s >= 30) return RED;
  return RED;
}

function scoreBadge(s: number): string {
  if (s >= 90) return `${BG_GREEN}${WHITE}${BOLD} HUMAN ${RESET}`;
  if (s >= 70) return `${BG_GREEN}${WHITE}${BOLD} MOSTLY CLEAN ${RESET}`;
  if (s >= 50) return `${BG_YELLOW}${WHITE}${BOLD} SUSPICIOUS ${RESET}`;
  if (s >= 30) return `${BG_RED}${WHITE}${BOLD} LIKELY AI ${RESET}`;
  return `${BG_RED}${WHITE}${BOLD} PURE SLOP ${RESET}`;
}

function bar(value: number, max: number = 100, width: number = 30): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  const color = scoreColor(value);
  return `${color}${"█".repeat(filled)}${DIM}${"░".repeat(empty)}${RESET}`;
}

export function formatFull(
  detection: DetectionResult,
  scoreResult: ScoreResult
): string {
  const lines: string[] = [];

  // Header
  lines.push("");
  lines.push(
    `${BOLD}  SLOP RADAR${RESET} ${DIM}v1.0.0${RESET}`
  );
  lines.push(`  ${"─".repeat(50)}`);
  lines.push("");

  // Score
  const color = scoreColor(scoreResult.score);
  lines.push(
    `  Score: ${color}${BOLD}${scoreResult.score}${RESET}/100  ${scoreBadge(scoreResult.score)}`
  );
  lines.push(`  ${bar(scoreResult.score)}`);
  lines.push("");

  // Language
  lines.push(
    `  ${DIM}Language: ${detection.language === "de" ? "German" : "English"}${RESET}`
  );
  lines.push("");

  // Phrase matches
  if (detection.phraseMatches.length > 0) {
    lines.push(
      `  ${BOLD}${RED}Buzzwords found: ${detection.totalPhraseHits}${RESET}`
    );
    lines.push(
      `  ${DIM}(-2 points each)${RESET}`
    );
    lines.push("");

    // Sort by count descending
    const sorted = [...detection.phraseMatches].sort(
      (a, b) => b.count - a.count
    );
    for (const m of sorted.slice(0, 20)) {
      const countStr = m.count > 1 ? ` x${m.count}` : "";
      lines.push(
        `    ${RED}●${RESET} "${m.phrase}"${DIM}${countStr}${RESET}`
      );
    }
    if (sorted.length > 20) {
      lines.push(
        `    ${DIM}...and ${sorted.length - 20} more${RESET}`
      );
    }
    lines.push("");
  }

  // Pattern matches
  if (detection.patternMatches.length > 0) {
    lines.push(
      `  ${BOLD}${YELLOW}Patterns detected: ${detection.totalPatternHits}${RESET}`
    );
    lines.push("");

    for (const pm of detection.patternMatches) {
      const countStr = pm.count > 1 ? ` x${pm.count}` : "";
      lines.push(
        `    ${YELLOW}▲${RESET} ${pm.name}${DIM}${countStr} (-${pm.weight}pts each)${RESET}`
      );
      lines.push(`      ${DIM}${pm.description}${RESET}`);
    }
    lines.push("");
  }

  // Breakdown
  lines.push(`  ${BOLD}Score breakdown:${RESET}`);
  lines.push(`    Start:                    100`);
  if (scoreResult.breakdown.phraseDeductions > 0)
    lines.push(
      `    ${RED}Buzzwords:               -${scoreResult.breakdown.phraseDeductions}${RESET}`
    );
  if (scoreResult.breakdown.patternDeductions > 0)
    lines.push(
      `    ${RED}Patterns:                -${scoreResult.breakdown.patternDeductions}${RESET}`
    );
  if (scoreResult.breakdown.passiveVoiceDeduction > 0)
    lines.push(
      `    ${RED}Passive voice density:   -${scoreResult.breakdown.passiveVoiceDeduction}${RESET}`
    );
  if (scoreResult.breakdown.letMeDeduction > 0)
    lines.push(
      `    ${RED}Let me / Here's:         -${scoreResult.breakdown.letMeDeduction}${RESET}`
    );
  if (scoreResult.breakdown.questionBonus > 0)
    lines.push(
      `    ${GREEN}Questions bonus:         +${scoreResult.breakdown.questionBonus}${RESET}`
    );
  if (scoreResult.breakdown.sentenceLengthBonus > 0)
    lines.push(
      `    ${GREEN}Sentence variety bonus:  +${scoreResult.breakdown.sentenceLengthBonus}${RESET}`
    );
  lines.push(
    `    ${BOLD}${color}Final:                    ${scoreResult.score}${RESET}`
  );

  lines.push("");
  lines.push(`  ${"─".repeat(50)}`);
  lines.push("");

  return lines.join("\n");
}

export function formatScore(scoreResult: ScoreResult): string {
  const color = scoreColor(scoreResult.score);
  return `${color}${scoreResult.score}${RESET} ${scoreBadge(scoreResult.score)}`;
}

export function formatJson(
  detection: DetectionResult,
  scoreResult: ScoreResult
): string {
  return JSON.stringify(
    {
      score: scoreResult.score,
      rating: scoreResult.rating,
      language: detection.language,
      phraseMatches: detection.phraseMatches.length,
      totalPhraseHits: detection.totalPhraseHits,
      patternMatches: detection.patternMatches.length,
      totalPatternHits: detection.totalPatternHits,
      breakdown: scoreResult.breakdown,
      phrases: detection.phraseMatches.map((m) => ({
        phrase: m.phrase,
        count: m.count,
      })),
      patterns: detection.patternMatches.map((m) => ({
        name: m.name,
        count: m.count,
      })),
    },
    null,
    2
  );
}
