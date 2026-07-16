import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lintContent } from "../../lib/content-lint.js";
import {
  categoryGrade,
  gradeEmoji,
  statusIcon,
  type Grade,
} from "../../lib/grading.js";

export function registerLintDraftTool(server: McpServer) {
  server.registerTool(
    "content_lint",
    {
      title: "Lint a Draft Against the SEO/AEO/GEO Spec",
      description:
        "Checks a markdown draft against the Content Writer spec: em dashes, marketing " +
        "fluff and AI-writing tells, vague hedging, heading structure, answer-first section " +
        "openers, FAQ/Q&A presence, title and meta-description length, link anchor text, and " +
        "content depth. Returns a Pass/Warn/Fail scorecard plus specific line-level fixes. " +
        "Run this on every draft before publishing, and again after editing until it passes.",
      inputSchema: z.object({
        markdown: z.string().min(1).describe("The draft body, in markdown"),
        title: z.string().optional().describe("Proposed SEO title / <title> (checked for 50-60 chars)"),
        metaDescription: z
          .string()
          .optional()
          .describe("Proposed meta description (checked for 120-160 chars, no em dash)"),
        targetKeyword: z
          .string()
          .optional()
          .describe("Primary keyword the piece targets (checked in title + natural usage)"),
      }),
    },
    async ({ markdown, title, metaDescription, targetKeyword }) => {
      const result = lintContent({ markdown, title, metaDescription, targetKeyword });

      const grades = result.categories.map((c) => categoryGrade(c.items));
      const overall: Grade = grades.includes("FAIL")
        ? "FAIL"
        : grades.includes("WARN")
          ? "WARN"
          : "PASS";

      const lines: string[] = [];
      lines.push(`## Draft Lint — ${gradeEmoji(overall)}`);
      lines.push(
        `${result.wordCount.toLocaleString()} words · ` +
          `${result.headingCount.h1} H1 · ${result.headingCount.h2} H2 · ${result.headingCount.h3} H3`
      );
      lines.push(``);

      // Scorecard summary
      lines.push(`| Category | Grade |`);
      lines.push(`|---|:---:|`);
      for (const c of result.categories) {
        lines.push(`| ${c.name} | ${gradeEmoji(categoryGrade(c.items))} |`);
      }
      lines.push(``);

      // Per-category detail
      for (const c of result.categories) {
        lines.push(`### ${c.name} — ${gradeEmoji(categoryGrade(c.items))}`);
        for (const item of c.items) {
          const note = item.note ? ` — ${item.note}` : "";
          lines.push(`- ${statusIcon(item.status)} ${item.label}${note}`);
        }
        lines.push(``);
      }

      // Specific fixes
      if (result.flags.length > 0) {
        lines.push(`### Specific fixes (${result.flags.length})`);
        for (const flag of result.flags) {
          lines.push(`- ${flag}`);
        }
      } else {
        lines.push(`### Specific fixes`);
        lines.push(`- None. The draft is clean against the spec.`);
      }

      lines.push(``);
      lines.push(
        overall === "PASS"
          ? `**Ready to publish.** Run the SEO/GEO agent on the live URL after deploy for the full technical audit.`
          : `**Not ready.** Fix the flagged items above, then run \`content_lint\` again.`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );
}
