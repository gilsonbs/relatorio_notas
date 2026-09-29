import type { Note } from "@/types/note";
import { normalizeSupplier } from "@/utils/normalization";
export type ReportRow = {
  fornecedor: string;
  numeros: string[];
  emissao: string;
  recebimento: string;
};
export function groupNotes(notes: Note[]): ReportRow[] {
  const rows = new Map<string, ReportRow>();
  for (const note of notes) {
    const supplier = normalizeSupplier(note.fornecedor);
    const key = JSON.stringify([supplier, note.emissao, note.recebimento]);
    const row = rows.get(key);
    if (row) row.numeros.push(note.numeroNota);
    else
      rows.set(key, {
        fornecedor: supplier,
        numeros: [note.numeroNota],
        emissao: note.emissao,
        recebimento: note.recebimento,
      });
  }
  return [...rows.values()];
}
