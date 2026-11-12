# Search label help tooltips

## Goal

On `/Search/`, every filter label in the sidebar and every column header in the results table shows a tooltip with a short, localized definition on hover and keyboard focus. Definitions are condensed from `deposit/2026-05-08/METADATA_DICTIONARY_ES.md` and `METADATA_DICTIONARY_EN.md`; fields that only exist in the UI (derived columns, counts) get authored definitions consistent with the dictionary.

## Decisions

- **Source of truth:** static Paraglide messages (`mstdb_theme/messages/es.json`, `en.json`). No backend, API, or `/Diccionario/` changes.
- **Coverage:** every labeled filter in `BrowseFilters.svelte` plus every column header in `EntityTable.svelte`, for all five entity tabs. Not in scope: filter group headings, `ColumnConfigModal`, `CrosstabView` selectors, card views.
- **Trigger:** the label text itself. Hover/focus shows a Bootstrap tooltip; labels get a dotted underline and `tabindex="0"` for keyboard access.
- **Ungrouped search filter:** add the currently missing visible label above the name/title search input so it can host the tooltip and be properly associated with the input.

## Non-goals

- No glossary/vocabulary page changes.
- No changes to `VariableDefinition`, `seed_variable_definitions`, or `/api/v2/data-dictionary/`.
- No refactor of the existing info-icon `Tooltip.svelte` component or the detail-page tooltips.
- No fix for the uninitialized `data-bs-toggle="tooltip"` in the Search hero (separate issue); do not copy that pattern.

## Tasks

### 1. Add `helpKey` to Search config

File: `mstdb_theme/src/conf/columns.js`

- Add a `helpKey` property to **every** entry in `columnsConfig` and **every** entry in `filtersDefinition`, using the mapping in the table below.
- Keep `labelKey` unchanged. Filter entries that share a label may share a `helpKey` only when the definition is identical (e.g. `sexo`, `calidades`, `altura`).
- Context-specific entries must use context-specific keys: the shared `conf_col_nombre` label maps to `help_nombre_persona`, `help_nombre_lugar`, `help_nombre_institucion`, or `help_titulo` depending on the entity; `conf_col_tipo` maps to `help_tipo_lugar`, `help_tipo_documental`, or `help_tipo_institucion`.
- The ungrouped `search` filters use `help_search_persona`, `help_search_documento`, `help_search_lugar`, `help_search_corporacion`.
- Both `fecha_documento__gte` and `fecha_documento__lte` use `help_year_range` (they render as one label). The `edad__gte`/`edad__lte` pair uses `help_edad` on the shared range label.
- Add `helpKey` to the `documento` `date` filters (`help_fecha_inicial`, `help_fecha_final`) even though `BrowseFilters` currently does not render `type: 'date'` (pre-existing gap, out of scope).
- Update the file header comment to document `helpKey`.

### 2. Add ES/EN help messages

Files: `mstdb_theme/messages/es.json`, `mstdb_theme/messages/en.json`

Add the keys below next to the existing `conf_*` block in both files. Keys must be identical in both locales and values must be natural-language strings (no JS expressions or ternaries).

