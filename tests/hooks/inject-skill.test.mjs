/**
 * tests/hooks/inject-skill.test.mjs
 * Tests the hooks/inject-skill.mjs pattern matching and session deduplication.
 * Spawns the hook as a child process and checks stdout — exactly how Claude Code runs it.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { rmSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../..");
const HOOK = join(REPO_ROOT, "hooks/inject-skill.mjs");

// ── Helper — run the hook with a given tool input via stdin ───────────────────

function runHook(toolInput, sessionId = `test-session-${Date.now()}-${Math.random()}`) {
  const payload = JSON.stringify({
    tool_name: toolInput.tool_name ?? "Read",
    tool_input: toolInput.tool_input ?? {},
    session_id: sessionId,
  });

  const result = spawnSync("node", [HOOK], {
    input: payload,
    encoding: "utf-8",
    env: { ...process.env, CLAUDE_SESSION_ID: sessionId },
    timeout: 5000,
  });

  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? 0,
  };
}

// Clean up dedup files before each test
beforeEach(() => {
  // Clean any leftover dedup files from previous runs
  // (Session IDs are randomized so this is just hygiene)
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("inject-skill.mjs — pattern matching", () => {
  it("injects SKILL.md when file is robots.txt", () => {
    const { stdout, exitCode } = runHook({
      tool_input: { file_path: "/project/public/robots.txt" },
    });
    expect(exitCode).toBe(0);
    expect(stdout.length).toBeGreaterThan(0);
    expect(stdout).toContain("SEO"); // SKILL.md contains "SEO"
  });

  it("injects SKILL.md when file matches sitemap pattern", () => {
    const { stdout } = runHook({
      tool_input: { file_path: "/project/app/sitemap.ts" },
    });
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("injects SKILL.md when file matches metadata pattern", () => {
    const { stdout } = runHook({
      tool_input: { file_path: "/project/app/metadata.ts" },
    });
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("injects SKILL.md when file is inside a /blog/ path", () => {
    const { stdout } = runHook({
      tool_input: { file_path: "/project/app/blog/[slug]/page.tsx" },
    });
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("injects SKILL.md when file contains 'schema' in name", () => {
    const { stdout } = runHook({
      tool_input: { file_path: "/project/components/JsonSchema.tsx" },
    });
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("does NOT inject for unrelated files", () => {
    const { stdout } = runHook({
      tool_input: { file_path: "/project/components/Button.tsx" },
    });
    expect(stdout).toBe("");
  });

  it("does NOT inject for package.json", () => {
    const { stdout } = runHook({
      tool_input: { file_path: "/project/package.json" },
    });
    expect(stdout).toBe("");
  });

  it("does NOT inject for tsconfig.json", () => {
    const { stdout } = runHook({
      tool_input: { file_path: "/project/tsconfig.json" },
    });
    expect(stdout).toBe("");
  });

  it("exits 0 with empty stdout for empty stdin", () => {
    const result = spawnSync("node", [HOOK], {
      input: "",
      encoding: "utf-8",
      timeout: 3000,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("exits 0 with empty stdout for invalid JSON stdin", () => {
    const result = spawnSync("node", [HOOK], {
      input: "not valid json {{{",
      encoding: "utf-8",
      timeout: 3000,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("exits 0 with empty stdout when tool_input has no file_path", () => {
    const { stdout, exitCode } = runHook({
      tool_input: {},
    });
    expect(exitCode).toBe(0);
    expect(stdout).toBe("");
  });
});

describe("inject-skill.mjs — session deduplication", () => {
  it("injects on first call for a session", () => {
    const sessionId = `dedup-test-${Date.now()}`;
    const { stdout } = runHook(
      { tool_input: { file_path: "/project/robots.txt" } },
      sessionId
    );
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("does NOT inject on second call for the same session + skill", () => {
    const sessionId = `dedup-same-${Date.now()}`;

    // First call — should inject
    const first = runHook(
      { tool_input: { file_path: "/project/robots.txt" } },
      sessionId
    );
    expect(first.stdout.length).toBeGreaterThan(0);

    // Second call — same session, same skill → should be empty
    const second = runHook(
      { tool_input: { file_path: "/project/sitemap.ts" } }, // Different file, same skill
      sessionId
    );
    expect(second.stdout).toBe("");
  });

  it("injects again for a different session ID", () => {
    const session1 = `dedup-s1-${Date.now()}`;
    const session2 = `dedup-s2-${Date.now()}`;

    const first = runHook(
      { tool_input: { file_path: "/project/robots.txt" } },
      session1
    );

    const second = runHook(
      { tool_input: { file_path: "/project/robots.txt" } },
      session2
    );

    // Both should inject since they're different sessions
    expect(first.stdout.length).toBeGreaterThan(0);
    expect(second.stdout.length).toBeGreaterThan(0);
  });
});
