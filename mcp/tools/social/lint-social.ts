import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lintSocial, splitPosts } from "../../lib/social-lint.js";
import {
  categoryGrade,
  gradeEmoji,
  statusIcon,
  type Grade,
} from "../../lib/grading.js";

export function registerSocialTool(server: McpServer) {
  server.registerTool(
    "social_lint",
    {
      title: "Lint a Social / Short-form Post Against Platform Specs",
      description:
        "Checks a platform-native post or an X thread against the Social Agent spec: " +
        "per-platform character limits, whether the hook lands before the feed truncates, " +
        "filler openers, hashtag discipline, a clear CTA, engagement-bait and shouting, and " +
        "the reach cost of a raw link on X. Returns a Pass/Warn/Fail scorecard plus specific " +
        "line-level fixes. Run this on every draft before posting, and again after editing " +
        "until it passes.",
      inputSchema: z.object({
        text: z
          .string()
          .min(1)
          .describe("The post / caption body. For a thread, the full text (posts split on blank lines)"),
        platform: z
          .enum(["x", "linkedin", "instagram", "threads"])
          .describe("Target platform: x, linkedin, instagram, or threads"),
        isThread: z
          .boolean()
          .optional()
          .describe("X only: evaluate per-post limits across blank-line-separated posts"),
      }),
    },
    async ({ text, platform, isThread }) => {
      const result = lintSocial({ text, platform, isThread });

      const grades = result.categories.map((c) => categoryGrade(c.items));
      const overall: Grade = grades.includes("FAIL")
        ? "FAIL"
        : grades.includes("WARN")
          ? "WARN"
          : "PASS";

      const thread = Boolean(isThread) && platform === "x";
      const postCount = thread ? splitPosts(text).length : 1;

      const lines: string[] = [];
      lines.push(`## Social Lint — ${gradeEmoji(overall)}`);
      lines.push(
        `${result.charCount.toLocaleString()} chars · ${platform}` +
          (thread ? ` · thread (${postCount} post${postCount === 1 ? "" : "s"})` : "")
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
        lines.push(`- None. The post is clean against the spec.`);
      }

      lines.push(``);
      lines.push(
        overall === "PASS"
          ? `**Ready to post.** Publish native, keep any link in a reply on X, and lead with the hook.`
          : `**Not ready.** Fix the flagged items above, then run \`social_lint\` again.`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );
}
