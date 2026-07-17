/**
 * tests/unit/email-lint.test.ts
 * Unit tests for the pure email-linting logic.
 */
import { describe, it, expect } from "vitest";
import { lintEmail } from "../../mcp/lib/email-lint.js";
import { categoryGrade } from "../../mcp/lib/grading.js";

function grade(result: ReturnType<typeof lintEmail>, categoryName: string) {
  const cat = result.categories.find((c) => c.name === categoryName);
  if (!cat) throw new Error(`category ${categoryName} not found`);
  return categoryGrade(cat.items);
}

function category(result: ReturnType<typeof lintEmail>, categoryName: string) {
  const cat = result.categories.find((c) => c.name === categoryName);
  if (!cat) throw new Error(`category ${categoryName} not found`);
  return cat;
}

// A clean, spec-compliant marketing email: short subject, sized preheader,
// descriptive links, unsubscribe, and a physical address.
const goodBody = `Hi there,

Our July menu just went live. This month we added three lunch specials, a
lighter single-origin roast, and new weekend hours so you can stop by later on
Saturday and Sunday.

[Browse the July menu](https://bodegaone.example/menu) and tell us which special
you want us to keep on the board next month.

Thanks for reading,
The BodegaOne team

123 Market Street, Suite 400, San Francisco, CA 94103
[Unsubscribe](https://bodegaone.example/unsubscribe) from these updates anytime.
`;

