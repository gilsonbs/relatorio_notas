import { renderServiceWorker } from "./render-service-worker.mjs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : [path.join(dir, entry.name)],
    ),
  );
  return groups.flat();
}
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const files = (await walk("out")).filter(
  (file) => !file.endsWith(".map") && !file.endsWith("sw.js"),
);
const urls = files.map(
  (file) =>
    basePath + "/" + path.relative("out", file).split(path.sep).join("/"),
);
const hash = createHash("sha256");
for (const file of files) hash.update(await readFile(file));
const version = hash.digest("hex").slice(0, 16);
const app = [
  basePath + "/",
  ...urls.filter((url) => !url.startsWith(basePath + "/ocr/")),
];
const ocr = urls.filter((url) => url.startsWith(basePath + "/ocr/"));
const template = await readFile("scripts/sw-template.js", "utf8");
await writeFile("out/sw.js", renderServiceWorker(template, version, app, ocr));
console.log(
  `Service worker: ${app.length} arquivos da aplicação; ${ocr.length} recursos OCR.`,
);

await writeFile("out/.nojekyll", "");
