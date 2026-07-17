/**
 * tests/unit/ad-lint.test.ts
 * Unit tests for the pure ad-copy linting logic.
 */
import { describe, it, expect } from "vitest";
import { lintAd } from "../../mcp/lib/ad-lint.js";
import { categoryGrade } from "../../mcp/lib/grading.js";

function overall(result: ReturnType<typeof lintAd>) {
  const grades = result.categories.map((c) => categoryGrade(c.items));
  if (grades.includes("FAIL")) return "FAIL";
  if (grades.includes("WARN")) return "WARN";
  return "PASS";
}

function gradeOf(result: ReturnType<typeof lintAd>, categoryName: string) {
  const cat = result.categories.find((c) => c.name === categoryName);
  if (!cat) throw new Error(`category ${categoryName} not found`);
  return categoryGrade(cat.items);
}

function itemStatus(
  result: ReturnType<typeof lintAd>,
  categoryName: string,
  labelIncludes: string
) {
  const cat = result.categories.find((c) => c.name === categoryName);
  if (!cat) throw new Error(`category ${categoryName} not found`);
  const item = cat.items.find((i) => i.label.includes(labelIncludes));
  if (!item) throw new Error(`item "${labelIncludes}" not found in ${categoryName}`);
  return item.status;
}

// A clean, spec-compliant Google RSA set.
const cleanGoogle = {
  platform: "google" as const,
  headlines: [
    "Shop Fresh Groceries",
    "Same-Day Delivery",
    "Order Produce Online",
    "Get $20 Off First Order",
    "Fresh Food, Fair Prices",
  ],
  descriptions: [
    "Order groceries online and get same-day delivery to your door.",
    "Fresh produce and pantry staples, delivered within hours. Fair prices, no membership.",
  ],
  url: "https://bodega.example/order?utm_source=google&utm_medium=cpc&utm_campaign=grocery_launch",
};

// A clean, spec-compliant Meta set.
const cleanMeta = {
  platform: "meta" as const,
  headlines: ["Fresh Groceries, Delivered"],
  descriptions: ["Same-day delivery"],
  primaryText:
    "Order fresh local produce online and get same-day delivery. Save $20 on your first order today.",
  url: "https://bodega.example/shop?utm_source=facebook&utm_medium=paid_social&utm_campaign=grocery_launch",
};

