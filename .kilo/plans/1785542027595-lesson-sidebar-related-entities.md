# Plan: Lesson Detail Right Sidebar for Related Entities

## Goal

Replace the current bottom-of-page `<ul>` lists for Personas, Documentos, and Corporaciones with a sticky right sidebar using color-coded chips/cards. Include an expand/collapse mechanism when a section has more than 10 items.

## Current State

- **File:** `mstdb_theme/src/routes/(app)/lessons/[id]/+page.svelte`
- Related entities are rendered at the bottom of the page as plain `<ul>` link lists (lines 101–140).
- Layout uses a single-column Bootstrap container (`<div class="container">`).
- Styles live in `mstdb_theme/src/styles/custom.scss`.
- The project uses **Bootstrap 5 + SCSS** (no Tailwind/Skeleton/shadcn). Bootstrap Icons are available.

## Data Shape (already fetched)

| Section | Array | Chip label field | Link pattern |
|---------|-------|-----------------|--------------|
| Personas | `leccion.personas` | `nombre_normalizado \|\| persona_idno` | `/Detail/{personaDetailPath(p)}/{p.persona_id}` |
| Documentos | `leccion.documentos` | `titulo \|\| documento_idno` | `/Detail/documento/{d.documento_id}` |
| Corporaciones | `leccion.corporaciones` | `nombre_institucion` | `/Detail/corporacion/{c.corporacion_id}` |

## Design Decisions

