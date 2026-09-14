"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { mesADate } from "@/lib/mes";
import { mensajeErrorBorrado } from "@/lib/db";

export async function crearMetrica(formData: FormData) {
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("metrica").insert({
    celula_id: String(formData.get("celula_id")),
    nombre: String(formData.get("nombre")),
    unidad: String(formData.get("unidad")),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/metricas");
  redirect("/metricas");
}

export async function eliminarMetrica(id: string) {
  const supabase = await createServerSupabase();

  await supabase.from("metrica_valor").delete().eq("metrica_id", id);

  const { error } = await supabase.from("metrica").delete().eq("id", id);
  if (error) {
    redirect(`/metricas?error=${encodeURIComponent(mensajeErrorBorrado(error, "valores cargados"))}`);
  }

  revalidatePath("/metricas");
  redirect("/metricas");
}

export async function guardarValorMetrica(mes: string, metricaId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("metrica_valor").upsert(
    {
      metrica_id: metricaId,
      mes: mesADate(mes),
      valor: Number(formData.get("valor")),
    },
    { onConflict: "metrica_id,mes" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/metricas/valores");
}
