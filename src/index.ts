export { detect, loadDatabase } from "./detector.js";
export { detectWith, detectLanguage, normalizeText } from "./engine.js";
export type {
  Database,
  DetectionResult,
  Language,
  PatternDef,
  PatternMatch,
  PhraseMatch,
} from "./engine.js";

export { score } from "./scorer.js";
export type { ScoreResult, Rating } from "./scorer.js";

export { formatFull, formatScore, formatJson } from "./formatter.js";

export { VERSION } from "./version.js";
