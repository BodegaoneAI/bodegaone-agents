import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lintResearch } from "../../lib/research-lint.js";
import { categoryGrade, gradeEmoji, statusIcon, type Grade } from "../../lib/grading.js";

export function registerLintResearchTool(server: McpServer) {
  server.registerTool(
    "research_lint",
    {
      title: "Lint a Research Brief for Rigor",
      description:
        "Checks a research brief for rigor: whether claims and statistics are cited, vague " +
        "attribution ('studies show', 'experts say') with no named source, source diversity, " +
        "dated sources, confidence levels, and acknowledged uncertainty. Returns a " +
        "Pass/Warn/Fail scorecard plus specific fixes. Run it on a brief and fix what it flags " +
        "before relying on the research.",
      inputSchema: z.object({
        markdown: z.string().min(1).describe("The research brief, in markdown"),
      }),
    },
    async ({ markdown }) => {
      const result = lintResearch({ markdown });

      const grades = result.categories.map((c) => categoryGrade(c.items));
      const overall: Grade = grades.includes("FAIL")
        ? "FAIL"
        : grades.includes("WARN")
          ? "WARN"
          : "PASS";

      const lines: string[] = [];
      lines.push(`## Research Brief Lint — ${gradeEmoji(overall)}`);
      lines.push(
        `${result.stats.claims} stat(s) · ${result.stats.citations} citation(s) · ` +
          `${result.stats.distinctSources} distinct source(s) · ${result.stats.vague} vague phrase(s)`
      );
      lines.push(``);

      lines.push(`| Category | Grade |`);
      lines.push(`|---|:---:|`);
      for (const c of result.categories) {
        lines.push(`| ${c.name} | ${gradeEmoji(categoryGrade(c.items))} |`);
      }
      lines.push(``);

      for (const c of result.categories) {
        lines.push(`### ${c.name} — ${gradeEmoji(categoryGrade(c.items))}`);
        for (const item of c.items) {
          const note = item.note ? ` — ${item.note}` : "";
          lines.push(`- ${statusIcon(item.status)} ${item.label}${note}`);
        }
        lines.push(``);
      }

      if (result.flags.length > 0) {
        lines.push(`### Specific fixes (${result.flags.length})`);
        for (const flag of result.flags) lines.push(`- ${flag}`);
      } else {
        lines.push(`### Specific fixes`);
        lines.push(`- None. The brief holds up against the rigor checks.`);
      }

      lines.push(``);
      lines.push(
        overall === "PASS"
          ? `**Solid brief.** Claims are sourced, dated, and honestly hedged.`
          : `**Not ready to rely on.** Address the flagged items, then run \`research_lint\` again.`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );
}
