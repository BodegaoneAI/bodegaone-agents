import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLintPlanTool } from "./lint-plan.js";

export function registerPlanningTools(server: McpServer) {
  registerLintPlanTool(server);
}