| `helpKey` | ES | EN |
| --- | --- | --- |
| `help_short_id` | Identificador numérico interno del registro, usado en los enlaces de detalle. | Internal numeric record identifier used in detail links. |
| `help_persona_idno` | Identificador estable de la persona en el proyecto (formato mx-sv-per-NNNNNN). | Stable project identifier for the person (mx-sv-per-NNNNNN format). |
| `help_documento_idno` | Identificador estable del documento en el proyecto (formato mx-sv-doc-NNNNNN). | Stable project identifier for the document (mx-sv-doc-NNNNNN format). |
| `help_nombre_persona` | Nombre completo normalizado de la persona, usado para búsqueda y visualización. | Normalized full name of the person, used for search and display. |
| `help_search_persona` | Busca personas por su nombre normalizado. | Search people by their normalized name. |
| `help_sexo` | Sexo registrado en el documento: varón (v), mujer (m) o desconocido (i). | Sex recorded in the document: male (v), female (m), or unknown (i). |
| `help_edad` | Edad de la persona en el momento del evento; la unidad (días, meses o años) se muestra junto al valor. | Age of the person at the time of the event; the unit (days, months, or years) is shown with the value. |
| `help_etnonimos` | Etnónimo o etnónimos atribuidos a la persona (vocabulario controlado cv_etnonimos). | Ethnonym(s) attributed to the person (controlled vocabulary cv_etnonimos). |
| `help_hispanizacion` | Grado de agencia o adaptación cultural atribuido (p. ej., bozal, ladino, criollo). | Attributed degree of agency or cultural adaptation (e.g., bozal, ladino, criollo). |
| `help_calidades` | Calidad o calidades socioétnicas atribuidas en la documentación (vocabulario controlado cv_calidades). | Socioethnic classification(s) (calidad) attributed in the documentation (controlled vocabulary cv_calidades). |
| `help_relaciones` | Indica si la persona tiene relaciones documentadas con otras personas; el icono abre la red de relaciones. | Whether the person has documented relationships with other people; the icon opens the relationship network. |
| `help_trayectoria` | Indica si la persona tiene lugares de trayectoria documentados; el icono abre el mapa de lugares. | Whether the person has documented trajectory places; the icon opens the places map. |
| `help_procedencia` | Lugar de procedencia de la persona esclavizada antes de la venta, o el lugar de origen registrado. | Place of origin of the enslaved person before the sale, or the recorded place of origin. |
| `help_estado_civil` | Estado matrimonial registrado (vocabulario controlado cv_estado_matrimonial). | Recorded marital status (controlled vocabulary cv_estado_matrimonial). |
| `help_documentos` | Documentos en los que aparece el registro; cada icono enlaza al detalle del documento. | Documents in which the record appears; each icon links to the document detail. |
| `help_fecha_nacimiento` | Fecha de nacimiento calculada; puede ser aproximada (ver las variantes _raw y _factual en el depósito). | Computed birth date; may be approximate (see the _raw and _factual variants in the deposit). |
| `help_primer_registro` | Fecha documental más temprana conocida para la persona. | Earliest known documentary date for the person. |
| `help_ultimo_registro` | Fecha documental más reciente conocida para la persona. | Latest known documentary date for the person. |
| `help_periodo` | Años transcurridos entre el primer y el último registro documental de la persona. | Years elapsed between the person's first and last documentary record. |
| `help_altura` | Descripción de la altura tal como figura en el documento. | Height description as stated in the document. |
| `help_cabello` | Descripción del cabello tal como figura en el documento. | Hair description as stated in the document. |
| `help_ojos` | Descripción de los ojos tal como figura en el documento. | Eye description as stated in the document. |
| `help_marcas` | Marcas corporales, carimbos, cicatrices rituales u otras señas físicas descritas en el documento. | Body marks, brandings (carimbos), ritual scarifications, or other physical signs described in the document. |
| `help_conducta` | Informes sobre la conducta de la persona registrados en el documento (texto libre). | Reports on the person's conduct recorded in the document (free text). |
| `help_conducta_canonica` | Término normalizado de conducta vinculado al texto libre del documento. | Normalized conduct term linked to the document's free text. |
| `help_salud` | Condición de salud temporal o permanente al momento del evento; puede incluir embarazo o discapacidad. | Temporary or permanent health condition at the time of the event; may include pregnancy or disability. |
| `help_valor` | Valor de la transacción en pesos, tal como se registra en el documento. | Transaction value in pesos, as recorded in the document. |
| `help_forma_pago` | Forma de pago de la transacción (p. ej., pesos de oro común, mercaderías, servicios o crédito). | Transaction payment method (e.g., common gold pesos, goods, services, or credit). |
| `help_total` | Monto total de la transacción; se usa cuando el pago se hizo en cuotas o a crédito. | Total transaction amount; used when payment was made in installments or on credit. |
| `help_creado` | Fecha y hora de creación del registro en la base de datos. | Date and time the record was created in the database. |
| `help_actualizado` | Fecha y hora de la última actualización del registro. | Date and time the record was last updated. |
| `help_ocupaciones` | Ocupación u ocupaciones registradas (vocabulario controlado cv_ocupaciones). | Recorded occupation(s) (controlled vocabulary cv_ocupaciones). |
| `help_titulo` | Título o descripción breve del documento. | Title or brief description of the document. |
| `help_search_documento` | Busca documentos por su título. | Search documents by title. |
| `help_tipo_documental` | Tipo de asunto o evento documental (p. ej., carta de venta, carta de libertad, testamento). | Document type or event (e.g., bill of sale, freedom letter, will). |
| `help_archivo` | Archivo o repositorio físico que resguarda el documento. | Archive or physical repository that holds the document. |
| `help_fecha_inicial` | Fecha inicial del documento; puede ser aproximada. | Start date of the document; may be approximate. |
| `help_fecha_final` | Fecha final del documento cuando cubre un rango; puede ser aproximada. | End date of the document when it covers a range; may be approximate. |
| `help_year_range` | Rango de años del documento para filtrar los resultados. | Document year range used to filter results. |
| `help_personas_esclavizadas_count` | Número de personas esclavizadas mencionadas en el documento. | Number of enslaved persons mentioned in the document. |
| `help_personas_no_esclavizadas_count` | Número de personas no esclavizadas mencionadas en el documento. | Number of non-enslaved persons mentioned in the document. |
| `help_nombre_lugar` | Nombre normalizado del lugar tal como se usa en la base de datos. | Normalized place name as used in the database. |
| `help_search_lugar` | Busca lugares por su nombre. | Search places by name. |
| `help_tipo_lugar` | Tipo de entidad geográfica (ciudad, pueblo, provincia, etc.). | Type of geographic entity (city, town, province, etc.). |
| `help_otros_nombres` | Nombres alternativos o históricos del lugar. | Alternative or historical names of the place. |
| `help_persona_count` | Número de personas asociadas al lugar en la base de datos. | Number of people associated with the place in the database. |
| `help_lat` | Latitud en grados decimales (WGS 84). | Latitude in decimal degrees (WGS 84). |
| `help_lon` | Longitud en grados decimales (WGS 84). | Longitude in decimal degrees (WGS 84). |
| `help_nombre_institucion` | Nombre de la corporación o institución. | Name of the corporation or institution. |
| `help_search_corporacion` | Busca corporaciones e instituciones por su nombre. | Search corporations and institutions by name. |
| `help_tipo_institucion` | Tipo de institución (religiosa, civil, comercial, etc.). | Institution type (religious, civil, commercial, etc.). |
| `help_lugar_corporacion` | Lugar asociado a la corporación. | Place associated with the corporation. |
| `help_honorifico` | Honorífico registrado para la persona (Don, Doña, Doctor, Fray). | Honorific recorded for the person (Don, Doña, Doctor, Fray). |
| `help_filter_lugares_trayectoria` | Filtra personas con al menos un punto de trayectoria en los lugares seleccionados; puede elegir varios. | Filter people with at least one trajectory point in the selected places; multiple choices allowed. |

