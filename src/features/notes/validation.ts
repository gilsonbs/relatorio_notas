import type { NoteDraft } from "@/types/note";
export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1000 || year > 9999) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
export function validateNote(
  draft: NoteDraft,
): Partial<Record<keyof NoteDraft, string>> {
  const errors: Partial<Record<keyof NoteDraft, string>> = {};
  if (!draft.fornecedor.trim()) errors.fornecedor = "Informe o fornecedor.";
  if (!draft.numeroNota.trim()) errors.numeroNota = "Informe o número da nota.";
  if (!isValidDate(draft.emissao))
    errors.emissao = "Informe uma data de emissão válida.";
  if (!isValidDate(draft.recebimento))
    errors.recebimento = "Informe uma data de recebimento válida.";
  return errors;
}
