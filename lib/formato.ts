// Formato de moneda consistente en toda la app: separador de miles con
// punto, coma decimal, siempre 2 decimales (es-UY).
export function formatoMoneda(n: number): string {
  return Number(n).toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
