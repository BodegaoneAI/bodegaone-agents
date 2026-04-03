import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

// ── Schemas ──────────────────────────────────────────────────────────────────

const ItemStatus = z.enum(["pass", "warn", "fail"]);

const ScorecardItemSchema = z.object({
  label: z.string().describe("Short description of what was checked"),
  status: ItemStatus.describe("pass | warn | fail"),
  note: z.string().optional().describe("Optional detail — what was found or why it failed"),
});

const CategoryNames = z.enum([
  "Technical SEO",
  "Metadata",
  "Schema & Structured Data",
  "Content & E-E-A-T",
  "Core Web Vitals",
  "GEO Readiness",
  "Internal Linking",
  "Page Experience",
]);

const CategorySchema = z.object({
  name: CategoryNames,
  items: z.array(ScorecardItemSchema).min(1),
});

const QuickWinSchema = z.object({
  action: z.string().describe("What to do"),
  where: z.string().describe("File, page, or exact location"),
  why: z.string().describe("Official source or observed GEO pattern"),
  category: CategoryNames.describe("Which scorecard category this fixes"),
});

const FindingsSchema = z.object({
  url: z.string().url(),
  diagnosis: z.string().describe("2-4 sentence summary of core issue or opportunity"),
  scorecard: z.array(CategorySchema).describe(
    "All 8 categories scored: Technical SEO, Metadata, Schema & Structured Data, " +
    "Content & E-E-A-T, Core Web Vitals, GEO Readiness, Internal Linking, Page Experience"
  ),
  quickWins: z.array(QuickWinSchema),
  mediumTerm: z.array(z.string()),
  strategic: z.array(z.string()),
  oneThingFirst: z.string(),
  outputDir: z.string().optional(),
});

// ── Grade logic ───────────────────────────────────────────────────────────────

type Grade = "PASS" | "WARN" | "FAIL";

function categoryGrade(items: z.infer<typeof ScorecardItemSchema>[]): Grade {
  const fails = items.filter((i) => i.status === "fail").length;
  const warns = items.filter((i) => i.status === "warn").length;
  if (fails >= 2) return "FAIL";
  if (fails === 1) return "WARN";
  if (warns >= 2) return "WARN";
  return "PASS";
}

function overallGrade(categories: z.infer<typeof CategorySchema>[]): Grade {
  const grades = categories.map((c) => categoryGrade(c.items));
  if (grades.some((g) => g === "FAIL")) return "FAIL";
  if (grades.some((g) => g === "WARN")) return "WARN";
  return "PASS";
}

function gradeEmoji(g: Grade): string {
  return g === "PASS" ? "✅ PASS" : g === "WARN" ? "⚠️  WARN" : "❌ FAIL";
}

function statusIcon(s: "pass" | "warn" | "fail"): string {
  return s === "pass" ? "✅" : s === "warn" ? "⚠️ " : "❌";
}

// ── Report builder ────────────────────────────────────────────────────────────

