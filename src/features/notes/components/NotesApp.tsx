"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { localDateInputValue, formatDate } from "@/utils/dates";
import { useNotes } from "../hooks/useNotes";
import { createNote } from "../note-service";
import { findDuplicate } from "../duplicates";
import { notesRepository } from "@/storage/notes-repository";
import type { Note, NoteDraft } from "@/types/note";
import { parseOcrText } from "@/features/ocr/parser";
import { CaptureNote } from "@/features/ocr/CaptureNote";
import { NoteForm } from "./NoteForm";
import { usePdf } from "@/features/pdf/usePdf";
import { PdfActions } from "@/features/pdf/PdfActions";
import styles from "./NotesApp.module.css";
type Screen = "processing" | "home" | "notes" | "capture" | "review" | "saved";
type Confirmation =
  | { type: "delete"; note: Note }
  | { type: "reset" }
  | { type: "duplicate"; draft: NoteDraft };
export function NotesApp() {
  const report = useNotes();
  const pdf = usePdf(report);
  const [screen, setScreen] = useState<Screen>("home");
  const [draft, setDraft] = useState<NoteDraft>({
    fornecedor: "",
    numeroNota: "",
    emissao: "",
    recebimento: "",
  });
  const [editing, setEditing] = useState<Note>();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [ocrAttempted, setOcrAttempted] = useState(false);
  const [progress, setProgress] = useState(0);
  const ocrController = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      ocrController.current?.abort();
    },
    [],
  );
  function home() {
    ocrController.current?.abort();
    setMessage("");
    setScreen("home");
  }
  async function readImage(image: File) {
    const controller = new AbortController();
    ocrController.current = controller;
    setOcrAttempted(true);
    setProgress(0);
    setMessage("");
    setScreen("processing");
    setEditing(undefined);
    const received = localDateInputValue();
    try {
      const { TesseractProvider } =
        await import("@/features/ocr/tesseract-provider");
      const text = await new TesseractProvider().extract(image, {
        signal: controller.signal,
        onProgress: setProgress,
      });
      if (controller.signal.aborted) return;
      const fields = parseOcrText(text);
      setDraft({ ...fields, recebimento: received });
      setMessage(
        Object.values(fields).every((value) => !value)
          ? "Não conseguimos identificar os dados automaticamente. Preencha os campos abaixo."
          : Object.values(fields).some((value) => !value)
            ? "Confira os dados encontrados e preencha os campos destacados."
            : "Dados identificados. Confira todos os campos antes de salvar.",
      );
      setScreen("review");
    } catch {
      if (controller.signal.aborted) return;
      setDraft({
        fornecedor: "",
        numeroNota: "",
        emissao: "",
        recebimento: received,
      });
      setMessage(
        "Não conseguimos identificar os dados automaticamente. Preencha os campos abaixo.",
      );
      setScreen("review");
    } finally {
      if (ocrController.current === controller) ocrController.current = null;
    }
  }
  const count = report.notes.length;
  function openManual() {
    ocrController.current?.abort();
    setOcrAttempted(false);
    setEditing(undefined);
    setDraft({
      fornecedor: "",
      numeroNota: "",
      emissao: "",
      recebimento: localDateInputValue(),
    });
    setMessage("");
    setScreen("review");
  }
  function edit(note: Note) {
    setOcrAttempted(false);
    setEditing(note);
    setDraft(note);
    setMessage("");
    setScreen("review");
  }
  async function save(value: NoteDraft, allowDuplicate = false) {
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    try {
      const snapshot = await notesRepository.snapshot();
      if (
        !allowDuplicate &&
        findDuplicate(snapshot.notes, value, editing?.id)
      ) {
        setConfirmation({ type: "duplicate", draft: value });
        return;
      }
      if (
        await report.mutate(() =>
          notesRepository.save(createNote(value, editing)),
        )
      ) {
        setConfirmation(undefined);
        setMessage("");
        setScreen("saved");
      }
    } catch {
      setMessage(
        "Não foi possível salvar. Confira os dados e tente novamente.",
      );
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }
  async function confirm() {
    if (!confirmation) return;
    if (confirmation.type === "duplicate") {
      await save(confirmation.draft, true);
      return;
    }
    const success = await report.mutate(() =>
      confirmation.type === "reset"
        ? notesRepository.reset()
        : notesRepository.remove(confirmation.note.id),
    );
    if (success) {
      if (confirmation.type === "reset") {
        pdf.clearLocal();
        setScreen("home");
      }
      setConfirmation(undefined);
    }
  }
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <a
          className={styles.brand}
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();
            home();
          }}
          aria-label="Relatório de Notas — início"
        >
          <span className={styles.brandIcon}>
            <Icon name="document" size={23} />
          </span>
          <span>
            Relatório de Notas<small>CONTROLE DE RECEBIMENTO</small>
          </span>
        </a>
        <span className={styles.branch}>
          FILIAL <strong>15</strong>
        </span>
      </header>
      <main id="inicio" className={styles.main}>
        {report.error && (
          <div role="alert" className={styles.notice}>
            {report.error}
            <Button variant="text" onClick={() => void report.refresh()}>
              Tentar novamente
            </Button>
          </div>
        )}
        {message && (
          <p role="alert" className={styles.notice}>
            {message}
          </p>
        )}
        {report.loading ? (
          <p role="status">Carregando suas notas…</p>
        ) : (
          <>
            {screen !== "home" && (
              <Button
                variant="text"
                className={styles.back}
                onClick={home}
                disabled={report.busy}
              >
                <Icon name="back" size={18} />
                Início
              </Button>
            )}
            {screen === "home" && (
              <>
                <div className={styles.intro}>
                  <span className={styles.eyebrow}>
                    DO RECEBIMENTO AO RELATÓRIO
                  </span>
                  <h1>
                    Suas notas,
                    <br />
                    em ordem.
                  </h1>
                  <p>
                    Fotografe, confira e reúna as notas
                    <br /> recebidas em um só relatório.
                  </p>
                </div>
                <section
                  className={styles.captureCard}
                  aria-label="Adicionar nota"
                >
                  <span className={styles.cameraIcon}>
                    <Icon name="camera" size={32} />
                  </span>
                  <h2>Recebeu uma nota?</h2>
                  <p>
                    Comece pela foto. Você confere
                    <br />
                    os dados antes de salvar.
                  </p>
                  <Button
                    className={styles.full}
                    onClick={() => setScreen("capture")}
                  >
                    <Icon name="camera" />
                    {count ? "Fotografar nota" : "Fotografar primeira nota"}
                  </Button>
                  <Button
                    variant="text"
                    className={styles.manual}
                    onClick={openManual}
                  >
                    <Icon name="plus" size={18} />
                    Preencher manualmente
                  </Button>
                </section>
                <section
                  className={styles.reportCard}
                  aria-labelledby="report-title"
                >
                  <div className={styles.reportTop}>
                    <div>
                      <span className={styles.eyebrow}>RELATÓRIO ATUAL</span>
                      <h2 id="report-title">
                        {count
                          ? `${count} ${count === 1 ? "nota recebida" : "notas recebidas"}`
                          : "Nenhuma nota por aqui"}
                      </h2>
                    </div>
                    <span className={styles.count}>{count}</span>
                  </div>
                  <p>
                    {count
                      ? "Todas as notas, reunidas até você zerar o relatório."
                      : "Seu relatório está vazio."}
                  </p>
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      onClick={() => setScreen("notes")}
                    >
                      <Icon name="list" size={20} />
                      Ver notas
                      <Icon name="arrow" size={16} />
                    </Button>
                    <Button
                      disabled={!count || pdf.busy || report.busy}
                      onClick={() => void pdf.generate()}
                      aria-describedby="pdf-help"
                    >
                      <Icon name="document" size={20} />
                      {pdf.busy ? "Gerando…" : "Gerar PDF"}
                    </Button>
                  </div>
                  <small id="pdf-help">
                    {count
                      ? "O PDF reúne todas as notas deste relatório."
                      : "Adicione notas para gerar o relatório."}
                  </small>
                </section>
                <p className={styles.privacy}>
                  <Icon name="check" size={16} />
                  Suas notas ficam neste aparelho.
                </p>
              </>
            )}
            {screen === "notes" && (
              <section className={styles.panel}>
                <span className={styles.eyebrow}>RELATÓRIO ATUAL</span>
                <h1>Notas recebidas</h1>
                <p>
                  {count} {count === 1 ? "nota" : "notas"} no relatório
                </p>
                {!count ? (
                  <div className={styles.empty}>
                    <Icon name="document" size={40} />
                    <h2>Seu relatório está vazio.</h2>
                    <p>As notas que você cadastrar aparecerão aqui.</p>
                    <Button onClick={() => setScreen("capture")}>
                      <Icon name="camera" />
                      Fotografar primeira nota
                    </Button>
                    <Button variant="text" onClick={openManual}>
                      Preencher manualmente
                    </Button>
                  </div>
                ) : (
                  <>
                    <ul className={styles.noteList}>
                      {report.notes.map((note) => (
                        <li className={styles.noteCard} key={note.id}>
                          <h2>{note.fornecedor}</h2>
                          <p>
                            Nota <strong>{note.numeroNota}</strong>
                          </p>
                          <dl>
                            <div>
                              <dt>Emissão</dt>
                              <dd>{formatDate(note.emissao)}</dd>
                            </div>
                            <div>
                              <dt>Recebimento</dt>
                              <dd>{formatDate(note.recebimento)}</dd>
                            </div>
                          </dl>
                          <div className={styles.actions}>
                            <Button
                              variant="secondary"
                              onClick={() => edit(note)}
                              disabled={report.busy}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="text"
                              onClick={() =>
                                setConfirmation({ type: "delete", note })
                              }
                              disabled={report.busy}
                            >
                              Excluir
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Button className={styles.full} onClick={openManual}>
                      Adicionar nota manualmente
                    </Button>
                    <Button
                      variant="text"
                      className={styles.danger}
                      onClick={() => setConfirmation({ type: "reset" })}
                    >
                      Zerar relatório
                    </Button>
                  </>
                )}
              </section>
            )}
            {screen === "capture" && (
              <CaptureNote onManual={openManual} onImage={readImage} />
            )}
            {screen === "processing" && (
              <section className={styles.empty} aria-live="polite">
                <Icon name="document" size={44} />
                <h1>Lendo a nota…</h1>
                <p>
                  {progress
                    ? `Reconhecendo o texto: ${progress}%`
                    : "Preparando a leitura no aparelho…"}
                </p>
                <progress
                  max={100}
                  value={progress}
                  aria-label="Progresso da leitura"
                />
                <p>A primeira leitura pode levar um pouco mais de tempo.</p>
                <Button variant="secondary" onClick={openManual}>
                  Cancelar e preencher manualmente
                </Button>
              </section>
            )}
            {screen === "review" && (
              <section className={styles.panel}>
                <span className={styles.eyebrow}>
                  {editing ? "EDITAR NOTA" : "NOVA NOTA"}
                </span>
                <h1>Conferir dados</h1>
                <p>Confira os quatro campos antes de salvar.</p>
                <NoteForm
                  highlightMissing={ocrAttempted}
                  initial={draft}
                  busy={report.busy || saving}
                  onSave={(value) => void save(value)}
                />
              </section>
            )}
            {screen === "saved" && (
              <section className={styles.empty}>
                <Icon name="check" size={44} />
                <h1>Nota salva</h1>
                <p>Os dados foram armazenados neste aparelho.</p>
                <Button onClick={() => setScreen("capture")}>
                  <Icon name="camera" />
                  Fotografar próxima
                </Button>
                <Button variant="text" onClick={openManual}>
                  Preencher próxima manualmente
                </Button>
                <Button variant="secondary" onClick={() => setScreen("notes")}>
                  Ver notas
                </Button>
              </section>
            )}
            {(screen === "home" || screen === "notes") && (
              <PdfActions pdf={pdf} disabled={report.busy} />
            )}
          </>
        )}
      </main>
      <footer className={styles.footer}>
        <span>FILIAL 15</span>
        <span>Relatório de Notas</span>
      </footer>
      {confirmation && (
        <ConfirmDialog
          title={
            confirmation.type === "reset"
              ? "Zerar relatório?"
              : confirmation.type === "delete"
                ? "Excluir esta nota?"
                : "Esta nota parece já estar cadastrada."
          }
          description={
            confirmation.type === "reset"
              ? "Todas as notas armazenadas neste aparelho serão removidas. Essa ação não poderá ser desfeita."
              : confirmation.type === "delete"
                ? `${confirmation.note.fornecedor} · Nota ${confirmation.note.numeroNota}. Essa ação não poderá ser desfeita.`
                : "Já existe uma nota com o mesmo fornecedor e número."
          }
          confirmLabel={
            confirmation.type === "reset"
              ? "Zerar relatório"
              : confirmation.type === "delete"
                ? "Excluir nota"
                : "Salvar mesmo assim"
          }
          busy={report.busy || saving}
          onCancel={() => setConfirmation(undefined)}
          onConfirm={() => void confirm()}
        />
      )}
    </div>
  );
}
