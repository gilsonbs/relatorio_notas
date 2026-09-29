import { appPath } from "@/config/paths";
import type { Worker } from "tesseract.js";
import type { OcrOptions, OcrProvider } from "./ocr-provider";
import { prepareImage } from "./image-preparation";
export class TesseractProvider implements OcrProvider {
  async extract(image: Blob, options: OcrOptions = {}): Promise<string> {
    let worker: Worker | undefined;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancel: () => void = () => {};
    const stop = new Promise<never>((_, reject) => {
      cancel = () => {
        stopped = true;
        reject(new DOMException("Leitura cancelada.", "AbortError"));
      };
      timer = setTimeout(() => {
        stopped = true;
        reject(new Error("Tempo de leitura excedido."));
      }, 120_000);
      options.signal?.addEventListener("abort", cancel, { once: true });
      if (options.signal?.aborted) cancel();
    });
    const work = async () => {
      if (stopped) throw new Error("Cancelado");
      const prepared = await prepareImage(image);
      if (stopped) throw new Error("Cancelado");
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("por", 1, {
        workerPath: appPath("/ocr/worker.min.js"),
        corePath: appPath("/ocr/core"),
        langPath: appPath("/ocr"),
        workerBlobURL: false,
        cacheMethod: "none",
        gzip: true,
        logger: (entry) => {
          if (!stopped && entry.status === "recognizing text")
            options.onProgress?.(Math.round(entry.progress * 100));
        },
      });
      if (stopped) {
        await worker.terminate();
        throw new Error("Cancelado");
      }
      const result = await worker.recognize(prepared);
      return result.data.text;
    };
    try {
      return await Promise.race([work(), stop]);
    } finally {
      stopped = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", cancel);
      if (worker) await worker.terminate();
    }
  }
}
