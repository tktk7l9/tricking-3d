import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Default is node; DOM tests opt in with a `// @vitest-environment jsdom` docblock.
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Everything jsdom can exercise: state, DOM widgets, the boot entry, pure
      // helpers and the trick data/authoring DSL. Three.js rendering (scene,
      // character, analysis, animations) needs WebGL and is measured separately
      // by the Cameras test only.
      include: [
        "src/main.ts",
        "src/state/**/*.ts",
        "src/ui/**/*.ts",
        "src/lib/**/*.ts",
        "src/tricks/catalog.ts",
        "src/tricks/authoring.ts",
        "src/tricks/rig.ts",
      ],
      exclude: ["src/**/*.test.ts"],
      reporter: ["text", "json-summary", "html"],
      // Ratchet: measured 100% lines on src/ui, src/state, src/lib and main.ts
      // (stable over 3 runs); floors sit 2 points below so regressions fail CI
      // without making every refactor a threshold edit.
      thresholds: {
        "src/ui/**/*.ts": { statements: 97, branches: 90, functions: 100, lines: 98 },
        "src/state/**/*.ts": { statements: 98, branches: 98, functions: 100, lines: 98 },
        "src/lib/**/*.ts": { statements: 98, branches: 95, functions: 100, lines: 98 },
        "src/main.ts": { statements: 98, branches: 90, functions: 100, lines: 98 },
        "src/tricks/{catalog,authoring}.ts": { statements: 96, branches: 98, functions: 100, lines: 96 },
        "src/tricks/rig.ts": { statements: 98, branches: 95, functions: 100, lines: 98 },
      },
    },
  },
});
