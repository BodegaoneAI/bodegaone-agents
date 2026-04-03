import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSeoTools } from "./tools/seo/index.js";

export function registerAllTools(server: McpServer) {
  registerSeoTools(server);
  // Future agents add their tools here:
  // registerContentTools(server);
  // registerPlannerTools(server);
  // registerDesignerTools(server);
}
