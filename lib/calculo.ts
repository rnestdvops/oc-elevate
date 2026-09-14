// Implementación de la sección 5 de docs/Elevate_Spec_Sistema_CI.md.
//
// Una célula no puede estar "inactiva un mes puntual" (decisión de Ernesto,
// ver sql/migrations/0001_celula_fecha_baja.sql): o compite, aunque tenga
// bajo desempeño o estacionalidad — eso debe verse en la liga, no
// esconderse — o fue dada de baja definitivamente y su gente se
// redistribuyó a otras células. Por eso `fecha_baja` es una fecha (no un
// booleano): la célula cuenta completa (costo de centro, divisor, ranking)
// en todos los meses hasta el de fecha_baja inclusive, y deja de contar
// desde el mes siguiente — sin alterar el historial de los meses en que sí
// operaba.

export interface Celula {
  id: string;
  nombre: string;
  tipo: "periferia" | "centro";
  fecha_baja: string | null;
}

// La célula operaba durante `mes` ("YYYY-MM") si todavía no fue dada de
// baja, o si la baja ocurrió ese mismo mes o después (comparación de
// strings "YYYY-MM" funciona lexicográficamente).
export function operabaEnMes(celula: Celula, mes: string): boolean {
  if (!celula.fecha_baja) return true;
  return celula.fecha_baja.slice(0, 7) >= mes;
}

interface Sueldo {
  integrante_id: string;
  mes: string;
  monto: number;
}

interface Asignacion {
  integrante_id: string;
  celula_id: string;
  mes: string;
  porcentaje: number;
}

interface ServicioTercero {
  celula_id: string;
  mes: string;
  monto: number;
}

interface Equipamiento {
  id: string;
  celula_id: string;
}

interface EquipamientoCosto {
  equipamiento_id: string;
  mes: string;
  costo_reposicion: number;
  vida_util_meses: number;
}

interface AsignacionFactura {
  celula_id: string;
  mes: string;
  monto: number;
}

export interface DatosCrudos {
  celulas: Celula[];
  sueldos: Sueldo[];
  asignaciones: Asignacion[];
  servicios: ServicioTercero[];
  equipamiento: Equipamiento[];
  equipamientoCostos: EquipamientoCosto[];
  asignacionesFactura: AsignacionFactura[];
}

export interface ResultadoMesCelula {
  celulaId: string;
  costoIntegrantes: number;
  costoServiciosTerceros: number;
  costoEquipamiento: number;
  costoDirecto: number;
  costoCentroAsignado: number; // 0 para células de centro
  costoTotal: number; // costoDirecto + costoCentroAsignado (solo periferia)
  ingreso: number | null; // null para células de centro (N/A, spec 5)
  ci: number | null; // null si no aplica (centro) o si ingreso === 0
}

function costoDirectoPorCelula(mes: string, datos: DatosCrudos): Map<string, {
  integrantes: number;
  servicios: number;
  equipamiento: number;
}> {
  const mapa = new Map<string, { integrantes: number; servicios: number; equipamiento: number }>();
  const get = (id: string) => {
    if (!mapa.has(id)) mapa.set(id, { integrantes: 0, servicios: 0, equipamiento: 0 });
    return mapa.get(id)!;
  };

  const sueldoPorIntegrante = new Map<string, number>();
  for (const s of datos.sueldos) {
    if (s.mes === mes) sueldoPorIntegrante.set(s.integrante_id, Number(s.monto));
  }
  for (const a of datos.asignaciones) {
    if (a.mes !== mes) continue;
    const sueldo = sueldoPorIntegrante.get(a.integrante_id) ?? 0;
    get(a.celula_id).integrantes += sueldo * (Number(a.porcentaje) / 100);
  }

  for (const s of datos.servicios) {
    if (s.mes === mes) get(s.celula_id).servicios += Number(s.monto);
  }

  const celulaPorEquipamiento = new Map<string, string>();
  for (const e of datos.equipamiento) celulaPorEquipamiento.set(e.id, e.celula_id);
  for (const ec of datos.equipamientoCostos) {
    if (ec.mes !== mes) continue;
    const celulaId = celulaPorEquipamiento.get(ec.equipamiento_id);
    if (!celulaId) continue;
    get(celulaId).equipamiento += Number(ec.costo_reposicion) / Number(ec.vida_util_meses);
  }

  return mapa;
}

