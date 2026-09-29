import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { Note } from "@/types/note";
import { groupNotes } from "./group-notes";
import { formatDate } from "@/utils/dates";
export const REPORT_TITLE = "RELATÓRIO DE NOTAS FILIAL 15";
export function buildPdf(notes: Note[]) {
  if (!notes.length) throw new Error("Adicione notas para gerar o relatório.");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const rows = groupNotes(notes);
  autoTable(doc, {
    head: [["Fornecedor", "Nº da(s) Nota(s)", "Emissão", "Recebimento"]],
    body: rows.map((row) => [
      row.fornecedor,
      row.numeros.join(", "),
      formatDate(row.emissao),
      formatDate(row.recebimento),
    ]),
    startY: 28,
    margin: { top: 28, bottom: 18, left: 14, right: 14 },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 3,
      overflow: "linebreak",
      lineColor: [190, 196, 190],
      lineWidth: 0.15,
      textColor: [25, 35, 30],
    },
    headStyles: {
      fillColor: [228, 234, 228],
      textColor: [25, 35, 30],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 53 },
      1: { cellWidth: 65 },
      2: { cellWidth: 31 },
      3: { cellWidth: 33 },
    },
    showHead: "everyPage",
    rowPageBreak: "avoid",
    didDrawPage: () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(REPORT_TITLE, 105, 17, { align: "center" });
    },
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text(`${page} / ${pages}`, 196, 287, { align: "right" });
  }
  return doc;
}
export function generatePdf(notes: Note[]): Blob {
  return buildPdf(notes).output("blob");
}
