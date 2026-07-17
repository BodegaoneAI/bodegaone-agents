#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./registry.js";

export function createServer() {
  const server = new McpServer(
    { name: "bodegaone-agents", version: "1.0.0" },
    {
      instructions:
        "BodegaOne Agents — specialized tools for SEO/AEO/GEO analysis and content writing. " +
        "Use seo_fetch_page to analyze a live URL, seo_check_schema to validate " +
        "structured data, seo_analyze_serp to research keyword competition, " +
        "seo_keyword_cluster to map topical authority opportunities, seo_crawl_site to " +
        "audit an entire site, and seo_save_report to write a full audit report to disk. " +
        "Use content_lint to check a markdown draft against the SEO/AEO/GEO writing spec " +
        "before publishing. Use plan_lint (type: project | strategy | personal) to check a " +
        "plan draft for completeness. Use research_lint to check a research brief for rigor " +
        "(sourced claims, no vague attribution, confidence levels). Use design_lint to check " +
        "color pairs for WCAG contrast, and design_palette to generate an accessible, harmonious " +
        "color palette from a base color. Use social_lint to check a social/short-form post " +
        "against platform limits and hook/hashtag/CTA best practices, email_lint to check an " +
        "email draft for subject/preheader length, spam triggers, and CAN-SPAM/deliverability " +
        "compliance, a11y_lint to audit HTML against WCAG 2.2 (alt text, labels, headings, link " +
        "and button names, ARIA), and ad_lint to check Google RSA or Meta ad copy against " +
        "platform character limits, ad policy, CTA, and UTM tracking.",
    }
  );

  registerAllTools(server);
  return server;
}

// ── Local stdio mode (Claude Desktop, Claude Code, Cursor) ──────────────────
const isStdio =
  process.argv.includes("--stdio") || !process.stdin.isTTY;

if (isStdio) {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
