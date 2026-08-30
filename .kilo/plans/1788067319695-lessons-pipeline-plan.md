# Lessons Pipeline: Auth UX, Ownership/Collaboration, Draft/Publish, Rich Media

## Goal

Build a seamless pipeline for adding, managing, and publishing lessons ("Lecciones Educativas"): fix the post-login redirect, add profile to the navbar, add draft/publish workflow, an owner/collaborator permission system, and a rich-media WYSIWYG editor (YouTube, PDF, IIIF, images, generic iframes).

## Resolved Decisions

| Decision | Choice |
|---|---|
| Lesson creation access | Only `is_staff` or group `colectores` can create lessons |
| Staff bypass | `is_staff` users bypass all object-level permissions |
| Embed UX | One generic "Embed" button; URL auto-detect (YouTube/PDF/IIIF/image/generic iframe) |
| IIIF | Iframe embedding (no Mirador/Universal Viewer integration) |
| Return-after-login | `?next=` URL parameter (validated to start with `/` to prevent open redirects) |
| Draft visibility | Drafts visible only to lesson owners/collaborators/staff; public list/detail only show published |
| Adding collaborators | Owner types a username; validated against a new user-lookup endpoint (no autocomplete, no email invites) |
| Publish permission | Only owners and staff can publish/unpublish; collaborators edit content only (no publish, delete, or access management) |
| Editor scope | Moderate upgrade: embeds + captions (figcaption) + blockquote button + horizontal rule + strikethrough. No tables/alignment/color (no new Tiptap deps) |
| Landing page auth entry | Floating corner link at top-right of hero: "Entrar" when logged out, username/profile when logged in (no full navbar on landing) |

## Architecture Notes

### Auth (current state)
- Django session + CSRF cookies; no JWT. API base `/api/v2/`.
- Login (`src/routes/(app)/User/login/+page.svelte:74`) hardcodes `window.location.href = '/User'`.
- Root `+layout.svelte` calls `whoami()` only to compute `canEdit` (line 34); **user store is never hydrated on page load**. Navbar auth dropdown is commented out (lines 107–138). Footer login link at lines 182–187.
- Duplicated footer also exists in `src/routes/(landing)/+page.svelte`.
- No `hooks.server.js` / `hooks.client.js`. Each protected page does its own `onMount` + `whoami()` + redirect.

### Lessons (current state)
- `Leccion` model: `mstdb_manager/dbgestor/models.py:853–896`. Fields: `leccion_id` (PK), `title`, `body` (bleach-sanitized HTML), M2M `levels/keywords/personas/documentos/corporaciones`, `created_at`, `updated_at`. **No** `is_published`, no `created_by`, no `HistoricalRecords`.
- `LeccionImagen` model at 899–910.
- API: `LeccionViewSet` at `api/v2/views.py:1040–1069`, registered in `api/v2/urls.py:32` at `/api/v2/lecciones/`. `BaseV2ViewSet.get_permissions()` (views.py:153–157) requires only `IsAuthenticated` for writes — any authenticated user can create/update/delete any lesson. No `get_queryset` user scoping.
- Bleach allow-lists: `dbgestor/models.py:16–25` (`LECCION_BODY_ALLOWED_TAGS/ATTRS`).
- Editor: Tiptap 3.28 (`@tiptap/core`, `starter-kit`, `extension-image`) in `src/lib/components/forms/RichTextEditor.svelte`. No embed/iframe/video extension exists.
- Preview exists at `/User/catalogar/leccion/[id]` (management panel). Edit form at `[id]/edit/`. Create form at `/User/catalogar/leccion/`.
- `catalogar/+layout.svelte` gates ALL catalogar routes to `is_staff || colectores`.
- No user→entity link model exists anywhere. `UserProfile.role` (`cataloguers/models.py`) is informational only.

## Implementation Tasks

### Phase 1 — Auth UX

