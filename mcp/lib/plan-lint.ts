/**
 * mcp/lib/plan-lint.ts
 * Pure plan-linting logic for the planner agents (project / strategy / personal).
 * Checks a plan draft for completeness against the relevant planner's standards and returns
 * pass/warn/fail categories (graded with the shared grading.ts engine) plus specific flags.
 *
 * Exported here so it can be unit-tested independently of the MCP tool layer.
 */
import type { ScorecardItem } from "./grading.js";

export type PlanType = "project" | "strategy" | "personal";

export interface PlanLintInput {
  markdown: string;
  type: PlanType;
}

export interface PlanLintCategory {
  name: string;
  items: ScorecardItem[];
}

export interface PlanLintResult {
  categories: PlanLintCategory[];
  flags: string[];
  type: PlanType;
}

// ── Detection helpers ─────────────────────────────────────────────────────────

const DATE_RE =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\bq[1-4]\b|\b20\d\d\b|\b\d{1,3}\s*(hours?|hrs?|days?|weeks?|months?|quarters?)\b|\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|this week|next week|by (eod|eow))\b/i;

function has(text: string, re: RegExp): boolean {
  return re.test(text);
}

function hasNumber(text: string): boolean {
  return /\d/.test(text);
}

function countListItems(markdown: string): number {
  return (markdown.match(/^[ \t]*([-*]|\d+\.)[ \t]+\S/gm) || []).length;
}

function statusFrom(ok: boolean, weak = false): "pass" | "warn" | "fail" {
  if (ok) return "pass";
  return weak ? "warn" : "fail";
}

// ── Per-type linters ──────────────────────────────────────────────────────────

function lintProject(md: string, lower: string, flags: string[]): PlanLintCategory[] {
  const objective = has(lower, /\bobjective\b|\bgoal\b|\boutcome\b/);
  const measurable = hasNumber(md) && has(md, DATE_RE);
  const owners = has(lower, /\bowner\b|assigned to|\bresponsible\b/) || /@\w+/.test(md) || /\|\s*owner\s*\|/i.test(md);
  const estimates = has(lower, /\b\d+\s*(hours?|hrs?|days?|weeks?|points?)\b|\bestimate\b/);
  const dod = has(lower, /definition of done|\bdod\b|acceptance|done when|success criteri/);
  const deps = has(lower, /depends on|blocked by|prerequisite|\bafter\b|dependenc/);
  const risks = has(lower, /\brisk\b|\bassumption\b|\bmitigat/);
  const milestones = has(lower, /\bmilestone\b|\bphase\b|\bdeliverable\b/);
  const next = has(lower, /next action|first action|start (with|now|here)|do first|kickoff/);

  if (!objective) flags.push("No clear objective. State the outcome in one sentence.");
  if (!measurable) flags.push("Objective is not measurable. Add a number and a date to the success criteria.");
  if (!owners) flags.push("No task owners found. Give every task one named owner.");
  if (!dod) flags.push("No definition of done. State the observable condition that ends each task.");
  if (!deps) flags.push("No dependencies noted. Mark what must finish before what (critical path).");
  if (!risks) flags.push("No risks or assumptions listed. Name the riskiest assumption and how to test it cheaply.");
  if (!next) flags.push("No clear next action. End with the one concrete task to start now.");

  return [
    {
      name: "Objective & Success",
      items: [
        { label: "Objective stated", status: statusFrom(objective) },
        { label: "Measurable success criteria (number + date)", status: statusFrom(measurable, true), note: measurable ? undefined : "add a number and a date" },
      ],
    },
    {
      name: "Tasks & Ownership",
      items: [
        { label: "Task owners named", status: statusFrom(owners) },
        { label: "Estimates present", status: statusFrom(estimates, true) },
        { label: "Definition of done", status: statusFrom(dod, true) },
      ],
    },
    {
      name: "Sequencing & Risk",
      items: [
        { label: "Dependencies noted", status: statusFrom(deps, true) },
        { label: "Risks / assumptions listed", status: statusFrom(risks, true) },
      ],
    },
    {
      name: "Actionability",
      items: [
        { label: "Milestones present", status: statusFrom(milestones, true) },
        { label: "Clear next action", status: statusFrom(next, true) },
      ],
    },
  ];
}

