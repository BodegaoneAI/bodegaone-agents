/**
 * mcp/lib/analyze-page.ts
 * Shared page analysis logic used by seo_fetch_page and seo_crawl_site.
 */
import { stripTags, decodeHtml, extractSchemaTypes } from "./html.js";

export interface PageAnalysis {
  url: string;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  metaDescriptionLength: number;
  canonical: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  wordCount: number;
  hasSchema: boolean;
  schemaTypes: string[];
  internalLinks: number;
  externalLinks: number;
  hasRobotsMeta: boolean;
  robotsContent: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  issues: string[];
}

export type PageResult =
  | ({ kind: "ok" } & PageAnalysis)
  | { kind: "error"; url: string; error: string };

export async function analyzePage(url: string): Promise<PageResult> {
  const issues: string[] = [];
  let html: string;
  let statusCode: number;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "BodegaOneAgents/1.0 (+https://github.com/BodegaoneAI/bodegaone-agents)",
      },
    });
    statusCode = res.status;
    html = await res.text();
  } catch (err) {
    return {
      kind: "error",
      url,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── Title ──────────────────────────────────────────────────────────────────
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtml(titleMatch[1].trim()) : null;
  if (!title) issues.push("Missing <title> tag");
  else if (title.length < 30) issues.push(`Title too short (${title.length} chars, aim for 50–60)`);
  else if (title.length > 65) issues.push(`Title too long (${title.length} chars, trim to under 65)`);

  // ── Meta description ───────────────────────────────────────────────────────
  const metaDescMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) ||
    html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
  const metaDescription = metaDescMatch ? decodeHtml(metaDescMatch[1].trim()) : null;
  const metaDescriptionLength = metaDescription?.length ?? 0;
  if (!metaDescription) issues.push("Missing meta description");
  else if (metaDescriptionLength < 120)
    issues.push(`Meta description too short (${metaDescriptionLength} chars, aim for 120–160)`);
  else if (metaDescriptionLength > 160)
    issues.push(`Meta description too long (${metaDescriptionLength} chars, trim to under 160)`);

  // ── Canonical ──────────────────────────────────────────────────────────────
  const canonicalMatch =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : null;
  if (!canonical) issues.push("No canonical URL set");

  // ── Headings ───────────────────────────────────────────────────────────────
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    stripTags(decodeHtml(m[1].trim()))
  );
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) =>
    stripTags(decodeHtml(m[1].trim()))
  );
  const h3 = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map((m) =>
    stripTags(decodeHtml(m[1].trim()))
  );
  if (h1.length === 0) issues.push("No H1 tag found");
  if (h1.length > 1) issues.push(`Multiple H1 tags (${h1.length}) — use only one`);

  // ── Word count ─────────────────────────────────────────────────────────────
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = bodyMatch ? stripTags(bodyMatch[1]) : stripTags(html);
  const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount < 300) issues.push(`Thin content (${wordCount} words — aim for 300+)`);

  // ── Schema markup ──────────────────────────────────────────────────────────
  const schemaMatches = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  const schemaTypes: string[] = [];
  for (const match of schemaMatches) {
    try {
      const data = JSON.parse(match[1]);
      schemaTypes.push(...extractSchemaTypes(data));
    } catch {
      issues.push("Invalid JSON-LD schema (parse error)");
    }
  }

  // ── Links ──────────────────────────────────────────────────────────────────
  const allLinks = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
  const urlObj = new URL(url);
  const internalLinks = allLinks.filter(
    (href) => href.startsWith("/") || href.includes(urlObj.hostname)
  ).length;
  const externalLinks = allLinks.filter(
    (href) => href.startsWith("http") && !href.includes(urlObj.hostname)
  ).length;

  // ── OG tags ────────────────────────────────────────────────────────────────
  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  );
  const ogDescMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
  );
  const ogTitle = ogTitleMatch ? decodeHtml(ogTitleMatch[1]) : null;
  const ogDescription = ogDescMatch ? decodeHtml(ogDescMatch[1]) : null;
  if (!ogTitle) issues.push("Missing og:title");
  if (!ogDescription) issues.push("Missing og:description");

  // ── Robots meta ────────────────────────────────────────────────────────────
  const robotsMetaMatch = html.match(
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i
  );
  const hasRobotsMeta = !!robotsMetaMatch;
  const robotsContent = robotsMetaMatch ? robotsMetaMatch[1] : null;
  if (robotsContent?.includes("noindex")) {
    issues.push("Page has noindex — will NOT be indexed by search engines");
  }

  return {
    kind: "ok",
    url,
    statusCode,
    title,
    metaDescription,
    metaDescriptionLength,
    canonical,
    h1,
    h2,
    h3,
    wordCount,
    hasSchema: schemaTypes.length > 0,
    schemaTypes: [...new Set(schemaTypes)],
    internalLinks,
    externalLinks,
    hasRobotsMeta,
    robotsContent,
    ogTitle,
    ogDescription,
    issues,
  };
}

/** One-liner path label: strips protocol + hostname, keeps just the path */
export function pathLabel(url: string): string {
  try {
    const p = new URL(url).pathname;
    return p === "/" ? "/" : p.replace(/\/$/, "");
  } catch {
    return url;
  }
}

/** Format a single page analysis as readable markdown */
export function formatPageAnalysis(r: PageResult & { kind: "ok" }): string {
  const path = pathLabel(r.url);
  const host = new URL(r.url).hostname.replace(/^www\./, "");
  const label = path === "/" ? host : `${host}${path}`;

  const titleInfo = r.title
    ? `"${r.title.slice(0, 60)}${r.title.length > 60 ? "…" : ""}" (${r.title.length} chars)`
    : "missing";
  const descInfo = r.metaDescription
    ? `${r.metaDescriptionLength} chars`
    : "missing";
  const canonInfo = r.canonical ? "✅" : "❌ not set";
  const ogInfo = [r.ogTitle ? "title ✅" : "title ❌", r.ogDescription ? "desc ✅" : "desc ❌"].join(" · ");
  const schemaInfo = r.schemaTypes.length > 0 ? r.schemaTypes.join(", ") : "none";
  const headingInfo = `${r.h1.length} H1 · ${r.h2.length} H2 · ${r.h3.length} H3`;

  const issueIcon = (msg: string) =>
    msg.toLowerCase().includes("noindex") || msg.startsWith("Missing") || msg.startsWith("No ") || msg.startsWith("Thin") || msg.startsWith("Multiple") || msg.startsWith("Invalid")
      ? "❌"
      : "⚠️ ";

  const lines: string[] = [
    `## ${label} — SEO Check`,
    ``,
    `**Status:** ${r.statusCode} · **Canonical:** ${canonInfo}`,
    `**Title:** ${titleInfo}`,
    `**Description:** ${descInfo}`,
    ``,
    `**Headings:** ${headingInfo} · **Words:** ${r.wordCount.toLocaleString()}`,
    `**Schema:** ${schemaInfo}`,
    `**Links:** ${r.internalLinks} internal · ${r.externalLinks} external · **OG:** ${ogInfo}`,
  ];

  if (r.issues.length === 0) {
    lines.push(``, `✅ No issues found.`);
  } else {
    lines.push(``, `**${r.issues.length} issue${r.issues.length !== 1 ? "s" : ""}:**`);
    for (const issue of r.issues) {
      lines.push(`  ${issueIcon(issue)} ${issue}`);
    }
  }

  return lines.join("\n");
}
