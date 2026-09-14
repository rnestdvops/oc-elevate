# Elevate — Liga C/I

Sistema de registro de células, costos y facturas de Elevate, para calcular el ratio Costo/
Ingreso (C/I) mensual/trimestral/año móvil de cada célula de periferia. Especificación completa
y de lectura obligatoria antes de tocar el dominio: [docs/Elevate_Spec_Sistema_CI.md](docs/Elevate_Spec_Sistema_CI.md).
Las reglas de negocio de la sección 3 de ese documento están discutidas y cerradas — no
reabrirlas sin motivo explícito de Ernesto.

## Stack

Next.js 16 (App Router, Turbopack) + Supabase (`@supabase/ssr`) + Vercel, mismo patrón que los
demás proyectos de Adaptant (ver oc-ispe). Auth: magic link de Supabase Auth, sin roles para
esta v1 (spec sección 7 — uso interno, sin control de acceso multiusuario).

- `lib/supabase/server.ts` — cliente que respeta la sesión del usuario (RLS). Usar este para
  casi todo.
- `lib/supabase/client.ts` — cliente de navegador, solo para `signInWithOtp` en `/login`.
- `lib/supabase/admin.ts` — service role, ignora RLS. Solo para scripts de mantenimiento fuera
  de una sesión de usuario.
- `proxy.ts` — reemplaza a `middleware.ts` en Next 16; refresca la sesión y redirige a `/login`
  si no hay usuario autenticado.
- `sql/schema.sql` — esquema completo (schema `elevate`), ya aplicado al proyecto Supabase del
  repo. Cualquier cambio de estructura se agrega como una migración nueva en `sql/`, no
  editando este archivo tal cual quedó.

## Next.js 16 — no es el Next.js que conocés

Esta versión (16.2.10) es posterior al corte de entrenamiento del modelo y tiene cambios
rompedores respecto de versiones anteriores. Antes de escribir código que toque convenciones de
routing, cache, `cookies()`/`headers()`/`params` async, o el archivo de proxy, revisar
`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` en vez de asumir el
comportamiento de una versión anterior.

## Reglas de cálculo (resumen — la fuente de verdad es la spec)

- Costo de centro se reparte en partes iguales entre las células de periferia **activas** ese
  mes.
- Trimestre y año móvil suman meses reales, nunca multiplican un mes.
- El ingreso incluye la pauta gestionada — no comparar este C/I con el de la planilla Excel
  previa.
- No hay ningún indicador a nivel Integrante — la unidad de medida es siempre la célula.
- Las sumas de porcentaje (`asignacion_mensual`) y de reparto de factura
  (`asignacion_de_factura`) se validan en la capa de aplicación, no en SQL (ver comentarios en
  `sql/schema.sql`).
