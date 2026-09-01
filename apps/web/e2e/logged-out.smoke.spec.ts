import { expect, test } from "@playwright/test";

test("a logged-out visitor can reach the login form", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /welcome to ketsui/i })).toBeVisible();
  await expect(page.getByText("You are not signed in.")).toBeVisible();
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});
