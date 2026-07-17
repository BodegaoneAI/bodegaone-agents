import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSocialTool } from "./lint-social.js";

export function registerSocialTools(server: McpServer) {
  registerSocialTool(server);
}
