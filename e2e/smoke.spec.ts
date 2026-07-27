import { expect, test } from "@playwright/test";

test.describe("shothik-web smoke suite", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/localhost:3000/);
  });

  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
  });

  test("swagger endpoint responds", async ({ request }) => {
    const response = await request.get("/api/docs/swagger.json");
    expect(response.ok()).toBeTruthy();
  });
});
