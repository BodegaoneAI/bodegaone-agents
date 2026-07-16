import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLintDesignTool } from "./lint-design.js";

export function registerDesignTools(server: McpServer) {
  registerLintDesignTool(server);
}
