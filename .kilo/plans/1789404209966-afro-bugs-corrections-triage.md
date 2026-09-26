# Plan — 6 bugs/correcciones Trayectorias Afro (Search, Viz, Archivos, Vocab, Valor)

> Origen: lista de 6 puntos del usuario (14-sep-2026). Stack: Django+DRF `mstdb_manager` (Docker-only, `uv`), SvelteKit SPA `mstdb_theme` (`adapter-static` + `fallback: index.html`, `nginx.conf` proxy `/api/`), D3+Leaflet, PG FTS+trigram.

## 0. Resumen y decisiones ya tomadas con el usuario

| # | Tema | Decisión |
|---|------|----------|
| 1 | Back lleva a landing | Es botón **Atrás del navegador** (no botón UI). Alcance confirmado: arreglar historial + navegación interna sin recargas. |
| 2 | Personas-por-lugar Aguascalientes 1800-1826 → "No se encuentran resultados" | Drill-down debe ser **OR: trayectoria (`PersonaLugarRel`) O `procedencia` (FK)**. No solo procedencia, no AND. Además corregir pérdida de `archivo_id` en `Search/+page.js`. |
| 5 | `huido/huído/hullo/huyo/huyeron/escap*/busque` | Nuevo **vocabulario canónico + alias**: `ConductaTerm{canonico, aliases[]}` + filtro `conducta_canonica` + backfill + UI gestión en catalogar. Mantener texto libre original. |

## 1. Hallazgos (causas raíz verificadas en código)

### Bug 1 — Back → landing
- `mstdb_theme/src/lib/unified-store.js:38-61,442-482`: `updateUrlWithFilters()`, `performSearch()`, `clearSearch()` usan **`window.history.replaceState`** siempre. Cambios de filtros/página/tab/query nunca crean entrada de historial → Atrás salta hasta la última navegación `push` (a menudo landing).
- Navegaciones con recarga completa rompen SPA history: `(landing)/+page.svelte:41` `window.location.href=/Search/?q=...`, `Dashboard/viz/PlacePeople.svelte:129` `window.location.href=/Search?...`, `+layout.svelte:42` logout `window.location.href='/'`. Correctos: `Archivos/+page.svelte:37` y `Search/EntityTable.svelte:31` ya usan `goto`.
- `Search/+page.svelte:76-96` + `Search/+page.js:3-24` solo leen URL en `onMount`; no hay sincronización `popstate`/`afterNavigate` store↔URL. Si el usuario da Atrás, el store no se restaura.
- `svelte.config.js`: `adapter-static` + `fallback index.html` + `nginx.conf:72-74` SPA fallback. Sospecha secundaria (no confirmada): si alguna navegación genera URL sin trailing slash (`/Search` vs `/Search/`) el fallback puede resolver a `/`. Verificar en QA.

### Bug 2 — Círculo Aguascalientes → sin resultados
- `Dashboard/viz/PlacePeople.svelte:122-130` `navigateToSearch` envía `{tab, procedencia: lugar_id, fecha_documento__gte: year, fecha_documento__lte: year+1}` vía `window.location.href=/Search?...` (sin slash final).
- `api/v2/views.py:3050-3070` `PlacesPeopleDistribution` cuenta por **`p_x_l_pere__lugar` + `p_x_l_pere__documento__fecha_inicial`** (trayectoria). Backend `_apply_form_filters:1603-1604` filtra `procedencia` solo por **FK `procedencia__lugar_id`** (origen). Desajuste semántico trayectoria≠procedencia → 0 resultados. Usuario pide OR.
- Ventana fecha: círculo es 1 año pero se envía `year → year+1` (2 años: `YYYY-01-01` a `(YYYY+1)-12-31` por expansión en `views.py:1609-1618`). Debe ser mismo año.
- `Search/+page.js:10-15` extrae `filters` excluyendo `q, archivo_id, tab, view`; `Search/+page.svelte:88-95` ignora `archivoId` (nunca hace `setFilters`). `Archivos/+page.svelte:36-38` navega con `?archivo_id=X` pero el filtro real es `archivo` (`columns.js:233-239`, backend `views.py:1573-1574` `documentos__archivo__archivo_id`). Resultado: entrar desde Archivos tampoco filtra. Mismo patrón afecta drill-down si se reutiliza.

