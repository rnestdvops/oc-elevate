import { createServerSupabase } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Elevate — Liga C/I</h1>
      <p>Sesión: {user?.email}</p>
      <nav>
        <ul>
          <li><a href="/celulas">Células</a></li>
          <li><a href="/integrantes">Integrantes</a></li>
          <li><a href="/costos">Costos mensuales</a></li>
          <li><a href="/facturas">Facturas</a></li>
          <li><a href="/liga">Liga</a></li>
          <li><a href="/centro">Centro</a></li>
        </ul>
      </nav>
    </main>
  );
}
