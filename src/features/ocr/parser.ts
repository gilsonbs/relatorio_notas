import { KNOWN_SUPPLIERS } from "@/config/suppliers";
import { isValidDate } from "@/features/notes/validation";
import type { NoteDraft } from "@/types/note";
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
const unique = (values: string[]) => {
  const matches = [...new Set(values.filter(Boolean))];
  return matches.length === 1 ? matches[0] : "";
};
export function parseInvoiceNumber(text: string): string {
  const source = fold(text);
  const number = "([0-9]{1,3}(?:\\.[0-9]{3}){1,2}|[0-9]{1,9})(?![0-9.])";
  const label = "(?:N[º°O.]?\\s*|NUMERO\\s*)";
  const explicit = new RegExp(
    `(?:NUMERO\\s+(?:DA\\s+)?NOTA(?:\\s+FISCAL)?|N[º°O.]?\\s+DA\\s+NOTA(?:\\s+FISCAL)?|NF[ -]?E\\s*(?:${label})?|NOTA\\s+FISCAL\\s+${label})\\s*[:#-]?\\s*${number}`,
    "g",
  );
  const found = [...source.matchAll(explicit)].map((match) =>
    match[1].replace(/\./g, ""),
  );
  if (found.length) return unique(found);
  if (!/\b(?:DANFE|NF[ -]?E|NOTA FISCAL)\b/.test(source)) return "";
  const standalone = new RegExp(
    `^\\s*${label}[:#-]?\\s*${number}(?:\\s*(?:SERIE\\b.*)?|\\s*)$`,
    "gm",
  );
  const header = source.split(/DESTINATARIO|DADOS\s+DO[S]?\s+PRODUTO/)[0];
  // O OCR pode unir o número à coluna vizinha com a referência à NF-e.
  const inline = new RegExp(
    `\\b${label}[:#-]?\\s*${number}(?=\\s+(?:NF[ -]?E|SERIE)\\b)`,
    "g",
  );
  // Em DANFEs, o rótulo Nº pode virar pontuação; a coluna de consulta
  // NF-e e a série logo abaixo delimitam o número sem usar outros valores.
  const besideConsultation = new RegExp(
    `(?:^|\\s)${number}(?=\\s+NF[ -]?E\\s+WWW\\.[^\\n]*\\n[^\\n]*\\bSERIE\\s+\\d)`,
    "gm",
  );
  const consultation = /\bDANFE\b/.test(header)
    ? [...header.matchAll(besideConsultation)]
    : [];
  return unique(
    [
      ...header.matchAll(standalone),
      ...header.matchAll(inline),
      ...consultation,
    ].map((match) => match[1].replace(/\./g, "")),
  );
}
function parseDateToken(token: string) {
  const parts = token.split(/[/.\-]/);
  const value =
    parts[0].length === 4
      ? parts.join("-")
      : [parts[2], parts[1].padStart(2, "0"), parts[0].padStart(2, "0")].join(
          "-",
        );
  return isValidDate(value) ? value : "";
}
export function parseIssueDate(text: string): string {
  const source = fold(text);
  const values: string[] = [];
  // Somente rótulos de emissão. Tolerância restrita a letras mal reconhecidas
  // após "DATA DE", sem corrigir ou inferir dígitos da própria data.
  const labels = /\b(?:EMISSAO|DATA\s+(?:D[EA]\s+)?[A-Z1]{1,3}SSAO)\b/g;
  const datePattern =
    /(?<!\d)(\d{4}-\d{2}-\d{2}|\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4})(?!\d)/g;
  for (const label of source.matchAll(labels)) {
    const following = source
      .slice(label.index! + label[0].length)
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .slice(0, 2)
      .join("\n");
    const bounded = following.split(
      /\b(?:(?:DATA\s+(?:D[EA]\s+)?)?(?:ENTRADA|SAIDA|RECEBIMENTO|VENCIMENTO)|PROTOCOLO|EMISSAO)\b/,
    )[0];
    for (const match of bounded.matchAll(datePattern))
      values.push(parseDateToken(match[1]));
  }
  return unique(values);
}
export function identifySupplier(text: string): string {
  // Do not match a known supplier inside the recipient or product sections.
  const source = fold(text).split(
    /DESTINATARIO\s*[/\-]?\s*REMETENTE|DESTINATARIO|DADOS\s+DOS\s+PRODUTOS/,
  )[0];
  const known = KNOWN_SUPPLIERS.filter((supplier) =>
    new RegExp(`\\b${supplier.replace(/ /g, "\\s*")}\\b`).test(source),
  );
  if (known.length) return unique([...known]);
  const explicit =
    source.match(
      /RECEBEMOS\s+DE\s+([^\n]+?)\s+(?:OS\s+PRODUTOS|OS\s+SERVICOS|OS\s+PRODUTOS\/SERVICOS)/,
    ) ??
    source.match(
      /(?:IDENTIFICACAO\s+DO\s+EMITENTE|NOME\s*\/\s*RAZAO\s+SOCIAL|RAZAO\s+SOCIAL|EMITENTE)\s*[:\-]?\s*\n?([^\n]+)/,
    );
  const candidate = explicit?.[1].trim() ?? "";
  if (
    candidate.length < 3 ||
    candidate.length > 140 ||
    /\d|\b(?:CNPJ|ENDERECO|DANFE|NOTA FISCAL|DESTINATARIO)\b/.test(candidate)
  )
    return "";
  return candidate;
}
export function parseOcrText(
  text: string,
): Pick<NoteDraft, "fornecedor" | "numeroNota" | "emissao"> {
  return {
    fornecedor: identifySupplier(text),
    numeroNota: parseInvoiceNumber(text),
    emissao: parseIssueDate(text),
  };
}
