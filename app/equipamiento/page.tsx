import Link from "next/link";
import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { crearEquipamiento } from "./actions";

export default async function EquipamientoPage() {
  const supabase = await createServerSupabase();
  const [{ data: equipamiento, error }, { data: celulas }] = await Promise.all([
    supabase.from("equipamiento").select("*, celula(nombre)").order("descripcion"),
    supabase.from("celula").select("*").order("nombre"),
  ]);

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Equipamiento</h1>

      {error && <p>Error al cargar: {error.message}</p>}

      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Descripción</th><th>Célula</th><th></th></tr>
        </thead>
        <tbody>
          {equipamiento?.map((e) => (
            <tr key={e.id}>
              <td>{e.descripcion}</td>
              <td>{e.celula?.nombre}</td>
              <td><Link href={`/equipamiento/${e.id}`}>Editar</Link></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Nuevo equipamiento</h2>
      <form action={crearEquipamiento}>
        <select name="celula_id" required defaultValue="">
          <option value="" disabled>Célula...</option>
          {celulas?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input name="descripcion" required placeholder="Descripción (ej. notebooks)" />
        <button type="submit">Crear</button>
      </form>

      <p style={{ color: "var(--color-text-muted)" }}>
        La base de depreciación mes a mes (costo de reposición y vida útil) se carga en{" "}
        <Link href="/costos">Costos mensuales</Link>, no acá.
      </p>
    </main>
    </>
  );
}
