// Helpers de año-mes ("YYYY-MM") — el schema guarda `mes` como date (día 1).

export function mesActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

export function mesADate(mes: string): string {
  return `${mes}-01`;
}

export function dateAMes(date: string): string {
  return date.slice(0, 7);
}

export function mesAnterior(mes: string): string {
  const [anio, mm] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mm - 1 - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function mesSiguiente(mes: string): string {
  const [anio, mm] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mm - 1 + 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatoMes(mes: string): string {
  const [anio, mm] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mm - 1, 1));
  return d.toLocaleDateString("es-UY", { month: "long", year: "numeric", timeZone: "UTC" });
}
