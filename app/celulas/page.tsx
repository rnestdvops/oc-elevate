import Link from "next/link";
import Header from "@/components/Header";
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
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Células</h1>

      {error && <p>Error al cargar: {error.message}</p>}

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>País/mercado</th>
            <th>Fecha de baja</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {celulas?.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.tipo}</td>
              <td>{c.pais_mercado ?? "—"}</td>
              <td>{c.fecha_baja ?? "—"}</td>
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
          <label>Fecha de baja (vacío = sigue operando) <input name="fecha_baja" type="date" /></label>
        </div>
        <button type="submit">Crear</button>
      </form>
    </main>
    </>
  );
}
