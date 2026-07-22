import { expect, test } from "@playwright/test";

test("starts a session and persists a saved answer after refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Local question library" })).toBeVisible();
  await page.screenshot({ path: "docs/assets/library.png", fullPage: true });
  await page.getByRole("button", { name: "Start timed session" }).first().click();
  await expect(page.getByRole("heading", { name: "Streaming pair detector" })).toBeVisible();
  await page.getByLabel("Your local answer").fill("Use a map of seen complements.");
  await page.getByRole("button", { name: "Save answer version" }).click();
  await expect(page.getByText("Version saved to this device.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Your local answer")).toHaveValue("Use a map of seen complements.");
  await expect(page.getByText("1 persisted version(s)")).toBeVisible();
});
test("records a transparent rubric self-assessment", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start timed session" }).nth(1).click();
  await page.getByLabel("Score").first().selectOption("4");
  await page.getByRole("button", { name: "Record rubric" }).click();
  await expect(
    page.getByText("Self-assessment recorded. This is not a hiring decision."),
  ).toBeVisible();
  await expect(page.getByText(/Recorded transparent self-score/)).toBeVisible();
});
test("exports reports without answers by default and only includes an answer after consent", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start timed session" }).nth(2).click();
  await page.getByLabel("Your local answer").fill("do not export unless selected");
  await page.getByRole("button", { name: "Save answer version" }).click();
  const reportUrl = await page
    .getByRole("link", { name: "Download training report" })
    .getAttribute("href");
  if (!reportUrl) throw new Error("Missing report URL");
  const hidden = (await (await request.get(reportUrl)).json()) as { answer: string | null };
  expect(hidden.answer).toBeNull();
  await page.getByLabel("Include the latest local answer in the exported report").click();
  const chosen = (await (await request.get(reportUrl)).json()) as { answer: string | null };
  expect(chosen.answer).toBe("do not export unless selected");
});