### 3. Render tooltips in `BrowseFilters.svelte`

File: `mstdb_theme/src/routes/(app)/Search/BrowseFilters.svelte`

- Import `tooltip` from `$lib/bootstrap-actions.js`.
- Extend `localizeFilter` to resolve `help: f.helpKey ? resolveLabel(f.helpKey) : ''`.
- Add a shared markup pattern for every visible filter label:
  - `<label class="form-label small mb-1 label-help" tabindex="0" use:tooltip={{ title: filter.help, placement: 'right' }}>`
  - Use it for grouped `text`, `number`, `searchable-select`, `id-searchable-select`, `select`, and the number-range `filter.rangeLabel` label.
- Ungrouped `text` filter (currently placeholder-only):
  - Render `<label for={filter.key}>` above the input with the same tooltip pattern.
  - Add `id={filter.key}` to the input; keep the existing placeholder.
- Year-range pair: attach the tooltip to the existing `m.conf_browse_date_range()` label using the `gte` filter's `help`.
- Do not add tooltips to radio option labels (`facet-option`) or group headers.
- Because `use:tooltip` receives `{ title: filter.help }`, locale/filter changes trigger the action's `update`.

### 4. Render tooltips in `EntityTable.svelte`

File: `mstdb_theme/src/routes/(app)/Search/EntityTable.svelte`

- Import `tooltip` from `$lib/bootstrap-actions.js`.
- In the `visibleColumns` reactive mapping, add `help: c.helpKey ? m[c.helpKey]() : ''`.
- On each `<th>` that has `help`:
  - add `tabindex="0"` and `use:tooltip={{ title: col.help, placement: 'bottom' }}`;
  - add `class:label-help` or a dedicated `th-help` class for the dotted underline;
  - add `on:keydown` so `Enter`/`Space` calls `handleSort(col)` for sortable columns (prevents the new tab stop from being a dead end);
  - add `aria-sort` (`ascending`/`descending`) when the column is the active sort field.
