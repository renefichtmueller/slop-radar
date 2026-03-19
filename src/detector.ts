import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface PhraseMatch {
  phrase: string;
  count: number;
  positions: number[];
}

export interface PatternMatch {
  name: string;
  description: string;
  count: number;
  weight: number;
}

export interface DetectionResult {
  text: string;
  phraseMatches: PhraseMatch[];
  patternMatches: PatternMatch[];
  totalPhraseHits: number;
  totalPatternHits: number;
  language: "en" | "de" | "auto";
}

interface PatternDef {
  name: string;
  pattern: string;
  flags?: string;
  weight: number;
  description: string;
}

function loadJson<T>(relativePath: string): T {
  // Try src/database first (dev), then fall back to dist-relative path
  const paths = [
    join(__dirname, "database", relativePath),
    join(__dirname, "..", "src", "database", relativePath),
  ];
  for (const p of paths) {
    try {
      return JSON.parse(readFileSync(p, "utf-8")) as T;
    } catch {
      continue;
    }
  }
  throw new Error(`Cannot load database file: ${relativePath}`);
}

let phrasesEn: string[] | null = null;
let phrasesDe: string[] | null = null;
let patterns: PatternDef[] | null = null;

function getPhrasesEn(): string[] {
  if (!phrasesEn) phrasesEn = loadJson<string[]>("phrases-en.json");
  return phrasesEn;
}

function getPhrasesDe(): string[] {
  if (!phrasesDe) phrasesDe = loadJson<string[]>("phrases-de.json");
  return phrasesDe;
}

function getPatterns(): PatternDef[] {
  if (!patterns) patterns = loadJson<PatternDef[]>("patterns.json");
  return patterns;
}

function detectLanguage(text: string): "en" | "de" {
  const deIndicators = [
    /\b(der|die|das|und|ist|ein|eine|nicht|mit|auf|dem|den|des|sich|von|zu|als|es|wird|haben|auch|nach|aus|bei|wie|oder|wenn|noch|nur|kann|sind|sein|hat|ich|aber|diese|einen|keine|dann|schon|wir|sie|ich|man|doch)\b/gi,
  ];
  const enIndicators = [
    /\b(the|and|is|a|to|of|in|that|it|for|was|on|are|with|they|be|at|this|have|from|or|had|by|but|not|what|all|were|we|when|your|can|said|there|each|which|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some)\b/gi,
  ];

  let deScore = 0;
  let enScore = 0;

  for (const re of deIndicators) {
    const m = text.match(re);
    if (m) deScore += m.length;
  }
  for (const re of enIndicators) {
    const m = text.match(re);
    if (m) enScore += m.length;
  }

  return deScore > enScore ? "de" : "en";
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fuzzyMatch(text: string, phrase: string): number {
  // Simple fuzzy: check for the phrase with optional extra whitespace / punctuation between words
  const words = phrase.split(/\s+/);
  if (words.length === 1) return 0; // No fuzzy for single words

  const fuzzyPattern = words.map(escapeRegex).join("[\\s,;:\\-]+");
  const re = new RegExp(fuzzyPattern, "gi");
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

export function detect(
  text: string,
  language: "en" | "de" | "auto" = "auto"
): DetectionResult {
  const lang = language === "auto" ? detectLanguage(text) : language;
  const phrases = lang === "de" ? getPhrasesDe() : getPhrasesEn();
  const textLower = text.toLowerCase();

  // Phrase matching
  const phraseMatches: PhraseMatch[] = [];

  for (const phrase of phrases) {
    const escaped = escapeRegex(phrase);
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    const positions: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = re.exec(textLower)) !== null) {
      positions.push(match.index);
    }

    // Also check fuzzy matches
    const fuzzyCount = fuzzyMatch(textLower, phrase);

    const totalCount = positions.length + fuzzyCount;
    if (totalCount > 0) {
      phraseMatches.push({
        phrase,
        count: totalCount,
        positions,
      });
    }
  }

  // Pattern matching
  const patternDefs = getPatterns();
  const patternMatches: PatternMatch[] = [];

  for (const pDef of patternDefs) {
    try {
      const flags = pDef.flags ?? "gi";
      const re = new RegExp(pDef.pattern, flags);
      const matches = text.match(re);
      const count = matches ? matches.length : 0;

      if (count > 0) {
        patternMatches.push({
          name: pDef.name,
          description: pDef.description,
          count,
          weight: pDef.weight,
        });
      }
    } catch {
      // Skip invalid regex patterns
      continue;
    }
  }

  const totalPhraseHits = phraseMatches.reduce((sum, m) => sum + m.count, 0);
  const totalPatternHits = patternMatches.reduce((sum, m) => sum + m.count, 0);

  return {
    text,
    phraseMatches,
    patternMatches,
    totalPhraseHits,
    totalPatternHits,
    language: lang,
  };
}
