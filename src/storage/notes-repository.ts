import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Note, ReportMetadata, ReportSnapshot } from "@/types/note";
interface NotesDatabase extends DBSchema {
  notes: { key: string; value: Note };
  metadata: { key: string; value: ReportMetadata };
}
const initialMetadata = (): ReportMetadata => ({
  revision: 0,
  pdfRevision: null,
});
export class NotesRepository {
  private connection?: Promise<IDBPDatabase<NotesDatabase>>;
  constructor(private readonly name = "filial15-notas-v1") {}
  private db() {
    if (!this.connection) {
      this.connection = openDB<NotesDatabase>(this.name, 1, {
        upgrade(db) {
          db.createObjectStore("notes", { keyPath: "id" });
          db.createObjectStore("metadata");
        },
        blocking: () => {
          void this.close();
        },
        terminated: () => {
          this.connection = undefined;
        },
      }).catch((error) => {
        this.connection = undefined;
        throw error;
      });
    }
    return this.connection;
  }
  async snapshot(): Promise<ReportSnapshot> {
    const db = await this.db();
    const tx = db.transaction(["notes", "metadata"], "readonly");
    const [notes, metadata] = await Promise.all([
      tx.objectStore("notes").getAll(),
      tx.objectStore("metadata").get("report"),
    ]);
    await tx.done;
    return {
      notes: notes.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)),
      metadata: metadata ?? initialMetadata(),
    };
  }
  async save(note: Note): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(["notes", "metadata"], "readwrite");
    const meta =
      (await tx.objectStore("metadata").get("report")) ?? initialMetadata();
    await tx.objectStore("notes").put(note);
    await tx
      .objectStore("metadata")
      .put({ ...meta, revision: meta.revision + 1 }, "report");
    await tx.done;
  }
  async remove(id: string): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(["notes", "metadata"], "readwrite");
    if (await tx.objectStore("notes").get(id)) {
      const meta =
        (await tx.objectStore("metadata").get("report")) ?? initialMetadata();
      await tx.objectStore("notes").delete(id);
      await tx
        .objectStore("metadata")
        .put({ ...meta, revision: meta.revision + 1 }, "report");
    }
    await tx.done;
  }
  async markPdf(revision: number | null): Promise<void> {
    const db = await this.db();
    const tx = db.transaction("metadata", "readwrite");
    const meta = (await tx.store.get("report")) ?? initialMetadata();
    await tx.store.put({ ...meta, pdfRevision: revision }, "report");
    await tx.done;
  }
  async reset(): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(["notes", "metadata"], "readwrite");
    const meta =
      (await tx.objectStore("metadata").get("report")) ?? initialMetadata();
    await tx.objectStore("notes").clear();
    await tx
      .objectStore("metadata")
      .put({ revision: meta.revision + 1, pdfRevision: null }, "report");
    await tx.done;
  }
  async close() {
    const connection = this.connection;
    this.connection = undefined;
    if (connection) (await connection).close();
  }
}
export const notesRepository = new NotesRepository();
