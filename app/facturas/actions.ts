"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { mesADate } from "@/lib/mes";

const EPSILON = 0.01;

export async function crearFactura(formData: FormData) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("factura")
    .insert({
      tipo: "factura",
      cliente: String(formData.get("cliente") || "") || null,
      fecha_emision: String(formData.get("fecha_emision")),
      monto_total: Number(formData.get("monto_total")),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  redirect(`/facturas/${data.id}`);
}

export async function crearNotaCredito(facturaRelacionadaId: string, formData: FormData) {
  const supabase = await createServerSupabase();

  // El monto se carga como positivo (lo que se acredita) pero se guarda en
  // negativo — spec 3.9: "con signo negativo para notas de crédito", para
  // que el reparto y el ingreso total se compensen solos en los cálculos.
  const montoAcreditado = Number(formData.get("monto_total"));

  const { data, error } = await supabase
    .from("factura")
    .insert({
      tipo: "nota_credito",
      factura_relacionada_id: facturaRelacionadaId,
      cliente: String(formData.get("cliente") || "") || null,
      fecha_emision: String(formData.get("fecha_emision")),
      monto_total: -Math.abs(montoAcreditado),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  redirect(`/facturas/${data.id}`);
}

export async function actualizarFactura(id: string, formData: FormData) {
  const supabase = await createServerSupabase();

  const { data: actual } = await supabase.from("factura").select("tipo").eq("id", id).single();
  const montoIngresado = Number(formData.get("monto_total"));
  const monto = actual?.tipo === "nota_credito" ? -Math.abs(montoIngresado) : montoIngresado;

  const { error } = await supabase
    .from("factura")
    .update({
      cliente: String(formData.get("cliente") || "") || null,
      fecha_emision: String(formData.get("fecha_emision")),
      monto_total: monto,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/facturas/${id}`);
}

export async function crearReparto(facturaId: string, formData: FormData) {
  const supabase = await createServerSupabase();

  const { data: factura } = await supabase.from("factura").select("tipo, monto_total").eq("id", facturaId).single();
  const montoIngresado = Number(formData.get("monto"));
  const monto = factura?.tipo === "nota_credito" ? -Math.abs(montoIngresado) : montoIngresado;

  // Bloqueo real (no solo aviso, decisión de Ernesto): el reparto no puede
  // pasar el monto total de la factura.
  const { data: repartos } = await supabase
    .from("asignacion_de_factura")
    .select("monto")
    .eq("factura_id", facturaId);
  const repartido = (repartos ?? []).reduce((acc, r) => acc + Number(r.monto), 0);
  const total = Number(factura?.monto_total ?? 0);

  if (Math.abs(repartido + monto) > Math.abs(total) + EPSILON) {
    const disponible = Math.abs(total) - Math.abs(repartido);
    redirect(
      `/facturas/${facturaId}?error=${encodeURIComponent(
        `Ese monto supera el total de la factura (disponible: ${disponible.toFixed(2)}).`
      )}`
    );
  }

  const { error } = await supabase.from("asignacion_de_factura").insert({
    factura_id: facturaId,
    celula_id: String(formData.get("celula_id")),
    mes: mesADate(String(formData.get("mes"))),
    monto,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/facturas/${facturaId}`);
}

export async function eliminarReparto(facturaId: string, id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("asignacion_de_factura").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/facturas/${facturaId}`);
}

export async function eliminarFactura(id: string) {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("factura")
    .select("id", { count: "exact", head: true })
    .eq("factura_relacionada_id", id);

  if (count && count > 0) {
    redirect(
      `/facturas/${id}?error=${encodeURIComponent(
        "No se puede borrar: tiene notas de crédito asociadas. Borralas primero."
      )}`
    );
  }

  // El reparto es propio de esta factura — se borra junto con ella, no
  // queda huérfano ni referencia nada más.
  await supabase.from("asignacion_de_factura").delete().eq("factura_id", id);

  const { error } = await supabase.from("factura").delete().eq("id", id);
  if (error) {
    redirect(`/facturas/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/facturas");
  redirect("/facturas");
}
