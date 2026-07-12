import { defineConfig, devices } from "@playwright/test";

// Serves the static site and runs the smoke suite against it.
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8080",
    trace: "on-first-retry",
  },
  webServer: {
    command: "python3 -m http.server 8080",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: true,
    timeout: 20000,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    // Mobile coverage on a Chromium-based device so no extra browser engine
    // (and no root-level system deps) is required to run the suite.
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
});
