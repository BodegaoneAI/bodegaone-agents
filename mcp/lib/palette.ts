/**
 * mcp/lib/palette.ts
 * Color-theory palette generation for the Designer agent.
 * Converts a base color to HSL, derives a harmony (complementary, analogous, triadic,
 * split-complementary, tetradic, monochromatic), tunes each accent's lightness so white
 * text meets WCAG AA on it, builds a neutral ramp and accessible semantic colors, and
 * emits CSS variables. Contrast is computed with the shared design-lint helpers.
 *
 * Exported here so it can be unit-tested independently of the MCP tool layer.
 */
import { parseHex, contrastRatio } from "./design-lint.js";

export type Harmony =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic"
  | "monochromatic";

export interface Swatch {
  name: string;
  hex: string;
  role: string;
  /** Recommended text color to place on this swatch ("#ffffff" or "#111111"). */
  onColor: string;
  /** Contrast ratio of onColor text on this swatch. */
  textContrast: number;
}

export interface PaletteResult {
  base: string;
  harmony: Harmony;
  brand: Swatch;
  accents: Swatch[];
  neutrals: Swatch[];
  semantic: Swatch[];
  cssVariables: string;
  flags: string[];
}

// ── HSL conversion ────────────────────────────────────────────────────────────

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const WHITE = "#ffffff";
const NEAR_BLACK = "#111111";

/** Pick the on-color text (white or near-black) with the higher contrast, and its ratio. */
function bestOnColor(hex: string): { onColor: string; textContrast: number } {
  const white = contrastRatio(WHITE, hex) ?? 1;
  const dark = contrastRatio(NEAR_BLACK, hex) ?? 1;
  return white >= dark
    ? { onColor: WHITE, textContrast: Math.round(white * 100) / 100 }
    : { onColor: NEAR_BLACK, textContrast: Math.round(dark * 100) / 100 };
}

/**
 * Produce an accent/action color at the given hue that supports readable text.
 * Darkens (lowers lightness) until white text reaches WCAG AA (4.5:1), so the color
 * works as a button/badge with white text. Falls back to the darkest step if needed.
 */
function accessibleAccent(h: number, s: number): string {
  const sat = Math.max(35, Math.min(90, s)); // keep accents reasonably saturated
  for (let l = 55; l >= 25; l -= 2) {
    const hex = hslToHex(h, sat, l);
    if ((contrastRatio(WHITE, hex) ?? 0) >= 4.5) return hex;
  }
  return hslToHex(h, sat, 25);
}

function harmonyHues(h: number, harmony: Harmony): number[] {
  switch (harmony) {
    case "complementary":
      return [h + 180];
    case "analogous":
      return [h - 30, h + 30];
    case "triadic":
      return [h + 120, h + 240];
    case "split-complementary":
      return [h + 150, h + 210];
    case "tetradic":
      return [h + 90, h + 180, h + 270];
    case "monochromatic":
      return [];
    default:
      return [h + 180];
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function generatePalette(baseHex: string, harmony: Harmony = "complementary"): PaletteResult {
  const flags: string[] = [];
  const rgb = parseHex(baseHex);
  if (!rgb) {
    // Fall back to a safe blue so the tool still returns something useful.
    flags.push(`"${baseHex}" is not a valid hex color; using #2563eb as the base.`);
    baseHex = "#2563eb";
  }
  const [h, s] = rgbToHsl(...(parseHex(baseHex) as [number, number, number]));

  // Brand / primary action color, tuned for white-text accessibility.
  const brandHex = accessibleAccent(h, Math.max(s, 45));
  const brand: Swatch = { name: "brand", hex: brandHex, role: "Primary action / brand", ...bestOnColor(brandHex) };

  // Accents from the harmony (or monochromatic variations of the base hue).
  const accents: Swatch[] = [];
  if (harmony === "monochromatic") {
    const a1 = accessibleAccent(h, Math.max(s, 45));
    const a2 = hslToHex(h, Math.max(s, 45), 24);
    accents.push({ name: "accent", hex: a1, role: "Accent (mono)", ...bestOnColor(a1) });
    accents.push({ name: "accent-strong", hex: a2, role: "Accent, deep (mono)", ...bestOnColor(a2) });
  } else {
    harmonyHues(h, harmony).forEach((hue, i) => {
      const hex = accessibleAccent(hue, Math.max(s, 45));
      accents.push({ name: `accent-${i + 1}`, hex, role: "Accent / secondary action", ...bestOnColor(hex) });
    });
  }

  // Neutral ramp: base hue at very low saturation, from near-white to near-black.
  const neutralSteps: { token: string; l: number; role: string }[] = [
    { token: "neutral-50", l: 98, role: "App background" },
    { token: "neutral-100", l: 96, role: "Surface / card" },
    { token: "neutral-200", l: 90, role: "Subtle border" },
    { token: "neutral-300", l: 82, role: "Border" },
    { token: "neutral-400", l: 66, role: "Disabled text (large only)" },
    { token: "neutral-500", l: 52, role: "Muted text" },
    { token: "neutral-600", l: 42, role: "Secondary text" },
    { token: "neutral-700", l: 32, role: "Body text" },
    { token: "neutral-800", l: 22, role: "Strong text" },
    { token: "neutral-900", l: 14, role: "Headings / dark surface" },
  ];
  const neutralSat = Math.min(10, s / 4);
  const neutrals: Swatch[] = neutralSteps.map((step) => {
    const hex = hslToHex(h, neutralSat, step.l);
    return { name: step.token, hex, role: step.role, ...bestOnColor(hex) };
  });

  // Verify body text on the app background is readable.
  const bodyOnBg = contrastRatio(hslToHex(h, neutralSat, 32), hslToHex(h, neutralSat, 98));
  if ((bodyOnBg ?? 0) < 4.5) flags.push("Body text on the app background is below AA; deepen neutral-700 or lighten neutral-50.");

  // Semantic colors at accessible action lightness (white text passes).
  const semanticDefs: { name: string; hue: number; role: string }[] = [
    { name: "success", hue: 145, role: "Success" },
    { name: "warning", hue: 38, role: "Warning" },
    { name: "error", hue: 4, role: "Error / destructive" },
    { name: "info", hue: 210, role: "Info" },
  ];
  const semantic: Swatch[] = semanticDefs.map((d) => {
    const hex = accessibleAccent(d.hue, 65);
    return { name: d.name, hex, role: d.role, ...bestOnColor(hex) };
  });

  // CSS variables.
  const all: Swatch[] = [brand, ...accents, ...neutrals, ...semantic];
  const cssVariables =
    ":root {\n" + all.map((sw) => `  --color-${sw.name}: ${sw.hex};`).join("\n") + "\n}";

  return { base: baseHex, harmony, brand, accents, neutrals, semantic, cssVariables, flags };
}
