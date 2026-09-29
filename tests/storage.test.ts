import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NotesRepository } from "@/storage/notes-repository";
import type { Note } from "@/types/note";
let repository: NotesRepository;
let name: string;
const note: Note = {
  id: "1",
  fornecedor: "PROFARMA",
  numeroNota: "00123",
  emissao: "2026-09-21",
  recebimento: "2026-09-22",
  criadoEm: "2026-09-22T10:00:00Z",
};
beforeEach(() => {
  name = crypto.randomUUID();
  repository = new NotesRepository(name);
});
afterEach(async () => {
  await repository.close();
});
describe("Armazenamento local", () => {
  it("inicia vazio", async () => {
    expect((await repository.snapshot()).notes).toEqual([]);
  });
  it("preserva notas após fechar a conexão e reabrir", async () => {
    await repository.save(note);
    await repository.close();
    repository = new NotesRepository(name);
    expect((await repository.snapshot()).notes).toEqual([note]);
  });
  it("acumula dias diferentes sem alterar recebimento", async () => {
    await repository.save(note);
    await repository.save({ ...note, id: "2", recebimento: "2026-09-23" });
    expect(
      (await repository.snapshot()).notes.map((item) => item.recebimento),
    ).toEqual(["2026-09-22", "2026-09-23"]);
  });
  it("edita e exclui individualmente", async () => {
    await repository.save(note);
    await repository.save({ ...note, numeroNota: "456" });
    expect((await repository.snapshot()).notes).toHaveLength(1);
    expect((await repository.snapshot()).notes[0].numeroNota).toBe("456");
    await repository.remove("1");
    expect((await repository.snapshot()).notes).toEqual([]);
  });
  it("marcar e limpar PDF nunca altera notas", async () => {
    await repository.save(note);
    await repository.markPdf(1);
    await repository.markPdf(null);
    expect((await repository.snapshot()).notes).toEqual([note]);
  });
  it("alterar registros invalida a revisão do PDF anterior", async () => {
    await repository.save(note);
    await repository.markPdf(1);
    await repository.save({ ...note, numeroNota: "2" });
    expect((await repository.snapshot()).metadata).toEqual({
      revision: 2,
      pdfRevision: 1,
    });
  });
  it("zerar remove notas e referência do PDF em uma transação", async () => {
    await repository.save(note);
    await repository.markPdf(1);
    await repository.reset();
    expect(await repository.snapshot()).toEqual({
      notes: [],
      metadata: { revision: 2, pdfRevision: null },
    });
  });
});
