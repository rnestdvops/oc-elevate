import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Server Components / Route Handlers que respeta la
 * sesión del usuario (JWT de Supabase Auth en cookies) y por lo tanto
 * respeta RLS. Este es el cliente que usa casi todo el código de la app.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Llamado desde un Server Component (no un Route Handler ni una
            // Server Action) donde no se pueden escribir cookies — se ignora
            // porque proxy.ts ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}
