import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ESM-native — matches "type": "module" in package.json
    environment: "node",

    // Test file patterns
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.mjs",
    ],

    // Global setup for MSW HTTP mocking
    setupFiles: ["tests/setup.ts"],

    // Coverage
    coverage: {
      provider: "v8",
      include: ["mcp/**/*.ts"],
      exclude: ["mcp/server.ts", "mcp/registry.ts"], // entrypoints, not logic
      thresholds: {
        // Enforce minimums — CI fails if these aren't met
        lines: 80,
        functions: 80,
        branches: 75,
      },
      reporter: ["text", "html", "lcov"],
    },

    // Readable output
    reporters: ["verbose"],
  },
});
