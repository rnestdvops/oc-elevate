-- Elevate — esquema inicial, basado 1:1 en docs/Elevate_Spec_Sistema_CI.md
-- secciones 3 y 4. Nombres en español, sin traducir, para que coincidan con
-- el vocabulario de negocio del documento.

create schema if not exists elevate;

create table elevate.celula (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('periferia', 'centro')),
  pais_mercado text,
  activa boolean not null default true
);

create table elevate.integrante (
  id uuid primary key default gen_random_uuid(),
  nombre text not null
);

create table elevate.sueldo_mensual (
  id uuid primary key default gen_random_uuid(),
  integrante_id uuid not null references elevate.integrante(id),
  mes date not null, -- siempre día 1 del mes
  monto numeric(14, 2) not null,
  unique (integrante_id, mes)
);

create table elevate.asignacion_mensual (
  id uuid primary key default gen_random_uuid(),
  integrante_id uuid not null references elevate.integrante(id),
  celula_id uuid not null references elevate.celula(id),
  mes date not null,
  porcentaje numeric(5, 2) not null check (porcentaje > 0 and porcentaje <= 100),
  unique (integrante_id, celula_id, mes)
);
-- Nota: la validación "la suma de porcentaje de un integrante en un mes debe
-- ser 100" (spec 3.4) se hace en la capa de aplicación, no en un constraint
-- SQL — no hay forma limpia de validar una agregación entre filas sin un
-- trigger, y el flujo de carga (alta/edición de varias asignaciones a la vez)
-- ya necesita mostrarle esa suma al usuario antes de guardar.

create table elevate.servicio_tercero (
  id uuid primary key default gen_random_uuid(),
  celula_id uuid not null references elevate.celula(id),
  mes date not null,
  proveedor_descripcion text not null,
  monto numeric(14, 2) not null
);

create table elevate.equipamiento (
  id uuid primary key default gen_random_uuid(),
  celula_id uuid not null references elevate.celula(id),
  descripcion text not null
);

create table elevate.equipamiento_costo_mensual (
  id uuid primary key default gen_random_uuid(),
  equipamiento_id uuid not null references elevate.equipamiento(id),
  mes date not null,
  costo_reposicion numeric(14, 2) not null,
  vida_util_meses integer not null check (vida_util_meses > 0),
  unique (equipamiento_id, mes)
);

create table elevate.factura (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('factura', 'nota_credito')),
  factura_relacionada_id uuid references elevate.factura(id),
  cliente text,
  fecha_emision date not null,
  monto_total numeric(14, 2) not null,
  constraint nota_credito_requiere_factura check (
    tipo <> 'nota_credito' or factura_relacionada_id is not null
  )
);

create table elevate.asignacion_de_factura (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references elevate.factura(id),
  celula_id uuid not null references elevate.celula(id),
  mes date not null,
  monto numeric(14, 2) not null
);
-- Nota: la validación "la suma de monto de las asignaciones de una factura
-- debe igualar factura.monto_total (con signo negativo para notas de
-- crédito)" (spec 3.9) también queda en la capa de aplicación, mismo motivo
-- que asignacion_mensual arriba.

-- RLS: v1 de uso interno, sin roles ni multiusuario (spec 7) — cualquier
-- usuario autenticado tiene acceso completo de lectura/escritura. Si más
-- adelante aparece la necesidad de roles, este es el punto donde se agregan
-- políticas más finas por tabla.
alter table elevate.celula enable row level security;
alter table elevate.integrante enable row level security;
alter table elevate.sueldo_mensual enable row level security;
alter table elevate.asignacion_mensual enable row level security;
alter table elevate.servicio_tercero enable row level security;
alter table elevate.equipamiento enable row level security;
alter table elevate.equipamiento_costo_mensual enable row level security;
alter table elevate.factura enable row level security;
alter table elevate.asignacion_de_factura enable row level security;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'celula', 'integrante', 'sueldo_mensual', 'asignacion_mensual',
      'servicio_tercero', 'equipamiento', 'equipamiento_costo_mensual',
      'factura', 'asignacion_de_factura'
    ])
  loop
    execute format(
      'create policy authenticated_full_access on elevate.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

grant usage on schema elevate to authenticated, service_role;
grant all on all tables in schema elevate to authenticated, service_role;
grant all on all sequences in schema elevate to authenticated, service_role;