1. **Return-after-login via `?next=`**
   - In `login/+page.svelte:74`, replace the hardcoded redirect:
     ```js
     const next = new URLSearchParams(window.location.search).get('next');
     window.location.href = next && next.startsWith('/') ? next : '/User';
     ```
   - Update every protected page that redirects to `/User/login` (from exploration): `User/+page.svelte`, `User/profile/+page.svelte`, `User/trayectoria/+page.svelte`, `User/catalogar/relaciones/+page.svelte`, `User/catalogar/lugar/edit/[id]/+page.svelte`, `catalogar/+layout.svelte`. Redirect to `/User/login?next=${encodeURIComponent(pathname + search)}`.
   - Add a small shared helper (e.g. `src/lib/auth.ts`): `loginUrl(currentPath)` returning the `?next=`-suffixed login URL; use it in all redirects.

2. **Hydrate user store globally**
   - In root `+layout.svelte` `onMount`, set the store from `whoami()`: `user.set(u)`, derive `canEdit` from the store (`$user.is_staff || $user.groups?.includes('colectores')`). Keep the `.catch(() => user.set(null))`.
   - Optionally remove now-redundant per-page `whoami()` calls in pages that consume `$user`, but keep this low-risk (only touch pages whose behavior depends on the store).

3. **Enable navbar auth dropdown (profile button)**
   - Uncomment lines 107–138 in `+layout.svelte`; add "Perfil" → `/User/profile` item; show `$user.username` as the dropdown label (or keep the person icon with `aria-label`). Keep footer login link as-is (user wants it kept).
   - Apply the same auth dropdown treatment to the landing page footer's conditional (lines 285–290 of `(landing)/+page.svelte`) — switch it from `canEdit` to `$user` so non-`colectores` logged-in users see "Panel de control" too. Extract a shared footer component only if trivial; otherwise update both copies.
   - Ensure `handleLogout` still clears the store and redirects.

4. **Welcome message after login**
   - In `login/+page.svelte` after successful login, set `sessionStorage.setItem('ta_welcome', username)` before redirecting.
   - In root `+layout.svelte` `onMount`, read+clear that key; if present, show a dismissible Bootstrap alert ("Bienvenido/a, {username}") above `<slot />`. Accessible (aria-live="polite", dismissible button with label).

5. **Landing page floating auth link**
   - In `(landing)/+page.svelte`, add an absolute-positioned link at the top-right of the hero:
     - Logged out (`!$user`): "Entrar" → `/User/login`.
     - Logged in: username (or person icon + username) → `/User/` (panel).
   - Consume `$user` from the store (root layout hydration runs for the landing page too, since it renders inside root `+layout.svelte`).
   - Style in the global stylesheet (`custom.css`/`custom.scss`), WCAG AA contrast against the hero background, visible focus state.

### Phase 2 — Backend: Ownership, Collaboration, Draft/Publish

6. **Model changes** (`dbgestor/models.py`)
   - `Leccion`:
     - `created_by = ForeignKey(settings.AUTH_USER_MODEL, on_delete=SET_NULL, null=True, blank=True, related_name='lecciones_creadas')` (pattern mirrors `SugerenciaMerge.suggested_by`).
     - `is_published = BooleanField(default=False, help_text="Indicates if the lesson is published in the API")` (mirror other entities).
     - `history = HistoricalRecords()` (enables per-user contribution tracking).
   - New model `LeccionAcceso` (through-model for user↔lesson roles):
     ```python
     class LeccionAcceso(models.Model):
         ROLES = [('owner', 'Propietario/a'), ('collaborator', 'Colaborador/a')]
         leccion = ForeignKey(Leccion, on_delete=CASCADE, related_name='accesos')
         user = ForeignKey(settings.AUTH_USER_MODEL, on_delete=CASCADE, related_name='lecciones_accesos')
         role = CharField(max_length=20, choices=ROLES, default='collaborator')
         created_at = DateTimeField(auto_now_add=True)
         class Meta:
             unique_together = ('leccion', 'user')
             verbose_name = 'Acceso a lección'
     ```
   - Data migration: set `is_published=True` for **all existing** lessons so the public site does not lose content (they were all public before).

