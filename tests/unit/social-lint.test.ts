/**
 * tests/unit/social-lint.test.ts
 * Unit tests for the pure social / short-form linting logic.
 */
import { describe, it, expect } from "vitest";
import { lintSocial } from "../../mcp/lib/social-lint.js";
import { categoryGrade } from "../../mcp/lib/grading.js";

// Grade a named category with the shared engine so `critical` items are honored.
function gradeOf(result: ReturnType<typeof lintSocial>, categoryName: string) {
  const cat = result.categories.find((c) => c.name === categoryName);
  if (!cat) throw new Error(`category ${categoryName} not found`);
  return categoryGrade(cat.items);
}

// ── Clean, spec-compliant posts (one per platform) ────────────────────────────

const cleanX =
  "Most founders wait too long to raise. The best time to start a raise is the quarter " +
  "before you need the money, while your metrics still have room to run. Are you raising " +
  "from strength or from fear?";

const cleanLinkedIn = `We cut our onboarding time in half without adding headcount.

Here is the exact change: we replaced the 40-minute setup call with a 5-step in-app
checklist, and we moved the human touch to day three, once people already had a win.
Activation went up because the first session now ends in a result, not a to-do list.

The lesson: remove steps before you add support.

What is the one step you could cut from your onboarding this week?

#saas #onboarding`;

const cleanThreads = `Shipping fast is a skill you practice, not a talent you are born with.

The teams that ship weekly are not smarter. They just made the batch smaller until
shipping stopped being scary. Small batches, boring cadence, real momentum.

What shipped for you this week?`;

const cleanInstagram = `Your first 1,000 followers come from one thing: showing up.

Not the algorithm. Not a viral hook. Just posting something useful on the same days
every week until people can count on you. Consistency compounds faster than any single
post ever will. Save this for the next time you feel like skipping a week.

#creatoreconomy #contentstrategy #growth #consistency`;

describe("lintSocial — clean posts pass", () => {
  it("passes a clean X post", () => {
    const result = lintSocial({ text: cleanX, platform: "x" });
    expect(gradeOf(result, "Length & Limits")).toBe("PASS");
    expect(gradeOf(result, "Hook")).toBe("PASS");
    expect(gradeOf(result, "Hashtags")).toBe("PASS");
    expect(gradeOf(result, "Engagement & CTA")).toBe("PASS");
    expect(gradeOf(result, "Links")).toBe("PASS");
    expect(result.platform).toBe("x");
    expect(result.charCount).toBeGreaterThan(0);
    expect(result.flags.length).toBe(0);
  });

  it("passes a clean LinkedIn post", () => {
    const result = lintSocial({ text: cleanLinkedIn, platform: "linkedin" });
    expect(gradeOf(result, "Length & Limits")).toBe("PASS");
    expect(gradeOf(result, "Hook")).toBe("PASS");
    expect(gradeOf(result, "Hashtags")).toBe("PASS");
    expect(gradeOf(result, "Engagement & CTA")).toBe("PASS");
  });

  it("passes a clean Threads post", () => {
    const result = lintSocial({ text: cleanThreads, platform: "threads" });
    expect(gradeOf(result, "Length & Limits")).toBe("PASS");
    expect(gradeOf(result, "Hook")).toBe("PASS");
    expect(gradeOf(result, "Engagement & CTA")).toBe("PASS");
  });

  it("passes a clean Instagram caption", () => {
    const result = lintSocial({ text: cleanInstagram, platform: "instagram" });
    expect(gradeOf(result, "Length & Limits")).toBe("PASS");
    expect(gradeOf(result, "Hook")).toBe("PASS");
    expect(gradeOf(result, "Hashtags")).toBe("PASS");
    expect(gradeOf(result, "Engagement & CTA")).toBe("PASS");
  });
});

describe("lintSocial — Length & Limits", () => {
  it("fails a single X post over 280 chars (critical → category FAIL)", () => {
    const long = "word ".repeat(70).trim(); // 349 chars
    const result = lintSocial({ text: long, platform: "x" });
    const length = result.categories.find((c) => c.name === "Length & Limits")!;
    expect(length.items[0].status).toBe("fail");
    expect(length.items[0].critical).toBe(true);
    expect(gradeOf(result, "Length & Limits")).toBe("FAIL");
    expect(result.flags.some((f) => f.includes("over the x limit"))).toBe(true);
  });

  it("flags an individual over-limit post in an X thread", () => {
    const post1 = "The best product decisions look obvious only in hindsight. Here is one.";
    const post2 = "word ".repeat(70).trim(); // 349 chars
    const result = lintSocial({ text: `${post1}\n\n${post2}`, platform: "x", isThread: true });
    const length = result.categories.find((c) => c.name === "Length & Limits")!;
    expect(length.items[0].label).toContain("thread post");
    expect(length.items[0].status).toBe("fail");
    expect(result.flags.some((f) => f.includes("Thread post 2"))).toBe(true);
  });

  it("warns when a post is within 90% of the limit", () => {
    const near = "a".repeat(270); // 270/280 = 96%
    const result = lintSocial({ text: near, platform: "x" });
    const length = result.categories.find((c) => c.name === "Length & Limits")!;
    expect(length.items[0].status).toBe("warn");
  });
});

