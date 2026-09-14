import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { actualizarCelula } from "../actions";

export default async function EditarCelulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: celula } = await supabase
    .from("celula")
    .select("*")
    .eq("id", id)
    .single();

  if (!celula) notFound();

  const actualizarConId = actualizarCelula.bind(null, id);

  return (
    <main style={{ padding: "2rem" }}>
      <p><Link href="/celulas">← Células</Link></p>
      <h1>Editar célula</h1>

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
    </main>
  );
}
