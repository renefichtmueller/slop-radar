// Copies the browser-safe engine, the scorer and the phrase database into
// demo/lib so the static demo runs exactly the code the CLI runs.
// Run after `tsc` (npm run build:demo). CI fails if demo/lib is stale.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const out = new URL("demo/lib/", root);
const banner = (from) => `// Generated from ${from} by scripts/build-demo.mjs. Do not edit.\n`;
const read = (path) => readFileSync(new URL(path, root), "utf-8");
const dropSourceMap = (code) => code.replace(/\n\/\/# sourceMappingURL=\S+\s*$/, "\n");

mkdirSync(out, { recursive: true });

for (const name of ["engine", "scorer"]) {
  writeFileSync(new URL(`${name}.js`, out), banner(`src/${name}.ts`) + dropSourceMap(read(`dist/${name}.js`)));
}

const db = {
  phrasesEn: JSON.parse(read("src/database/phrases-en.json")),
  phrasesDe: JSON.parse(read("src/database/phrases-de.json")),
  patterns: JSON.parse(read("src/database/patterns.json")),
};
writeFileSync(
  new URL("database.js", out),
  banner("src/database/*.json") + `export default ${JSON.stringify(db, null, 1)};\n`
);
console.log(`demo/lib: ${db.phrasesEn.length} EN + ${db.phrasesDe.length} DE phrases, ${db.patterns.length} patterns`);
