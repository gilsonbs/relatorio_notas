import type { Note, NoteDraft } from "@/types/note";
import { validateNote } from "./validation";
export function createNote(draft: NoteDraft, existing?: Note): Note {
  if (Object.keys(validateNote(draft)).length)
    throw new Error("Confira os campos obrigatórios.");
  return {
    ...draft,
    fornecedor: draft.fornecedor.trim().replace(/\s+/g, " "),
    numeroNota: draft.numeroNota.trim(),
    id: existing?.id ?? crypto.randomUUID(),
    criadoEm: existing?.criadoEm ?? new Date().toISOString(),
  };
}
