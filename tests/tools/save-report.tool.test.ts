/**
 * tests/tools/save-report.tool.test.ts
 * Tests the seo_save_report MCP tool — grading, file output, and report structure.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerSaveReportTool } from "../../mcp/tools/seo/save-report.js";

// ── Setup ─────────────────────────────────────────────────────────────────────

let testOutputDir: string;

beforeEach(() => {
  testOutputDir = join(tmpdir(), `seo-test-${Date.now()}`);
  mkdirSync(testOutputDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(testOutputDir)) {
    rmSync(testOutputDir, { recursive: true, force: true });
  }
});

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerSaveReportTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

// ── Shared fixture ────────────────────────────────────────────────────────────

function makeAuditInput(overrides: Record<string, unknown> = {}) {
  return {
    url: "https://example.com/",
    diagnosis: "The site has several technical SEO issues and lacks schema markup.",
    scorecard: [
      {
        name: "Technical SEO",
        items: [
          { label: "HTTPS", status: "pass" },
          { label: "Canonical", status: "pass" },
        ],
      },
      {
        name: "Metadata",
        items: [
          { label: "Title tag present", status: "pass" },
          { label: "Meta description", status: "warn", note: "Too short at 80 chars" },
        ],
      },
      {
        name: "Schema & Structured Data",
        items: [
          { label: "Organization schema", status: "fail", note: "Missing entirely" },
          { label: "Article schema", status: "fail", note: "No schema on blog posts" },
        ],
      },
      {
        name: "Content & E-E-A-T",
        items: [{ label: "Author attribution", status: "pass" }],
      },
      {
        name: "Core Web Vitals",
        items: [{ label: "LCP < 2.5s", status: "pass" }],
      },
      {
        name: "GEO Readiness",
        items: [{ label: "FAQPage schema", status: "warn" }],
      },
      {
        name: "Internal Linking",
        items: [{ label: "Pillar page links", status: "pass" }],
      },
      {
        name: "Page Experience",
        items: [{ label: "No intrusive interstitials", status: "pass" }],
      },
    ],
    quickWins: [
      {
        action: "Add Organization schema to root layout",
        where: "app/layout.tsx",
        why: "Google structured data guidelines",
        category: "Schema & Structured Data",
      },
    ],
    mediumTerm: ["Implement FAQPage schema on all blog posts"],
    strategic: ["Build topical authority cluster around core keywords"],
    oneThingFirst: "Add Organization schema to the root layout today.",
    outputDir: testOutputDir,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("seo_save_report tool", () => {
  it("saves a markdown file to the specified directory", async () => {
    const client = await createTestClient();
    await client.callTool({ name: "seo_save_report", arguments: makeAuditInput() });

    const files = require("fs").readdirSync(testOutputDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^example\.com-\d{4}-\d{2}-\d{2}\.md$/);
  });

  it("written file contains all 8 category names", async () => {
    const client = await createTestClient();
    await client.callTool({ name: "seo_save_report", arguments: makeAuditInput() });

    const files = require("fs").readdirSync(testOutputDir);
    const content = readFileSync(join(testOutputDir, files[0]), "utf-8");

    expect(content).toContain("Technical SEO");
    expect(content).toContain("Metadata");
    expect(content).toContain("Schema & Structured Data");
    expect(content).toContain("Content & E-E-A-T");
    expect(content).toContain("Core Web Vitals");
    expect(content).toContain("GEO Readiness");
    expect(content).toContain("Internal Linking");
    expect(content).toContain("Page Experience");
  });

  it("report contains all major sections", async () => {
    const client = await createTestClient();
    await client.callTool({ name: "seo_save_report", arguments: makeAuditInput() });

    const files = require("fs").readdirSync(testOutputDir);
    const content = readFileSync(join(testOutputDir, files[0]), "utf-8");

    expect(content).toContain("## Scorecard");
    expect(content).toContain("## Category Details");
    expect(content).toContain("## Diagnosis");
    expect(content).toContain("## Quick Wins");
    expect(content).toContain("## Medium Term");
    expect(content).toContain("## Strategic Moves");
    expect(content).toContain("## ⚡ One Thing to Do First");
  });

  it("overall grade is FAIL when a category has 2 fails", async () => {
    const client = await createTestClient();
    const result = await client.callTool({
      name: "seo_save_report",
      arguments: makeAuditInput(), // Schema category has 2 fails → FAIL
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("❌ FAIL");
  });

  it("overall grade is WARN when category has only 1 fail", async () => {
    const client = await createTestClient();
    const input = makeAuditInput();
    // Downgrade schema to 1 fail
    (input.scorecard[2] as Record<string, unknown>).items = [
      { label: "Organization schema", status: "fail" },
      { label: "Article schema", status: "pass" },
    ];

    const result = await client.callTool({
      name: "seo_save_report",
      arguments: input,
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    // With 1 fail → category WARN, no other FAIL categories → overall WARN
    expect(text).toContain("⚠️");
    expect(text).not.toContain("❌ FAIL");
  });

  it("overall grade is PASS when all items pass", async () => {
    const client = await createTestClient();
    const allPassInput = makeAuditInput({
      scorecard: [
        { name: "Technical SEO", items: [{ label: "HTTPS", status: "pass" }] },
        { name: "Metadata", items: [{ label: "Title", status: "pass" }] },
        { name: "Schema & Structured Data", items: [{ label: "Org schema", status: "pass" }] },
        { name: "Content & E-E-A-T", items: [{ label: "Author", status: "pass" }] },
        { name: "Core Web Vitals", items: [{ label: "LCP", status: "pass" }] },
        { name: "GEO Readiness", items: [{ label: "FAQ schema", status: "pass" }] },
        { name: "Internal Linking", items: [{ label: "Pillar links", status: "pass" }] },
        { name: "Page Experience", items: [{ label: "No interstitials", status: "pass" }] },
      ],
    });

    const result = await client.callTool({
      name: "seo_save_report",
      arguments: allPassInput,
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("✅ PASS");
  });

  it("report contains the quick win action and location", async () => {
    const client = await createTestClient();
    await client.callTool({ name: "seo_save_report", arguments: makeAuditInput() });

    const files = require("fs").readdirSync(testOutputDir);
    const content = readFileSync(join(testOutputDir, files[0]), "utf-8");

    expect(content).toContain("Add Organization schema to root layout");
    expect(content).toContain("app/layout.tsx");
  });

  it("report contains the oneThingFirst callout", async () => {
    const client = await createTestClient();
    await client.callTool({ name: "seo_save_report", arguments: makeAuditInput() });

    const files = require("fs").readdirSync(testOutputDir);
    const content = readFileSync(join(testOutputDir, files[0]), "utf-8");
    expect(content).toContain("Add Organization schema to the root layout today.");
  });

  it("creates the output directory if it does not exist", async () => {
    const client = await createTestClient();
    const nestedDir = join(testOutputDir, "nested", "deeply");

    await client.callTool({
      name: "seo_save_report",
      arguments: makeAuditInput({ outputDir: nestedDir }),
    });

    expect(existsSync(nestedDir)).toBe(true);
  });

  it("returns error text on invalid Zod input", async () => {
    const client = await createTestClient();

    const result = await client.callTool({
      name: "seo_save_report",
      arguments: { url: "not-a-url", scorecard: [], quickWins: [], mediumTerm: [], strategic: [], oneThingFirst: "", diagnosis: "" },
    });

    // Zod validation should surface as an error
    expect(result.isError).toBe(true);
  });
});
