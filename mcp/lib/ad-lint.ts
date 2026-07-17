/**
 * mcp/lib/ad-lint.ts
 * Pure ad-copy linting logic for the Ad Copy / Paid Media agent.
 * Checks Google Responsive Search Ad and Meta ad copy against the platforms'
 * asset specs and editorial policies, plus CTA and UTM tracking best practices,
 * and returns pass/warn/fail categories (graded with the shared grading.ts
 * engine) plus specific, quotable flags.
 *
 * Passing these checks is NOT a guarantee of ad approval — platform human and
 * automated policy review still applies. The linter catches the mechanical and
 * policy issues you can catch before you submit.
 *
 * Exported here so it can be unit-tested independently of the MCP tool layer.
 */
import type { ScorecardItem } from "./grading.js";

export type AdPlatform = "google" | "meta";

export interface AdLintInput {
  /** Which platform's specs and policies to check against. */
  platform: AdPlatform;
  /** Google RSA headlines, or Meta headline(s). */
  headlines?: string[];
  /** Google RSA descriptions, or Meta link description(s). */
  descriptions?: string[];
  /** Meta primary text / body copy. */
  primaryText?: string;
  /** Final / landing URL, checked for UTM parameters. */
  url?: string;
}

export interface LintCategory {
  name: string;
  items: ScorecardItem[];
}

export interface AdLintResult {
  categories: LintCategory[];
  /** Specific, quotable issues (e.g. the exact headline over the limit). */
  flags: string[];
}

// ── Official platform specs (character limits & asset counts) ──────────────────

/** Google Responsive Search Ad official specs. */
export const GOOGLE_HEADLINE_MAX = 30;
export const GOOGLE_HEADLINE_SLOTS = 15;
export const GOOGLE_DESCRIPTION_MAX = 90;
export const GOOGLE_DESCRIPTION_SLOTS = 4;

/** Meta (Facebook/Instagram) recommended asset specs. */
export const META_HEADLINE_MAX = 40;
export const META_DESCRIPTION_MAX = 30;
export const META_PRIMARY_TEXT_MAX = 125;

// ── Policy & persuasion word lists ─────────────────────────────────────────────

/** Unverifiable superlatives that need documented third-party proof (official policy). */
export const SUPERLATIVES = [
  "best",
  "#1",
  "number one",
  "world's best",
  "top-rated",
];

/** Clear call-to-action verbs (best practice). */
export const CTA_VERBS = [
  "get",
  "start",
  "try",
  "buy",
  "shop",
  "book",
  "download",
  "sign up",
  "learn",
  "see",
];

// ── Small helpers ──────────────────────────────────────────────────────────────

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Words written in all caps (≥4 letters) — Google/Meta flag excessive capitalization. */
function shoutingWords(text: string): string[] {
  return text.match(/\b[A-Z]{4,}\b/g) || [];
}

/** Repeated / gimmicky punctuation: !!!, ??, ..., ?! etc. A single "!" does not match. */
const GIMMICKY_PUNCT_RE = /!{2,}|\?{2,}|\.{3,}|[!?]{2,}/;

/** True if a string contains a phone-number-like run (7+ digits, optionally grouped). */
function hasPhoneNumber(text: string): boolean {
  const m = text.match(/\+?\d[\d\s().\-]{5,}\d/);
  if (!m) return false;
  const digits = (m[0].match(/\d/g) || []).length;
  return digits >= 7;
}

/** True if a URL carries a given query parameter (?param= or &param=). */
function hasParam(url: string, param: string): boolean {
  return new RegExp(`[?&]${escapeRe(param)}=`, "i").test(url);
}

// ── Main linter ────────────────────────────────────────────────────────────────

