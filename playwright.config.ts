import { defineConfig } from "@playwright/test";
const port = process.env.PORT || "4173";
const rootUrl = `http://127.0.0.1:${port}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 150_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: {
    baseURL: rootUrl,
    channel: process.env.CI ? undefined : "chrome",
    headless: true,
    viewport: { width: 390, height: 844 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview",
    url: rootUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
