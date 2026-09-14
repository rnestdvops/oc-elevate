import Link from "next/link";
import Header from "@/components/Header";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import { createServerSupabase } from "@/lib/supabase/server";
import { mesActual, ultimosMeses, desplazarMes, mesADate } from "@/lib/mes";
import { guardarValorMetrica } from "../actions";

const PERIODOS = { mes: 1, trimestre: 3, anio: 12 } as const;
type Periodo = keyof typeof PERIODOS;

function esPeriodo(v: string | undefined): v is Periodo {
  return v === "mes" || v === "trimestre" || v === "anio";
}

function formatoVariacion(actual: number, anterior: number | null): string {
  if (anterior === null || anterior === 0) return "—";
  const variacion = ((actual - anterior) / Math.abs(anterior)) * 100;
  return `${variacion > 0 ? "+" : ""}${variacion.toFixed(1)}%`;
}

export default async function ValoresMetricasPage({
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
  const mesesAnterior = ultimosMeses(desplazarMes(mes, -n), n);
  const fechas = meses.map(mesADate);
  const fechasAnterior = mesesAnterior.map(mesADate);

  const [{ data: metricas }, { data: valoresActual }, { data: valoresAnterior }] = await Promise.all([
    supabase.from("metrica").select("*, celula(nombre)").order("celula_id"),
    supabase.from("metrica_valor").select("*").in("mes", fechas),
    supabase.from("metrica_valor").select("*").in("mes", fechasAnterior),
  ]);

  const sumaPorMetrica = (valores: typeof valoresActual, metricaId: string) =>
    (valores ?? []).filter((v) => v.metrica_id === metricaId).reduce((acc, v) => acc + Number(v.valor), 0);

  const valorDelMes = (metricaId: string) =>
    (valoresActual ?? []).find((v) => v.metrica_id === metricaId && v.mes === mesADate(mes));

  const guardarValorMes = periodo === "mes" ? guardarValorMetrica.bind(null, mes) : null;

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <p><Link href="/metricas">← Definición de métricas</Link></p>
      <h1>Valores de métricas</h1>

      <SelectorPeriodo basePath="/metricas/valores" periodo={periodo} mes={mes} mesesActual={meses} />

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Célula</th>
            <th>Métrica</th>
            <th>Unidad</th>
            <th className="num">Valor del período</th>
            <th className="num">Variación vs. período anterior</th>
            {periodo === "mes" && <th>Cargar este mes</th>}
          </tr>
        </thead>
        <tbody>
          {metricas?.map((m) => {
            const actual = sumaPorMetrica(valoresActual, m.id);
            const anterior = sumaPorMetrica(valoresAnterior, m.id);
            const tieneAnterior = (valoresAnterior ?? []).some((v) => v.metrica_id === m.id);
            return (
              <tr key={m.id}>
                <td>{m.celula?.nombre}</td>
                <td>{m.nombre}</td>
                <td>{m.unidad}</td>
                <td className="num">{actual}</td>
                <td className="num">{formatoVariacion(actual, tieneAnterior ? anterior : null)}</td>
                {periodo === "mes" && guardarValorMes && (
                  <td>
                    <form action={guardarValorMes.bind(null, m.id)}>
                      <input
                        name="valor"
                        type="number"
                        step="0.0001"
                        defaultValue={valorDelMes(m.id)?.valor ?? ""}
                        required
                      />
                      <button type="submit">Guardar</button>
                    </form>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
    </>
  );
}
