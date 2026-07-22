import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:3011", trace: "retain-on-failure" },
  webServer: {
    command: "node ./node_modules/next/dist/bin/next dev -p 3011",
    url: "http://127.0.0.1:3011",
    reuseExistingServer: false,
    env: { INTERVIEW_DOJO_DB_PATH: "./.tmp/e2e.db" },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        launchOptions: {
          executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        },
      },
    },
  ],
});
