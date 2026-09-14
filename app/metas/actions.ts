"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { mesADate } from "@/lib/mes";

export async function guardarConfigMetas(formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("config_metas")
    .update({
      piso_margen_pct: Number(formData.get("piso_margen_pct")),
      reparto_pct: Number(formData.get("reparto_pct")),
      regla: String(formData.get("regla")),
    })
    .eq("id", "global");

  if (error) throw new Error(error.message);
  revalidatePath("/metas");
}

export async function guardarVoluntario(mes: string, celulaId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("reparto_voluntario").upsert(
    {
      celula_id: celulaId,
      mes: mesADate(mes),
      activo: formData.get("activo") === "on",
    },
    { onConflict: "celula_id,mes" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/metas");
}
