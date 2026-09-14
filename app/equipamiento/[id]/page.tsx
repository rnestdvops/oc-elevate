import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import BotonBorrar from "@/components/BotonBorrar";
import { createServerSupabase } from "@/lib/supabase/server";
import { actualizarEquipamiento, eliminarEquipamiento } from "../actions";

export default async function EditarEquipamientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorBorrado } = await searchParams;
  const supabase = await createServerSupabase();

  const [{ data: equipo }, { data: celulas }] = await Promise.all([
    supabase.from("equipamiento").select("*").eq("id", id).single(),
    supabase.from("celula").select("*").order("nombre"),
  ]);

  if (!equipo) notFound();

  const actualizarConId = actualizarEquipamiento.bind(null, id);
  const eliminarConId = eliminarEquipamiento.bind(null, id);

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <p><Link href="/equipamiento">← Equipamiento</Link></p>
      <h1>Editar equipamiento</h1>
      {errorBorrado && <p className="aviso">{errorBorrado}</p>}

      <form action={actualizarConId}>
        <div>
          <label>Descripción <input name="descripcion" defaultValue={equipo.descripcion} required /></label>
        </div>
        <div>
          <label>
            Célula{" "}
            <select name="celula_id" required defaultValue={equipo.celula_id}>
              {celulas?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
        </div>
        <button type="submit">Guardar</button>
      </form>

      <form action={eliminarConId} style={{ marginTop: "1rem" }}>
        <BotonBorrar confirmar={`¿Borrar "${equipo.descripcion}"? Se borra también su base de depreciación cargada. Esta acción no se puede deshacer.`} />
      </form>
    </main>
    </>
  );
}
