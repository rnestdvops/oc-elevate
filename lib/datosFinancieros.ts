import type { SupabaseClient } from "@supabase/supabase-js";
import type { DatosCrudos } from "./calculo";
import { mesADate, dateAMes } from "./mes";

// calculo.ts trabaja con meses en formato "YYYY-MM" (mismo formato que usan
// las pantallas). La base guarda `mes` como date "YYYY-MM-01" — se
// normaliza acá, en el borde de datos, para que calculo.ts no tenga que
// conocer el formato de columna real.
function normalizarMes<T extends { mes: string }>(filas: T[]): T[] {
  return filas.map((f) => ({ ...f, mes: dateAMes(f.mes) }));
}

// Trae en paralelo todas las filas necesarias para calcular costos/ingresos
// de un conjunto de meses (mes suelto, trimestre o año móvil) — un solo
// round-trip por tabla en vez de uno por mes.
export async function obtenerDatosCrudos(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  meses: string[]
): Promise<DatosCrudos> {
  const fechas = meses.map(mesADate);

  const [
    { data: celulas },
    { data: sueldos },
    { data: asignaciones },
    { data: servicios },
    { data: equipamiento },
    { data: equipamientoCostos },
    { data: asignacionesFactura },
  ] = await Promise.all([
    supabase.from("celula").select("id, nombre, tipo, fecha_baja"),
    supabase.from("sueldo_mensual").select("integrante_id, mes, monto").in("mes", fechas),
    supabase.from("asignacion_mensual").select("integrante_id, celula_id, mes, porcentaje").in("mes", fechas),
    supabase.from("servicio_tercero").select("celula_id, mes, monto").in("mes", fechas),
    supabase.from("equipamiento").select("id, celula_id"),
    supabase.from("equipamiento_costo_mensual").select("equipamiento_id, mes, costo_reposicion, vida_util_meses").in("mes", fechas),
    supabase.from("asignacion_de_factura").select("celula_id, mes, monto").in("mes", fechas),
  ]);

  return {
    celulas: celulas ?? [],
    sueldos: normalizarMes(sueldos ?? []),
    asignaciones: normalizarMes(asignaciones ?? []),
    servicios: normalizarMes(servicios ?? []),
    equipamiento: equipamiento ?? [],
    equipamientoCostos: normalizarMes(equipamientoCostos ?? []),
    asignacionesFactura: normalizarMes(asignacionesFactura ?? []),
  };
}