7. **API serializers** (`api/v2/serializers.py`)
   - `LeccionListSerializer`: add `is_published`, `owner_names`/`access_summary` (or rely on detail).
   - `LeccionDetailSerializer`: add `is_published`, `created_by`, and `accesos` (nested: `leccion_acceso_id`, `username`, `role`) — serialized **only when request user is owner/collaborator/staff** (build via `to_representation` check).
   - `LeccionWriteSerializer`: add `is_published` (write-only allowed only for owners/staff — enforced in the view, not serializer).
   - New `LeccionAccesoWriteSerializer`: `{ username, role }` for adding users; `LeccionAccesoSerializer` for reads.
   - Include `is_owner` / `can_edit` / `can_delete` booleans in the detail representation for the current request user (frontend can render buttons without extra calls).

8. **API permissions** (`api/v2/views.py`, `LeccionViewSet`)
   - Helper methods on the viewset:
     ```python
     def _is_staff(self): return self.request.user.is_staff
     def _acceso(self, leccion): return LeccionAcceso.objects.filter(leccion=leccion, user=self.request.user).first()
     ```
   - `get_queryset()`: anonymous → `filter(is_published=True)`; staff → all; authenticated → `filter(Q(is_published=True) | Q(leccion_id__in=LeccionAcceso.objects.filter(user=user).values('leccion_id')))`.
    - `get_permissions()` override:
      - `create` → `IsAuthenticated` + **group check** `user.groups.filter(name='colectores').exists() or user.is_staff` (returns 403 otherwise).
      - `update`/`partial_update` → authenticated + object-level: staff OR `LeccionAcceso` exists for user (owner **or** collaborator). Additionally, collaborators may not flip `is_published` or modify `accesos` — reject in `perform_update` if payload changes those and user is not owner/staff.
      - `destroy` → staff OR `role == 'owner'` only.
   - Access management endpoints (owner/staff only) on the viewset:
      - `GET lecciones/{id}/accesos/` → list
      - `POST lecciones/{id}/accesos/` → `{username, role}`; owner can self-add other owners; creator is auto-inserted as owner on `perform_create`.
      - `PATCH/DELETE lecciones/{id}/accesos/{acceso_id}/` → change role / remove. Guard: cannot demote or remove the last owner.
   - `perform_create`: set `created_by=self.request.user` and create a `LeccionAcceso(role='owner')` for the creator.
   - Enforce "cannot delete/remove last owner" and "collaborator cannot publish" as server-side rules (single source of truth).

9. **Register the new model in admin** (`dbgestor/admin.py`): inline `LeccionAcceso` in `LeccionAdmin`, show `is_published`/`created_by` columns.

10. **User-lookup endpoint** (`api/v2/views.py` + `urls.py`)
   - `GET /api/v2/users/lookup/?username=<fragment>` — requires `IsAuthenticated` + (`is_staff` OR group `colectores`).
   - Case-insensitive `icontains` match on `username`; returns up to 10 results: `{ username, first_name, last_name }`. No email exposed.
   - Edge case (accepted): a non-`colectores` user promoted to owner by staff cannot manage collaborators via the UI (lookup is gated). Documented, not blocked.

### Phase 3 — Frontend: Lesson Pages

11. **Public listing** (`(app)/lessons/+page.svelte`)
   - Add "Nueva lección" button (top-right of the filter bar) linking to `/User/catalogar/leccion` — shown only when `$user.is_staff || $user.groups?.includes('colectores')`.
   - Card badges: show "Borrador" badge for unpublished lessons when the current user has access (derive from `is_published` in the list payload).

12. **Public detail** (`(app)/lessons/[id]/+page.svelte`)
    - Replace the `canEdit` group-only check with object-level fields from the API (`can_edit`/`can_delete` from the detail payload). Show "Editar" (→ `/User/catalogar/leccion/{id}/edit`) when `can_edit`, and "Administrar" (→ `/User/catalogar/leccion/{id}`) when `can_edit`.
    - Keep `{@html}` rendering (backend sanitizes), but the CSS must now style new embed nodes (see Phase 4).

