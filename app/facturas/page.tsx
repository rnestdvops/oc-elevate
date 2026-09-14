import Link from "next/link";
import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatoMoneda } from "@/lib/formato";

export default async function FacturasPage() {
  const supabase = await createServerSupabase();
  const { data: facturas, error } = await supabase
    .from("factura")
    .select("*, asignacion_de_factura(monto)")
    .order("fecha_emision", { ascending: false });

  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Facturas</h1>

      {error && <p>Error al cargar: {error.message}</p>}

      <p><Link href="/facturas/nueva" className="btn">Nueva factura</Link></p>

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Cliente</th>
            <th className="num">Monto total</th>
            <th className="num">Repartido</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {facturas?.map((f) => {
            const repartido = (f.asignacion_de_factura ?? []).reduce(
              (acc: number, r: { monto: number }) => acc + Number(r.monto),
              0
            );
            const completo = Math.abs(repartido - Number(f.monto_total)) < 0.01;
            return (
              <tr key={f.id}>
                <td>{f.fecha_emision}</td>
                <td>{f.tipo === "nota_credito" ? "Nota de crédito" : "Factura"}</td>
                <td>{f.cliente ?? "—"}</td>
                <td className="num">{formatoMoneda(f.monto_total)}</td>
                <td className={`num${completo ? "" : " aviso"}`}>
                  {formatoMoneda(repartido)}{!completo && " ⚠"}
                </td>
                <td><Link href={`/facturas/${f.id}`}>Ver / editar</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
    </>
  );
}
