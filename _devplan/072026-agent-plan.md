# Plan: July 2026 Development Sprint

## TL;DR
Execute the full July 2026 dev plan (`072026-modifications.md`) across 4 phases designed for multi-agent, multi-session execution. Phase 0 (Python 3.13 migration) is a hard blocker — it touches every dependency and must merge to main before any other phase starts. Phases 1-3 (Lessons, Visualizations, Data Export) touch disjoint files/models and can be picked up by independent agents in parallel once Phase 0 lands.

---

## Phase 0 — Python 3.13 Migration (blocks Phases 1-3)

Structural/environment change. Must ship first — running feature work concurrently on a moving Python version risks dependency drift and wasted rework.

1. **Audit dependencies for cp313 wheel availability**
   - Check `mstdb_manager/requirements.txt` + `pyproject.toml`; flag/replace packages at risk: `django-nine`, `telepath`, `draftjs-exporter`, `MarkupPy`, `l18n`, `pillow-heif`, `django-modelcluster`, `django-treebeard`
   - No `distutils` usage found in first-party code (confirmed via search) — risk is limited to third-party wheels
   - → **commit:** `chore(deps): audit and pin dependencies for Python 3.13 compatibility`

2. **Bump Docker base images**
   - `mstdb_manager/Dockerfile`: both `development` and `production` stages, `python:3.11-slim` → `python:3.13-slim`
   - → **commit:** `chore(docker): bump base image to python:3.13-slim`

3. **Update project metadata and lockfile**
   - `pyproject.toml`: `requires-python = ">=3.13"`
   - Regenerate `uv.lock` via `uv lock --python 3.13`; rebuild `.venv` via `uv sync`
   - → **commit:** `chore(deps): migrate uv lockfile to Python 3.13`

4. **Fix breaking changes surfaced by the version bump**
   - Address any removed-stdlib / deprecation errors surfaced by `manage.py check` and app boot
   - → **commit:** `fix(backend): resolve Python 3.13 compatibility issues`

5. **Rebuild and smoke test**
   - `docker compose -f docker-compose.yml -f docker-compose.dev.yml build web`
   - `manage.py check`, `manage.py migrate --check`
   - Manual smoke test: `/api/v2/health/`, `/api/v2/counts/`, admin login, Search page, one ingestion form submission
   - No automated test suite exists today (`dbgestor/tests.py`, `cataloguers/tests.py`, `api/tests.py` are empty boilerplate) — verification is manual until a suite is proposed as a separate task

*Verify: Docker image builds clean on Python 3.13; full `docker compose up` stack healthy; manual smoke test of Search, admin, and ingestion forms passes.*

---

## Phase 1 — "Lecciones Educativas" section (parallel-safe with Phases 2-3, after Phase 0)

New, self-contained feature: new models, new API namespace, new frontend section. Does not touch existing models/routes.

### Backend

6. **Vocab models** (`mstdb_manager/dbgestor/models.py`)
   - `LeccionNivel` (`lesson_levels`: id + unique label + optional `descripcion`) and `LeccionPalabraClave` (`lesson_kw`: id + unique label + optional `descripcion`) — pattern: `Hispanizaciones`/`Etonimos`
   - → **commit:** `feat(models): add LeccionNivel and LeccionPalabraClave vocab models`

7. **`Leccion` model**
   - Fields: `title` (CharField), `body` (TextField, sanitized HTML), `levels` (M2M → `LeccionNivel`), `keywords` (M2M → `LeccionPalabraClave`), `personas` (M2M → `Persona`), `documentos` (M2M → `Documento`), `corporaciones` (M2M → `Corporacion`), `created_at`/`updated_at`
   - Default ordering by `title`; add DB index to support alphabetical + creation-time sort
   - `LeccionImagen` model: FK to `Leccion`, `imagen = ImageField(upload_to='lecciones/%Y/%m/')` for embedded images
   - Migration
   - → **commit:** `feat(models): add Leccion and LeccionImagen models`

