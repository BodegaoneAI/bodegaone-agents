/**
 * tests/unit/keyword-cluster.test.ts
 * Tests for buildTopicalCluster() and titleCase()
 */
import { describe, it, expect } from "vitest";
import {
  buildTopicalCluster,
  titleCase,
} from "../../mcp/tools/seo/keyword-cluster.js";

// ── titleCase ─────────────────────────────────────────────────────────────────

describe("titleCase", () => {
  it("capitalises a single word", () => {
    expect(titleCase("seo")).toBe("Seo");
  });

  it("capitalises each word in a phrase", () => {
    expect(titleCase("search engine optimization")).toBe(
      "Search Engine Optimization"
    );
  });

  it("handles already-capitalised input", () => {
    expect(titleCase("SEO")).toBe("SEO");
  });

  it("handles mixed case input", () => {
    expect(titleCase("gEO rEAdiness")).toBe("GEO REAdiness");
  });

  it("handles single-char words", () => {
    expect(titleCase("a b c")).toBe("A B C");
  });
});

// ── buildTopicalCluster ───────────────────────────────────────────────────────

describe("buildTopicalCluster", () => {
  it("includes the seed keyword in output", () => {
    const cluster = buildTopicalCluster("seo");
    expect(cluster.seedKeyword).toBe("seo");
  });

  it("generates a pillar page spec", () => {
    const cluster = buildTopicalCluster("content marketing");
    expect(cluster.pillarPage).toBeDefined();
    expect(cluster.pillarPage.title).toContain("Content Marketing");
    expect(cluster.pillarPage.targetLength).toBeTruthy();
  });

  it("pillar page mustInclude has GEO-oriented items", () => {
    const cluster = buildTopicalCluster("seo");
    const must = cluster.pillarPage.mustInclude.join(" ");
    expect(must).toContain("FAQ");
    expect(must).toContain("GEO");
  });

  it("generates 5 cluster pages", () => {
    const cluster = buildTopicalCluster("link building");
    expect(cluster.clusterPages).toHaveLength(5);
  });

  it("each cluster page has a title, intent, and schema array", () => {
    const cluster = buildTopicalCluster("technical seo");
    for (const page of cluster.clusterPages) {
      expect(page.title).toBeTruthy();
      expect(page.intent).toBeTruthy();
      expect(Array.isArray(page.schema)).toBe(true);
      expect(page.schema.length).toBeGreaterThan(0);
    }
  });

  it("generates 10 long-tail queries", () => {
    const cluster = buildTopicalCluster("geo optimization");
    expect(cluster.longTailQueries).toHaveLength(10);
  });

  it("does NOT produce 'seed vs seed' for single-word seeds (regression test)", () => {
    const cluster = buildTopicalCluster("seo");
    const vsQuery = cluster.longTailQueries.find((q) =>
      /\bseo\s+vs\s+seo\b/i.test(q)
    );
    expect(vsQuery).toBeUndefined();
  });

  it("long-tail queries include the seed keyword", () => {
    const cluster = buildTopicalCluster("core web vitals");
    const allIncludeSeed = cluster.longTailQueries.every((q) =>
      q.toLowerCase().includes("core web vitals")
    );
    expect(allIncludeSeed).toBe(true);
  });

  it("generates GEO opportunities", () => {
    const cluster = buildTopicalCluster("page speed");
    expect(cluster.geoOpportunities.length).toBeGreaterThan(0);
    const joined = cluster.geoOpportunities.join(" ");
    expect(joined).toContain("page speed");
  });

  it("generates internal linking plan", () => {
    const cluster = buildTopicalCluster("backlinks");
    expect(cluster.internalLinkingPlan.length).toBeGreaterThan(0);
  });

  it("handles multi-word seeds correctly in titles", () => {
    const cluster = buildTopicalCluster("search engine optimization");
    expect(cluster.pillarPage.title).toContain("Search Engine Optimization");
  });
});
