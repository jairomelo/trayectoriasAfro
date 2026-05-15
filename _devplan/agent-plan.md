# Plan: May 2026 Development Sprint

## TL;DR
Execute the full May 2026 dev plan across 5 sequential phases, each independently verifiable. The critical path is: backend refactors → model upgrades → user dashboard + profiles → ingestion capture forms → relational editing + merging. Frontend capture forms are largely independent of backend refactors once the API endpoints are confirmed to exist (they do, via existing ViewSets).

---

## Phase 1 — Backend Refactors (Priority: must ship first, unblocks all forms)

These are structural changes that will break serializers/views if done mid-sprint.

1. **Rename `persona_sujeto` → `persona_fuente`** in `PersonaRelaciones` model
   - Django migration (rename field + `related_name`)
   - Update all serializers in `api/v2/serializers.py`, `api/v1/`, `api/v1beta/`
   - Update views, admin, templates
   - Update `trayectoria/+page.svelte` and any other frontend references
   - → **commit:** `refactor(models): rename persona_sujeto to persona_fuente`

2. **Merge `aso` → `tmp`** in `PersonaRelaciones.naturaleza_relacion`
   - Data migration: update all existing `aso` records to `tmp`
   - Remove `('aso', 'Asociativa')` from RELACIONES choices
   - Update serializers, admin, frontend filters/labels
   - → **commit:** `refactor(models): merge aso relationship type into tmp`

3. **Enable directionality for `fam`/`tmp`**
   - `persona_fuente` FK already exists; extend serializer exposure to all types, not just `sub`
   - Document semantics in model docstring
   - → **commit:** `feat(api): expose persona_fuente directionality for all relationship types`

*Verify: `manage.py migrate` clean; `/api/v2/relaciones-personas/` returns `persona_fuente`; trayectoria panel still works*

---

## Phase 2 — Model Upgrades (parallel-safe with Phase 1 on a separate branch)

4. **Convert `PLACE_TYPE_CHOICES` → `TipoLugar` model**
   - New model in `dbgestor/models.py` with `nombre` (unique, lowercase-normalized)
   - Migration + data migration seeding existing 15 types
   - → **commit:** `feat(models): add TipoLugar model + seed migration`
   - Update `Lugar.tipo` FK → `TipoLugar`; update serializer, admin, API filters
   - → **commit:** `refactor(models): migrate Lugar.tipo to TipoLugar FK`

5. **Simplified IDs (`short_id`)**
   - Add `short_id` property to `PersonaEsclavizada` (`P{id}`), `PersonaNoEsclavizada` (`PN{id}`), `Documento` (`D{id}`), `Lugar` (`L{id}`), `Corporacion` (`C{id}`)
   - Keep legacy `mx-sv-*` as `legacy_id`; expose `short_id` in serializers
   - Update `renderCellValue()` in `src/conf/columns.js` to display `short_id`
   - → **commit:** `feat(models): add short_id display field to all entities`

6. **Vocabulary lowercase normalization**
   - Add `pre_save` signal (or `.save()` override) to `Etnonimos`, `Hispanizaciones`, `Calidades`
   - Data migration to lowercase all existing records
   - → **commit:** `feat(models): enforce lowercase normalization on vocab models`

*Verify: `manage.py migrate` clean; new vocab entries auto-lowercased; `short_id` visible in API responses*

---

## Phase 3 — User Dashboard & Profiles

7. **`UserProfile` model in `cataloguers/models.py`**
   - One-to-one with `auth.User`; fields: `bio`, `institution`, `institution_url`, `role`
   - Migration + admin registration
   - → **commit:** `feat(cataloguers): add UserProfile model`
   - Extend `whoami/` endpoint to include profile fields
   - → **commit:** `feat(api): include UserProfile fields in whoami response`

8. **Seed existing contributors**
   - Script/fixture populating `UserProfile` from `src/conf/contributors.js` data
   - → **commit:** `chore(data): seed UserProfile from contributors fixture`

9. **Dashboard frontend (`User/dashboard/+page.svelte`)**
   - Role-gated sections per the feature matrix; database summary via `counts/`
   - → **commit:** `feat(dashboard): role-gated summary and database stats`
   - Personal progress section (verify `HistoricalRecords` captures `history_user` first)
   - Staff user-list with new `GET /api/v2/users/progress/` endpoint
   - → **commit:** `feat(dashboard): personal progress and staff user-list sections`
   - Edit personal info form
   - → **commit:** `feat(dashboard): user profile edit form`

*Verify: each role sees correct sections; `counts/` data renders; profile editable*

---

## Phase 4 — Ingestion Capture Forms (core of Ingestion Panel v2)

All forms under `User/catalogar/`. Reuse auth guard in `+layout.svelte`. Start with shared components so all forms can be built consistently.

15. **Shared form components** *(build first — everything else depends on these)*
    - Extract patterns from `trayectoria/+page.svelte`: `SearchableSelect.svelte`, `VocabMultiSelect.svelte`, `DateRangeInput.svelte` (fecha + _raw + _factual triplet)
    - → **commit:** `feat(ui): add shared form components (SearchableSelect, VocabMultiSelect, DateRangeInput)`

10. **`PersonaEsclavizada` form** (`catalogar/persona-esclavizada/+page.svelte`)
    - All fields + M2M vocabs via `/vocabularios/*` typeaheads; POST to `api/v2/personas-esclavizadas/`
    - → **commit:** `feat(catalogar): PersonaEsclavizada capture form`

11. **`PersonaNoEsclavizada` form** (`catalogar/persona-no-esclavizada/+page.svelte`)
    - POST to `api/v2/personas-no-esclavizadas/`
    - → **commit:** `feat(catalogar): PersonaNoEsclavizada capture form`