export function lintAd(input: AdLintInput): AdLintResult {
  const { platform } = input;
  const headlines = (input.headlines ?? []).map((h) => h ?? "");
  const descriptions = (input.descriptions ?? []).map((d) => d ?? "");
  const primaryText = input.primaryText;
  const url = input.url;
  const flags: string[] = [];

  const allText = [...headlines, ...descriptions, ...(primaryText ? [primaryText] : [])].filter(
    (t) => t.trim().length > 0
  );

  // ── Character Limits ──────────────────────────────────────────────────────
  const limits: ScorecardItem[] = [];
  if (platform === "google") {
    const over = headlines.filter((h) => h.length > GOOGLE_HEADLINE_MAX);
    for (const h of over) {
      flags.push(
        `Headline over ${GOOGLE_HEADLINE_MAX} chars (${h.length}): "${h}" — Google will not run it. Trim to ${GOOGLE_HEADLINE_MAX}.`
      );
    }
    // A single over-limit asset is a hard breach (Google rejects it), so this
    // item is `critical` — one failure fails the whole Character Limits category.
    limits.push({
      label: `Headlines ≤ ${GOOGLE_HEADLINE_MAX} chars (Google RSA spec)`,
      status: headlines.length === 0 ? "warn" : over.length === 0 ? "pass" : "fail",
      note:
        headlines.length === 0
          ? "no headlines provided — Google needs at least 3"
          : over.length
            ? `${over.length} over the limit`
            : `${headlines.length} headline(s) within limit`,
      critical: over.length > 0,
    });

    // Headline count: Google's create-time minimum (3) and maximum (15) are hard
    // requirements. Breaching either is critical; 3–14 is a WARN nudge to add more.
    let hcStatus: "pass" | "warn" | "fail";
    let hcNote: string;
    let hcCritical = false;
    if (headlines.length > GOOGLE_HEADLINE_SLOTS) {
      hcStatus = "fail";
      hcCritical = true;
      hcNote = `${headlines.length} provided — Google allows at most ${GOOGLE_HEADLINE_SLOTS}`;
      flags.push(
        `${headlines.length} headlines provided — Google Responsive Search Ads allow at most ${GOOGLE_HEADLINE_SLOTS}. Remove ${headlines.length - GOOGLE_HEADLINE_SLOTS}.`
      );
    } else if (headlines.length < 3) {
      hcStatus = "fail";
      hcCritical = true;
      hcNote = `${headlines.length} provided — Google needs at least 3`;
      flags.push(
        `Only ${headlines.length} headline(s) — Google requires at least 3 headlines to run a Responsive Search Ad. Add more.`
      );
    } else if (headlines.length === GOOGLE_HEADLINE_SLOTS) {
      hcStatus = "pass";
      hcNote = `${GOOGLE_HEADLINE_SLOTS}/${GOOGLE_HEADLINE_SLOTS} — at capacity`;
    } else {
      hcStatus = "warn";
      hcNote = `${headlines.length}/${GOOGLE_HEADLINE_SLOTS} — add more so Ad Strength has assets to mix`;
    }
    limits.push({
      label: `Headline assets provided (3–${GOOGLE_HEADLINE_SLOTS})`,
      status: hcStatus,
      note: hcNote,
      critical: hcCritical,
    });

    const descOver = descriptions.filter((d) => d.length > GOOGLE_DESCRIPTION_MAX);
    for (const d of descOver) {
      flags.push(
        `Description over ${GOOGLE_DESCRIPTION_MAX} chars (${d.length}): "${d}" — Google will not run it. Trim to ${GOOGLE_DESCRIPTION_MAX}.`
      );
    }
    limits.push({
      label: `Descriptions ≤ ${GOOGLE_DESCRIPTION_MAX} chars (Google RSA spec)`,
      status: descriptions.length === 0 ? "warn" : descOver.length === 0 ? "pass" : "fail",
      note:
        descriptions.length === 0
          ? "no descriptions provided — Google needs at least 2"
          : descOver.length
            ? `${descOver.length} over the limit`
            : `${descriptions.length} description(s) within limit`,
      critical: descOver.length > 0,
    });

    // Description count: minimum 2, maximum 4, both hard requirements.
    let dcStatus: "pass" | "warn" | "fail";
    let dcNote: string;
    let dcCritical = false;
    if (descriptions.length > GOOGLE_DESCRIPTION_SLOTS) {
      dcStatus = "fail";
      dcCritical = true;
      dcNote = `${descriptions.length} provided — Google allows at most ${GOOGLE_DESCRIPTION_SLOTS}`;
      flags.push(
        `${descriptions.length} descriptions provided — Google allows at most ${GOOGLE_DESCRIPTION_SLOTS}. Remove ${descriptions.length - GOOGLE_DESCRIPTION_SLOTS}.`
      );
    } else if (descriptions.length < 2) {
      dcStatus = "fail";
      dcCritical = true;
      dcNote = `${descriptions.length} provided — Google needs at least 2`;
      flags.push(
        `Only ${descriptions.length} description(s) — Google requires at least 2 descriptions to run a Responsive Search Ad. Add more.`
      );
    } else {
      dcStatus = "pass";
      dcNote = `${descriptions.length}/${GOOGLE_DESCRIPTION_SLOTS}`;
    }
    limits.push({
      label: `Description assets provided (2–${GOOGLE_DESCRIPTION_SLOTS})`,
      status: dcStatus,
      note: dcNote,
      critical: dcCritical,
    });
  } else {
    const hlOver = headlines.filter((h) => h.length > META_HEADLINE_MAX);
    for (const h of hlOver) {
      flags.push(
        `Meta headline over ~${META_HEADLINE_MAX} chars (${h.length}): "${h}" — it may be truncated on some placements.`
      );
    }
    limits.push({
      label: `Headline ≤ ~${META_HEADLINE_MAX} chars (Meta recommended)`,
      status: hlOver.length === 0 ? "pass" : "warn",
      note: hlOver.length
        ? `${hlOver.length} over the recommendation`
        : headlines.length
          ? `${headlines.length} headline(s) within limit`
          : "no headline provided",
      critical: hlOver.length > 0,
    });

    const ldOver = descriptions.filter((d) => d.length > META_DESCRIPTION_MAX);
    for (const d of ldOver) {
      flags.push(
        `Meta link description over ~${META_DESCRIPTION_MAX} chars (${d.length}): "${d}" — it may be truncated.`
      );
    }
    limits.push({
      label: `Link description ≤ ~${META_DESCRIPTION_MAX} chars (Meta recommended)`,
      status: ldOver.length === 0 ? "pass" : "warn",
      note: ldOver.length
        ? `${ldOver.length} over the recommendation`
        : descriptions.length
          ? `${descriptions.length} link description(s) within limit`
          : "no link description provided",
      critical: ldOver.length > 0,
    });

    const ptLen = primaryText?.length ?? 0;
    if (primaryText && ptLen > META_PRIMARY_TEXT_MAX) {
      flags.push(
        `Primary text is ${ptLen} chars — Meta truncates around ${META_PRIMARY_TEXT_MAX} with a "See more". Front-load the hook and the offer.`
      );
    }
    limits.push({
      label: `Primary text ≤ ~${META_PRIMARY_TEXT_MAX} chars before "See more" (Meta recommended)`,
      status: !primaryText ? "warn" : ptLen > META_PRIMARY_TEXT_MAX ? "warn" : "pass",
      note: !primaryText ? "no primary text provided" : `${ptLen} chars`,
      critical: !!primaryText && ptLen > META_PRIMARY_TEXT_MAX,
    });
  }

  // ── Ad Policy Compliance (official editorial policy) ───────────────────────
  const policy: ScorecardItem[] = [];

  const shouting = new Set<string>();
  for (const t of allText) for (const w of shoutingWords(t)) shouting.add(w);
  if (shouting.size > 0) {
    flags.push(
      `Excessive capitalization: ${[...shouting].map((w) => `"${w}"`).join(", ")} — Google and Meta ban all-caps for emphasis. Use sentence or title case (a single legitimate acronym or trademark is fine).`
    );
  }
  // A lone all-caps run is usually a real acronym or trademark (HIPAA, NASA), so
  // it only warns; two or more reads as shouting for emphasis and fails.
  policy.push({
    label: "No excessive capitalization (all-caps)",
    status: shouting.size === 0 ? "pass" : shouting.size === 1 ? "warn" : "fail",
    note: shouting.size ? `${shouting.size} all-caps word(s)` : undefined,
  });

  const gimmicky = allText.filter((t) => GIMMICKY_PUNCT_RE.test(t));
  for (const t of gimmicky) {
    flags.push(`Gimmicky or repeated punctuation in "${t}" — remove "!!!", "??", "..." and other repeated symbols.`);
  }
  policy.push({
    label: "No gimmicky or repeated punctuation",
    status: gimmicky.length === 0 ? "pass" : "fail",
    note: gimmicky.length ? `${gimmicky.length} instance(s)` : undefined,
  });

  if (platform === "google") {
    const bangHeadlines = headlines.filter((h) => h.includes("!"));
    for (const h of bangHeadlines) {
      flags.push(
        `Exclamation mark in Google headline "${h}" — Google does not allow exclamation marks in headlines (allowed in descriptions only).`
      );
    }
    policy.push({
      label: "No exclamation marks in headlines (Google policy)",
      status: bangHeadlines.length === 0 ? "pass" : "fail",
      note: bangHeadlines.length ? `${bangHeadlines.length} headline(s) with "!"` : undefined,
    });
  }

  const supers = new Set<string>();
  for (const t of allText) {
    for (const s of SUPERLATIVES) {
      const re = s === "#1" ? /#1\b/ : new RegExp(`\\b${escapeRe(s)}\\b`, "i");
      if (re.test(t)) supers.add(s);
    }
  }
  if (supers.size > 0) {
    flags.push(
      `Unverifiable superlative(s): ${[...supers].map((s) => `"${s}"`).join(", ")} — claims like "best" or "#1" need documented third-party proof or they breach editorial policy. Remove or substantiate.`
    );
  }
  policy.push({
    label: "Superlatives backed by proof",
    status: supers.size === 0 ? "pass" : "warn",
    note: supers.size ? `${supers.size} unverified superlative(s)` : undefined,
  });

  const phoneHeadlines = headlines.filter((h) => hasPhoneNumber(h));
  for (const h of phoneHeadlines) {
    flags.push(`Phone number in headline "${h}" — put the number in a call asset or call extension, not the headline text.`);
  }
  policy.push({
    label: "No phone number in headlines",
    status: phoneHeadlines.length === 0 ? "pass" : "warn",
    note: phoneHeadlines.length ? `${phoneHeadlines.length} headline(s)` : undefined,
  });

  // ── Persuasion & CTA ──────────────────────────────────────────────────────
  const combined = allText.join(" \n ");
  const hasCta = CTA_VERBS.some((v) => new RegExp(`\\b${escapeRe(v)}\\b`, "i").test(combined));
  if (!hasCta) {
    flags.push(`No clear call to action. Add one CTA verb such as ${CTA_VERBS.slice(0, 6).join(", ")}.`);
  }
  const hasNumberOrOffer = /\d/.test(combined) || /%|\$|\bfree\b|\boff\b|\bsave\b|\bsale\b|\bdeal\b/i.test(combined);
  if (!hasNumberOrOffer) {
    flags.push(`Copy is entirely generic — add a concrete number, price, or offer (e.g. "20% off", "$49", "3-day free trial").`);
  }
  const persuasion: ScorecardItem[] = [
    {
      label: "Clear call-to-action verb present",
      status: hasCta ? "pass" : "warn",
      note: hasCta ? undefined : "no CTA verb found",
    },
    {
      label: "Concrete number or offer (not generic)",
      status: hasNumberOrOffer ? "pass" : "warn",
      note: hasNumberOrOffer ? undefined : "no number, price, or offer found",
    },
  ];

  // ── Tracking (UTM) ────────────────────────────────────────────────────────
  const tracking: ScorecardItem[] = [];
  if (url && url.trim().length > 0) {
    const core: { p: string; label: string }[] = [
      { p: "utm_source", label: "utm_source present" },
      { p: "utm_medium", label: "utm_medium present" },
      { p: "utm_campaign", label: "utm_campaign present" },
    ];
    for (const { p, label } of core) {
      const present = hasParam(url, p);
      if (!present) flags.push(`Destination URL is missing ${p} — add it so this ad's traffic is attributable.`);
      tracking.push({ label, status: present ? "pass" : "warn", note: present ? undefined : "missing" });
    }
  } else {
    tracking.push({
      label: "UTM tracking (not checked)",
      status: "pass",
      note: "no URL provided — add a UTM-tagged destination URL and re-lint",
    });
  }

  const categories: LintCategory[] = [
    { name: "Character Limits", items: limits },
    { name: "Ad Policy Compliance", items: policy },
    { name: "Persuasion & CTA", items: persuasion },
    { name: "Tracking (UTM)", items: tracking },
  ];

  return { categories, flags };
}
