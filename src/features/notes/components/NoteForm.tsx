import { useState } from "react";
import type { NoteDraft } from "@/types/note";
import { validateNote } from "../validation";
import { Button } from "@/components/Button";
import styles from "./NotesApp.module.css";
export function NoteForm({
  initial,
  busy,
  onSave,
  highlightMissing = false,
}: {
  initial: NoteDraft;
  busy: boolean;
  onSave: (draft: NoteDraft) => void;
  highlightMissing?: boolean;
}) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<
    Partial<Record<keyof NoteDraft, string>>
  >({});
  const fields = [
    {
      key: "fornecedor",
      label: "Fornecedor",
      placeholder: "Nome do fornecedor",
      type: "text",
    },
    {
      key: "numeroNota",
      label: "Nº da nota",
      placeholder: "Ex.: 373419",
      type: "text",
    },
    { key: "emissao", label: "Emissão", type: "date" },
    { key: "recebimento", label: "Recebimento", type: "date" },
  ] as const;
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors = validateNote(draft);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) onSave(draft);
        else document.getElementById(Object.keys(nextErrors)[0])?.focus();
      }}
    >
      {fields.map((field) => (
        <label key={field.key} htmlFor={field.key}>
          {field.label}
          <input
            id={field.key}
            name={field.key}
            type={field.type}
            value={draft[field.key]}
            required
            disabled={busy}
            placeholder={"placeholder" in field ? field.placeholder : undefined}
            inputMode={field.key === "numeroNota" ? "numeric" : undefined}
            className={
              highlightMissing && !draft[field.key] ? styles.missing : undefined
            }
            aria-invalid={!!errors[field.key]}
            aria-describedby={
              errors[field.key] ? `${field.key}-error` : undefined
            }
            onChange={(event) =>
              setDraft({ ...draft, [field.key]: event.target.value })
            }
          />
          {errors[field.key] && (
            <span className={styles.fieldError} id={`${field.key}-error`}>
              {errors[field.key]}
            </span>
          )}
        </label>
      ))}
      <Button type="submit" disabled={busy}>
        {busy ? "Salvando…" : "Salvar nota"}
      </Button>
    </form>
  );
}
