# Plan: Sabrina's Email Triage (Data-Entry Team Feedback, June 2026)

Context: email from Sabrina (screenshots `temp/screenshots/`, Jun 3 & Jun 7 2026) relaying questions from Julieta (GSR cataloger). Today is 2026-08-30; the platform changed a lot since (SvelteKit public site + new catalogar UI, unified search, lessons). Each point below was verified against current code; status = addressed / partial / open, followed by concrete work items.

## Triage summary

| # | Issue | Status | Work needed |
|---|-------|--------|-------------|
| 1 | Georeferencing: Google Sheet vs website? Beta? | Addressed | Docs/communication only |
| 2 | Transaction place as lugar "0"? | Addressed in code, undocumented & inconsistent help text | Help-text alignment + docs |
| 3 | Only 3 relation types; re-add "Asociativa" | Open (removed intentionally, migration 0009) | Feature: restore `aso` |
| 4 | "Hacienda" as institution type | Addressed | Verify prod row only |
| 5 | Enslaved person ↔ religious + institution at once (Lucrecia) | Model supports; UI partial | Feature: corporación edit route |
| 6 | Search shows no results for "Convento de Santa María de Gracia de Guadalajara" | Likely fixed on current site; `is_published` inconsistency remains | Prod verification + policy decision |
| 7 | "Invalid Date" on public Corporación page (screenshot 1) | Open | Bug fix (serializer + page) |

---

## 1. Georeferencing: website vs Google Sheet — ADDRESSED

Evidence: website place management is production, not beta:
- Create with lat/lon: `mstdb_theme/src/routes/(app)/User/catalogar/lugar/+page.svelte`
- Edit: `mstdb_theme/src/routes/(app)/User/catalogar/lugar/edit/[id]/+page.svelte`
- "Editar lugar" button for collectors on Lugar detail (CHANGELOG 1.2.0)

Actions (no code required):
- Answer Sabrina: georeferencing now happens on the website; the Sheet/Excel flow is legacy.
- Sabrina updates the manual; we provide the accurate workflow description (create/edit lugar on website, coordinates included, `es_parte_de` hierarchy).
- Optional UX: add a short help/tooltip on `catalogar/lugar` pages summarizing the workflow.

## 2. Transaction place = lugar "0" — ADDRESSED IN CODE, UNDOCUMENTED

Current convention (implicit, scattered):
- `PersonaLugarRel.ordinal` default 0 (`mstdb_manager/dbgestor/models.py:660`).
- Old Django form rejects manual 0: `forms.py:422-425` ("0 no es un valor permitido").
- Old help text only mentions ±: `templates/dbgestor/Relaciones/persona_x_lugar.html:36-38`.
- Old detail buckets: `dbgestor/views.py:1259` `ordinal < 1 → "Anteriores"` (mislabels a 0 transaction point as "Anteriores").
- New trayectoria editor reserves/locks ordinal 0 (orange, non-swappable) and rejects 0 on add: `mstdb_theme/src/routes/(app)/User/trayectoria/+page.svelte:267,428-430`.

Actions:
- Answer Sabrina: yes — 0 is the reserved transaction/event place; catalogers enter non-zero ordinals (negative = before, positive = after).
- Fix bucket logic so ordinal 0 renders as "Lugar del evento/transacción", not "Anteriores" (`dbgestor/views.py:1259` and any new-UI equivalent).
- Align help texts: old template `persona_x_lugar.html` and new trayectoria add-panel to state the reserved-0 convention explicitly.
- Document in the manual.

## 3. Restore "Asociativa" relation type — OPEN (FEATURE)

History: `aso` removed intentionally; existing rows converted `aso→tmp` (migration `0009_rename_persona_sujeto_merge_aso_tmp.py`, reverse=noop). Current choices `fam/tmp/sub` at `mstdb_manager/dbgestor/models.py:684-688`, `type_to_string` at 720-728.

