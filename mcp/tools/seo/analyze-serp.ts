import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerAnalyzeSerpTool(server: McpServer) {
  server.registerTool(
    "seo_analyze_serp",
    {
      title: "Analyze SERP for Keyword",
      description:
        "Searches for a keyword and analyzes the top results to identify content patterns, " +
        "gaps, and what it would take to rank. Requires BRAVE_SEARCH_API_KEY env var. " +
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
                "⚠️  BRAVE_SEARCH_API_KEY is not set.",
                "",
                "To use this tool:",
                "1. Get a free API key at https://brave.com/search/api",
                "   (Free tier: 2,000 queries/month)",
                "2. Set the env var:",
                "   export BRAVE_SEARCH_API_KEY=your_key_here",
                "3. Re-run the MCP server",
                "",
                "Without this tool, you can still analyze SERPs manually by:",
                `   - Searching "${keyword}" in an incognito window`,
                "   - Examining the top 5 results for content depth, word count, and schema",
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

      const output = {
        keyword,
        resultsAnalyzed: results.length,
        results: results.map((r, i) => ({
          position: i + 1,
          title: r.title,
          url: r.url,
          description: r.description,
          domain: new URL(r.url).hostname,
        })),
        patterns: {
          domains: results.map((r) => new URL(r.url).hostname),
          titleKeywordPresence: results.filter((r) =>
            r.title.toLowerCase().includes(keyword.toLowerCase())
          ).length,
          note: "Fetch individual URLs with seo_fetch_page for deep content analysis",
        },
        nextSteps: [
          `Run seo_fetch_page on the top 3 results to analyze their content depth and schema`,
          `Compare word counts, heading structures, and schema types across top results`,
          `Identify what content angle or data point is missing from all top results`,
        ],
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
      };
    }
  );
}
