import type { Note, NoteDraft } from "@/types/note";
import { normalizeSupplier, normalizeNumber } from "@/utils/normalization";
export function findDuplicate(
  notes: Note[],
  draft: NoteDraft,
  excludedId?: string,
) {
  return notes.find(
    (note) =>
      note.id !== excludedId &&
      normalizeSupplier(note.fornecedor) ===
        normalizeSupplier(draft.fornecedor) &&
      normalizeNumber(note.numeroNota) === normalizeNumber(draft.numeroNota),
  );
}
