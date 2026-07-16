/**
 * tests/unit/design-lint.test.ts
 * Unit tests for the pure WCAG contrast logic.
 */
import { describe, it, expect } from "vitest";
import { parseHex, contrastRatio, lintDesign } from "../../mcp/lib/design-lint.js";

describe("parseHex", () => {
  it("parses 6-digit hex with and without #", () => {
    expect(parseHex("#ffffff")).toEqual([255, 255, 255]);
    expect(parseHex("000000")).toEqual([0, 0, 0]);
  });
  it("expands 3-digit shorthand", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("#123")).toEqual([0x11, 0x22, 0x33]);
  });
  it("returns null for invalid input", () => {
    expect(parseHex("nope")).toBeNull();
    expect(parseHex("#12")).toBeNull();
    expect(parseHex("#12345g")).toBeNull();
  });
});

describe("contrastRatio", () => {
  it("computes 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
  it("is symmetric", () => {
    const a = contrastRatio("#000", "#fff");
    const b = contrastRatio("#fff", "#000");
    expect(a).toBeCloseTo(b as number, 5);
  });
  it("computes ~4.54 for #767676 on white (the classic AA-boundary gray)", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
  });
  it("returns null for an invalid color", () => {
    expect(contrastRatio("#zzz", "#fff")).toBeNull();
  });
});

describe("lintDesign", () => {
  it("passes black text on white (AAA)", () => {
    const r = lintDesign({ colors: [{ foreground: "#000", background: "#fff" }] });
    expect(r.pairs[0].status).toBe("pass");
    expect(r.pairs[0].verdict).toContain("AAA");
  });

  it("fails light gray on white", () => {
    const r = lintDesign({ colors: [{ label: "muted", foreground: "#aaaaaa", background: "#ffffff" }] });
    expect(r.pairs[0].status).toBe("fail");
    expect(r.flags.some((f) => f.includes("muted"))).toBe(true);
  });

  it("warns for a mid-gray that only passes large text", () => {
    const normal = lintDesign({ colors: [{ foreground: "#8a8a8a", background: "#ffffff" }] });
    expect(normal.pairs[0].status).toBe("warn");
    const large = lintDesign({ colors: [{ foreground: "#8a8a8a", background: "#ffffff", largeText: true }] });
    expect(large.pairs[0].status).toBe("pass");
  });

  it("flags an invalid color as fail", () => {
    const r = lintDesign({ colors: [{ foreground: "#nothex", background: "#fff" }] });
    expect(r.pairs[0].status).toBe("fail");
    expect(r.flags.some((f) => f.toLowerCase().includes("invalid"))).toBe(true);
  });
});
