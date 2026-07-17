/**
 * mcp/lib/a11y-lint.ts
 * Pure accessibility-linting logic for the Accessibility (a11y) Auditor agent.
 * Checks an HTML snippet or full page against a subset of WCAG 2.2 (level A/AA)
 * success criteria and the ARIA Authoring Practices, and returns pass/warn/fail
 * categories (graded with the shared grading.ts engine) plus specific, quotable
 * flags that quote the offending tag.
 *
 * Static analysis only. It catches roughly a third of accessibility issues — the
 * machine-testable ones. Keyboard order, focus management, and screen-reader
 * semantics need manual testing. Color contrast is covered by the sibling
 * `design_lint` tool, not here.
 *
 * Parsing is regex-based (mirroring analyze-page.ts); there is no DOM dependency.
 * Exported here so it can be unit-tested independently of the MCP tool layer.
 */
import { stripTags, decodeHtml } from "./html.js";
import type { ScorecardItem } from "./grading.js";

export interface A11yLintInput {
  /** An HTML snippet or a full page. */
  html: string;
  /**
   * When true, also check document-level requirements: <html lang>, a non-empty
   * <title>, and a viewport meta that does not disable zoom.
   */
  isFullDocument?: boolean;
}

export interface LintCategory {
  name: string;
  items: ScorecardItem[];
}

export interface A11yCounts {
  images: number;
  imagesMissingAlt: number;
  headings: number;
  h1: number;
  headingSkips: number;
  formControls: number;
  unlabeledControls: number;
  links: number;
  emptyLinks: number;
  genericLinks: number;
  buttons: number;
  emptyButtons: number;
  positiveTabindex: number;
  ariaHiddenInteractive: number;
  unrecognizedRoles: number;
  redundantRoles: number;
}

export interface A11yLintResult {
  categories: LintCategory[];
  /** Specific, quotable issues; each quotes the offending tag. */
  flags: string[];
  counts: A11yCounts;
}

// ── Reference data ────────────────────────────────────────────────────────────

/** Non-descriptive link text the spec warns on (WCAG 2.4.4 Link Purpose). */
export const GENERIC_LINK_TEXT = ["click here", "read more", "here", "learn more"];

/**
 * A small allow-list of common, valid ARIA roles (WAI-ARIA 1.2 / ARIA APG).
 * A role token outside this set is treated as an obvious typo/invalid value.
 */
export const VALID_ROLES = new Set([
  "alert", "alertdialog", "application", "article", "banner", "button", "cell",
  "checkbox", "columnheader", "combobox", "complementary", "contentinfo",
  "definition", "dialog", "directory", "document", "feed", "figure", "form",
  "grid", "gridcell", "group", "heading", "img", "link", "list", "listbox",
  "listitem", "log", "main", "marquee", "math", "menu", "menubar", "menuitem",
  "menuitemcheckbox", "menuitemradio", "navigation", "none", "note", "option",
  "presentation", "progressbar", "radio", "radiogroup", "region", "row",
  "rowgroup", "rowheader", "scrollbar", "search", "searchbox", "separator",
  "slider", "spinbutton", "status", "switch", "tab", "table", "tablist",
  "tabpanel", "term", "textbox", "timer", "toolbar", "tooltip", "tree",
  "treegrid", "treeitem",
  // WAI-ARIA 1.2 structural and additional roles.
  "meter", "blockquote", "caption", "code", "paragraph", "strong", "emphasis",
  "insertion", "deletion", "subscript", "superscript", "time", "generic",
  "mark", "comment", "suggestion",
]);

/** True for a recognized ARIA role, including any DPUB-ARIA `doc-*` role. */
export function isRecognizedRole(token: string): boolean {
  const t = token.toLowerCase();
  return VALID_ROLES.has(t) || t.startsWith("doc-");
}

/**
 * Input types that don't take a text label. `image` is deliberately excluded:
 * an image button still needs an accessible name (alt / aria-label).
 */
const UNLABELABLE_INPUT_TYPES = new Set(["hidden", "submit", "button", "reset"]);

// ── Small helpers ─────────────────────────────────────────────────────────────

/** Read an attribute value (quoted or unquoted). Returns null when absent. */
function getAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");
  const m = attrs.match(re);
  if (!m) return null;
  return (m[1] ?? m[2] ?? m[3] ?? "").trim();
}

/** True when the attribute is present at all (value-bearing or boolean). */
function hasAttr(attrs: string, name: string): boolean {
  return new RegExp(`(?:^|\\s)${name}(?:\\s*=|\\s|/|$)`, "i").test(attrs);
}

/** Collapse a tag to one line and truncate for quoting in a flag. */
function quoteTag(tag: string): string {
  const oneLine = tag.replace(/\s+/g, " ").trim();
  return oneLine.length > 80 ? `${oneLine.slice(0, 77)}…` : oneLine;
}