### Bug 3 — "¿Cantidades Archivos se actualizan automáticamente?"
- Sí, hoy es **live**: `Archivos/+page.svelte:11-22` llama `fetchArchivos()` → `api.js:269` `archivos/` → `ArchivoListSerializer.get_documento_count:68-69` `obj.documento_set.count()`. Sin caché (`cache_utils.py` no se usa aquí), sin timestamp, sin fallback si falla (solo `console.warn`), sin indicador "en vivo".
- Problemas: N+1 (`count()` por archivo), cuenta **sin filtrar `is_published`**, `archivos.js:287` tiene entrada `archivo_id: null` (Orizaba/Córdoba) que nunca muestra conteo, conteo estático `archivos.js` vs DB pueden divergir en `nombre_abreviado`.

### Bug 4 — Mapa Trayectorias: lento + clic difícil + São Tomé en Brasil
- Backend `views.py:2493-2648` `aggregated(include_timeline=1)`: `qs.iterator(chunk_size=200)` + `_build_persona_points` por persona en Python (prefetch `p_x_l_pere__lugar/documento`), sin paginación/límite/bbox. Respuesta completa siempre. Caché 600s (`cache_visualization`) ayuda solo en repetición con idéntica querystring.
- Frontend `ArcsMap.svelte`: carga todo (`loadData:197-224`), dibuja todos los `visibleRoutes` con transiciones D3 220ms, partículas rAF `drawParticles:501-511` recalcula `arcGeometry→projectPoint→latLngToLayerPoint` **por partícula por frame** (hasta 80). `renderArcs` usa `stroke-width log`, `opacity 0.06-0.85`; sin área de golpeo ancha. `renderMarkers:381-413` **no tiene `click/keydown`** (solo tooltip hover) → lección "clic en lugar" falla. Solo arcos abren `RouteDetailPanel`. Tiles van por proxy `tiles.py` + `ArcsMap.svelte:234` `tiles/light_nolabels` (correcto, cache 7d).
- São Tomé: error de datos `Lugar.lat/lon`. Edición existe (`User/catalogar/lugar/edit/[id]`, mapa clic→marcador, `lugar/+page.svelte` crear). Falta QA y validación.

### Bug 5 — Variación `huído`
- `models.py:587` `PersonaEsclavizada.conducta TextField` libre; `forms.py:311` label "Registros de conducta". Filtro `conducta__icontains` (`columns.js:212-218`, `views.py:1605-1608`, `crosstab.py:251-254`). `search_vector` Persona (`signals.py:42-54`, `populate_search_vectors.py:83-99`) **no incluye `conducta/marcas/salud`** → FTS `q=huido` no lo encuentra; solo filtro exacto substring. Sin `unaccent` → `huido≠huído`. Sin expansión alias → `hullo/huyo/huyeron/escap*/busque` invisibles.
- Vocabs existentes (`Calidades/Hispanizaciones/Etonimos`) usan `save().lower()` + `VocabBaseViewSet` + `_VocabUpsertMixin.title()` — patrón a reutilizar.

### Bug 6 — Valor/costo + procedencia en tabla resultados
- Ya existe a medias: `models.py:263-265` `Documento.evento_valor_sp/forma_de_pago/total` (CharField libre); `views.py:406-411` anota `evento_*_list` (StringAgg) en `PersonaEsclavizadaViewSet.list` y `SearchAPIView:1957-1966`; `serializers.py:115-117` expone `evento_*_list`; `columns.js:37-44` define columnas (ocultas por defecto, `sortable:true`).
- Gaps: `ORDERING_FIELDS personaesclavizada (views.py:1432-1440)` **no incluye `evento_*`** → ordenar falla a default; `renderCellValue (columns.js:401-453)` no formatea listas evento; `Detail/documento/+page.svelte` **no muestra valor** (solo Django template `documento.html:27-28` lo muestra); `Detail/personaesclavizada` no muestra valor ni procedencia enlazada; CSV usa `flatten_for_csv` genérico (IDs con `;`). `evento_valor_sp` es texto libre → no agregable (promedio/histograma) sin normalización. Crosstab no tiene `avg_valor`.

