import Link from "next/link";
import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { crearIntegrante } from "./actions";

export default async function IntegrantesPage() {
  const supabase = await createServerSupabase();
  const { data: integrantes, error } = await supabase
    .from("integrante")
    .select("*")
    .order("nombre");

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Integrantes</h1>

      {error && <p>Error al cargar: {error.message}</p>}

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {integrantes?.map((i) => (
            <tr key={i.id}>
              <td>{i.nombre}</td>
              <td><Link href={`/integrantes/${i.id}`}>Editar</Link></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Nuevo integrante</h2>
      <form action={crearIntegrante}>
        <div>
          <label>Nombre <input name="nombre" required /></label>
        </div>
        <button type="submit">Crear</button>
      </form>
    </main>
    </>
  );
}