- Keep the existing click-to-sort behavior on the whole `<th>`.
- Ensure the sort icon and its `aria-hidden` behavior are unchanged.

### 5. Add styles

File: `mstdb_theme/src/styles/custom.css`

Add a small, shared rule near the existing label styles (no component-scoped styles):

- `.label-help { text-decoration: underline dotted; text-underline-offset: 0.2em; cursor: help; }`
- `.label-help:hover`, `.label-help:focus-visible { text-decoration-style: solid; }`
- `.label-help:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 2px; border-radius: 2px; }`
- Ensure `th.label-help` keeps the existing header color/contrast and does not inherit link styling.

### 6. Add a coverage guard test

File: `mstdb_theme/src/conf/columns.help.test.js`

- Import `columnsConfig`, `filtersDefinition` from `./columns.js` and both `../messages/es.json` / `../messages/en.json`.
- Assert every column and filter entry has a non-empty string `helpKey`.
- Assert every referenced `helpKey` exists with a non-empty value in both locales.
- Assert the set of `help_*` keys is identical in `es.json` and `en.json`.
- This test fails when a new column/filter is added without help copy, or when one locale is forgotten.

### 7. Update docs/changelog

- `CHANGELOG.md`: add an `[Unreleased]` → Frontend entry describing Search label tooltips (localized ES/EN, keyboard focus, dotted underline, source: deposit metadata dictionary).
- `docs/architecture.md`: add a short note under the Search section that Search field help text lives in the Paraglide `help_*` messages and is wired through `helpKey` in `src/conf/columns.js`; note the deliberate duplication vs. `VariableDefinition` / `/Diccionario/`.

## Mapping reference

Use this to assign `helpKey`:

- `personaesclavizada` columns: `short_id`→`help_short_id`, `persona_idno`→`help_persona_idno`, `nombre_normalizado`→`help_nombre_persona`, `sexo`→`help_sexo`, `edad`→`help_edad`, `etnonimos`→`help_etnonimos`, `hispanizacion`→`help_hispanizacion`, `calidades`→`help_calidades`, `has_relaciones`→`help_relaciones`, `has_lugares`→`help_trayectoria`, `procedencia`→`help_procedencia`, `estado_civil`→`help_estado_civil`, `documento_list`→`help_documentos`, `fecha_nacimiento`→`help_fecha_nacimiento`, `earliest_doc_date`→`help_primer_registro`, `latest_doc_date`→`help_ultimo_registro`, `documented_span`→`help_periodo`, `altura`→`help_altura`, `cabello`→`help_cabello`, `ojos`→`help_ojos`, `marcas_corporales`→`help_marcas`, `conducta`→`help_conducta`, `salud`→`help_salud`, `evento_valor_sp_list`→`help_valor`, `evento_forma_de_pago_list`→`help_forma_pago`, `evento_total_list`→`help_total`, `created_at`→`help_creado`, `updated_at`→`help_actualizado`.
- `personanoesclavizada` columns: same shared keys; `ocupaciones`→`help_ocupaciones`, `has_lugares`→`help_trayectoria`, and the rest as above; `updated_at`→`help_actualizado`.
- `documento` columns: `short_id`→`help_short_id`, `documento_idno`→`help_documento_idno`, `titulo`→`help_titulo`, `tipo_documento`→`help_tipo_documental`, `archivo`→`help_archivo`, `fecha_inicial`→`help_fecha_inicial`, `fecha_final`→`help_fecha_final`, `evento_valor_sp`→`help_valor`, `evento_forma_de_pago`→`help_forma_pago`, `evento_total`→`help_total`, counts→their `help_*_count` keys, `created_at`→`help_creado`.
- `lugar` columns: `short_id`, `nombre_lugar`→`help_nombre_lugar`, `tipo`→`help_tipo_lugar`, `otros_nombres`→`help_otros_nombres`, `persona_count`→`help_persona_count`, `lat`→`help_lat`, `lon`→`help_lon`.
- `corporacion` columns: `short_id`, `nombre_institucion`→`help_nombre_institucion`, `tipo_institucion`→`help_tipo_institucion`, `lugar_corporacion`→`help_lugar_corporacion`.
- `personaesclavizada` filters: `search`→`help_search_persona`, year pair→`help_year_range`, `procedencia`→`help_procedencia`, `trayectoria_lugar`→`help_filter_lugares_trayectoria`, `etnonimos__…`→`help_etnonimos`, `hispanizacion__…`→`help_hispanizacion`, `calidades__…`→`help_calidades`, `sexo`→`help_sexo`, `estado_civil`→`help_estado_civil`, edad pair→`help_edad`, `altura__…`→`help_altura`, `cabello__…`→`help_cabello`, `ojos__…`→`help_ojos`, `marcas_corporales__…`→`help_marcas`, `conducta__…`→`help_conducta`, `conducta_canonica`→`help_conducta_canonica`, `salud__…`→`help_salud`, `tipo_documental`→`help_tipo_documental`, `evento_valor_sp__…`→`help_valor`, `archivo`→`help_archivo`.
- `personanoesclavizada` filters: `search`→`help_search_persona`, year pair→`help_year_range`, `trayectoria_lugar`→`help_filter_lugares_trayectoria`, `ocupaciones__…`→`help_ocupaciones`, `calidades__…`→`help_calidades`, `sexo`→`help_sexo`, `honorifico`→`help_honorifico`, `estado_civil`→`help_estado_civil`, `tipo_documental`→`help_tipo_documental`, `archivo`→`help_archivo`.
- `documento` filters: `search`→`help_search_documento`, `tipo_documento__…`→`help_tipo_documental`, `evento_valor_sp__…`→`help_valor`, `fecha_inicial__gte`→`help_fecha_inicial`, `fecha_inicial__lte`→`help_fecha_final` (unrendered today).
- `lugar` filters: `search`→`help_search_lugar`, `tipo`→`help_tipo_lugar`.
- `corporacion` filters: `search`→`help_search_corporacion`, `tipo_institucion__…`→`help_tipo_institucion`, `lugar_corporacion__…`→`help_lugar_corporacion`.

