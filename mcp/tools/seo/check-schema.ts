import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerCheckSchemaTool(server: McpServer) {
  server.registerTool(
    "seo_check_schema",
    {
      title: "Validate Schema Markup",
      description:
        "Validates JSON-LD structured data on a page. Checks required fields per " +
        "schema.org spec, flags missing high-value schema types, and calls out GEO " +
        "citation opportunities (FAQPage, HowTo, etc.).",
      inputSchema: z.object({
        url: z.string().url().describe("The page URL to check for schema markup"),
      }),
    },
    async ({ url }) => {
      let html: string;
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "BodegaOneAgents/1.0 (+https://github.com/BodegaoneAI/bodegaone-agents)",
          },
        });
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

      const schemaBlocks = [
        ...html.matchAll(
          /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        ),
      ];

      const results: Array<{
        index: number;
        type: string;
        valid: boolean;
        issues: string[];
        recommendations: string[];
      }> = [];

      const foundTypes: string[] = [];

      for (let i = 0; i < schemaBlocks.length; i++) {
        const raw = schemaBlocks[i][1];
        let data: Record<string, unknown>;

        try {
          data = JSON.parse(raw);
        } catch {
          results.push({
            index: i + 1,
            type: "PARSE_ERROR",
            valid: false,
            issues: ["Invalid JSON — can't be parsed. Use jsonlint.com to debug."],
            recommendations: [],
          });
          continue;
        }

        const type = data["@type"] as string | string[];
        const typeStr = Array.isArray(type) ? type.join(", ") : (type ?? "unknown");
        foundTypes.push(...(Array.isArray(type) ? type : [typeStr]));

        const issues: string[] = [];
        const recommendations: string[] = [];

        if (!data["@context"]) issues.push('Missing "@context": "https://schema.org"');
        if (!data["@type"]) issues.push('Missing "@type"');

        const types = Array.isArray(type) ? type : [type];
        for (const t of types) {
          switch (t) {
            case "Organization":
              if (!data["name"]) issues.push('Missing "name"');
              if (!data["url"]) issues.push('Missing "url"');
              if (!data["logo"]) recommendations.push('Add "logo" — needed for Google Knowledge Panel');
              if (!data["sameAs"]) recommendations.push('Add "sameAs" with social profile URLs — boosts E-E-A-T');
              break;

            case "Article":
            case "TechArticle":
            case "BlogPosting":
              if (!data["headline"]) issues.push('Missing "headline"');
              if (!data["datePublished"]) issues.push('Missing "datePublished"');
              if (!data["author"]) issues.push('Missing "author" — required for E-E-A-T');
              if (!data["dateModified"]) recommendations.push('Add "dateModified" to signal content freshness');
              if (!data["publisher"]) recommendations.push('Add "publisher" with logo for Google News eligibility');
              break;

            case "FAQPage": {
              const entities = data["mainEntity"] as unknown[];
              if (!entities || !Array.isArray(entities) || entities.length === 0) {
                issues.push('Missing "mainEntity" array of Question objects');
              } else {
                const badQ = (entities as Record<string, unknown>[]).filter(
                  (q) => !q["name"] || !q["acceptedAnswer"]
                );
                if (badQ.length > 0) {
                  issues.push(`${badQ.length} Question(s) missing "name" or "acceptedAnswer"`);
                }
                if (entities.length < 3) {
                  recommendations.push("Add more Q&A pairs — 4+ increases AI Overview trigger probability");
                }
              }
              break;
            }

            case "SoftwareApplication":
              if (!data["name"]) issues.push('Missing "name"');
              if (!data["applicationCategory"])
                recommendations.push('Add "applicationCategory" (e.g. "DeveloperApplication")');
              if (!data["offers"]) recommendations.push('Add "offers" with price for rich snippet eligibility');
              if (!data["operatingSystem"]) recommendations.push('Add "operatingSystem" for software rich results');
              break;

            case "HowTo":
              if (!data["name"]) issues.push('Missing "name"');
              if (!data["step"]) issues.push('Missing "step" array — required for rich results');
              break;

            case "BreadcrumbList": {
              const items = data["itemListElement"] as unknown[];
              if (!items || !Array.isArray(items)) {
                issues.push('Missing "itemListElement"');
              } else {
                const badItems = (items as Record<string, unknown>[]).filter(
                  (item) => !item["position"] || !item["name"] || !item["item"]
                );
                if (badItems.length > 0) {
                  issues.push(`${badItems.length} item(s) missing "position", "name", or "item"`);
                }
              }
              break;
            }
          }
        }

        results.push({ index: i + 1, type: typeStr, valid: issues.length === 0, issues, recommendations });
      }

      // Suggest missing high-value schemas
      const missingRecs: string[] = [];
      const hasText = html.toLowerCase();
      if (
        !foundTypes.includes("FAQPage") &&
        (hasText.includes("frequently asked") || hasText.includes("faq") || hasText.includes("?</h"))
      ) {
        missingRecs.push(
          "Page looks like it has Q&A content but no FAQPage schema — add it. FAQPage is a top AI Overview trigger."
        );
      }
      if (!foundTypes.includes("Organization") && !foundTypes.includes("Person")) {
        missingRecs.push("No Organization or Person schema anywhere. Add Organization to your root layout.");
      }
      if (
        !foundTypes.includes("Article") &&
        !foundTypes.includes("BlogPosting") &&
        !foundTypes.includes("TechArticle") &&
        url.includes("/blog/")
      ) {
        missingRecs.push(
          "Blog post page missing Article schema. Add it with author, datePublished, and dateModified."
        );
      }
      if (!foundTypes.includes("BreadcrumbList") && url.split("/").length > 4) {
        missingRecs.push(
          "Deep page with no BreadcrumbList — add it so crawlers and users understand where this page sits."
        );
      }

      // ── Format output ────────────────────────────────────────────────────────
      const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } })();
      const path = (() => { try { const p = new URL(url).pathname; return p === "/" ? "" : p; } catch { return ""; } })();

      const lines: string[] = [
        `## ${host}${path} — Schema Check`,
        ``,
      ];

      if (schemaBlocks.length === 0) {
        lines.push(`❌ No JSON-LD schema found on this page.`);
        lines.push(``, `**What to add:**`);
        for (const rec of missingRecs) lines.push(`  → ${rec}`);
      } else {
        lines.push(`Found **${schemaBlocks.length}** schema block${schemaBlocks.length !== 1 ? "s" : ""}: ${[...new Set(foundTypes)].join(", ")}`);
        lines.push(``);

        for (const r of results) {
          const icon = r.valid ? "✅" : "❌";
          lines.push(`**${icon} Block ${r.index}: ${r.type}**`);
          if (r.issues.length > 0) {
            for (const issue of r.issues) lines.push(`  ❌ ${issue}`);
          }
          if (r.recommendations.length > 0) {
            for (const rec of r.recommendations) lines.push(`  → ${rec}`);
          }
          if (r.valid && r.recommendations.length === 0) {
            lines.push(`  Looks good.`);
          }
          lines.push(``);
        }

        const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
        if (totalIssues > 0) {
          lines.push(`**${totalIssues} issue${totalIssues !== 1 ? "s" : ""} to fix** across ${results.filter(r => !r.valid).length} block${results.filter(r => !r.valid).length !== 1 ? "s" : ""}.`);
        } else {
          lines.push(`All blocks valid. ✅`);
        }
      }

      if (missingRecs.length > 0) {
        lines.push(``, `**Missing schemas to add:**`);
        for (const rec of missingRecs) lines.push(`  → ${rec}`);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