8. **Serializers + ViewSet + URL registration**
   - `LeccionListSerializer` (title, levels, keywords, created_at), `LeccionDetailSerializer` (full body + related entities), `LeccionWriteSerializer` (multipart image upload)
   - `LeccionViewSet` in `api/v2/views.py`, `ordering_fields=['title', 'created_at']`, `filterset_fields` for `levels`/`keywords` (facets)
   - Register `router_v2.register('lecciones', LeccionViewSet, ...)` in `api/v2/urls.py`
   - → **commit:** `feat(api): add Leccion CRUD endpoint with facets and image upload`

9. **Django admin registration** (fallback editor)
   - → **commit:** `feat(admin): register Leccion models in Django admin`

### Frontend

10. **Rich-text editor dependency**
    - Add a lightweight editor (Quill or TipTap) to `mstdb_theme/package.json` — none installed today
    - → **commit:** `chore(deps): add rich-text editor for Lessons body field`

11. **Public Lessons section** (`mstdb_theme/src/routes/(app)/lessons/`)
    - `+page.svelte`: list/grid view, sortable by title and creation time, facet filters (levels, keywords)
    - `[id]/+page.svelte`: lesson detail view rendering sanitized HTML body + related entities
    - → **commit:** `feat(lessons): add public Lessons list and detail pages`

12. **Landing page card**
    - Add a card to the `<!-- Features Section -->` in `mstdb_theme/src/routes/(landing)/+page.svelte`
    - → **commit:** `feat(landing): add Lecciones Educativas feature card`

13. **Admin capture form** (`mstdb_theme/src/routes/(app)/User/catalogar/leccion/+page.svelte`)
    - Pattern: `catalogar/documento/+page.svelte`; rich-text editor bound to `body`, image drag/drop upload, M2M pickers for levels/keywords/personas/documentos/corporaciones
    - Add API helpers in `mstdb_theme/src/lib/api.js` (`fetchLecciones`, `createLeccion`, image upload call)
    - → **commit:** `feat(catalogar): Leccion capture form with rich text and image upload`

*Verify: create a lesson via the admin form including an embedded image; confirm it renders correctly on `/lessons/[id]`; list page sorts by title and creation time and filters by both facets; landing page card links to the section.*

---

## Phase 2 — Visualizations (parallel-safe with Phases 1 & 3, after Phase 0)

Replaces placeholder/static visualizations with live, filterable ones reusing existing Search-tab map/network components and backend endpoints. Touches only `Dashboard/` viz components and caching wrappers on existing endpoints — no schema changes.

14. **`personas-por-lugar`**
    - Rewrite `Dashboard/viz/PlacePeople.svelte` + `StaticPlacePeople.svelte`/`DinamicPlacePeople.svelte` to drop Plotly in favor of D3 or Chart.js
    - Add: search-by-place, year-range filter, click-node → navigate to `/Search?tab=personaesclavizada&trayectoria_lugar=<id>&fecha_documento__gte=<y1>&fecha_documento__lte=<y2>`
    - Add 3-column sortable summary table (Lugar, Total, Periodo); fix `places-people-distribution/` (or add a scoped variant) so "Periodo" is computed per-place instead of database-wide
    - → **commit:** `feat(dashboard): replace personas-por-lugar Plotly viz with interactive D3/Chart.js view`

15. **`mapa-trayectorias`**
    - Replace the static-JSON `Dashboard/viz/ArcsMap.svelte` (`/temp/trayectorias_arcs.json`) with the already-live `aggregatedTrajectories()` API (`travel-trajectories/aggregated/`), reusing patterns from `Search/TrajectoryMap.svelte`
    - Add: route-count slider, origin/destination place filters, date-range filter
    - → **commit:** `feat(dashboard): wire mapa-trayectorias to live aggregated-trajectories API`

16. **`red-de-personas`**
    - Replace `Dashboard/viz/NetworkGraph.svelte` internals with a Cytoscape graph backed by the existing `search/network/` endpoint, reusing `Search/SearchNetwork.svelte` (relation-type filters, centrality slider, orphan toggle)
    - Add: node/edge count slider, cluster-size filter, date-range filter
    - → **commit:** `feat(dashboard): wire red-de-personas to live network API with cluster and date filters`

