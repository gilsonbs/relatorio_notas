export function renderServiceWorker(template, version, app, ocr) {
  return template
    .replace(
      "const VERSION = __VERSION__;",
      `const VERSION = ${JSON.stringify(version)};`,
    )
    .replace(
      "const APP_ASSETS = __APP_ASSETS__;",
      `const APP_ASSETS = ${JSON.stringify(app)};`,
    )
    .replace(
      "const OCR_ASSETS = __OCR_ASSETS__;",
      `const OCR_ASSETS = ${JSON.stringify(ocr)};`,
    );
}
