import { defineConfig, devices } from "@playwright/test";

const testPort = Number(process.env.COMBRIC_DOCS_TEST_PORT ?? 4321);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${testPort}`,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm preview:test",
    port: testPort,
    reuseExistingServer: false,
    env: { PORT: String(testPort) },
  },
});
