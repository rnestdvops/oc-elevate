-- Panel de metas relativas (rentabilidad/reparto) y métricas propias por
-- equipo, dictadas por Ernesto en conversación — no forman parte del
-- Elevate_Spec_Sistema_CI.md original.

-- Config única de toda la organización (una sola fila, id fijo).
create table elevate.config_metas (
  id text primary key default 'global' check (id = 'global'),
  piso_margen_pct numeric(6, 3) not null default 0,
  reparto_pct numeric(6, 3) not null default 0,
  regla text not null default 'individual' check (regla in ('individual', 'piso_global', 'voluntario'))
);
insert into elevate.config_metas (id) values ('global');

-- Regla "voluntario": la célula que superó su piso decide, mes a mes, si
-- activa el reparto estándar (spec dictada: "solo un sí/no de si activa el
-- reparto estándar", no carga de monto/destinatario libre).
create table elevate.reparto_voluntario (
  id uuid primary key default gen_random_uuid(),
  celula_id uuid not null references elevate.celula(id),
  mes date not null,
  activo boolean not null default false,
  unique (celula_id, mes)
);

-- Métricas propias por célula (predictoras, no financieras) — nombre libre
-- + unidad de medida, definidas por cada equipo.
create table elevate.metrica (
  id uuid primary key default gen_random_uuid(),
  celula_id uuid not null references elevate.celula(id),
  nombre text not null,
  unidad text not null
);

create table elevate.metrica_valor (
  id uuid primary key default gen_random_uuid(),
  metrica_id uuid not null references elevate.metrica(id),
  mes date not null,
  valor numeric(14, 4) not null,
  unique (metrica_id, mes)
);

alter table elevate.config_metas enable row level security;
alter table elevate.reparto_voluntario enable row level security;
alter table elevate.metrica enable row level security;
alter table elevate.metrica_valor enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['config_metas', 'reparto_voluntario', 'metrica', 'metrica_valor'])
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