13. **Relax catalogar layout for lesson routes**
    - `User/catalogar/+layout.svelte`: keep the `colectores/staff` gate for non-lesson routes; for `/User/catalogar/leccion*` routes allow **any authenticated user** (since collaborators/owners may not be colectores). Redirect to `/User/login?next=...` for unauthenticated users.
    - Update `User/catalogar/leccion/[id]/+page.svelte` and `[id]/edit/+page.svelte` to use object-level `can_edit`/`can_delete` instead of `$hasPerm`/group checks. Replace `$hasPerm('dbgestor.delete_leccion')` gate with `can_delete`.

14. **Create/edit form** (`User/catalogar/leccion/+page.svelte` and `[id]/edit/+page.svelte`)
    - Extract the shared form (fields + RichTextEditor + MultiSelects) into a reusable `LeccionForm.svelte` component; create and edit pages become thin wrappers (they are currently near-duplicates).
    - On create: payload includes `is_published: false`; after `createLeccion` succeeds, redirect to `/User/catalogar/leccion/{id}/edit` with a "Borrador guardado" toast (replaces the current static success panel) so the user can keep working seamlessly.
    - On save (create and edit): keep the user on the edit page with a save-confirmation toast; do not navigate away.
    - Add a **"Vista previa"** button on the edit page linking to `/User/catalogar/leccion/{id}` (existing preview panel) — opens in a new tab (`target="_blank"` + `rel="noopener"`).
    - Add a **status control** (Borrador / Publicado) in the form — visible/editable only for owners/staff (hidden for collaborators, with a note that only owners publish). Label in a `<fieldset>` with a visible legend for accessibility.
    - Add a **collaborators manager** (owners/staff only): list of `accesos` with role badges; "Añadir usuario" — username text input validated live against `GET /api/v2/users/lookup/` (shows matched full name before confirming), role select (Propietario/Colaborador); remove/role-change buttons; calls the new access endpoints. Client-side guard mirrors server rule: last owner cannot be removed/demoted.
    - **Unauthorized access**: if the detail fetch returns 404/403 (user has no access), render a clear "No tienes permiso para ver/editar esta lección" state instead of a blank page.
    - Image upload stays post-first-save (needs `leccionId`) — unchanged.

### Phase 4 — Rich Media Embedding

15. **Editor upgrade: custom Tiptap `Embed` extension + toolbar additions**
    - New block node with `src` attribute; renders:
      ```html
      <figure class="lesson-embed lesson-embed--{type}">
        <div class="lesson-embed__frame"><iframe src="{src}" ... allowfullscreen loading="lazy"></iframe></div>
        <figcaption>…</figcaption>
      </figure>
      ```
    - `type` detection helper (pure function, unit-testable):
      - **YouTube**: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`, `/shorts/` → `https://www.youtube-nocookie.com/embed/{id}` (privacy-enhanced).
      - **PDF**: `.pdf` in URL → render `<iframe>` (browsers render PDFs natively).
      - **Image**: image extension (`.png/.jpg/.jpeg/.gif/.webp/.svg`) → insert as `figure > img + figcaption` (see caption support below).
      - **IIIF/generic**: everything else (Gallica `ark:`/`view3if` links, any embeddable page) → generic `<iframe>`.
    - Toolbar "Insertar embed" button → modal with URL input, live-detected type preview, confirm. Also implement `handlePaste` so pasting a bare embeddable URL creates an embed node.
    - Store only `src` (+ optional `title`/`caption`) in the document; no inline `style` — sizing handled by CSS with `aspect-ratio: 16/9` for iframes, `width:100%` for responsive behavior.
    - **Caption support**: images and embeds render as `figure > (img|iframe) + figcaption`. Existing image upload keeps working; caption added via a small inline input on the selected node.
    - **Additional toolbar buttons** (all from already-installed StarterKit, no new deps): blockquote, horizontal rule (`<hr>`), strikethrough.
    - Accessibility: iframes get a `title` attribute; toolbar buttons get `aria-label` and keyboard operability; `loading="lazy"`.

