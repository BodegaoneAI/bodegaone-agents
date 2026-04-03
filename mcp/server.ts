import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./registry.js";

export function createServer() {
  const server = new McpServer(
    { name: "bodegaone-agents", version: "1.0.0" },
    {
      instructions:
        "BodegaOne Agents — specialized tools for SEO/GEO analysis. " +
        "Use seo_fetch_page to analyze a live URL, seo_check_schema to validate " +
        "structured data, seo_analyze_serp to research keyword competition, and " +
        "seo_keyword_cluster to map topical authority opportunities.",
    }
  );

  registerAllTools(server);
  return server;
}

// ── Local stdio mode (Claude Desktop, Claude Code, Cursor) ──────────────────
const isStdio =
  process.argv.includes("--stdio") || process.stdin.isTTY === false;

if (isStdio) {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
