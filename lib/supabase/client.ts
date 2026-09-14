"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Client Components (anon key + cookies del
 * navegador, sincronizado con lib/supabase/server.ts por @supabase/ssr).
 * Se usa para supabase.auth.signInWithOtp({ email }) en /login.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
