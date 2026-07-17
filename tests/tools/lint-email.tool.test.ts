/**
 * tests/tools/lint-email.tool.test.ts
 * Tests the email_lint MCP tool end-to-end through an in-memory client.
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerEmailTool } from "../../mcp/tools/email/lint-email.js";

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerEmailTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

async function lint(client: Client, args: Record<string, unknown>): Promise<string> {
  const result = await client.callTool({ name: "email_lint", arguments: args });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

const cleanBody = `Hi there,

Our July menu just went live. This month we added three lunch specials, a lighter
single-origin roast, and new weekend hours so you can stop by later on Saturday and
Sunday.

[Browse the July menu](https://bodegaone.example/menu) and tell us which special you
want us to keep on the board next month.

Thanks for reading,
The BodegaOne team

123 Market Street, Suite 400, San Francisco, CA 94103
[Unsubscribe](https://bodegaone.example/unsubscribe) from these updates anytime.
`;

describe("email_lint tool", () => {
  it("returns a PASS scorecard for a clean marketing email", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      body: cleanBody,
      subject: "Your July menu is live",
      preheader: "Three new specials, a lighter roast, and weekend hours for July.",
      listType: "marketing",
    });

    expect(text).toContain("Email Lint");
    expect(text).toContain("✅ PASS");
    expect(text).toContain("Ready to send");
    expect(text).toContain("Deliverability setup");
    expect(text).toContain("SPF, DKIM, and DMARC");
  });

  it("returns a FAIL and specific fixes for a spammy, non-compliant email", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      subject: "FREE MONEY!!! ACT NOW",
      body: "Congratulations, you are a WINNER. Buy now and get 100% free cash, guaranteed. This is not spam. $$$",
      listType: "marketing",
    });

    expect(text).toContain("❌ FAIL");
    expect(text).toContain("Specific fixes");
    expect(text).toContain("winner");
    expect(text).toContain("No unsubscribe option");
    expect(text).toContain("Not ready");
  });

  it("fails a clean-looking marketing email that lacks an unsubscribe (critical)", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      subject: "July menu is live",
      preheader: "New specials and weekend hours are ready for you to browse today.",
      body: "Our July menu is live. Come by this weekend.\n\n123 Market Street, Suite 400, San Francisco, CA 94103",
      listType: "marketing",
    });
    // No spam issues here — the failure comes solely from the missing unsubscribe,
    // and the critical flag must sink the whole category.
    expect(text).toContain("❌ FAIL");
    expect(text).toContain("Compliance — ❌ FAIL");
    expect(text).toContain("No unsubscribe option");
  });

  it("passes compliance for a transactional email with no unsubscribe", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      subject: "Your order shipped",
      body: "Your order #1024 shipped and is on its way. Track it at https://bodegaone.example/track.",
      listType: "transactional",
    });
    expect(text).toContain("transactional email");
    expect(text).toContain("Compliance — ✅ PASS");
  });

  it("rejects empty body via schema", async () => {
    const client = await createTestClient();
    const result = await client.callTool({ name: "email_lint", arguments: { body: "" } });
    expect(result.isError).toBe(true);
  });

  it("always lists the deliverability advisories", async () => {
    const client = await createTestClient();
    const text = await lint(client, { body: "A short plain-text note.", listType: "transactional" });
    expect(text).toContain("### Deliverability setup");
    expect(text).toContain("RFC 8058");
    expect(text).toContain("spam-complaint rate under 0.3%");
  });
});
