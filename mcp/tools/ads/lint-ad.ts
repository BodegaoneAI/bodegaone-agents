import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lintAd } from "../../lib/ad-lint.js";
import {
  categoryGrade,
  gradeEmoji,
  statusIcon,
  type Grade,
} from "../../lib/grading.js";

export function registerAdTool(server: McpServer) {
  server.registerTool(
    "ad_lint",
    {
      title: "Lint Ad Copy Against Platform Specs and Policy",
      description:
        "Checks Google Responsive Search Ad or Meta ad copy against the platform's asset specs " +
        "(character limits, asset counts), editorial policy (excessive capitalization, gimmicky " +
        "punctuation, exclamation marks in Google headlines, unverifiable superlatives, phone " +
        "numbers in headlines), CTA strength, and UTM tracking on the destination URL. Returns a " +
        "Pass/Warn/Fail scorecard plus specific line-level fixes. Passing is NOT a guarantee of " +
        "ad approval — platform human and automated policy review still applies. Run this on " +
        "every ad before it ships, and again after editing until it passes.",
      inputSchema: z.object({
        platform: z
          .enum(["google", "meta"])
          .describe("Which platform's specs and policies to check against"),
        headlines: z
          .array(z.string())
          .optional()
          .describe("Google RSA headlines, or Meta headline(s)"),
        descriptions: z
          .array(z.string())
          .optional()
          .describe("Google RSA descriptions, or Meta link description(s)"),
        primaryText: z.string().optional().describe("Meta primary text / body copy"),
        url: z
          .string()
          .optional()
          .describe("Final / landing URL, checked for utm_source, utm_medium, utm_campaign"),
      }),
    },
    async ({ platform, headlines, descriptions, primaryText, url }) => {
      const result = lintAd({ platform, headlines, descriptions, primaryText, url });

      const grades = result.categories.map((c) => categoryGrade(c.items));
      const overall: Grade = grades.includes("FAIL")
        ? "FAIL"
        : grades.includes("WARN")
          ? "WARN"
          : "PASS";

      const lines: string[] = [];
      lines.push(`## Ad Lint — ${gradeEmoji(overall)}`);
      lines.push(
        `${platform.toUpperCase()} · ${headlines?.length ?? 0} headline(s) · ` +
          `${descriptions?.length ?? 0} description(s) · ` +
          `${primaryText ? "primary text" : "no primary text"} · ${url ? "URL provided" : "no URL"}`
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
        lines.push(`- None. The ad is clean against the platform specs and policy checks.`);
      }

      lines.push(``);
      lines.push(
        overall === "PASS"
          ? `**Ready to submit.** Note: passing the linter is not a guarantee of ad approval — platform policy review still applies.`
          : `**Not ready.** Fix the flagged items above, then run \`ad_lint\` again.`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );
}