## 2. Plan por bug (tareas ordenadas, ejecutable por otro agente)

### A. Bug 1 — Historial navegador (prioridad alta)
1. **Auditoría navegación**: `grep window.location.href` en `mstdb_theme/src`; clasificar en (a) cambio de ruta SPA → migrar a `goto`, (b) logout/login `?next=` → mantener reload solo donde se requiera recargar sesión.
   - Archivos a tocar: `(landing)/+page.svelte:37-43`, `Dashboard/viz/PlacePeople.svelte:122-130`, `+layout.svelte:32-36,38-43`, `User/*` (solo si aplica).
   - Usar `import { goto } from '$app/navigation'; goto('/Search/?...', { keepFocus:false })`. Respetar trailing slash `/Search/` (ver `Archivos/+page.svelte:37` como referencia).
2. **Política push vs replace en `lib/unified-store.js`**:
   - `updateUrlWithFilters`, `performSearch`, `clearSearch`, `setPage/Size`, `setActiveTab`, `setViewMode`, `setFilter/Filters`, `toggleSort`: añadir param `{push:false}` por defecto `replace`; usar `push:true` (via `goto(...,{replaceState:false})` o `history.pushState`) para acciones significativas: `performSearch`, `clearSearch`, cambio de `tab`, cambio de página, drill-down externo. `replace` para keystrokes/debounce/filtros intermedios.
   - Incluir en URL: `q, tab, view, page, page_size, ordering, exact` + `filters`. Hoy `updateUrlWithFilters` omite `q/page/ordering` → Atrás pierde contexto.
   - Centralizar construcción URL en helper `buildSearchUrl(state)` usado por store + `+page.js` + drill-downs.
3. **Restaurar estado en Atrás/Adelante**: en `Search/+page.svelte` suscribirse a `afterNavigate` + `popstate`: parsear `url.searchParams` → `setFilters/tab/page/query/view` sin disparar `push` (flag `fromPop`). Alternativa SvelteKit: mover lógica a `+page.js load({url})` reactivo + `invalidate`. Elegir una y documentar.
4. **Breadcrumbs "Volver a resultados"** (complemento, no sustituto): en `Detail/*/[id]` añadir enlace que use `history.state` o `document.referrer` si viene de `/Search/` o `/Dashboard/`; fallback a `/Search/`. Accesible (`aria-label`, foco visible). No usar `history.back()` ciego.
5. **Validación**: Playwright (nuevo o existente en `.playwright-mcp/`): `landing → search q → filtro → paginación → detail → Back → espera Search con mismo q/filtros/página` (3 pasos atrás). Probar también `Dashboard/personas-por-lugar → Search → Back`. Manual: Chrome/Firefox, móvil.

### B. Bug 2 — Drill-down Personas-por-lugar (prioridad alta)
1. **Backend OR trayectoria/procedencia** (`api/v2/views.py:_apply_form_filters` + `api/v2/crosstab.py:_apply_form_filters` + `SearchNetworkAPIView._build_filtered_person_queryset` si aplica):
   - Nuevo param soportado: `lugar_any=<id>` → `Q(p_x_l_pere__lugar__lugar_id=id) | Q(procedencia__lugar_id=id)` + `.distinct()`.
   - Mantener `trayectoria_lugar` y `procedencia` actuales por compat. Documentar en `api/v2/README.md`.
   - Si se prefiere no añadir param: cambiar semántica de `procedencia` a OR — desaconsejado (rompe filtros existentes); usar `lugar_any`.
