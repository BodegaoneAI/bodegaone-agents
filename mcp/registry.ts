import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSeoTools } from "./tools/seo/index.js";
import { registerContentTools } from "./tools/content/index.js";
import { registerPlanningTools } from "./tools/planning/index.js";

export function registerAllTools(server: McpServer) {
  registerSeoTools(server);
  registerContentTools(server);
  registerPlanningTools(server);
  // Future agents add their tools here:
  // registerDesignerTools(server);
}
