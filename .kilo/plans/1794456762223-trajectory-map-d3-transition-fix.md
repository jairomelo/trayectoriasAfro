# Fix `/Dashboard/mapa-trayectorias/` crash (missing d3-transition in prod bundle)

## Diagnosis (verified)

Production build (`mstdb_theme/build`, same hashes the live site serves: `nodes/7.DJnRESgO.js`, `entry/app.BfB_7L5M.js`)
contains **no d3-transition implementation**. ArcsMap still calls
`selection.transition()` / `selection.interrupt()` (src/routes/(app)/Dashboard/viz/ArcsMap.svelte:541-553, 621, 695-712),
so on the first `renderScene()` the reactive effect throws `a.transition is not a function`, SvelteKit's
`handleError` logs it (`app.*.js` frame) and the route renders the 500 error page.

Evidence:
- `rg "__transition__|interrupt" mstdb_theme/build/_app/immutable -g '*.js'` → only the call sites in
  `nodes/7.DJnRESgO.js`; no transition runtime anywhere.
- `d3`'s `package.json` declares `"sideEffects": false`. Vite 8 uses Rolldown, which trusts that flag and drops the
  unused `export * from "d3-transition"` re-export. `d3-transition` augments
  `selection.prototype.transition/interrupt` through import side effects (verified in
  `node_modules/d3-transition/dist/d3-transition.mjs:874`).
- Vite 7 (Rollup) kept it, and dev/preview-via-optimizeDeps still works, so this only reproduces in `vite build` —
  consistent with "worked before the SvelteKit 3 / Vite 8 upgrade".
- ArcsMap is the only place in `src/` using `.transition()` / `.interrupt()`, so this page alone 500s.
- Backend is healthy: `GET /api/v2/travel-trajectories/aggregated/?include_timeline=1&limit_rutas=250` returns
  `HTTP 200` with 250 routes. No backend change is needed.

Secondary console error `can't access property "on", ... is null` (same ArcsMap chunk) is the `onMount` continuation
running after the component was torn down (error page/HMR/navigation during the `await loadData()`), so `map` is already
`null` when `map.on('zoomend', ...)` runs. It is a teardown race, fixed with guards, not a second root cause.

## Changes

### 1. Make `d3-transition` part of the bundle (primary fix)

- `mstdb_theme/package.json`: add `"d3-transition": "^3.0.2"` to `dependencies` (it is currently only a transitive
  dependency of `d3`), via `npm install d3-transition@^3.0.2` so `package-lock.json` stays consistent (`npm ci` is used
  in the Docker build).
- `mstdb_theme/src/routes/(app)/Dashboard/viz/ArcsMap.svelte`: directly after `import * as d3 from 'd3';` add a
  side-effect import:
  ```js
  // Vite 8 (Rolldown) drops d3's re-export of this side-effect module because d3 declares
  // "sideEffects": false; import it directly so selection.prototype.transition/interrupt exist.
  import 'd3-transition';
  ```
  Keep the existing import in the same chunk so it augments the same `d3-selection` instance (single copy, npm dedupes).

Do **not** disable global tree-shaking (`treeshake.moduleSideEffects`) to fix this; that weakens the whole build.

### 2. Guard the async map setup against teardown

In `ArcsMap.svelte` `onMount`:
- after `const leaflet = await import('leaflet');` add `if (!mapContainer) return;`
- after `await loadData();` add `if (!map) return;` (before the `map.on(...)` wiring).

This removes the null-`.on` error when the component is destroyed while the Leaflet import or the API request is in
flight, and it keeps the error overlay from showing on already-torn-down pages.

### 3. Regression test (production bundle, deterministic)

Add `mstdb_theme/tests/trajectory-map.spec.js` (Playwright already runs `npm run build && npm run preview`, so this
exercises the built bundle, which is where the bug lives):

- `page.route(/\/api\/v2\/travel-trajectories\/aggregated\//, route => route.fulfill({ json: fixture }))` with a tiny
  fixture: 2 places, 1 route (`years: { "1601": 1, "1605": 1 }`, `min_year: 1601`, `max_year: 1605`, `undated: 0`,
  numeric `lat`/`lon`, `count: 2`), plus top-level `min_year/max_year/undated_count`, `truncated: false`,
  `limit_rutas: 10`, `min_count: 1`.
- Also fulfil `whoami/` (403) and `config/` (JSON) so the layout does not add noise.
- Collect `page.on('pageerror')` and `page.on('console', msg => msg.type() === 'error')`, goto
  `/Dashboard/mapa-trayectorias/`, then:
  - expect the first `path.map-arc` to eventually have a `stroke-width` attribute (it is only written by the d3
    transition; the broken bundle leaves it unset and shows the 500 page),
  - expect no collected `pageerror`/console error text to contain `is not a function` (the transition failure surfaces
    through SvelteKit `handleError` → `console.error`, not always as a `pageerror`).
- Run it before the fix to confirm it fails with `a.transition is not a function`, then after the fix to confirm green.

## Validation

```bash
cd mstdb_theme
npm install d3-transition@^3.0.2
npm run build
rg -l "__transition__" build/_app/immutable        # must now find the emitted d3-transition code
npm run test:unit -- --run
npm run test:integration                          # builds + previews; new spec must pass
npm run lint                                      # prettier check
```

(If Playwright browsers are missing on the machine: `npx playwright install chromium`.)

Manual check against the built output (`npm run preview` or the Docker image): map page renders arcs, timeline
autoplays, arcs/markers animate on bucket changes, tooltip + route/place modals work, console clean (the only expected
log is the anonymous-user `whoami` notice).

## Rollout

- Rebuild the frontend image (`docker compose build mstdb_theme && docker compose up -d mstdb_theme`) so
  `/_app/immutable/*` gets the new hashed chunks; `index.html` is already `no-cache`, so clients pick up the new bundle.
- Update `CHANGELOG.md` `[Unreleased]` → `Frontend (mstdb_theme)` with one bullet: trajectory map 500 fixed by keeping
  `d3-transition` in the Rolldown bundle (d3 `sideEffects: false` regression after the Vite 8 upgrade).
- Commit in the `mstdb_theme` submodule, then commit the updated submodule pointer in the root repo.

## Risks / notes

- If Rolldown still drops the explicit side-effect import (verify with the `__transition__` grep), fall back to removing
  d3 transitions from ArcsMap entirely: set `stroke-width`/`opacity`/`r` directly (the existing `skipTransition`
  branches already do this) and move the 220 ms easing to `styles/custom.css` (`transition: stroke-width .22s,
  opacity .22s` on `.map-arc`, `transition: r .22s` on `.map-marker`); particle exit fade becomes an immediate remove or a
  short `setTimeout` fade. Do not use a `treeshake.moduleSideEffects` array, which disables side-effect preservation for
  everything else.
- Out of scope (separate follow-up): the Svelte 5 runes migration commit (`318affc`) made `src/routes/+layout.svelte`
  runes mode while `let welcome` / `let query` stayed plain `let`, so the welcome banner no longer updates reactively and
  `query` is dead state. It does not affect the map crash.