2. **Frontend `PlacePeople.svelte:122-130`**:
   - `navigateToSearch(lugar_id, year)`: enviar `{tab:'personaesclavizada', lugar_any: lugar_id, fecha_documento__gte: String(year), fecha_documento__lte: String(year)}` (mismo año, no `year+1`), usar `goto('/Search/?'+params)` (no `window.location.href`, con slash).
   - Pasar también rango visible como contexto? No: el círculo es 1 año; si se quiere rango del filtro viz (1800-1826) usar `yearRangeMin/Max` — decidir: **círculo = 1 año** (recomendado, coincide con tooltip `Año/Personas`).
   - Añadir `aria-live` confirmación "X personas en <lugar> <año> → ver en Search".
3. **Fix `archivo_id` perdido** (`Search/+page.js` + `+page.svelte:88-95`):
   - Mapear `?archivo_id=X` → `setFilters(tab, {archivo: X})` (o renombrar filtro a `archivo_id` en ambos lados — elegir uno; recomendado mapear en `+page.js` para no romper API). Aplicar también a `?tab=` + `?view=`.
   - Unificar con helper `buildSearchUrl` del bug 1.
4. **Contrato `PlacesPeopleDistribution`**: documentar que `count` = personas distintas con `PersonaLugarRel` en ese `lugar+año` (fecha doc). Si OR añade procedencia sin fecha doc, el conteo viz y Search pueden diferir en ±1 — añadir nota UI "El conteo del gráfico cuenta trayectoria; Search OR incluye procedencia".
5. **Validación**: reproducir caso exacto: `personas-por-lugar → Aguascalientes, 1800-1826 → clic círculo → Search muestra >0`. Test API: `search/?type=personaesclavizada&lugar_any=<id>&fecha_documento__gte=1805&fecha_documento__lte=1805`. Test `?archivo_id=` desde Archivos.

### C. Bug 3 — Archivos: conteos "¿se actualizan?"
1. **Backend**: en `ArchivoViewSet`/`ArchivoListSerializer` cambiar `get_documento_count` N+1 por `annotate(documento_count=Count('documento_set'))` (o `documento`). Decidir si cuenta solo `is_published=True` — recomendado **documentar y filtrar publicados** si el frontend es público; si no, mantener total y etiquetar "documentos catalogados".
2. **Frontend `Archivos/+page.svelte`**:
   - Mantener fetch live; añadir `countsLoaded/error` UI: skeleton → "N documentos" + `title="Actualizado al cargar la página desde /api/v2/archivos/"` + pequeño `Actualizado: HH:MM` + botón reintentar si falla (hoy silencioso).
   - Caso `archivo_id:null` (Orizaba/Córdoba): mostrar "próximamente / sin conteo" en vez de ocultar; o asignar IDs reales si existen en DB (verificar).
   - Opcional: `cache_visualization('archivos_counts', ttl=300)` si el conteo se vuelve lento tras annotate — medir primero.
3. **Respuesta al usuario**: "Sí, es en vivo (no estático); se recalcula en cada carga". Añadirlo como texto de ayuda en la página (1 línea) para cerrar la duda.
4. **Validación**: crear documento en admin → recargar Archivos → conteo +1. Test unitario `documento_count` con annotate.

### D. Bug 4 — Mapa Trayectorias (rendimiento + clic + São Tomé)
1. **Rendimiento backend** (`views.py:aggregated`):
   - Añadir params `limit_rutas` (default 500), `min_count` (default 1), `bbox=minLon,minLat,maxLon,maxLat` para recortar. Ordenar por `count desc` antes de serializar (ya lo hace) y truncar.
   - Evaluar agregación a nivel DB (GROUP BY `from/to`) vs loop Python actual; si se mantiene Python, añadir `select_related/procedencia` ya existente + `only()` para reducir columnas. Medir con `?include_timeline=1` en prod-like.
   - Mantener `cache 600s`; incluir nuevos params en cache key (ya usa querystring completa).
