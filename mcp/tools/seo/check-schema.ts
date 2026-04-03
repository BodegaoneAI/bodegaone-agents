import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerCheckSchemaTool(server: McpServer) {
  server.registerTool(
    "seo_check_schema",
    {
      title: "Validate Schema Markup",
      description:
        "Validates JSON-LD structured data on a page. Checks for required fields " +
        "per schema.org spec, identifies missing high-value schema types for the " +
        "page's content, and flags GEO citation opportunities (FAQPage, HowTo, etc.).",
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

      const schemaBlocks = [...html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      )];

      const results: Array<{
        index: number;
        type: string | string[];
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
            issues: ["Invalid JSON — schema block cannot be parsed"],
            recommendations: ["Fix JSON syntax. Use https://jsonlint.com/ to debug."],
          });
          continue;
        }

        const type = data["@type"] as string | string[];
        const typeStr = Array.isArray(type) ? type.join(", ") : (type ?? "unknown");
        foundTypes.push(...(Array.isArray(type) ? type : [typeStr]));

        const issues: string[] = [];
        const recommendations: string[] = [];

        // Common required fields
        if (!data["@context"]) issues.push('Missing "@context": "https://schema.org"');
        if (!data["@type"]) issues.push('Missing "@type"');

        // Type-specific validation
        const types = Array.isArray(type) ? type : [type];
        for (const t of types) {
          switch (t) {
            case "Organization":
              if (!data["name"]) issues.push('Organization: missing "name"');
              if (!data["url"]) issues.push('Organization: missing "url"');
              if (!data["logo"]) recommendations.push('Add "logo" to Organization for Google Knowledge Panel');
              if (!data["sameAs"]) recommendations.push('Add "sameAs" array with social profile URLs for E-E-A-T');
              break;

            case "Article":
            case "TechArticle":
            case "BlogPosting":
              if (!data["headline"]) issues.push(`${t}: missing "headline"`);
              if (!data["datePublished"]) issues.push(`${t}: missing "datePublished"`);
              if (!data["author"]) issues.push(`${t}: missing "author" — required for E-E-A-T`);
              if (!data["dateModified"]) recommendations.push('Add "dateModified" to signal content freshness');
              if (!data["publisher"]) recommendations.push('Add "publisher" with logo for Google News eligibility');
              break;

            case "FAQPage":
              const entities = data["mainEntity"] as unknown[];
              if (!entities || !Array.isArray(entities) || entities.length === 0) {
                issues.push('FAQPage: missing "mainEntity" array of Question objects');
              } else {
                const badQ = (entities as Record<string, unknown>[]).filter(
                  (q) => !q["name"] || !q["acceptedAnswer"]
                );
                if (badQ.length > 0) {
                  issues.push(`FAQPage: ${badQ.length} Question(s) missing "name" or "acceptedAnswer"`);
                }
                if (entities.length < 3) {
                  recommendations.push("Add more Q&A pairs — 4+ increases AI Overview trigger probability");
                }
              }
              break;

            case "SoftwareApplication":
              if (!data["name"]) issues.push('SoftwareApplication: missing "name"');
              if (!data["applicationCategory"]) recommendations.push('Add "applicationCategory" (e.g. "DeveloperApplication")');
              if (!data["offers"]) recommendations.push('Add "offers" with price for rich snippet eligibility');
              if (!data["operatingSystem"]) recommendations.push('Add "operatingSystem" for software rich results');
              break;

            case "HowTo":
              if (!data["name"]) issues.push('HowTo: missing "name"');
              if (!data["step"]) issues.push('HowTo: missing "step" array — required for rich results');
              break;

            case "BreadcrumbList":
              const items = data["itemListElement"] as unknown[];
              if (!items || !Array.isArray(items)) {
                issues.push('BreadcrumbList: missing "itemListElement"');
              } else {
                const badItems = (items as Record<string, unknown>[]).filter(
                  (item) => !item["position"] || !item["name"] || !item["item"]
                );
                if (badItems.length > 0) {
                  issues.push(`BreadcrumbList: ${badItems.length} item(s) missing "position", "name", or "item"`);
                }
              }
              break;
          }
        }

        results.push({
          index: i + 1,
          type: typeStr,
          valid: issues.length === 0,
          issues,
          recommendations,
        });
      }

      // Suggest missing high-value schemas based on page content
      const missingRecommendations: string[] = [];
      const hasText = html.toLowerCase();

      if (!foundTypes.includes("FAQPage") && (hasText.includes("frequently asked") || hasText.includes("faq") || hasText.includes("?</h"))) {
        missingRecommendations.push("Consider adding FAQPage schema — page appears to have Q&A content. FAQPage is a top GEO citation trigger.");
      }
      if (!foundTypes.includes("Organization") && !foundTypes.includes("Person")) {
        missingRecommendations.push("No Organization or Person schema found. Add Organization to every page via root layout.");
      }
      if (!foundTypes.includes("Article") && !foundTypes.includes("BlogPosting") && !foundTypes.includes("TechArticle") && url.includes("/blog/")) {
        missingRecommendations.push("Blog post page missing Article schema. Add Article with author, datePublished, dateModified.");
      }
      if (!foundTypes.includes("BreadcrumbList") && url.split("/").length > 4) {
        missingRecommendations.push("Deep page missing BreadcrumbList schema. Helps both crawlers and users understand site hierarchy.");
      }

      const output = {
        url,
        totalSchemaBlocks: schemaBlocks.length,
        foundTypes: [...new Set(foundTypes)],
        results,
        missingRecommendations,
        summary: {
          valid: results.filter((r) => r.valid).length,
          invalid: results.filter((r) => !r.valid).length,
          totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
        },
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
      };
    }
  );
}
