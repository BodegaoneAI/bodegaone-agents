/**
 * mcp/lib/research-lint.ts
 * Pure research-linting logic for the Researcher agent.
 * Checks a research brief for rigor: sourced claims, named (not vague) attribution, source
 * diversity, dated sources, confidence labeling, and acknowledged uncertainty. Returns
 * pass/warn/fail categories (graded with the shared grading.ts engine) plus specific flags.
 *
 * Exported here so it can be unit-tested independently of the MCP tool layer.
 */
import type { ScorecardItem } from "./grading.js";

export interface ResearchLintInput {
  markdown: string;
}

export interface ResearchLintCategory {
  name: string;
  items: ScorecardItem[];
}

export interface ResearchLintResult {
  categories: ResearchLintCategory[];
  flags: string[];
  stats: { claims: number; citations: number; distinctSources: number; vague: number };
}

// ── Patterns ──────────────────────────────────────────────────────────────────

/** Statistic-like claims that ought to carry a source. */
const STAT_RE =
  /(\b\d+(\.\d+)?\s?%|\$\s?\d[\d,]*(\.\d+)?|\b\d{1,3}(,\d{3})+\b|\b\d+(\.\d+)?\s?(million|billion|trillion|thousand|percent)\b)/gi;

/** Vague attribution with no named source. */
const VAGUE_PHRASES = [
  "studies show",
  "studies suggest",
  "research shows",
  "research suggests",
  "experts say",
  "experts agree",
  "scientists say",
  "it is widely reported",
  "it is widely known",
  "it is estimated",
  "it is believed",
  "reportedly",
  "sources say",
  "some say",
  "many believe",
  "most people",
  "everyone knows",
];

const DATE_RE =
  /\b(19|20)\d\d\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}?\b|\bq[1-4]\s?(19|20)?\d\d\b/i;

const CONFIDENCE_RE =
  /\bconfidence\b|\b(high|medium|moderate|low)[- ]confidence\b|\blikely\b|\bunlikely\b|\bprobabl|\bwe estimate\b|\bappears to\b|\bsuggests that\b/i;

const UNCERTAINTY_RE =
  /could ?n'?t verify|cannot verify|unable to verify|unverified|\bunclear\b|\bunknown\b|conflicting|no reliable source|not confirmed|\bcaveat\b|\blimitation|open question|needs? (a )?(live )?lookup/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

function countPhrase(text: string, phrase: string): number {
  const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const m = text.match(re);
  return m ? m.length : 0;
}