2. **Rendimiento frontend (`ArcsMap.svelte`)**:
   - No recalcular geometría por frame: cachear `arcGeometry(route)` por `routeKey+zoom` e invalidar solo en `zoomend/moveend`; `drawParticles` usa caché.
   - `routeLimit` ya existe (`defaultRouteLimit`); fijar default menor en móvil (p.ej. 100) y `PARTICLE_CAP` adaptativo (`prefersReducedMotion` ya existe → 0 partículas).
   - Lazy `import('leaflet')` ya existe; añadir `loading=lazy` y placeholder con conteo `X rutas · Y lugares` antes de montar mapa. Evitar transiciones D3 en primera carga si `routes>300`.
3. **Clic en lugares (lección Lola)**:
   - Hacer marcadores clicables + teclado: `tabindex=0, role=button, aria-label="<nombre>: N movimientos. Enter para ver personas"`, `click/Enter/Espacio` → abre `RouteDetailPanel`-like para lugar (personas entrantes+salientes) o `goto('/Search/?tab=personaesclavizada&lugar_any=<id>')`. Recomendado: modal con dos pestañas Entrantes/Salientes reutilizando `route_detail` o nuevo `place_detail`.
   - Arcos: añadir golpeador invisible `stroke-width: max(12, arcWidth+8), opacity:0` superpuesto al arco visible para puntero/táctil; mantener arco visible fino. Aumentar `circle` hit en móvil.
   - Alternativa no-mapa para la lección: `select` Origen/Destino ya existe — añadir botón "Ver personas de este lugar" junto a selects (accesible sin mapa).
4. **Validación**: Lighthouse/perf antes/después con `include_timeline=1`; test táctil (tap marcador/arco abre detalle); test teclado; verificar São Tomé en mapa tras fix + regresión `merge` lugar.

### E. Bug 5 — Vocabulario canónico `huído` + alias (requiere reunión para el término, pero sistema ya)
1. **Modelo** (`dbgestor/models.py`, nueva migración):
   - `ConductaTerm{conducta_term_id PK, canonico CharField unique (p.ej. "huído"), aliases ArrayField/Text[] o JSON, descripcion Text blank, created/updated}` + `PersonaEsclavizada.conducta_terms M2M(ConductaTerm, blank, related_name)`.
   - Mantener `conducta TextField` original intacto (matiz de archivo). No reescribir.
   - Normalización: `canonico.lower()` en `save()` (como `Calidades`); `aliases` en minúsculas, sin duplicados, validación `alias ≠ otro canonico`.
   - Seed inicial (migración datos o fixture): `huído → [huido, hullo, huyo, huyeron, escap*, busque]` — afinar lista en reunión (ver riesgo `busque` ambiguo). Añadir también variantes con/sin acento automáticamente vía `unaccent` en búsqueda (no como alias manual).
2. **Búsqueda** (`views.py`, `crosstab.py`, `signals.py`, `populate_search_vectors.py`):
   - Nuevo filtro `conducta_canonica=<id|texto>` → `Q(conducta_terms__canonico__icontains) | Q(conducta_terms__aliases__overlap)` o resolución previa `ConductaTerm` → `Q(conducta__icontains=alias...)`. Recomendado: resolver término → expandir a OR sobre `conducta` + `conducta_terms` (cubre datos aún no enlazados).
   - FTS: añadir `conducta` (+ `marcas_corporales/salud` si se acuerda) al `search_vector` Persona con peso C/D; habilitar `unaccent` (`CREATE EXTENSION unaccent`, `SearchVector(config='spanish')` + `Unaccent` o diccionario) para `huido=huído`.
   - Facet `conductas` (canónico+count) en `_collect_facets`; dimensión crosstab `conducta_canonica` (M2M, con warning M2M existente).
   - `populate_search_vectors --model persona` + migración reindex.
