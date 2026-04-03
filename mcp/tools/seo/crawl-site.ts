import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzePage, pathLabel } from "../../lib/analyze-page.js";
import type { PageResult } from "../../lib/analyze-page.js";

const UA = "BodegaOneAgents/1.0 (+https://github.com/BodegaoneAI/bodegaone-agents)";

/**
 * Fetch a sitemap (or sitemap index) and return all <loc> URLs found.
 * Handles sitemap index → sub-sitemaps → locs automatically.
 */
async function fetchSitemapUrls(sitemapUrl: string, visited = new Set<string>()): Promise<string[]> {
  if (visited.has(sitemapUrl)) return [];
  visited.add(sitemapUrl);

  let xml: string;
  try {
    const res = await fetch(sitemapUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) return [];
    xml = await res.text();
  } catch {
    return [];
  }

  // Sitemap index — recurse into sub-sitemaps
  if (xml.includes("<sitemapindex")) {
    const subSitemaps = [...xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi)].map(
      (m) => m[1].trim()
    );
    const nested = await Promise.all(
      subSitemaps.map((url) => fetchSitemapUrls(url, visited))
    );
    return nested.flat();
  }

  // Regular urlset
  return [...xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi)].map((m) =>
    m[1].trim()
  );
}

/**
 * Discover the sitemap URL for a domain by trying common locations and robots.txt.
 */
async function discoverSitemap(origin: string): Promise<string | null> {
  // Try robots.txt first
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/^Sitemap:\s*(https?:\/\/\S+)/im);
      if (match) return match[1].trim();
    }
  } catch { /* ignore */ }

  // Try common sitemap locations
  const candidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
    `${origin}/sitemap/sitemap.xml`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) {
        const text = await res.text();
        if (text.includes("<urlset") || text.includes("<sitemapindex")) return url;
      }
    } catch { /* ignore */ }
  }

  return null;
}

/**
 * Fallback: crawl internal links from the homepage up to maxPages.
 */
async function crawlFromHomepage(origin: string, maxPages: number): Promise<string[]> {
  const visited = new Set<string>();
  const queue = [origin + "/"];
  const found: string[] = [];

  while (queue.length > 0 && found.length < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) continue;
      const html = await res.text();
      found.push(url);

      // Extract internal links
      const links = [...html.matchAll(/href=["']([^"'#?]+)["']/gi)]
        .map((m) => m[1])
        .filter((href) => href.startsWith("/") && !href.match(/\.(css|js|png|jpg|gif|svg|ico|woff|pdf)$/i))
        .map((href) => `${origin}${href}`)
        .filter((u) => !visited.has(u));

      for (const link of links) {
        if (!queue.includes(link)) queue.push(link);
      }
    } catch { /* skip failed pages */ }
  }

  return found;
}

