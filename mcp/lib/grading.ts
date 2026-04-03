/**
 * mcp/lib/grading.ts
 * Pure grading functions for the SEO/GEO scorecard.
 * Exported here so they can be unit-tested independently of the MCP tool layer.
 */
import { z } from "zod";

// ── Schemas (re-exported for convenience) ─────────────────────────────────────

export const ItemStatus = z.enum(["pass", "warn", "fail"]);

export const ScorecardItemSchema = z.object({
  label: z.string(),
  status: ItemStatus,
  note: z.string().optional(),
});

export const CategoryNames = z.enum([
  "Technical SEO",
  "Metadata",
  "Schema & Structured Data",
  "Content & E-E-A-T",
  "Core Web Vitals",
  "GEO Readiness",
  "Internal Linking",
  "Page Experience",
]);

export const CategorySchema = z.object({
  name: CategoryNames,
  items: z.array(ScorecardItemSchema).min(1),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type Grade = "PASS" | "WARN" | "FAIL";
export type ScorecardItem = z.infer<typeof ScorecardItemSchema>;
export type Category = z.infer<typeof CategorySchema>;

// ── Grade logic ───────────────────────────────────────────────────────────────

/**
 * Grade a single category based on its items.
 *
 * Rules:
 *   - 2+ fails → FAIL
 *   - 1 fail   → WARN
 *   - 2+ warns → WARN
 *   - else     → PASS
 */
export function categoryGrade(items: ScorecardItem[]): Grade {
  const fails = items.filter((i) => i.status === "fail").length;
  const warns = items.filter((i) => i.status === "warn").length;
  if (fails >= 2) return "FAIL";
  if (fails === 1) return "WARN";
  if (warns >= 2) return "WARN";
  return "PASS";
}

/**
 * Grade the entire audit — worst category grade wins.
 */
export function overallGrade(categories: Category[]): Grade {
  const grades = categories.map((c) => categoryGrade(c.items));
  if (grades.some((g) => g === "FAIL")) return "FAIL";
  if (grades.some((g) => g === "WARN")) return "WARN";
  return "PASS";
}

export function gradeEmoji(g: Grade): string {
  return g === "PASS" ? "✅ PASS" : g === "WARN" ? "⚠️  WARN" : "❌ FAIL";
}

export function statusIcon(s: "pass" | "warn" | "fail"): string {
  return s === "pass" ? "✅" : s === "warn" ? "⚠️ " : "❌";
}
