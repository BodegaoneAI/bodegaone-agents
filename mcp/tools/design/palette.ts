import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generatePalette, type Harmony, type Swatch } from "../../lib/palette.js";

const HARMONIES: [Harmony, ...Harmony[]] = [
  "complementary",
  "analogous",
  "triadic",
  "split-complementary",
  "tetradic",
  "monochromatic",
];

function swatchRow(sw: Swatch): string {
  return `| \`${sw.name}\` | ${sw.hex} | ${sw.role} | text ${sw.onColor} (${sw.textContrast}:1) |`;
}

export function registerPaletteTool(server: McpServer) {
  server.registerTool(
    "design_palette",
    {
      title: "Generate an Accessible Color Palette",
      description:
        "Generates a harmonious, WCAG-accessible color palette from a base color and a harmony " +
        "type (complementary, analogous, triadic, split-complementary, tetradic, monochromatic). " +
        "Returns the brand/primary color, harmony accents, a tinted neutral ramp (50-900), " +
        "semantic colors (success/warning/error/error), each with a contrast-checked text color, " +
        "plus ready-to-paste CSS custom properties. Accents are tuned so white text meets WCAG AA. " +
        "Use it to build a palette; still reason about brand fit, which accent is the single CTA, " +
        "and the 60/30/10 split yourself.",
      inputSchema: z.object({
        baseColor: z.string().describe("Base/brand color as hex, e.g. #2563eb or #25f"),
        harmony: z
          .enum(HARMONIES)
          .optional()
          .default("complementary")
          .describe("Color harmony to derive accents from"),
      }),
    },
    async ({ baseColor, harmony }) => {
      const p = generatePalette(baseColor, harmony);

      const lines: string[] = [];
      lines.push(`## Palette — ${p.harmony} from ${p.base}`);
      lines.push(``);
      lines.push(`| Token | Hex | Role | On-color text |`);
      lines.push(`|---|---|---|---|`);
      lines.push(swatchRow(p.brand));
      for (const a of p.accents) lines.push(swatchRow(a));
      lines.push(``);
      lines.push(`**Neutral ramp** (brand hue, low saturation):`);
      lines.push(``);
      lines.push(`| Token | Hex | Role |`);
      lines.push(`|---|---|---|`);
      for (const n of p.neutrals) lines.push(`| \`${n.name}\` | ${n.hex} | ${n.role} |`);
      lines.push(``);
      lines.push(`**Semantic:**`);
      lines.push(``);
      lines.push(`| Token | Hex | Role | On-color text |`);
      lines.push(`|---|---|---|---|`);
      for (const sm of p.semantic) lines.push(swatchRow(sm));
      lines.push(``);

      if (p.flags.length > 0) {
        lines.push(`**Notes:**`);
        for (const f of p.flags) lines.push(`- ${f}`);
        lines.push(``);
      }

      lines.push(`**CSS variables:**`);
      lines.push("```css");
      lines.push(p.cssVariables);
      lines.push("```");
      lines.push(``);
      lines.push(
        `Apply the 60/30/10 rule: ~60% neutral surfaces, ~30% secondary, ~10% accent for CTAs. ` +
          `The tool guarantees contrast and harmony; you choose which accent is the single primary ` +
          `CTA and whether the harmony fits the brand. Re-check any hand-edited pair with \`design_lint\`.`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );
}
