/**
 * tests/tools/lint-design.tool.test.ts
 * Tests the design_lint MCP tool end-to-end through an in-memory client.
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerLintDesignTool } from "../../mcp/tools/design/lint-design.js";

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerLintDesignTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

async function lint(client: Client, colors: unknown): Promise<string> {
  const result = await client.callTool({ name: "design_lint", arguments: { colors } });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

describe("design_lint tool", () => {
  it("passes an accessible palette", async () => {
    const client = await createTestClient();
    const text = await lint(client, [
      { label: "body on white", foreground: "#1a1a1a", background: "#ffffff" },
      { label: "link on white", foreground: "#0a5ad6", background: "#ffffff" },
    ]);
    expect(text).toContain("Color Contrast");
    expect(text).toContain("✅ PASS");
    expect(text).toContain("Accessible palette");
  });

  it("fails and gives fixes for low contrast", async () => {
    const client = await createTestClient();
    const text = await lint(client, [
      { label: "muted on white", foreground: "#bbbbbb", background: "#ffffff" },
    ]);
    expect(text).toContain("❌");
    expect(text).toContain("Fixes");
    expect(text).toContain("muted on white");
    expect(text).toContain("Contrast issues");
  });

  it("shows the exact ratio", async () => {
    const client = await createTestClient();
    const text = await lint(client, [{ foreground: "#000", background: "#fff" }]);
    expect(text).toMatch(/21(\.0+)?:1/);
  });

  it("rejects an empty color list via schema", async () => {
    const client = await createTestClient();
    const result = await client.callTool({ name: "design_lint", arguments: { colors: [] } });
    expect(result.isError).toBe(true);
  });
});
