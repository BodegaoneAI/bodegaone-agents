#!/usr/bin/env node
/**
 * hooks/inject-skill.mjs
 *
 * PreToolUse hook for Claude Code.
 * Fires on Read | Edit | Write tool calls.
 * Matches the target file path against each skill's pattern list.
 * If a match is found, writes the skill's SKILL.md content to stdout —
 * Claude Code surfaces this as additionalContext before the tool runs.
 *
 * Input  (stdin): JSON — { tool_name, tool_input: { file_path, ... }, session_id }
 * Output (stdout): plain text injected as context (empty = no injection)
 * Exit code: always 0 (never block the tool call)
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

// ── Skill registry ─────────────────────────────────────────────────────────
// Add new skills here as agents are added to the repo.

const SKILLS = [
  {
    name: "seo-geo",
    patterns: [
      /robots\.txt$/i,
      /sitemap\.(ts|tsx|js|mjs|xml)$/i,
      /[/\\]seo[/\\]/i,          // any file inside an /seo/ directory
      /seo[.\-_]/i,               // seo-utils.ts, seo_helper.ts
      /[.\-_]seo\./i,             // utils.seo.ts
      /schema/i,                  // schema.ts, JsonSchema.tsx
      /metadata/i,                // metadata.ts, generateMetadata.ts
      /[/\\]blog[/\\]/i,          // /blog/ pages
      /JsonLd/i,                  // JsonLd.tsx component
      /structured[\-_]?data/i,    // structured-data.ts
      /layout\.tsx$/i,            // layout.tsx (global metadata often lives here)
      /opengraph/i,               // opengraph-image.tsx
    ],
    file: join(REPO_ROOT, "skills", "seo-geo", "SKILL.md"),
  },
  // Future agents:
  // { name: "content", patterns: [...], file: join(REPO_ROOT, "skills", "content", "SKILL.md") },
  // { name: "planner", patterns: [...], file: join(REPO_ROOT, "skills", "planner", "SKILL.md") },
];

// ── Session-level deduplication ────────────────────────────────────────────
// Track which skills have been injected this session so we don't repeat them.
// Claude Code sets CLAUDE_SESSION_ID in the environment.

import { mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";

function getInjectedSet(sessionId) {
  const path = join(tmpdir(), `bodegaone-hook-${sessionId}.json`);
  try {
    return new Set(JSON.parse(readFileSync(path, "utf-8")));
  } catch {
    return new Set();
  }
}

function markInjected(sessionId, skillName) {
  const path = join(tmpdir(), `bodegaone-hook-${sessionId}.json`);
  try {
    const existing = getInjectedSet(sessionId);
    existing.add(skillName);
    writeFileSync(path, JSON.stringify([...existing]), "utf-8");
  } catch {
    // Non-fatal — dedup will just re-inject on failure
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

let raw = "";
try {
  for await (const chunk of process.stdin) {
    raw += chunk;
  }
} catch {
  process.exit(0);
}

if (!raw.trim()) process.exit(0);

let toolInput = {};
let sessionId = process.env.CLAUDE_SESSION_ID ?? "default";

try {
  const parsed = JSON.parse(raw);
  toolInput = parsed.tool_input ?? {};
  if (parsed.session_id) sessionId = parsed.session_id;
} catch {
  process.exit(0);
}

// Extract the file path — Claude Code passes it as file_path for Read/Edit/Write
const filePath =
  toolInput.file_path ??
  toolInput.path ??
  "";

if (!filePath) process.exit(0);

// ── Match and inject ───────────────────────────────────────────────────────

const alreadyInjected = getInjectedSet(sessionId);

for (const skill of SKILLS) {
  // Skip if already injected this session
  if (alreadyInjected.has(skill.name)) continue;

  const matches = skill.patterns.some((pat) => pat.test(filePath));
  if (!matches) continue;

  if (!existsSync(skill.file)) continue;

  const content = readFileSync(skill.file, "utf-8");
  process.stdout.write(content);
  markInjected(sessionId, skill.name);
  break; // One skill per hook invocation keeps context tight
}

process.exit(0);
