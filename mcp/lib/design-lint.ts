/**
 * mcp/lib/design-lint.ts
 * Pure WCAG color-contrast logic for the Designer agent.
 * Parses hex colors, computes relative luminance and contrast ratio per the WCAG 2.x
 * definition, and grades each foreground/background pair against AA/AAA for normal and
 * large text. Returns pass/warn/fail items (graded with the shared grading.ts engine).
 *
 * Exported here so it can be unit-tested independently of the MCP tool layer.
 */
import type { ScorecardItem } from "./grading.js";

export interface ColorPair {
  label?: string;
  foreground: string;
  background: string;
  /** True for text >= 18pt, or >= 14pt bold (WCAG "large text"). */
  largeText?: boolean;
}

export interface DesignLintInput {
  colors: ColorPair[];
}

export interface PairResult {
  label: string;
  foreground: string;
  background: string;
  largeText: boolean;
  ratio: number | null;
  verdict: string;
  status: "pass" | "warn" | "fail";
}

export interface DesignLintResult {
  categories: { name: string; items: ScorecardItem[] }[];
  flags: string[];
  pairs: PairResult[];
}

// ── Color math ────────────────────────────────────────────────────────────────

/** Parse #RGB, #RRGGBB (with or without the #) to [r, g, b] 0-255, or null if invalid. */
export function parseHex(input: string): [number, number, number] | null {
  if (typeof input !== "string") return null;
  let hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** WCAG relative luminance of an sRGB color. */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = [r, g, b].map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG contrast ratio between two colors (1 to 21), or null if either is invalid. */
export function contrastRatio(fg: string, bg: string): number | null {
  const a = parseHex(fg);
  const b = parseHex(bg);
  if (!a || !b) return null;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function lintDesign(input: DesignLintInput): DesignLintResult {
  const flags: string[] = [];
  const pairs: PairResult[] = [];
  const items: ScorecardItem[] = [];

  input.colors.forEach((pair, i) => {
    const label = pair.label || `${pair.foreground} on ${pair.background}`;
    const largeText = !!pair.largeText;
    const ratio = contrastRatio(pair.foreground, pair.background);

    if (ratio === null) {
      const note = "invalid hex color";
      flags.push(`"${label}": ${note} (foreground "${pair.foreground}", background "${pair.background}").`);
      pairs.push({ label, foreground: pair.foreground, background: pair.background, largeText, ratio: null, verdict: note, status: "fail" });
      items.push({ label, status: "fail", note });
      return;
    }

    const rounded = Math.round(ratio * 100) / 100;
    const aa = largeText ? 3.0 : 4.5;
    const aaa = largeText ? 4.5 : 7.0;

    let status: "pass" | "warn" | "fail";
    let verdict: string;
    if (ratio >= aaa) {
      status = "pass";
      verdict = `${rounded}:1 — passes AAA`;
    } else if (ratio >= aa) {
      status = "pass";
      verdict = `${rounded}:1 — passes AA`;
    } else if (!largeText && ratio >= 3.0) {
      status = "warn";
      verdict = `${rounded}:1 — passes AA for large text only, fails AA for normal text`;
      flags.push(`"${label}" is ${rounded}:1. Fine for large/bold text, but darken it to reach 4.5:1 for body text.`);
    } else {
      status = "fail";
      verdict = `${rounded}:1 — fails WCAG AA (needs ${aa}:1)`;
      flags.push(`"${label}" is ${rounded}:1, below the ${aa}:1 minimum. Darken the foreground or lighten the background.`);
    }

    pairs.push({ label, foreground: pair.foreground, background: pair.background, largeText, ratio: rounded, verdict, status });
    items.push({ label: `${label}${largeText ? " (large)" : ""}`, status, note: verdict });
  });

  return {
    categories: [{ name: "Color Contrast (WCAG)", items }],
    flags,
    pairs,
  };
}
