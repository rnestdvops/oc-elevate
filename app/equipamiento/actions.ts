"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { mensajeErrorBorrado } from "@/lib/db";

export async function crearEquipamiento(formData: FormData) {
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("equipamiento").insert({
    celula_id: String(formData.get("celula_id")),
    descripcion: String(formData.get("descripcion")),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/equipamiento");
  redirect("/equipamiento");
}

export async function actualizarEquipamiento(id: string, formData: FormData) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("equipamiento")
    .update({
      celula_id: String(formData.get("celula_id")),
      descripcion: String(formData.get("descripcion")),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/equipamiento");
  redirect("/equipamiento");
}

export async function eliminarEquipamiento(id: string) {
  const supabase = await createServerSupabase();

  // A diferencia de célula/integrante/factura, acá sí tiene sentido
  // cascadear: equipamiento_costo_mensual son bases de depreciación que
  // solo existen en función de este equipamiento puntual, no datos que
  // otra pantalla necesite conservar de forma independiente.
  await supabase.from("equipamiento_costo_mensual").delete().eq("equipamiento_id", id);

  const { error } = await supabase.from("equipamiento").delete().eq("id", id);

  if (error) {
    redirect(`/equipamiento/${id}?error=${encodeURIComponent(mensajeErrorBorrado(error, "costos mensuales"))}`);
  }

  revalidatePath("/equipamiento");
  redirect("/equipamiento");
}