describe("lintAd", () => {
  it("passes a clean Google RSA set", () => {
    const result = lintAd(cleanGoogle);
    expect(overall(result)).toBe("PASS");
    expect(itemStatus(result, "Character Limits", "Headlines ≤")).toBe("pass");
    expect(itemStatus(result, "Ad Policy Compliance", "capitalization")).toBe("pass");
    expect(itemStatus(result, "Tracking (UTM)", "utm_campaign")).toBe("pass");
  });

  it("passes a clean Meta set", () => {
    const result = lintAd(cleanMeta);
    expect(overall(result)).toBe("PASS");
    expect(itemStatus(result, "Character Limits", "Primary text")).toBe("pass");
    expect(itemStatus(result, "Persuasion & CTA", "call-to-action")).toBe("pass");
  });

  it("fails a Google headline over 30 characters", () => {
    const result = lintAd({
      platform: "google",
      headlines: ["This headline is definitely far longer than thirty characters"],
    });
    expect(itemStatus(result, "Character Limits", "Headlines ≤")).toBe("fail");
    expect(result.flags.some((f) => f.includes("over 30"))).toBe(true);
  });

  it("fails a Google description over 90 characters", () => {
    const result = lintAd({
      platform: "google",
      descriptions: [
        "This description is intentionally written to be far too long for the ninety character Google RSA limit.",
      ],
    });
    expect(itemStatus(result, "Character Limits", "Descriptions ≤")).toBe("fail");
    expect(result.flags.some((f) => f.includes("over 90"))).toBe(true);
  });

  it("flags excessive capitalization", () => {
    const result = lintAd({ platform: "google", headlines: ["SHOP OUR AMAZING SALE"] });
    expect(itemStatus(result, "Ad Policy Compliance", "capitalization")).toBe("fail");
    expect(result.flags.some((f) => f.toLowerCase().includes("capitalization"))).toBe(true);
  });

  it("warns on an unverifiable superlative", () => {
    const result = lintAd({ platform: "google", headlines: ["We Are #1 for Fresh Food"] });
    expect(itemStatus(result, "Ad Policy Compliance", "Superlatives")).toBe("warn");
    expect(result.flags.some((f) => f.includes("#1"))).toBe(true);
  });

  it("fails an exclamation mark in a Google headline", () => {
    const result = lintAd({ platform: "google", headlines: ["Buy Fresh Now!"] });
    expect(itemStatus(result, "Ad Policy Compliance", "exclamation")).toBe("fail");
    expect(result.flags.some((f) => f.includes("Exclamation mark"))).toBe(true);
  });

  it("does not flag exclamation marks in Meta headlines", () => {
    const result = lintAd({ platform: "meta", headlines: ["Buy Fresh Now!"] });
    const policy = result.categories.find((c) => c.name === "Ad Policy Compliance")!;
    expect(policy.items.some((i) => i.label.includes("exclamation"))).toBe(false);
  });

  it("flags gimmicky repeated punctuation", () => {
    const result = lintAd({ platform: "meta", headlines: ["Fresh Deals Now!!!"] });
    expect(itemStatus(result, "Ad Policy Compliance", "punctuation")).toBe("fail");
  });

  it("warns per missing UTM parameter", () => {
    const result = lintAd({
      platform: "google",
      headlines: ["Shop Fresh Groceries"],
      url: "https://bodega.example/order?utm_source=google",
    });
    expect(itemStatus(result, "Tracking (UTM)", "utm_medium")).toBe("warn");
    expect(itemStatus(result, "Tracking (UTM)", "utm_campaign")).toBe("warn");
    expect(result.flags.some((f) => f.includes("utm_campaign"))).toBe(true);
  });

  it("notes tracking was not checked when no URL is provided", () => {
    const result = lintAd({ platform: "google", headlines: ["Shop Fresh Groceries"] });
    const tracking = result.categories.find((c) => c.name === "Tracking (UTM)")!;
    expect(tracking.items).toHaveLength(1);
    expect(tracking.items[0].label).toContain("not checked");
  });

  it("warns when the copy has no CTA and no offer", () => {
    const result = lintAd({
      platform: "google",
      headlines: ["Fresh Local Produce", "Quality Groceries Daily"],
    });
    expect(itemStatus(result, "Persuasion & CTA", "call-to-action")).toBe("warn");
    expect(itemStatus(result, "Persuasion & CTA", "number or offer")).toBe("warn");
  });

  it("warns when Meta primary text runs past ~125 characters", () => {
    const result = lintAd({
      platform: "meta",
      primaryText:
        "Order fresh local produce online and get same-day grocery delivery straight to your door, and save twenty dollars on your very first order placed today.",
    });
    expect(itemStatus(result, "Character Limits", "Primary text")).toBe("warn");
    expect(result.flags.some((f) => f.includes("Primary text"))).toBe(true);
  });

  it("fails when a Google ad has more than 15 headlines", () => {
    const result = lintAd({
      platform: "google",
      headlines: Array.from({ length: 16 }, (_, i) => `Fresh Deal ${i + 1}`),
      descriptions: cleanGoogle.descriptions,
    });
    expect(gradeOf(result, "Character Limits")).toBe("FAIL");
    expect(result.flags.some((f) => f.includes("at most 15"))).toBe(true);
  });

  it("fails when a Google ad has fewer than 3 headlines", () => {
    const result = lintAd({
      platform: "google",
      headlines: ["Shop Fresh Groceries", "Same-Day Delivery"],
      descriptions: cleanGoogle.descriptions,
    });
    expect(gradeOf(result, "Character Limits")).toBe("FAIL");
    expect(result.flags.some((f) => f.includes("at least 3"))).toBe(true);
  });

  it("does not hard-fail policy on a single legitimate acronym", () => {
    const result = lintAd({ platform: "meta", headlines: ["HIPAA Compliant Notes"] });
    expect(itemStatus(result, "Ad Policy Compliance", "capitalization")).toBe("warn");
    expect(gradeOf(result, "Ad Policy Compliance")).toBe("PASS");
  });

  it("warns (not silently passes) the char item when Google gets zero headlines", () => {
    const result = lintAd({ platform: "google", descriptions: cleanGoogle.descriptions });
    expect(itemStatus(result, "Character Limits", "Headlines ≤")).toBe("warn");
  });

  it("fails Character Limits when a single headline is over 30 chars", () => {
    const result = lintAd({
      platform: "google",
      headlines: [
        "Shop Fresh Groceries",
        "Same-Day Delivery",
        "This one headline is way over the thirty character limit here",
      ],
      descriptions: cleanGoogle.descriptions,
    });
    expect(itemStatus(result, "Character Limits", "Headlines ≤")).toBe("fail");
    expect(gradeOf(result, "Character Limits")).toBe("FAIL");
  });
});
