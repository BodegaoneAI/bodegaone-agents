import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSeoTools } from "./tools/seo/index.js";
import { registerContentTools } from "./tools/content/index.js";
import { registerPlanningTools } from "./tools/planning/index.js";
import { registerResearchTools } from "./tools/research/index.js";
import { registerDesignTools } from "./tools/design/index.js";
import { registerSocialTools } from "./tools/social/index.js";
import { registerEmailTools } from "./tools/email/index.js";
import { registerA11yTools } from "./tools/a11y/index.js";
import { registerAdTools } from "./tools/ads/index.js";

export function registerAllTools(server: McpServer) {
  registerSeoTools(server);
  registerContentTools(server);
  registerPlanningTools(server);
  registerResearchTools(server);
  registerDesignTools(server);
  registerSocialTools(server);
  registerEmailTools(server);
  registerA11yTools(server);
  registerAdTools(server);
}
