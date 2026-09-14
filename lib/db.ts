// Mensaje legible para el error más común al borrar: violación de FK
// (código 23503 de Postgres) porque otra tabla todavía referencia la fila.
export function mensajeErrorBorrado(error: { code?: string; message: string }, quePuedeQuedar: string): string {
  if (error.code === "23503") {
    return `No se puede borrar: todavía hay ${quePuedeQuedar} que lo referencian. Borralos primero.`;
  }
  return error.message;
}
