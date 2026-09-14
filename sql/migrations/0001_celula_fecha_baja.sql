-- Reemplaza `celula.activa` (booleano, sin historial) por `fecha_baja`
-- (fecha, nula si sigue operando). Decisión de Ernesto: una célula no puede
-- estar "inactiva un mes puntual" — o compite (aunque tenga bajo desempeño
-- o estacionalidad, eso debe verse en la liga, no esconderse) o fue dada de
-- baja definitivamente y su gente se redistribuyó a otras células. La
-- célula cuenta completa (costo de centro, divisor, ranking) en todos los
-- meses hasta el de fecha_baja inclusive; deja de contar desde el mes
-- siguiente — sin alterar el historial de los meses en que sí operaba.

alter table elevate.celula add column fecha_baja date;
alter table elevate.celula drop column activa;
