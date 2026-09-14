import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { actualizarIntegrante } from "../actions";

export default async function EditarIntegrantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: integrante } = await supabase
    .from("integrante")
    .select("*")
    .eq("id", id)
    .single();

  if (!integrante) notFound();

  const actualizarConId = actualizarIntegrante.bind(null, id);

  return (
    <main style={{ padding: "2rem" }}>
      <p><Link href="/integrantes">← Integrantes</Link></p>
      <h1>Editar integrante</h1>

      <form action={actualizarConId}>
        <div>
          <label>Nombre <input name="nombre" defaultValue={integrante.nombre} required /></label>
        </div>
        <button type="submit">Guardar</button>
      </form>
    </main>
  );
}
