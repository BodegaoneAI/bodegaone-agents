/**
 * tests/tools/lint-plan.tool.test.ts
 * Tests the plan_lint MCP tool end-to-end through an in-memory client.
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerLintPlanTool } from "../../mcp/tools/planning/lint-plan.js";

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerLintPlanTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

async function lint(client: Client, markdown: string, type: string): Promise<string> {
  const result = await client.callTool({ name: "plan_lint", arguments: { markdown, type } });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

const goodProject = `# Project: Onboarding revamp

## Objective
Activation rate reaches 40% by 2026-09-30.

## Tasks
| Task | Owner | Estimate | Depends on | Definition of done |
|---|---|---|---|---|
| Build signup API | Sam | 3 days | none | endpoint returns 200 |

## Milestones
1. Signup live - Aug 15

## Risks
Riskiest assumption: users finish setup. Test with 5 users next week.

## First next action
Sam starts the signup API today.
`;

describe("plan_lint tool", () => {
  it("labels the report by type", async () => {
    const client = await createTestClient();
    const text = await lint(client, goodProject, "project");
    expect(text).toContain("Project plan Lint");
  });

  it("passes a complete project plan", async () => {
    const client = await createTestClient();
    const text = await lint(client, goodProject, "project");
    expect(text).toContain("✅ PASS");
    expect(text).toContain("Solid plan");
  });

  it("fails a vague plan and lists specific fixes", async () => {
    const client = await createTestClient();
    const text = await lint(client, "# Idea\n\nMake onboarding better somehow.", "project");
    expect(text).toContain("Specific fixes");
    expect(text).toContain("owner");
    expect(text).toContain("Needs work");
  });

  it("rejects an invalid type via schema", async () => {
    const client = await createTestClient();
    const result = await client.callTool({
      name: "plan_lint",
      arguments: { markdown: "# Plan", type: "nonsense" },
    });
    expect(result.isError).toBe(true);
  });
});
