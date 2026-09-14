import Link from "next/link";
import { desplazarMes, formatoMes } from "@/lib/mes";

const ETIQUETAS = { mes: "Mes", trimestre: "Trimestre", anio: "Año móvil" } as const;
type Periodo = keyof typeof ETIQUETAS;
const PERIODOS = Object.keys(ETIQUETAS) as Periodo[];

export default function SelectorPeriodo({
  basePath,
  periodo,
  mes,
  mesesActual,
}: {
  basePath: string;
  periodo: Periodo;
  mes: string;
  mesesActual: string[];
}) {
  const inicio = mesesActual[0];
  const fin = mesesActual[mesesActual.length - 1];
  const rango = inicio === fin ? formatoMes(inicio) : `${formatoMes(inicio)} a ${formatoMes(fin)}`;

  return (
    <>
      <nav className="tabsPeriodo">
        {PERIODOS.map((p) => (
          <Link
            key={p}
            href={`${basePath}?periodo=${p}&mes=${mes}`}
            className={p === periodo ? "activo" : undefined}
            aria-current={p === periodo ? "true" : undefined}
          >
            {ETIQUETAS[p]}
          </Link>
        ))}
      </nav>

      <p>
        <Link href={`${basePath}?periodo=${periodo}&mes=${desplazarMes(mes, -1)}`}>← mes anterior</Link>
        {" · "}
        {formatoMes(mes)}
        {" · "}
        <Link href={`${basePath}?periodo=${periodo}&mes=${desplazarMes(mes, 1)}`}>mes siguiente →</Link>
      </p>

      <h2>Estás viendo: {ETIQUETAS[periodo]} — {rango}</h2>
    </>
  );
}
