import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { crearCelula } from "./actions";

export default async function CelulasPage() {
  const supabase = await createServerSupabase();
  const { data: celulas, error } = await supabase
    .from("celula")
    .select("*")
    .order("tipo")
    .order("nombre");

  return (
    <main style={{ padding: "2rem" }}>
      <p><Link href="/">← Inicio</Link></p>
      <h1>Células</h1>

      {error && <p>Error al cargar: {error.message}</p>}

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>País/mercado</th>
            <th>Activa</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {celulas?.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.tipo}</td>
              <td>{c.pais_mercado ?? "—"}</td>
              <td>{c.activa ? "Sí" : "No"}</td>
              <td><Link href={`/celulas/${c.id}`}>Editar</Link></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Nueva célula</h2>
      <form action={crearCelula}>
        <div>
          <label>Nombre <input name="nombre" required /></label>
        </div>
        <div>
          <label>
            Tipo{" "}
            <select name="tipo" required defaultValue="periferia">
              <option value="periferia">Periferia</option>
              <option value="centro">Centro</option>
            </select>
          </label>
        </div>
        <div>
          <label>País/mercado <input name="pais_mercado" /></label>
        </div>
        <div>
          <label><input type="checkbox" name="activa" defaultChecked /> Activa</label>
        </div>
        <button type="submit">Crear</button>
      </form>
    </main>
  );
}
