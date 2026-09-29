import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { renderServiceWorker } from "../scripts/render-service-worker.mjs";
describe("Service worker", () => {
  it("gera código executável com as listas de arquivos resolvidas", () => {
    const template = readFileSync("scripts/sw-template.js", "utf8");
    const source = renderServiceWorker(
      template,
      "test-build",
      ["/", "/app.js"],
      ["/ocr/worker.min.js"],
    );
    const events: string[] = [];
    new Script(source).runInNewContext({
      self: {
        registration: { scope: "https://example.test/relatorio_notas/" },
        addEventListener: (event: string) => events.push(event),
      },
      Set,
    });
    expect(events).toEqual(["install", "activate", "message", "fetch"]);
  });
});
