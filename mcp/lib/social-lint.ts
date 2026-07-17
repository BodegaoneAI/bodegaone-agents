/**
 * mcp/lib/social-lint.ts
 * Pure social / short-form linting logic for the Social Content Agent.
 * Checks a platform-native post (or an X thread) against per-platform specs and
 * short-form best practice, and returns pass/warn/fail categories (graded with
 * the shared grading.ts engine) plus specific, quotable flags.
 *
 * Exported here so it can be unit-tested independently of the MCP tool layer.
 */
import type { ScorecardItem } from "./grading.js";

export type Platform = "x" | "linkedin" | "instagram" | "threads";

export interface LintInput {
  /** The post / caption body. For a thread, the full text (posts split on blank lines). */
  text: string;
  /** Target platform. */
  platform: Platform;
  /** X only: evaluate per-post limits across blank-line-separated posts. */
  isThread?: boolean;
}

export interface LintCategory {
  name: string;
  items: ScorecardItem[];
}

export interface LintResult {
  categories: LintCategory[];
  /** Specific, quotable issues (e.g. the exact bait phrase or an over-limit post). */
  flags: string[];
  charCount: number;
  platform: Platform;
}

// ── Platform specs (official platform limits) ─────────────────────────────────

/** Hard character limit per platform (official platform specs). */
export const CHAR_LIMITS: Record<Platform, number> = {
  x: 280, // standard accounts, per post
  threads: 500, // Meta Threads, per post
  linkedin: 3000, // feed post body
  instagram: 2200, // caption
};

/** Roughly where the feed truncates the visible hook (observed platform behavior). */
export const TRUNCATION: Record<Platform, number> = {
  x: 280, // the whole post shows
  threads: 500, // the whole post shows
  linkedin: 210, // "…more" collapses around 140–210 chars on mobile
  instagram: 125, // caption collapses around 125 chars
};

/** Recommended max hashtags before it reads as spammy (best practice). */
export const HASHTAG_RECOMMENDED: Record<Platform, number> = {
  x: 3,
  threads: 3,
  linkedin: 3,
  instagram: 5,
};

// ── Word lists ────────────────────────────────────────────────────────────────

/**
 * Filler / throat-clearing openers that bury the hook.
 * Single-word throat-clearers require a following space, comma, or colon so real
 * words that merely start with the same letters ("Sometimes", "Software",
 * "Threads", "Wellness") are not falsely flagged. Multi-word phrases are already
 * bounded by their internal spaces and a trailing \b.
 */
const FILLER_OPENERS =
  /^(?:(?:so|well|okay|ok|um|thread|basically|essentially|honestly)\b[\s,:]|a thread\b|here'?s (?:a|the) thread\b|in this (?:post|thread|one)\b|i (?:just )?wanted to\b|i'?m (?:going to|gonna)\b|today i\b|let'?s (?:talk|dive|get)\b|have you ever\b|as (?:we|you) (?:all )?(?:know|are aware)\b|in today'?s|when it comes to\b|there (?:are|is|was|were)\b|first and foremost\b|without a doubt\b)/i;

/** Reach-bait the platforms actively suppress. */
export const ENGAGEMENT_BAIT = [
  "tag 3 friends",
  "tag three friends",
  "tag a friend who",
  "smash that like",
  "smash the like",
  "hit that like",
  "comment below to win",
  "comment to win",
  "follow for follow",
  "follow4follow",
  "f4f",
  "like and retweet",
  "like and share",
  "like for like",
  "l4l",
  "double tap if",
];

/** Phrases that signal a genuine call to action / ask. */
export const CTA_PHRASES = [
  "sign up",
  "subscribe",
  "follow along",
  "read more",
  "learn more",
  "check out",
  "try it",
  "get started",
  "download",
  "join",
  "reply",
  "comment",
  "share this",
  "save this",
  "let me know",
  "what do you think",
  "drop a",
  "tell me",
  "dm me",
  "book a",
  "register",
  "link in reply",
  "link in bio",
];

// ── Small helpers ───────────────────────────────────────────────────────────

/** Count Unicode code points (a fairer char count than .length for emoji). */
function charLen(s: string): number {
  return [...s].length;
}

