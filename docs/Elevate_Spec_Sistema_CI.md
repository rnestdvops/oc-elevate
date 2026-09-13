# Elevate — Sistema de registro y gestión de metas relativas (C/I)

Especificación funcional y de datos, preparada para construir con Claude Code. Reemplaza el
cálculo manual que hoy vive en una planilla Excel (Ligas de Costo/Ingreso), con el mismo
mecanismo de fondo pero registrando el detalle mes a mes en vez de un número ya sumado.

## 1. Propósito

Registrar los equipos (células) de Elevate, su gente, sus costos y sus facturas, y calcular a
partir de eso el ratio Costo/Ingreso (C/I) de cada célula de periferia — por mes, por trimestre
y por año móvil — para sostener una liga interna de eficiencia entre células.

## 2. Fundamento conceptual: BetaCodex y metas relativas

Este sistema no es un tablero de indicadores genérico: implementa directamente el enfoque de
**Relative Targets** de BetaCodex — la alternativa al presupuesto, la meta fija y la evaluación
individual, pensada para organizaciones que operan bajo complejidad real. Vale que quien
construya el sistema entienda el porqué, no solo el cómo, porque varias reglas de la sección
siguiente que podrían parecer arbitrarias se explican solo desde acá.

Fuentes ya disponibles como material del proyecto (Ernesto va a sumar corpus adicional):
- *Relative Targets: Patterns in Practice* — BetaCodex Network White Paper No. 22 (Niels
  Pflaeging, enero 2025). Es la fuente directa de la liga de C/I de este sistema.
- *Organizar para la Complejidad* — BetaCodex Network White Paper No. 12 & 13. Fundamenta la
  distinción Alpha (mando y control, metas fijas impuestas) / Beta (descentralización, metas
  relativas) que sostiene todo el proyecto de transformación de Elevate.
- Los white papers No. 18, 19 y 20, sobre Cell Structure Design (organización en células,
  periferia y centro).

**Linaje intelectual** — para que quede trazable y no como una moda de consultoría sin origen,
siguiendo la misma exigencia de "ninguna afirmación sin fuente citable" que rige todo el
corpus de pensamiento organizacional que Adaptant está formalizando:
- La idea de descentralizar la decisión hacia quien está en contacto con la situación real es
  anterior a BetaCodex — viene de **Mary Parker Follett** (principios del siglo XX): la "ley de
  la situación" (la autoridad la da la situación concreta, no el cargo) y la distinción entre
  poder-con y poder-sobre. BetaCodex la reconoce como uno de sus fundamentos históricos.
- El enfoque de Metas Relativas que usa este sistema desciende directamente de **Beyond
  Budgeting** (Jeremy Hope y Robin Fraser, Beyond Budgeting Round Table), que BetaCodex adoptó
  y formalizó bajo el nombre "Relative Targets".

Adaptant está construyendo en paralelo, en el proyecto Organizational Commons, un corpus
estandarizado de pensamiento organizacional (`OC-CORPUS-PENSAMIENTO-ORGANIZACIONAL.md`) que
cubre exactamente estos cuatro pilares — Follett, descentralización/BetaCodex, diseño celular y
metas relativas — con una ficha por concepto y fuente siempre citable. Este sistema de Elevate
es una aplicación concreta de esos mismos pilares; si ese corpus está maduro para cuando Code
arranque el build, vale la pena pasárselo también como contexto adicional.

Puntos del corpus que se traducen directo en reglas de este sistema:

- **El Cost/Income Ratio es, específicamente, el indicador que BetaCodex recomienda como única
  liga para la periferia** — no un ratio elegido por conveniencia local de Elevate. La razón que
  da el propio corpus: a diferencia del margen (que habla de la rentabilidad global de la
  empresa), el C/I orienta la atención de cada célula hacia su propia eficacia y eficiencia
  operativa, sin techo de "ya alcanza con esto".
