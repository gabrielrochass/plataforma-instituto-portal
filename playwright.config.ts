import { defineConfig, devices } from "@playwright/test";
import { e2eEmail } from "./e2e/env";

const port = 3100;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  workers: 2,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Galaxy S8"] },
      testIgnore: /desktop\.spec\.ts/,
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /desktop\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    url: `http://localhost:${port}/dev/ui`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { DEV_UI: "1", DEV_AUTH: "1", DEV_AUTH_EMAIL: e2eEmail },
  },
});
