# Diccionario de Metadatos

Este diccionario documenta todos los conjuntos de datos del depósito de datos del proyecto *La circulación de afrodescendientes esclavizados y libres en la Nueva España*. Cada sección contiene una descripción del propósito de la tabla y la documentación detallada de cada campo, con el tipo de dato esperado y una descripción.

---

## Convenciones

### Identificadores estables

Los registros de personas, documentos y corporaciones usan identificadores estables en formato `mx-sv-per-XXXXXX`, `mx-sv-doc-XXXXXX` y `mx-sv-cor-XXXXXX` respectivamente. Los lugares usan un identificador numérico (`lugar_id`). Estos identificadores son las claves de unión entre tablas.

### Convenciones de fechas {#convenciones-de-fechas}

Varios campos de fecha tienen un campo `*_raw` y un campo `*_factual` acompañantes.

| Campo | Descripción |
| :---- | :---- |
| `fecha_*` | Fecha en formato ISO 8601 (`YYYY-MM-DD`). Puede estar vacía. |
| `fecha_*_raw` | Texto literal de la fecha tal como aparece en el documento fuente. |
| `fecha_*_factual` | `True` \= fecha documentada directamente en la fuente. `False` o vacío \= fecha estimada o inferida. |

### Campos de valores múltiples (M2M)

Los campos que pueden contener más de un valor (calidades, etnónimos, ocupaciones, etc.) se representan como texto delimitado por `|` (pleca) dentro de la misma celda. Para unir con las tablas de vocabulario controlado, separar por `|` y buscar en el archivo `cv_*.csv` correspondiente.

---

## Personas Esclavizadas — `personas_esclavizadas.csv`

