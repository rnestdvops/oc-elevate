import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function Header() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="appHeader">
      <Link href="/">Elevate — Liga C/I</Link>
      <nav>
        <ul>
          <li><Link href="/celulas">Células</Link></li>
          <li><Link href="/integrantes">Integrantes</Link></li>
          <li><Link href="/costos">Costos mensuales</Link></li>
          <li><Link href="/facturas">Facturas</Link></li>
          <li><Link href="/liga">Liga</Link></li>
          <li><Link href="/centro">Centro</Link></li>
        </ul>
      </nav>
      <span>{user?.email}</span>
    </header>
  );
}
