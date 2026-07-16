import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lintPlan } from "../../lib/plan-lint.js";
import { categoryGrade, gradeEmoji, statusIcon, type Grade } from "../../lib/grading.js";

const TYPE_LABEL: Record<string, string> = {
  project: "Project plan",
  strategy: "Strategy plan",
  personal: "Personal plan",
};

export function registerLintPlanTool(server: McpServer) {
  server.registerTool(
    "plan_lint",
    {
      title: "Lint a Plan for Completeness",
      description:
        "Checks a plan draft for completeness against the relevant planner's standards. " +
        "Set type to 'project' (milestones, owners, estimates, dependencies, definition of " +
        "done, risks, next action), 'strategy' (measurable objective, target segment, " +
        "positioning, GTM motion, pricing, metrics, assumptions), or 'personal' (one top " +
        "priority, manageable load, time-blocking, boundaries). Returns a Pass/Warn/Fail " +
        "scorecard plus specific fixes. Run it on a plan draft and fix what it flags.",
      inputSchema: z.object({
        markdown: z.string().min(1).describe("The plan draft, in markdown"),
        type: z
          .enum(["project", "strategy", "personal"])
          .describe("Which planner's standards to check against"),
      }),
    },
    async ({ markdown, type }) => {
      const result = lintPlan({ markdown, type });

      const grades = result.categories.map((c) => categoryGrade(c.items));
      const overall: Grade = grades.includes("FAIL")
        ? "FAIL"
        : grades.includes("WARN")
          ? "WARN"
          : "PASS";

      const lines: string[] = [];
      lines.push(`## ${TYPE_LABEL[type] ?? "Plan"} Lint — ${gradeEmoji(overall)}`);
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
        lines.push(`- None. The plan is complete against the ${type} standards.`);
      }

      lines.push(``);
      lines.push(
        overall === "PASS"
          ? `**Solid plan.** It covers the essentials for a ${type} plan.`
          : `**Needs work.** Address the flagged items above, then run \`plan_lint\` again.`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );
}
