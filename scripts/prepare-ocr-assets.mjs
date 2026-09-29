import { mkdir, readdir, copyFile } from "node:fs/promises";
import path from "node:path";
await mkdir("public/ocr/core", { recursive: true });
await copyFile(
  "node_modules/tesseract.js/dist/worker.min.js",
  "public/ocr/worker.min.js",
);
await copyFile(
  "node_modules/@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz",
  "public/ocr/por.traineddata.gz",
);
for (const file of await readdir("node_modules/tesseract.js-core")) {
  if (file.endsWith(".wasm") || file.endsWith(".wasm.js"))
    await copyFile(
      path.join("node_modules/tesseract.js-core", file),
      path.join("public/ocr/core", file),
    );
}
console.log("Recursos OCR locais preparados.");
