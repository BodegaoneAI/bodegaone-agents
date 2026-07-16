/**
 * tests/unit/content-lint.test.ts
 * Unit tests for the pure content-linting logic.
 */
import { describe, it, expect } from "vitest";
import { lintContent } from "../../mcp/lib/content-lint.js";

function gradeOf(result: ReturnType<typeof lintContent>, categoryName: string) {
  const cat = result.categories.find((c) => c.name === categoryName);
  if (!cat) throw new Error(`category ${categoryName} not found`);
  const fails = cat.items.filter((i) => i.status === "fail").length;
  const warns = cat.items.filter((i) => i.status === "warn").length;
  if (fails >= 2) return "FAIL";
  if (fails === 1) return "WARN";
  if (warns >= 2) return "WARN";
  return "PASS";
}

// A clean, spec-compliant draft (realistic length, answer-first, FAQ block).
const goodDraft = `# How Much VRAM Do You Need for Local AI?

For most local AI work you need 16GB of VRAM. That runs 13B-parameter models
comfortably at 4-bit quantization, with headroom for context and a second small
model. For 30B models, plan on 24GB. For 70B models, you need 48GB or a two-card
setup. These numbers assume 4-bit quantization, which is the standard for running
open models on consumer hardware without a meaningful quality loss.

## What is VRAM and why does it matter?

VRAM is the dedicated memory on your graphics card. It holds the model weights
while they run, so more VRAM lets you load larger models and longer context. A
13B model at 4-bit needs roughly 8GB of VRAM plus a few gigabytes of overhead for
the key-value cache. When a model does not fit in VRAM, it spills to system RAM
and slows down by an order of magnitude, so fitting the whole model in VRAM is the
single most important factor for speed.

## How do I pick a GPU for local AI?

Pick the GPU with the most VRAM in your budget, not the one with the highest clock
speed. The [RTX 4060 Ti 16GB](/gpus/4060ti) is the best value under $500 because it
pairs 16GB of VRAM with a 165W power draw. For serious work, a used RTX 3090 gives
you 24GB for a similar price on the second-hand market. Raw compute matters far less
than capacity for inference, so a slower card with more VRAM beats a faster card
that forces the model to spill.

## How much does quantization change the numbers?

Quantization roughly halves memory use per step down. A 13B model needs about 26GB
at full 16-bit precision, 13GB at 8-bit, and 8GB at 4-bit. Four-bit is the practical
sweet spot: it cuts memory to a quarter of full precision while keeping output quality
close to the original for most tasks.

## Frequently Asked Questions

### Can I run local AI on 8GB?

Yes. An 8GB card runs 7B-parameter models well at 4-bit quantization, which covers
most coding, summarization, and chat tasks. You will not run 13B models comfortably,
but 7B models are capable enough for daily work.

### Does CPU RAM matter for local AI?

Yes. Keep at least 32GB of system RAM so the model can load and the OS stays
responsive. System RAM also acts as overflow when a model is slightly too large
for VRAM, though relying on that overflow is slow.
`;

describe("lintContent", () => {
  it("passes a clean, spec-compliant draft", () => {
    const result = lintContent({
      markdown: goodDraft,
      title: "How Much VRAM Do You Need for Local AI in 2026?",
      metaDescription:
        "Most local AI needs 16GB of VRAM for 13B models and 24GB for 30B models. Here is how to pick the right GPU for your budget and workload.",
      targetKeyword: "VRAM",
    });

    expect(gradeOf(result, "Voice & Banned Words")).toBe("PASS");
    expect(gradeOf(result, "Structure & Headings")).toBe("PASS");
    expect(result.headingCount.h1).toBe(1);
    expect(result.headingCount.h2).toBeGreaterThanOrEqual(3);
  });

  it("flags em dashes", () => {
    const result = lintContent({ markdown: "# Title\n\nThis is a sentence — with an em dash." });
    const voice = result.categories.find((c) => c.name === "Voice & Banned Words")!;
    const emItem = voice.items.find((i) => i.label.includes("em dash"))!;
    expect(emItem.status).toBe("fail");
    expect(result.flags.some((f) => f.toLowerCase().includes("em dash"))).toBe(true);
  });

  it("flags banned marketing phrases", () => {
    const result = lintContent({
      markdown:
        "# Title\n\nOur cutting-edge, world-class, best-in-class platform will supercharge your workflow.",
    });
    const voice = result.categories.find((c) => c.name === "Voice & Banned Words")!;
    const fluff = voice.items.find((i) => i.label.includes("marketing fluff"))!;
    expect(fluff.status).toBe("fail"); // 3+ banned phrases → item fails
    expect(result.flags.some((f) => f.includes("cutting-edge"))).toBe(true);
  });

  it("flags multiple H1 headings", () => {
    const result = lintContent({ markdown: "# First\n\ntext\n\n# Second\n\nmore text" });
    const structure = result.categories.find((c) => c.name === "Structure & Headings")!;
    const h1Item = structure.items.find((i) => i.label.includes("one H1"))!;
    expect(h1Item.status).toBe("fail");
  });

  it("flags a weak, non-answer-first section opener", () => {
    const md = `# Title

Intro paragraph here that is fine.

## What is SEO?

There are many different factors and considerations that go into a comprehensive
discussion of this broad and multifaceted topic which we will now begin to explore.
`;
    const result = lintContent({ markdown: md });
    expect(result.flags.some((f) => f.includes("Weak section opener"))).toBe(true);
  });

  it("detects a missing FAQ block", () => {
    const md = "# Title\n\nOpening.\n\n## A section\n\nDirect answer here about the topic.";
    const result = lintContent({ markdown: md });
    const aeo = result.categories.find((c) => c.name === "AEO Extractability")!;
    const faq = aeo.items.find((i) => i.label.includes("FAQ"))!;
    expect(faq.status).toBe("warn");
  });

  it("flags generic anchor text", () => {
    const result = lintContent({ markdown: "# Title\n\nRead our guide [click here](/guide) now." });
    expect(result.flags.some((f) => f.includes("click here"))).toBe(true);
  });

  it("checks title and meta length", () => {
    const result = lintContent({
      markdown: "# Title\n\nSome body content here for the draft.",
      title: "Too short",
      metaDescription: "Way too short.",
    });
    const meta = result.categories.find((c) => c.name === "Metadata")!;
    expect(meta.items.some((i) => i.status === "fail")).toBe(true);
  });

  it("flags an em dash in the meta description", () => {
    const result = lintContent({
      markdown: "# Title\n\nBody text goes here.",
      metaDescription:
        "This meta description is exactly the right length overall but it contains — an em dash that should be flagged clearly.",
    });
    const meta = result.categories.find((c) => c.name === "Metadata")!;
    expect(meta.items.some((i) => i.label.includes("no em dash") && i.status === "fail")).toBe(true);
  });

  it("warns on thin content", () => {
    const result = lintContent({ markdown: "# Title\n\nShort." });
    const depth = result.categories.find((c) => c.name === "Depth & Keyword")!;
    const wc = depth.items.find((i) => i.label.includes("depth"))!;
    expect(wc.status).toBe("fail");
  });

  it("warns when the target keyword never appears", () => {
    const result = lintContent({
      markdown: "# Title\n\nThis draft never mentions the subject we care about at all here.",
      targetKeyword: "quantization",
    });
    const depth = result.categories.find((c) => c.name === "Depth & Keyword")!;
    const kw = depth.items.find((i) => i.label.includes("keyword"))!;
    expect(kw.status).toBe("warn");
  });
});
