import { test, expect } from "@playwright/test";

test("Login → CRM → crear cliente → ver detalle → salir", async ({ page }) => {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  const clientName = `E2E Playwright ${uniqueId}`;
  const email = `playwright-${uniqueId}@example.test`;

  await page.goto("/login");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);

  const loginResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname === "/api/auth/login",
  );
  await page.getByRole("button", { name: "Ingresar" }).click();
  expect((await loginResponse).status()).toBe(200);

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: "Marketing y ventas" }).click();
  await expect(page).toHaveURL(/\/crm$/);
  await page.getByRole("button", { name: "+ Nuevo cliente" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo cliente" })).toBeVisible();

  await page.locator('input[name="razon_social_nombres"]').fill(clientName);
  await page.locator('input[name="num_documento"]').fill(`E2E${uniqueId.replace(/\D/g, "")}`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="telefono"]').fill("999123456");

  const responsable = page.locator('select[name="id_usuario"]');
  await expect(responsable.locator("option").nth(1)).toBeAttached({ timeout: 15_000 });
  await responsable.selectOption({ index: 1 });

  const createResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname === "/api/crm/clientes",
  );
  await page.getByRole("button", { name: "Crear cliente" }).click();
  expect((await createResponse).status()).toBe(201);

  const clientRow = page.getByRole("row").filter({ hasText: clientName });
  await expect(clientRow).toBeVisible();

  const detailResponse = page.waitForResponse((response) =>
    response.request().method() === "GET" &&
    new URL(response.url()).pathname.startsWith("/api/crm/clientes/") &&
    response.status() === 200,
  );
  await clientRow.getByRole("button", { name: "Ver", exact: true }).click();
  expect((await detailResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: clientName })).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.locator('button[aria-label^="Cerrar sesi"]').click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("#username")).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("nexora.session"))).toBeNull();
});
