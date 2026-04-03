/**
 * tests/mocks/server.ts
 * MSW Node.js server — intercepts fetch() calls made by MCP tools.
 * Define default handlers here; override per-test with server.use().
 */
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "../fixtures/html");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf-8");
}

// ── Default handlers ──────────────────────────────────────────────────────────
// These are the fallback responses for any test that doesn't override them.

export const handlers = [
  // Full SEO page — all signals present, no issues expected
  http.get("https://example-full.com/", () => {
    return new HttpResponse(readFixture("full-seo.html"), {
      headers: { "Content-Type": "text/html" },
    });
  }),

  // Minimal page — missing most signals, many issues expected
  http.get("https://example-minimal.com/", () => {
    return new HttpResponse(readFixture("minimal.html"), {
      headers: { "Content-Type": "text/html" },
    });
  }),

  // Page with invalid JSON-LD
  http.get("https://example-bad-schema.com/", () => {
    return new HttpResponse(readFixture("bad-json-ld.html"), {
      headers: { "Content-Type": "text/html" },
    });
  }),

  // Page with multiple H1s
  http.get("https://example-multi-h1.com/", () => {
    return new HttpResponse(readFixture("multiple-h1.html"), {
      headers: { "Content-Type": "text/html" },
    });
  }),

  // Brave Search API — default mock response
  http.get("https://api.search.brave.com/res/v1/web/search", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "test";
    return HttpResponse.json({
      web: {
        results: [
          {
            title: `${query} - Top Result`,
            url: "https://competitor1.com/page",
            description: `The best guide to ${query} available.`,
          },
          {
            title: `${query} Guide 2025`,
            url: "https://competitor2.com/guide",
            description: `Everything you need to know about ${query}.`,
          },
          {
            title: `What is ${query}? Explained`,
            url: "https://competitor3.com/what-is",
            description: `A complete explanation of ${query}.`,
          },
        ],
      },
    });
  }),
];

export const server = setupServer(...handlers);
