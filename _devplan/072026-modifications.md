# Trayectorias Afro: Implementation & Refactoring Roadmap

## Overview
Technical debt and feature enhancement roadmap for the Trayectorias Afro platform.
Scope: Frontend UI/UX, Backend logic, Data Modeling, and Bug Fixes.

---

## 1. Frontend & UI/UX Improvements
- [ ] **Lesson Plans Implementation:**
  - Create a "Lecciones educativas" section.
  - Implement dropdown/navigation logic under "Acerca de".
  - Design a list-based view for individual lesson pages (format reference: SlaveVoyages blog).
- [ ] **Landing Page Standardization:**
  - Standardize "Acerca de" menu availability across the root/landing page to match internal page consistency.
- [ ] **GSR Interface Clarification:**
  - Update UI to increase visibility of "Create Document" actions within the "Ver/Explorar" section.

## 2. Backend Logic & Bug Fixes
- [ ] **Anonymous Entity Handling:**
  - Modify validation logic for "Enslaved Persons" creation.
  - Allow null/empty name fields to trigger or accept "Anónimo" as a valid entry.
- [ ] **Data Integrity (Table Views):**
  - Fix year parsing error in "Personas Asociadas a Lugares a lo Largo del Tiempo" table (Current display: "3844").
  - Enable dynamic sorting and auto-refresh for the "Summary Table."
- [ ] **Search & Navigation:**
  - Debug search query for "Convento de Santa María de Gracia de Guadalajara" to resolve null result sets.
  - Implement interactive state for data points/bubbles in the "Personas por lugar" table (enable click-to-navigate).
- [ ] **Mapping/Geospatial:**
  - Update Trajectory Map georeferencing logic.
  - Add overlay labels for place names to improve user orientation.

## 3. Data Modeling
- [ ] **Relationship Schema Expansion:**
  - Introduce new relationship category: `asociativa`.
  - Update schema to allow M:N relationships between enslaved persons, institutions, and religious figures.
- [ ] **Document Standard Operating Procedure (SOP) Logic:**
  - Update documentation manual regarding "double documents" (e.g., Power of Attorney + Contract).
  - Implement system-side validation or prompt to prevent duplicate document entries for the same legal transaction.

## 4. Documentation & Retrieval
- [ ] **Asset Recovery:**
  - Restore access to the "Listado de archivos y fuentes" created by Tatiana Seijas (currently orphaned/inaccessible).

---
*Generated for: Agentic Coder Ingestion*