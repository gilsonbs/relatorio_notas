import { describe, expect, it } from "vitest";
import type { Note } from "@/types/note";
import { groupNotes } from "@/features/pdf/group-notes";
import { buildPdf } from "@/features/pdf/pdf-service";
const note: Note = {
  id: "1",
  fornecedor: "SANTA CRUZ",
  numeroNota: "373419",
  emissao: "2026-09-22",
  recebimento: "2026-09-23",
  criadoEm: "2026-09-23T10:00:00Z",
};
describe("PDF", () => {
  it("agrupa somente fornecedor, emissão e recebimento iguais", () => {
    const rows = groupNotes([
      note,
      { ...note, id: "2", numeroNota: "365086" },
      { ...note, id: "3", emissao: "2026-09-21" },
      { ...note, id: "4", recebimento: "2026-09-24" },
      { ...note, id: "5", fornecedor: "PROFARMA" },
    ]);
    expect(rows).toHaveLength(4);
    expect(rows[0].numeros).toEqual(["373419", "365086"]);
  });
  it("gera várias páginas sem alterar os registros", () => {
    const notes = Array.from({ length: 150 }, (_, index) => ({
      ...note,
      id: String(index),
      fornecedor: `FORNECEDOR ${index}`,
    }));
    const before = JSON.stringify(notes);
    const doc = buildPdf(notes);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(JSON.stringify(notes)).toBe(before);
    expect(doc.output()).toContain("%PDF");
  });
  it("quebra uma lista muito longa de números em várias páginas", () => {
    const notes = Array.from({ length: 900 }, (_, index) => ({
      ...note,
      numeroNota: String(index).padStart(9, "0"),
    }));
    expect(buildPdf(notes).getNumberOfPages()).toBeGreaterThan(1);
  });
  it("rejeita relatório vazio", () => {
    expect(() => buildPdf([])).toThrow();
  });
});
