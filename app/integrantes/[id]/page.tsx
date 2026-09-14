import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import BotonBorrar from "@/components/BotonBorrar";
import { createServerSupabase } from "@/lib/supabase/server";
import { actualizarIntegrante, eliminarIntegrante } from "../actions";

export default async function EditarIntegrantePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorBorrado } = await searchParams;
  const supabase = await createServerSupabase();
  const { data: integrante } = await supabase
    .from("integrante")
    .select("*")
    .eq("id", id)
    .single();

  if (!integrante) notFound();

  const actualizarConId = actualizarIntegrante.bind(null, id);
  const eliminarConId = eliminarIntegrante.bind(null, id);

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <p><Link href="/integrantes">← Integrantes</Link></p>
      <h1>Editar integrante</h1>
      {errorBorrado && <p className="aviso">{errorBorrado}</p>}

      <form action={actualizarConId}>
        <div>
          <label>Nombre <input name="nombre" defaultValue={integrante.nombre} required /></label>
        </div>
        <button type="submit">Guardar</button>
      </form>

      <form action={eliminarConId} style={{ marginTop: "1rem" }}>
        <BotonBorrar confirmar={`¿Borrar a "${integrante.nombre}"? Esta acción no se puede deshacer.`} />
      </form>
    </main>
    </>
  );
}