16. **Bleach allow-list update** (`dbgestor/models.py:16–25`)
    - Tags: add `figure`, `figcaption`, `iframe`, `div`, `hr`.
    - Attrs: `iframe: ['src','title','allowfullscreen','frameborder','width','height','loading']`; `figure/div: ['class']`. **Do not allow `style`** on any tag (XSS surface).
    - Add server-side URL validation for `iframe src` and `img src`: must be http(s), reject `javascript:`/`data:`.

17. **Embed/figure CSS** (per repo rule: `mstdb_theme/src/lib/styles/custom.css` or existing global stylesheet — no component-scoped styles)
    - `.lesson-embed` responsive rules (aspect-ratio 16/9, max-width 100%), iframe border 0, `figure`/`figcaption` styling for both images and embeds, print-friendly fallback. Applied to both editor preview and public render.

### Phase 5 — UX Polish

18. **Tiptap toolbar accessibility pass** on `RichTextEditor.svelte`: ensure all toolbar buttons have `aria-label`/`title`, keyboard focusable, `aria-pressed` state; keep contrast AA.
19. **Empty/edge states** on `/lessons`: "No hay lecciones publicadas" message; confirm dialogs already exist via `ConfirmDelete` — keep.
20. **Keyboard + focus**: add visible focus styles for navbar dropdown and welcome alert (WCAG AA).

## Risks & Edge Cases

- **Existing lessons become drafts** → mitigated by data migration setting `is_published=True`.
- **Open redirect** via `?next=` → validate `next.startsWith('/')` and not `//host`.
- **Last owner removal/self-demotion** → server-side guard in access endpoints.
- **Collaborator publishing** → `perform_update` rejects `is_published`/`accesos` changes unless owner/staff.
- **`style` attribute in pasted Gallica embeds** → pasted HTML is sanitized by the editor/bleach; the custom paste handler normalizes to our figure markup. Document that arbitrary inline styles won't persist (by design).
- **iframe XSS / tracking** → YouTube uses `youtube-nocookie`; `iframe src` validated http(s); `title` required.
- **Dual footers / dual layouts drift** → keep changes mirrored in both footer copies; consider extraction if the diff grows.
- **`LeccionImagen` upload URL** still served at `/media/` — unchanged.

## Validation

- **Backend**: add DRF tests (new file `mstdb_manager/api/v2/tests/test_leccion_permissions.py`):
  - anonymous cannot see drafts; can see published
  - colectores/staff can create; plain user cannot
  - owner/collaborator can edit; collaborator cannot delete/publish/manage access
  - last-owner removal rejected
  - run `python manage.py makemigrations dbgestor api && python manage.py migrate` and the test suite (`python manage.py test api.v2`)
- **Frontend**: `cd mstdb_theme && npm run build`; `npx prettier --check src/...` on touched files. Repo has no svelte-check.
- **Manual smoke** (against running containers):
  - login from `/lessons` → returns to `/lessons` with welcome message
  - navbar shows profile dropdown; Perfil link works
  - create lesson as colectores → draft; not in public list; publish → appears
  - add collaborator (plain user) → can edit but not delete/publish
  - embed YouTube/PDF/Gallica IIIF URL in editor → renders responsively on public page
  - refresh page → session persisted, store hydrated, buttons correct

## Out of Scope

- Full IIIF viewer integration (Mirador/Universal Viewer)
- Ownership/collaboration for other entities (Persona/Documento/etc.) — pattern can be reused later
- Email verification / password reset flows
- Email/notification when a user is added as collaborator (no email infrastructure)
- Versioned lesson history UI (simple-history is only for attribution counts)
- Tables, text alignment, text color in the editor
