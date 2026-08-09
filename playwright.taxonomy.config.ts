import { defineConfig } from "@playwright/test"

/**
 * Config for the OPS taxonomy UI tests.
 *
 * Separate from playwright.config.ts because that one starts the storefront with `yarn start`,
 * while these tests drive the already-running OPS app on :4000 and must not boot anything.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "taxonomy-ops.spec.ts",
  fullyParallel: false,
  workers: 1,
  // Each test mutates shared taxonomy rows and restores them; a retry would start from whatever
  // state a failed run left behind, which is worse than a clean failure.
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4000",
    trace: "retain-on-failure",
  },
})
