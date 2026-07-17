import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lintA11y } from "../../lib/a11y-lint.js";
import {
  categoryGrade,
  gradeEmoji,
  statusIcon,
  type Grade,
} from "../../lib/grading.js";

export function registerA11yTool(server: McpServer) {
  server.registerTool(
    "a11y_lint",
    {
      title: "Audit HTML Against WCAG 2.2 (Accessibility)",
      description:
        "Statically audits an HTML snippet or full page against a subset of WCAG 2.2 " +
        "(level A/AA) success criteria and the ARIA Authoring Practices: image alt text, " +
        "heading structure, form-control labels, discernible link and button text, and " +
        "common ARIA mistakes (positive tabindex, aria-hidden on interactive elements, " +
        "invalid or redundant roles). Set isFullDocument true to also check <html lang>, " +
        "<title>, and a viewport that doesn't disable zoom. Returns a Pass/Warn/Fail " +
        "scorecard plus specific fixes that quote the offending tag. Static analysis catches " +
        "roughly a third of issues; color contrast lives in design_lint, and keyboard order " +
        "and screen-reader behavior still need manual testing.",
      inputSchema: z.object({
        html: z.string().min(1).describe("An HTML snippet or a full page to audit"),
        isFullDocument: z
          .boolean()
          .optional()
          .default(false)
          .describe("True for a full page: also checks <html lang>, <title>, and a zoom-friendly viewport"),
      }),
    },
    async ({ html, isFullDocument }) => {
      const result = lintA11y({ html, isFullDocument });

      const grades = result.categories.map((c) => categoryGrade(c.items));
      const overall: Grade = grades.includes("FAIL")
        ? "FAIL"
        : grades.includes("WARN")
          ? "WARN"
          : "PASS";

      const c = result.counts;
      const lines: string[] = [];
      lines.push(`## Accessibility Audit — ${gradeEmoji(overall)}`);
      lines.push(
        `${c.images} image(s) · ${c.headings} heading(s) · ${c.formControls} form control(s) · ` +
          `${c.links} link(s) · ${c.buttons} button(s)`
      );
      lines.push(``);

      // Scorecard summary
      lines.push(`| Category | Grade |`);
      lines.push(`|---|:---:|`);
      for (const cat of result.categories) {
        lines.push(`| ${cat.name} | ${gradeEmoji(categoryGrade(cat.items))} |`);
      }
      lines.push(``);

      // Per-category detail
      for (const cat of result.categories) {
        lines.push(`### ${cat.name} — ${gradeEmoji(categoryGrade(cat.items))}`);
        for (const item of cat.items) {
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
        lines.push(`- None. The markup is clean against these automated checks.`);
      }

      lines.push(``);
      lines.push(
        `_Color contrast (WCAG 1.4.3) is checked by the sibling \`design_lint\` tool. ` +
          `This is static analysis: it catches roughly a third of issues. Keyboard order, ` +
          `focus management, and screen-reader semantics still need manual testing._`
      );
      lines.push(``);
      lines.push(
        overall === "PASS"
          ? `**Passes the automated checks.** Now test with a keyboard and a screen reader to confirm the rest.`
          : `**Fixes needed.** Address the flagged items above, then run \`a11y_lint\` again.`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );
}
