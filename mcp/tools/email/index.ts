import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEmailTool } from "./lint-email.js";

export function registerEmailTools(server: McpServer) {
  registerEmailTool(server);
}
