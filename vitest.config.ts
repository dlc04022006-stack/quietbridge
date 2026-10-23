import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/**/*.ts", "apps/mcp-server/src/**/*.ts"],
      exclude: ["**/*.test.ts", "apps/mcp-server/src/index.ts"],
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        statements: 85,
        branches: 70,
        functions: 90,
        lines: 85
      }
    }
  }
});
