export type OcrOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};
export interface OcrProvider {
  extract(image: Blob, options?: OcrOptions): Promise<string>;
}
