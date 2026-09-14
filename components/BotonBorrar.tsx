"use client";

export default function BotonBorrar({ confirmar = "¿Seguro que querés borrar esto?" }: { confirmar?: string }) {
  return (
    <button
      type="submit"
      className="btn-secundario"
      onClick={(e) => {
        if (!confirm(confirmar)) e.preventDefault();
      }}
    >
      Borrar
    </button>
  );
}
