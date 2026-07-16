import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lintDesign } from "../../lib/design-lint.js";
import { categoryGrade, gradeEmoji, statusIcon } from "../../lib/grading.js";

export function registerLintDesignTool(server: McpServer) {
  server.registerTool(
    "design_lint",
    {
      title: "Check Color Contrast (WCAG)",
      description:
        "Checks foreground/background color pairs for WCAG contrast. Give it your palette's " +
        "text-on-surface combinations as hex pairs and it returns the exact contrast ratio and " +
        "AA/AAA pass or fail for each, with fixes. Set largeText true for text 18pt or larger " +
        "(or 14pt bold), which has a lower threshold. Run it on your palette before the colors " +
        "spread through the design.",
      inputSchema: z.object({
        colors: z
          .array(
            z.object({
              label: z.string().optional().describe("A name for this pairing, e.g. 'body text on card'"),
              foreground: z.string().describe("Foreground hex, e.g. #1a1a1a or #111"),
              background: z.string().describe("Background hex, e.g. #ffffff"),
              largeText: z.boolean().optional().describe("True for text >= 18pt or 14pt bold"),
            })
          )
          .min(1)
          .describe("The foreground/background color pairs to check"),
      }),
    },
    async ({ colors }) => {
      const result = lintDesign({ colors });
      const category = result.categories[0];
      const overall = categoryGrade(category.items);

      const passing = category.items.filter((i) => i.status === "pass").length;
      const lines: string[] = [];
      lines.push(`## Color Contrast — ${gradeEmoji(overall)}`);
      lines.push(`${passing}/${category.items.length} pairs meet WCAG AA`);
      lines.push(``);
      lines.push(`| Pair | Ratio & verdict |`);
      lines.push(`|---|---|`);
      for (const item of category.items) {
        lines.push(`| ${statusIcon(item.status)} ${item.label} | ${item.note ?? ""} |`);
      }
      lines.push(``);

      if (result.flags.length > 0) {
        lines.push(`### Fixes (${result.flags.length})`);
        for (const flag of result.flags) lines.push(`- ${flag}`);
      } else {
        lines.push(`### Fixes`);
        lines.push(`- None. Every pair meets WCAG AA.`);
      }

      lines.push(``);
      lines.push(
        overall === "PASS"
          ? `**Accessible palette.** All pairs meet at least WCAG AA contrast.`
          : `**Contrast issues.** Fix the flagged pairs, then run \`design_lint\` again. Reference: AA needs 4.5:1 for normal text, 3:1 for large text.`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );
}
