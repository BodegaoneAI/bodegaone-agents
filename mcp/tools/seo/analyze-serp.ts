import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerAnalyzeSerpTool(server: McpServer) {
  server.registerTool(
    "seo_analyze_serp",
    {
      title: "Analyze SERP for Keyword",
      description:
        "Searches for a keyword and shows the top results so you can see who's ranking " +
        "and what they're doing. Requires BRAVE_SEARCH_API_KEY env var. " +
        "Get a free key at https://brave.com/search/api (2,000 free queries/month).",
      inputSchema: z.object({
        keyword: z.string().describe("The keyword or phrase to research"),
        count: z
          .number()
          .min(3)
          .max(10)
          .optional()
          .default(5)
          .describe("Number of results to analyze (3–10, default 5)"),
      }),
    },
    async ({ keyword, count }) => {
      const apiKey = process.env.BRAVE_SEARCH_API_KEY;

      if (!apiKey) {
        return {
          content: [
            {
              type: "text" as const,
              text: [
                `## SERP Analysis — "${keyword}"`,
                ``,
                `❌ BRAVE_SEARCH_API_KEY is not set.`,
                ``,
                `Get a free key at https://brave.com/search/api (2,000 queries/month free), then:`,
                `  export BRAVE_SEARCH_API_KEY=your_key_here`,
                ``,
                `In the meantime, search "${keyword}" in an incognito window and look at the top 5 results manually.`,
              ].join("\n"),
            },
          ],
        };
      }

      let searchData: {
        web?: {
          results?: Array<{
            title: string;
            url: string;
            description: string;
          }>;
        };
      };

      try {
        const res = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(keyword)}&count=${count}`,
          {
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip",
              "X-Subscription-Token": apiKey,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Brave Search API error: ${res.status} ${res.statusText}`);
        }

        searchData = await res.json();
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Search failed: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }

      const results = searchData.web?.results ?? [];
      const keywordLower = keyword.toLowerCase();
      const titlesWithKeyword = results.filter((r) =>
        r.title.toLowerCase().includes(keywordLower)
      ).length;

      const lines: string[] = [
        `## SERP: "${keyword}" — Top ${results.length} Results`,
        ``,
      ];

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const domain = (() => { try { return new URL(r.url).hostname.replace(/^www\./, ""); } catch { return r.url; } })();
        lines.push(`**${i + 1}. ${domain}** — ${r.title}`);
        if (r.description) {
          lines.push(`   ${r.description.slice(0, 120)}${r.description.length > 120 ? "…" : ""}`);
        }
        lines.push(``);
      }

      lines.push(`**Patterns:**`);
      lines.push(`  · ${titlesWithKeyword}/${results.length} titles include the keyword`);
      lines.push(`  · Competing domains: ${results.map(r => { try { return new URL(r.url).hostname.replace(/^www\./, ""); } catch { return r.url; } }).join(", ")}`);
      lines.push(``);
      lines.push(`**Next steps:** run \`seo_fetch_page\` on the top 2–3 results to compare content depth, word count, and schema.`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
