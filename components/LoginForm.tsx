"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    setEstado(error ? "error" : "enviado");
  }

  if (estado === "enviado") {
    return <p>Revisá tu email — te mandamos un link para entrar.</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Elevate</h1>
      <input
        type="email"
        required
        placeholder="tu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando..." : "Entrar"}
      </button>
      {estado === "error" && <p>Hubo un error. Probá de nuevo.</p>}
    </form>
  );
}
