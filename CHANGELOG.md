# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.3.1] - 2026-08-30

### Backend (`mstdb_manager`)

#### API & Data Model

- Fixed the Corporación detail API (`GET /api/v2/corporaciones/{id}/`): the serializer now exposes `notas`, `created_at`/`updated_at`, `tipo_institucion_id`, and nested `documentos`, `personas_asociadas` and `eventos` (institution event roles with document + archive data), and fixed the broken `tipo_institucion_nombre` source (`tipo_institucion.nombre` did not exist).
- Fixed `evento_ids` on the Corporación detail API to use the correct relation, so it no longer returns an empty list.
- Added a robust `persona_type` field (`esclavizada`/`noesclavizada`) to persona reference payloads so detail links no longer depend on environment-specific ContentType ids.
- Removed the `is_published=True` filter from the per-entity search endpoints (`documentos`, `personas-esclavizadas`, `personas-no-esclavizadas`, `corporaciones`). These entities have no publish workflow and all legacy records were `is_published=False`, making them invisible to search (e.g. "Convento de Santa María de Gracia de Guadalajara" returned no results). Lecciones keep their publish control.

#### Relation Types

- Restored the `Asociativa` (`aso`) person↔person relation type that was removed earlier (migration converted former `aso` rows to `Temporal`). Catalogers can again record associative relations (religious brotherhoods, cofradías, etc.); former rows are not auto-reverted and can be reclassified manually. Network endpoints now emit `aso` edges instead of collapsing them into `Temporal`.

#### Templates (old cataloging site)

- Fixed the documento detail place buckets: ordinal `0` now renders as "Lugar del evento/transacción" instead of being mislabeled as "Anteriores".
- Updated the persona↔lugar form help text to state the reserved-`0` ordinal convention explicitly.

### Frontend (`mstdb_theme`)

#### Cataloging

- Added a Corporación edit route (`/User/catalogar/corporacion/edit/[id]`) mirroring the Lugar edit flow: nombre, tipo de institución, nombres alternativos, lugar, documentos, personas asociadas and notas, with per-field validation errors.
- Added an "Editar" button on the Corporación detail page for staff and colectores.
- Restored the `Asociativa` relation type in the relation editor (form option, edge color, legend) and in the persona detail network filters/legends.

#### Detail Pages

- Fixed the "Invalid Date" on the public Corporación page: timestamps now come from the API and render with `formatDate`, the duplicate footer date block was removed, the banner icon alt text no longer says "Persona Esclavizada", and associated-persona links resolve via `persona_type`.
- Unified created/updated date rendering with `formatDate` on persona (esclavizada/no esclavizada) and documento detail pages.

#### Cataloging UX & Conventions

- Documented the reserved-ordinal convention in the trajectory editor: ordinal `0` is the event/transaction place (locked, orange); negative ordinals are places before the event, positive after.
- Added a short note on the Nuevo Lugar page clarifying that georeferencing happens on the website (create/edit lugar with coordinates and «Es parte de» hierarchy), not in the legacy spreadsheet.

---

## [1.3.0] - 2026-08-30

### Backend (`mstdb_manager`)

#### Educational Lessons

- Added role-based lesson access control: lesson owners and collaborators can manage granted access, while API responses expose per-user edit, delete, and ownership permissions.
- Added author and publication metadata to lessons, and published the existing lesson collection.
- Added PDF attachment uploads (`LeccionAdjunto`) for embedding PDFs in lesson content, mirroring the existing image upload flow.

#### API & Data Model

- Fixed Archivo updates to use the `ubicacion_archivo` field.

### Frontend (`mstdb_theme`)

#### Educational Lessons

- Reworked lesson authoring with reusable creation and edit forms, collaborator access management, and draft creation when images are uploaded before the first save.
- Added rich-text support for captioned images and embedded YouTube videos, PDFs, and iframes.
- Added a toolbar button to upload and embed PDF files directly in the lesson editor, reusing the existing embed rendering.
- Fixed blockquote formatting having no visible style in the lesson editor.
- Fixed embeds (YouTube, PDF, iframe) disappearing when reopening a saved lesson for editing (invalid ProseMirror parse rule dropped the node).
- Removed the duplicate image gallery shown below lesson content in the preview and public views.
- Added print-friendly lesson pages and PDF download.
- Improved keyboard focus and contextual tooltips across the lesson editor and other interactive controls.
- Added padding inside the rich-text editor so typed content does not sit against its border.

#### Search

- Reorganized PersonaEsclavizada/PersonaNoEsclavizada sidebar filters: the date range is now always visible below the search bar (no longer nested in a collapsible group), and the "Trayectorias" filter group is expanded by default.

---

## [1.2.0] - 2026-08-29

### Repository

#### Deposit & Data Packaging

- Added versioned deposit snapshot at `deposit/2026-05-08/` with data tables, controlled vocabularies, manifest, and bilingual metadata dictionaries.
- Added deposit reproducibility assets, including network analysis notebook/HTML output and combined report artifacts.
- Added top-level deposit documentation and metadata dictionary for dataset publication workflows.

