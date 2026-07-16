/**
 * mcp/lib/content-lint.ts
 * Pure content-linting logic for the Content Writer agent.
 * Checks a markdown draft against the SEO / AEO / GEO writing spec and returns
 * pass/warn/fail categories (graded with the shared grading.ts engine) plus
 * specific, quotable flags.
 *
 * Exported here so it can be unit-tested independently of the MCP tool layer.
 */
import type { ScorecardItem } from "./grading.js";

export interface LintInput {
  /** The draft body, in markdown. */
  markdown: string;
  /** Optional proposed <title> / SEO title. */
  title?: string;
  /** Optional proposed meta description. */
  metaDescription?: string;
  /** Optional primary keyword the piece targets. */
  targetKeyword?: string;
}

export interface LintCategory {
  name: string;
  items: ScorecardItem[];
}

export interface LintResult {
  categories: LintCategory[];
  /** Specific, quotable issues (e.g. the exact banned phrase and its context). */
  flags: string[];
  wordCount: number;
  headingCount: { h1: number; h2: number; h3: number };
}

// ── Word lists ────────────────────────────────────────────────────────────────

/** Marketing fluff and AI-writing tells the spec bans. */
export const BANNED_PHRASES = [
  "best-in-class",
  "cutting-edge",
  "cutting edge",
  "world-class",
  "world class",
  "industry-leading",
  "industry leading",
  "state-of-the-art",
  "seamless",
  "seamlessly",
  "robust",
  "game-changer",
  "game changer",
  "game-changing",
  "revolutionary",
  "revolutionize",
  "supercharge",
  "unlock the power",
  "elevate your",
  "take it to the next level",
  "delve into",
  "delve",
  "tapestry",
  "testament to",
  "in the realm of",
  "navigating the",
  "ever-evolving",
  "ever evolving",
  "fast-paced",
  "bustling",
  "treasure trove",
  "at the end of the day",
  "when it comes to",
  "in today's world",
  "in today's digital age",
  "in the world of",
  "look no further",
  "rest assured",
  "dive into",
  "deep dive",
  "paradigm shift",
  "synergy",
  "holistic",
  "leverage",
  "utilize",
  "plethora",
  "myriad",
  "boasts",
  "unleash",
];

/** Vague, uncited hedging the spec flags. */
export const HEDGING_PHRASES = [
  "many experts believe",
  "experts say",
  "studies show",
  "research shows",
  "it is widely known",
  "it is well known",
  "generally speaking",
  "in some cases",
  "it could be argued",
  "some would say",
  "arguably",
  "needless to say",
];

/** Non-descriptive link text. */
export const GENERIC_ANCHORS = [
  "click here",
  "read more",
  "learn more",
  "here",
  "this link",
  "this page",
  "more",
];

