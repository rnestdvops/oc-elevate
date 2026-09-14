import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import BotonBorrar from "@/components/BotonBorrar";
import { createServerSupabase } from "@/lib/supabase/server";
import { actualizarCelula, eliminarCelula } from "../actions";

export default async function EditarCelulaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorBorrado } = await searchParams;
  const supabase = await createServerSupabase();
  const { data: celula } = await supabase
    .from("celula")
    .select("*")
    .eq("id", id)
    .single();

  if (!celula) notFound();

  const actualizarConId = actualizarCelula.bind(null, id);
  const eliminarConId = eliminarCelula.bind(null, id);

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <p><Link href="/celulas">← Células</Link></p>
      <h1>Editar célula</h1>
      {errorBorrado && <p className="aviso">{errorBorrado}</p>}

      <form action={actualizarConId}>
        <div>
          <label>Nombre <input name="nombre" defaultValue={celula.nombre} required /></label>
        </div>
        <div>
          <label>
            Tipo{" "}
            <select name="tipo" required defaultValue={celula.tipo}>
              <option value="periferia">Periferia</option>
              <option value="centro">Centro</option>
            </select>
          </label>
        </div>
        <div>
          <label>País/mercado <input name="pais_mercado" defaultValue={celula.pais_mercado ?? ""} /></label>
        </div>
        <div>
          <label><input type="checkbox" name="activa" defaultChecked={celula.activa} /> Activa</label>
        </div>
        <button type="submit">Guardar</button>
      </form>

      <form action={eliminarConId} style={{ marginTop: "1rem" }}>
        <BotonBorrar confirmar={`¿Borrar la célula "${celula.nombre}"? Esta acción no se puede deshacer.`} />
      </form>
    </main>
    </>
  );
}