/** The accessible text inside a link/button: visible text or a child img's alt. */
function accessibleName(attrs: string, inner: string): string {
  const ariaLabel = getAttr(attrs, "aria-label");
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
  if (getAttr(attrs, "aria-labelledby")) return "referenced";
  const text = stripTags(decodeHtml(inner)).trim();
  if (text) return text;
  for (const m of inner.matchAll(/<img\b([^>]*)>/gi)) {
    const alt = getAttr(m[1], "alt");
    if (alt && alt.trim()) return alt.trim();
  }
  return "";
}

/** The implicit ARIA role of a native element, for the redundant-role check. */
function implicitRole(name: string, attrs: string): string | null {
  switch (name) {
    case "button":
      return "button";
    case "a":
      return hasAttr(attrs, "href") ? "link" : null;
    case "nav":
      return "navigation";
    case "main":
      return "main";
    case "ul":
    case "ol":
      return "list";
    case "li":
      return "listitem";
    case "table":
      return "table";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "heading";
    default:
      return null;
  }
}

// ── Main linter ───────────────────────────────────────────────────────────────

export function lintA11y(input: A11yLintInput): A11yLintResult {
  const { html, isFullDocument = false } = input;
  const flags: string[] = [];

  // ── Images & Media (WCAG 1.1.1 Non-text Content, A) ──────────────────────
  const imgTags = [...html.matchAll(/<img\b([^>]*)>/gi)];
  let imagesMissingAlt = 0;
  for (const m of imgTags) {
    if (!hasAttr(m[1], "alt")) {
      imagesMissingAlt++;
      flags.push(
        `Image missing alt attribute: \`${quoteTag(m[0])}\` — add alt="…" (or alt="" if purely decorative). [WCAG 1.1.1, A]`
      );
    }
  }
  const images: ScorecardItem[] = [
    {
      label: "Every <img> has an alt attribute",
      status: imagesMissingAlt === 0 ? "pass" : "fail",
      critical: imagesMissingAlt > 0 ? true : undefined,
      note:
        imgTags.length === 0
          ? "no images"
          : `${imagesMissingAlt}/${imgTags.length} missing alt (empty alt="" is allowed for decorative)`,
    },
  ];

  // ── Structure & Headings ─────────────────────────────────────────────────
  // A clean heading outline (one <h1>, no skipped levels) is an ARIA/axe best
  // practice, not a WCAG 1.3.1 level-A failure on its own — so these grade as
  // warnings. A headless fragment (a component partial) is perfectly valid, so
  // the single-<h1> rule only applies to a full document.
  const headingTags = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const levels = headingTags.map((m) => parseInt(m[1], 10));
  const h1Count = levels.filter((l) => l === 1).length;
  let headingSkips = 0;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      headingSkips++;
      flags.push(
        `Heading level skips from h${levels[i - 1]} to h${levels[i]} — don't jump more than one level down. [best practice]`
      );
    }
  }
  if (isFullDocument) {
    if (h1Count === 0) {
      flags.push(`No <h1> found — a full page should have exactly one top-level heading. [best practice]`);
    } else if (h1Count > 1) {
      flags.push(`${h1Count} <h1> headings — use exactly one top-level heading. [best practice]`);
    }
  }
  const structure: ScorecardItem[] = [];
  if (isFullDocument) {
    structure.push({
      label: "Exactly one <h1>",
      status: h1Count === 1 ? "pass" : "warn",
      note: h1Count === 1 ? "[best practice]" : `${h1Count} H1 heading(s) [best practice]`,
    });
  }
  if (headingTags.length > 0) {
    structure.push({
      label: "Heading levels don't skip",
      status: headingSkips === 0 ? "pass" : "warn",
      note: headingSkips === 0 ? "[best practice]" : `${headingSkips} skipped level(s) [best practice]`,
    });
  } else if (!isFullDocument) {
    structure.push({
      label: "Heading structure",
      status: "pass",
      note: "no headings in this fragment",
    });
  }

  // ── Forms & Labels (WCAG 1.3.1 / 3.3.2 / 4.1.2, A) ───────────────────────
  const labelForIds = new Set<string>();
  for (const m of html.matchAll(/<label\b[^>]*\bfor\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))[^>]*>/gi)) {
    labelForIds.add((m[1] ?? m[2] ?? m[3] ?? "").trim());
  }
  const labelRanges: { start: number; end: number }[] = [];
  for (const m of html.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi)) {
    labelRanges.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
  }
  const controlTags = [...html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)];
  let formControls = 0;
  let unlabeledControls = 0;
  for (const m of controlTags) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    let type = "";
    if (tag === "input") {
      type = (getAttr(attrs, "type") ?? "text").toLowerCase();
      if (UNLABELABLE_INPUT_TYPES.has(type)) continue;
    }
    formControls++;
    const id = getAttr(attrs, "id");
    const ariaLabel = getAttr(attrs, "aria-label");
    const ariaLabelledby = getAttr(attrs, "aria-labelledby");
    const alt = getAttr(attrs, "alt");
    const idx = m.index ?? 0;
    const wrapped = labelRanges.some((r) => idx >= r.start && idx < r.end);
    // <input type="image"> is an image button; its accessible name can come
    // from alt (or aria-label/aria-labelledby).
    const isImageInput = type === "image";
    const labeled =
      !!(ariaLabel && ariaLabel.trim()) ||
      !!(ariaLabelledby && ariaLabelledby.trim()) ||
      !!(id && labelForIds.has(id)) ||
      wrapped ||
      (isImageInput && !!(alt && alt.trim()));
    if (!labeled) {
      unlabeledControls++;
      const advice = isImageInput
        ? `add alt="…" describing what the button does, or an aria-label`
        : `add a <label for="…">, wrap it in a <label>, or give it aria-label/aria-labelledby`;
      flags.push(
        `Unlabeled form control: \`${quoteTag(m[0])}\` — ${advice}. [WCAG 3.3.2, A]`
      );
    }
  }
  const forms: ScorecardItem[] = [
    {
      label: "Every form control has an accessible label",
      status: unlabeledControls === 0 ? "pass" : "fail",
      critical: unlabeledControls > 0 ? true : undefined,
      note:
        formControls === 0
          ? "no labelable controls"
          : `${unlabeledControls}/${formControls} unlabeled`,
    },
  ];

  // ── Links & Buttons (WCAG 2.4.4 / 4.1.2, A) ──────────────────────────────
  const anchorTags = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  let links = 0;
  let emptyLinks = 0;
  let genericLinks = 0;
  for (const m of anchorTags) {
    const attrs = m[1];
    if (!hasAttr(attrs, "href")) continue; // an <a> without href is not a link
    links++;
    const name = accessibleName(attrs, m[2]);
    if (!name) {
      emptyLinks++;
      flags.push(
        `Empty link: \`${quoteTag(`<a${attrs}>`)}\` — a link needs discernible text or an aria-label. [WCAG 2.4.4, A]`
      );
    } else if (GENERIC_LINK_TEXT.includes(name.toLowerCase())) {
      genericLinks++;
      flags.push(
        `Generic link text "${name}" — link text should describe its destination out of context. [WCAG 2.4.4, A]`
      );
    }
  }
  const buttonTags = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
  let buttons = 0;
  let emptyButtons = 0;
  for (const m of buttonTags) {
    buttons++;
    const name = accessibleName(m[1], m[2]);
    if (!name) {
      emptyButtons++;
      flags.push(
        `Empty button: \`${quoteTag(`<button${m[1]}>`)}\` — a button needs text or an aria-label. [WCAG 4.1.2, A]`
      );
    }
  }
  const linksButtons: ScorecardItem[] = [
    {
      label: "Links have discernible text",
      status: emptyLinks === 0 ? "pass" : "fail",
      note: links === 0 ? "no links" : emptyLinks ? `${emptyLinks}/${links} empty` : undefined,
    },
    {
      label: "Buttons have discernible text",
      status: emptyButtons === 0 ? "pass" : "fail",
      note: buttons === 0 ? "no buttons" : emptyButtons ? `${emptyButtons}/${buttons} empty` : undefined,
    },
    {
      label: "Descriptive link text (not generic)",
      status: genericLinks === 0 ? "pass" : "warn",
      note: genericLinks ? `${genericLinks} generic ("click here", "read more"…)` : undefined,
    },
  ];

  // ── ARIA & Interaction (WCAG 4.1.2 + ARIA APG) ───────────────────────────
  let positiveTabindex = 0;
  let ariaHiddenInteractive = 0;
  let unrecognizedRoles = 0;
  let redundantRoles = 0;
  const interactive = new Set(["a", "button", "input", "select", "textarea"]);
  for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
    const name = m[1].toLowerCase();
    const attrs = m[2];

    const ti = getAttr(attrs, "tabindex");
    if (ti !== null && /^-?\d+$/.test(ti) && parseInt(ti, 10) > 0) {
      positiveTabindex++;
      flags.push(
        `Positive tabindex on \`<${name}>\` (tabindex="${ti}") — it overrides natural focus order; use 0 or -1. [ARIA APG best practice]`
      );
    }

    const ariaHidden = getAttr(attrs, "aria-hidden");
    if (ariaHidden && ariaHidden.toLowerCase() === "true" && interactive.has(name)) {
      ariaHiddenInteractive++;
      flags.push(
        `aria-hidden="true" on interactive \`<${name}>\` — it stays focusable but is hidden from screen readers. [WCAG 4.1.2, A]`
      );
    }

    const role = getAttr(attrs, "role");
    if (role !== null) {
      const tokens = role.split(/\s+/).filter(Boolean);
      for (const tok of tokens) {
        if (!isRecognizedRole(tok)) {
          unrecognizedRoles++;
          flags.push(
            `Unrecognized ARIA role="${tok}" on \`<${name}>\` — not in the WAI-ARIA vocabulary; check the spelling. [best practice]`
          );
        }
      }
      const implicit = implicitRole(name, attrs);
      if (implicit && tokens.map((t) => t.toLowerCase()).includes(implicit)) {
        redundantRoles++;
        flags.push(
          `Redundant role="${implicit}" on native \`<${name}>\` — the element already has that role. [ARIA APG best practice]`
        );
      }
    }
  }
  const aria: ScorecardItem[] = [
    {
      label: "No positive tabindex",
      status: positiveTabindex === 0 ? "pass" : "warn",
      note: positiveTabindex ? `${positiveTabindex} element(s) with tabindex > 0` : undefined,
    },
    {
      label: "No aria-hidden on interactive elements",
      status: ariaHiddenInteractive === 0 ? "pass" : "fail",
      note: ariaHiddenInteractive ? `${ariaHiddenInteractive} interactive element(s) hidden` : undefined,
    },
    {
      label: "Recognized ARIA roles",
      status: unrecognizedRoles === 0 ? "pass" : "warn",
      note: unrecognizedRoles ? `${unrecognizedRoles} unrecognized role value(s)` : undefined,
    },
    {
      label: "No redundant roles on native elements",
      status: redundantRoles === 0 ? "pass" : "warn",
      note: redundantRoles ? `${redundantRoles} redundant role(s)` : undefined,
    },
  ];

  // ── Categories ────────────────────────────────────────────────────────────
  const categories: LintCategory[] = [
    { name: "Images & Media", items: images },
    { name: "Structure & Headings", items: structure },
    { name: "Forms & Labels", items: forms },
    { name: "Links & Buttons", items: linksButtons },
    { name: "ARIA & Interaction", items: aria },
  ];

  // ── Document (only for a full page) (WCAG 3.1.1 / 2.4.2, A; 1.4.4, AA) ────
  if (isFullDocument) {
    const htmlTagMatch = html.match(/<html\b([^>]*)>/i);
    const lang = htmlTagMatch ? getAttr(htmlTagMatch[1], "lang") : null;
    const hasLang = !!(lang && lang.trim());
    if (!hasLang) flags.push(`<html> has no non-empty lang attribute — set <html lang="en"> (or the page's language). [WCAG 3.1.1, A]`);

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const titleText = titleMatch ? stripTags(decodeHtml(titleMatch[1])).trim() : "";
    const hasTitle = titleText.length > 0;
    if (!hasTitle) flags.push(`Missing or empty <title> — every page needs a descriptive title. [WCAG 2.4.2, A]`);

    const viewportMatch = html.match(/<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*>/i);
    let zoomOk = true;
    if (viewportMatch) {
      const content = (getAttr(viewportMatch[0], "content") ?? "").toLowerCase().replace(/\s+/g, "");
      if (content.includes("user-scalable=no") || /maximum-scale=1(\.0+)?(,|$)/.test(content)) {
        zoomOk = false;
        flags.push(
          `Viewport meta disables zoom (\`${quoteTag(viewportMatch[0])}\`) — remove user-scalable=no / maximum-scale=1. [WCAG 1.4.4, AA]`
        );
      }
    }

    categories.push({
      name: "Document",
      items: [
        {
          label: "<html> has a lang attribute",
          status: hasLang ? "pass" : "fail",
          note: hasLang ? `lang="${lang}"` : "no lang set",
        },
        {
          label: "Non-empty <title>",
          status: hasTitle ? "pass" : "fail",
          note: hasTitle ? undefined : "missing or empty",
        },
        {
          label: "Viewport allows zoom",
          status: zoomOk ? "pass" : "fail",
          note: zoomOk ? undefined : "zoom disabled",
        },
      ],
    });
  }

  const counts: A11yCounts = {
    images: imgTags.length,
    imagesMissingAlt,
    headings: headingTags.length,
    h1: h1Count,
    headingSkips,
    formControls,
    unlabeledControls,
    links,
    emptyLinks,
    genericLinks,
    buttons,
    emptyButtons,
    positiveTabindex,
    ariaHiddenInteractive,
    unrecognizedRoles,
    redundantRoles,
  };

  return { categories, flags, counts };
}
