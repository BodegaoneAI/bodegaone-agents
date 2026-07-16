/**
 * tests/tools/lint-research.tool.test.ts
 * Tests the research_lint MCP tool end-to-end through an in-memory client.
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerLintResearchTool } from "../../mcp/tools/research/lint-research.js";

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerLintResearchTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

async function lint(client: Client, markdown: string): Promise<string> {
  const result = await client.callTool({ name: "research_lint", arguments: { markdown } });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

describe("research_lint tool", () => {
  it("renders a scorecard with the source counts", async () => {
    const client = await createTestClient();
    const text = await lint(client, "# X\n\nRevenue grew 25% (Source: ACME 10-K, 2025, https://sec.gov/a).");
    expect(text).toContain("Research Brief Lint");
    expect(text).toMatch(/stat\(s\)/);
    expect(text).toContain("Sourcing");
  });

  it("fails a vague, unsourced brief and lists fixes", async () => {
    const client = await createTestClient();
    const text = await lint(
      client,
      "# Claim\n\nStudies show 80% of startups fail, experts agree it is inevitable, and everyone knows it."
    );
    expect(text).toContain("❌ FAIL");
    expect(text).toContain("Specific fixes");
    expect(text).toContain("studies show");
    expect(text).toContain("Not ready to rely on");
  });

  it("rejects empty input via schema", async () => {
    const client = await createTestClient();
    const result = await client.callTool({ name: "research_lint", arguments: { markdown: "" } });
    expect(result.isError).toBe(true);
  });
});
