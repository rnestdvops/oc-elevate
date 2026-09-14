"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { mensajeErrorBorrado } from "@/lib/db";

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

export async function eliminarCelula(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("celula").delete().eq("id", id);

  if (error) {
    redirect(
      `/celulas/${id}?error=${encodeURIComponent(
        mensajeErrorBorrado(error, "sueldos, servicios, equipamiento, asignaciones de factura o costos de centro")
      )}`
    );
  }

  revalidatePath("/celulas");
  redirect("/celulas");
}