- **Las células de periferia deben generar margen; las de centro deben alcanzar equilibrio, sin
  margen propio** — es exactamente la regla que ya fijamos para el reparto de costo de centro.
  Que el centro no pueda tener ganancia no es un detalle contable: es lo que sostiene que el
  poder de decisión siga en la periferia.
- **Ninguna célula tiene presupuesto ni le imputan costos de forma centralizada** — cada célula
  paga por lo que consume, incluidos los servicios del centro. Es la base conceptual de haber
  modelado "servicios de terceros" y "costo de centro asignado" como cargos que origina la
  propia operación de la célula, no como una asignación contable que baja desde arriba.
- **No hay evaluación de desempeño individual.** El corpus es explícito en que la unidad de
  medida es el equipo, nunca la persona. Es la razón por la que este sistema no calcula ni
  expone ningún indicador de rendimiento a nivel de Integrante: los Integrantes existen para
  costear a la célula, no para ser medidos ellos mismos.
- **La contabilidad de cada célula distingue tres tipos de aporte, no un genérico "costos"**: lo
  que la propia célula aporta, lo que recibe de otras células de la red (el costo de centro
  asignado), y lo que aporta un tercero externo (servicios de terceros). La sección de cálculo
  de este documento ya sigue esa misma distinción de tres partes — vale la pena que Code la
  respete al nombrar las cosas en el código, en vez de fundir todo bajo un genérico "gastos".
- **La liga está para generar conversación entre células, no para premiar ni castigar.** El
  corpus advierte explícitamente contra usar estas tablas para juzgar o controlar — el objetivo
  es que una célula entienda su posición relativa y pida ayuda a las demás. Vale como principio
  de diseño para cualquier pantalla que muestre el ranking: mostrar posición y tendencia, no
  enmarcarlo como una evaluación de mérito.

## 3. Conceptos de negocio (decisiones ya tomadas — no reabrir sin motivo)

Estas reglas fueron discutidas explícitamente y son intencionales, no simplificaciones de
implementación:

- **Célula de periferia vs. célula de centro.** Una célula de periferia factura a clientes
  externos y tiene C/I propio. Una célula de centro no genera ingreso propio: su costo total se
  reparte **en partes iguales** entre todas las células de periferia activas ese mes, y se suma
  al costo de cada una. El centro no tiene C/I — queda excluido del ranking y del promedio.
- **Personas dedicadas y compartidas son la misma estructura.** No hay dos mecanismos
  distintos: toda persona tiene una o más asignaciones a células con un porcentaje de
  dedicación. Alguien 100% dedicado es, simplemente, una única asignación al 100%. Una persona
  puede repartirse entre cualquier combinación de células, sean de periferia o de centro.
- **El ingreso incluye la pauta gestionada.** Se decidió explícitamente que el ingreso de una
  célula es la factura completa al cliente, pauta de medios incluida, y que la pauta pagada a
  terceros (Meta, etc.) entra como un costo más, sin tratamiento especial. Esto significa que el
  C/I se mueve con el volumen de pauta que gestiona cada cliente, no solo con la eficiencia del
  equipo — es una consecuencia conocida y aceptada, no un defecto a corregir en esta versión.
  **Este C/I no es comparable con el de la planilla Excel previa**, que sí excluía la pauta del
  ingreso: miden cosas distintas a propósito.
- **La depreciación es un costo derivado, no una entrada suelta.** Se calcula como costo de
  reposición del equipo ÷ vida útil en meses. Pertenece siempre a una célula, nunca a una
  persona — el equipo es de la célula, no de quien lo usa en un momento dado.
- **Todo costo se registra mes a mes, explícitamente.** No existe un "valor vigente" que el
  sistema deba inferir buscando hacia atrás en el tiempo: cada mes tiene sus propias filas de
  sueldo, de porcentaje de asignación, de servicio de terceros y de base de depreciación. Para
  minimizar la carga manual, el sistema debe ofrecer una función de **"copiar mes anterior"**
  que duplique todas esas filas al mes nuevo como punto de partida editable.