const FILLER_OPENERS =
  /^(there (are|is|was|were)|when it comes to|in order to|it is (important|worth|essential)|as (we|you)('| a)?(re| all)? (know|aware)|in today'?s|first and foremost|without a doubt|generally|basically|essentially)/i;

// ── Small helpers ───────────────────────────────────────────────────────────

function countOccurrences(haystack: string, needle: string): number {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Word-ish boundary: not preceded/followed by a letter (so "utilize" doesn't match "utilizes"? we DO want stems)
  const re = new RegExp(escaped, "gi");
  const matches = haystack.match(re);
  return matches ? matches.length : 0;
}

/** Remove fenced code blocks and inline code so we don't lint code samples. */
function stripCode(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ");
}

interface Heading {
  level: number;
  text: string;
}

function parseHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const re = /^(#{1,6})[ \t]+(.+?)[ \t]*#*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    headings.push({ level: m[1].length, text: m[2].trim() });
  }
  return headings;
}

function isQuestionHeading(text: string): boolean {
  if (text.trim().endsWith("?")) return true;
  return /^(how|what|why|when|where|who|which|can|do|does|is|are|should|will|could|would)\b/i.test(
    text.trim()
  );
}

/** Plain-text word count with markdown syntax stripped. */
function wordCount(markdown: string): number {
  const text = stripCode(markdown)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → anchor text
    .replace(/[#>*_~`|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
}

/** Extract the first sentence of the first paragraph after each H2. */
function sectionOpeners(markdown: string): { heading: string; opener: string }[] {
  const lines = stripCode(markdown).split(/\r?\n/);
  const openers: { heading: string; opener: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const h2 = lines[i].match(/^##[ \t]+(.+?)[ \t]*#*$/);
    if (!h2) continue;
    // find the next non-empty, non-heading line
    let opener = "";
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;
      if (/^#{1,6}[ \t]/.test(line)) break; // hit next heading with no body
      // strip leading list markers / markdown
      opener = line.replace(/^[-*>]\s*/, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
      break;
    }
    if (opener) {
      const firstSentence = opener.split(/(?<=[.!?])\s/)[0];
      openers.push({ heading: h2[1].trim(), opener: firstSentence });
    }
  }
  return openers;
}

function extractLinks(markdown: string): { text: string; url: string }[] {
  const links: { text: string; url: string }[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    links.push({ text: m[1].trim(), url: m[2].trim() });
  }
  return links;
}

// ── Main linter ─────────────────────────────────────────────────────────────

export function lintContent(input: LintInput): LintResult {
  const { markdown, title, metaDescription, targetKeyword } = input;
  const prose = stripCode(markdown);
  const flags: string[] = [];

  const headings = parseHeadings(markdown);
  const h1 = headings.filter((h) => h.level === 1);
  const h2 = headings.filter((h) => h.level === 2);
  const h3 = headings.filter((h) => h.level === 3);
  const words = wordCount(markdown);

  // ── Voice & Banned Words ────────────────────────────────────────────────
  const emDashes = (markdown.match(/—/g) || []).length;
  if (emDashes > 0) flags.push(`Em dash used ${emDashes}× — replace with commas, colons, or restructure.`);

  let bannedTotal = 0;
  for (const phrase of BANNED_PHRASES) {
    const n = countOccurrences(prose, phrase);
    if (n > 0) {
      bannedTotal += n;
      flags.push(`Banned phrase "${phrase}" (${n}×) — cut it or replace with something specific.`);
    }
  }

  let hedgingTotal = 0;
  for (const phrase of HEDGING_PHRASES) {
    const n = countOccurrences(prose, phrase);
    if (n > 0) {
      hedgingTotal += n;
      flags.push(`Hedging "${phrase}" (${n}×) — name a source or state it directly.`);
    }
  }

  const voice: ScorecardItem[] = [
    {
      label: "No em dashes",
      status: emDashes === 0 ? "pass" : "fail",
      note: emDashes ? `${emDashes} found` : undefined,
    },
    {
      label: "No marketing fluff / AI tells",
      status: bannedTotal === 0 ? "pass" : bannedTotal <= 2 ? "warn" : "fail",
      note: bannedTotal ? `${bannedTotal} flagged phrase(s)` : undefined,
    },
    {
      label: "No vague hedging",
      status: hedgingTotal === 0 ? "pass" : "warn",
      note: hedgingTotal ? `${hedgingTotal} found` : undefined,
    },
  ];

  // ── Structure & Headings ────────────────────────────────────────────────
  const questionH2 = h2.filter((h) => isQuestionHeading(h.text)).length;
  const structure: ScorecardItem[] = [
    {
      label: "Exactly one H1",
      status: h1.length === 1 ? "pass" : "fail",
      note: h1.length === 1 ? undefined : `${h1.length} H1 headings`,
    },
    {
      label: "H2 sections present",
      status: h2.length >= 2 ? "pass" : h2.length === 1 ? "warn" : "fail",
      note: `${h2.length} H2 section(s)`,
    },
    {
      label: "Question-phrased headings (AEO/PAA fuel)",
      status:
        h2.length === 0
          ? "warn"
          : questionH2 / h2.length >= 0.4
            ? "pass"
            : "warn",
      note: `${questionH2}/${h2.length} H2s are question-phrased`,
    },
  ];

  // ── AEO Extractability ──────────────────────────────────────────────────
  const openers = sectionOpeners(markdown);
  let weakOpeners = 0;
  for (const o of openers) {
    const openerWords = o.opener.split(/\s+/).filter(Boolean).length;
    if (FILLER_OPENERS.test(o.opener) || openerWords > 40) {
      weakOpeners++;
      flags.push(
        `Weak section opener under "${o.heading}" — lead with a direct ~40-word answer instead of "${o.opener.slice(0, 60)}${o.opener.length > 60 ? "…" : ""}".`
      );
    }
  }
  const hasFaq =
    headings.some((h) => /faq|frequently asked|common questions/i.test(h.text)) ||
    headings.filter((h) => (h.level === 2 || h.level === 3) && isQuestionHeading(h.text)).length >= 3;

  const aeo: ScorecardItem[] = [
    {
      label: "Answer-first section openers",
      status:
        openers.length === 0
          ? "warn"
          : weakOpeners === 0
            ? "pass"
            : weakOpeners <= 2
              ? "warn"
              : "fail",
      note: openers.length ? `${weakOpeners}/${openers.length} openers are weak` : "no sections detected",
    },
    {
      label: "FAQ / Q&A block for extraction",
      status: hasFaq ? "pass" : "warn",
      note: hasFaq ? undefined : "no FAQ or question cluster found",
    },
  ];

  // ── Metadata ────────────────────────────────────────────────────────────
  const metadata: ScorecardItem[] = [];
  if (title !== undefined) {
    const len = title.length;
    metadata.push({
      label: "Title length 50–60",
      status: len >= 50 && len <= 60 ? "pass" : len >= 40 && len <= 65 ? "warn" : "fail",
      note: `${len} chars`,
    });
    if (targetKeyword) {
      const inTitle = title.toLowerCase().includes(targetKeyword.toLowerCase());
      metadata.push({
        label: "Target keyword in title",
        status: inTitle ? "pass" : "warn",
        note: inTitle ? undefined : `"${targetKeyword}" not in title`,
      });
    }
  } else {
    metadata.push({ label: "Title provided", status: "warn", note: "no title supplied to lint" });
  }
  if (metaDescription !== undefined) {
    const len = metaDescription.length;
    metadata.push({
      label: "Meta description 120–160",
      status: len >= 120 && len <= 160 ? "pass" : len >= 100 && len <= 180 ? "warn" : "fail",
      note: `${len} chars`,
    });
    if (/—/.test(metaDescription)) {
      metadata.push({ label: "Meta description has no em dash", status: "fail", note: "em dash present" });
    }
  } else {
    metadata.push({ label: "Meta description provided", status: "warn", note: "no meta description supplied" });
  }

  // ── Links & Anchors ─────────────────────────────────────────────────────
  const links = extractLinks(markdown);
  const genericLinks = links.filter((l) => GENERIC_ANCHORS.includes(l.text.toLowerCase()));
  for (const l of genericLinks) {
    flags.push(`Generic anchor text "${l.text}" — use descriptive anchor text matching the target topic.`);
  }
  const linksItems: ScorecardItem[] = [
    {
      label: "Contains links",
      status: links.length >= 2 ? "pass" : links.length === 1 ? "warn" : "warn",
      note: `${links.length} link(s)`,
    },
    {
      label: "Descriptive anchor text",
      status: genericLinks.length === 0 ? "pass" : genericLinks.length <= 2 ? "warn" : "fail",
      note: genericLinks.length ? `${genericLinks.length} generic anchor(s)` : undefined,
    },
  ];

  // ── Depth ───────────────────────────────────────────────────────────────
  const depth: ScorecardItem[] = [
    {
      label: "Content depth (word count)",
      status: words >= 400 ? "pass" : words >= 250 ? "warn" : "fail",
      note: `${words} words`,
    },
  ];

  // ── Keyword presence (optional) ─────────────────────────────────────────
  if (targetKeyword) {
    const kwCount = countOccurrences(prose, targetKeyword);
    const density = words > 0 ? kwCount / words : 0;
    depth.push({
      label: "Target keyword used naturally",
      status: kwCount === 0 ? "warn" : density > 0.03 ? "warn" : "pass",
      note:
        kwCount === 0
          ? `"${targetKeyword}" never appears`
          : density > 0.03
            ? `${kwCount}× — may be over-optimized (keyword stuffing risk)`
            : `${kwCount}×`,
    });
  }

  const categories: LintCategory[] = [
    { name: "Voice & Banned Words", items: voice },
    { name: "Structure & Headings", items: structure },
    { name: "AEO Extractability", items: aeo },
    { name: "Metadata", items: metadata },
    { name: "Links & Anchors", items: linksItems },
    { name: "Depth & Keyword", items: depth },
  ];

  return {
    categories,
    flags,
    wordCount: words,
    headingCount: { h1: h1.length, h2: h2.length, h3: h3.length },
  };
}