describe("lintEmail", () => {
  it("passes a clean, spec-compliant marketing email", () => {
    const result = lintEmail({
      body: goodBody,
      subject: "Your July menu is live",
      preheader: "Three new specials, a lighter roast, and weekend hours for July.",
      listType: "marketing",
    });

    expect(grade(result, "Subject line")).toBe("PASS");
    expect(grade(result, "Preview text")).toBe("PASS");
    expect(grade(result, "Spam triggers")).toBe("PASS");
    expect(grade(result, "Compliance")).toBe("PASS");
    expect(grade(result, "Links & Structure")).toBe("PASS");
  });

  it("always returns the four deliverability advisories", () => {
    const result = lintEmail({ body: "Hello, this is a short note.", listType: "transactional" });
    expect(result.advisories).toHaveLength(4);
    expect(result.advisories.some((a) => /SPF, DKIM, and DMARC/.test(a))).toBe(true);
    expect(result.advisories.some((a) => /RFC 8058/.test(a))).toBe(true);
  });

  it("exempts transactional email from the unsubscribe requirement", () => {
    const result = lintEmail({
      body: "Your order #1024 shipped and is on its way. Track it at https://bodegaone.example/track.",
      subject: "Your order shipped",
      listType: "transactional",
    });
    expect(grade(result, "Compliance")).toBe("PASS");
    const compliance = category(result, "Compliance");
    expect(compliance.items.some((i) => i.label.includes("Transactional"))).toBe(true);
  });

  it("passes compliance for a transactional email missing both unsubscribe and address", () => {
    const result = lintEmail({
      body: "Your password was reset. If this wasn't you, contact support.",
      subject: "Password reset",
      listType: "transactional",
    });
    expect(grade(result, "Compliance")).toBe("PASS");
  });

  it("fails Compliance (critical) when a marketing email has no unsubscribe", () => {
    const result = lintEmail({
      // Has a valid postal address, so only the unsubscribe item fails —
      // proving a single critical fail sinks the whole category.
      body: "Come check out our new menu this weekend at 1 Main Street, Austin, TX 78701.",
      subject: "New menu",
      listType: "marketing",
    });
    expect(grade(result, "Compliance")).toBe("FAIL");
    const compliance = category(result, "Compliance");
    const unsub = compliance.items.find((i) => i.label.includes("Unsubscribe"))!;
    expect(unsub.status).toBe("fail");
    expect(unsub.critical).toBe(true);
    expect(result.flags.some((f) => f.includes("No unsubscribe option"))).toBe(true);
  });

  it("fails Compliance when a marketing email has no physical address", () => {
    const result = lintEmail({
      body: "Read our update and [unsubscribe](https://x.example/u) anytime.",
      subject: "An update",
      listType: "marketing",
    });
    expect(grade(result, "Compliance")).toBe("FAIL");
    const compliance = category(result, "Compliance");
    const addr = compliance.items.find((i) => i.label.includes("postal address"))!;
    expect(addr.status).toBe("fail");
    expect(addr.critical).toBe(true);
  });

  it("warns when the subject is missing", () => {
    const result = lintEmail({ body: "Some body text here." });
    const subj = category(result, "Subject line");
    expect(subj.items[0].status).toBe("warn");
  });

  it("fails on an empty subject", () => {
    const result = lintEmail({ body: "Some body text here.", subject: "   " });
    const subj = category(result, "Subject line");
    expect(subj.items[0].status).toBe("fail");
    expect(result.flags.some((f) => f.includes("Subject line is empty"))).toBe(true);
  });

  it("warns on an overlong subject, and the flag fires on the same condition", () => {
    const long = "This subject line is deliberately far too long to fit inside any mobile inbox preview";
    const result = lintEmail({ body: "Body.", subject: long });
    const subj = category(result, "Subject line");
    const lenItem = subj.items.find((i) => i.label.includes("length"))!;
    expect(lenItem.status).toBe("warn");
    expect(result.flags.some((f) => f.includes("truncate on mobile"))).toBe(true);
  });

  it("passes a 41–60 char subject (aim ≤40 is a note, not a warn)", () => {
    const mid = "A perfectly reasonable subject line of fifty-two ch"; // 51 chars
    const result = lintEmail({ body: "Body.", subject: mid });
    const subj = category(result, "Subject line");
    const lenItem = subj.items.find((i) => i.label.includes("length"))!;
    expect(lenItem.status).toBe("pass");
    expect(result.flags.some((f) => f.includes("truncate on mobile"))).toBe(false);
  });

  it("warns on ALL-CAPS and excessive punctuation in the subject", () => {
    const result = lintEmail({ body: "Body.", subject: "FLASH SALE now!!!" });
    const subj = category(result, "Subject line");
    const caps = subj.items.find((i) => i.label.includes("ALL-CAPS"))!;
    const punct = subj.items.find((i) => i.label.includes("punctuation"))!;
    expect(caps.status).toBe("warn");
    expect(punct.status).toBe("warn");
  });

  it("warns when the preheader is missing", () => {
    const result = lintEmail({ body: "Body.", subject: "Hi" });
    const preview = category(result, "Preview text");
    expect(preview.items[0].status).toBe("warn");
  });

  it("scans the preheader for spam triggers and ALL-CAPS", () => {
    const result = lintEmail({
      body: "Hi, here is the news. 1 Main Street, Austin, TX 78701 unsubscribe",
      subject: "News",
      preheader: "URGENT: you are a winner",
    });
    // The trigger words live only in the preheader, so finding them proves it is scanned.
    expect(result.flags.some((f) => f.includes('"winner"'))).toBe(true);
    const spam = category(result, "Spam triggers");
    const caps = spam.items.find((i) => i.label.includes("ALL-CAPS"))!;
    expect(caps.status).not.toBe("pass");
  });

  it("fails on many spam-trigger words", () => {
    const result = lintEmail({
      body: "Congratulations, you are a winner. Buy now for 100% free cash, guaranteed. This is not spam.",
      subject: "Act now",
      listType: "marketing",
    });
    const spam = category(result, "Spam triggers");
    const triggers = spam.items.find((i) => i.label.includes("spam-trigger"))!;
    expect(triggers.status).toBe("fail");
    expect(result.flags.some((f) => f.includes("winner"))).toBe(true);
  });

  it('does NOT fail spam for innocent "feel free to reply" copy', () => {
    const result = lintEmail({
      body: "Feel free to reply to this email anytime with questions.",
      subject: "A quick note",
      listType: "marketing",
    });
    const spam = category(result, "Spam triggers");
    const triggers = spam.items.find((i) => i.label.includes("spam-trigger"))!;
    expect(triggers.status).toBe("pass");
    expect(grade(result, "Spam triggers")).not.toBe("FAIL");
    expect(result.flags.some((f) => f.includes("Spam-trigger"))).toBe(false);
  });

  it('counts "risk-free" once, even next to "feel free"', () => {
    const result = lintEmail({
      body: "Our risk-free trial is here, so feel free to reply with questions.",
      subject: "Trial",
      listType: "marketing",
    });
    const spamFlags = result.flags.filter((f) => f.includes("Spam-trigger"));
    expect(spamFlags).toHaveLength(1);
    expect(spamFlags[0]).toContain('"risk-free" (1×)');
    expect(grade(result, "Spam triggers")).not.toBe("FAIL"); // one hit → warn, not fail
  });

  it("flags ALL-CAPS shouting and runs of symbols in the body", () => {
    const result = lintEmail({
      body: "LIMITED SUPPLY REMAINING $$$ order today.",
      subject: "Sale",
      listType: "transactional",
    });
    const spam = category(result, "Spam triggers");
    const caps = spam.items.find((i) => i.label.includes("ALL-CAPS"))!;
    const symbols = spam.items.find((i) => i.label.includes("symbols"))!;
    expect(caps.status === "warn" || caps.status === "fail").toBe(true);
    expect(symbols.status).toBe("warn");
  });

  it("flags generic anchor text", () => {
    const result = lintEmail({
      body: "See the details, [click here](https://x.example) to read them, and [unsubscribe](https://x.example/u). 1 Main Street, Austin, TX 78701",
      subject: "Details",
      listType: "marketing",
    });
    expect(result.flags.some((f) => f.includes("Generic anchor text"))).toBe(true);
  });

  it("warns when a marketing email has no links", () => {
    const result = lintEmail({
      body: "Just a plain text note with an unsubscribe line. 1 Main Street, Austin, TX 78701 unsubscribe",
      subject: "Note",
      listType: "marketing",
    });
    const links = category(result, "Links & Structure");
    const linkItem = links.items.find((i) => i.label.includes("at least one link"))!;
    expect(linkItem.status).toBe("warn");
  });
});
