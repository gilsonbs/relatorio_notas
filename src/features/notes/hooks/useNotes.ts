import { useCallback, useEffect, useState } from "react";
import { notesRepository } from "@/storage/notes-repository";
import type { ReportSnapshot } from "@/types/note";
export function useNotes() {
  const [snapshot, setSnapshot] = useState<ReportSnapshot>({
    notes: [],
    metadata: { revision: 0, pdfRevision: null },
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setSnapshot(await notesRepository.snapshot());
      setError("");
    } catch {
      setError(
        "Não foi possível acessar as notas neste navegador. Tente novamente. Seus dados não foram apagados.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    void notesRepository.snapshot().then(
      (value) => {
        if (active) {
          setSnapshot(value);
          setLoading(false);
        }
      },
      () => {
        if (active) {
          setError(
            "Não foi possível acessar as notas neste navegador. Tente novamente.",
          );
          setLoading(false);
        }
      },
    );
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("filial15-updates")
        : null;
    if (channel) channel.onmessage = onFocus;
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      channel?.close();
    };
  }, [refresh]);
  const mutate = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      void navigator.storage?.persist?.().catch(() => false);
      setSnapshot(await notesRepository.snapshot());
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("filial15-updates");
        channel.postMessage("changed");
        channel.close();
      }
      return true;
    } catch {
      setError(
        "Não foi possível concluir a operação. Confira o espaço disponível e tente novamente.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { ...snapshot, loading, busy, error, refresh, mutate };
}
