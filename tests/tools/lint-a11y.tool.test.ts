/**
 * tests/tools/lint-a11y.tool.test.ts
 * Tests the a11y_lint MCP tool end-to-end through an in-memory client.
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerA11yTool } from "../../mcp/tools/a11y/lint-a11y.js";
import { lintA11y } from "../../mcp/lib/a11y-lint.js";
import { categoryGrade } from "../../mcp/lib/grading.js";

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerA11yTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

async function audit(client: Client, args: Record<string, unknown>): Promise<string> {
  const result = await client.callTool({ name: "a11y_lint", arguments: args });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

const cleanSnippet = `<main>
  <h1>Account settings</h1>
  <h2>Profile</h2>
  <img src="/avatar.png" alt="Your profile photo">
  <form>
    <label for="email">Email address</label>
    <input type="email" id="email" name="email">
  </form>
  <a href="/help">Read the help guide</a>
  <button type="submit">Save changes</button>
</main>`;

describe("a11y_lint tool", () => {
  it("returns a PASS scorecard for a clean snippet", async () => {
    const client = await createTestClient();
    const text = await audit(client, { html: cleanSnippet });

    expect(text).toContain("Accessibility Audit");
    expect(text).toContain("✅ PASS");
    expect(text).toContain("Passes the automated checks");
  });

  it("returns a FAIL and specific fixes for a broken full document", async () => {
    const client = await createTestClient();
    const badDoc =
      `<!doctype html><html><head></head><body>` +
      `<h1>Broken</h1>` +
      `<img src="/x.png">` +
      `<input type="text" name="q">` +
      `<a href="/y"></a>` +
      `</body></html>`;
    const text = await audit(client, { html: badDoc, isFullDocument: true });

    expect(text).toContain("❌ FAIL");
    expect(text).toContain("Specific fixes");
    expect(text).toContain("alt");
    expect(text).toContain("Document");
    expect(text).toContain("Fixes needed");
  });

  it("passes a headless labeled-button fragment (blocker fix)", async () => {
    const client = await createTestClient();
    const text = await audit(client, { html: `<button aria-label="Close">×</button>` });
    expect(text).toContain("✅ PASS");
    // No harmful 'add an <h1>' advice for a component partial.
    expect(text).not.toContain("No <h1> found");
  });

  it("passes markup that uses a valid ARIA 1.2 role (meter)", async () => {
    const client = await createTestClient();
    const text = await audit(client, {
      html: `<h1>Stats</h1><div role="meter" aria-valuenow="70">70%</div>`,
    });
    expect(text).toContain("✅ PASS");
    expect(text).not.toContain("Unrecognized ARIA role");
  });

  it("fails an <input type=image> with no alt", async () => {
    const client = await createTestClient();
    const text = await audit(client, { html: `<h1>Form</h1><input type="image" src="/go.png">` });
    expect(text).toContain("❌ FAIL");
    expect(text).toContain("Unlabeled form control");
  });

  it("omits the Document category when isFullDocument is not set", async () => {
    const client = await createTestClient();
    const text = await audit(client, { html: cleanSnippet });
    expect(text).not.toContain("### Document");
  });

  it("notes that contrast lives in design_lint and needs manual testing", async () => {
    const client = await createTestClient();
    const text = await audit(client, { html: cleanSnippet });
    expect(text).toContain("design_lint");
    expect(text).toContain("manual testing");
  });

  it("surfaces the element counts", async () => {
    const client = await createTestClient();
    const text = await audit(client, { html: cleanSnippet });
    expect(text).toMatch(/image\(s\)/);
    expect(text).toMatch(/heading\(s\)/);
  });

  it("rejects an empty html string via schema", async () => {
    const client = await createTestClient();
    const result = await client.callTool({ name: "a11y_lint", arguments: { html: "" } });
    expect(result.isError).toBe(true);
  });

  it("grades a single missing-alt image FAIL through the shared engine (critical)", () => {
    // A single critical fail must fail the whole category, which is why the tool
    // prints ❌ FAIL for the broken document above.
    const result = lintA11y({ html: `<h1>Gallery</h1><img src="/x.png">` });
    const images = result.categories.find((c) => c.name === "Images & Media")!;
    expect(categoryGrade(images.items)).toBe("FAIL");
  });
});
