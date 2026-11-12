# Fix primary color regression and de-duplicate Bootstrap

## Goal

Restore the themed primary color (`#8b4513`) and leave the npm-bundled, Sass-themed Bootstrap 5.3.9 as the single source of truth for both CSS and JS.

## Root cause (verified)

- `mstdb_theme/src/app.html` loads Bootstrap CSS from the CDN **after** `%sveltekit.head%` (lines 9–13) and also loads the CDN Bootstrap JS bundle (line 36).
- In a production build, `%sveltekit.head%` emits the compiled `custom.scss` bundle first, then the CDN sheet:
  - `mstdb_theme/build/index.html:36` → `_app/immutable/assets/0.*.css` (themed bundle)
  - `mstdb_theme/build/index.html:40` → `bootstrap@5.3.2/dist/css/bootstrap.min.css`
- Equal-specificity `.btn-primary` rules in the later CDN sheet re-declare `--bs-btn-bg: #0d6efd`, overriding the theme.
- The themed bundle is correct: `0.Dav2kLjg.css` contains `.btn-primary{--bs-btn-bg:#8b4513;...}` and `--bs-primary:#8b4513`.
- Regression appeared in 1.6.0 because commit `318affc` corrected the CDN URL to `/dist/css/`. The previous URL 404'd, so the duplicate sheet was inert (see `CHANGELOG.md:18`).
- Dev looked fine because Vite injects the compiled CSS at runtime after the static CDN `<link>`; production emits it before.

## Decisions

- Remove both Bootstrap CDN tags (CSS and JS). Keep npm `bootstrap` 5.3.9, used for CSS by `custom.scss` and for JS by `$lib/bootstrap-actions.js`.
- Remove the manual dropdown click listener in `bootstrap-actions.js`. The local Bootstrap ESM already registers the click data-api for `[data-bs-toggle="dropdown"]` (verified in `bootstrap/dist/js/bootstrap.esm.js`); after the CDN copy is removed, the manual listener would toggle a second time and cancel the open.
- Leave jQuery, DataTables, Leaflet, and Bootstrap Icons CDN tags untouched (out of scope).

## Tasks (ordered)

1. `mstdb_theme/src/app.html`
   - Remove the "Bootstrap CSS" comment block and the CDN `<link>` for `bootstrap@5.3.2/dist/css/bootstrap.min.css`.
   - Remove the CDN `<script>` for `bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js`.
   - Keep jQuery, DataTables, Leaflet, and icon tags unchanged.
2. `mstdb_theme/src/lib/bootstrap-actions.js`
   - In `dropdown(node)`, delete the `node.addEventListener('click', ...)` block that calls `dropdownInstance.toggle()` and `e.preventDefault()`.
   - Keep the dynamic `import('bootstrap')` and `new bootstrap.Dropdown(node)`; Bootstrap's local data-api owns the click toggle.
   - Leave `collapse` and `tooltip` unchanged.
3. Confirm the only Bootstrap references left are the npm imports:
   - `rg "bootstrap@" mstdb_theme/src` → no CDN matches.
4. Update root `CHANGELOG.md` under `[Unreleased]` → `### Frontend (mstdb_theme)`:
   - Note the 1.6.0 CDN URL fix exposed a duplicate Bootstrap stylesheet that overrode `$theme-colors`; primary is `#8b4513` again because the CDN CSS/JS were removed and the themed 5.3.9 bundle is now the only copy.
   - Note the dropdown action now relies on Bootstrap's data-api click handler.
5. Commit (per `AGENTS.md`):
   - `mstdb_theme`: `src/app.html`, `src/lib/bootstrap-actions.js`.
   - Parent repo: `CHANGELOG.md` plus the updated submodule pointer.

## Validation

- `cd mstdb_theme && npm run build` succeeds.
- `mstdb_theme/build/index.html` contains no `cdn.jsdelivr.net/npm/bootstrap` URL and still links the compiled `_app/immutable/assets/0.*.css`.
- `rg "0d6efd" mstdb_theme/build` → no match.
- Serve the build (`npm run preview`, or the Docker/nginx image) and check computed style:
  - Landing hero search button and `/Search/` submit button: `background-color: rgb(139, 69, 19)`.
  - Hover: `#763b10`.
  - `.btn-outline-primary` text/border use `#8b4513`.
- `npm run dev`: same computed color (this path already worked; guard against regression).
- Interaction smoke test (mouse + keyboard; WCAG 2.1 AA is a release requirement):
  - Navbar dropdown opens on click/Enter, closes on Escape and outside click.
  - Navbar collapse works at a narrow viewport.
  - Tooltips in Search filters and Detail pages.
  - Welcome alert close button.
  - DataTables controls and Leaflet map render correctly.
- `npm run lint` and `npm run test:unit`; run `npm run test:integration` if Playwright browsers/server are available.

## Risks and notes

- The JS de-duplication changes which data-api instance owns interactions. Dropdown is the parity-sensitive one; deleting the manual listener intentionally leaves exactly one toggle.
- Bundled Bootstrap is 5.3.9 while the CDN copy was 5.3.2. DataTables 1.13.5's bootstrap5 CSS is compatible, but visually check DataTables buttons.
- Remaining duplicates (out of scope): jQuery CDN 3.6.0 vs npm 3.7.1, DataTables CDN 1.13.5 vs npm 2.1.8, Bootstrap Icons CDN 1.11.2 vs npm 1.11.3; the npm copies appear unused.
- `data-bs-toggle="tooltip"` at `mstdb_theme/src/routes/(app)/Search/+page.svelte:207` has no `use:tooltip` and is inert today; consider fixing separately.
- No version bump in this change; keep the entry under `[Unreleased]` until a release is cut.