export function registerCrawlSiteTool(server: McpServer) {
  server.registerTool(
    "seo_crawl_site",
    {
      title: "Crawl & Audit Entire Site",
      description:
        "Discovers all pages on a site via sitemap.xml (or by crawling internal links " +
        "if no sitemap exists) and runs an SEO check on each one. Gives you a site-wide " +
        "view of issues, which pages are clean, and where the worst problems are. " +
        "Use this instead of seo_fetch_page when you want to audit the whole site, " +
        "not just the homepage.",
      inputSchema: z.object({
        url: z
          .string()
          .url()
          .describe("Any URL on the site (homepage is fine, e.g. https://example.com)"),
        maxPages: z
          .number()
          .min(1)
          .max(200)
          .optional()
          .default(50)
          .describe("Max pages to scan (default 50, max 200)"),
      }),
    },
    async ({ url, maxPages }) => {
      const origin = (() => {
        try {
          const u = new URL(url);
          return `${u.protocol}//${u.hostname}`;
        } catch {
          return url;
        }
      })();
      const host = origin.replace(/^https?:\/\//, "").replace(/^www\./, "");

      // Step 1: discover sitemap
      const sitemapUrl = await discoverSitemap(origin);
      let pages: string[] = [];
      let sourceLabel = "internal link crawl (no sitemap found)";

      if (sitemapUrl) {
        pages = await fetchSitemapUrls(sitemapUrl);
        sourceLabel = `sitemap (${sitemapUrl.replace(origin, "")})`;
      }

      if (pages.length === 0) {
        // Fallback: crawl internal links
        pages = await crawlFromHomepage(origin, maxPages);
        sourceLabel = "internal link crawl (no sitemap found)";
      }

      // Deduplicate, filter to same domain, cap at maxPages
      const seen = new Set<string>();
      const filtered: string[] = [];
      for (const p of pages) {
        try {
          const u = new URL(p);
          if (u.hostname !== new URL(origin).hostname) continue;
          // Skip assets and query strings
          if (p.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|pdf|zip)(\?|$)/i)) continue;
          const normalized = `${u.origin}${u.pathname}`.replace(/\/$/, "") || u.origin;
          if (!seen.has(normalized)) {
            seen.add(normalized);
            filtered.push(p);
          }
        } catch { /* skip malformed */ }
      }
      const toScan = filtered.slice(0, maxPages);

      if (toScan.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `## ${host} — Site Audit\n\n❌ Couldn't find any pages to scan. Check that the site is publicly accessible.`,
            },
          ],
        };
      }

      // Step 2: analyze each page (with a small delay to be polite)
      const results: PageResult[] = [];
      for (const pageUrl of toScan) {
        const result = await analyzePage(pageUrl);
        results.push(result);
        // Small delay to avoid hammering the server
        if (toScan.indexOf(pageUrl) < toScan.length - 1) {
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      // Step 3: aggregate
      const ok = results.filter((r): r is PageResult & { kind: "ok" } => r.kind === "ok");
      const errors = results.filter((r) => r.kind === "error");
      const clean = ok.filter((r) => r.issues.length === 0);
      const withIssues = ok.filter((r) => r.issues.length > 0);

      // Tally issue types across all pages
      const issueCounts = new Map<string, number>();
      for (const r of ok) {
        for (const issue of r.issues) {
          // Normalize the issue to a readable category
          const key = normalizeIssue(issue);
          issueCounts.set(key, (issueCounts.get(key) ?? 0) + 1);
        }
      }

      // Sort pages: most issues first
      const sorted = [...ok].sort((a, b) => b.issues.length - a.issues.length);

      // ── Format output ──────────────────────────────────────────────────────
      const lines: string[] = [
        `## ${host} — Site Audit (${ok.length} pages)`,
        `Source: ${sourceLabel}`,
        ``,
      ];

      // Quick summary line
      const overallStatus = withIssues.length === 0 ? "✅ All clean" : withIssues.length <= 2 ? "⚠️  A few pages need attention" : "❌ Several pages have issues";
      lines.push(`${overallStatus} · **${clean.length}** clean · **${withIssues.length}** with issues · **${errors.length}** failed to load`);
      lines.push(``);

      // Page table
      lines.push(`| Page | Words | Schema | Issues |`);
      lines.push(`|------|-------|--------|--------|`);

      for (const r of sorted) {
        const path = pathLabel(r.url);
        const schema = r.schemaTypes.length > 0
          ? r.schemaTypes.map((t) => t.replace("Organization", "Org").replace("BlogPosting", "Blog").replace("FAQPage", "FAQ").replace("Article", "Art")).join(", ")
          : "–";
        const issueCell = r.issues.length === 0
          ? "✅"
          : r.issues.length >= 3
            ? `❌ ${r.issues.length}`
            : `⚠️  ${r.issues.length}`;
        lines.push(
          `| ${path} | ${r.wordCount.toLocaleString()} | ${schema} | ${issueCell} |`
        );
      }

      if (errors.length > 0) {
        for (const e of errors) {
          lines.push(`| ${pathLabel(e.url)} | – | – | ❌ fetch failed |`);
        }
      }

      // Top issues across the site
      if (issueCounts.size > 0) {
        lines.push(``, `**Top issues across site:**`);
        const sorted = [...issueCounts.entries()].sort((a, b) => b[1] - a[1]);
        for (const [issue, count] of sorted) {
          const icon = count >= 3 ? "❌" : "⚠️ ";
          lines.push(`  ${icon} ${count}/${ok.length} pages — ${issue}`);
        }
      }

      // Worst pages
      const worst = sorted.filter((r) => r.issues.length >= 2).slice(0, 5);
      if (worst.length > 0) {
        lines.push(``, `**Pages needing the most work:**`);
        for (const r of worst) {
          lines.push(`  · ${pathLabel(r.url)} — ${r.issues.length} issues`);
          for (const issue of r.issues.slice(0, 3)) {
            lines.push(`    - ${issue}`);
          }
          if (r.issues.length > 3) lines.push(`    - …and ${r.issues.length - 3} more`);
        }
      }

      lines.push(``, `Run \`seo_save_report\` with these findings to generate a full audit file.`);
      if (toScan.length < filtered.length) {
        lines.push(`*Scanned ${toScan.length} of ${filtered.length} pages found. Raise maxPages to scan more.*`);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}

/** Collapse variable parts of issue messages into a consistent category label */
function normalizeIssue(issue: string): string {
  if (issue.startsWith("Missing <title>")) return "Missing title tag";
  if (issue.startsWith("Title too short") || issue.startsWith("Title too long")) return "Title length out of range";
  if (issue.startsWith("Missing meta description")) return "Missing meta description";
  if (issue.startsWith("Meta description too short") || issue.startsWith("Meta description too long")) return "Meta description length out of range";
  if (issue.startsWith("No canonical")) return "No canonical URL set";
  if (issue.startsWith("No H1")) return "Missing H1";
  if (issue.startsWith("Multiple H1")) return "Multiple H1 tags";
  if (issue.startsWith("Thin content")) return "Thin content (<300 words)";
  if (issue.startsWith("Missing og:title")) return "Missing og:title";
  if (issue.startsWith("Missing og:description")) return "Missing og:description";
  if (issue.includes("noindex")) return "Page has noindex set";
  if (issue.startsWith("Invalid JSON-LD")) return "Invalid JSON-LD schema";
  return issue;
}
