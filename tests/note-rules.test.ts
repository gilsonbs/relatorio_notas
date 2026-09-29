import { describe, expect, it } from "vitest";
import { findDuplicate } from "@/features/notes/duplicates";
import { createNote } from "@/features/notes/note-service";
import { isValidDate } from "@/features/notes/validation";
const draft = {
  fornecedor: "Santa Cruz",
  numeroNota: "00123",
  emissao: "2026-09-21",
  recebimento: "2026-09-22",
};
describe("Regras das notas", () => {
  it("detecta duplicidade com espaços e caixa diferentes", () => {
    const note = createNote(draft);
    expect(
      findDuplicate([note], { ...draft, fornecedor: " SANTA   CRUZ " }),
    ).toEqual(note);
    expect(findDuplicate([note], draft, note.id)).toBeUndefined();
    expect(
      findDuplicate([note], { ...draft, fornecedor: "PROFARMA" }),
    ).toBeUndefined();
  });
  it("preserva identidade e criação ao editar", () => {
    const note = createNote(draft);
    const edited = createNote({ ...draft, numeroNota: "456" }, note);
    expect(edited.id).toBe(note.id);
    expect(edited.criadoEm).toBe(note.criadoEm);
  });
  it("rejeita datas impossíveis e aceita ano bissexto", () => {
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("2026-04-31")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
  });
});
