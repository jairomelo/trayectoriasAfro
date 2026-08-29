# Mapa de Trayectorias — loading overlay, animated timeline, hover interactions

## Goal

Improve `mstdb_theme/src/routes/(app)/Dashboard/mapa-trayectorias` (component: `Dashboard/viz/ArcsMap.svelte`):

1. **Loading state**: spinner + explanatory message rendered *inside* the map frame (overlay), not below it.
2. **Timeline animation**: playable, scrubbable animation of the enslaved-trade flow over time — moving particles along arcs + place markers that grow cumulatively (regional impact).
3. **Hover/click**: rich tooltip per arc; click opens a route-detail modal listing the actual people (reuses Search's `RouteDetailPanel.svelte`); arcs keyboard-operable (WCAG AA).
4. Extras (approved): legend + summary strip, year-granularity selector, skip-to-start/end controls.

## Decisions (confirmed with user)

- **Backend**: extend `travel-trajectories/aggregated/` with `include_timeline=1` (optional, backward compatible). No new endpoint, no schema/migration changes.
- **Animation**: D3 particles traveling along arcs (period flow) + markers growing cumulatively; arcs fade in when first active and thicken with cumulative count.
- **Bucketing**: per-year buckets (default). UI granularity selector adds 5-year / 10-year.
- **Undated legs**: excluded from the timeline; shown only in static mode. Timeline mode shows a notice with the excluded count.
- **Interactions**: rich HTML tooltip + detail modal (RouteDetailPanel) + keyboard access.
- **Dates source**: per `PersonaLugarRel`, use `fecha_inicial_lugar or documento.fecha_inicial` (established pattern in `api/v2/serializers.py:502`).

## Backend changes — `mstdb_manager/api/v2/views.py` (submodule)

### 1. `_build_persona_points` — add a date per point (lines ~2302-2338)

- In the `rel_points` loop, add `'fecha': rel.fecha_inicial_lugar or (rel.documento.fecha_inicial if rel.documento else None)`.
- FK points (`lugar_nacimiento`, `procedencia`, `lugar_defuncion`) stay `fecha: None`.
- Keep signature/behavior identical otherwise (used by `aggregated`, `route_detail`, `trajectory_details`).

### 2. `aggregated` action — honor `include_timeline` (lines ~2345-2464)

- Read `include_timeline = request.query_params.get('include_timeline') == '1'`.
- When enabled:
  - Track a per-leg **year**: leg year = year of arrival point's `fecha`, falling back to departure point's `fecha`. None → count as undated (excluded from `years`, tracked separately).
  - Extend `route_map` bookkeeping with `years: defaultdict(int)` per route and `undated: int` per route. Per-year counts are **movement-leg counts** (a persona with two dated legs on the same route counts in each year), not unique-persona counts — document this in the legend.
  - Extend each route dict with: `years` (JSON object `{"<year>": n}`), `min_year`, `max_year` (from that route's dated legs; null if none), `undated` (int).
  - Add top-level keys: `min_year`, `max_year` (global over dated legs of the filtered set), `undated_count` (total undated legs).
- When disabled: response shape unchanged (Search `TrajectoryMap.svelte` and `export_movement_arcs.py` must not see new required keys).
- `cache_visualization('travel_trajectories_aggregated', ttl=600)` already keys on querystring → `include_timeline=1` gets its own cache entry. No decorator change.
- No migrations; no serializer/URL changes.

## Frontend changes — `mstdb_theme` (submodule)

### 3. `src/routes/(app)/Dashboard/viz/ArcsMap.svelte` — major rework

Keep the same import surface (Leaflet dynamic import, d3, `aggregatedTrajectories`). Structure the rewrite around clearly separated concerns:

- **State**: `mode = 'static' | 'timeline'`, `granularity = 1 | 5 | 10`, `playhead` (year index), `playing`, `speed` (1x default; optional 0.5x/2x select), `routes` (with `years`), `places`, `meta` (`min_year`, `max_year`, `undated_count`), `hoveredRoute`, `selectedRoute` (modal), `loading`, `error`.
- **Data loading**: `loadData()` sends `include_timeline: 1` (params passthrough via `aggregatedTrajectories`, no `api.js` change). Existing filters (origin, destination, date range) still pre-filter the dataset; the timeline plays over the filtered years.
- **Static mode** = current behavior (route-limit slider, origin/destination selects, date-range + Aplicar button) with the new tooltip/modal instead of the native `<title>`.
- **Timeline mode**:
  - Controls bar: Play/Pause (aria-label, `bi-play`/`bi-pause`), skip-to-start/end buttons, scrubber (`input[type=range]` bound to playhead index), granularity select (1/5/10 years), year label ("Año: 1650"), "Volver a vista estática" toggle.
  - Bucket list built from `meta.min_year..max_year` grouped by `granularity` (bucket key = `Math.floor(year/g)*g`).
  - **Arcs**: data-join with d3 transitions (opacity/width), not full remove-and-rebuild, per tick. Arc active when cumulative dated count at playhead > 0; opacity/thickness scale with cumulative count. Cap at `routeLimit` (reuse existing slider, default 100, max 500).
  - **Particles**: rAF loop moving dots along each active arc's quadratic Bézier (same control-point math as the arc path). Count capped (~80 total, proportional to the current period's flow per route). Direction = origin → destination. Pause loop when `!playing` or `mode !== 'timeline'`; clean up on `onDestroy`.
  - **Markers**: place circles in a dedicated SVG `<g>` (not Leaflet circleMarkers — cheaper per-tick), radius grows with cumulative `incoming + outgoing` for that place up to the playhead (min radius floor ~5px). Hover shows cumulative count.
  - Empty state: if no dated legs (`meta.min_year == null`), show an in-map message instead of the controls.
  - Notice when `meta.undated_count > 0`: "X movimientos sin fecha no se muestran en la línea de tiempo."
- **Tooltip**: custom absolutely-positioned `<div>` inside the map frame; content = from → to, count (static: unique personas; timeline: cumulative + period counts), year span (`min_year`–`max_year` or "sin fecha"). Shown on pointerenter/pointermove, hidden on pointerleave/focusout.
- **Detail modal**: replicate the modal + backdrop pattern from `Search/TrajectoryMap.svelte` but WCAG-correct: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the title, Escape closes, backdrop click closes, focus moves to first focusable element on open and returns to the triggering arc on close. Body = `<RouteDetailPanel fromId={d.from_lugar_id} toId={d.to_lugar_id} fromNombre={d.from_nombre} toNombre={d.to_nombre} count={d.count} filters={activeFilters} />` (import from `../Search/RouteDetailPanel.svelte`). `activeFilters` carries the current date-range params.
- **Accessibility (arcs)**: `tabindex="0"`, `role="img"`, `aria-label` like "Ruta de X a Y, N personas. Enter para ver detalle."; Enter/Space opens the modal; Escape closes. Visible focus style.
- **Legend + summary strip**: legend items for arc thickness ↔ count, marker radius ↔ personas, particle meaning, plus "por período vs acumulado" note (per-year = movements, static = unique personas). Summary line: total routes, total places, year range, undated count (timeline mode only).

### 4. `src/styles/custom.css` — styles (per AGENTS.md: no component-scoped styles)

- Remove the `<style>` block from `ArcsMap.svelte`; move styles here, scoped to the component container:
  - `.map-frame { position: relative; }` (wrapper around `#map`)
  - `.map-loading-overlay`, `.map-error-overlay` — `position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(...);` (spinner + "Cargando trayectorias… Esto puede tomar unos momentos.")
  - `.map-tooltip` — absolute-positioned rich tooltip (contrast-checked, AA)
  - `.map-arc` transitions/`:hover`/`:focus-visible` states scoped to `.arcs-map svg path.map-arc` (do **not** use the old global `:global(svg path)` — it leaks to every SVG on the page)
  - Timeline controls + legend/summary styles
- Keep `#map` dimensions (100% width, 600px height, radius, border) — move the existing rules out of the component into `custom.css`.

### 5. (Optional, low cost) `tests/accessibility.spec.js`

- Add `{ name: 'Mapa trayectorias', path: '/Dashboard/mapa-trayectorias' }` to `PAGES` if the route renders for anonymous users (the map endpoints are public like Search's). If flaky under `networkidle` (leaflet/d3 async tiles), keep it out and rely on manual axe pass.

## Validation

1. **Backend**: `python manage.py check`; then
   - `curl "…/travel-trajectories/aggregated/"` → payload shape unchanged (no `years`/`min_year` keys).
   - `curl "…/travel-trajectories/aggregated/?include_timeline=1"` → routes carry `years`/`min_year`/`max_year`/`undated`; top-level `min_year`/`max_year`/`undated_count` present.
   - **Date coverage sanity check** (important for per-year buckets): in Django shell, measure the share of `PersonaLugarRel` legs resolvable to a date via `fecha_inicial_lugar or documento__fecha_inicial`. If coverage is low (< ~20%), surface this to the user before finalizing — the per-year timeline may be sparse (the granularity selector is the mitigation).
2. **Frontend**: `npm run lint` (prettier) and `npm run build`. Manual pass on the page: overlay spinner shows inside the map frame during load; static mode unchanged; timeline plays/pauses/scrubs with particles and growing markers; skip-to-start/end work; granularity switch works; tooltip appears on hover/focus; click opens the modal with people listed; keyboard (Tab/Enter/Space/Escape) navigates the arcs and modal.
3. **A11y**: axe on the page (manual or via the spec addition above), WCAG 2.1 AA.

## Risks / notes

- **Date coverage unknown**: could not verify against the 47MB fixture without DB access; per-year playback may be sparse. Mitigation: granularity selector + early coverage check during implementation.
- **Payload size**: `include_timeline=1` adds `routes × years` data; cached per querystring (TTL 600s). Acceptable; if too heavy, revisit decade compression.
- **Per-year counts are movement-leg counts** (not unique personas) — totals between timeline (dated movements) and static (unique personas) intentionally differ; communicate via legend/summary.
- **Submodule discipline**: `mstdb_manager` and `mstdb_theme` are submodules — commit within each submodule separately; the root repo only bumps pointers. No commits unless explicitly requested.
- **Perf**: cap particles (~80) and keep arcs/markers as d3 data-joins with transitions instead of full rebuilds per tick.

## Out of scope

- URL query-param persistence of filters (not selected).
- Tooltip sparklines (not selected).
- Changes to `Search/TrajectoryMap.svelte` or the export management command (must keep working unchanged).
- Any schema/migration work.
