/**
 * tests/unit/a11y-lint.test.ts
 * Unit tests for the pure accessibility-linting logic.
 */
import { describe, it, expect } from "vitest";
import { lintA11y } from "../../mcp/lib/a11y-lint.js";
import { categoryGrade } from "../../mcp/lib/grading.js";

function cat(result: ReturnType<typeof lintA11y>, name: string) {
  const c = result.categories.find((x) => x.name === name);
  if (!c) throw new Error(`category ${name} not found`);
  return c;
}
function grade(result: ReturnType<typeof lintA11y>, name: string) {
  return categoryGrade(cat(result, name).items);
}

// A clean, accessible snippet: labeled control, one h1, alt text, named controls.
const goodSnippet = `<main>
  <h1>Account settings</h1>
  <h2>Profile</h2>
  <img src="/avatar.png" alt="Your profile photo">
  <form>
    <label for="email">Email address</label>
    <input type="email" id="email" name="email">
  </form>
  <a href="/help">Read the help guide</a>
  <button type="submit">Save changes</button>
</main>`;

describe("lintA11y", () => {
  it("passes a clean, accessible snippet", () => {
    const result = lintA11y({ html: goodSnippet });

    expect(grade(result, "Images & Media")).toBe("PASS");
    expect(grade(result, "Structure & Headings")).toBe("PASS");
    expect(grade(result, "Forms & Labels")).toBe("PASS");
    expect(grade(result, "Links & Buttons")).toBe("PASS");
    expect(grade(result, "ARIA & Interaction")).toBe("PASS");
    expect(result.flags).toEqual([]);
    expect(result.counts.h1).toBe(1);
    expect(result.counts.unlabeledControls).toBe(0);
  });

  it("does not include the Document category unless isFullDocument", () => {
    const result = lintA11y({ html: goodSnippet });
    expect(result.categories.find((c) => c.name === "Document")).toBeUndefined();
  });

  it("passes Structure & Headings for a headless labeled-button fragment", () => {
    // The blocker fix: a component partial with no headings must not fail, and
    // must not drive a harmful 'add an <h1>' fix.
    const result = lintA11y({ html: `<button aria-label="Close">×</button>` });
    expect(grade(result, "Structure & Headings")).toBe("PASS");
    expect(result.counts.headings).toBe(0);
    expect(result.flags).toEqual([]);
  });

  it("does not require an <h1> in a fragment", () => {
    const result = lintA11y({ html: `<h2>Section</h2><p>Body copy for the section.</p>` });
    expect(grade(result, "Structure & Headings")).toBe("PASS");
    expect(result.flags.some((f) => f.includes("<h1>"))).toBe(false);
  });

  it("fails an <img> with no alt attribute — Images & Media FAILs (critical)", () => {
    const result = lintA11y({ html: `<h1>Gallery</h1><img src="/x.png">` });
    const images = cat(result, "Images & Media");
    const alt = images.items.find((i) => i.label.includes("alt"))!;
    expect(alt.status).toBe("fail");
    expect(alt.critical).toBe(true);
    // A single critical fail must fail the whole category.
    expect(grade(result, "Images & Media")).toBe("FAIL");
    expect(result.counts.imagesMissingAlt).toBe(1);
    expect(result.flags.some((f) => f.toLowerCase().includes("alt"))).toBe(true);
  });

  it("allows empty alt on decorative images", () => {
    const result = lintA11y({ html: `<h1>Gallery</h1><img src="/divider.png" alt="">` });
    expect(grade(result, "Images & Media")).toBe("PASS");
    expect(result.counts.imagesMissingAlt).toBe(0);
  });

  it("downgrades multiple <h1> to a best-practice warning, not a failure", () => {
    const result = lintA11y({
      html: `<!doctype html><html lang="en"><head><title>T</title></head><body><h1>A</h1><h1>B</h1></body></html>`,
      isFullDocument: true,
    });
    const h1 = cat(result, "Structure & Headings").items.find((i) => i.label.includes("one <h1>"))!;
    expect(h1.status).toBe("warn");
    expect(grade(result, "Structure & Headings")).not.toBe("FAIL");
    expect(result.counts.h1).toBe(2);
  });

  it("downgrades a skipped heading level to a best-practice warning, not a failure", () => {
    const result = lintA11y({ html: `<h1>Title</h1><h4>Deep subsection</h4>` });
    const skip = cat(result, "Structure & Headings").items.find((i) => i.label.includes("skip"))!;
    expect(skip.status).toBe("warn");
    expect(grade(result, "Structure & Headings")).not.toBe("FAIL");
    expect(result.counts.headingSkips).toBe(1);
    expect(result.flags.some((f) => f.includes("skips from h1 to h4"))).toBe(true);
  });

  it("grades Structure & Headings WARN when both heading nits occur on a full page", () => {
    const result = lintA11y({
      html:
        `<!doctype html><html lang="en"><head><title>T</title></head>` +
        `<body><h1>A</h1><h2>B</h2><h4>C</h4><h1>D</h1></body></html>`,
      isFullDocument: true,
    });
    expect(grade(result, "Structure & Headings")).toBe("WARN");
  });

  it("fails an unlabeled form control — Forms & Labels FAILs (critical)", () => {
    const result = lintA11y({ html: `<h1>Search</h1><input type="text" name="q">` });
    const item = cat(result, "Forms & Labels").items[0];
    expect(item.status).toBe("fail");
    expect(item.critical).toBe(true);
    expect(grade(result, "Forms & Labels")).toBe("FAIL");
    expect(result.counts.unlabeledControls).toBe(1);
  });

  it("accepts a control labeled by aria-label or a wrapping label", () => {
    const result = lintA11y({
      html:
        `<h1>Search</h1>` +
        `<input type="search" aria-label="Search the site">` +
        `<label>Message<textarea name="msg"></textarea></label>`,
    });
    expect(grade(result, "Forms & Labels")).toBe("PASS");
    expect(result.counts.formControls).toBe(2);
    expect(result.counts.unlabeledControls).toBe(0);
  });

  it("ignores hidden and submit inputs when checking labels", () => {
    const result = lintA11y({
      html: `<h1>Form</h1><input type="hidden" name="csrf"><input type="submit" value="Go">`,
    });
    expect(result.counts.formControls).toBe(0);
    expect(grade(result, "Forms & Labels")).toBe("PASS");
  });

  it("fails an <input type=image> with no alt (image button needs a name)", () => {
    const result = lintA11y({ html: `<h1>Form</h1><input type="image" src="/go.png">` });
    const item = cat(result, "Forms & Labels").items[0];
    expect(item.status).toBe("fail");
    expect(grade(result, "Forms & Labels")).toBe("FAIL");
    expect(result.counts.formControls).toBe(1);
    expect(result.counts.unlabeledControls).toBe(1);
  });

  it("accepts an <input type=image> whose alt provides the name", () => {
    const result = lintA11y({ html: `<h1>Form</h1><input type="image" src="/go.png" alt="Search">` });
    expect(grade(result, "Forms & Labels")).toBe("PASS");
    expect(result.counts.unlabeledControls).toBe(0);
  });

  it("fails an empty link and an empty button", () => {
    const result = lintA11y({ html: `<h1>Nav</h1><a href="/x"></a><button></button>` });
    const lb = cat(result, "Links & Buttons");
    expect(lb.items.find((i) => i.label.includes("Links"))!.status).toBe("fail");
    expect(lb.items.find((i) => i.label.includes("Buttons"))!.status).toBe("fail");
    expect(result.counts.emptyLinks).toBe(1);
    expect(result.counts.emptyButtons).toBe(1);
  });

  it("warns on generic link text", () => {
    const result = lintA11y({ html: `<h1>Blog</h1><a href="/post">click here</a>` });
    const generic = cat(result, "Links & Buttons").items.find((i) => i.label.includes("Descriptive"))!;
    expect(generic.status).toBe("warn");
    expect(result.counts.genericLinks).toBe(1);
  });

  it("warns on a positive tabindex", () => {
    const result = lintA11y({ html: `<h1>Widget</h1><div tabindex="3">Focus trap</div>` });
    const ti = cat(result, "ARIA & Interaction").items.find((i) => i.label.includes("tabindex"))!;
    expect(ti.status).toBe("warn");
    expect(result.counts.positiveTabindex).toBe(1);
  });

  it("fails aria-hidden on an interactive element", () => {
    const result = lintA11y({ html: `<h1>Menu</h1><button aria-hidden="true">Open</button>` });
    const ah = cat(result, "ARIA & Interaction").items.find((i) => i.label.includes("aria-hidden"))!;
    expect(ah.status).toBe("fail");
    expect(result.counts.ariaHiddenInteractive).toBe(1);
  });

  it("warns (not fails) on an unrecognized ARIA role and warns on a redundant one", () => {
    const unknown = lintA11y({ html: `<h1>Widget</h1><div role="buton">x</div>` });
    const roleItem = cat(unknown, "ARIA & Interaction").items.find((i) => i.label.includes("Recognized ARIA"))!;
    expect(roleItem.status).toBe("warn");
    expect(unknown.counts.unrecognizedRoles).toBe(1);

    const redundant = lintA11y({ html: `<h1>Widget</h1><button role="button">Go</button>` });
    const redItem = cat(redundant, "ARIA & Interaction").items.find((i) => i.label.includes("redundant"))!;
    expect(redItem.status).toBe("warn");
    expect(redundant.counts.redundantRoles).toBe(1);
  });

  it("accepts valid ARIA 1.2 roles such as meter", () => {
    const result = lintA11y({ html: `<h1>Stats</h1><div role="meter" aria-valuenow="70">70%</div>` });
    const roleItem = cat(result, "ARIA & Interaction").items.find((i) => i.label.includes("Recognized ARIA"))!;
    expect(roleItem.status).toBe("pass");
    expect(result.counts.unrecognizedRoles).toBe(0);
  });

  it("accepts DPUB doc-* roles via the prefix check", () => {
    const result = lintA11y({ html: `<h1>Book</h1><nav role="doc-toc">Contents</nav>` });
    expect(result.counts.unrecognizedRoles).toBe(0);
  });

  it("checks document-level rules only when isFullDocument is true", () => {
    const missing = lintA11y({
      html: `<!doctype html><html><head></head><body><h1>Hi</h1></body></html>`,
      isFullDocument: true,
    });
    const doc = cat(missing, "Document");
    expect(doc.items.find((i) => i.label.includes("lang"))!.status).toBe("fail");
    expect(doc.items.find((i) => i.label.includes("title"))!.status).toBe("fail");
    expect(grade(missing, "Document")).toBe("FAIL");
  });

  it("passes document rules for a well-formed page and flags a zoom-locked viewport", () => {
    const ok = lintA11y({
      html:
        `<!doctype html><html lang="en"><head><title>My Page</title>` +
        `<meta name="viewport" content="width=device-width, initial-scale=1"></head>` +
        `<body><h1>Hi</h1></body></html>`,
      isFullDocument: true,
    });
    expect(grade(ok, "Document")).toBe("PASS");

    const locked = lintA11y({
      html:
        `<!doctype html><html lang="en"><head><title>My Page</title>` +
        `<meta name="viewport" content="width=device-width, user-scalable=no"></head>` +
        `<body><h1>Hi</h1></body></html>`,
      isFullDocument: true,
    });
    const doc = cat(locked, "Document");
    expect(doc.items.find((i) => i.label.includes("Viewport"))!.status).toBe("fail");
  });
});