describe("lintSocial — Hook", () => {
  it("fails a filler opener", () => {
    const result = lintSocial({
      text: "So, I wanted to talk about why cold outreach still works in 2026. It does.",
      platform: "x",
    });
    const hook = result.categories.find((c) => c.name === "Hook")!;
    const filler = hook.items.find((i) => i.label.includes("filler"))!;
    expect(filler.status).toBe("fail");
    expect(result.flags.some((f) => f.includes("Weak hook"))).toBe(true);
  });

  it("fails a first line that truncates on LinkedIn", () => {
    const longFirstLine = "word ".repeat(46).trim(); // 229 chars, one line
    const result = lintSocial({ text: longFirstLine, platform: "linkedin" });
    const hook = result.categories.find((c) => c.name === "Hook")!;
    const fold = hook.items.find((i) => i.label.includes("before the fold"))!;
    expect(fold.status).toBe("fail");
    expect(result.flags.some((f) => f.includes("truncates on linkedin"))).toBe(true);
  });

  it("does not flag a legitimate opener as weak", () => {
    const result = lintSocial({ text: "Sometimes the best hook is a number.", platform: "x" });
    const hook = result.categories.find((c) => c.name === "Hook")!;
    const filler = hook.items.find((i) => i.label.includes("filler"))!;
    expect(filler.status).toBe("pass");
    expect(result.flags.some((f) => f.includes("Weak hook"))).toBe(false);
    expect(gradeOf(result, "Hook")).toBe("PASS");
  });

  it("does not flag real words that merely begin with filler letters", () => {
    for (const opener of [
      "Sometimes the best hook is a number.",
      "Software margins are why the model works.",
      "Threads is quietly the best place to post right now.",
      "Wellness founders underprice their programs every time.",
    ]) {
      const result = lintSocial({ text: opener, platform: "x" });
      const hook = result.categories.find((c) => c.name === "Hook")!;
      const filler = hook.items.find((i) => i.label.includes("filler"))!;
      expect(filler.status, opener).toBe("pass");
      expect(result.flags.some((f) => f.includes("Weak hook"))).toBe(false);
    }
  });
});

describe("lintSocial — Hashtags", () => {
  it("warns on more than 3 hashtags on X", () => {
    const result = lintSocial({
      text: "Launch tips for founders. #startup #saas #growth #marketing",
      platform: "x",
    });
    const tags = result.categories.find((c) => c.name === "Hashtags")!;
    expect(tags.items[0].status).toBe("warn");
    expect(result.flags.some((f) => f.includes("hashtags"))).toBe(true);
  });

  it("fails (critically) when Instagram exceeds the 5-hashtag cap", () => {
    const six = Array.from({ length: 6 }, (_, i) => `#tag${i}`).join(" ");
    const result = lintSocial({ text: `New drop is live.\n\n${six}`, platform: "instagram" });
    const tags = result.categories.find((c) => c.name === "Hashtags")!;
    expect(tags.items[0].status).toBe("fail");
    expect(tags.items[0].critical).toBe(true);
    expect(gradeOf(result, "Hashtags")).toBe("FAIL"); // critical → whole category fails
    expect(result.flags.some((f) => f.includes("hard cap of 5"))).toBe(true);
  });

  it("passes exactly 5 hashtags on Instagram", () => {
    const five = Array.from({ length: 5 }, (_, i) => `#tag${i}`).join(" ");
    const result = lintSocial({
      text: `New drop is live. Save this.\n\n${five}`,
      platform: "instagram",
    });
    const tags = result.categories.find((c) => c.name === "Hashtags")!;
    expect(tags.items[0].status).toBe("pass");
    expect(gradeOf(result, "Hashtags")).toBe("PASS");
  });
});

describe("lintSocial — Engagement & CTA", () => {
  it("warns when there is no clear CTA", () => {
    const result = lintSocial({
      text: "Shipped a new build today. Faster cold starts and a smaller bundle.",
      platform: "x",
    });
    const eng = result.categories.find((c) => c.name === "Engagement & CTA")!;
    const cta = eng.items.find((i) => i.label.includes("CTA"))!;
    expect(cta.status).toBe("warn");
  });

  it("warns on engagement-bait phrases", () => {
    const result = lintSocial({
      text: "New drop is live. Tag 3 friends and smash that like to enter.",
      platform: "instagram",
    });
    const eng = result.categories.find((c) => c.name === "Engagement & CTA")!;
    const bait = eng.items.find((i) => i.label.includes("engagement-bait"))!;
    expect(bait.status).toBe("warn");
    expect(result.flags.some((f) => f.toLowerCase().includes("tag 3 friends"))).toBe(true);
  });

  it("warns on all-caps shouting", () => {
    const result = lintSocial({
      text: "THIS LAUNCH IS HUGE AND MASSIVE. You do not want to miss what we shipped today.",
      platform: "linkedin",
    });
    const eng = result.categories.find((c) => c.name === "Engagement & CTA")!;
    const shout = eng.items.find((i) => i.label.includes("shouting"))!;
    expect(shout.status).toBe("warn");
    expect(result.flags.some((f) => f.includes("Shouting"))).toBe(true);
  });
});

describe("lintSocial — Links", () => {
  it("warns on a raw link inside an X post", () => {
    const result = lintSocial({
      text: "Read the full teardown here https://example.com/post — worth your time.",
      platform: "x",
    });
    const links = result.categories.find((c) => c.name === "Links")!;
    expect(links.items[0].status).toBe("warn");
    expect(result.flags.some((f) => f.toLowerCase().includes("reach"))).toBe(true);
  });

  it("does not penalize a link on LinkedIn", () => {
    const result = lintSocial({
      text: "Our new pricing is live. Read the reasoning: https://example.com/pricing\n\nWhat do you think?",
      platform: "linkedin",
    });
    const links = result.categories.find((c) => c.name === "Links")!;
    expect(links.items[0].status).toBe("pass");
  });
});