- **Trimestre y año se calculan sumando meses reales, nunca multiplicando.** El trimestre suma
  los 3 meses correspondientes; el año móvil suma los últimos 12 meses reales. Esto es
  intencional: contempla aumentos de sueldo, cambios de tarifa de proveedores o ajustes de
  equipamiento que ocurren en un mes puntual, sin prorratear artificialmente.
- **Una factura puede repartirse entre varias células y varios meses a la vez**, en las
  proporciones que hagan falta — no son dos casos separados (reparto entre células / reparto
  entre meses), es un único mecanismo que cubre ambos y su combinación.
- **Facturas y notas de crédito son editables** después de cargadas. Una nota de crédito sigue
  el mismo flujo de carga y reparto que una factura, ligada a la factura que corrige.

## 4. Entidades

### 3.1 Célula
| Campo | Tipo | Notas |
|---|---|---|
| id | — | |
| nombre | texto | |
| tipo | enum: `periferia` \| `centro` | |
| país_mercado | texto | |
| activa | booleano | determina si participa del reparto de centro y de la liga ese mes |

### 3.2 Integrante
| Campo | Tipo | Notas |
|---|---|---|
| id | — | |
| nombre | texto | identidad estable; el costo mensual vive en otra tabla |

### 3.3 SueldoMensual
Sueldo u honorario total de un integrante en un mes puntual (antes de repartir entre células).

| Campo | Tipo | Notas |
|---|---|---|
| integrante_id | FK | |
| mes | año-mes | |
| monto | número | |

### 3.4 AsignaciónMensual
Cómo se reparte el sueldo de ese mes entre una o más células.

| Campo | Tipo | Notas |
|---|---|---|
| integrante_id | FK | |
| célula_id | FK | |
| mes | año-mes | |
| porcentaje | número (0–100) | |

**Validación:** para un mismo integrante y mes, la suma de `porcentaje` de todas sus
asignaciones debe ser 100. Costo imputado a la célula = `SueldoMensual.monto × porcentaje / 100`.

### 3.5 ServicioTercero
Costo de un proveedor externo que compra una célula puntual (incluye pauta de medios, sin
distinción de categoría).

| Campo | Tipo | Notas |
|---|---|---|
| célula_id | FK | |
| mes | año-mes | |
| proveedor_descripción | texto | |
| monto | número | |

### 3.6 Equipamiento
Pertenece a una célula. La cuota mensual es derivada, no se carga directamente.

| Campo | Tipo | Notas |
|---|---|---|
| célula_id | FK | |
| descripción | texto | ej. "notebooks", "kit de cámara" |

### 3.7 EquipamientoCostoMensual
Base de cálculo de la depreciación, versionada mes a mes (puede cambiar por regulación local,
renegociación de proveedor, etc.).

| Campo | Tipo | Notas |
|---|---|---|
| equipamiento_id | FK | |
| mes | año-mes | |
| costo_reposición | número | |
| vida_útil_meses | número entero | |

Cuota mensual = `costo_reposición / vida_útil_meses`.

### 3.8 Factura
| Campo | Tipo | Notas |
|---|---|---|
| id | — | |
| tipo | enum: `factura` \| `nota_crédito` | |
| factura_relacionada_id | FK (nullable) | obligatorio si `tipo = nota_crédito` |
| cliente | texto | opcional |
| fecha_emisión | fecha | |
| monto_total | número | |

### 3.9 AsignaciónDeFactura
| Campo | Tipo | Notas |
|---|---|---|
| factura_id | FK | |
| célula_id | FK | |
| mes | año-mes | |
| monto | número | |

**Validación:** la suma de `monto` de todas las `AsignaciónDeFactura` de una `Factura` debe ser
igual a `Factura.monto_total` (con signo negativo para notas de crédito).

