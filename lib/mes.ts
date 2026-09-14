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

// Desplaza `mes` n meses (n negativo = hacia atrás).
export function desplazarMes(mes: string, n: number): string {
  const [anio, mm] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mm - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Los `n` meses reales terminando en `mes` (incluido), en orden cronológico.
// Se usa para trimestre (n=3) y año móvil (n=12) — spec 5: sumar meses
// reales, nunca multiplicar un mes.
export function ultimosMeses(mes: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => desplazarMes(mes, -(n - 1) + i));
}

export function formatoMes(mes: string): string {
  const [anio, mm] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mm - 1, 1));
  return d.toLocaleDateString("es-UY", { month: "long", year: "numeric", timeZone: "UTC" });
}
