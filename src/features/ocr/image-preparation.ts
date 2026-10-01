/** Amplia texto pequeno e normaliza o contraste sem binarizar os traços finos. */
export async function prepareImage(image: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(image);
  const canvas = document.createElement("canvas");
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width * bitmap.height > 60_000_000
    )
      throw new Error("Imagem grande demais.");
    const targetWidth = Math.min(2400, Math.max(1920, bitmap.width));
    const scale = Math.min(
      3,
      targetWidth / bitmap.width,
      4000 / Math.max(bitmap.width, bitmap.height),
      Math.sqrt(8_000_000 / (bitmap.width * bitmap.height)),
    );
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Não foi possível preparar a fotografia.");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const histogram = new Uint32Array(256);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const gray = Math.round(
        0.299 * pixels.data[index] +
          0.587 * pixels.data[index + 1] +
          0.114 * pixels.data[index + 2],
      );
      pixels.data[index] = gray;
      histogram[gray]++;
    }
    const count = canvas.width * canvas.height;
    let low = 0,
      high = 255,
      total = 0;
    for (let level = 0; level < 256; level++) {
      total += histogram[level];
      if (total >= count * 0.01) {
        low = level;
        break;
      }
    }
    total = 0;
    for (let level = 255; level >= 0; level--) {
      total += histogram[level];
      if (total >= count * 0.01) {
        high = level;
        break;
      }
    }
    const range = high - low;
    for (let index = 0; index < pixels.data.length; index += 4) {
      const value =
        range > 40
          ? ((pixels.data[index] - low) * 255) / range
          : pixels.data[index];
      pixels.data[index] = value;
      pixels.data[index + 1] = value;
      pixels.data[index + 2] = value;
    }
    context.putImageData(pixels, 0, 0);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Imagem inválida.")),
        "image/png",
      ),
    );
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