function lintStrategy(md: string, lower: string, flags: string[]): PlanLintCategory[] {
  const measurable = hasNumber(md) && has(md, DATE_RE);
  const segment = has(lower, /segment|target (customer|audience|market)|\bicp\b|persona|who (we|it) serve/);
  const positioning = has(lower, /position|value prop|unique|alternative|differentiat|why (we|you) win/);
  const gtm = has(lower, /go-to-market|\bgtm\b|channel|product-led|sales-led|community-led|content-led|distribution|wedge/);
  const model = has(lower, /pricing|\bprice\b|revenue|business model|\bmrr\b|\barr\b|monetiz|\$\d/);
  const metrics = has(lower, /metric|north-star|north star|\bokr\b|\bkpi\b/) && hasNumber(md);
  const assumptions = has(lower, /assumption|\brisk\b|experiment|hypothes|validate|de-risk/);

  if (!segment) flags.push("No specific target segment. Name one segment and their job to be done, not 'everyone'.");
  if (!positioning) flags.push("No positioning. State the alternatives, your unique value, and why this segment wins with you.");
  if (!gtm) flags.push("No go-to-market motion or wedge channel. Pick one channel to win first.");
  if (!metrics) flags.push("Metrics are missing or not measurable. Name a north-star number and dated OKRs.");
  if (!assumptions) flags.push("No assumptions or risks. Rank the riskiest assumption and attach a cheap experiment.");
  if (!measurable) flags.push("Objective is not measurable. Add a number and a time horizon.");

  return [
    {
      name: "Focus",
      items: [
        { label: "Measurable objective (number + horizon)", status: statusFrom(measurable, true) },
        { label: "One specific target segment", status: statusFrom(segment) },
      ],
    },
    {
      name: "Positioning & GTM",
      items: [
        { label: "Positioning stated", status: statusFrom(positioning) },
        { label: "GTM motion / wedge channel", status: statusFrom(gtm, true) },
      ],
    },
    {
      name: "Model & Metrics",
      items: [
        { label: "Pricing / business model", status: statusFrom(model, true) },
        { label: "Measurable metrics / OKRs", status: statusFrom(metrics, true) },
      ],
    },
    {
      name: "Assumptions & Risk",
      items: [
        { label: "Assumptions / risks with experiments", status: statusFrom(assumptions, true) },
      ],
    },
  ];
}

function lintPersonal(md: string, lower: string, flags: string[]): PlanLintCategory[] {
  const priority = has(lower, /\bmit\b|most important|top (priority|three|3)|today'?s focus|priority/);
  const timeBlocked = has(md, /\b\d{1,2}(:\d{2})?\s?(am|pm)\b|\b\d{1,2}:\d{2}\b/i) || has(lower, /time.?block|morning|afternoon|evening|\bblock\b/);
  const boundaries = has(lower, /defer|delegate|delete|drop|later|not today|done for today|review/);
  const items = countListItems(md);
  const overloaded = items > 10;

  if (!priority) flags.push("No single top priority. Name the one most important task (the MIT).");
  if (!timeBlocked) flags.push("No time-blocking. Assign the top tasks to specific time slots, hardest work in your best hours.");
  if (!boundaries) flags.push("Nothing deferred, delegated, or deleted. Decide explicitly what you are not doing today.");
  if (overloaded) flags.push(`The list has ${items} items. That is likely too many for one day. Cut to the few that matter.`);

  return [
    {
      name: "Focus",
      items: [
        { label: "One clear top priority (MIT)", status: statusFrom(priority) },
        {
          label: "Manageable load",
          status: overloaded ? "warn" : "pass",
          note: overloaded ? `${items} items — consider cutting` : `${items} items`,
        },
      ],
    },
    {
      name: "Actionability",
      items: [
        { label: "Time-blocked schedule", status: statusFrom(timeBlocked, true) },
      ],
    },
    {
      name: "Boundaries",
      items: [
        { label: "Deferred / delegated / deleted the rest", status: statusFrom(boundaries, true) },
      ],
    },
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function lintPlan(input: PlanLintInput): PlanLintResult {
  const { markdown, type } = input;
  const lower = markdown.toLowerCase();
  const flags: string[] = [];

  let categories: PlanLintCategory[];
  switch (type) {
    case "project":
      categories = lintProject(markdown, lower, flags);
      break;
    case "strategy":
      categories = lintStrategy(markdown, lower, flags);
      break;
    case "personal":
      categories = lintPersonal(markdown, lower, flags);
      break;
    default:
      categories = [];
  }

  return { categories, flags, type };
}
