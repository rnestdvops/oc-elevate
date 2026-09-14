import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con el service role key — ignora RLS. Server-only, para
 * tareas de mantenimiento que corren fuera de una sesión de usuario (ej.
 * scripts de backoffice). Ninguna ruta de la app lo usa para servir datos a
 * un usuario final: eso pasa siempre por lib/supabase/server.ts.
 */
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: "elevate" } }
  );
}
