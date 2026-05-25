#!/usr/bin/env node
/**
 * Escapes HTML tags in help JSON files for ICU MessageFormat.
 * next-intl interprets <tag> as rich text; wrap in single quotes for literal output.
 * Run after adding/editing help content with HTML: node scripts/escape-html-in-help-json.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HELP_DIR = path.join(__dirname, "..", "messages", "help");
const TAGS = ["strong", "h3", "h2", "li", "ul", "ol", "p"];

function escapeHtmlInString(str) {
  if (typeof str !== "string" || !str.includes("<")) return str;
  let result = str;
  for (const tag of TAGS) {
    result = result.replace(new RegExp(`</${tag}>`, "g"), `'</${tag}>'`);
    result = result.replace(new RegExp(`<${tag}>`, "g"), `'<${tag}>'`);
  }
  return result;
}

function processObject(obj) {
  const result = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] =
      typeof value === "string"
        ? escapeHtmlInString(value)
        : value && typeof value === "object"
          ? processObject(value)
          : value;
  }
  return result;
}

for (const file of ["es.json", "en.json", "pt.json", "fr.json"]) {
  const filePath = path.join(HELP_DIR, file);
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  fs.writeFileSync(
    filePath,
    JSON.stringify(processObject(content), null, 2) + "\n",
    "utf-8"
  );
  console.log(`Processed ${file}`);
}
