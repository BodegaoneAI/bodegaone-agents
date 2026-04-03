/**
 * tests/unit/grading.test.ts
 * Tests for the scorecard grading logic — every branch covered.
 * These are pure functions with no I/O so there's no excuse for < 100% coverage.
 */
import { describe, it, expect } from "vitest";
import { categoryGrade, overallGrade } from "../../mcp/lib/grading.js";
import type { ScorecardItem, Category } from "../../mcp/lib/grading.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function items(...statuses: Array<"pass" | "warn" | "fail">): ScorecardItem[] {
  return statuses.map((status, i) => ({ label: `Check ${i + 1}`, status }));
}

function cat(
  name: Category["name"],
  ...statuses: Array<"pass" | "warn" | "fail">
): Category {
  return { name, items: items(...statuses) };
}

// ── categoryGrade ─────────────────────────────────────────────────────────────

describe("categoryGrade", () => {
  it("returns PASS when all items pass", () => {
    expect(categoryGrade(items("pass", "pass", "pass"))).toBe("PASS");
  });

  it("returns PASS with 0 fails and exactly 1 warn", () => {
    expect(categoryGrade(items("pass", "warn", "pass"))).toBe("PASS");
  });

  it("returns WARN with 0 fails and exactly 2 warns", () => {
    expect(categoryGrade(items("warn", "warn", "pass"))).toBe("WARN");
  });

  it("returns WARN with 0 fails and 3+ warns", () => {
    expect(categoryGrade(items("warn", "warn", "warn"))).toBe("WARN");
  });

  it("returns WARN with exactly 1 fail and 0 warns", () => {
    expect(categoryGrade(items("fail", "pass", "pass"))).toBe("WARN");
  });

  it("returns WARN with exactly 1 fail and 1 warn", () => {
    expect(categoryGrade(items("fail", "warn", "pass"))).toBe("WARN");
  });

  it("returns FAIL with exactly 2 fails", () => {
    expect(categoryGrade(items("fail", "fail", "pass"))).toBe("FAIL");
  });

  it("returns FAIL with 3+ fails", () => {
    expect(categoryGrade(items("fail", "fail", "fail"))).toBe("FAIL");
  });

  it("returns FAIL with 2 fails and warns present", () => {
    expect(categoryGrade(items("fail", "fail", "warn"))).toBe("FAIL");
  });

  it("handles a single pass item", () => {
    expect(categoryGrade(items("pass"))).toBe("PASS");
  });

  it("handles a single fail item", () => {
    expect(categoryGrade(items("fail"))).toBe("WARN");
  });

  it("handles a single warn item", () => {
    expect(categoryGrade(items("warn"))).toBe("PASS");
  });
});

// ── overallGrade ──────────────────────────────────────────────────────────────

describe("overallGrade", () => {
  it("returns PASS when all categories pass", () => {
    const categories: Category[] = [
      cat("Technical SEO", "pass", "pass"),
      cat("Metadata", "pass", "pass"),
    ];
    expect(overallGrade(categories)).toBe("PASS");
  });

  it("returns WARN when at least one category grades WARN", () => {
    const categories: Category[] = [
      cat("Technical SEO", "pass", "pass"),
      cat("Metadata", "warn", "warn"), // → WARN
    ];
    expect(overallGrade(categories)).toBe("WARN");
  });

  it("returns FAIL when at least one category grades FAIL", () => {
    const categories: Category[] = [
      cat("Technical SEO", "pass", "pass"),
      cat("Metadata", "fail", "fail"), // → FAIL
    ];
    expect(overallGrade(categories)).toBe("FAIL");
  });

  it("returns FAIL when mix of WARN and FAIL categories (FAIL wins)", () => {
    const categories: Category[] = [
      cat("Technical SEO", "warn", "warn"),  // → WARN
      cat("Metadata", "fail", "fail"),        // → FAIL
      cat("GEO Readiness", "pass", "pass"),   // → PASS
    ];
    expect(overallGrade(categories)).toBe("FAIL");
  });

  it("returns WARN not FAIL when category has 1 fail (category = WARN)", () => {
    const categories: Category[] = [
      cat("Technical SEO", "fail", "pass", "pass"), // 1 fail → category WARN
      cat("Metadata", "pass", "pass"),
    ];
    // Overall should be WARN, not FAIL
    expect(overallGrade(categories)).toBe("WARN");
  });

  it("handles a single all-pass category", () => {
    expect(overallGrade([cat("Technical SEO", "pass")])).toBe("PASS");
  });

  it("handles all 8 categories with no issues", () => {
    const allPass: Category[] = [
      cat("Technical SEO", "pass"),
      cat("Metadata", "pass"),
      cat("Schema & Structured Data", "pass"),
      cat("Content & E-E-A-T", "pass"),
      cat("Core Web Vitals", "pass"),
      cat("GEO Readiness", "pass"),
      cat("Internal Linking", "pass"),
      cat("Page Experience", "pass"),
    ];
    expect(overallGrade(allPass)).toBe("PASS");
  });
});
