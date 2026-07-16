import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSeoTools } from "./tools/seo/index.js";
import { registerContentTools } from "./tools/content/index.js";

export function registerAllTools(server: McpServer) {
  registerSeoTools(server);
  registerContentTools(server);
  // Future agents add their tools here:
  // registerPlannerTools(server);
  // registerDesignerTools(server);
}