/** Count citation markers: links, bare URLs, "Source:", "according to X", footnotes, (Author, Year). */
function countCitations(md: string): number {
  const links = countMatches(md, /\[[^\]]+\]\([^)]+\)/g);
  const bareUrls = countMatches(md, /(^|\s)https?:\/\/\S+/g);
  const sourceLabels = countMatches(md, /\bsource:/gi);
  const accordingTo = countMatches(md, /\baccording to\s+[A-Z"']/g);
  const footnotes = countMatches(md, /\[\d+\]/g);
  const authorYear = countMatches(md, /\([A-Z][A-Za-z.'-]+,?\s+(19|20)\d\d[a-z]?\)/g);
  return links + bareUrls + sourceLabels + accordingTo + footnotes + authorYear;
}

/** Rough count of distinct sources: unique URL hosts + labelled sources. */
function countDistinctSources(md: string): number {
  const hosts = new Set<string>();
  for (const m of md.matchAll(/https?:\/\/([^/\s)]+)/g)) {
    hosts.add(m[1].replace(/^www\./, "").toLowerCase());
  }
  const labelled = countMatches(md, /\bsource:/gi) + countMatches(md, /\baccording to\s+[A-Z"']/g);
  // Labelled sources without URLs still count, but avoid double-counting host-backed ones.
  return hosts.size + Math.max(0, labelled - hosts.size > 0 ? labelled - hosts.size : 0);
}

function statusFrom(ok: boolean, weak = false): "pass" | "warn" | "fail" {
  if (ok) return "pass";
  return weak ? "warn" : "fail";
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function lintResearch(input: ResearchLintInput): ResearchLintResult {
  const md = input.markdown;
  const lower = md.toLowerCase();
  const flags: string[] = [];

  const claims = countMatches(md, STAT_RE);
  const citations = countCitations(md);
  const distinctSources = countDistinctSources(md);

  let vague = 0;
  for (const phrase of VAGUE_PHRASES) {
    const n = countPhrase(lower, phrase);
    if (n > 0) {
      vague += n;
      flags.push(`Vague attribution "${phrase}" (${n}×) — name the specific source and its date.`);
    }
  }

  const hasSourcesSection = /(^|\n)#{1,6}\s*(sources|references|citations|bibliography)\b/i.test(md);
  const hasDates = DATE_RE.test(md);
  const hasConfidence = CONFIDENCE_RE.test(md);
  const hasUncertainty = UNCERTAINTY_RE.test(md);

  // ── Sourcing ────────────────────────────────────────────────────────────
  let claimsCitedStatus: "pass" | "warn" | "fail";
  if (claims > 0 && citations === 0) claimsCitedStatus = "fail";
  else if (citations === 0) claimsCitedStatus = "warn";
  else if (claims === 0 || citations >= Math.ceil(claims / 2)) claimsCitedStatus = "pass";
  else claimsCitedStatus = "warn";
  if (claimsCitedStatus === "fail")
    flags.push(`${claims} statistic(s) with no citations. Give every number a named, dated source.`);
  else if (claimsCitedStatus === "warn" && claims > citations)
    flags.push(`More statistics (${claims}) than citations (${citations}). Some numbers are unsourced.`);

  if (!hasSourcesSection) flags.push("No Sources / References section. List every source with its type and date.");

  const sourcing: ScorecardItem[] = [
    { label: "Claims and statistics are cited", status: claimsCitedStatus, note: `${claims} stat(s), ${citations} citation(s)` },
    {
      label: "No vague attribution",
      status: vague === 0 ? "pass" : vague <= 2 ? "warn" : "fail",
      note: vague ? `${vague} vague phrase(s)` : undefined,
    },
    { label: "Sources / references section", status: statusFrom(hasSourcesSection, true) },
  ];

  // ── Rigor ───────────────────────────────────────────────────────────────
  let diversityStatus: "pass" | "warn" | "fail";
  if (distinctSources >= 3) diversityStatus = "pass";
  else if (distinctSources >= 2) diversityStatus = "warn";
  else diversityStatus = claims > 0 ? "fail" : "warn";
  if (diversityStatus !== "pass")
    flags.push(`Only ${distinctSources} distinct source(s). Verify load-bearing claims across independent sources.`);
  if (!hasDates) flags.push("No dates on sources or claims. Date each source; flag stale data.");

  const rigor: ScorecardItem[] = [
    { label: "Multiple independent sources", status: diversityStatus, note: `${distinctSources} distinct` },
    { label: "Dated sources / claims", status: statusFrom(hasDates, true) },
  ];

  // ── Honesty ─────────────────────────────────────────────────────────────
  if (!hasConfidence) flags.push("No confidence levels. Rate each key finding high / medium / low with a reason.");
  if (!hasUncertainty) flags.push("No acknowledged uncertainty. State what you could not verify and what would change the answer.");

  const honesty: ScorecardItem[] = [
    { label: "Confidence levels stated", status: statusFrom(hasConfidence, true) },
    { label: "Uncertainty / gaps acknowledged", status: statusFrom(hasUncertainty, true) },
  ];

  return {
    categories: [
      { name: "Sourcing", items: sourcing },
      { name: "Rigor", items: rigor },
      { name: "Honesty", items: honesty },
    ],
    flags,
    stats: { claims, citations, distinctSources, vague },
  };
}
