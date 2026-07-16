/**
 * tests/tools/lint-draft.tool.test.ts
 * Tests the content_lint MCP tool end-to-end through an in-memory client.
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerLintDraftTool } from "../../mcp/tools/content/lint-draft.js";

async function createTestClient() {
  const mcpServer = new McpServer({ name: "test", version: "0.0.1" });
  registerLintDraftTool(mcpServer);
  const client = new Client({ name: "test-client", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

async function lint(client: Client, args: Record<string, unknown>): Promise<string> {
  const result = await client.callTool({ name: "content_lint", arguments: args });
  return (result.content as Array<{ type: string; text: string }>)[0].text;
}

const cleanDraft = `# How Do You Choose a Local AI GPU?

Pick the GPU with the most VRAM in your budget. For most people that means a 16GB
card, which runs 13B-parameter models at 4-bit quantization with room to spare. The
capacity of the card matters more than its clock speed, because inference is bound by
how much of the model fits in memory rather than by raw compute throughput.

## What is VRAM and why does it matter?

VRAM is the memory on your graphics card that holds the model while it runs. More
VRAM lets you load bigger models and keep longer context in memory. A 13B model at
4-bit needs about 8GB, plus a couple of gigabytes for the key-value cache. When a
model does not fit, it spills into system RAM and slows down sharply, so fitting the
whole model in VRAM is the number one thing to optimize for.

## Which GPU is the best value?

The [RTX 4060 Ti 16GB](/gpus/4060ti) is the best value under $500. It draws 165W and
handles most 13B workloads without a stutter. If you can find a used RTX 3090, its
24GB of VRAM unlocks 30B models for roughly the same money on the second-hand market,
which is the better buy if you can source one reliably.

## How much system RAM should you pair with it?

Match your VRAM with at least 32GB of system RAM. The model loads through system RAM
before it reaches the card, and a comfortable buffer keeps the OS responsive while a
large model is resident. For 24GB cards running 30B models, 64GB of system RAM is the
safer target.

## Frequently Asked Questions

### Can I run local AI on 8GB?

Yes. An 8GB card runs 7B models well at 4-bit quantization, which covers most coding,
chat, and summarization tasks. You will not run 13B models comfortably on 8GB, but 7B
models are capable enough for everyday work.

### How much system RAM do I need?

Keep at least 32GB so the model loads cleanly and the OS stays responsive. Going below
that forces heavier swapping and hurts load times on larger models.
`;

describe("content_lint tool", () => {
  it("returns a PASS scorecard for a clean draft", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      markdown: cleanDraft,
      title: "How to Choose a Local AI GPU: VRAM, Budget, and Picks",
      metaDescription:
        "Choosing a local AI GPU comes down to VRAM. Here is how much you need for 13B and 30B models, plus the best value pick under 500 dollars.",
      targetKeyword: "GPU",
    });

    expect(text).toContain("Draft Lint");
    expect(text).toContain("✅ PASS");
    expect(text).toContain("Ready to publish");
  });

  it("returns a FAIL and specific fixes for a bad draft", async () => {
    const client = await createTestClient();
    const badDraft =
      "# Title\n\n# Second Title\n\nOur cutting-edge and world-class platform will " +
      "supercharge and revolutionize your workflow — seamlessly.";
    const text = await lint(client, { markdown: badDraft });

    expect(text).toContain("❌ FAIL");
    expect(text).toContain("Specific fixes");
    expect(text).toContain("cutting-edge");
    expect(text).toContain("em dash");
    expect(text).toContain("Not ready");
  });

  it("reports title and meta length issues", async () => {
    const client = await createTestClient();
    const text = await lint(client, {
      markdown: "# A Heading\n\nSome reasonable body content for the draft goes here.",
      title: "short",
      metaDescription: "too short",
    });
    expect(text).toContain("Metadata");
    expect(text).toContain("❌");
  });

  it("surfaces the word and heading counts", async () => {
    const client = await createTestClient();
    const text = await lint(client, { markdown: cleanDraft });
    expect(text).toMatch(/\d+ words/);
    expect(text).toMatch(/H1 ·/);
  });
});