| Decision | Resolution |
|----------|-----------|
| Layout approach | Bootstrap row with `col-lg-8` (body) + `col-lg-4` (sidebar). On `<lg` breakpoints, sidebar collapses below content. |
| Sidebar position | `position: sticky; top: 1.5rem` so it scrolls with the viewport. |
| Entity rendering style | Chips (Bootstrap badge-like `<a>` buttons with `border-radius: 1rem`, colored background). Each chip links to the detail page. |
| Color coding | Personas: `accent1` (#A65D57, terra cotta). Documentos: `info` (#446B8C, dusty blue). Corporaciones: `success` (#3C6B4F, forest green). |
| Expand/collapse | If a section has >10 items, show only the first 10 with a "Ver todos (N)" toggle button. Toggling expands to full list with a "Ver menos" button to collapse. Use a local `boolean` per section (`showAllPersonas`, etc.). |
| Section headers | Small `<h6>` with an icon prefix: `bi-people` (Personas), `bi-file-earmark-text` (Documentos), `bi-building` (Corporaciones). |
| Empty state | If a section is empty, don't render it. If all three are empty, don't render the sidebar column (keep body full-width `col-12`). |

## Implementation Tasks

### 1. Restructure layout to two-column grid

In `+page.svelte`, wrap the `<article class="lesson-detail">` content in a Bootstrap row:

```svelte
<div class="row">
  <div class="{hasSidebar ? 'col-lg-8' : 'col-12'}">
    <!-- existing article content (title, date, badges, body, gallery) -->
  </div>
  {#if hasSidebar}
  <aside class="col-lg-4">
    <div class="lesson-sidebar">
      <!-- sidebar sections -->
    </div>
  </aside>
  {/if}
</div>
```

Compute `hasSidebar` reactively:
```js
$: hasSidebar = leccion?.personas?.length || leccion?.documentos?.length || leccion?.corporaciones?.length;
```

### 2. Remove the old "Entidades relacionadas" section

Delete lines 101–140 (the `<section class="lesson-detail-related">` block).

### 3. Build the sidebar markup

For each non-empty section, render:

```svelte
{#if leccion.personas?.length}
  <div class="sidebar-section sidebar-section--personas mb-4">
    <h6 class="sidebar-section-title">
      <i class="bi bi-people me-1"></i>Personas
      <span class="badge bg-accent2 ms-1">{leccion.personas.length}</span>
    </h6>
    <div class="sidebar-chips">
      {#each visiblePersonas as persona}
        <a href="/Detail/{personaDetailPath(persona)}/{persona.persona_id}"
           class="sidebar-chip sidebar-chip--persona">
          {persona.nombre_normalizado ?? persona.persona_idno}
        </a>
      {/each}
    </div>
    {#if leccion.personas.length > 10}
      <button class="btn btn-sm btn-link sidebar-toggle"
              on:click={() => showAllPersonas = !showAllPersonas}>
        {showAllPersonas ? 'Ver menos' : `Ver todos (${leccion.personas.length})`}
      </button>
    {/if}
  </div>
{/if}
```

Repeat pattern for Documentos and Corporaciones with their respective colors and fields.

### 4. Add reactive sliced arrays

```js
let showAllPersonas = false;
let showAllDocumentos = false;
let showAllCorporaciones = false;

$: visiblePersonas = showAllPersonas ? leccion?.personas : leccion?.personas?.slice(0, 10);
$: visibleDocumentos = showAllDocumentos ? leccion?.documentos : leccion?.documentos?.slice(0, 10);
$: visibleCorporaciones = showAllCorporaciones ? leccion?.corporaciones : leccion?.corporaciones?.slice(0, 10);
```

### 5. Add styles to `custom.scss`

```scss
// Lesson sidebar
.lesson-sidebar {
    position: sticky;
    top: 1.5rem;
}

.sidebar-section-title {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: map-get($theme-colors, "accent2");
    margin-bottom: 0.5rem;
}

.sidebar-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.sidebar-chip {
    display: inline-block;
    padding: 0.3rem 0.65rem;
    border-radius: 1rem;
    font-size: 0.78rem;
    font-weight: 500;
    text-decoration: none;
    color: #fff;
    transition: opacity 0.15s ease, transform 0.1s ease;

    &:hover {
        opacity: 0.85;
        transform: translateY(-1px);
        color: #fff;
        text-decoration: none;
    }
}

.sidebar-chip--persona {
    background: map-get($theme-colors, "accent1");
}

.sidebar-chip--documento {
    background: map-get($theme-colors, "info");
}

.sidebar-chip--corporacion {
    background: map-get($theme-colors, "success");
}

.sidebar-toggle {
    font-size: 0.8rem;
    padding: 0;
    margin-top: 0.4rem;
}
```

### 6. Responsive behavior

- On screens `<992px` (below `lg`), the sidebar column stacks below the body naturally (Bootstrap grid).
- Remove `position: sticky` on small screens via media query:

```scss
@media (max-width: 991.98px) {
    .lesson-sidebar {
        position: static;
        margin-top: 2rem;
    }
}
```

## Files Modified

| File | Change |
|------|--------|
| `mstdb_theme/src/routes/(app)/lessons/[id]/+page.svelte` | Restructure to 2-col layout, add sidebar markup, remove old related-entities list, add reactive state |
| `mstdb_theme/src/styles/custom.scss` | Add `.lesson-sidebar`, `.sidebar-section-title`, `.sidebar-chips`, `.sidebar-chip` (+ modifiers), `.sidebar-toggle`, responsive override |

## Validation

1. Navigate to a lesson with related entities and verify the sidebar renders with color-coded chips.
2. Click a chip and confirm it navigates to the correct detail page.
3. Test with a lesson that has >10 personas/documentos/corporaciones — confirm only 10 show initially with "Ver todos (N)" button, and toggling works.
4. Test with a lesson that has no related entities — verify no sidebar column appears and body is full-width.
5. Resize browser below `lg` breakpoint — confirm sidebar stacks below body content.
6. Verify no visual regression on the lesson body text (max-width: 70ch should still apply within the 8-col space).

## Risks / Notes

- The `lesson-detail-body` has `max-width: 70ch` which will still apply inside `col-lg-8`. This should look fine since `col-lg-8` on a standard container is ~720px and 70ch fits within that.
- If chip text is very long (e.g., a full person name), chips will wrap naturally since they use `inline-block` with `flex-wrap`.
- No new dependencies are needed.
