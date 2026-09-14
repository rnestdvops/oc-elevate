import Link from "next/link";
import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { obtenerDatosCrudos } from "@/lib/datosFinancieros";
import { calcularPeriodo, promedioCI, rankingCI, operabaEnMes, type Celula } from "@/lib/calculo";
import { mesActual, ultimosMeses, desplazarMes, formatoMes } from "@/lib/mes";

const PERIODOS = { mes: 1, trimestre: 3, anio: 12 } as const;
type Periodo = keyof typeof PERIODOS;

function esPeriodo(v: string | undefined): v is Periodo {
  return v === "mes" || v === "trimestre" || v === "anio";
}

function formatoMoneda(n: number): string {
  return n.toLocaleString("es-UY", { maximumFractionDigits: 0 });
}

function formatoCI(ci: number | null): string {
  return ci === null ? "—" : `${(ci * 100).toFixed(1)}%`;
}

export default async function LigaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const periodo: Periodo = esPeriodo(sp.periodo) ? sp.periodo : "mes";
  const mes = sp.mes ?? mesActual();
  const n = PERIODOS[periodo];

  const supabase = await createServerSupabase();
  const mesesActual = ultimosMeses(mes, n);
  const mesesAnterior = ultimosMeses(desplazarMes(mes, -n), n);

  const [datosActual, datosAnterior] = await Promise.all([
    obtenerDatosCrudos(supabase, mesesActual),
    obtenerDatosCrudos(supabase, mesesAnterior),
  ]);

  const celulas: Celula[] = datosActual.celulas;
  const resultadosActual = calcularPeriodo(mesesActual, datosActual);
  const resultadosAnterior = calcularPeriodo(mesesAnterior, datosAnterior);
  const promedio = promedioCI(resultadosActual, celulas);
  const ranking = rankingCI(resultadosActual, celulas);

  const periferia = celulas
    .filter((c) => c.tipo === "periferia")
    .map((c) => {
      const actual = resultadosActual.find((r) => r.celulaId === c.id)!;
      const anterior = resultadosAnterior.find((r) => r.celulaId === c.id);
      const variacion = actual.ci !== null && anterior?.ci != null ? actual.ci - anterior.ci : null;
      const desvio = actual.ci !== null && promedio !== null ? actual.ci - promedio : null;
      return { celula: c, actual, variacion, desvio, posicion: ranking.get(c.id) ?? null };
    })
    .sort((a, b) => (a.posicion ?? Infinity) - (b.posicion ?? Infinity));

  const tabHref = (p: Periodo) => `/liga?periodo=${p}&mes=${mes}`;

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Liga C/I</h1>

      <nav>
        {(Object.keys(PERIODOS) as Periodo[]).map((p) => (
          <Link
            key={p}
            href={tabHref(p)}
            style={{ marginRight: "1rem", fontWeight: p === periodo ? 700 : 400 }}
          >
            {p === "mes" ? "Mes" : p === "trimestre" ? "Trimestre" : "Año móvil"}
          </Link>
        ))}
      </nav>

      <p>
        <Link href={`/liga?periodo=${periodo}&mes=${desplazarMes(mes, -1)}`}>← mes anterior</Link>
        {" · "}
        {formatoMes(mes)}
        {" · "}
        <Link href={`/liga?periodo=${periodo}&mes=${desplazarMes(mes, 1)}`}>mes siguiente →</Link>
      </p>

      <p>
        Período: {formatoMes(mesesActual[0])} a {formatoMes(mesesActual[mesesActual.length - 1])}
        {promedio !== null && <> · Promedio del grupo: {formatoCI(promedio)}</>}
      </p>

      <p style={{ color: "var(--color-text-muted)" }}>
        La liga es para conversar entre células, no para evaluar mérito — mostrá posición y
        tendencia, no un juicio de desempeño.
      </p>

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>#</th>
            <th>Célula</th>
            <th>Ingreso</th>
            <th>Integrantes</th>
            <th>Servicios de terceros</th>
            <th>Equipamiento</th>
            <th>Centro asignado</th>
            <th>Costo total</th>
            <th>C/I</th>
            <th>Variación</th>
            <th>Desvío vs. promedio</th>
          </tr>
        </thead>
        <tbody>
          {periferia.map(({ celula, actual, variacion, desvio, posicion }) => {
            const operaba = operabaEnMes(celula, mesesActual[mesesActual.length - 1]);
            return (
            <tr key={celula.id} style={{ opacity: operaba ? 1 : 0.5 }}>
              <td>{posicion ?? "—"}</td>
              <td>{celula.nombre}{!operaba && ` (de baja desde ${formatoMes(desplazarMes(celula.fecha_baja!.slice(0, 7), 1))})`}</td>
              <td>{actual.ingreso !== null ? formatoMoneda(actual.ingreso) : "—"}</td>
              <td>{formatoMoneda(actual.costoIntegrantes)}</td>
              <td>{formatoMoneda(actual.costoServiciosTerceros)}</td>
              <td>{formatoMoneda(actual.costoEquipamiento)}</td>
              <td>{formatoMoneda(actual.costoCentroAsignado)}</td>
              <td>{formatoMoneda(actual.costoTotal)}</td>
              <td style={posicion === 1 ? { color: "var(--color-success)", fontWeight: 700 } : undefined}>
                {formatoCI(actual.ci)}
              </td>
              <td className={variacion !== null && variacion > 0 ? "aviso" : undefined}>
                {variacion === null ? "—" : `${variacion > 0 ? "+" : ""}${(variacion * 100).toFixed(1)} p.p.`}
              </td>
              <td>{desvio === null ? "—" : `${desvio > 0 ? "+" : ""}${(desvio * 100).toFixed(1)} p.p.`}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </main>
    </>
  );
}
