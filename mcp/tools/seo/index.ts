import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFetchPageTool } from "./fetch-page.js";
import { registerCheckSchemaTool } from "./check-schema.js";
import { registerAnalyzeSerpTool } from "./analyze-serp.js";
import { registerKeywordClusterTool } from "./keyword-cluster.js";
import { registerSaveReportTool } from "./save-report.js";

export function registerSeoTools(server: McpServer) {
  registerFetchPageTool(server);
  registerCheckSchemaTool(server);
  registerAnalyzeSerpTool(server);
  registerKeywordClusterTool(server);
  registerSaveReportTool(server);
}
