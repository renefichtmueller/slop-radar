import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { detectWith } from "./engine.js";
import type { Database, DetectionResult, Language, PatternDef } from "./engine.js";

export type {
  Database,
  DetectionResult,
  Language,
  PatternDef,
  PatternMatch,
  PhraseMatch,
} from "./engine.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadJson<T>(relativePath: string): T {
  // src/database next to the sources (dev), or ../src/database from dist/.
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

let database: Database | null = null;

export function loadDatabase(): Database {
  if (!database) {
    database = {
      phrasesEn: loadJson<string[]>("phrases-en.json"),
      phrasesDe: loadJson<string[]>("phrases-de.json"),
      patterns: loadJson<PatternDef[]>("patterns.json"),
    };
  }
  return database;
}

export function detect(
  text: string,
  language: Language | "auto" = "auto"
): DetectionResult {
  return detectWith(loadDatabase(), text, language);
}