3. **Backfill** (management command nuevo, idempotente, `dry-run` por defecto):
   - `python manage.py link_conducta_terms --dry-run --term huído`: `casefold+unaccent+icontains` por alias sobre `conducta` (+ `descripcion` Documento? aclarar — usuario dice "18 documentos" pero `conducta` vive en Persona; auditar si también hay que buscar en `Documento.descripcion/notas` y enlazar personas del doc).
   - Reporte CSV `persona_id, conducta_snippet, matched_alias, action(link/review)`. `busque/escap*` → cola revisión manual (falsos positivos probables).
4. **UI gestión** (patrón `TiposLugar`/`SituacionLugar`):
   - Admin `ConductaTerm` (search `canonico/aliases`, import/export).
   - Catalogar Svelte: endpoint `vocabularios/conducta-terms/` (`VocabBaseViewSet`, search `canonico`), selector multi en form persona-esclavizada + creador rápido; campo libre `conducta` permanece con sugerencia "¿Quisiste decir <canónico>?".
   - Search `BrowseFilters`: `conducta_canonica` `searchable-select` (facet `conductas`) + mantener `conducta__icontains` texto libre avanzado.
   - Detail persona: badge canónico + texto original.
5. **Reunión pendiente**: acordar canónico (`huído` propuesto), lista alias definitiva, si `busque`/`escap*` entran o van a revisión, si aplica también a `marcas/salud`. El sistema soporta cualquier decisión sin recodear.
6. **Validación**: `q` + filtro `conducta_canonica=huído` devuelve los 18 casos; test `huido==huído`; test backfill dry-run sin duplicados; accesibilidad del nuevo filtro.

### F. Bug 6 — Valor económico + procedencia en resultados
1. **Fase 1 — visibilizar lo existente (sin cambiar tipo de dato)**:
   - `columns.js`: mantener `evento_valor_sp_list/forma_de_pago/total` ocultas por defecto pero añadir a `ColumnConfigModal` con labels claros ("Valor (pesos, texto archivo)", "Forma de pago", "Total") + `renderCellValue` para listas (`join('; ')`, `—` si vacío).
   - `views.py:ORDERING_FIELDS`: añadir `evento_valor_sp_list etc.` o marcar `sortable:false` en `columns.js` (inconsistencia actual) — recomendado **marcar no-ordenable** hasta normalizar numérico.
   - `Detail/documento/+page.svelte`: mostrar `Valor del evento / Forma de pago / Total` (como Django `documento.html:27-28`) + enlace archivo/lugar. `Detail/personaesclavizada`: mostrar `procedencia` enlazada + tabla documentos con `valor` por doc (reusa `documentos` nested + nuevo campo `evento_*` en `DocumentoNestedSerializer`).
   - `DocumentoListSerializer` (+ `DocumentoDetailSerializer`): exponer `evento_valor_sp/forma_de_pago/total` (hoy `List` no los trae). CSV ya los aplana.
   - Filtro: añadir `evento_valor_sp__icontains` (texto) en `filtersDefinition` grupo Documento + backend `_apply_form_filters` (ambas personas + documento). Procedencia ya filtrable (`procedencia` + facet `procedencias`).
2. **Fase 2 — investigación económica (alcance a confirmar)**:
   - `evento_valor_sp` es texto libre ("200 pesos", "150 p.", "sin valor"...) → no promediable. Opciones: (a) solo display+CSV (suficiente para lecciones), (b) añadir `evento_valor_num Decimal + evento_moneda vocab` + parser/backfill manual (costoso, requiere historiadora). Recomendado: **Fase 1 ahora; Fase 2 solo si el equipo la pide** tras ver datos (`export_deposit.py:251` ya exporta los 3 campos para análisis externo).
   - Si Fase 2: nueva migración, admin validación, crosstab `avg_valor`, histograma en Dashboard. Marcar fuera de este plan hasta decisión.
