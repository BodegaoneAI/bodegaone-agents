/**
 * tests/unit/palette.test.ts
 * Unit tests for color-theory palette generation and HSL conversion.
 */
import { describe, it, expect } from "vitest";
import { rgbToHsl, hslToHex, generatePalette, type Harmony } from "../../mcp/lib/palette.js";

describe("HSL conversion", () => {
  it("converts primary colors correctly", () => {
    expect(hslToHex(0, 100, 50)).toBe("#ff0000");
    expect(hslToHex(120, 100, 50)).toBe("#00ff00");
    expect(hslToHex(240, 100, 50)).toBe("#0000ff");
    expect(hslToHex(0, 0, 100)).toBe("#ffffff");
    expect(hslToHex(0, 0, 0)).toBe("#000000");
  });

  it("rgbToHsl matches known values", () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBeCloseTo(100, 0);
    expect(l).toBeCloseTo(50, 0);
  });

  it("round-trips a hue through hsl and back", () => {
    const hex = hslToHex(210, 80, 45);
    const [r, g, b] = [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const [h] = rgbToHsl(r, g, b);
    expect(h).toBeCloseTo(210, -1); // within ~10 degrees after rounding
  });
});

describe("generatePalette", () => {
  const harmonies: { h: Harmony; accents: number }[] = [
    { h: "complementary", accents: 1 },
    { h: "analogous", accents: 2 },
    { h: "triadic", accents: 2 },
    { h: "split-complementary", accents: 2 },
    { h: "tetradic", accents: 3 },
    { h: "monochromatic", accents: 2 },
  ];

  for (const { h, accents } of harmonies) {
    it(`produces the right number of accents for ${h}`, () => {
      const p = generatePalette("#2563eb", h);
      expect(p.accents).toHaveLength(accents);
    });
  }

  it("returns a 10-step neutral ramp and 4 semantic colors", () => {
    const p = generatePalette("#2563eb", "triadic");
    expect(p.neutrals).toHaveLength(10);
    expect(p.semantic).toHaveLength(4);
    expect(p.semantic.map((s) => s.name)).toEqual(["success", "warning", "error", "info"]);
  });

  it("guarantees brand and accents carry text at WCAG AA", () => {
    for (const h of harmonies.map((x) => x.h)) {
      const p = generatePalette("#7c3aed", h);
      expect(p.brand.textContrast).toBeGreaterThanOrEqual(4.5);
      for (const a of p.accents) expect(a.textContrast).toBeGreaterThanOrEqual(4.5);
      for (const s of p.semantic) expect(s.textContrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("emits CSS variables including the brand and a neutral", () => {
    const p = generatePalette("#0ea5e9", "analogous");
    expect(p.cssVariables).toContain("--color-brand:");
    expect(p.cssVariables).toContain("--color-neutral-50:");
    expect(p.cssVariables).toContain("--color-success:");
  });

  it("falls back gracefully for an invalid base color", () => {
    const p = generatePalette("not-a-color", "complementary");
    expect(p.flags.some((f) => f.toLowerCase().includes("valid"))).toBe(true);
    expect(p.brand.hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});
