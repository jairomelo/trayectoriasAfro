# Metadata Dictionary — Network Analysis of the Trayectorias Afro *PersonaRelaciones* Dataset

This dictionary documents all files included in this deposit. For source data provenance, field-level documentation of `relaciones_personas.csv` mirrors the authoritative description in the *Trayectorias Afro* 2026 full deposit.

---

## Conventions

### Stable Identifiers

Person identifiers follow the format `mx-sv-per-XXXXXX`. These are shared with the full *Trayectorias Afro* deposit and can be used to join against `personas_esclavizadas.csv` and `personas_no_esclavizadas.csv` in that deposit.

### Relationship Types (`naturaleza_relacion`)

| Code | Label | Description |
|------|-------|-------------|
| `fam` | Family | Kinship and familial ties |
| `tmp` | Temporal | Situational or time-bound connections (e.g., co-participants in a transaction) |
| `sub` | Subordination | Hierarchical authority relationships (enslaver → enslaved) |
| `aso` | Associative | Horizontal peer or community relationships |

---

## Source Data — `relaciones_personas.csv`

Each row represents a dyadic (pairwise) link between two persons as documented in the *Trayectorias Afro* database. When a source record involves more than two individuals, C(N, 2) dyadic rows are generated and linked by a shared `persona_relacion_id`. The table is directly usable as a network edge list.

| Property | Type | Description |
| :---- | :---- | :---- |
| `persona_idno_1` | Text | Identifier of the first person in the dyad. Reference to `personas_esclavizadas.csv` or `personas_no_esclavizadas.csv` in the full deposit. |
| `persona_idno_2` | Text | Identifier of the second person in the dyad. |
| `persona_relacion_id` | Integer | Identifier of the original relationship record. Groups all dyadic rows generated from the same multi-person relational event. |
| `documento_idno` | Text | Document attesting the relationship. Reference to `documentos.csv` in the full deposit. Provides approximate dating via the document's `fecha_inicial`. |
| `naturaleza_relacion` | Text | Relationship type. See [Relationship Types](#relationship-types-naturaleza_relacion) above. |
| `persona_sujeto_idno` | Text | Identifier of the dominant (source) person in a directed (`sub`) relationship. Empty for undirected relationships. |
| `descripcion_relacion` | Text | Free-text transcription or description of the relationship as stated in the source document. |

---

## Analysis Code — `network.ipynb`

A Jupyter notebook (24 cells) that constructs and characterizes the social network encoded in `relaciones_personas.csv`. The notebook is self-contained and writes all outputs to the `report/` directory. Python ≥ 3.14 is required; see `pyproject.toml` for package dependencies.

| Section | Cells | Description |
|---------|-------|-------------|
| Dependencies | 1–2 | Imports and library setup |
| Helper functions | 3–6 | `graph_description()`, degree distribution, centrality summary utilities |
| Data | 7–8 | Loads `relaciones_personas.csv` |
| Orphan analysis | 9–10 | Counts persons with no relationships (requires full deposit persons tables) |
| Overall network | 11–12 | Builds undirected graph over all relationship types; writes `report/report.json` |
| Familial subgraph | 13–14 | `naturaleza_relacion == 'fam'`; writes `report/report_fam.json` |
| Subordination subgraph | 15–16 | `naturaleza_relacion == 'sub'`, directed, using `persona_sujeto_idno`; writes `report/report_sub.json` |
| Temporal subgraph | 17–18 | `naturaleza_relacion == 'tmp'`; writes `report/report_tmp.json` |
| Associative subgraph | 19–20 | `naturaleza_relacion == 'aso'`; writes `report/report_aso.json` |
| Combined tmp + aso | 21–22 | Merged temporal and associative; writes `report/combined/report.json` |

---

## Output — Network Report JSON (`report/*.json`, `report/combined/report.json`)

Each JSON file follows the same schema. For the subordination subgraph (`report_sub.json`), the graph is directed; all metrics are computed accordingly.

| Property | Type | Description |
| :---- | :---- | :---- |
| `nodes` | Integer | Total number of nodes (persons) in the (sub)graph. |
| `edges` | Integer | Total number of edges (relationships) in the (sub)graph. |
| `connected_components` | Integer | Number of connected components (weakly connected for directed graphs). |
| `lcc_size.nodes` | Integer | Node count of the Largest (Weakly) Connected Component. |
| `lcc_size.fraction` | Decimal | Fraction of total nodes in the Largest Connected Component. |
| `density` | Decimal | Graph density: ratio of actual to possible edges. |
| `average_degree` | Decimal | Mean degree across all nodes. |
| `clustering_coefficient.average_local` | Decimal | Mean local clustering coefficient across all nodes. |
| `clustering_coefficient.global_transitivity` | Decimal | Global transitivity (fraction of closed triplets). |
| `average_path_length.value` | Decimal | Mean shortest path length, computed on the Largest Connected Component. |
| `average_path_length.computed_on_nodes` | Integer | Number of nodes used to compute average path length. |
| `diameter.value` | Integer | Longest shortest path in the Largest Connected Component. |
| `diameter.computed_on_nodes` | Integer | Number of nodes used to compute diameter. |
| `degree_centrality.mean` | Decimal | Mean degree centrality across all nodes. |
| `degree_centrality.std` | Decimal | Standard deviation of degree centrality. |
| `degree_centrality.min` | Decimal | Minimum degree centrality. |
| `degree_centrality.max` | Decimal | Maximum degree centrality. |
| `betweenness_centrality.mean` | Decimal | Mean betweenness centrality (computed on LCC). |
| `betweenness_centrality.std` | Decimal | Standard deviation of betweenness centrality. |
| `betweenness_centrality.min` | Decimal | Minimum betweenness centrality. |
| `betweenness_centrality.max` | Decimal | Maximum betweenness centrality. |
| `closeness_centrality.mean` | Decimal | Mean closeness centrality (computed on LCC). |
| `closeness_centrality.std` | Decimal | Standard deviation of closeness centrality. |
| `closeness_centrality.min` | Decimal | Minimum closeness centrality. |
| `closeness_centrality.max` | Decimal | Maximum closeness centrality. |
| `top_degree_central` | Array of objects | Top 10 nodes by degree centrality. Each object: `{"persona": "mx-sv-per-XXXXXX", "centrality": decimal}`. |
| `top_betweenness_central` | Array of objects | Top 10 nodes by betweenness centrality. Same object structure. |
| `top_closeness_central` | Array of objects | Top 10 nodes by closeness centrality. Same object structure. |

---

## Output — Visualizations (`report/*.png`, `report/combined/*.png`)

All plots use the `seaborn-v0_8-whitegrid` style. Files are named by visualization type and subgroup.

| Pattern | Description |
| :---- | :---- |
| `degree_histogram[_<subgroup>].png` | Bar chart of degree distribution. X-axis: degree value; Y-axis: number of nodes with that degree. |
| `degree_ccdf[_<subgroup>].png` | Complementary Cumulative Distribution Function (CCDF) of node degree on a log–log scale. X-axis: number of connections *k*; Y-axis: probability P(degree > *k*). |

Subgroup suffixes: none (all relationships), `_fam`, `_sub`, `_tmp`, `_aso`. The `report/combined/` folder contains equivalent plots for the merged temporal + associative subgraph.
