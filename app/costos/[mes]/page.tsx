import Link from "next/link";
import Header from "@/components/Header";
import BotonBorrar from "@/components/BotonBorrar";
import { createServerSupabase } from "@/lib/supabase/server";
import { mesADate, mesAnterior, mesSiguiente, formatoMes } from "@/lib/mes";
import {
  guardarSueldo,
  eliminarSueldo,
  crearAsignacion,
  eliminarAsignacion,
  crearServicio,
  eliminarServicio,
  guardarEquipamientoCosto,
  eliminarEquipamientoCosto,
  crearEquipamiento,
  copiarMesAnterior,
} from "./actions";

export default async function CostosMesPage({
  params,
  searchParams,
}: {
  params: Promise<{ mes: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { mes } = await params;
  const { error: errorValidacion } = await searchParams;
  const fecha = mesADate(mes);
  const supabase = await createServerSupabase();

  const [
    { data: integrantes },
    { data: celulas },
    { data: equipamiento },
    { data: sueldos },
    { data: asignaciones },
    { data: servicios },
    { data: equiposCosto },
  ] = await Promise.all([
    supabase.from("integrante").select("*").order("nombre"),
    supabase.from("celula").select("*").order("nombre"),
    supabase.from("equipamiento").select("*, celula(nombre)").order("descripcion"),
    supabase.from("sueldo_mensual").select("*, integrante(nombre)").eq("mes", fecha),
    supabase.from("asignacion_mensual").select("*, integrante(nombre), celula(nombre)").eq("mes", fecha),
    supabase.from("servicio_tercero").select("*, celula(nombre)").eq("mes", fecha),
    supabase.from("equipamiento_costo_mensual").select("*, equipamiento(descripcion)").eq("mes", fecha),
  ]);

  // Suma de porcentaje asignado por integrante este mes (spec 3.4: debe dar
  // 100). Nunca puede pasar de 100 — el server action lo bloquea — pero
  // puede quedar incompleta mientras se sigue cargando.
  const sumaPorIntegrante = new Map<string, number>();
  for (const a of asignaciones ?? []) {
    sumaPorIntegrante.set(a.integrante_id, (sumaPorIntegrante.get(a.integrante_id) ?? 0) + Number(a.porcentaje));
  }

  const guardarSueldoMes = guardarSueldo.bind(null, mes);
  const crearAsignacionMes = crearAsignacion.bind(null, mes);
  const crearServicioMes = crearServicio.bind(null, mes);
  const guardarEquipamientoCostoMes = guardarEquipamientoCosto.bind(null, mes);
  const crearEquipamientoMes = crearEquipamiento.bind(null, mes);
  const copiarMesAnteriorMes = copiarMesAnterior.bind(null, mes);

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Costos — {formatoMes(mes)}</h1>
      {errorValidacion && <p className="aviso">{errorValidacion}</p>}
      <p>
        <Link href={`/costos/${mesAnterior(mes)}`}>← mes anterior</Link>
        {" · "}
        <Link href={`/costos/${mesSiguiente(mes)}`}>mes siguiente →</Link>
      </p>
      <form action={copiarMesAnteriorMes}>
        <button type="submit">Copiar mes anterior ({mesAnterior(mes)})</button>
      </form>

      <h2>Sueldos</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Integrante</th><th>Monto</th><th></th></tr>
        </thead>
        <tbody>
          {sueldos?.map((s) => (
            <tr key={s.id}>
              <td>{s.integrante?.nombre}</td>
              <td>{s.monto}</td>
              <td>
                <form action={eliminarSueldo.bind(null, mes, s.id)}>
                  <BotonBorrar />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action={guardarSueldoMes}>
        <select name="integrante_id" required defaultValue="">
          <option value="" disabled>Integrante...</option>
          {integrantes?.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
        </select>
        <input name="monto" type="number" step="0.01" required placeholder="Monto" />
        <button type="submit">Guardar</button>
      </form>

      <h2>Asignaciones (% de dedicación por célula)</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Integrante</th><th>Célula</th><th>%</th><th></th></tr>
        </thead>
        <tbody>
          {asignaciones?.map((a) => (
            <tr key={a.id}>
              <td>
                {a.integrante?.nombre}
                {sumaPorIntegrante.get(a.integrante_id) !== 100 && (
                  <> ⚠ suma {sumaPorIntegrante.get(a.integrante_id)}%</>
                )}
              </td>
              <td>{a.celula?.nombre}</td>
              <td>{a.porcentaje}</td>
              <td>
                <form action={eliminarAsignacion.bind(null, mes, a.id)}>
                  <BotonBorrar />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action={crearAsignacionMes}>
        <select name="integrante_id" required defaultValue="">
          <option value="" disabled>Integrante...</option>
          {integrantes?.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
        </select>
        <select name="celula_id" required defaultValue="">
          <option value="" disabled>Célula...</option>
          {celulas?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input name="porcentaje" type="number" step="0.01" min="0" max="100" required placeholder="%" />
        <button type="submit">Guardar</button>
      </form>

      <h2>Servicios de terceros</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Célula</th><th>Proveedor</th><th>Monto</th><th></th></tr>
        </thead>
        <tbody>
          {servicios?.map((s) => (
            <tr key={s.id}>
              <td>{s.celula?.nombre}</td>
              <td>{s.proveedor_descripcion}</td>
              <td>{s.monto}</td>
              <td>
                <form action={eliminarServicio.bind(null, mes, s.id)}>
                  <BotonBorrar />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action={crearServicioMes}>
        <select name="celula_id" required defaultValue="">
          <option value="" disabled>Célula...</option>
          {celulas?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input name="proveedor_descripcion" required placeholder="Proveedor / descripción" />
        <input name="monto" type="number" step="0.01" required placeholder="Monto" />
        <button type="submit">Agregar</button>
      </form>

      <h2>Equipamiento — base de depreciación</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Equipamiento</th><th>Costo repos.</th><th>Vida útil (meses)</th><th>Cuota</th><th></th></tr>
        </thead>
        <tbody>
          {equiposCosto?.map((e) => (
            <tr key={e.id}>
              <td>{e.equipamiento?.descripcion}</td>
              <td>{e.costo_reposicion}</td>
              <td>{e.vida_util_meses}</td>
              <td>{(Number(e.costo_reposicion) / Number(e.vida_util_meses)).toFixed(2)}</td>
              <td>
                <form action={eliminarEquipamientoCosto.bind(null, mes, e.id)}>
                  <BotonBorrar />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action={guardarEquipamientoCostoMes}>
        <select name="equipamiento_id" required defaultValue="">
          <option value="" disabled>Equipamiento...</option>
          {equipamiento?.map((e) => (
            <option key={e.id} value={e.id}>{e.descripcion} ({e.celula?.nombre})</option>
          ))}
        </select>
        <input name="costo_reposicion" type="number" step="0.01" required placeholder="Costo de reposición" />
        <input name="vida_util_meses" type="number" required placeholder="Vida útil (meses)" />
        <button type="submit">Guardar</button>
      </form>

      <h3>Nuevo equipamiento</h3>
      <form action={crearEquipamientoMes}>
        <select name="celula_id" required defaultValue="">
          <option value="" disabled>Célula...</option>
          {celulas?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input name="descripcion" required placeholder="Descripción (ej. notebooks)" />
        <button type="submit">Crear</button>
      </form>
    </main>
    </>
  );
}
