import { useState } from "react";
import { Button } from "@/components/Button";
import type { usePdf } from "./usePdf";
import { printReport } from "./print-report";
import styles from "@/features/notes/components/NotesApp.module.css";
export function PdfActions({
  pdf,
  disabled,
}: {
  pdf: ReturnType<typeof usePdf>;
  disabled: boolean;
}) {
  const [printMessage, setPrintMessage] = useState("");
  const asset = pdf.asset;
  const canShare =
    !!asset &&
    typeof navigator !== "undefined" &&
    !!navigator.canShare?.({ files: [asset.file] });
  return (
    <>
      {pdf.error && (
        <p role="alert" className={styles.notice}>
          {pdf.error}
        </p>
      )}
      {pdf.stale && (
        <p role="status" className={styles.notice}>
          Relatório alterado. Gere o PDF novamente.
        </p>
      )}
      {asset && (
        <section className={styles.reportCard} aria-label="PDF gerado">
          <h2>PDF {pdf.stale ? "anterior" : "pronto"}</h2>
          <p>Gerar ou limpar o PDF não apaga suas notas.</p>
          <div className={styles.pdfActions}>
            <a
              className={styles.actionLink}
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visualizar PDF
            </a>
            <a
              className={styles.actionLink}
              href={asset.url}
              download={asset.file.name}
            >
              Baixar PDF
            </a>
            {canShare && (
              <Button variant="secondary" onClick={() => void pdf.share()}>
                Compartilhar PDF
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                if (!printReport(asset.notes, asset.url))
                  setPrintMessage(
                    "Permita a abertura de uma janela ou abra o PDF e imprima pelo visualizador do aparelho.",
                  );
              }}
            >
              Imprimir
            </Button>
            <Button
              variant="text"
              onClick={() => void pdf.clear()}
              disabled={disabled || pdf.busy}
            >
              Limpar PDF
            </Button>
          </div>
          {printMessage && <p role="status">{printMessage}</p>}
          <small>
            No celular, a visualização e a impressão dependem do leitor de PDF
            disponível.
          </small>
        </section>
      )}
    </>
  );
}
