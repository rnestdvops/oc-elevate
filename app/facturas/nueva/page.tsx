import Header from "@/components/Header";
import { crearFactura } from "../actions";

export default function NuevaFacturaPage() {
  return (
    <>
    <Header />
    <main style={{ padding: "2rem" }}>
      <h1>Nueva factura</h1>
      <form action={crearFactura}>
        <div>
          <label>Cliente <input name="cliente" /></label>
        </div>
        <div>
          <label>Fecha de emisión <input name="fecha_emision" type="date" required /></label>
        </div>
        <div>
          <label>Monto total <input name="monto_total" type="number" step="0.01" required /></label>
        </div>
        <button type="submit">Crear y repartir</button>
      </form>
    </main>
    </>
  );
}