3. **Validación**: activar columna Valor en tabla PE → render + CSV incluye `evento_*`; detail doc muestra valor; filtro texto valor funciona; `procedencia` visible y clicable a `Detail/lugar`.

## 3. Transversales

- **i18n**: todo string nuevo en `messages/*.json` como lenguaje natural con `{param}` (no JS en keys), usar `getLocale()` para números, `aria-label/alt` localizados, arrays estáticos reactivos (`$: items=[...]`).
- **Estilos**: nada de `<style>` por componente nuevo salvo tokens existentes; usar `custom.css/scss`.
- **Accesibilidad WCAG 2.1 AA**: teclado completo (arcos/marcadores/círculos D3 con `role=button tabindex=0 Enter/Espacio`), foco visible, `aria-label` con lugar+año+conteo, `role=status/alert` en cargas/errores, contraste, `prefers-reduced-motion`.
- **Docker/uv**: cambios deps vía `uv add` en `mstdb_manager/pyproject.toml` + `uv.lock` + `docker compose build web`. Migraciones dentro de `web` (`python manage.py migrate`), nunca local.
- **Submódulos**: commit primero en `mstdb_manager`/`mstdb_theme`, luego bump pointer en superproyecto. `CHANGELOG.md [Unreleased]` por bug.
- **Docs**: actualizar `docs/architecture.md` (Search/Browse Store, viz endpoints, nuevo vocab) + `api/v2/README.md` (`lugar_any`, `conducta_canonica`, `evento_*`).

## 4. Orden de ejecución sugerido

1. B2 + B1-helper URL (desbloquea lección siglo XIX y Archivos). 2. B1 historial completo. 3. B3 conteos (rápido, cierra duda). 4. B6-Fase1 (visibilizar valor). 5. B5 modelo+backfill dry-run (paralelo a reunión término). 6. B4 perf/clic (más invasivo) + fix São Tomé (dato, puede ir antes).

## 5. Riesgos

- Cambiar `replace→push` sin cuidado inunda historial (cada keystroke). Mitigar con debounce + `push` solo en acciones discretas.
- OR `lugar_any` cambia conteos esperados por el equipo pedagógico → comunicar + nota UI.
- Alias `busque/escap*` generan falsos positivos (p.ej. "se busque" genérico). Mitigar con cola revisión, no auto-link ciego.
- `evento_valor` texto libre: no prometer promedios sin normalización.
- Georreferenciación: corregir São Tomé puede romper rutas agregadas cacheadas → invalidar caché viz (`cache.clear` o bump key) tras fix datos.

## 6. Preguntas abiertas para reunión (no bloquean implementación base)

1. Canónico conducta: ¿`huído`? ¿Lista alias final (incluir `busque`?) ¿Aplica a resumen Documento o solo `conducta` Persona?
2. Archivos: ¿conteo = publicados o catalogados totales?
3. Valor: ¿Fase 2 numérica (`valor_num+moneda`) o basta texto+CSV?
4. Mapa: ¿clic en lugar debe ir a Search o a modal lugar? ¿Límite default rutas en aula (100/250)?
5. Back: ¿restaurar también scroll y `viewMode` (table/card/map) en Atrás?

## 7. Criterios de aceptación (QA manual mínimo)

- [ ] Back navegador `Search↔Detail↔Dashboard` nunca cae a landing salvo que landing sea realmente la anterior.
- [ ] `personas-por-lugar Aguascalientes 1800-1826 → clic círculo → Search(tab=PE, lugar_any, año) >0` y URL compartible reproduce resultados.
- [ ] `Archivos → Explorar documentos` filtra Search por archivo; conteo coincide con DB y muestra ayuda "en vivo".
- [ ] ArcsMap carga con aviso progreso, marcador clicable por teclado/táctil abre personas; São Tomé fuera de Brasil.
- [ ] Filtro `conducta_canonica=huído` encuentra variantes; gestión alias usable por colectores.
- [ ] Columna Valor visible bajo demanda + CSV; detail doc/persona muestra valor y procedencia enlazada.
