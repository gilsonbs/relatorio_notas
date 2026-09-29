import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const root = path.resolve("out");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".gz": "application/gzip",
  ".txt": "text/plain",
};
const port = Number(process.env.PORT || 4173);
http
  .createServer(async (request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405);
        response.end();
        return;
      }
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      if (basePath && pathname === "/") {
        response.writeHead(302, { Location: basePath + "/" });
        response.end();
        return;
      }
      if (basePath && !pathname.startsWith(basePath + "/")) {
        response.writeHead(404);
        response.end("Não encontrado");
        return;
      }
      let file = path.resolve(root, "." + pathname.slice(basePath.length));
      if (file !== root && !file.startsWith(root + path.sep)) {
        response.writeHead(403);
        response.end();
        return;
      }
      if ((await stat(file)).isDirectory())
        file = path.join(file, "index.html");
      const data = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      response.end(request.method === "HEAD" ? undefined : data);
    } catch {
      response.writeHead(404);
      response.end("Não encontrado");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Prévia de produção: http://127.0.0.1:${port}${basePath}/`),
  );