12. **`Documento` form** (`catalogar/documento/+page.svelte`)
    - POST to `api/v2/documentos/`; archivo searchable select
    - → **commit:** `feat(catalogar): Documento capture form`

13. **`Lugar` form** (`catalogar/lugar/+page.svelte`) + edit button on `Detail/lugar/[id]`
    - POST/PATCH; coordinate inputs; `es_parte_de` self-FK; `TipoLugar` with inline "add new" *(depends on Phase 2, step 4)*
    - → **commit:** `feat(catalogar): Lugar capture form with coordinate and type editing`

14. **`Corporacion` form** (`catalogar/corporacion/+page.svelte`)
    - POST to `api/v2/corporaciones/`
    - → **commit:** `feat(catalogar): Corporacion capture form`

*Verify: create a test record via each form; confirm it appears in Search; test collector and staff roles*

---

## Phase 5 — Relational Editing & Merging

16. **PersonaRelaciones visual panel** (`User/catalogar/relaciones/+page.svelte`)
    - Modeled on `trayectoria/+page.svelte`; persona search → existing relationships; add/remove/edit with `naturaleza_relacion`, `persona_fuente`, `descripcion_relacion`, dates
    - POST/PATCH/DELETE to `api/v2/relaciones-personas/`
    - → **commit:** `feat(catalogar): PersonaRelaciones visual editing panel`

17. **Integrate Trayectoria + edit links**
    - "Edit Trajectory" button in PersonaEsclavizada form post-creation
    - Edit button on `Detail/lugar/[id]` for collectors
    - → **commit:** `feat(catalogar): add trajectory and lugar edit entry points`

18. **Merging elements — backend**
    - `SugerenciaMerge` model in `dbgestor/models.py` + admin
    - → **commit:** `feat(models): add SugerenciaMerge model for merge suggestions`
    - `GET /api/v2/merge/candidates/` — fuzzy match via `rapidfuzz` on nombre fields
    - `POST /api/v2/merge/` — re-points FK/M2M refs, deletes duplicates
    - → **commit:** `feat(api): merge candidates and merge execution endpoints`

19. **Merging elements — frontend**
    - `User/catalogar/merge/+page.svelte` — entity selector → candidates → pick canonical → confirm
    - → **commit:** `feat(catalogar): merge UI for duplicate resolution`
    - "Suggest merge" button on `Detail/*/[id]` for non-collector users
    - → **commit:** `feat(detail): public suggest-merge button on all detail pages`

20. **Tooltips on Detail/* panels**
    - Tooltip `(i)` component in `src/lib/`; add to Trayectoria and Red de Relaciones panels; wire existing `title` attributes
    - → **commit:** `feat(ui): add tooltip component and wire Detail panel hints`

*Verify: merge Melchora de los Reyes IDs 6, 1762, 7825, 7887, 2711, 1027 → one canonical record; all relationships re-pointed; public merge suggestion flow works*

---

## Relevant Files

- `mstdb_manager/dbgestor/models.py` — PersonaRelaciones, Lugar, vocab models, controlled vocabularies
- `mstdb_manager/dbgestor/admin.py` — admin registrations
- `mstdb_manager/api/v2/serializers.py` — all entity serializers, Write serializers
- `mstdb_manager/api/v2/views.py` — ViewSets, custom endpoints
- `mstdb_manager/api/v2/urls.py` — URL registration
- `mstdb_manager/cataloguers/models.py` — currently empty, UserProfile goes here
- `mstdb_manager/dbgestor/migrations/` — new migrations per phase
- `mstdb_theme/src/routes/(app)/User/catalogar/+layout.svelte` — auth guard (reuse)
- `mstdb_theme/src/routes/(app)/User/trayectoria/+page.svelte` — reference implementation for relational forms
- `mstdb_theme/src/routes/(app)/User/dashboard/+page.svelte` — dashboard (extend)
- `mstdb_theme/src/routes/(app)/Detail/lugar/[id]/+page.svelte` — add edit button
- `mstdb_theme/src/conf/columns.js` — add short_id rendering
- `mstdb_theme/src/conf/contributors.js` — freeze/migrate to UserProfile
- `mstdb_theme/src/lib/stores/user.ts` — extend for profile fields

## Verification (Full Sprint)

1. All Django migrations apply cleanly: `python manage.py migrate`
2. No breaking changes to public API: re-run `api/v2/` endpoints for each entity type
3. Existing `trayectoria` panel still works after `persona_sujeto` → `persona_fuente` rename
4. Capture forms create records visible in Search page
5. Role-based access: collector can create/edit; reviewer can only view progress; registered user can create collections
6. Merge use case: Melchora de los Reyes IDs 7887, 1027, 1762 merge to one canonical record (other IDs with same name are distinct persons)
7. Vocabularies: new entries are auto-lowercased; `short_id` appears in search results

## Decisions & Scope Boundaries

- **Included**: All features listed in `_devplan/052026-devplan.md`
- **Excluded (deferred)**: Fuzzy-merge of existing vocab duplicates (blocked by Merging Elements landing first); full `contributors.js` removal from About page (needs product decision)
- **Assumption**: Existing ViewSets support POST/PATCH/DELETE (standard DRF router behavior — confirmed by router registration)
- **Assumption**: `HistoricalRecords` on models captures `history_user` — needs verification before "personal progress" feature
- **Decision**: `persona_fuente` FK is sufficient for directionality in fam/tmp (no new field); semantics documented in model docstring

## Resolved

- **`short_id` display only** — URL slugs remain as `/Detail/personaesclavizada/{id}` (semantically descriptive enough). `short_id` appears as a secondary reference label in tables and detail pages only.
