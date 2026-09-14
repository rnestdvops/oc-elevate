import Link from "next/link";
import Header from "@/components/Header";
import BotonBorrar from "@/components/BotonBorrar";
import { createServerSupabase } from "@/lib/supabase/server";
import { crearMetrica, eliminarMetrica } from "./actions";

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createServerSupabase();
  const [{ data: metricas }, { data: celulas }] = await Promise.all([
    supabase.from("metrica").select("*, celula(nombre)").order("celula_id"),
    supabase.from("celula").select("*").order("nombre"),
  ]);

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Métricas propias por equipo</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Métricas predictoras (de proceso o de producto) que cada célula define para sí misma —
        no financieras, no forman parte de la Liga C/I. <Link href="/metricas/valores">Cargar / ver valores →</Link>
      </p>
      {error && <p className="aviso">{error}</p>}

      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Célula</th><th>Métrica</th><th>Unidad</th><th></th></tr>
        </thead>
        <tbody>
          {metricas?.map((m) => (
            <tr key={m.id}>
              <td>{m.celula?.nombre}</td>
              <td>{m.nombre}</td>
              <td>{m.unidad}</td>
              <td>
                <form action={eliminarMetrica.bind(null, m.id)}>
                  <BotonBorrar confirmar={`¿Borrar la métrica "${m.nombre}"? Se borran también sus valores cargados.`} />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Nueva métrica</h2>
      <form action={crearMetrica}>
        <select name="celula_id" required defaultValue="">
          <option value="" disabled>Célula...</option>
          {celulas?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input name="nombre" required placeholder="Nombre (ej. Llamadas programadas)" />
        <input name="unidad" required placeholder="Unidad (ej. llamadas, USD, %)" />
        <button type="submit">Crear</button>
      </form>
    </main>
    </>
  );
}
