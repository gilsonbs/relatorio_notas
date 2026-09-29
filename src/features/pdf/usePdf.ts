import { useEffect, useState, useRef } from "react";
import { notesRepository } from "@/storage/notes-repository";
import type { Note } from "@/types/note";
import type { useNotes } from "@/features/notes/hooks/useNotes";
import { localDateInputValue } from "@/utils/dates";
export type PdfAsset = {
  file: File;
  url: string;
  revision: number;
  notes: Note[];
};
export function usePdf(report: ReturnType<typeof useNotes>) {
  const [asset, setAsset] = useState<PdfAsset>();
  const generationId = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(
    () => () => {
      if (asset) URL.revokeObjectURL(asset.url);
    },
    [asset],
  );
  async function generate() {
    const job = ++generationId.current;
    setBusy(true);
    setError("");
    try {
      const snapshot = await notesRepository.snapshot();
      if (!snapshot.notes.length) throw new Error("empty");
      const { generatePdf } = await import("./pdf-service");
      const blob = generatePdf(snapshot.notes);
      const file = new File(
        [blob],
        `relatorio-filial-15-${localDateInputValue()}.pdf`,
        { type: "application/pdf" },
      );
      const current = await notesRepository.snapshot();
      if (job !== generationId.current) return;
      if (current.metadata.revision !== snapshot.metadata.revision)
        throw new Error("Relatório alterado.");
      await notesRepository.markPdf(snapshot.metadata.revision);
      if (job !== generationId.current) return;
      setAsset({
        file,
        url: URL.createObjectURL(file),
        revision: snapshot.metadata.revision,
        notes: snapshot.notes,
      });
      await report.refresh();
    } catch {
      setError(
        "Não foi possível gerar o PDF. Verifique se há notas e tente novamente.",
      );
    } finally {
      if (job === generationId.current) setBusy(false);
    }
  }
  async function clear() {
    if (await report.mutate(() => notesRepository.markPdf(null)))
      setAsset(undefined);
  }
  async function share() {
    if (!asset) return;
    try {
      await navigator.share({
        files: [asset.file],
        title: "Relatório de Notas Filial 15",
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setError(
          "Não foi possível compartilhar. Use Baixar PDF para salvar o arquivo.",
        );
    }
  }
  const stale =
    (asset ? asset.revision : report.metadata.pdfRevision) !== null &&
    (asset ? asset.revision : report.metadata.pdfRevision) !==
      report.metadata.revision;
  return {
    asset,
    busy,
    error,
    stale,
    generate,
    clear,
    share,
    clearLocal: () => {
      generationId.current++;
      setBusy(false);
      setAsset(undefined);
      setError("");
    },
  };
}
