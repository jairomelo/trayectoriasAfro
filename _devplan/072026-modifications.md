# Trayectorias Afro: Implementation & Refactoring Roadmap

## Overview

Technical debt and feature enhancement roadmap for the Trayectorias Afro platform.
Scope: Frontend UI/UX, Backend logic, Data Modeling, and Bug Fixes.

### Frontend

- Architecture: Svelte
- Root dir: `mstdb_theme`
- Styles: `mstdb_theme/src/styles/custom.css` & `mstdb_theme/src/styles/custom.scss`

### Frontend Admin Dashboard

- Purpose: gradually replace the Django templating forms
- Location: `mstdb_theme/src/routes/(app)/User`

### Backend

- Architecture: Python 3.10, Django 5.1
- Virtual Environment: `mstdb_manager/.venv`
- Preferred venv manager: uv
- Database: Postgresql, 5432:5432, via Docker (container name=trayectorias_postgres)

---

## 1. Migrate codebase and environments to Python 3.13

- Address Python 3.10 EOL
  - Update libraries and dependencies accordingly
  - Fix errors derived from outdated code.

## 2. "Lecciones Educativas" section

- Open a new "Lecciones Educativas" section
  - Include a backend model and api endpoint to store and serve the lessons.
    - Lessons consist of: Basic HTML, image files.
    - Lessons are connected (M2M) to the following models: Persona, PersonaEsclavizada, PersonaNoEsclavizada, Corporacion, Documento
    - Lessons model elements/fields:
      - title
      - body: html compatible field. (How to embed images?)
      - levels: fk -> 'lesson_levels' (simple model with levelid and label)
      - keywords: fk -> 'lesson_kw' (simple model with lessonkwid and label)
    - Lessons need to be sortable alphabetically by title and by creation time.
    - Lessons facets: keywords, lesson_levels
  - Frontend implementation:
    - Own section (`mstdb_theme/src/routes/(app)/lessons/`)
    - Additional card in `mstdb_theme/src/routes/(landing)/+page.svelte` `<!-- Features Section -->`
    - Navigation:
      - List and grid. Sortable by title, and facets.
  - Frontend Admin Dashboard:
    - Include a form to add the educative lessons. Simple HTML formatting and image embedding is relevant.
    - File storage as simple and Svelte friendly as possible

## 3. Visualizations

- Transform visualizations placeholders into full functional visualizations that fetch the information in real time.
  - Persons per place: `mstdb_theme/src/routes/(app)/Dashboard/personas-por-lugar`
    - Replace plotly visualization for chart.js, D3.js or any other native JavaScript visualization library that allows to:
      - Search by place
      - Filter by year range
      - Click on a node and see more information:
        - Place name
        - Number of enslaved people
        - Button redirecting to Search >> 'Lugares (trayectoria)' == Place name & 'Rango de fechas' == node_date
    - Summarize table
      - Only three columns: Lugar, Total, Periodo (all sortable)
      - Fix calculations so periodo match with the place, not the whole database.
  - Trajectories map: `mstdb_theme/src/routes/(app)/Dashboard/mapa-trayectorias`
    - Replicate the map view from Search?tab=personaesclavizada -> Mapa view
    - Show all routes
      - Add one slider to reduce the number of routes
      - Filter routes by place of origin (first place in trajectory) and destination (last place in trajectory)
      - Filter routes by date range
    - Implement cacheing system to reduce loading time
  - Network: `mstdb_theme/src/routes/(app)/Dashboard/red-de-personas`
    - Replicate the map view from Search?tab=personaesclavizada -> Red view
    - Show all relations
      - Add one slider to reduce the number of nodes and relations
      - Toggle to show/hide orphan
      - Add one slider to filter for cluster number of connections.
      - Filter relations by date range
    - Implement cacheing system to reduce loading time

## 4. Data Export

- Brainstorm how to include this values from documento to be available in PersonasEsclavizadas Search table:
  - Evento valor sp
  - Evento forma de pago
  - Evento total
