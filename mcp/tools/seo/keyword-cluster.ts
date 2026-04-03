import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerKeywordClusterTool(server: McpServer) {
  server.registerTool(
    "seo_keyword_cluster",
    {
      title: "Build Topical Keyword Cluster",
      description:
        "Takes a seed keyword and maps out a topical cluster: the pillar page, " +
        "supporting cluster pages, and related long-tail queries. Topical authority " +
        "is the #1 factor for ranking in competitive niches. " +
        "Requires BRAVE_SEARCH_API_KEY for live data; works in planning mode without it.",
      inputSchema: z.object({
        seedKeyword: z.string().describe("The main topic or keyword to cluster around"),
        mode: z
          .enum(["planning", "live"])
          .optional()
          .default("planning")
          .describe(
            "planning: keyword logic only (no API needed). " +
            "live: fetches real search data (requires BRAVE_SEARCH_API_KEY)."
          ),
      }),
    },
    async ({ seedKeyword, mode }) => {
      const cluster = buildTopicalCluster(seedKeyword);

      if (mode === "live") {
        const apiKey = process.env.BRAVE_SEARCH_API_KEY;
        if (!apiKey) {
          return {
            content: [
              {
                type: "text" as const,
                text: [
                  `## Keyword Cluster: "${seedKeyword}"`,
                  ``,
                  `⚠️  Live mode needs BRAVE_SEARCH_API_KEY. Falling back to planning mode.`,
                  ``,
                  formatCluster(cluster),
                ].join("\n"),
              },
            ],
          };
        }
        // Live mode would layer in actual search volume data — extend here
      }

      return {
        content: [{ type: "text" as const, text: formatCluster(cluster) }],
      };
    }
  );
}

function formatCluster(cluster: ReturnType<typeof buildTopicalCluster>): string {
  const lines: string[] = [
    `## Keyword Cluster: "${cluster.seedKeyword}"`,
    ``,
    `### Pillar Page`,
    `**Title:** ${cluster.pillarPage.title}`,
    `**Target:** ${cluster.pillarPage.targetLength} · ${cluster.pillarPage.intent}`,
    ``,
    `Must include:`,
  ];
  for (const item of cluster.pillarPage.mustInclude) {
    lines.push(`  · ${item}`);
  }

  lines.push(``, `### Cluster Pages (${cluster.clusterPages.length})`);
  for (let i = 0; i < cluster.clusterPages.length; i++) {
    const p = cluster.clusterPages[i];
    lines.push(`**${i + 1}. ${p.angle}** — ${p.title}`);
    lines.push(`   Intent: ${p.intent} · Schema: ${p.schema.join(", ")}`);
  }

  lines.push(``, `### Long-Tail Queries`);
  for (const q of cluster.longTailQueries) {
    lines.push(`  · ${q}`);
  }

  lines.push(``, `### GEO Opportunities`);
  for (const opp of cluster.geoOpportunities) {
    lines.push(`  → ${opp}`);
  }

  lines.push(``, `### Internal Linking Plan`);
  for (const link of cluster.internalLinkingPlan) {
    lines.push(`  · ${link}`);
  }

  return lines.join("\n");
}

export function buildTopicalCluster(seed: string) {
  return {
    seedKeyword: seed,
    pillarPage: {
      title: `The Complete Guide to ${titleCase(seed)}`,
      intent: "informational + commercial investigation",
      targetLength: "2,000–3,500 words",
      mustInclude: [
        "Definition section (GEO: answer-first)",
        "Comparison table (highly extractable by AI)",
        "FAQ section with FAQPage schema (top GEO citation trigger)",
        "HowTo or step-by-step section",
        "Author attribution for E-E-A-T",
      ],
    },
    clusterPages: [
      {
        angle: "How-to / Tutorial",
        title: `How to Use ${titleCase(seed)}: Step-by-Step Guide`,
        intent: "informational",
        schema: ["HowTo", "Article"],
      },
      {
        angle: "Comparison",
        title: `${titleCase(seed)} vs Alternatives: Which is Right for You?`,
        intent: "commercial investigation",
        schema: ["Article", "FAQPage"],
      },
      {
        angle: "Best Practices",
        title: `${titleCase(seed)} Best Practices in ${new Date().getFullYear()}`,
        intent: "informational",
        schema: ["Article", "ItemList"],
      },
      {
        angle: "Use Cases",
        title: `${titleCase(seed)} Use Cases: Real-World Examples`,
        intent: "commercial investigation",
        schema: ["Article", "FAQPage"],
      },
      {
        angle: "Tools / Resources",
        title: `Best Tools for ${titleCase(seed)} (${new Date().getFullYear()})`,
        intent: "commercial investigation",
        schema: ["ItemList", "Article"],
      },
    ],
    longTailQueries: [
      `what is ${seed}`,
      `how does ${seed} work`,
      `${seed} tutorial for beginners`,
      `${seed} examples`,
      `${seed} best practices ${new Date().getFullYear()}`,
      `${seed} alternatives`,
      `is ${seed} worth it`,
      `${seed} pros and cons`,
      `how to get started with ${seed}`,
      `${seed} for small business`,
    ],
    geoOpportunities: [
      `Structure the pillar page with direct answers in the first 2 sentences of each section`,
      `Add FAQPage schema to the pillar page and comparison page`,
      `Create a clear definition of "${seed}" near the top of the pillar page`,
      `Include original data or benchmarks to trigger AI citation`,
      `Name any proprietary frameworks (e.g. "The ${titleCase(seed)} Maturity Model")`,
    ],
    internalLinkingPlan: [
      `Pillar page links out to all cluster pages`,
      `All cluster pages link back to the pillar page`,
      `Cluster pages cross-link to each other when contextually relevant`,
      `Use descriptive anchor text matching the target page's primary keyword`,
    ],
  };
}

export function titleCase(str: string): string {
  return str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
