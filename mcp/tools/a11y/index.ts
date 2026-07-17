import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerA11yTool } from "./lint-a11y.js";

export function registerA11yTools(server: McpServer) {
  registerA11yTool(server);
}