## Accessibility requirements

- The trigger is focusable (`tabindex="0"`), not hover-only; focus must show the tooltip.
- The dotted underline must not be the only cue: keep the label text readable at AA contrast; the focus outline must be visible.
- Bootstrap tooltip hides on `Esc` and on blur; verify with keyboard.
- Sortable headers remain operable by keyboard after the change.
- Table header labels must not lose their sticky-header contrast.
- Run the project compliance checks where applicable; this change must not reduce WCAG 2.1 AA conformance.

## Validation

From `mstdb_theme/`:

1. `npm run build` — regenerates Paraglide messages and catches missing/invalid keys.
2. `npm run test:unit` — runs Vitest, including the new help coverage guard.
3. `npm run lint` — Prettier check.
4. `npm run check:i18n` — confirms `m` is imported wherever used.
5. Manual check in `npm run dev`: on `/Search/`, for each tab (personas esclavizadas/no esclavizadas, documentos, lugares, corporaciones):
   - hover and keyboard-focus each filter label and column header; tooltip appears with the right ES/EN text after switching language;
   - sorting by clicking and by `Enter`/`Space` still works;
   - the ungrouped name/title search now has a visible, associated label;
   - no tooltip renders for empty help text.

## Risks / notes

- **Copy drift:** these messages duplicate prose from `deposit/2026-05-08/METADATA_DICTIONARY_*.md` and partially from `VariableDefinition`. If the dictionary changes, update both message files. Documented as a deliberate Search-only choice.
- **Long tooltips:** Bootstrap's default tooltip max width is narrow; long definitions wrap. Keep copy to one sentence as provided; placement `right` in the sidebar and `bottom` in the table avoids clipping against the sticky header.
- **Extra tab stops:** each visible column header and filter label becomes one tab stop. This is the accessibility cost of the chosen label-trigger approach.
- **Locale switching:** definitions must update when the language toggle changes. Components already resolve labels reactively via `$:`; follow the same pattern for `help`.
- **Unrendered controls:** `documento` date filters (`type: 'date'`) are not handled by `BrowseFilters` today. They get help keys but no UI change; fixing that renderer is out of scope.