export function calcularMes(mes: string, datos: DatosCrudos): ResultadoMesCelula[] {
  const directo = costoDirectoPorCelula(mes, datos);

  const centroCelulas = datos.celulas.filter((c) => c.tipo === "centro");
  const costoCentroTotal = centroCelulas.reduce((acc, c) => {
    const d = directo.get(c.id);
    return acc + (d ? d.integrantes + d.servicios + d.equipamiento : 0);
  }, 0);

  const periferiaOperando = datos.celulas.filter((c) => c.tipo === "periferia" && operabaEnMes(c, mes));
  const costoCentroAsignado = periferiaOperando.length > 0 ? costoCentroTotal / periferiaOperando.length : 0;

  const ingresoPorCelula = new Map<string, number>();
  for (const af of datos.asignacionesFactura) {
    if (af.mes !== mes) continue;
    ingresoPorCelula.set(af.celula_id, (ingresoPorCelula.get(af.celula_id) ?? 0) + Number(af.monto));
  }

  return datos.celulas.map((c) => {
    const d = directo.get(c.id) ?? { integrantes: 0, servicios: 0, equipamiento: 0 };
    const costoDirecto = d.integrantes + d.servicios + d.equipamiento;

    if (c.tipo === "centro") {
      return {
        celulaId: c.id,
        costoIntegrantes: d.integrantes,
        costoServiciosTerceros: d.servicios,
        costoEquipamiento: d.equipamiento,
        costoDirecto,
        costoCentroAsignado: 0,
        costoTotal: costoDirecto,
        ingreso: null,
        ci: null,
      };
    }

    // Si ya no operaba ese mes (dada de baja antes), no recibe porción de
    // centro — ni cuenta en el divisor (ya excluida arriba).
    const recibeCentro = operabaEnMes(c, mes) ? costoCentroAsignado : 0;
    const costoTotal = costoDirecto + recibeCentro;
    const ingreso = ingresoPorCelula.get(c.id) ?? 0;
    const ci = ingreso !== 0 ? costoTotal / ingreso : null;

    return {
      celulaId: c.id,
      costoIntegrantes: d.integrantes,
      costoServiciosTerceros: d.servicios,
      costoEquipamiento: d.equipamiento,
      costoDirecto,
      costoCentroAsignado: recibeCentro,
      costoTotal,
      ingreso,
      ci,
    };
  });
}

export interface ResultadoPeriodoCelula {
  celulaId: string;
  costoIntegrantes: number;
  costoServiciosTerceros: number;
  costoEquipamiento: number;
  costoDirecto: number;
  costoCentroAsignado: number;
  costoTotal: number;
  ingreso: number | null;
  ci: number | null;
}

// Suma los resultados mensuales reales del período (spec 5: "sumar Costo_
// total e Ingreso de los meses reales del período, y recién ahí dividir" —
// nunca promediar ratios ni multiplicar un mes por 3 o 12).
export function calcularPeriodo(meses: string[], datos: DatosCrudos): ResultadoPeriodoCelula[] {
  const porMes = meses.map((m) => calcularMes(m, datos));

  return datos.celulas.map((c) => {
    let costoIntegrantes = 0;
    let costoServiciosTerceros = 0;
    let costoEquipamiento = 0;
    let costoDirecto = 0;
    let costoCentroAsignado = 0;
    let costoTotal = 0;
    let ingreso = c.tipo === "centro" ? null : 0;

    for (const resultadosMes of porMes) {
      const r = resultadosMes.find((x) => x.celulaId === c.id);
      if (!r) continue;
      costoIntegrantes += r.costoIntegrantes;
      costoServiciosTerceros += r.costoServiciosTerceros;
      costoEquipamiento += r.costoEquipamiento;
      costoDirecto += r.costoDirecto;
      costoCentroAsignado += r.costoCentroAsignado;
      costoTotal += r.costoTotal;
      if (ingreso !== null) ingreso += r.ingreso ?? 0;
    }

    const ci = ingreso !== null && ingreso !== 0 ? costoTotal / ingreso : null;

    return {
      celulaId: c.id,
      costoIntegrantes,
      costoServiciosTerceros,
      costoEquipamiento,
      costoDirecto,
      costoCentroAsignado,
      costoTotal,
      ingreso,
      ci,
    };
  });
}

// Promedio simple del C/I de las células de periferia con C/I definido en
// el período (spec 5: "desvío vs. promedio de C/I de todas las células de
// periferia en ese mismo período" — promedio de los ratios, no de los
// montos agregados).
export function promedioCI(resultados: ResultadoPeriodoCelula[], celulas: Celula[]): number | null {
  const valores = resultados
    .filter((r) => celulas.find((c) => c.id === r.celulaId)?.tipo === "periferia")
    .map((r) => r.ci)
    .filter((ci): ci is number => ci !== null);
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

// Ranking de periferia por C/I ascendente (menor = mejor, spec 5). Las
// células sin C/I definido (sin ingreso ese período) quedan fuera.
export function rankingCI(resultados: ResultadoPeriodoCelula[], celulas: Celula[]): Map<string, number> {
  const ranking = resultados
    .filter((r) => celulas.find((c) => c.id === r.celulaId)?.tipo === "periferia" && r.ci !== null)
    .sort((a, b) => (a.ci as number) - (b.ci as number));
  const posiciones = new Map<string, number>();
  ranking.forEach((r, i) => posiciones.set(r.celulaId, i + 1));
  return posiciones;
}
