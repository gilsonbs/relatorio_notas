import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function manual(page: Page, number: string, received = "2026-09-22") {
  await page
    .getByRole("button", { name: "Preencher manualmente", exact: true })
    .click();
  await page.getByLabel("Fornecedor", { exact: true }).fill("PROFARMA");
  await page.getByLabel("Nº da nota", { exact: true }).fill(number);
  await page.getByLabel("Emissão", { exact: true }).fill("2026-09-21");
  await page.getByLabel("Recebimento", { exact: true }).fill(received);
  await page.getByRole("button", { name: "Salvar nota", exact: true }).click();
}
async function offlineReady(page: Page) {
  await page.goto("./");
  await expect(
    page.getByText("Pronto para usar offline, inclusive a leitura de fotos."),
  ).toBeVisible({ timeout: 120_000 });
}
test("cadastro, persistência, PDF, duplicidade e exclusões funcionam offline", async ({
  page,
  context,
}, testInfo) => {
  await offlineReady(page);
  await manual(page, "00123");
  await expect(page.getByRole("heading", { name: "Nota salva" })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "1 nota recebida" }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "1 nota recebida" }),
  ).toBeVisible();
  await manual(page, "00456", "2026-09-23");
  await expect(page.getByRole("heading", { name: "Nota salva" })).toBeVisible();
  await page.getByRole("button", { name: "Início", exact: true }).click();
  await page.getByRole("button", { name: "Gerar PDF", exact: true }).click();
  await expect(page.getByRole("heading", { name: "PDF pronto" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Baixar PDF" }).click();
  const download = await downloadPromise;
  const pdfPath = testInfo.outputPath("relatorio.pdf");
  await download.saveAs(pdfPath);
  expect((await readFile(pdfPath)).subarray(0, 4).toString()).toBe("%PDF");
  await page.getByRole("button", { name: "Ver notas", exact: true }).click();
  await expect(page.getByText("22/09/2026", { exact: true })).toBeVisible();
  await expect(page.getByText("23/09/2026", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Editar", exact: true })
    .first()
    .click();
  await page.getByLabel("Nº da nota", { exact: true }).fill("00999");
  await page.getByRole("button", { name: "Salvar nota", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nota salva" })).toBeVisible();
  await page.getByRole("button", { name: "Início", exact: true }).click();
  await expect(
    page.getByText("Relatório alterado. Gere o PDF novamente."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpar PDF", exact: true }).click();
  await expect(page.getByRole("link", { name: "Visualizar PDF" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { name: "2 notas recebidas" }),
  ).toBeVisible();
  await manual(page, "00999");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("button", { name: "Salvar nota", exact: true }).click();
  await page
    .getByRole("button", { name: "Salvar mesmo assim", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Nota salva" })).toBeVisible();
  await page.getByRole("button", { name: "Ver notas", exact: true }).click();
  await expect(page.getByText("3 notas no relatório")).toBeVisible();
  await page
    .getByRole("button", { name: "Excluir", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByText("3 notas no relatório")).toBeVisible();
  await page
    .getByRole("button", { name: "Excluir", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Excluir nota", exact: true }).click();
  await expect(page.getByText("2 notas no relatório")).toBeVisible();
  await page
    .getByRole("button", { name: "Zerar relatório", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByText("2 notas no relatório")).toBeVisible();
  await page
    .getByRole("button", { name: "Zerar relatório", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Zerar relatório", exact: true })
    .click();
  await expect(page.getByText("Seu relatório está vazio.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Gerar PDF" })).toBeDisabled();
});
test("OCR identifica os três campos de imagem local mesmo offline", async ({
  page,
  context,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (
      /^https?:/.test(request.url()) &&
      !request
        .url()
        .startsWith(`http://127.0.0.1:${process.env.PORT || "4173"}/`)
    )
      external.push(request.url());
  });
  await offlineReady(page);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Fotografar primeira nota" }).click();
  await page
    .getByLabel("Fotografia da galeria", { exact: true })
    .setInputFiles("tests/fixtures/nota-teste.png");
  await expect(
    page.getByRole("heading", { name: "Conferir dados" }),
  ).toBeVisible({ timeout: 130_000 });
  await expect(page.getByLabel("Fornecedor", { exact: true })).toHaveValue(
    "PROFARMA",
  );
  await expect(page.getByLabel("Nº da nota", { exact: true })).toHaveValue(
    "416722",
  );
  await expect(page.getByLabel("Emissão", { exact: true })).toHaveValue(
    "2026-09-21",
  );
  expect(external).toEqual([]);
});
test("falha na imagem mantém o cadastro manual disponível", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Fotografar primeira nota" }).click();
  await page
    .getByLabel("Fotografia da galeria", { exact: true })
    .setInputFiles({
      name: "invalida.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    });
  await expect(
    page.getByText(
      "Não conseguimos identificar os dados automaticamente. Preencha os campos abaixo.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Fornecedor", { exact: true })).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Salvar nota", exact: true }),
  ).toBeEnabled();
});
test("interface não transborda em telas estreitas", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(
      page.getByRole("button", { name: "Fotografar primeira nota" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: testInfo.outputPath("inicio-mobile.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Preencher manualmente", exact: true })
    .click();
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
