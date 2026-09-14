import Link from "next/link";
import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { obtenerDatosCrudos } from "@/lib/datosFinancieros";
import { calcularPeriodo, type Celula } from "@/lib/calculo";
import { mesActual, ultimosMeses, desplazarMes, formatoMes } from "@/lib/mes";

const PERIODOS = { mes: 1, trimestre: 3, anio: 12 } as const;
type Periodo = keyof typeof PERIODOS;

function esPeriodo(v: string | undefined): v is Periodo {
  return v === "mes" || v === "trimestre" || v === "anio";
}

function formatoMoneda(n: number): string {
  return n.toLocaleString("es-UY", { maximumFractionDigits: 0 });
}

export default async function CentroPage({
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
  const datos = await obtenerDatosCrudos(supabase, meses);
  const celulas: Celula[] = datos.celulas;
  const resultados = calcularPeriodo(meses, datos);

  const centro = celulas.filter((c) => c.tipo === "centro");
  const periferiaActivas = celulas.filter((c) => c.tipo === "periferia" && c.activa);
  const costoCentroTotal = centro.reduce(
    (acc, c) => acc + (resultados.find((r) => r.celulaId === c.id)?.costoDirecto ?? 0),
    0
  );

  const tabHref = (p: Periodo) => `/centro?periodo=${p}&mes=${mes}`;

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Centro</h1>

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
        <Link href={`/centro?periodo=${periodo}&mes=${desplazarMes(mes, -1)}`}>← mes anterior</Link>
        {" · "}
        {formatoMes(mes)}
        {" · "}
        <Link href={`/centro?periodo=${periodo}&mes=${desplazarMes(mes, 1)}`}>mes siguiente →</Link>
      </p>

      <p>Período: {formatoMes(meses[0])} a {formatoMes(meses[meses.length - 1])}</p>

      <h2>Costo directo por célula de centro</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Célula</th><th>Costo directo</th></tr>
        </thead>
        <tbody>
          {centro.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}{!c.activa && " (inactiva)"}</td>
              <td>{formatoMoneda(resultados.find((r) => r.celulaId === c.id)?.costoDirecto ?? 0)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700 }}>
            <td>Total centro</td>
            <td>{formatoMoneda(costoCentroTotal)}</td>
          </tr>
        </tbody>
      </table>
      {centro.length > 1 && (
        <p style={{ color: "var(--color-text-muted)" }}>
          Al haber más de una célula de centro, sus costos se suman y se reparten juntos entre
          la periferia (supuesto de la spec, sección 7).
        </p>
      )}

      <h2>Reparto entre células de periferia activas ({periferiaActivas.length})</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Célula</th><th>Centro asignado</th></tr>
        </thead>
        <tbody>
          {celulas
            .filter((c) => c.tipo === "periferia")
            .map((c) => (
              <tr key={c.id} style={{ opacity: c.activa ? 1 : 0.5 }}>
                <td>{c.nombre}{!c.activa && " (inactiva — no participa del reparto)"}</td>
                <td>{formatoMoneda(resultados.find((r) => r.celulaId === c.id)?.costoCentroAsignado ?? 0)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </main>
    </>
  );
}