#### Infrastructure & Configuration

- Added optional deposit environment variables in `.env.example` (`DATAVERSE_API`, `DATAVERSE_API_EXPIRATION_DATE`).
- Added Cloudflare Turnstile environment variables in `.env.example` (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`).
- Added Carto Basemaps API configuration in `.env.example` (`CARTO_API`).
- Fixed production backup volume mount path in `docker-compose.prod.yml` (`./backups:/app/backups`).
- Updated `.gitignore` rules for backup/deposit workflows and versioned deposit snapshots.

### Backend (`mstdb_manager`)

#### User Accounts & Authentication

- Added `POST /api/v2/register/` — open registration endpoint. Validates username uniqueness, email uniqueness, and password via Django's configured `AUTH_PASSWORD_VALIDATORS`. Creates an active user with no group membership; staff assigns roles separately.
- Added `POST /api/v2/whoami/change-password/` — authenticated password change. Verifies current password, calls `set_password`, and preserves the active session via `update_session_auth_hash`.
- Extended `PATCH /api/v2/whoami/` to accept and update User model fields (`username`, `first_name`, `last_name`, `email`) in addition to existing profile fields.
- Added `is_superuser` field to `GET /api/v2/whoami/` response.
- Added `GET /api/v2/config/` — unauthenticated endpoint returning public runtime configuration (`turnstile_site_key`).

#### Security

- Added `LoginRateThrottle` (10 req/min) and `RegisterRateThrottle` (5 req/min) custom throttle classes applied to login and registration endpoints respectively.
- Added global DRF throttle defaults: `anon` 60 req/min, `user` 300 req/min.
- Added Cloudflare Turnstile server-side verification (`_verify_turnstile`) to the registration endpoint using stdlib `urllib` (no new dependency). Dev bypass when `TURNSTILE_SECRET_KEY` is not set.
- Added `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` settings read from environment variables.
- Refactored `api_login` from a plain function to a DRF `@api_view`, enabling safe `request.data` parsing, throttle support, and a stripped response (removed email leakage).

#### Merging & Deduplication

- Added `SugerenciaMerge` model (migration `0012`) for tracking user-submitted merge suggestions with status (`pending`/`accepted`/`rejected`) and audit fields.
- Added `GET /api/v2/merge/candidates/` — fuzzy-search merge candidates via `rapidfuzz` `token_set_ratio` (≥ 50 score, top 30 results).
- Added `POST /api/v2/merge/execute/` — staff-only atomic entity merge. Re-points all foreign key and M2M relations from the duplicate to the canonical record across the full relational graph, then deletes the duplicate.
- Added `POST /api/v2/merge/suggest/` — any authenticated user can flag a potential duplicate; creates a `SugerenciaMerge` record for staff review.
- Added `rapidfuzz` to `pyproject.toml`.
- Added `SugerenciaMerge` to Django admin.

#### Educational Lessons

- Added `Leccion`, `LeccionImagen`, `LeccionNivel`, and `LeccionPalabraClave` models, migrations, and Django admin support.
- Added `/api/v2/lecciones/` CRUD endpoints with facets, image upload, and controlled vocabularies for lesson levels and keywords.

#### API & Data Model

- Extended `PersonaRelacionesViewSet` filter fields with `personas__persona_id` lookup required by the relaciones editor.
- Added `descripcion` field to relation payloads returned by persona detail APIs.
- Added latitude/longitude to `LugarReferenceSerializer` for richer location consumers.
- Extended `Lugar`/`HistoricalLugar` place type options with `hacienda`.
- Enhanced ordering in `LugarViewSet` and filter fields in `PersonaLugarRelViewSet`.
- Added aggregated event fields to PersonaEsclavizada API responses.
- Corrected Search year filtering to accept inclusive year ranges.
- Added `lugar_id` filtering to the places-people distribution endpoint.

#### Visualization API

- Added Redis-backed caching for visualization endpoints.
- Added a server-side Carto basemap tile proxy that keeps the API key private and caches immutable tiles.
- Extended travel trajectory responses with optional per-route timeline data, year counts, and date-range metadata.

#### Deposit & Export

- Added cutoff-date option support in deposit export commands.
- Added metadata-elements handling for deposit export, including field-map updates (e.g., `titulo`).

#### Operations

- Migrated dependency management from `requirements.txt` to `pyproject.toml` and `uv.lock`; updated the production image to use Gunicorn.
- Added backend media serving for user-uploaded files.

### Frontend (`mstdb_theme`)

#### Search

- Search filters, active tab, and query state now synchronize to the URL, allowing filtered results to be shared, bookmarked, and restored from a deep link.

#### User Accounts & Profile

- Added `/User/profile/+page.svelte` — full account page with: read/inline-edit toggle for account fields (username, first/last name, email); collapsible password change form with current-password verification; read/inline-edit toggle for profile fields (institution, URL, semblanza); group and staff/superuser badge display.
- Replaced `/User/profile/edit/` standalone form with a redirect to `/User/profile`; profile editing is now inline.
- Added registration form to `/User/login/` as a toggle alongside the existing login form, consistent with Django admin UX.
- Cloudflare Turnstile widget rendered in the registration form when `TURNSTILE_SITE_KEY` is configured; gracefully absent in dev when key is unset.
- Added `changePassword`, `register`, and `fetchPublicConfig` helpers to `api.js`.

#### Educational Lessons

- Added public lesson list and detail pages, including related-entity navigation.
- Added authenticated lesson capture, edit, delete, rich-text editing, and image upload workflows.

#### Relational Editing & Merging

- Added `/User/catalogar/relaciones/+page.svelte` — PersonaRelaciones (P×P) CRUD panel. Persona search → table of relations → SlideOver add/edit → ConfirmDelete, supporting `?persona_id=` preload from the PE form success flow.
- Added `/User/catalogar/merge/+page.svelte` — staff-only merge execution UI. Entity-type selector → debounced fuzzy search → candidate table with similarity bars → canonical/duplicate selection → confirmation step → `merge/execute/` POST.
- Added `SuggestMerge.svelte` component — modal button allowing any authenticated user to suggest a canonical/duplicate pair for staff review without destructive action.
- Wired `SuggestMerge` into detail pages for PersonaEsclavizada, PersonaNoEsclavizada, Lugar, Documento, and Corporacion.
- Added `relacionesByPersona`, `createPersonaRelacion`, `updatePersonaRelacion`, `deletePersonaRelacion`, `mergeCandidates`, `mergeExecute`, `mergeSuggest`, `updateLugarById`, `updatePersonaEscById` helpers to `api.js`.

#### Trajectory Editing

- Added trajectory editor with CRUD flows and improved add-point UX.
- Added document/persona-aware point creation, including support for foreign-key trajectory points.
- Added `Tooltip.svelte` component wrapping Bootstrap tooltip action for inline contextual hints.
- Wired `Tooltip` into the trayectoria Puntos panel header and the Red de Relaciones panel header.

#### Capture Forms

- PersonaEsclavizada success alert now includes quick-action links to the trayectoria editor and the relaciones editor pre-filtered by the newly created persona.
- Lugar detail page: "Editar lugar" button visible to collectors linking to the lugar edit route.

#### Network & UI

- Added edge tooltips in relations network visualizations.
- Added auth-aware user dashboard footer links based on edit permissions.
- Updated contributor bios and refreshed selected content/visibility settings in app views.

#### Dashboard & Visualization

- Replaced the Personas por Lugar dashboard chart with an interactive D3 visualization and corrected its Search deep links.
- Connected the Personas network dashboard to the live network API with date and cluster filters; fixed graph visibility and DOM-render timing.
- Reworked ArcsMap with compact filter controls, application-configured map tiles, adaptive route limits, accessible labels, and improved performance.
- Added temporal route animation, year-based start/end selectors, route details, and automatic timeline playback to ArcsMap.

---

## [1.2.0-rc.1] - 2026-04-20

### Backend (`mstdb_manager`)

#### Search API

- Added `GET /api/v2/search/network/` endpoint to build Cytoscape-ready networks from the current Search context.
- Network endpoint reuses Search filtering semantics (query, exact search mode, sidebar facets, and form-based filters) to keep parity with table/card/crosstab views.
- Added scope controls for network generation:
  - `scope_mode=strict`: only personas in the filtered Search result set.
  - `scope_mode=expanded`: strict set plus first-degree neighbors.
- Added network response metadata for client UX (`scope_mode`, `node_count`, `edge_count`, `result_count`, `truncated`).
- Added server-side graph size safeguards (node/edge caps) with truncation signaling.

### Frontend (`mstdb_theme`)

#### Network Visualization

- Relationship filter: Added a toolbar row above the network graph with four toggle buttons: Parentesco (fam), Asociación (aso), Temporal (tmp), Subordinación (sub). Each button uses the corresponding edge color.
- Sex/gender distinction — A Sexo toggle button in the same toolbar. When activated, node shapes change:
  - Diamond → Mujer (m)
  - Rounded rectangle → Varón (v)
  - Ellipse (default) → Desconocido (i)

#### Search

- Added a new **Red** view mode in Search for both `PersonaEsclavizada` and `PersonaNoEsclavizada` tabs.
- Search network view is now driven by backend-filtered graph data (no static dashboard network dependency).
- Added strict/expanded scope toggle in Search network controls.
- Added relation toggles (`fam`, `aso`, `tmp`, `sub`) and centrality threshold filtering in Search network.
- Added truncation warning and graph counters in Search network (`nodos`, `aristas`, `resultados base`).
- Added tooltip action button to open the corresponding individual detail page directly from a node.
- Added orphan-node visibility toggle in Search network controls.
- Fixed relation-toggle regression where re-enabling a relation filter did not restore the original graph shape.

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
