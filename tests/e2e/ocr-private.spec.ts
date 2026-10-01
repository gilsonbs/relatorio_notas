import { test, expect } from "@playwright/test";

test("fotografia privada fornecida para diagnóstico", async ({ page }) => {
  const sample = process.env.OCR_SAMPLE_PATH;
  test.skip(!sample, "Foto privada disponível somente no diagnóstico local.");
  await page.goto("./");
  await page.getByRole("button", { name: "Fotografar primeira nota" }).click();
  await page
    .getByLabel("Fotografia da galeria", { exact: true })
    .setInputFiles(sample!);
  await expect(
    page.getByRole("heading", { name: "Conferir dados" }),
  ).toBeVisible({ timeout: 130_000 });
  await expect(page.getByLabel("Fornecedor", { exact: true })).toHaveValue(
    process.env.OCR_SAMPLE_SUPPLIER!,
  );
  await expect(page.getByLabel("Nº da nota", { exact: true })).toHaveValue(
    process.env.OCR_SAMPLE_NUMBER!,
  );
  await expect(page.getByLabel("Emissão", { exact: true })).toHaveValue(
    process.env.OCR_SAMPLE_DATE!,
  );
});
