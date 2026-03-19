import type { DetectionResult } from "./detector.js";

export interface ScoreResult {
  score: number;
  rating: string;
  breakdown: {
    phraseDeductions: number;
    patternDeductions: number;
    passiveVoiceDeduction: number;
    letMeDeduction: number;
    questionBonus: number;
    sentenceLengthBonus: number;
  };
}

export type Rating =
  | "HUMAN"
  | "MOSTLY CLEAN"
  | "SUSPICIOUS"
  | "LIKELY AI"
  | "PURE SLOP";

function getRating(score: number): Rating {
  if (score >= 90) return "HUMAN";
  if (score >= 70) return "MOSTLY CLEAN";
  if (score >= 50) return "SUSPICIOUS";
  if (score >= 30) return "LIKELY AI";
  return "PURE SLOP";
}

function countSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function hasVariedSentenceLength(text: string): boolean {
  const sentences = countSentences(text);
  if (sentences.length < 3) return false;

  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // High standard deviation = varied sentence length
  return stdDev > 4;
}

function countQuestions(text: string): number {
  const matches = text.match(/\?/g);
  return matches ? matches.length : 0;
}

export function score(detection: DetectionResult): ScoreResult {
  let s = 100;

  // -2 per buzzword hit
  const phraseDeductions = detection.totalPhraseHits * 2;
  s -= phraseDeductions;

  // -weight per structural pattern match (excluding passive voice and let-me which are handled separately)
  let patternDeductions = 0;
  let passiveVoiceDeduction = 0;
  let letMeDeduction = 0;

  for (const pm of detection.patternMatches) {
    if (pm.name === "passive-voice-density") {
      // Check density: if passive instances > 30% of sentences, deduct 10
      const sentences = countSentences(detection.text);
      const passiveRatio =
        sentences.length > 0 ? pm.count / sentences.length : 0;
      if (passiveRatio > 0.3) {
        passiveVoiceDeduction = 10;
      }
    } else if (pm.name === "let-me-starter" || pm.name === "heres-the-thing") {
      letMeDeduction += pm.count * 3;
    } else {
      patternDeductions += pm.count * pm.weight;
    }
  }

  s -= patternDeductions;
  s -= passiveVoiceDeduction;
  s -= letMeDeduction;

  // Bonuses
  const questionBonus = countQuestions(detection.text) > 0 ? 5 : 0;
  const sentenceLengthBonus = hasVariedSentenceLength(detection.text) ? 5 : 0;

  s += questionBonus;
  s += sentenceLengthBonus;

  // Clamp
  s = Math.max(0, Math.min(100, s));

  return {
    score: s,
    rating: getRating(s),
    breakdown: {
      phraseDeductions,
      patternDeductions,
      passiveVoiceDeduction,
      letMeDeduction,
      questionBonus,
      sentenceLengthBonus,
    },
  };
}
