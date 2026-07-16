import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLintDraftTool } from "./lint-draft.js";

export function registerContentTools(server: McpServer) {
  registerLintDraftTool(server);
}
