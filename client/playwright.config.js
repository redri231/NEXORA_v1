import { defineConfig } from "@playwright/test";

const requiredEnvironment = [
  "E2E_DATABASE_URL",
  "E2E_AUTH_SECRET",
  "E2E_USERNAME",
  "E2E_PASSWORD",
];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

if (missingEnvironment.length) {
  throw new Error(
    `Configura variables de entorno para E2E: ${missingEnvironment.join(", ")}. ` +
    "E2E_DATABASE_URL debe apuntar a una base PostgreSQL aislada de pruebas.",
  );
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node scripts/iniciar-e2e.js",
      cwd: "../server",
      url: "http://127.0.0.1:3000/",
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: "npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort",
      cwd: ".",
      url: "http://127.0.0.1:5173/",
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
});
