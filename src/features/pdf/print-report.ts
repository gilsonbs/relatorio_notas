import type { Note } from "@/types/note";
import { groupNotes } from "./group-notes";
import { formatDate } from "@/utils/dates";
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function printReport(notes: Note[], pdfUrl: string): boolean {
  const popup = window.open("", "_blank");
  if (!popup) return false;
  popup.opener = null;
  if (typeof popup.print !== "function") {
    popup.location.href = pdfUrl;
    return true;
  }
  const rows = groupNotes(notes)
    .map(
      (row) =>
        `<tr>${[row.fornecedor, row.numeros.join(", "), formatDate(row.emissao), formatDate(row.recebimento)].map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`,
    )
    .join("");
  popup.document.write(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RELATÓRIO DE NOTAS FILIAL 15</title><style>@page{size:A4;margin:14mm}body{font:10pt Arial;color:#18251e}h1{text-align:center;font-size:14pt;margin:0 0 10mm}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #b8c0b9;padding:3mm;text-align:left;overflow-wrap:anywhere}th{background:#e4eae4}thead{display:table-header-group}tr{break-inside:avoid}th:nth-child(1){width:29%}th:nth-child(2){width:35%}th:nth-child(3),th:nth-child(4){width:18%}</style></head><body><h1>RELATÓRIO DE NOTAS FILIAL 15</h1><table><thead><tr><th>Fornecedor</th><th>Nº da(s) Nota(s)</th><th>Emissão</th><th>Recebimento</th></tr></thead><tbody>${rows}</tbody></table></body></html>`,
  );
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}