/** Split a thread into blank-line-separated posts. */
export function splitPosts(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function firstLineOf(text: string): string {
  return (text.split(/\r?\n/)[0] ?? "").trim();
}

function findUrls(text: string): string[] {
  return text.match(/(https?:\/\/|www\.)[^\s]+/gi) ?? [];
}

function countHashtags(text: string): string[] {
  return text.match(/#[A-Za-z0-9_]+/g) ?? [];
}

/** ALL-CAPS shouting words (length ≥ 4 so common short acronyms are spared). */
function shoutingWords(text: string): string[] {
  return text.match(/\b[A-Z][A-Z0-9]{3,}\b/g) ?? [];
}

/** Broad emoji/pictograph match for a rough count. */
function countEmoji(text: string): number {
  const re =
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{FE0F}]/gu;
  return (text.match(re) ?? []).length;
}

function truncate(s: string, n = 60): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

// ── Main linter ─────────────────────────────────────────────────────────────

export function lintSocial(input: LintInput): LintResult {
  const { text, platform } = input;
  const isThread = Boolean(input.isThread) && platform === "x";
  const flags: string[] = [];

  const limit = CHAR_LIMITS[platform];
  const charCount = charLen(text);
  const hasUrl = findUrls(text).length > 0;
  const firstLine = firstLineOf(text);

  // ── Length & Limits ───────────────────────────────────────────────────────
  const lengthItems: ScorecardItem[] = [];
  if (isThread) {
    const posts = splitPosts(text);
    const over = posts.filter((p) => charLen(p) > CHAR_LIMITS.x);
    const near = posts.filter(
      (p) => charLen(p) <= CHAR_LIMITS.x && charLen(p) >= Math.floor(CHAR_LIMITS.x * 0.9)
    );
    const longest = posts.reduce((m, p) => Math.max(m, charLen(p)), 0);
    lengthItems.push({
      label: "Each thread post ≤ 280",
      status: over.length > 0 ? "fail" : near.length > 0 ? "warn" : "pass",
      note: `${posts.length} post(s), longest ${longest} chars (approx.; X weights URLs as 23, emoji as 2)`,
      critical: true,
    });
    posts.forEach((p, i) => {
      const len = charLen(p);
      if (len > CHAR_LIMITS.x) {
        flags.push(
          `Thread post ${i + 1} is ${len} chars — over the 280 limit by ${len - CHAR_LIMITS.x}; split it or trim.`
        );
      }
    });
  } else {
    lengthItems.push({
      label: `Within ${platform} limit (${limit})`,
      status:
        charCount > limit ? "fail" : charCount >= Math.floor(limit * 0.9) ? "warn" : "pass",
      note: `${charCount}/${limit} chars (approx.; X weights URLs as 23, emoji as 2)`,
      critical: true,
    });
    if (charCount > limit) {
      flags.push(
        `Post is ${charCount} chars — over the ${platform} limit of ${limit} by ${charCount - limit}; cut it down or split into a thread.`
      );
    }
  }

  // ── Hook ──────────────────────────────────────────────────────────────────
  const trunc = TRUNCATION[platform];
  const firstLineLen = charLen(firstLine);
  const isFiller = FILLER_OPENERS.test(firstLine);
  const hookItems: ScorecardItem[] = [
    {
      label: "Hook lands before the fold",
      status:
        firstLineLen > trunc ? "fail" : firstLineLen >= Math.floor(trunc * 0.9) ? "warn" : "pass",
      note: `first line ${firstLineLen} chars (≈${trunc} shown on ${platform})`,
    },
    {
      label: "Opener is not filler",
      status: isFiller ? "fail" : "pass",
      note: isFiller ? "starts with throat-clearing filler" : undefined,
    },
  ];
  if (isFiller) {
    flags.push(
      `Weak hook — the opener "${truncate(firstLine)}" starts with filler; lead the first line with the payoff.`
    );
  }
  if (firstLineLen > trunc) {
    flags.push(
      `First line is ${firstLineLen} chars and truncates on ${platform} (≈${trunc} shown) — front-load the hook.`
    );
  }

  // ── Hashtags ──────────────────────────────────────────────────────────────
  const hashtags = countHashtags(text);
  const tagCount = hashtags.length;
  const recommended = HASHTAG_RECOMMENDED[platform];
  const hashtagItem: ScorecardItem = {
    label: "Hashtag discipline",
    status: "pass",
    note: `${tagCount} hashtag(s)`,
  };
  if (platform === "instagram") {
    // Instagram enforces a hard 5-hashtag cap per post/Reel (official, rolled out
    // Dec 19 2025; caption + comments combined). Over the cap blocks publishing or
    // strips the extras, so it is a critical, category-failing breach.
    hashtagItem.status = tagCount > 5 ? "fail" : "pass";
    hashtagItem.critical = true;
    hashtagItem.note = `${tagCount} hashtag(s) (hard cap 5, 3–5 recommended)`;
    if (tagCount > 5) {
      flags.push(
        `${tagCount} hashtags — Instagram enforces a hard cap of 5 per post (official, Dec 2025); more blocks publishing or strips the extras. Recommended: 3–5.`
      );
    }
  } else {
    hashtagItem.status = tagCount > recommended ? "warn" : "pass";
    hashtagItem.note = `${tagCount} hashtag(s) (≤ ${recommended} best practice)`;
    if (tagCount > recommended) {
      flags.push(
        `${tagCount} hashtags — ${platform} reads best with ≤ ${recommended}; more looks spammy and adds no reach.`
      );
    }
  }
  const hashtagItems: ScorecardItem[] = [hashtagItem];

  // ── Engagement & CTA ──────────────────────────────────────────────────────
  const lower = text.toLowerCase();
  const hasQuestion = /\?/.test(text);
  const hasCta = hasQuestion || hasUrl || CTA_PHRASES.some((p) => lower.includes(p));

  const bait = ENGAGEMENT_BAIT.filter((p) => lower.includes(p));
  for (const b of bait) {
    flags.push(`Engagement-bait "${b}" — platforms suppress reach-bait; ask a real question instead.`);
  }

  const shouts = shoutingWords(text);
  const emoji = countEmoji(text);
  const shouting = shouts.length >= 3;
  const emojiFlood = emoji > 10;
  if (shouting) {
    flags.push(`Shouting in all-caps (${shouts.slice(0, 5).join(", ")}) — use sentence case for a native feel.`);
  }
  if (emojiFlood) {
    flags.push(`${emoji} emoji — trim to a few; a wall of emoji reads as spam and hurts readability.`);
  }

  const engagementItems: ScorecardItem[] = [
    {
      label: "Clear CTA or ask",
      status: hasCta ? "pass" : "warn",
      note: hasCta ? undefined : "no question, link, or ask found",
    },
    {
      label: "No engagement-bait",
      status: bait.length === 0 ? "pass" : "warn",
      note: bait.length ? `${bait.length} bait phrase(s)` : undefined,
    },
    {
      label: "No shouting / emoji overload",
      status: shouting || emojiFlood ? "warn" : "pass",
      note:
        shouting || emojiFlood
          ? `${shouts.length} all-caps word(s), ${emoji} emoji`
          : undefined,
    },
  ];

  // ── Links ─────────────────────────────────────────────────────────────────
  const xLinkPenalty = platform === "x" && hasUrl;
  if (xLinkPenalty) {
    flags.push(
      `Raw link in an X post can cut organic reach (observed pattern) — move the URL to a reply and say "link in reply".`
    );
  }
  const linkItems: ScorecardItem[] = [
    {
      label: "Link placement (X reach)",
      status: xLinkPenalty ? "warn" : "pass",
      note: xLinkPenalty
        ? "URL in the post body — put it in a reply"
        : platform === "x"
          ? "no in-body link"
          : "not applicable off X",
    },
  ];

  const categories: LintCategory[] = [
    { name: "Length & Limits", items: lengthItems },
    { name: "Hook", items: hookItems },
    { name: "Hashtags", items: hashtagItems },
    { name: "Engagement & CTA", items: engagementItems },
    { name: "Links", items: linkItems },
  ];

  return { categories, flags, charCount, platform };
}
