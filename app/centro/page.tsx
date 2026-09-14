import Header from "@/components/Header";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import { createServerSupabase } from "@/lib/supabase/server";
import { obtenerDatosCrudos } from "@/lib/datosFinancieros";
import { calcularPeriodo, operabaEnMes, type Celula } from "@/lib/calculo";
import { mesActual, ultimosMeses } from "@/lib/mes";
import { formatoMoneda } from "@/lib/formato";

const PERIODOS = { mes: 1, trimestre: 3, anio: 12 } as const;
type Periodo = keyof typeof PERIODOS;

function esPeriodo(v: string | undefined): v is Periodo {
  return v === "mes" || v === "trimestre" || v === "anio";
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

  const ultimoMes = meses[meses.length - 1];
  const centro = celulas.filter((c) => c.tipo === "centro");
  const periferiaOperando = celulas.filter((c) => c.tipo === "periferia" && operabaEnMes(c, ultimoMes));
  const costoCentroTotal = centro.reduce(
    (acc, c) => acc + (resultados.find((r) => r.celulaId === c.id)?.costoDirecto ?? 0),
    0
  );

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Centro</h1>

      <SelectorPeriodo basePath="/centro" periodo={periodo} mes={mes} mesesActual={meses} />

      <h2>Costo directo por célula de centro</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Célula</th><th className="num">Costo directo</th></tr>
        </thead>
        <tbody>
          {centro.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td className="num">{formatoMoneda(resultados.find((r) => r.celulaId === c.id)?.costoDirecto ?? 0)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700 }}>
            <td>Total centro</td>
            <td className="num">{formatoMoneda(costoCentroTotal)}</td>
          </tr>
        </tbody>
      </table>
      {centro.length > 1 && (
        <p style={{ color: "var(--color-text-muted)" }}>
          Al haber más de una célula de centro, sus costos se suman y se reparten juntos entre
          la periferia (supuesto de la spec, sección 7).
        </p>
      )}

      <h2>Reparto entre células de periferia que operaban ({periferiaOperando.length})</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Célula</th><th className="num">Centro asignado</th></tr>
        </thead>
        <tbody>
          {celulas
            .filter((c) => c.tipo === "periferia")
            .map((c) => {
              const operaba = operabaEnMes(c, ultimoMes);
              return (
                <tr key={c.id} style={{ opacity: operaba ? 1 : 0.5 }}>
                  <td>{c.nombre}{!operaba && " (dada de baja — no participa del reparto)"}</td>
                  <td className="num">{formatoMoneda(resultados.find((r) => r.celulaId === c.id)?.costoCentroAsignado ?? 0)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </main>
    </>
  );
}
