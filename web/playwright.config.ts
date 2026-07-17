import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.CNCWEB_PLAYWRIGHT_PORT ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("CNCWEB_PLAYWRIGHT_PORT must be an integer from 1 through 65535");
}

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "owned-content.preflight.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    serviceWorkers: "allow",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm preview --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI && process.env.CNCWEB_PLAYWRIGHT_PORT === undefined,
    timeout: 30_000,
  },
});
