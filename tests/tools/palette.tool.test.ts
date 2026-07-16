/**
 * tests/tools/palette.tool.test.ts
 * Tests the design_palette MCP tool end-to-end through an in-memory client.
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerPaletteTool } from "../../mcp/tools/design/palette.js";

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerPaletteTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

async function palette(client: Client, args: Record<string, unknown>): Promise<string> {
  const result = await client.callTool({ name: "design_palette", arguments: args });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

describe("design_palette tool", () => {
  it("renders a palette with tokens, neutrals, semantics, and CSS", async () => {
    const client = await createTestClient();
    const text = await palette(client, { baseColor: "#2563eb", harmony: "split-complementary" });
    expect(text).toContain("Palette — split-complementary");
    expect(text).toContain("`brand`");
    expect(text).toContain("neutral-50");
    expect(text).toContain("success");
    expect(text).toContain(":root {");
    expect(text).toContain("--color-brand:");
  });

  it("defaults harmony to complementary", async () => {
    const client = await createTestClient();
    const text = await palette(client, { baseColor: "#0ea5e9" });
    expect(text).toContain("complementary");
  });

  it("rejects an invalid harmony via schema", async () => {
    const client = await createTestClient();
    const result = await client.callTool({
      name: "design_palette",
      arguments: { baseColor: "#000", harmony: "rainbow" },
    });
    expect(result.isError).toBe(true);
  });
});
