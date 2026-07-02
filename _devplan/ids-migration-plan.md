# Migration Plan: Adopting Intermediate Data Structure (IDS) for TrayectoriasAfro
**Approach:** Path B (Dual-Schema / Interoperability Layer)
**Goal:** Preserving the operational Django models while generating a standardized, longitudinal microdata exchange package (IDS Version 4 / 5 compliant).

---

## 1. Architectural Overview

Instead of a high-risk backend rewrite, we preserve the current operational database schema. Interoperability is achieved by translating active database records into the five core IDS tables on-demand.

```
+------------------------------------+
|  Operational DB (Django Models)    | <--- Ingestion UI & Django Admin
+------------------------------------+
                  |
                  | (ETL / Export Engine)
                  v
+------------------------------------+
|       Standard IDS Dataset         | <--- zip: individual.csv, context.csv, etc.
+------------------------------------+
```

---

## 2. Table-by-Table Schema Mapping

### A. INDIVIDUAL Table
Records time-varying attributes for individuals.

| IDS Column | TrayectoriasAfro Source | Mapping / Translation Rule |
| :--- | :--- | :--- |
| **Id_I** | `persona_idno` | Alphanumeric unique identifier (e.g., `P00123`). |
| **Id_D** | `documentos` (M2M) | Associated source document identifier (e.g., `D00045`). |
| **Type** | Constant / Model Subclass | Generated attribute type: `SEX`, `LEGAL_STATUS`, `AGE`, `CASTE_QUALITY`, `ETHNONYM`, `ACCULTURATION`, `OCCUPATION`. |
| **Value** | Model fields | Exact verbatim transcription value from DB (e.g., `v`, `Esclavizada`, `mulato`, `bozal`). |
| **Value_g** | Standard dictionary | Standardized mapping (e.g., `v` -> `male`, `m` -> `female`). |
| **Start_date** | `Documento.fecha_inicial` | Attribute start boundary (inherited from source document). |
| **End_date** | `Documento.fecha_final` | Attribute end boundary (inherited from source document). |

### B. INDIV_INDIV Table
Declares pairwise relationships between individuals.

| IDS Column | TrayectoriasAfro Source | Mapping / Translation Rule |
| :--- | :--- | :--- |
| **Id_I_1** | `persona_fuente` | Origin/Subject of the relationship (e.g., master, mother). |
| **Id_I_2** | `personas` | Connected target individual(s). |
| **Id_D** | `documento_idno` | Source document recording the relationship. |
| **Relation** | `naturaleza_relacion` + `descripcion_relacion` | Standardized relation classification (e.g., `Familiar: Madre`, `Subordinación: Esclavo de`). |
| **Start_date** | `fecha_inicial_relacion` | Custom relation date or fallback to `Documento.fecha_inicial`. |

### C. INDIV_CONTEXT Table
Links individuals to external settings (places, organizations, events).

| IDS Column | TrayectoriasAfro Source | Mapping / Translation Rule |
| :--- | :--- | :--- |
| **Id_I** | `personas` | Individual identifier. |
| **Id_C** | `lugar_id` or `corporacion_idno` | Context identifier. |
| **Id_D** | `documento_idno` | Source document anchoring this event. |
| **Relation_type**| `situacion_lugar` / `rol_evento` | Role in context (e.g., `Venta`, `Bautismo`, `Testigo`, `Propietario`). |

### D. CONTEXT Table
Describes the settings (places, organizations, and the historical sources themselves).

| IDS Column | TrayectoriasAfro Source | Mapping / Translation Rule |
| :--- | :--- | :--- |
| **Id_C** | Entity ID | Alphanumeric context ID (e.g., `L123` for Lugar, `C0045` for Corporation). |
| **Type** | Constant | `PLACE`, `ORGANIZATION`, or `SOURCE`. |
| **Name** | Name / Title | `nombre_lugar`, `nombre_institucion`, or `titulo`. |
| **Lat / Lon** | `Lugar.lat`, `Lugar.lon` | Geolocational coordinates. |

### E. CONTEXT_CONTEXT Table
Models hierarchical structures between different contexts.

| IDS Column | TrayectoriasAfro Source | Mapping / Translation Rule |
| :--- | :--- | :--- |
| **Id_C_1** | Child Context ID | `lugar_id` (subdivision) or `documento_idno`. |
| **Id_C_2** | Parent Context ID | `es_parte_de_id` (parent location) or `archivo_idno`. |
| **Relation** | Constant | Hierarchy type: `PART_OF` (geography) or `HOUSED_IN` (archival organization). |

---

## 3. Step-by-Step Implementation Plan

### Step 1: Create the Management Command (`export_ids.py`)
Develop a custom management command under `dbgestor/management/commands/export_ids.py` following the logic of the existing `export_deposit.py` script. It will query active database records and construct the standard 5-table schema.

### Step 2: Establish the Code Standardization Dictionary
Build a helper lookup module (e.g., `dbgestor/utils_ids.py`) that handles code translation:
* Translates local gender indicators (`v`, `m`) to unified analytical standards.
* Translates local controlled vocabularies into universal classifications.

### Step 3: Implement the API / Download Layer
Configure a dedicated REST endpoint in API V2:
* `GET /api/v2/export/ids/` which generates, zips, and downloads the package on-the-fly or caches pre-built nightly exports.

### Step 4: Verification Testing
Draft automated unit tests in `dbgestor/tests.py` verifying:
* Relational integrity (no orphaned `Id_I` or `Id_C` in relational/context tables).
* Strict schema validation conforming to standard longitudinal microdata guidelines.
