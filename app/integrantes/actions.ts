"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { mensajeErrorBorrado } from "@/lib/db";

export async function crearIntegrante(formData: FormData) {
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("integrante").insert({
    nombre: String(formData.get("nombre")),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/integrantes");
  redirect("/integrantes");
}

export async function actualizarIntegrante(id: string, formData: FormData) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("integrante")
    .update({ nombre: String(formData.get("nombre")) })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/integrantes");
  redirect("/integrantes");
}

export async function eliminarIntegrante(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("integrante").delete().eq("id", id);

  if (error) {
    redirect(
      `/integrantes/${id}?error=${encodeURIComponent(
        mensajeErrorBorrado(error, "sueldos o asignaciones mensuales")
      )}`
    );
  }

  revalidatePath("/integrantes");
  redirect("/integrantes");
}
