import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { stripTags, decodeHtml, extractSchemaTypes } from "../../lib/html.js";

const OutputSchema = z.object({
  url: z.string(),
  statusCode: z.number(),
  title: z.string().nullable(),
  metaDescription: z.string().nullable(),
  metaDescriptionLength: z.number(),
  canonical: z.string().nullable(),
  h1: z.array(z.string()),
  h2: z.array(z.string()),
  h3: z.array(z.string()),
  wordCount: z.number(),
  hasSchema: z.boolean(),
  schemaTypes: z.array(z.string()),
  internalLinks: z.number(),
  externalLinks: z.number(),
  hasRobotsMeta: z.boolean(),
  robotsContent: z.string().nullable(),
  ogTitle: z.string().nullable(),
  ogDescription: z.string().nullable(),
  issues: z.array(z.string()),
});

export function registerFetchPageTool(server: McpServer) {
  server.registerTool(
    "seo_fetch_page",
    {
      title: "Fetch & Analyze Page",
      description:
        "Fetches a live URL and extracts all SEO signals: title, meta description, " +
        "heading structure (H1/H2/H3), word count, schema markup types, canonical URL, " +
        "internal/external link counts, OG tags, robots meta, and a list of detected issues. " +
        "Use this before any SEO analysis to get ground truth about the current state of a page.",
      inputSchema: z.object({
        url: z.string().url().describe("The full URL of the page to analyze"),
      }),
      outputSchema: OutputSchema,
    },
    async ({ url }) => {
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
          content: [
            {
              type: "text" as const,
              text: `Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }

      // ── Title ──────────────────────────────────────────────────────────────
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? decodeHtml(titleMatch[1].trim()) : null;
      if (!title) issues.push("Missing <title> tag");
      else if (title.length < 30) issues.push(`Title too short (${title.length} chars, aim for 50–60)`);
      else if (title.length > 65) issues.push(`Title too long (${title.length} chars, aim for 50–60)`);

      // ── Meta description ───────────────────────────────────────────────────
      const metaDescMatch = html.match(
        /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i
      ) || html.match(
        /<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i
      );
      const metaDescription = metaDescMatch ? decodeHtml(metaDescMatch[1].trim()) : null;
      const metaDescriptionLength = metaDescription?.length ?? 0;
      if (!metaDescription) issues.push("Missing meta description");
      else if (metaDescriptionLength < 120) issues.push(`Meta description too short (${metaDescriptionLength} chars, aim for 120–160)`);
      else if (metaDescriptionLength > 160) issues.push(`Meta description too long (${metaDescriptionLength} chars, aim for 120–160)`);

      // ── Canonical ──────────────────────────────────────────────────────────
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
      const canonical = canonicalMatch ? canonicalMatch[1] : null;
      if (!canonical) issues.push("No canonical URL set");

      // ── Headings ───────────────────────────────────────────────────────────
      const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
        stripTags(decodeHtml(m[1].trim()))
      );
      const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) =>
        stripTags(decodeHtml(m[1].trim()))
      );
      const h3Matches = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map((m) =>
        stripTags(decodeHtml(m[1].trim()))
      );
      if (h1Matches.length === 0) issues.push("No H1 tag found");
      if (h1Matches.length > 1) issues.push(`Multiple H1 tags found (${h1Matches.length}) — use only one`);

      // ── Word count ────────────────────────────────────────────────────────
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyText = bodyMatch ? stripTags(bodyMatch[1]) : stripTags(html);
      const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 0).length;
      if (wordCount < 300) issues.push(`Very thin content (${wordCount} words)`);

      // ── Schema markup ──────────────────────────────────────────────────────
      const schemaMatches = [...html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      )];
      const schemaTypes: string[] = [];
      for (const match of schemaMatches) {
        try {
          const data = JSON.parse(match[1]);
          const types = extractSchemaTypes(data);
          schemaTypes.push(...types);
        } catch {
          issues.push("Invalid JSON-LD schema detected (parse error)");
        }
      }
      const hasSchema = schemaTypes.length > 0;

      // ── Links ──────────────────────────────────────────────────────────────
      const allLinks = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
      const urlObj = new URL(url);
      const internalLinks = allLinks.filter(
        (href) => href.startsWith("/") || href.includes(urlObj.hostname)
      ).length;
      const externalLinks = allLinks.filter(
        (href) => href.startsWith("http") && !href.includes(urlObj.hostname)
      ).length;

      // ── OG tags ────────────────────────────────────────────────────────────
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
      const ogTitle = ogTitleMatch ? decodeHtml(ogTitleMatch[1]) : null;
      const ogDescription = ogDescMatch ? decodeHtml(ogDescMatch[1]) : null;
      if (!ogTitle) issues.push("Missing og:title");
      if (!ogDescription) issues.push("Missing og:description");

      // ── Robots meta ────────────────────────────────────────────────────────
      const robotsMetaMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
      const hasRobotsMeta = !!robotsMetaMatch;
      const robotsContent = robotsMetaMatch ? robotsMetaMatch[1] : null;
      if (robotsContent?.includes("noindex")) {
        issues.push("⚠️ Page has noindex — this page will NOT be indexed by search engines");
      }

      const output = {
        url,
        statusCode,
        title,
        metaDescription,
        metaDescriptionLength,
        canonical,
        h1: h1Matches,
        h2: h2Matches,
        h3: h3Matches,
        wordCount,
        hasSchema,
        schemaTypes: [...new Set(schemaTypes)],
        internalLinks,
        externalLinks,
        hasRobotsMeta,
        robotsContent,
        ogTitle,
        ogDescription,
        issues,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );
}

// Helpers are imported from mcp/lib/html.ts
