import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import BotonBorrar from "@/components/BotonBorrar";
import { createServerSupabase } from "@/lib/supabase/server";
import { dateAMes } from "@/lib/mes";
import {
  actualizarFactura,
  crearReparto,
  eliminarReparto,
  crearNotaCredito,
  eliminarFactura,
} from "../actions";

export default async function FacturaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorBorrado } = await searchParams;
  const supabase = await createServerSupabase();

  const [{ data: factura }, { data: celulas }, { data: repartos }, { data: notasCredito }] =
    await Promise.all([
      supabase.from("factura").select("*").eq("id", id).single(),
      supabase.from("celula").select("*").order("nombre"),
      supabase.from("asignacion_de_factura").select("*, celula(nombre)").eq("factura_id", id),
      supabase.from("factura").select("*").eq("factura_relacionada_id", id),
    ]);

  if (!factura) notFound();

  const repartido = (repartos ?? []).reduce((acc, r) => acc + Number(r.monto), 0);
  const completo = Math.abs(repartido - Number(factura.monto_total)) < 0.01;
  const esNotaCredito = factura.tipo === "nota_credito";

  const actualizarConId = actualizarFactura.bind(null, id);
  const crearRepartoConId = crearReparto.bind(null, id);
  const crearNotaCreditoConId = crearNotaCredito.bind(null, id);
  const eliminarConId = eliminarFactura.bind(null, id);

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <p><Link href="/facturas">← Facturas</Link></p>
      <h1>{esNotaCredito ? "Nota de crédito" : "Factura"}</h1>
      {errorBorrado && <p className="aviso">{errorBorrado}</p>}

      {esNotaCredito && factura.factura_relacionada_id && (
        <p>
          Corrige a: <Link href={`/facturas/${factura.factura_relacionada_id}`}>ver factura original</Link>
        </p>
      )}

      <form action={actualizarConId}>
        <div>
          <label>Cliente <input name="cliente" defaultValue={factura.cliente ?? ""} /></label>
        </div>
        <div>
          <label>Fecha de emisión <input name="fecha_emision" type="date" defaultValue={factura.fecha_emision} required /></label>
        </div>
        <div>
          <label>
            Monto total {esNotaCredito && "(a acreditar, positivo)"}{" "}
            <input
              name="monto_total"
              type="number"
              step="0.01"
              defaultValue={Math.abs(Number(factura.monto_total))}
              required
            />
          </label>
        </div>
        <button type="submit">Guardar</button>
      </form>

      <form action={eliminarConId} style={{ marginTop: "1rem" }}>
        <BotonBorrar
          confirmar={`¿Borrar ${esNotaCredito ? "esta nota de crédito" : "esta factura"}? Se borra también su reparto. Esta acción no se puede deshacer.`}
        />
      </form>

      <h2>Reparto entre células y meses</h2>
      <p className={completo ? "" : "aviso"}>
        Repartido: {repartido} de {factura.monto_total} {!completo && "⚠ no coincide con el monto total"}
      </p>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>Célula</th><th>Mes</th><th>Monto</th><th></th></tr>
        </thead>
        <tbody>
          {repartos?.map((r) => (
            <tr key={r.id}>
              <td>{r.celula?.nombre}</td>
              <td>{dateAMes(r.mes)}</td>
              <td>{r.monto}</td>
              <td>
                <form action={eliminarReparto.bind(null, id, r.id)}>
                  <BotonBorrar confirmar="¿Borrar esta línea del reparto?" />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action={crearRepartoConId}>
        <select name="celula_id" required defaultValue="">
          <option value="" disabled>Célula...</option>
          {celulas?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input name="mes" type="month" required />
        <input
          name="monto"
          type="number"
          step="0.01"
          required
          placeholder={esNotaCredito ? "Monto (positivo)" : "Monto"}
        />
        <button type="submit">Agregar</button>
      </form>

      {!esNotaCredito && (
        <>
          <h2>Notas de crédito</h2>
          <table border={1} cellPadding={6}>
            <thead>
              <tr><th>Fecha</th><th>Monto acreditado</th><th></th></tr>
            </thead>
            <tbody>
              {notasCredito?.map((n) => (
                <tr key={n.id}>
                  <td>{n.fecha_emision}</td>
                  <td>{Math.abs(Number(n.monto_total))}</td>
                  <td><Link href={`/facturas/${n.id}`}>Ver</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Nueva nota de crédito</h3>
          <form action={crearNotaCreditoConId}>
            <div>
              <label>Cliente <input name="cliente" defaultValue={factura.cliente ?? ""} /></label>
            </div>
            <div>
              <label>Fecha de emisión <input name="fecha_emision" type="date" required /></label>
            </div>
            <div>
              <label>Monto a acreditar <input name="monto_total" type="number" step="0.01" required /></label>
            </div>
            <button type="submit">Crear y repartir</button>
          </form>
        </>
      )}
    </main>
    </>
  );
}
