"use client";
import { useEffect, useState } from "react";
import { appPath } from "@/config/paths";
import { Button } from "./Button";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function PwaStatus() {
  const [status, setStatus] = useState("");
  const [installEvent, setInstallEvent] = useState<InstallEvent>();
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    let active = true;
    const onMessage = (event: MessageEvent) => {
      if (!active) return;
      if (event.data?.type === "OCR_READY")
        setStatus("Pronto para usar offline, inclusive a leitura de fotos.");
      if (event.data?.type === "OCR_LOADING")
        setStatus(
          "Cadastro e PDF prontos offline. Preparando a leitura de fotos…",
        );
      if (event.data?.type === "OCR_FAILED")
        setStatus(
          "Cadastro e PDF prontos offline. Conecte-se para preparar a leitura de fotos.",
        );
    };
    const prepare = () => {
      void navigator.serviceWorker.ready.then((registration) => {
        if (active) registration.active?.postMessage({ type: "CACHE_OCR" });
      });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    void navigator.serviceWorker
      .register(appPath("/sw.js"), { scope: appPath("/") })
      .then(() => {
        if (active) prepare();
      })
      .catch(() => {
        if (active)
          setStatus(
            "Não foi possível preparar o modo offline. Tente reabrir com internet.",
          );
      });
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const installed = () => setInstallEvent(undefined);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("online", prepare);
    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener("message", onMessage);
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("online", prepare);
    };
  }, []);
  return (
    <div className="pwa-status">
      {status && <p role="status">{status}</p>}
      {installEvent && (
        <Button
          variant="text"
          onClick={async () => {
            await installEvent.prompt();
            await installEvent.userChoice;
            setInstallEvent(undefined);
          }}
        >
          Instalar aplicativo
        </Button>
      )}
    </div>
  );
}