17. **Caching layer**
    - Wrap `places-people-distribution/`, `travel-trajectories/aggregated/`, `search/network/` with `django-redis` cache (already installed, unused here); cache key per filter querystring, TTL-based invalidation
    - → **commit:** `perf(api): cache visualization endpoints with django-redis`

*Verify: each Dashboard page renders without Plotly; all filters/sliders update the visualization live; clicking a node/place deep-links to a prefilled Search page; repeat loads are measurably faster with caching enabled.*

---

## Phase 3 — Data Export (parallel-safe with Phases 1 & 2, after Phase 0)

Small, isolated change: one serializer annotation + one config file update. No schema changes.

18. **Backend aggregation**
    - Annotate `PersonaEsclavizadaListSerializer`'s queryset with `StringAgg` (Postgres) over `documentos__evento_valor_sp`, `documentos__evento_forma_de_pago`, `documentos__evento_total`, producing comma-joined values across all linked `documentos` (M2M)
    - → **commit:** `feat(api): expose aggregated Documento evento fields on PersonaEsclavizada list`

19. **Frontend columns**
    - Add `evento_valor_sp_list`, `evento_forma_de_pago_list`, `evento_total_list` to `columnsConfig.personaesclavizada` in `mstdb_theme/src/conf/columns.js` (`visible: false` by default, toggleable)
    - → **commit:** `feat(search): add toggleable Documento evento columns to PersonaEsclavizada table`

20. **Export verification**
    - Confirm the existing generic CSV export (`get_export_filename()` on the ViewSet) picks up the new serializer fields automatically — no export-specific code expected
    - → **commit:** `test(export): verify CSV export includes aggregated evento fields` *(only if a change was needed)*

*Verify: toggle the new columns visible in the personaesclavizada Search table; values show comma-joined evento data for personas with multiple documentos; CSV export includes the same data.*

---

## Relevant Files

- `mstdb_manager/Dockerfile`, `mstdb_manager/pyproject.toml`, `mstdb_manager/requirements.txt`, `mstdb_manager/uv.lock` — Phase 0
- `mstdb_manager/dbgestor/models.py`, `mstdb_manager/dbgestor/admin.py` — Phase 1 (Leccion models)
- `mstdb_manager/api/v2/serializers.py`, `mstdb_manager/api/v2/views.py`, `mstdb_manager/api/v2/urls.py` — Phase 1 (Leccion API), Phase 3 (evento aggregation)
- `mstdb_theme/src/routes/(app)/lessons/` (new), `mstdb_theme/src/routes/(landing)/+page.svelte` — Phase 1
- `mstdb_theme/src/routes/(app)/User/catalogar/leccion/+page.svelte` (new), reference: `User/catalogar/documento/+page.svelte` — Phase 1
- `mstdb_theme/src/routes/(app)/Dashboard/viz/{PlacePeople,StaticPlacePeople,DinamicPlacePeople,ArcsMap,NetworkGraph}.svelte` — Phase 2
- `mstdb_theme/src/routes/(app)/Search/{TrajectoryMap,SearchNetwork}.svelte` — Phase 2 (reference implementations)
- `mstdb_theme/src/conf/columns.js`, `mstdb_theme/src/lib/api.js` — Phase 3, Phase 1 (API helpers)

## Scope Boundaries

- Included: all 4 items from `_devplan/072026-modifications.md`.
- Excluded: the still-separate May 2026 initiative tracked in `_devplan/agent-plan.md` — do not merge scopes.
- Excluded: introducing an automated test suite (none exists today) — flagged as a candidate follow-up, not part of this plan.

## Progress checklist

| Phase | Status |
| --- | --- |
| Phase 0 — Python 3.13 migration | ✅ Complete |
| Phase 1 — Lecciones Educativas | ✅ Complete |
| Phase 2 | ✅ Complete |
| Phase 3 — Data Export | ✅ Complete |
