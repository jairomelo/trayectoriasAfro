# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Frontend (`mstdb_theme`)

#### Network Visualization

- Relationship filter: Added a toolbar row above the network graph with four toggle buttons: Parentesco (fam), Asociación (aso), Temporal (tmp), Subordinación (sub). Each button uses the corresponding edge color.
- Sex/gender distinction — A Sexo toggle button in the same toolbar. When activated, node shapes change:
  - Diamond → Mujer (m)
  - Rounded rectangle → Varón (v)
  - Ellipse (default) → Desconocido (i)

---

## [1.1.1] - 2026-04-19

### Backend (`mstdb_manager`)

#### Network API
- Fixed edge directionality for `sub` relations: `persona_sujeto` is now always the edge source, ensuring the arrow points from enslaver to enslaved
- Added `select_related('persona_sujeto')` to the network queryset for both PE and PNE viewsets to avoid N+1 queries

### Frontend (`mstdb_theme`)

#### Network Visualization
- Ego node ("Persona actual") now uses a distinct steel blue (`#3B6D8C`) color on both PE and PNE pages, instead of blending with the type color
- Moved the ego selector after the type selector in the Cytoscape stylesheet so it always takes priority regardless of persona type

#### Export
- Added PNG export button to the network card header (uses Cytoscape's native `cy.png()` at 2× scale)
- Added PNG export button to the map card header (uses `html2canvas` at 2× scale)
- Files download as `red_{nombre}.png` / `mapa_{nombre}.png`
- New dependency: `html2canvas ^1.4.1`

---

## [1.1.0] - 2026-04-17

### Backend (`mstdb_manager`)

#### Relations — Subordinación (ISAAR CPF 5.3.2)
- Added `'sub'` (Subordinación) to `PersonaRelaciones.RELACIONES` choices, completing the ISAAR CPF 5.3.2 vocabulary (`fam`, `aso`, `tmp`, `sub`)
- Added `persona_sujeto` FK on `PersonaRelaciones` to capture directionality (who controls whom); nullable, enforced by form validation only for `sub` type
- Migration `0007_add_subordinacion_relacion` applied; historical records table updated automatically via `django-simple-history`
- `PersonaRelacionesForm`: added `persona_sujeto` Select2 autocomplete field; `clean()` raises a validation error when `naturaleza_relacion='sub'` and `persona_sujeto` is empty
- Create/edit form shows `persona_sujeto` field conditionally (hidden unless relation type is "Subordinación"), via inline JS
- Document detail view: persona cards display "subordinado/a de [nombre]" for `sub` relations
- Enslaved and non-enslaved persona detail pages: same directional label for related persons
- API v2: `PersonaRelacionesNestedSerializer` and `PersonaRelacionesDetailSerializer` expose `persona_sujeto` as a nested `PersonaReferenceSerializer`
- Deposit export (`export_deposit.py`): added `persona_sujeto_idno` column to `relaciones_personas.csv`
- New `dbgestor/utils.py` with `derive_subordination_rels(documento_id)` and `revert_subordination_rels(documento_id)` helpers
  - Derives `sub` relations for all `PersonaNoEsclavizada × PersonaEsclavizada` pairs linked to a document via `Persona.documentos` M2M; idempotent
  - Reverts only auto-derived relations (those with `descripcion_relacion IS NULL`); manually created relations are unaffected
- New management command `derive_subordination_rels`: processes all documents or a single `--documento_id`; reports per-document and total counts
- New `DeriveRelacionesView` and `RevertRelacionesView` (POST-only, permission-checked JSON endpoints) at `documento/<pk>/derive-relations/` and `documento/<pk>/revert-relations/`
- Document detail page: "Derivar relaciones" and "Revertir" buttons (gated by `add_personarelaciones` / `delete_personarelaciones`); page auto-reloads when changes are made; ℹ️ button opens an explanatory modal

#### Search & Filtering
- Added `estado_civil` filter (labeled "Estado matrimonial") for both `PersonaEsclavizada` and `PersonaNoEsclavizada`
- Added `tipo_documental` faceted filter for both persona types
- Added `archivo` faceted filter for both persona types
- Added document date range filter (`fecha_documento__gte` / `fecha_documento__lte`) for both persona types
- Added individual free-text filters for `altura`, `cabello`, `ojos`, `marcas_corporales`, `conducta`, and `salud` (PE only) — filters combine with AND logic
- Added `procedencia` filter for `PersonaEsclavizada`
- Added `trayectoria_lugar` multi-value lugar filter for both persona types

#### Sorting
- Extended server-side ordering to cover all browsable columns
- Direct-field sorts: `marcas_corporales`, `conducta`, `salud` (PE); `procedencia` via FK traversal (`procedencia__nombre_lugar`)
- Annotation-based sorts using `Subquery` (first M2M value): `etnonimos`, `calidades`, `hispanizacion`, `estado_civil` (PE); `calidades`, `estado_civil`, `ocupaciones` (PNE)
- Annotation-based sorts using `Exists`: `has_relaciones`, `has_lugares` (PE + PNE)
- `Count`-based sort for `documento_list` (PE + PNE)
- Date-diff sort for `documented_span` (PE)
- Annotations are applied conditionally — only when the user requests the relevant ordering field
- Replaced `_validate_ordering` with `_resolve_ordering`, which returns both the ordering expression and any required annotation dict; `ORDERING_ANNOTATIONS` and `ORDERING_FIELD_MAP` class-level configs drive the resolution

#### API
- Added `estado_civil` and physical description fields (`altura`, `cabello`, `ojos`, `marcas_corporales`, `conducta`, `salud`) to `PersonaEsclavizadaListSerializer`
- Added `estado_civil` to `PersonaNoEsclavizadaListSerializer`
- Added `procedencia` as named lugar string to `PersonaEsclavizadaListSerializer`
- Expanded `_collect_facets` to generate `estados_civiles` and `tipos_documentales` buckets

---

### Frontend (`mstdb_theme`)

#### Browse Filters
- Reorganized filter sidebar into collapsible groups with scroll: *Categorías socioétnicas*, *Trayectorias*, *Biografía*, *Documento*
- Each group shows a badge with the count of active filters
- All groups collapsed by default; Nombre search remains always visible above groups

#### Columns & Sorting
- Added `estado_civil` column ("Estado matrimonial") to both persona type tables
- Added physical description columns to PE table (hidden by default): `altura`, `cabello`, `ojos`, `marcas_corporales`, `conducta`, `salud`
- All previously non-sortable columns now have sort controls: `etnonimos`, `hispanizacion`, `calidades`, `procedencia`, `estado_civil`, `has_relaciones`, `has_lugares`, `documento_list`, `documented_span`, `marcas_corporales`, `conducta`, `salud` (PE); `ocupaciones`, `calidades`, `estado_civil`, `has_relaciones`, `has_lugares`, `documento_list` (PNE)

#### Views
- Added *Mapa de trayectorias* view to `PersonaEsclavizada` search results, visualizing geographic trajectories for the current result set
- **Map view now respects active search query and all filters** — trajectories are scoped to the current filtered result set (full-text `q`, form filters, sidebar facets)

#### Cross-tabulation (Tabla cruzada)
- New pivot-table view available for `PersonaEsclavizada` and `PersonaNoEsclavizada` tabs
- Configurable row dimension, column dimension, time interval, and cell operation via a control panel
- Available dimensions: Periodo de tiempo, Sexo, Etnónimo (PE), Calidad, Agencia/Adaptación (PE), Procedencia (PE), Lugar (trayectoria), Estado matrimonial, Honorífico (PNE), Tipo documental, Ocupación (PNE)
- Cell operations: Recuento de personas, Edad promedio (PE only, years only via `unidad_temporal_edad`), % del total
- Time-period dimension supports 25, 50, and 100-year intervals
- **Scoped to active search**: crosstab aggregates over the same filtered subset as the list/table/map views (query + all form filters)
- Sortable columns: click any column header to sort ascending/descending; sort indicator icons and `aria-sort` attributes
- CSV export via `export_format=csv` parameter (blob download, no cross-origin issues)
- M2M dimensions (Etnónimo, Calidad, etc.) display a warning banner noting that totals may exceed unique person counts
- Accessible: `<caption>`, `scope` attributes on all header cells, `<tfoot>` totals row
- Backend: `mstdb_manager/api/v2/crosstab.py` — `CrosstabView` and `CrosstabSchemaView` at `/api/v2/crosstab/` and `/api/v2/crosstab/schema/`
- Frontend: `mstdb_theme/src/conf/crosstab.js` dimension registry, `CrosstabView.svelte` component, store additions (`crosstabConfig`, `fetchCrosstab`, `setCrosstabConfig`)

#### Accessibility

- Set `lang="es"` on the root `<html>` element (WCAG 3.1.1).
- Added skip-to-main-content link as the first focusable element on every page (WCAG 2.4.1).
- Added unique, descriptive `<title>` to all routes, including dynamic titles for detail pages (WCAG 2.4.2).
- Added visible focus indicator (`:focus-visible`) to all interactive elements; removed `outline: none` from login inputs (WCAG 2.4.7).
- Added `aria-current="page"` to active navigation links (WCAG 4.1.2).
- Replaced anchor-as-button pattern with semantic `<button>` for the "Acerca de" navbar dropdown trigger (WCAG 4.1.2).
- Added accessible names to all icon-only buttons: search submit, clear, and all pagination controls in the Search view (WCAG 4.1.2).
- Added visually-hidden labels and linked error messages (`aria-describedby`) to all login form fields; added `autocomplete` attributes (WCAG 1.3.5, 3.3.1, 3.3.2).
- Added focus trap (`focusTrap` Svelte action) to SlideOver and ConfirmDelete modals; focus returns to the trigger element on close (WCAG 2.1.2).
- Added `Space` key support alongside `Enter` for keyboard-activated entity section cards (WCAG 2.1.1).
- Added `aria-invalid` and `aria-describedby` to `FlexDateInput` (WCAG 4.1.2).
- Fixed footer link and heading contrast: `#e8d5c4` on `#2c2c2c` (~8:1) replacing `#8e3b23` (~1.86:1) (WCAG 1.4.3).
- Fixed inactive Browse tab label contrast: `#595959` on white (~7.1:1) replacing `#999` (~2.84:1) (WCAG 1.4.3).
- Fixed `btn-outline-secondary` color: `#4d6578` on `#f8f5f2` (~5.7:1) replacing `#5f7a8c` (~4.15:1) (WCAG 1.4.3).
- Added `prefers-reduced-motion` support: disables hero zoom animation, scroll-button bounce, and AOS transitions (WCAG 2.3.3).
- Added `aria-hidden="true"` to all decorative Bootstrap icons across landing, login, and search views (WCAG 1.1.1).
- Added `/Accessibility` route with a Declaration of Accessibility covering conformance status, measures adopted, known limitations, and feedback channel.
- Added GitHub issue template (`accessibility-issue.md`) for structured accessibility barrier reports.
- Added automated WCAG 2.1 AA regression tests with `@axe-core/playwright` covering six main routes (WCAG conformance verification).

---

## [1.0.0] - 2026-03-05

### Backend (`mstdb_manager`)

#### Search
- Replaced Elasticsearch with native PostgreSQL full-text search (GIN indexes + `search_vector` fields on `Lugar`, `Documento`, `Persona`, `Corporacion`)
- Unified global search API with faceted filtering, exact phrase matching, pagination, and entity-type counts

#### API
- New V2 API with authentication and logging endpoints
- Integrated `drf-spectacular` for OpenAPI documentation; deprecated V1 docs removed
- New detail serializers with nested prefetch for `Lugar`, `Persona`, `Documento`, and `Corporacion`
- Added `calidades`, `ocupaciones`, and event fields to enslaved/non-enslaved persona and documento endpoints

#### Infrastructure & Security
- Migrated database backend from MySQL to PostgreSQL
- Dockerized with multi-stage build and `gunicorn` entrypoint
- Whitenoise for static file serving
- Hardened CSRF/session cookie settings via environment variables

---

### Frontend (`mstdb_theme`)

#### Search & Browse
- Unified search store replacing legacy `BrowseView`/`FacetSidebar` components
- Entity-type tabs, control bar, and advanced filter panel with searchable selects
- Column configuration modal per entity type

#### Detail Views
- Revamped persona detail pages (enslaved and non-enslaved): marital status, relations network, trajectory map
- Paginated related personas in documento and lugar detail views

#### New Pages & Visualizations
- Visualization pages: *Mapa de trayectorias*, *Personas por lugar*, *Red de personas*
- New *Archivos* page
- *Memorias Afromexicanas* showcase card

#### UI Polish
- Hero sections with background images across About, Archivos, and Search pages
- Quick-browse row for entity exploration
- Navigation reorganized; dropdown alignment fixes
