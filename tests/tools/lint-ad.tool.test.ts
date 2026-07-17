/**
 * tests/tools/lint-ad.tool.test.ts
 * Tests the ad_lint MCP tool end-to-end through an in-memory client.
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerAdTool } from "../../mcp/tools/ads/lint-ad.js";
import { lintAd } from "../../mcp/lib/ad-lint.js";
import { categoryGrade } from "../../mcp/lib/grading.js";

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerAdTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

async function lint(client: Client, args: Record<string, unknown>): Promise<string> {
  const result = await client.callTool({ name: "ad_lint", arguments: args });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

describe("ad_lint tool", () => {
  it("returns a PASS scorecard for a clean Google RSA set", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      platform: "google",
      headlines: [
        "Shop Fresh Groceries",
        "Same-Day Delivery",
        "Order Produce Online",
        "Get $20 Off First Order",
        "Fresh Food, Fair Prices",
      ],
      descriptions: [
        "Order groceries online and get same-day delivery to your door.",
        "Fresh produce and pantry staples, delivered within hours. Fair prices, no membership.",
      ],
      url: "https://bodega.example/order?utm_source=google&utm_medium=cpc&utm_campaign=grocery_launch",
    });

    expect(text).toContain("Ad Lint");
    expect(text).toContain("✅ PASS");
    expect(text).toContain("Ready to submit");
  });

  it("returns a PASS scorecard for a clean Meta set", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      platform: "meta",
      headlines: ["Fresh Groceries, Delivered"],
      descriptions: ["Same-day delivery"],
      primaryText:
        "Order fresh local produce online and get same-day delivery. Save $20 on your first order today.",
      url: "https://bodega.example/shop?utm_source=facebook&utm_medium=paid_social&utm_campaign=grocery_launch",
    });

    expect(text).toContain("✅ PASS");
    expect(text).toContain("Ready to submit");
  });

  it("returns a FAIL and specific fixes for a bad Google ad", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      platform: "google",
      headlines: ["GET THE BEST DEALS NOW!!!"],
      descriptions: ["Shop now"],
    });

    expect(text).toContain("❌ FAIL");
    expect(text).toContain("Specific fixes");
    expect(text).toContain("Exclamation mark in Google headline");
    expect(text).toContain("Not ready");
  });

  it("flags missing UTM parameters on the destination URL", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      platform: "google",
      headlines: ["Shop Fresh Groceries", "Get Same-Day Delivery", "Order Produce Online"],
      descriptions: [
        "Order groceries online for same-day delivery at fair prices.",
        "Fresh local produce, delivered within hours. No membership.",
      ],
      url: "https://bodega.example/order?utm_source=google",
    });

    expect(text).toContain("utm_medium");
    expect(text).toContain("Not ready");
  });

  it("fails a Google ad that exceeds the 15-headline maximum", async () => {
    const client = await createTestClient();
    const headlines = Array.from({ length: 16 }, (_, i) => `Fresh Deal ${i + 1}`);
    const descriptions = [
      "Order groceries online and get same-day delivery to your door.",
      "Fresh produce and pantry staples, delivered within hours. Fair prices, no membership.",
    ];
    const text = await lint(client, { platform: "google", headlines, descriptions });

    expect(text).toContain("❌ FAIL");
    expect(text).toContain("at most 15");
    expect(text).toContain("Not ready");

    // The rendered grade should match the pure critical-aware grade.
    const pure = lintAd({ platform: "google", headlines, descriptions });
    const limits = pure.categories.find((c) => c.name === "Character Limits")!;
    expect(categoryGrade(limits.items)).toBe("FAIL");
  });

  it("rejects an invalid platform via schema", async () => {
    const client = await createTestClient();
    const result = await client.callTool({
      name: "ad_lint",
      arguments: { platform: "tiktok", headlines: ["Hello"] },
    });
    expect(result.isError).toBe(true);
  });
});
