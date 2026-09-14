"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { mesADate, mesAnterior } from "@/lib/mes";

const EPSILON = 0.01;

function numero(formData: FormData, key: string): number {
  return Number(formData.get(key));
}

export async function guardarSueldo(mes: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("sueldo_mensual").upsert(
    {
      integrante_id: String(formData.get("integrante_id")),
      mes: mesADate(mes),
      monto: numero(formData, "monto"),
    },
    { onConflict: "integrante_id,mes" }
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/costos/${mes}`);
}

export async function eliminarSueldo(mes: string, id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("sueldo_mensual").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/costos/${mes}`);
}

export async function crearAsignacion(mes: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const integranteId = String(formData.get("integrante_id"));
  const celulaId = String(formData.get("celula_id"));
  const porcentaje = numero(formData, "porcentaje");
  const fecha = mesADate(mes);

  // Bloqueo real (no solo aviso, decisión de Ernesto): la suma de % de un
  // integrante ese mes no puede pasar de 100. Se excluye la fila de esta
  // misma célula porque el upsert la reemplaza, no la suma aparte.
  const { data: existentes } = await supabase
    .from("asignacion_mensual")
    .select("celula_id, porcentaje")
    .eq("integrante_id", integranteId)
    .eq("mes", fecha);

  const sumaOtras = (existentes ?? [])
    .filter((a) => a.celula_id !== celulaId)
    .reduce((acc, a) => acc + Number(a.porcentaje), 0);

  if (sumaOtras + porcentaje > 100 + EPSILON) {
    const disponible = Math.max(0, 100 - sumaOtras);
    redirect(
      `/costos/${mes}?error=${encodeURIComponent(
        `Ese % supera el 100% del integrante ese mes (disponible: ${disponible.toFixed(2)}%).`
      )}`
    );
  }

  const { error } = await supabase.from("asignacion_mensual").upsert(
    {
      integrante_id: integranteId,
      celula_id: celulaId,
      mes: fecha,
      porcentaje,
    },
    { onConflict: "integrante_id,celula_id,mes" }
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/costos/${mes}`);
}

export async function eliminarAsignacion(mes: string, id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("asignacion_mensual").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/costos/${mes}`);
}

export async function crearServicio(mes: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("servicio_tercero").insert({
    celula_id: String(formData.get("celula_id")),
    mes: mesADate(mes),
    proveedor_descripcion: String(formData.get("proveedor_descripcion")),
    monto: numero(formData, "monto"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/costos/${mes}`);
}

export async function eliminarServicio(mes: string, id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("servicio_tercero").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/costos/${mes}`);
}

export async function guardarEquipamientoCosto(mes: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("equipamiento_costo_mensual").upsert(
    {
      equipamiento_id: String(formData.get("equipamiento_id")),
      mes: mesADate(mes),
      costo_reposicion: numero(formData, "costo_reposicion"),
      vida_util_meses: numero(formData, "vida_util_meses"),
    },
    { onConflict: "equipamiento_id,mes" }
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/costos/${mes}`);
}

export async function eliminarEquipamientoCosto(mes: string, id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("equipamiento_costo_mensual").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/costos/${mes}`);
}

export async function crearEquipamiento(mes: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("equipamiento").insert({
    celula_id: String(formData.get("celula_id")),
    descripcion: String(formData.get("descripcion")),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/costos/${mes}`);
}

// "Copiar mes anterior" (spec sección 6) — duplica sueldos, asignaciones,
// servicios de terceros y base de equipamiento del mes anterior como punto
// de partida editable. No pisa filas que ya existan ese mes (upsert con
// ignoreDuplicates): si el usuario ya cargó algo antes de copiar, se
// conserva lo cargado.
export async function copiarMesAnterior(mes: string) {
  const supabase = await createServerSupabase();
  const mesAnt = mesADate(mesAnterior(mes));
  const mesNuevo = mesADate(mes);

  const [sueldos, asignaciones, servicios, equiposCosto] = await Promise.all([
    supabase.from("sueldo_mensual").select("integrante_id, monto").eq("mes", mesAnt),
    supabase.from("asignacion_mensual").select("integrante_id, celula_id, porcentaje").eq("mes", mesAnt),
    supabase.from("servicio_tercero").select("celula_id, proveedor_descripcion, monto").eq("mes", mesAnt),
    supabase.from("equipamiento_costo_mensual").select("equipamiento_id, costo_reposicion, vida_util_meses").eq("mes", mesAnt),
  ]);

  if (sueldos.data?.length) {
    await supabase
      .from("sueldo_mensual")
      .upsert(
        sueldos.data.map((s) => ({ ...s, mes: mesNuevo })),
        { onConflict: "integrante_id,mes", ignoreDuplicates: true }
      );
  }
  if (asignaciones.data?.length) {
    await supabase
      .from("asignacion_mensual")
      .upsert(
        asignaciones.data.map((a) => ({ ...a, mes: mesNuevo })),
        { onConflict: "integrante_id,celula_id,mes", ignoreDuplicates: true }
      );
  }
  if (servicios.data?.length) {
    await supabase.from("servicio_tercero").insert(
      servicios.data.map((s) => ({ ...s, mes: mesNuevo }))
    );
  }
  if (equiposCosto.data?.length) {
    await supabase
      .from("equipamiento_costo_mensual")
      .upsert(
        equiposCosto.data.map((e) => ({ ...e, mes: mesNuevo })),
        { onConflict: "equipamiento_id,mes", ignoreDuplicates: true }
      );
  }

  revalidatePath(`/costos/${mes}`);
}
