/**
 * tests/tools/fetch-page.tool.test.ts
 * Tests the seo_fetch_page MCP tool end-to-end using mocked HTTP.
 * MSW intercepts fetch() calls — no real network traffic.
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

async function callFetchPage(client: Client, url: string) {
  const result = await client.callTool({
    name: "seo_fetch_page",
    arguments: { url },
  });
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  return JSON.parse(text);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("seo_fetch_page tool", () => {
  it("returns all SEO signals for a well-formed page", async () => {
    const client = await createTestClient();
    const data = await callFetchPage(client, "https://example-full.com/");

    expect(data.url).toBe("https://example-full.com/");
    expect(data.statusCode).toBe(200);
    expect(data.title).toContain("SEO");
    expect(data.metaDescription).toBeTruthy();
    expect(data.metaDescriptionLength).toBeGreaterThan(0);
    expect(data.canonical).toBe("https://example-full.com/");
    expect(data.h1).toHaveLength(1);
    expect(data.h2.length).toBeGreaterThan(0);
    expect(data.hasSchema).toBe(true);
    expect(data.schemaTypes).toContain("Organization");
    expect(data.schemaTypes).toContain("FAQPage");
    expect(data.ogTitle).toBeTruthy();
    expect(data.ogDescription).toBeTruthy();
    expect(data.issues).toHaveLength(0);
  });

  it("reports issues for a minimal page", async () => {
    const client = await createTestClient();
    const data = await callFetchPage(client, "https://example-minimal.com/");

    expect(data.issues).toContain("Missing <title> tag");
    expect(data.issues).toContain("Missing meta description");
    expect(data.issues).toContain("No H1 tag found");
    expect(data.issues).toContain("No canonical URL set");
    expect(data.issues.some((i: string) => i.includes("thin content"))).toBe(true);
  });

  it("detects multiple H1 tags", async () => {
    const client = await createTestClient();
    const data = await callFetchPage(client, "https://example-multi-h1.com/");

    expect(data.h1).toHaveLength(3);
    expect(
      data.issues.some((i: string) => i.includes("Multiple H1"))
    ).toBe(true);
  });

  it("detects invalid JSON-LD and reports parse error", async () => {
    const client = await createTestClient();
    const data = await callFetchPage(client, "https://example-bad-schema.com/");

    expect(
      data.issues.some((i: string) => i.includes("Invalid JSON-LD"))
    ).toBe(true);
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

    const data = await callFetchPage(client, "https://noindex.example.com/");
    expect(data.robotsContent).toBe("noindex, nofollow");
    expect(
      data.issues.some((i: string) => i.includes("noindex"))
    ).toBe(true);
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

    const data = await callFetchPage(client, "https://shorttitle.example.com/");
    expect(data.issues.some((i: string) => i.includes("Title too short"))).toBe(true);
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
    const data = await callFetchPage(client, "https://example-full.com/");

    // full-seo.html has /blog and /about (internal) + google.com and moz.com (external)
    expect(data.internalLinks).toBeGreaterThanOrEqual(2);
    expect(data.externalLinks).toBeGreaterThanOrEqual(2);
  });
});
