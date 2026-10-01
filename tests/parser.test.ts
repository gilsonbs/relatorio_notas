import { describe, expect, it } from "vitest";
import {
  identifySupplier,
  parseInvoiceNumber,
  parseIssueDate,
  parseOcrText,
} from "@/features/ocr/parser";
describe("Número da nota", () => {
  it.each([
    ["NF-e Nº 000.373.419", "000373419"],
    ["Número da Nota: 4120793", "4120793"],
    ["DANFE\nNº 373419\nSÉRIE 1", "373419"],
    ["NF-e\n373419", "373419"],
    ["Nota Fiscal Nº 00123", "00123"],
  ])("interpreta %s", (text, expected) =>
    expect(parseInvoiceNumber(text)).toBe(expected),
  );
  it.each([
    "CNPJ 12.345.678/0001-90",
    "NF-e 35260912345678000190550010001234561234567890",
    "NF-e\nRua Central Nº 123",
    "Nº 123",
    "NF-e Nº 123\nNF-e Nº 456",
  ])("não inventa número em %s", (text) =>
    expect(parseInvoiceNumber(text)).toBe(""),
  );
});
describe("Emissão", () => {
  it.each([
    ["Data de Emissão: 21/09/2026", "2026-09-21"],
    ["EMISSÃO\n22.09.2026", "2026-09-22"],
    ["Emissão: 2026-09-21", "2026-09-21"],
    ["Emissão 29/02/2024", "2024-02-29"],
  ])("interpreta %s", (text, expected) =>
    expect(parseIssueDate(text)).toBe(expected),
  );
  it.each([
    "Recebimento: 21/09/2026",
    "21/09/2026",
    "Emissão: 31/02/2026",
    "Emissão 21/09/2026\nEmissão 22/09/2026",
    "Emissão\nSaída 22/09/2026",
  ])("deixa vazio quando ambíguo ou inválido: %s", (text) =>
    expect(parseIssueDate(text)).toBe(""),
  );
});
describe("Fornecedor", () => {
  it("reconhece fornecedores conhecidos com variação de espaços", () => {
    expect(identifySupplier("Distribuidora Santa   Cruz Ltda")).toBe(
      "SANTA CRUZ",
    );
  });
  it("aceita emitente fora da lista", () => {
    expect(identifySupplier("EMITENTE: NOVA DISTRIBUIDORA LTDA")).toBe(
      "NOVA DISTRIBUIDORA LTDA",
    );
  });
  it("não usa destinatário nem encontra abreviação dentro de outra palavra", () => {
    expect(identifySupplier("DESTINATÁRIO / REMETENTE\nPROFARMA")).toBe("");
    expect(identifySupplier("ABCIMEDXYZ")).toBe("");
  });
  it("não escolhe arbitrariamente entre dois fornecedores", () => {
    expect(identifySupplier("PROFARMA / CIMED")).toBe("");
  });
  it("preserva campos encontrados quando outro falha", () => {
    expect(parseOcrText("PROFARMA\nNF-e Nº 416722")).toEqual({
      fornecedor: "PROFARMA",
      numeroNota: "416722",
      emissao: "",
    });
  });
});

describe("DANFE fotografado com colunas", () => {
  it("reconhece número junto da coluna NF-e", () => {
    expect(
      parseInvoiceNumber(
        "DANFE\nSAC: 0800 000 0000 N 765432 NF-e www.exemplo.test\nSÉRIE 4",
      ),
    ).toBe("765432");
  });
  it("reconhece logotipo sem espaço entre as palavras", () => {
    expect(identifySupplier("SantaCruz\nDistribuidora de Medicamentos")).toBe(
      "SANTA CRUZ",
    );
  });
  it("localiza emissão com outra coluna entre o rótulo e a data", () => {
    expect(
      parseIssueDate(
        "NOME / RAZÃO SOCIAL CNPJ/CPF DATA DE DASSÃO\nCLIENTE EXEMPLO 11.111.111/0001-11 15/08/2025\nDATA DE ENTRADA/SAÍDA\n16/08/2025",
      ),
    ).toBe("2025-08-15");
  });
  it("não usa saída, protocolo ou dígitos corrigidos como emissão", () => {
    expect(
      parseIssueDate("DATA DE EMISSÃO\nDATA DE ENTRADA/SAÍDA\n16/08/2025"),
    ).toBe("");
    expect(
      parseIssueDate("PROTOCOLO DE AUTORIZAÇÃO 123456789 15/08/2025"),
    ).toBe("");
    expect(parseIssueDate("DATA DE EMISSÃO\n15/08/2O25")).toBe("");
  });
});

it("usa a coluna de consulta e série quando o rótulo do número fica ilegível", () => {
  expect(
    parseInvoiceNumber(
      'DANFE\nSAC 0800 000 0000 " 765432 NF-e www.exemplo.test\nwww.emitente.test SÉRIE 4',
    ),
  ).toBe("765432");
  expect(parseInvoiceNumber("DANFE\nTOTAL 765432 NF-e www.exemplo.test")).toBe(
    "",
  );
});
