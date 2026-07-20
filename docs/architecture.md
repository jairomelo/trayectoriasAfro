# trayectoriasAfro Architecture Notes

## Stack
- Backend: Django + DRF in `mstdb_manager/`, Docker-only (no local Django)
- Frontend: SvelteKit in `mstdb_theme/`, D3.js + Leaflet for maps
- Syntax validation: `python3 -c "import ast; ast.parse(open('file').read())"`

## Key Models (dbgestor/models.py)
- Persona (polymorphic base) → PersonaEsclavizada, PersonaNoEsclavizada
- PersonaLugarRel: M2M through (personas, lugar, ordinal, situacion_lugar, documento, fechas_inicio/final)
- FK place fields: Persona.lugar_nacimiento, Persona.lugar_defuncion, PersonaEsclavizada.procedencia
- M2M vocabs: calidades, etnonimos (PE only), hispanizacion (PE only), estado_civil, ocupaciones
- Documento: FK archivo, FK lugar_de_produccion, date range (fecha_inicial/final)
- Lugar: geographic (lat/lon), tipo, nombre_lugar, otros_nombres, es_parte_de (self-FK)
- Corporacion: FK lugar_corporacion, M2M documentos, M2M personas_asociadas

## PersonaEsclavizada numeric/date fields (for cross-variable analysis)
- edad, unidad_temporal_edad (d/m/a)
- fecha_nacimiento, fecha_defuncion + _raw + _factual variants
- altura, cabello, ojos (text)
- marcas_corporales, conducta, salud (text fields)
- Relational: documentos (M2M), calidades, etnonimos, hispanizacion, estado_civil

## API v2 Search & Browse (api/v2/urls.py, SearchAPIView)
- Endpoint: `api/v2/search/?type=personaesclavizada&page=1&page_size=30`
- Query params: q (FTS), type, page, page_size, ordering, search (simple filter)
- Filters: lugar_id, archivo_id, year, etnonimo, calidad, hispanizacion, ocupacion (CSV)
- Form filters: sexo, edad__gte/lte, tipo_documental, etnonimos__etonimo__icontains, etc.
- Response: {results, count, next, previous, typeCounts, facets}
- View modes: table (EntityTable), card (BrowseCards), map (TrajectoryMap for PE only)

## Existing Aggregation Endpoints (api/v2/views.py)
- `counts/` — EntityCountsView: returns {personaesclavizada, personanoesclavizada, documento, lugar, corporacion} counts
- `gender-status-distribution/` — GROUP BY sexo + hispanizacion, returns [{sexo, hispanizacion, count}]
- `places-people-distribution/` — GROUP BY lugar + tipo + year, aggregates personas per place per year
- `travel-trajectories/all_trajectories_summary/` — merges PersonaLugarRel + FK places (procedencia, nacimiento, defuncion), returns {total_places, places:[...]}

## Frontend Search/Browse Store (src/lib/unified-store.js)
- unifiedStore: writable with activeTab, viewMode (table/card/map), query, exactSearch, counts, typeCounts, facets
- Per-tab state: results, totalResults, currentPage, pageSize, sortField, sortDir, filters, visibleColumns
- Functions: fetchResults(), setViewMode(), setActiveTab(), toggleSort(), setPage(), setPageSize()
- Response shape: data.results (entity objects), data.typeCounts (per-type counts in search context), data.facets (sidebar filter buckets)

## View Components (src/routes/(app)/Search/)
- +page.svelte: main search interface, tabs, search bar, controls, dispatcher to view modes
- EntityTable.svelte: reads visibleColumns from store, renders sortable table with renderCellValue()
- BrowseCards.svelte: maps cardComponent per entity type (PersonasEsclavizadasCard, DocumentCard, etc.)
- TrajectoryMap.svelte: Leaflet + D3 arcs, calls travel-trajectories endpoints
- BrowseFilters.svelte: sidebar facets, form-based filters

## Column Config (src/conf/columns.js)
- columnsConfig: per-entity array of {key, label, sortable, visible}
- defaultVisibleColumns: derived, defines default table columns
- entityTabConfig: {icon, detailPath} per entity type
- entityIdField: {persona_id, documento_id, lugar_id, corporacion_id}
- renderCellValue(): custom formatters (edad+unit, date handling, arrays, nested objects)
- filtersDefinition: per-entity filter UI (searchable-select, id-searchable-select, text, select, year, date)

## Serializers (api/v2/serializers.py)
- Reference: lightweight (id, name fields only)
- List: for table/browse views (adds counts, FK references)
- Detail: full nested data with relationships
- PersonaEsclavizadaListSerializer: adds etnonimos, hispanizacion, has_relaciones, documento_count
- Write: for POST/PATCH operations

## Infra gotchas (found during Phase 1 / Lecciones Educativas work, July 2026)
- Backend dependency mgmt is uv-only: update `mstdb_manager/pyproject.toml` with
  `uv add <pkg>` and commit the resulting `mstdb_manager/uv.lock` change.
- Docker installs backend deps via `uv sync --frozen --no-dev --no-install-project`.
  If deps change, rebuild the `web` image (`docker compose build web`).
- mstdb_theme/nginx.conf (the `frontend` service's nginx, NOT the incomplete
  root-level `nginx/` dir referenced by docker-compose.prod.yml which doesn't exist)
  proxies /api/, /admin/, /static/ to `web:8000`. It used `proxy_set_header Host $host;`
  which strips the port — use `$http_host` instead or Django's build_absolute_uri()
  produces broken URLs (e.g. missing :3000).
- No route ever served MEDIA_ROOT (dev or prod) — mdb/urls.py had no static()/serve()
  for media. Added `path('media/<path:path>', serve, {'document_root': MEDIA_ROOT})`.
  frontend nginx also needs `/media/` proxied to `web:8000` (it has no filesystem
  access to Django's media dir).
- @tiptap/starter-kit v3 already bundles the Link extension — don't also import
  @tiptap/extension-link separately (causes a "duplicate extension" warning);
  configure it via `StarterKit.configure({ link: {...} })`.
- Repo has git submodules (mstdb_manager, mstdb_theme). Commit inside each submodule
  first, then `git add <submodule>` + commit in the superproject to bump the pointer.
- To stage only part of a dirty file while leaving unrelated WIP hunks untouched
  (e.g. someone else's in-progress edit in the same file), `git add -p` run via the
  sync terminal tool auto-answers "y" to all hunks (no real interactivity) — instead
  build a minimal patch file with just the wanted hunk and `git apply --cached patch.diff`.
