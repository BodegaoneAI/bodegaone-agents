import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAdTool } from "./lint-ad.js";

export function registerAdTools(server: McpServer) {
  registerAdTool(server);
}
