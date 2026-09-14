import type { Metadata } from "next";
import Header from "@/components/Header";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import { createServerSupabase } from "@/lib/supabase/server";
import { obtenerDatosCrudos } from "@/lib/datosFinancieros";
import { calcularPeriodo, type Celula } from "@/lib/calculo";
import { calcularMetas, type ConfigMetas } from "@/lib/metas";
import { mesActual, ultimosMeses, mesADate } from "@/lib/mes";
import { formatoMoneda } from "@/lib/formato";
import { guardarConfigMetas, guardarVoluntario } from "./actions";

export const metadata: Metadata = {
  title: "Elevate — Metas relativas",
};

const PERIODOS = { mes: 1, trimestre: 3, anio: 12 } as const;
type Periodo = keyof typeof PERIODOS;

function esPeriodo(v: string | undefined): v is Periodo {
  return v === "mes" || v === "trimestre" || v === "anio";
}

function formatoPct(n: number | null): string {
  return n === null ? "—" : `${(n * 100).toFixed(1)}%`;
}

const NOMBRES_REGLA = {
  individual: "Individual — cada célula reparte su propio excedente",
  piso_global: "Piso global obligatorio — si el global no llega, no reparte nadie",
  voluntario: "Voluntario — cada célula activa o no el reparto",
};

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const periodo: Periodo = esPeriodo(sp.periodo) ? sp.periodo : "mes";
  const mes = sp.mes ?? mesActual();
  const n = PERIODOS[periodo];

  const supabase = await createServerSupabase();
  const meses = ultimosMeses(mes, n);
  const fechas = meses.map(mesADate);

  const [datos, { data: configRaw }, { data: voluntariosRaw }] = await Promise.all([
    obtenerDatosCrudos(supabase, meses),
    supabase.from("config_metas").select("*").eq("id", "global").single(),
    supabase.from("reparto_voluntario").select("*").in("mes", fechas),
  ]);

  const celulas: Celula[] = datos.celulas;
  const resultadosPeriodo = calcularPeriodo(meses, datos);
  const config: ConfigMetas = {
    piso_margen_pct: Number(configRaw?.piso_margen_pct ?? 0),
    reparto_pct: Number(configRaw?.reparto_pct ?? 0),
    regla: (configRaw?.regla ?? "individual") as ConfigMetas["regla"],
  };

  // Voluntario: la célula "activa" el período completo solo si activó
  // TODOS los meses reales que lo componen (mes suelto = un solo mes).
  const voluntarios = new Map<string, boolean>();
  for (const c of celulas) {
    const activosDeEsteMes = (voluntariosRaw ?? []).filter((v) => v.celula_id === c.id && v.activo);
    voluntarios.set(c.id, activosDeEsteMes.length === meses.length);
  }

  const { porCelula, global, totalRepartido } = calcularMetas(resultadosPeriodo, celulas, config, voluntarios);
  const nombrePorCelula = new Map(celulas.map((c) => [c.id, c.nombre]));

  const guardarVoluntarioMes = periodo === "mes" ? guardarVoluntario.bind(null, mes) : null;

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Metas relativas — Rentabilidad y reparto</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Piso de rentabilidad esperada y reparto del excedente entre las células, para trabajar el
        mecanismo de metas relativas de BetaCodex (Relative Targets) más allá del C/I — dictado
        por Ernesto, no forma parte de la spec original.
      </p>

      <h2>Configuración</h2>
      <form action={guardarConfigMetas}>
        <div>
          <label>
            Piso de rentabilidad esperada (% de margen){" "}
            <input name="piso_margen_pct" type="number" step="0.01" defaultValue={config.piso_margen_pct} required />
          </label>
        </div>
        <div>
          <label>
            % de reparto sobre el excedente{" "}
            <input name="reparto_pct" type="number" step="0.01" defaultValue={config.reparto_pct} required />
          </label>
        </div>
        <div>
          <label>
            Regla vigente{" "}
            <select name="regla" defaultValue={config.regla} required>
              <option value="individual">Individual</option>
              <option value="piso_global">Piso global obligatorio</option>
              <option value="voluntario">Voluntario</option>
            </select>
          </label>
        </div>
        <button type="submit">Guardar</button>
      </form>
      <p style={{ color: "var(--color-text-muted)" }}>{NOMBRES_REGLA[config.regla]}</p>

      <SelectorPeriodo basePath="/metas" periodo={periodo} mes={mes} mesesActual={meses} />

      <h2>Global (suma de toda la periferia)</h2>
      <table border={1} cellPadding={6}>
        <tbody>
          <tr><td>Ingreso</td><td className="num">{formatoMoneda(global.ingreso)}</td></tr>
          <tr><td>Costo total</td><td className="num">{formatoMoneda(global.costoTotal)}</td></tr>
          <tr><td>Utilidad</td><td className="num">{formatoMoneda(global.utilidad)}</td></tr>
          <tr><td>Margen alcanzado</td><td className="num">{formatoPct(global.margenPct)}</td></tr>
          <tr><td>Piso esperado ({config.piso_margen_pct}%)</td><td className="num">{formatoMoneda(global.pisoMonto)}</td></tr>
          <tr><td>Excedente sobre el piso</td><td className="num">{formatoMoneda(global.excedente)}</td></tr>
          <tr style={{ fontWeight: 700 }}>
            <td>Acumulado para repartir (total organización)</td>
            <td className="num">{formatoMoneda(totalRepartido)} ({config.reparto_pct}% del excedente que califica)</td>
          </tr>
        </tbody>
      </table>

      <h2>Por célula</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Célula</th>
            <th className="num">Ingreso</th>
            <th className="num">Utilidad</th>
            <th className="num">Margen</th>
            <th className="num">Piso $</th>
            <th className="num">Excedente</th>
            <th>¿Reparte?</th>
            <th className="num">Reparto $</th>
            {config.regla === "voluntario" && periodo === "mes" && <th>Activar</th>}
          </tr>
        </thead>
        <tbody>
          {porCelula.map((r) => (
            <tr key={r.celulaId}>
              <td>{nombrePorCelula.get(r.celulaId)}</td>
              <td className="num">{formatoMoneda(r.ingreso)}</td>
              <td className="num">{formatoMoneda(r.utilidad)}</td>
              <td className="num">{formatoPct(r.margenPct)}</td>
              <td className="num">{formatoMoneda(r.pisoMonto)}</td>
              <td className="num">{formatoMoneda(r.excedente)}</td>
              <td className={r.reparte ? "" : "aviso"}>{r.reparte ? "Sí" : "No"}</td>
              <td className="num">{formatoMoneda(r.repartoMonto)}</td>
              {config.regla === "voluntario" && periodo === "mes" && guardarVoluntarioMes && (
                <td>
                  <form action={guardarVoluntarioMes.bind(null, r.celulaId)}>
                    <label>
                      <input type="checkbox" name="activo" defaultChecked={voluntarios.get(r.celulaId)} />
                    </label>
                    <button type="submit">Guardar</button>
                  </form>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
    </>
  );
}
