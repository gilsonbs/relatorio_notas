export const normalizeSupplier = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");
export const normalizeNumber = (value: string) =>
  value.trim().replace(/\s/g, "");
