"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function crearCelula(formData: FormData) {
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("celula").insert({
    nombre: String(formData.get("nombre")),
    tipo: String(formData.get("tipo")),
    pais_mercado: String(formData.get("pais_mercado") || "") || null,
    activa: formData.get("activa") === "on",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/celulas");
  redirect("/celulas");
}

export async function actualizarCelula(id: string, formData: FormData) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("celula")
    .update({
      nombre: String(formData.get("nombre")),
      tipo: String(formData.get("tipo")),
      pais_mercado: String(formData.get("pais_mercado") || "") || null,
      activa: formData.get("activa") === "on",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/celulas");
  redirect("/celulas");
}
