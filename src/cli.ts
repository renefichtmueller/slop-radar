#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { detect } from "./detector.js";
import { score } from "./scorer.js";
import { formatFull, formatScore, formatJson } from "./formatter.js";
import { VERSION } from "./version.js";

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);

    // If nothing comes in 100ms and stdin is a TTY, bail
    if (process.stdin.isTTY) {
      resolve("");
    }
  });
}

function printUsage(): void {
  console.log(`
  slop-radar - AI slop detection toolkit

  Usage:
    slop-radar check <file>         Full analysis of a file
    slop-radar score <file>         Score only (0-100)
    slop-radar json <file>          JSON output
    cat text.md | slop-radar        Pipe text for full analysis
    cat text.md | slop-radar score  Pipe text for score only

  Options:
    --lang en|de|auto    Force language (default: auto)
    --help               Show this help
    --version            Show version

  Score Guide:
    90-100  HUMAN        Clean, natural writing
    70-89   MOSTLY CLEAN Minor AI signals detected
    50-69   SUSPICIOUS   Multiple AI patterns found
    30-49   LIKELY AI    Strong AI writing signals
    0-29    PURE SLOP    Heavy AI buzzword/pattern use
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`slop-radar ${VERSION}`);
    process.exit(0);
  }

  // Parse language flag
  let lang: "en" | "de" | "auto" = "auto";
  const langIdx = args.indexOf("--lang");
  if (langIdx !== -1) {
    const val = args[langIdx + 1];
    if (val !== "en" && val !== "de" && val !== "auto") {
      console.error(`Invalid --lang value: ${val ?? "(missing)"}. Use en, de or auto.`);
      process.exit(2);
    }
    lang = val;
    args.splice(langIdx, 2);
  }

  const COMMANDS = ["check", "score", "json"];
  let command = args[0] ?? "";
  let filePath = args[1];

  // A bare file argument (`slop-radar file.md`) means `check file.md`.
  // Without this, the file name was taken as the command and stdin was
  // analysed instead, silently ignoring the file.
  if (command && !COMMANDS.includes(command)) {
    if (filePath) {
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(2);
    }
    filePath = command;
    command = "check";
  }

  let text = "";

  if (filePath) {
    try {
      text = readFileSync(filePath, "utf-8");
    } catch (err) {
      console.error(`Error reading file: ${filePath}`);
      process.exit(1);
    }
  } else {
    text = await readStdin();
  }

  if (!text.trim()) {
    if (!command || command === "check" || command === "score" || command === "json") {
      printUsage();
    }
    process.exit(0);
  }

  const detection = detect(text, lang);
  const scoreResult = score(detection);

  switch (command) {
    case "score":
      console.log(formatScore(scoreResult));
      break;
    case "json":
      console.log(formatJson(detection, scoreResult));
      break;
    case "check":
    default:
      console.log(formatFull(detection, scoreResult));
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