Cada fila representa a una persona esclavizada registrada en la base de datos. Una misma persona puede aparecer en múltiples documentos; en ese caso el campo `documentos` lista todos los identificadores de documentos en los que es mencionada.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `persona_idno` | Texto | Identificador estable de la persona (`mx-sv-per-XXXXXX`). Clave primaria del depósito. |
| `nombres` | Texto | Primer nombre o nombres de la persona, sin honoríficos, normalizados. |
| `apellidos` | Texto | Apellido o apellidos de la persona, normalizados. Puede estar vacío. |
| `nombre_normalizado` | Texto | Nombre completo normalizado (nombres \+ apellidos). |
| `sexo` | Texto | Sexo registrado en el documento. Valores: `v` (Varón), `m` (Mujer), `i` (Desconocido). |
| `edad` | Numérico entero | Edad de la persona en el momento del evento. |
| `unidad_temporal_edad` | Texto | Unidad de la edad registrada. Valores: `d` (días), `m` (meses), `a` (años). |
| `altura` | Texto | Descripción de la altura de la persona tal como figura en el documento. |
| `cabello` | Texto | Descripción del cabello de la persona tal como figura en el documento. |
| `ojos` | Texto | Descripción de los ojos de la persona tal como figura en el documento. |
| `calidades` | Texto (valores `|`\-delimitados) | Adscripción o adscripciones de calidad socioétnica de la persona. Ver `cv_calidades.csv`. |
| `agencia/adaptacion` | Texto (valores `|`\-delimitados) | Nivel o niveles de agencia o adaptación registrados. Ver `cv_agencia_adaptacion.csv`. |
| `etnonimos` | Texto (valores `|`\-delimitados) | Etnónimo o etnónimos asociados a la persona. Ver `cv_etnonimos.csv`. |
| `procedencia_lugar_id` | Numérico entero | Identificador del lugar de procedencia africana o de otro origen previo. Referencia a `lugar_id` en `lugares.csv`. |
| `procedencia_adicional` | Texto | Información adicional de procedencia no capturada por el lugar (p. ej., nombre de barco o establecimiento). |
| `marcas_corporales` | Texto | Descripción de marcas corporales, carimbos, cicatrices rituales u otras señas físicas. |
| `conducta` | Texto | Informes de la conducta de la persona esclavizada indicados en el documento |
| `salud` | Texto | Condición de salud temporal o permanente de la persona esclavizada al momento del evento. Puede incluir condición de embarazo. |
| `ocupaciones` | Texto (valores `|`\-delimitados) | Ocupación u ocupaciones de la persona. Ver `cv_ocupaciones.csv`. |
| `ocupacion_categoria` | Texto | Categoría de la ocupación (p. ej., servicio doméstico, artesanía, obraje). |
| `estado_matrimonial` | Texto (valores `|`\-delimitados) | Estado matrimonial de la persona. Ver `cv_estado_matrimonial.csv`. |
| `lugar_nacimiento_id` | Numérico entero | Identificador del lugar de nacimiento. Referencia a `lugar_id` en `lugares.csv`. |
| `fecha_nacimiento` | Fecha (ISO 8601\) | Fecha de nacimiento calculada. Ver [Convenciones de fechas](#convenciones-de-fechas). |
| `fecha_nacimiento_raw` | Texto | Texto literal de la fecha de nacimiento en el documento. |
| `fecha_nacimiento_factual` | Booleano | `True` si la fecha está documentada directamente en la fuente. |
| `lugar_defuncion_id` | Numérico entero | Identificador del lugar de defunción. Referencia a `lugar_id` en `lugares.csv`. |
| `fecha_defuncion` | Fecha (ISO 8601\) | Fecha de defunción calculada. |
| `fecha_defuncion_raw` | Texto | Texto literal de la fecha de defunción en el documento. |
| `fecha_defuncion_factual` | Booleano | `True` si la fecha está documentada directamente en la fuente. |
| `documentos` | Texto (valores `|`\-delimitados) | Identificadores de los documentos en los que aparece la persona. Referencia a `documento_idno` en `documentos.csv`. |
| `notas` | Texto | Notas adicionales o aclaratorias indicadas por el transcriptor del evento asociadas con la persona esclavizada. |

---

## Personas No Esclavizadas — `personas_no_esclavizadas.csv`

Cada fila representa a una persona no esclavizada asociada a uno o más eventos documentales. Incluye compradores, vendedores, testigos, notarios y otras personas mencionadas en los documentos.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `persona_idno` | Texto | Identificador estable de la persona (`mx-sv-per-XXXXXX`). clave primaria del depósito. |
| `nombres` | Texto | Primer nombre o nombres de la persona, sin honoríficos, normalizados. |
| `apellidos` | Texto | Apellido o apellidos de la persona, normalizados. |
| `nombre_normalizado` | Texto | Nombre completo normalizado. |
| `sexo` | Texto | Sexo registrado. Valores: `v` (Varón), `m` (Mujer), `i` (Desconocido). |
| `honorifico` | Texto | Honorífico asociado a la persona. Valores: `nan` (N/A), `don` (Don), `dna` (Doña), `doc` (Doctor), `fra` (Fray). |
| `calidades` | Texto (valores `|`\-delimitados) | Adscripción o adscripciones de calidad socioétnica. Ver `cv_calidades.csv`. |
| `ocupaciones` | Texto (valores `|`\-delimitados) | Ocupación u ocupaciones. Ver `cv_ocupaciones.csv`. |
| `ocupacion_categoria` | Texto | Categoría de la ocupación. |
| `estado_matrimonial` | Texto (valores `|`\-delimitados) | Estado matrimonial. Ver `cv_estado_matrimonial.csv`. |
| `entidad_asociada` | Texto | Corporación o institución con las que la persona está asociada. Referencia a `corporacion_idno` en `corporaciones.csv`. |
| `lugar_nacimiento_id` | Numérico entero | Referencia a `lugar_id` en `lugares.csv`. |
| `fecha_nacimiento` | Fecha (ISO 8601\) | Ver [Convenciones de fechas](#convenciones-de-fechas). |
| `fecha_nacimiento_raw` | Texto | Texto literal de la fecha de nacimiento en el documento. |
| `fecha_nacimiento_factual` | Booleano | `True` si la fecha está documentada directamente. |
| `lugar_defuncion_id` | Numérico entero | Referencia a `lugar_id` en `lugares.csv`. |
| `fecha_defuncion` | Fecha (ISO 8601\) |  |
| `fecha_defuncion_raw` | Texto | Texto literal de la fecha de defunción. |
| `fecha_defuncion_factual` | Booleano | `True` si la fecha está documentada directamente. |
| `documentos` | Texto (valores `|`\-delimitados) | Referencia a `documento_idno` en `documentos.csv`. |
| `notas` | Texto | Notas adicionales o aclaratorias indicadas por el transcriptor del evento asociadas con la persona no esclavizada. |

---

## Documentos — `documentos.csv`

Cada fila representa un documento notarial o eclesiástico. Los campos del archivo (repositorio físico) están incorporados directamente en esta tabla. Un documento puede estar asociado a múltiples personas y corporaciones; esas relaciones se encuentran en las tablas de roles de evento y trayectorias.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `documento_idno` | Texto | Identificador estable del documento (`mx-sv-doc-XXXXXX`). Clave primaria del depósito. |
| `archivo_idno` | Texto | Identificador del archivo que resguarda el documento. |
| `archivo_nombre` | Texto | Nombre completo del archivo. |
| `archivo_nombre_abreviado` | Texto | Sigla o acrónimo del archivo. |
| `archivo_ubicacion_lugar_id` | Numérico entero | Referencia al lugar donde se encuentra el archivo. Referencia a `lugar_id` en `lugares.csv`. |
| `fondo` | Texto | Fondo documental dentro del archivo. |
| `subfondo` | Texto | Subfondo documental, si aplica. |
| `serie` | Texto | Serie documental, si aplica. |
| `subserie` | Texto | Subserie documental, si aplica. |
| `tipo_udc` | Texto | Tipo de unidad documental compuesta. Valores: `exp` (Expediente), `caj` (Caja), `vol` (Volumen), `lib` (Libro), `leg` (Legajo). |
| `unidad_documental_compuesta` | Texto | Número o identificador de la unidad documental (volumen, caja, expediente). |
| `tipo_documento` | Texto | Tipo documental del documento (p. ej., carta de venta, testamento). Ver `cv_tipos_documentales.csv`. |
| `sigla_documento` | Texto | Sigla de ubicación del documento dentro de la unidad documental. |
| `titulo` | Texto | Título o descripción breve del documento. |
| `descripcion` | Texto | Resumen o descripción extendida del contenido del documento. |
| `deteriorado` | Booleano | `True` si el documento presenta deterioro físico que afecta su legibilidad. |
| `fecha_inicial` | Fecha (ISO 8601\) | Fecha inicial del documento. Ver [Convenciones de fechas](#convenciones-de-fechas). |
| `fecha_inicial_raw` | Texto | Texto literal de la fecha inicial en el documento. |
| `fecha_inicial_aproximada` | Booleano | `True` si la fecha inicial es aproximada. |
| `fecha_final` | Fecha (ISO 8601\) | Fecha final del documento (si cubre un rango). |
| `fecha_final_raw` | Texto | Texto literal de la fecha final. |
| `fecha_final_aproximada` | Booleano | `True` si la fecha final es aproximada. |
| `lugar_de_produccion_id` | Numérico entero | Lugar donde se produjo el documento. Referencia a `lugar_id` en `lugares.csv`. |
| `folio_inicial` | Texto | Folio inicial del documento en la unidad documental. |
| `folio_final` | Texto | Folio final del documento, si está disponible. |
| `evento_valor_sp` | Texto | Valor en pesos de la transacción registrada en el documento, si aplica. |
| `evento_forma_de_pago` | Texto |  |
| `evento_total` | Texto |  |
| `notas` | Texto | Notas adicionales o aclaratorias indicadas por el transcriptor del evento asociadas con el documento o evento. |

---

## Lugares — `lugares.csv`

Cada fila representa un lugar geográfico único mencionado en los documentos. La tabla funciona como un gazetteer controlado para el proyecto. Los lugares se organizan jerárquicamente: un pueblo puede ser parte de una provincia, que a su vez es parte de una gobernación.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `lugar_id` | Numérico entero | Identificador único del lugar. Clave primaria de la tabla. Usado como referencia externa en todas las demás tablas. |
| `nombre_lugar` | Texto | Nombre del lugar tal como se usa en la base de datos (forma normalizada). |
| `otros_nombres` | Texto | Variantes ortográficas o nombres alternativos del lugar, separados por saltos de línea. |
| `tipo` | Texto | Tipo de entidad geográfica. Ver `cv_tipos_lugar.csv`. |
| `es_parte_de_lugar_id` | Numérico entero | `lugar_id` de la entidad geográfica superior a la que pertenece este lugar (jerarquía geográfica). Vacío si es la entidad de mayor nivel. |
| `lat` | Numérico decimal | Latitud en grados decimales (WGS 84). Puede estar vacía. |
| `lon` | Numérico decimal | Longitud en grados decimales (WGS 84). Puede estar vacía. |

---

## Corporaciones — `corporaciones.csv`

Cada fila representa a una corporación o institución (iglesia, convento, obraje, compañía mercantil, etc.) asociada a eventos documentales. La categoría incluye tanto instituciones religiosas como civiles y comerciales.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `corporacion_idno` | Texto | Identificador estable de la corporación (`mx-sv-cor-XXXXXX`). Clave primaria del depósito. |
| `nombre_institucion` | Texto | Nombre de la institución o corporación. |
| `nombres_alternativos` | Texto | Variantes del nombre de la institución. |
| `tipo_institucion` | Texto | Tipo de institución. Ver `cv_tipos_institucion.csv`. |
| `lugar_corporacion_id` | Numérico entero | Lugar asociado a la corporación. Referencia a `lugar_id` en `lugares.csv`. |
| `personas_asociadas` | Texto (valores `|`\-delimitados) | Personas asociadas a la corporación. Referencia a `persona_idno` en `personas_esclavizadas.csv` o `personas_no_esclavizadas.csv`. |
| `documentos` | Texto (valores `|`\-delimitados) | Documentos en los que aparece la corporación. Referencia a `documento_idno` en `documentos.csv`. |
| `notas` | Texto |  |

---

## Trayectorias — `trayectorias.csv`

Cada fila representa un punto de trayectoria de una persona en un lugar específico, según consta en un documento. Esta tabla es la representación relacional de los itinerarios de personas esclavizadas y no esclavizadas. El campo `ordinal` permite reconstruir la secuencia del itinerario de cada persona. Una misma persona puede tener múltiples filas, ordenadas por `ordinal`. El campo `persona_x_lugares_id` permite identificar grupos de personas que comparten un mismo punto de trayectoria (p. ej., personas vendidas juntas).

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `persona_idno` | Texto | Identificador de la persona. Referencia a `personas_esclavizadas.csv` o `personas_no_esclavizadas.csv`. |
| `persona_x_lugares_id` | Numérico entero | Identificador interno del registro de trayectoria. Permite agrupar personas que comparten el mismo punto. |
| `documento_idno` | Texto | Documento en el que consta este punto de trayectoria. Referencia a `documentos.csv`. |
| `lugar_id` | Numérico entero | Lugar de la trayectoria. Referencia a `lugares.csv`. |
| `situacion_lugar` | Texto | Situación de la persona en relación con el lugar (p. ej., vecino, residente, estante). Ver `cv_situaciones_lugar.csv`. |
| `ordinal` | Numérico entero | Posición de este punto en la secuencia del itinerario de la persona. Los valores más bajos son anteriores en el tiempo. |
| `fecha_inicial_lugar` | Fecha (ISO 8601\) | Fecha inicial de la estancia en el lugar. Ver [Convenciones de fechas](#convenciones-de-fechas). |
| `fecha_inicial_lugar_raw` | Texto | Texto literal de la fecha inicial en el documento. |
| `fecha_inicial_lugar_factual` | Booleano | `True` si la fecha está documentada directamente. |
| `fecha_final_lugar` | Fecha (ISO 8601\) | Fecha final de la estancia en el lugar. |
| `fecha_final_lugar_raw` | Texto | Texto literal de la fecha final en el documento. |
| `fecha_final_lugar_factual` | Booleano | `True` si la fecha está documentada directamente. |
| `notas` | Texto |  |

---

## Relaciones entre Personas — `relaciones_personas.csv`

Cada fila representa un vínculo directo entre dos personas (P1 ↔ P2). La tabla está en formato largo/par: cuando un registro de relación original incluye N \> 2 personas, se generan C(N, 2\) filas, una por cada par único. El campo `persona_relacion_id` permite identificar pares que provienen del mismo registro original. Esta tabla es directamente utilizable como lista de aristas (edge list) para análisis de redes sin transformación previa.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `persona_idno_1` | Texto | Identificador de la primera persona del par. |
| `persona_idno_2` | Texto | Identificador de la segunda persona del par. |
| `persona_relacion_id` | Numérico entero | Identificador del registro de relación original. Permite agrupar pares que provienen del mismo evento relacional. |
| `documento_idno` | Texto | Documento en el que consta la relación. Referencia a `documentos.csv`. |
| `naturaleza_relacion` | Texto | Tipo de relación. Valores: `fam` (Familiar), `aso` (Asociativa), `tmp` (Temporal). |
| `descripcion_relacion` | Texto | Descripción libre de la relación tal como consta en el documento. |
| `fecha_inicial_relacion` | Fecha (ISO 8601\) | Ver [Convenciones de fechas](#convenciones-de-fechas). |
| `fecha_inicial_relacion_raw` | Texto | Texto literal de la fecha inicial en el documento. |
| `fecha_inicial_relacion_factual` | Booleano | `True` si la fecha está documentada directamente. |
| `fecha_final_relacion` | Fecha (ISO 8601\) | Fecha calculada del final de la relación entre las personas. |
| `fecha_final_relacion_raw` | Texto | Texto literal de la fecha final. |
| `fecha_final_relacion_factual` | Booleano | `True` si la fecha está documentada directamente. |
| `notas` | Texto |  |

---

## Roles de Evento — Personas — `roles_evento_personas.csv`

Cada fila representa el rol de una persona en un evento documental específico. Una misma persona puede tener diferentes roles en diferentes documentos (p. ej., comprador en un documento, testigo en otro).

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `persona_idno` | Texto | Identificador de la persona. |
| `documento_idno` | Texto | Documento en el que la persona tiene el rol. |
| `rol_evento` | Texto | Rol de la persona en el evento. Ver `cv_roles_evento.csv`. |

---

## Roles de Evento — Instituciones — `roles_evento_instituciones.csv`

Cada fila representa el rol de una corporación o institución en un evento documental.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `corporacion_idno` | Texto | Identificador de la corporación. |
| `documento_idno` | Texto | Documento en el que la corporación tiene el rol. |
| `rol_evento` | Texto | Rol de la corporación en el evento. Ver `cv_roles_evento.csv`. |

---

## Vocabularios Controlados

Las siguientes tablas contienen los valores permitidos para los campos con vocabulario controlado.

### Calidades — `cv_calidades.csv`

Adscripciones socioétnicas usadas en la documentación histórica para describir a las personas.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `calidad_id` | Numérico entero | Identificador único. |
| `calidad` | Texto | Término de calidad tal como aparece normalizado en la base de datos. |
| `descripcion` | Texto |  |

### Etnónimos — `cv_etnonimos.csv`

Adscripciones a regiones, puertos o etnias africanas, o etnónimos usados en la trata de personas esclavizadas.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `etnonimo_id` | Numérico entero | Identificador único. |
| `etnonimo` | Texto | Etnónimo tal como aparece normalizado. |
| `descripcion` | Texto |  |

### Agencia / Adaptación — `cv_agencia_adaptacion.csv`

Categorías de nivel de hispanización o aculturación de personas esclavizadas tal como aparecen en los documentos.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `agencia_id` | Numérico entero | Identificador único. |
| `agencia/adaptacion` | Texto | Término (p. ej., Bozal, Ladino, Criollo). |
| `descripcion` | Texto |  |

### Ocupaciones — `cv_ocupaciones.csv`

Vocabulario de ocupaciones.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `ocupacion_id` | Numérico entero | Identificador único. |
| `ocupacion` | Texto | Nombre de la ocupación. |
| `descripcion` | Texto |  |

### Estado Matrimonial — `cv_estado_matrimonial.csv`

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `estado_matrimonial` | Texto | Estado matrimonial (clave única). |
| `descripcion` | Texto |  |

### Tipos Documentales — `cv_tipos_documentales.csv`

Tipos de asunto o evento documental (p. ej., carta de venta, carta de libertad, testamento).

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `tipo_documental` | Texto | Nombre del tipo documental. |
| `descripcion` | Texto |  |

### Tipos de Lugar — `cv_tipos_lugar.csv`

Tipos de entidad geográfica usados en la tabla `lugares`. Deriva de los valores del modelo, no de una tabla de base de datos.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `tipo` | Texto | Código del tipo de lugar (p. ej., `ciudad`, `pueblo`, `provincia`). |
| `etiqueta` | Texto | Nombre legible del tipo. |

### Situaciones de Lugar — `cv_situaciones_lugar.csv`

Situaciones de una persona en relación con un lugar durante una trayectoria.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `situacion_id` | Numérico entero | Identificador único. |
| `situacion` | Texto | Término de situación (p. ej., vecino, residente, estante). |
| `descripcion` | Texto |  |

### Roles de Evento — `cv_roles_evento.csv`

Roles que personas e instituciones pueden tener en un evento documental.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `rol_evento` | Texto | Nombre del rol (p. ej., comprador, vendedor, testigo, notario). |
| `descripcion` | Texto |  |

### Tipos de Institución — `cv_tipos_institucion.csv`

Tipos de corporación o institución.

| Propiedad | Tipo esperado | Descripción |
| :---- | :---- | :---- |
| `tipo_id` | Numérico entero | Identificador único. |
| `tipo` | Texto | Nombre del tipo de institución. |
| `descripcion` | Texto |  |
