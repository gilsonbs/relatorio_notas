export type NoteDraft = {
  fornecedor: string;
  numeroNota: string;
  emissao: string;
  recebimento: string;
};
export type Note = NoteDraft & { id: string; criadoEm: string };
export type ReportMetadata = { revision: number; pdfRevision: number | null };
export type ReportSnapshot = { notes: Note[]; metadata: ReportMetadata };
