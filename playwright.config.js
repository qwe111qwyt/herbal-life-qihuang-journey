import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:4178",
    screenshot: "only-on-failure",
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: "npm.cmd run dev -- --port 4178",
    url: "http://127.0.0.1:4178",
    reuseExistingServer: true,
  },
});
