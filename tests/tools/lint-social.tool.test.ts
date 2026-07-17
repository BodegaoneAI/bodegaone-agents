/**
 * tests/tools/lint-social.tool.test.ts
 * Tests the social_lint MCP tool end-to-end through an in-memory client.
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerSocialTool } from "../../mcp/tools/social/lint-social.js";

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerSocialTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

async function lint(client: Client, args: Record<string, unknown>): Promise<string> {
  const result = await client.callTool({ name: "social_lint", arguments: args });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

const cleanX =
  "Most founders wait too long to raise. The best time to start a raise is the quarter " +
  "before you need the money, while your metrics still have room to run. Are you raising " +
  "from strength or from fear?";

describe("social_lint tool", () => {
  it("returns a PASS scorecard for a clean X post", async () => {
    const client = await createTestClient();
    const text = await lint(client, { text: cleanX, platform: "x" });

    expect(text).toContain("Social Lint");
    expect(text).toContain("✅ PASS");
    expect(text).toContain("Ready to post");
  });

  it("returns a FAIL and specific fixes for a bad post", async () => {
    const client = await createTestClient();
    const bad = "So, there are a lot of reasons this matters " + "word ".repeat(60).trim();
    const text = await lint(client, { text: bad, platform: "x" });

    expect(text).toContain("❌ FAIL");
    expect(text).toContain("Specific fixes");
    expect(text).toContain("Weak hook");
    expect(text).toContain("over the x limit");
    expect(text).toContain("Not ready");
  });

  it("fails Instagram over the 5-hashtag cap", async () => {
    const client = await createTestClient();
    const six = Array.from({ length: 6 }, (_, i) => `#tag${i}`).join(" ");
    const text = await lint(client, {
      text: `New drop is live. Save this for later.\n\n${six}`,
      platform: "instagram",
    });
    expect(text).toContain("Hashtags");
    expect(text).toContain("hard cap of 5");
    expect(text).toContain("❌ FAIL"); // critical hashtag breach fails the category and overall
  });

  it("warns about a raw link on X", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      text: "Read the full teardown here https://example.com/post and let me know what you think.",
      platform: "x",
    });
    expect(text).toContain("Links");
    expect(text.toLowerCase()).toContain("reach");
  });

  it("evaluates an X thread per post and surfaces the char count", async () => {
    const client = await createTestClient();
    const post1 = "The best product decisions look obvious only in hindsight. Here is one.";
    const post2 = "word ".repeat(70).trim(); // 349 chars, over 280
    const text = await lint(client, {
      text: `${post1}\n\n${post2}`,
      platform: "x",
      isThread: true,
    });
    expect(text).toMatch(/\d+ chars/);
    expect(text).toContain("· x");
    expect(text).toContain("thread");
    expect(text).toContain("Thread post 2");
  });
});