Backend:
- Add `('aso', 'Asociativa')` back to `RELACIONES` + `type_to_string`; migration AlterField for `personarelaciones` and `historicalpersonarelaciones`.
- Data policy: do NOT auto-revert tmp→aso (original aso rows are auditable via the historical table if the team ever wants a assisted re-classification); catalogers reclassify manually.

Frontend (all places that enumerate relation types):
- `mstdb_theme/src/routes/(app)/User/catalogar/relaciones/+page.svelte:109-113` (`NATURALEZA_OPTIONS`) + edge color/legend in same file.
- `mstdb_theme/src/routes/(app)/Detail/personaesclavizada/[id]/+page.svelte:710-731` (filter button + tooltip text).
- `mstdb_theme/src/routes/(app)/Detail/personanoesclavizada/[id]/+page.svelte:576`.
- `mstdb_theme/src/routes/(app)/Dashboard/viz/NetworkGraph.svelte:538` (legend).
- `mstdb_theme/src/routes/(app)/Search/SearchNetwork.svelte:409` (legend).
- Old Django UI still serving cataloging: `templates/dbgestor/Relaciones/persona_x_persona.html`.

Guidance (docs): subordinación is NOT mandatory for every enslaved/non-enslaved pair; "Derivar relaciones de subordinación" (old doc page + `management/commands/derive_subordination_rels.py`) is optional; `rol` captures event roles while `sub` relations feed the network viz. Person↔institution "asociativa" cases (religioso ↔ Compañía de Jesús, churches, haciendas) are NOT PersonaRelaciones — use persona↔corporación association (see #5); clarify in manual.

## 4. "Hacienda" as institution — ADDRESSED

- `TiposInstitucion` is a DB table (`models.py:751`), so Sabrina's admin-added row works everywhere; new form loads types from `vocabularios/tipos-institucion/` (`catalogar/corporacion/+page.svelte:88`).
- `hacienda` also added as *place* type (migration `0010_lugar_tipo_fk`, CHANGELOG 1.2.0).
- Action: verify the `hacienda` row exists in production `TiposInstitucion`; if missing, add via Django admin. No code change.

## 5. Lucrecia: link enslaved person to religious AND institution — MODEL OK, UI PARTIAL

Model supports it today:
- Person↔person: `PersonaRelaciones` (`models.py:682`).
- Person↔institution: `Corporacion.personas_asociadas` (`models.py:776`) / `Persona.entidades_asociadas` (`models.py:452`).
- Institution role in document (e.g. owner): `InstitucionRolEvento` (`models.py:823`); person roles: `PersonaRolEvento` (`models.py:734`).

UI gaps:
- Old Django `CorporacionForm` exposes `personas_asociadas` (`forms.py:815`); new create form has it too (`catalogar/corporacion/+page.svelte:11,34`).
- New frontend has NO corporación edit route (only `lugar/edit/[id]` and `leccion/[id]/edit` exist), and no persona form exposes `entidades_asociadas`.

Actions:
- Add `/User/catalogar/corporacion/edit/[id]` route mirroring `lugar/edit/[id]` (+page.js load + form): nombre, tipo, nombres_alternativos, lugar_corporacion, documentos, personas_asociadas, notas; wire "Editar" button on `Detail/corporacion/[id]` for collectors (pattern: Lugar detail "Editar lugar").
- Optionally expose `entidades_asociadas` in persona edit surface (v2 write serializers already accept M2M pk lists).
- Document the Lucrecia pattern in the manual: assign owner role to both (persona + institución) via roles, PLUS persona↔persona relation and persona↔institution association as needed.

## 6. Convento search "glitch" — LIKELY FIXED; POLICY INCONSISTENCY REMAINS

Root cause at the time: old public site used per-entity search actions that filter `is_published=True` (`api/v2/views.py:323,456,756,1006`); migration `0002` added `is_published` default False with NO data migration for core entities (only lecciones got `0016_publish_existing_lecciones`) → every pre-existing corporación was unpublished → empty results, while detail pages (unfiltered) still worked. Exactly the reported symptom.

Current state: SvelteKit frontend uses unified `/api/v2/search/` (`SearchAPIView`, `views.py:1404`) which does NOT filter `is_published` → convent should be found if the record exists.

Actions:
- Verify in production: `GET /api/v2/search/?q=Convento de Santa María de Gracia&type=corporacion`; confirm the record exists (if never cataloged, it's a data-entry task, not a bug).
- Decide `is_published` policy for core entities: (a) data migration publishing all existing rows (mirror `0016`) and keep the field as future editorial control, or (b) drop the `is_published` filters from the four per-entity search actions (recommended if no publish UI will exist for these entities, unlike lecciones). Also reconcile `SearchAPIView` docstring ("published records") with code.

## 7. "Invalid Date" on Corporación page — OPEN (BUG)

- `CorporacionDetailSerializer` omits `created_at/updated_at/notas/personas_asociadas/eventos` (`api/v2/serializers.py:429-432`) while the page reads all of them: `mstdb_theme/src/routes/(app)/Detail/corporacion/[id]/+page.svelte:46-52,58-102,106-109` → "Invalid Date" and never-rendered Personas/Eventos sections. Other detail serializers do include timestamps (e.g. `DocumentoDetailSerializer:269-273`).
- Wrong icon alt text "Persona Esclavizada" at line 35.

Actions:
- Extend `CorporacionDetailSerializer` with `notas`, `created_at`, `updated_at`, nested `personas_asociadas` (mirror v1beta serializer `api/v1beta/serializers.py:143-150`) and eventos/documentos refs the page consumes.
- Page: use `formatDate` for both date blocks (or drop the duplicate footer), fix alt text to "Corporación".
- Audit other Detail pages' raw `new Date(...)` (personaesclavizada:814/824, personanoesclavizada:659/669, documento:158/168) — serializers include timestamps there, but guard with `formatDate` for consistency.

---

## Phasing

- **Phase 1 — fixes & verification (quick wins):** #7 serializer+page bug; #6 prod verification + is_published decision/migration; #4 prod row check.
- **Phase 2 — features:** #3 restore Asociativa (backend + 6 UI spots); #5 corporación edit route (+ optional `entidades_asociadas` in persona edit).
- **Phase 3 — docs/UX alignment:** #1 & #2 manual inputs for Sabrina, help-text alignment (old template + trayectoria UI + bucket fix `dbgestor/views.py:1259`), subordinación-vs-rol guidance.

Per AGENTS.md: update `CHANGELOG.md [Unreleased]` per phase and commit per phase.

## Verification

- Backend: `python manage.py makemigrations --check` / migrate in container; hit `GET /api/v2/corporaciones/{id}/` (dates + associations present) and `/api/v2/search/?q=convento&type=corporacion`.
- Frontend: `cd mstdb_theme && npm run build`; `npx prettier --check` on touched files (no svelte-check in repo).
- Manual QA: corporación page shows real dates/personas/eventos; relaciones editor offers Asociativa; network legends show 4 types; corporación edit saves `personas_asociadas`; trayectoria add-panel help text states reserved-0 convention.
- Accessibility (WCAG 2.1 AA) for new/edited UI: labels, focus states, legend contrast, alt text.

## Open questions for the team

1. Revert former `aso` rows (now `tmp`) back to Asociativa? Default proposal: no auto-revert; optional assisted reclassification via historical-table audit.
2. `is_published` policy for core entities: publish-all migration vs remove filters (recommended: remove, keep only for lecciones).
3. Does the Convento record exist in production, or was it never cataloged?
4. Is the old Django cataloging site (`db.trayectoriasafro.org`) still receiving fixes, or frozen in favor of the SvelteKit catalogar UI? (Determines whether we patch its templates/help texts in Phase 3.)
