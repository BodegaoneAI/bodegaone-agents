import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLintResearchTool } from "./lint-research.js";

export function registerResearchTools(server: McpServer) {
  registerLintResearchTool(server);
}