## 5. Cálculo, por célula y por mes

```
Costo_directo(célula, mes) =
    SUM( SueldoMensual × AsignaciónMensual.porcentaje/100 )   -- integrantes asignados ese mes
  + SUM( ServicioTercero.monto )                              -- ese mes, esa célula
  + SUM( EquipamientoCostoMensual.costo_reposición / vida_útil_meses )  -- equipos de esa célula

Costo_centro_asignado(célula_periferia, mes) =
    SUM( Costo_directo(célula_centro, mes) para toda célula_centro )
  / COUNT( células de periferia activas ese mes )

Costo_total(célula, mes) =
    Costo_directo(célula, mes)
  + [ Costo_centro_asignado(célula, mes)  si célula.tipo = periferia, si no 0 ]

Ingreso(célula, mes) =
    SUM( AsignaciónDeFactura.monto )   -- solo si célula.tipo = periferia; centro = N/A

C/I(célula, mes) = Costo_total / Ingreso     -- solo periferia
```

Para **trimestre** y **año móvil**: sumar `Costo_total` e `Ingreso` de los meses reales del
período (3 o 12), y recién ahí dividir. No promediar ratios mensuales ni multiplicar un mes por
3 o 12.

**Ranking:** dentro de cada período, ordenar las células de periferia por C/I ascendente (menor
= mejor). Centro queda fuera del ranking y del promedio del grupo.

**Variación vs. período anterior:** C/I del período actual − C/I del mismo tipo de período
inmediatamente anterior (mes anterior / trimestre anterior / ventana de 12 meses previa).

**Desvío vs. promedio:** C/I de la célula − promedio de C/I de todas las células de periferia en
ese mismo período.

## 6. Funcionalidad esperada

- **Alta y edición de Células** (nombre, tipo, país/mercado, activa/inactiva).
- **Alta y edición de Integrantes**, con su sueldo y asignaciones por mes.
- **Pantalla mensual de costos** — al abrir un mes nuevo, opción de **copiar todos los
  registros del mes anterior** (sueldos, asignaciones, servicios de terceros, base de
  equipamiento) como punto de partida editable, en vez de cargar todo de cero.
- **Alta de Facturas**, con su reparto entre una o varias células y uno o varios meses en
  las proporciones que se necesiten, validando que el reparto sume el monto total.
- **Alta de Notas de crédito**, ligadas a una factura, con el mismo mecanismo de reparto
  (puede repartirse distinto de como se repartió la factura original).
- **Vista de Liga** — tres vistas (mes / trimestre / año móvil), cada una mostrando por célula
  de periferia: ingreso, costo total desglosado por componente, C/I, ranking, variación vs.
  período anterior, desvío vs. promedio del grupo.
- **Vista de Centro** — costo total de cada célula centro por período, y cómo se repartió entre
  las células de periferia ese período, para trazabilidad.

## 7. Supuestos abiertos (a confirmar antes o durante el build)

Estos puntos no se discutieron explícitamente y quedaron resueltos por default razonable — vale
la pena confirmarlos con Ernesto antes de que Code los fije en el código:

- Si hay más de una célula tipo centro, se asume que sus costos se **suman** y se reparten
  juntos entre la periferia (no cada centro reparte por separado).
- Una célula de periferia marcada como `activa = false` en un mes no participa ni del reparto
  de costo de centro ni del ranking ese mes.
- No se discutieron usuarios, permisos ni autenticación — se asume una versión de uso interno,
  sin control de acceso multiusuario para esta primera versión.
- Todos los montos en USD, sin conversión de moneda.
- No hay categorización de tipo de servicio de terceros (la pauta de medios no se etiqueta
  aparte) — si más adelante se quiere reportar "cuánta pauta gestiona cada célula", el dato está
  disponible consultando `ServicioTercero` directamente, pero no hay un campo dedicado para eso
  en esta versión.
