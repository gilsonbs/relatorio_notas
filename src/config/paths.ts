/** Configurado no build; vazio na prévia local, /relatorio_notas no Pages. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const appPath = (path: string) => `${BASE_PATH}${path}`;
