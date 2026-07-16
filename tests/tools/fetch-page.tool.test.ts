/**
 * tests/tools/fetch-page.tool.test.ts
 * Tests the seo_fetch_page MCP tool end-to-end using mocked HTTP.
 * MSW intercepts fetch() calls — no real network traffic.
 *
 * The tool returns a readable plain-English markdown summary (not JSON),
 * so these tests assert against that rendered output.
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerFetchPageTool } from "../../mcp/tools/seo/fetch-page.js";

// ── Test helper — spin up a minimal MCP server with just this one tool ────────

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerFetchPageTool(mcpServer);

  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);

  return client;
}

/** Call the tool and return the rendered markdown text. */
async function fetchPageText(client: Client, url: string): Promise<string> {
  const result = await client.callTool({
    name: "seo_fetch_page",
    arguments: { url },
  });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("seo_fetch_page tool", () => {
  it("returns all SEO signals for a well-formed page", async () => {
    const client = await createTestClient();
    const text = await fetchPageText(client, "https://example-full.com/");

    // Rendered summary surfaces the key signals
    expect(text).toContain("SEO Check");
    expect(text).toContain("Status:** 200");
    expect(text).toContain("SEO"); // title mentions SEO
    expect(text).toContain("1 H1");
    expect(text).toMatch(/Schema:.*Organization/);
    expect(text).toMatch(/Schema:.*FAQPage/);
    expect(text).toContain("Canonical:** ✅");
    expect(text).toContain("No issues found");
  });

  it("reports issues for a minimal page", async () => {
    const client = await createTestClient();
    const text = await fetchPageText(client, "https://example-minimal.com/");

    expect(text).toContain("Missing <title> tag");
    expect(text).toContain("Missing meta description");
    expect(text).toContain("No H1 tag found");
    expect(text).toContain("No canonical URL set");
    expect(text).toContain("Thin content");
  });

  it("detects multiple H1 tags", async () => {
    const client = await createTestClient();
    const text = await fetchPageText(client, "https://example-multi-h1.com/");

    expect(text).toContain("3 H1");
    expect(text).toContain("Multiple H1");
  });

  it("detects invalid JSON-LD and reports parse error", async () => {
    const client = await createTestClient();
    const text = await fetchPageText(client, "https://example-bad-schema.com/");

    expect(text).toContain("Invalid JSON-LD");
  });

  it("flags noindex pages", async () => {
    const client = await createTestClient();

    // Override for this specific test
    server.use(
      http.get("https://noindex.example.com/", () =>
        new HttpResponse(
          `<html><head>
            <title>Noindex Page</title>
            <meta name="robots" content="noindex, nofollow">
          </head><body><h1>Noindex</h1><p>This page is noindexed.</p></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        )
      )
    );

    const text = await fetchPageText(client, "https://noindex.example.com/");
    expect(text).toContain("noindex");
  });

  it("handles title length warnings", async () => {
    const client = await createTestClient();

    server.use(
      http.get("https://shorttitle.example.com/", () =>
        new HttpResponse(
          `<html><head><title>Hi</title>
            <meta name="description" content="A description that is long enough to pass the length check for testing purposes.">
            <link rel="canonical" href="https://shorttitle.example.com/">
          </head><body><h1>Hello World</h1><p>${"word ".repeat(60)}</p></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        )
      )
    );

    const text = await fetchPageText(client, "https://shorttitle.example.com/");
    expect(text).toContain("Title too short");
  });

  it("returns isError on network failure", async () => {
    const client = await createTestClient();

    server.use(
      http.get("https://unreachable.example.com/", () => {
        return HttpResponse.error();
      })
    );

    const result = await client.callTool({
      name: "seo_fetch_page",
      arguments: { url: "https://unreachable.example.com/" },
    });

    expect(result.isError).toBe(true);
  });

  it("counts internal and external links correctly", async () => {
    const client = await createTestClient();
    const text = await fetchPageText(client, "https://example-full.com/");

    // full-seo.html has /blog and /about (internal) + google.com and moz.com (external)
    const internal = Number(text.match(/(\d+) internal/)?.[1] ?? "0");
    const external = Number(text.match(/(\d+) external/)?.[1] ?? "0");
    expect(internal).toBeGreaterThanOrEqual(2);
    expect(external).toBeGreaterThanOrEqual(2);
  });
});
