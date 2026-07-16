import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLintDesignTool } from "./lint-design.js";
import { registerPaletteTool } from "./palette.js";

export function registerDesignTools(server: McpServer) {
  registerLintDesignTool(server);
  registerPaletteTool(server);
}
