/* global __VERSION__, __APP_ASSETS__, __OCR_ASSETS__ */
const VERSION = __VERSION__;
const APP_ASSETS = __APP_ASSETS__;
const OCR_ASSETS = __OCR_ASSETS__;
const CACHE_PREFIX = `filial15-${encodeURIComponent(self.registration.scope)}-`;
const APP_CACHE = `${CACHE_PREFIX}app-${VERSION}`;
const OCR_CACHE = `${CACHE_PREFIX}ocr-${VERSION}`;
const APP_SET = new Set(APP_ASSETS);
const OCR_SET = new Set(OCR_ASSETS);
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_ASSETS)),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (
          key.startsWith(CACHE_PREFIX) &&
          key !== APP_CACHE &&
          key !== OCR_CACHE
        )
          await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
let preparation;
async function prepareOcr() {
  const cache = await caches.open(OCR_CACHE);
  for (const url of OCR_ASSETS)
    if (!(await cache.match(url))) {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Recurso OCR indisponível");
      await cache.put(url, response);
    }
}
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_OCR") return;
  event.source?.postMessage({ type: "OCR_LOADING" });
  if (!preparation)
    preparation = prepareOcr().finally(() => {
      preparation = null;
    });
  event.waitUntil(
    preparation.then(
      () => event.source?.postMessage({ type: "OCR_READY" }),
      () => event.source?.postMessage({ type: "OCR_FAILED" }),
    ),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  const pathname = url.pathname;
  if (!APP_SET.has(pathname) && !OCR_SET.has(pathname)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(
        OCR_SET.has(pathname) ? OCR_CACHE : APP_CACHE,
      );
      const stored = await cache.match(pathname);
      if (stored) return stored;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(pathname, response.clone());
      return response;
    })(),
  );
});
