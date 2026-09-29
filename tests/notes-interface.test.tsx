// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotesApp } from "@/features/notes/components/NotesApp";
import { notesRepository } from "@/storage/notes-repository";
import { localDateInputValue } from "@/utils/dates";
beforeEach(async () => {
  await notesRepository.reset();
});
describe("Cadastro manual", () => {
  it("impede gerar PDF vazio", async () => {
    render(<NotesApp />);
    expect(await screen.findByText("Seu relatório está vazio.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Gerar PDF" })).toBeDisabled();
  });
  it("salva os campos e mostra a nota após remontar a aplicação", async () => {
    const view = render(<NotesApp />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Preencher manualmente" }),
    );
    expect(screen.getByLabelText("Recebimento")).toHaveValue(
      localDateInputValue(),
    );
    fireEvent.change(screen.getByLabelText("Fornecedor"), {
      target: { value: "PROFARMA" },
    });
    fireEvent.change(screen.getByLabelText("Nº da nota"), {
      target: { value: "00123" },
    });
    fireEvent.change(screen.getByLabelText("Emissão"), {
      target: { value: "2026-09-21" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nota" }));
    expect(
      await screen.findByRole("heading", { name: "Nota salva" }),
    ).toBeVisible();
    view.unmount();
    render(<NotesApp />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver notas" }));
    expect(await screen.findByText("PROFARMA")).toBeVisible();
    expect(screen.getByText("00123")).toBeVisible();
  });
  it("não salva campos vazios", async () => {
    render(<NotesApp />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Preencher manualmente" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar nota" }));
    await waitFor(() =>
      expect(screen.getByText("Informe o fornecedor.")).toBeVisible(),
    );
    expect((await notesRepository.snapshot()).notes).toHaveLength(0);
  });
});
