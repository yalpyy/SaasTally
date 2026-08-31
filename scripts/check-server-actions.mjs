#!/usr/bin/env node
/**
 * Guard: a "use server" file may only export async functions.
 *
 * Exporting anything else — a constant, an object, a class — makes the module
 * throw when it is first required in production: "can only export async
 * functions, found object". `next build` does not catch it, because the check
 * happens at load time, so it ships and takes the whole page down.
 *
 * That is exactly what happened here: nine action files each exported their
 * initial form state, and every admin editor was broken in production while
 * the build stayed green. This runs before the build so it cannot happen twice.
 *
 * Type exports are fine — they are erased before any of this reaches runtime.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else if (/\.(ts|tsx)$/.test(entry)) files.push(path);
  }
  return files;
}

const offenders = [];

for (const file of walk(ROOT)) {
  const source = readFileSync(file, "utf8");

  // The directive has to be the first statement to apply to the module.
  if (!/^\s*["']use server["']/.test(source)) continue;

  source.split("\n").forEach((line, index) => {
    // `export type`, `export interface` and `export type { … }` are erased.
    if (/^export\s+(type|interface)\b/.test(line)) return;
    if (/^export\s+async\s+function\b/.test(line)) return;

    const match = line.match(/^export\s+(const|let|var|class|function)\b/);
    if (!match) return;

    offenders.push({
      file,
      line: index + 1,
      kind: match[1],
      text: line.trim(),
    });
  });
}

if (offenders.length > 0) {
  console.error('\nA "use server" file may only export async functions.\n');
  for (const offender of offenders) {
    console.error(`  ${offender.file}:${offender.line}`);
    console.error(`    ${offender.text}`);
  }
  console.error(
    "\nMove these into a module without the directive. Exporting them here " +
      "throws at load time in production, and the build will not tell you.\n",
  );
  process.exit(1);
}

console.log('✓ "use server" files export only async functions');
