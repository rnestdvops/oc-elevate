// Rentabilidad y reparto de utilidad — dictado por Ernesto en conversación,
// no forma parte de docs/Elevate_Spec_Sistema_CI.md. Reutiliza los
// resultados ya calculados por lib/calculo.ts (ingreso, costo total) para
// no duplicar esa lógica.

import type { Celula, ResultadoPeriodoCelula } from "./calculo";

export interface ConfigMetas {
  piso_margen_pct: number;
  reparto_pct: number;
  regla: "individual" | "piso_global" | "voluntario";
}

export interface ResultadoMeta {
  ingreso: number;
  costoTotal: number;
  utilidad: number;
  margenPct: number | null; // utilidad / ingreso — null si no hay ingreso
  pisoMonto: number; // piso_margen_pct% del ingreso
  excedente: number; // max(0, utilidad - pisoMonto)
  reparte: boolean; // según la regla vigente
  repartoMonto: number; // excedente × reparto_pct% si reparte, si no 0
}

export interface ResultadoMetaCelula extends ResultadoMeta {
  celulaId: string;
}

function calcularResultadoMeta(ingreso: number, costoTotal: number, config: ConfigMetas): Omit<ResultadoMeta, "reparte" | "repartoMonto"> {
  const utilidad = ingreso - costoTotal;
  const margenPct = ingreso !== 0 ? utilidad / ingreso : null;
  const pisoMonto = (config.piso_margen_pct / 100) * ingreso;
  const excedente = Math.max(0, utilidad - pisoMonto);
  return { ingreso, costoTotal, utilidad, margenPct, pisoMonto, excedente };
}

export function calcularMetas(
  resultadosPeriodo: ResultadoPeriodoCelula[],
  celulas: Celula[],
  config: ConfigMetas,
  voluntarios: Map<string, boolean>
): { porCelula: ResultadoMetaCelula[]; global: ResultadoMeta; totalRepartido: number } {
  const periferiaIds = new Set(celulas.filter((c) => c.tipo === "periferia").map((c) => c.id));
  const resultadosPeriferia = resultadosPeriodo.filter((r) => periferiaIds.has(r.celulaId));

  const ingresoGlobal = resultadosPeriferia.reduce((acc, r) => acc + (r.ingreso ?? 0), 0);
  const costoTotalGlobal = resultadosPeriferia.reduce((acc, r) => acc + r.costoTotal, 0);
  const baseGlobal = calcularResultadoMeta(ingresoGlobal, costoTotalGlobal, config);
  const globalReparte = baseGlobal.excedente > 0;
  const global: ResultadoMeta = {
    ...baseGlobal,
    reparte: globalReparte,
    repartoMonto: globalReparte ? baseGlobal.excedente * (config.reparto_pct / 100) : 0,
  };

  const porCelula: ResultadoMetaCelula[] = resultadosPeriferia.map((r) => {
    const base = calcularResultadoMeta(r.ingreso ?? 0, r.costoTotal, config);

    let reparte: boolean;
    if (config.regla === "piso_global") {
      // El piso global es la condición previa — si no se cumple, no reparte
      // nadie aunque una célula haya superado el suyo. Si se cumple, aplica
      // igual que "individual" (cada una reparte lo propio).
      reparte = globalReparte && base.excedente > 0;
    } else if (config.regla === "voluntario") {
      reparte = base.excedente > 0 && (voluntarios.get(r.celulaId) ?? false);
    } else {
      reparte = base.excedente > 0;
    }

    const repartoMonto = reparte ? base.excedente * (config.reparto_pct / 100) : 0;

    return { celulaId: r.celulaId, ...base, reparte, repartoMonto };
  });

  const totalRepartido = porCelula.reduce((acc, c) => acc + c.repartoMonto, 0);

  return { porCelula, global, totalRepartido };
}
