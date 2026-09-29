import { useEffect, useRef } from "react";
import { Button } from "./Button";
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="confirmation-title">{title}</h2>
      <p id="confirmation-description">{description}</p>
      <div className="dialog-actions">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={busy}
          autoFocus
        >
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={busy}>
          {busy ? "Aguarde…" : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
