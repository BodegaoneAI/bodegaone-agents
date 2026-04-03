import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzePage, formatPageAnalysis } from "../../lib/analyze-page.js";

export function registerFetchPageTool(server: McpServer) {
  server.registerTool(
    "seo_fetch_page",
    {
      title: "Fetch & Analyze Page",
      description:
        "Fetches a live URL and checks all SEO signals: title, meta description, " +
        "headings, word count, schema markup, canonical URL, internal/external links, " +
        "OG tags, and robots meta. Returns a plain-English summary with any issues flagged. " +
        "Run this first before any deeper analysis.",
      inputSchema: z.object({
        url: z.string().url().describe("The full URL of the page to analyze"),
      }),
    },
    async ({ url }) => {
      const result = await analyzePage(url);

      if (result.kind === "error") {
        return {
          content: [{ type: "text" as const, text: `Failed to fetch ${url}: ${result.error}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text" as const, text: formatPageAnalysis(result) }],
      };
    }
  );
}