function buildReport(data: z.infer<typeof FindingsSchema>): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0];
  const hostname = (() => {
    try { return new URL(data.url).hostname.replace(/^www\./, ""); }
    catch { return "unknown-site"; }
  })();

  const overall = overallGrade(data.scorecard);

  // Totals across all categories
  const allItems = data.scorecard.flatMap((c) => c.items);
  const totalPass = allItems.filter((i) => i.status === "pass").length;
  const totalWarn = allItems.filter((i) => i.status === "warn").length;
  const totalFail = allItems.filter((i) => i.status === "fail").length;
  const totalItems = allItems.length;

  const lines: string[] = [];

  // ── Header ─────────────────────────────────────────────────────────────────
  lines.push(`# SEO/GEO Audit — ${hostname}`);
  lines.push(``);
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| **URL** | ${data.url} |`);
  lines.push(`| **Date** | ${dateStr} ${timeStr} |`);
  lines.push(`| **Overall Grade** | ${gradeEmoji(overall)} |`);
  lines.push(`| **Score** | ${totalPass}/${totalItems} checks passed (${totalWarn} warned, ${totalFail} failed) |`);
  lines.push(`| **Agent** | BodegaOne SEO/GEO Agent |`);
  lines.push(``);
  lines.push(`---`);

  // ── Scorecard table ────────────────────────────────────────────────────────
  lines.push(``);
  lines.push(`## Scorecard`);
  lines.push(``);
  lines.push(`| Category | ✅ Pass | ⚠️  Warn | ❌ Fail | Grade |`);
  lines.push(`|---|:---:|:---:|:---:|:---:|`);

  for (const cat of data.scorecard) {
    const pass = cat.items.filter((i) => i.status === "pass").length;
    const warn = cat.items.filter((i) => i.status === "warn").length;
    const fail = cat.items.filter((i) => i.status === "fail").length;
    const grade = categoryGrade(cat.items);
    lines.push(`| ${cat.name} | ${pass} | ${warn} | ${fail} | ${gradeEmoji(grade)} |`);
  }

  // Totals row
  lines.push(`| **Total** | **${totalPass}** | **${totalWarn}** | **${totalFail}** | **${gradeEmoji(overall)}** |`);
  lines.push(``);
  lines.push(`---`);

  // ── Category breakdowns ────────────────────────────────────────────────────
  lines.push(``);
  lines.push(`## Category Details`);

  for (const cat of data.scorecard) {
    const grade = categoryGrade(cat.items);
    const pass = cat.items.filter((i) => i.status === "pass").length;
    const warn = cat.items.filter((i) => i.status === "warn").length;
    const fail = cat.items.filter((i) => i.status === "fail").length;

    lines.push(``);
    lines.push(`### ${gradeEmoji(grade).split(" ")[0]} ${cat.name} — ${gradeEmoji(grade)}`);
    lines.push(`*${pass} pass · ${warn} warn · ${fail} fail*`);
    lines.push(``);

    // Sort: fail first, then warn, then pass
    const sorted = [...cat.items].sort((a, b) => {
      const order = { fail: 0, warn: 1, pass: 2 };
      return order[a.status] - order[b.status];
    });

    for (const item of sorted) {
      const note = item.note ? `  \n  ↳ ${item.note}` : "";
      lines.push(`- ${statusIcon(item.status)} ${item.label}${note}`);
    }
  }

  lines.push(``);
  lines.push(`---`);

  // ── Diagnosis ──────────────────────────────────────────────────────────────
  lines.push(``);
  lines.push(`## Diagnosis`);
  lines.push(``);
  lines.push(data.diagnosis);
  lines.push(``);
  lines.push(`---`);

  // ── Quick Wins ─────────────────────────────────────────────────────────────
  lines.push(``);
  lines.push(`## Quick Wins — Do This Week`);
  lines.push(``);
  lines.push(`*${data.quickWins.length} action${data.quickWins.length !== 1 ? "s" : ""} · estimated time: minutes each*`);
  lines.push(``);

  for (let i = 0; i < data.quickWins.length; i++) {
    const w = data.quickWins[i];
    lines.push(`- [ ] **${i + 1}. ${w.action}**`);
    lines.push(`  📍 \`${w.where}\``);
    lines.push(`  🏷️  ${w.category}`);
    lines.push(`  💡 ${w.why}`);
    lines.push(``);
  }

  lines.push(`---`);

  // ── Medium term ────────────────────────────────────────────────────────────
  lines.push(``);
  lines.push(`## Medium Term — Next 4 Weeks`);
  lines.push(``);
  for (const item of data.mediumTerm) {
    lines.push(`- [ ] ${item}`);
  }
  lines.push(``);
  lines.push(`---`);

  // ── Strategic ─────────────────────────────────────────────────────────────
  lines.push(``);
  lines.push(`## Strategic Moves — 1–3 Months`);
  lines.push(``);
  for (const item of data.strategic) {
    lines.push(`- [ ] ${item}`);
  }
  lines.push(``);
  lines.push(`---`);

  // ── One thing first ────────────────────────────────────────────────────────
  lines.push(``);
  lines.push(`## ⚡ One Thing to Do First`);
  lines.push(``);
  lines.push(`> ${data.oneThingFirst}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`*Generated by [BodegaOne Agents](https://github.com/BodegaoneAI/bodegaone-agents)*`);

  return lines.join("\n");
}

// ── Tool registration ─────────────────────────────────────────────────────────

export function registerSaveReportTool(server: McpServer) {
  server.registerTool(
    "seo_save_report",
    {
      title: "Save SEO Audit Report",
      description:
        "Saves a complete SEO/GEO audit as a markdown file to disk. " +
        "Includes a scorecard table with Pass/Warn/Fail grades across 8 categories " +
        "(Technical SEO, Metadata, Schema & Structured Data, Content & E-E-A-T, " +
        "Core Web Vitals, GEO Readiness, Internal Linking, Page Experience), " +
        "item counts per status, per-category grades, an overall grade, " +
        "and the full written diagnosis + action items. " +
        "No external integrations required — universal markdown output.",
      inputSchema: FindingsSchema,
    },
    async (data) => {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      const hostname = (() => {
        try { return new URL(data.url).hostname.replace(/^www\./, ""); }
        catch { return "unknown-site"; }
      })();

      const filename = `${hostname}-${dateStr}.md`;
      const dir = resolve(data.outputDir ?? "./seo-reports");

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const filepath = join(dir, filename);
      const content = buildReport(data);

      try {
        writeFileSync(filepath, content, "utf-8");
      } catch (err) {
        return {
          content: [{
            type: "text" as const,
            text: `Failed to write report: ${err instanceof Error ? err.message : String(err)}\nPath: ${filepath}`,
          }],
          isError: true,
        };
      }

      // Build summary for the agent's response
      const overall = overallGrade(data.scorecard);
      const allItems = data.scorecard.flatMap((c) => c.items);
      const totalPass = allItems.filter((i) => i.status === "pass").length;
      const totalWarn = allItems.filter((i) => i.status === "warn").length;
      const totalFail = allItems.filter((i) => i.status === "fail").length;

      const catSummary = data.scorecard
        .map((c) => {
          const grade = categoryGrade(c.items);
          const icon = grade === "PASS" ? "✅" : grade === "WARN" ? "⚠️ " : "❌";
          return `  ${icon} ${c.name}`;
        })
        .join("\n");

      return {
        content: [{
          type: "text" as const,
          text: [
            `Report saved → ${filepath}`,
            ``,
            `Overall: ${gradeEmoji(overall)} (${totalPass} pass · ${totalWarn} warn · ${totalFail} fail)`,
            ``,
            `Categories:`,
            catSummary,
            ``,
            `${data.quickWins.length} quick win${data.quickWins.length !== 1 ? "s" : ""} · ${data.mediumTerm.length} medium-term · ${data.strategic.length} strategic`,
          ].join("\n"),
        }],
      };
    }
  );
}
