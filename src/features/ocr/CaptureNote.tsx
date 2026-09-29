import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import styles from "@/features/notes/components/NotesApp.module.css";
export function CaptureNote({
  onImage,
  onManual,
}: {
  onImage: (image: File) => Promise<void>;
  onManual: () => void;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  async function selected(input: HTMLInputElement) {
    const image = input.files?.[0];
    input.value = "";
    if (!image) return;
    if (!image.type.startsWith("image/") || image.size > 30 * 1024 * 1024) {
      setError("Escolha uma fotografia de até 30 MB ou preencha manualmente.");
      return;
    }
    setError("");
    await onImage(image);
  }
  return (
    <section className={styles.panel}>
      <span className={styles.eyebrow}>NOVA NOTA</span>
      <h1>Fotografar nota</h1>
      <p>
        Posicione a nota inteira em um local bem iluminado. Evite sombras e
        reflexos.
      </p>
      <div className={styles.photoPlaceholder}>
        <Icon name="camera" size={48} />
        <span>Deixe o nome do fornecedor, o número e a emissão legíveis.</span>
      </div>
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        aria-label="Fotografia da câmera"
        onChange={(event) => void selected(event.currentTarget)}
      />
      <input
        ref={gallery}
        type="file"
        accept="image/*"
        hidden
        aria-label="Fotografia da galeria"
        onChange={(event) => void selected(event.currentTarget)}
      />
      <Button className={styles.full} onClick={() => camera.current?.click()}>
        <Icon name="camera" />
        Abrir câmera
      </Button>
      <Button
        className={styles.full}
        variant="secondary"
        onClick={() => gallery.current?.click()}
      >
        Selecionar da galeria
      </Button>
      <Button className={styles.full} variant="text" onClick={onManual}>
        Preencher manualmente
      </Button>
      {error && (
        <p role="alert" className={styles.notice}>
          {error}
        </p>
      )}
    </section>
  );
}
