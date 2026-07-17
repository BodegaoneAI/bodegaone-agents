import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lintEmail } from "../../lib/email-lint.js";
import {
  categoryGrade,
  gradeEmoji,
  statusIcon,
  type Grade,
} from "../../lib/grading.js";

export function registerEmailTool(server: McpServer) {
  server.registerTool(
    "email_lint",
    {
      title: "Lint an Email / Newsletter for Inbox Delivery",
      description:
        "Checks a lifecycle email or newsletter draft against the Gmail/Yahoo bulk-sender " +
        "rules, CAN-SPAM, RFC 8058, and inbox best practices: subject line and preheader, " +
        "spam-trigger words, ALL-CAPS shouting and excessive punctuation, the unsubscribe and " +
        "physical-address requirements, link count, text-to-image ratio, and anchor text. " +
        "Returns a Pass/Warn/Fail scorecard plus specific fixes and a deliverability-setup " +
        "checklist. Run this on every draft before sending, and again after editing until it passes.",
      inputSchema: z.object({
        body: z.string().min(1).describe("The email body (markdown, plain text, or HTML text)"),
        subject: z.string().optional().describe("Subject line (checked for length, caps, punctuation)"),
        preheader: z
          .string()
          .optional()
          .describe("Preview text shown after the subject (checked for 40–100 chars)"),
        listType: z
          .enum(["marketing", "transactional"])
          .optional()
          .default("marketing")
          .describe("Transactional email is exempt from the CAN-SPAM unsubscribe requirement"),
      }),
    },
    async ({ body, subject, preheader, listType }) => {
      const result = lintEmail({ body, subject, preheader, listType });

      const grades = result.categories.map((c) => categoryGrade(c.items));
      const overall: Grade = grades.includes("FAIL")
        ? "FAIL"
        : grades.includes("WARN")
          ? "WARN"
          : "PASS";

      const lines: string[] = [];
      lines.push(`## Email Lint — ${gradeEmoji(overall)}`);
      lines.push(`${listType} email · ${result.categories.length} checks`);
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
          ? `**Ready to send.** Confirm the deliverability-setup items below, then schedule the send.`
          : `**Not ready.** Fix the flagged items above, then run \`email_lint\` again.`
      );

      // Deliverability setup (can't be checked from the body)
      lines.push(``);
      lines.push(`### Deliverability setup`);
      lines.push(`These can't be verified from the email body — confirm them before you send:`);
      for (const advisory of result.advisories) {
        lines.push(`- ${advisory}`);
      }

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );
}
