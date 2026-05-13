# Rediscovering Connections Between Enslaved Populations in New Spain — Network Analysis Deposit

**Article author:** Jairo Melo, University of California, Santa Barbara  
**Date of publication:** May 2026  
**License:** [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)  
**Project website:** <https://www.trayectoriasafro.org>

---

## About This Deposit

This deposit accompanies the data article *"Rediscovering Connections Between Enslaved Populations in New Spain (1500–1760) using the Trayectorias Afro PersonaRelaciones Dataset"* by Jairo Melo. It contains the source data, analysis code, and outputs used to characterize the social network of enslaved and non-enslaved persons documented in the *Trayectorias Afro* database.

The analysis loads `relaciones_personas.csv` from the *Trayectorias Afro* 2026 data deposit, constructs undirected and directed graphs using NetworkX, computes network descriptive statistics (density, clustering, centrality, path length), and produces degree-distribution visualizations for the overall network and for each relationship type.

This deposit is a **derivative work** of the full *Trayectorias Afro* 2026 data deposit. The source data file (`relaciones_personas.csv`) is reproduced here for convenience; the authoritative version and full deposit are available at [INSERT MAIN DEPOSIT DOI].

---

## File Inventory

### Source Data

| File | Description | Rows |
|------|-------------|-----:|
| `relaciones_personas.csv` | Person-to-person relationships extracted from the *Trayectorias Afro* database | 9,701 |

### Analysis Code

| File | Description |
|------|-------------|
| `network.ipynb` | Jupyter notebook containing all network construction, metric computation, and visualization code |
| `pyproject.toml` | Python project and dependency specification |

### Output — Network Reports (`report/`)

| File | Subgroup | Description |
|------|----------|-------------|
| `report/report.json` | All relationships | Overall network descriptive statistics |
| `report/report_fam.json` | Family (`fam`) | Statistics for the familial-relationship subgraph |
| `report/report_sub.json` | Subordination (`sub`) | Statistics for the subordination subgraph (directed) |
| `report/report_tmp.json` | Temporal (`tmp`) | Statistics for the temporal-relationship subgraph |
| `report/report_aso.json` | Associative (`aso`) | Statistics for the associative-relationship subgraph |
| `report/combined/report.json` | Temporal + Associative | Statistics for the merged tmp and aso subgraph |

### Output — Visualizations (`report/`)

| File | Subgroup | Description |
|------|----------|-------------|
| `report/degree_histogram.png` | All | Degree distribution histogram |
| `report/degree_ccdf.png` | All | Complementary Cumulative Distribution Function (CCDF) of node degree |
| `report/degree_histogram_fam.png` | Family | Degree histogram for familial subgraph |
| `report/degree_ccdf_fam.png` | Family | CCDF for familial subgraph |
| `report/degree_histogram_sub.png` | Subordination | Degree histogram for subordination subgraph |
| `report/degree_ccdf_sub.png` | Subordination | CCDF for subordination subgraph |
| `report/degree_histogram_tmp.png` | Temporal | Degree histogram for temporal subgraph |
| `report/degree_ccdf_tmp.png` | Temporal | CCDF for temporal subgraph |
| `report/degree_histogram_aso.png` | Associative | Degree histogram for associative subgraph |
| `report/degree_ccdf_aso.png` | Associative | CCDF for associative subgraph |
| `report/combined/degree_histogram.png` | Temporal + Associative | Degree histogram for combined subgraph |
| `report/combined/degree_ccdf.png` | Temporal + Associative | CCDF for combined subgraph |

---

## Reproducibility

### Requirements

- Python ≥ 3.14
- [uv](https://docs.astral.sh/uv/) (recommended) or pip

### Dependencies

| Package | Version |
|---------|---------|
| `pandas` | ≥ 3.0.2 |
| `networkx` | ≥ 3.6.1 |
| `matplotlib` | ≥ 3.10.8 |
| `scipy` | ≥ 1.17.1 |
| `rustworkx` | ≥ 0.17.1 |
| `ipykernel` | ≥ 7.2.0 (Jupyter execution) |

### Setup and Execution

```bash
# Install dependencies with uv (reads pyproject.toml)
uv sync

# Launch Jupyter and run all cells in order
uv run jupyter nbconvert --to notebook --execute network.ipynb
```

Alternatively, open `network.ipynb` in JupyterLab or VS Code and run all cells. Outputs are written to `report/`.

### Note on Full Reproducibility

Cell 10 of `network.ipynb` computes orphan-node counts by cross-referencing `relaciones_personas.csv` against the full persons tables. To reproduce that cell, place `2026-05-08/personas_esclavizadas.csv` and `2026-05-08/personas_no_esclavizadas.csv` from the main deposit alongside this file (preserving the `2026-05-08/` path prefix). All other cells run on `relaciones_personas.csv` alone.

---

## Relationship to the Main Deposit

The *Trayectorias Afro* 2026 full deposit (19 tables, 3,917 enslaved individuals, 4,957 non-enslaved persons) is available at [https://doi.org/10.7910/DVN/ECR5CB](https://doi.org/10.7910/DVN/ECR5CB). The complete field-level documentation for `relaciones_personas.csv` can be found in `METADATA_DICTIONARY.md` (this deposit) or in the bilingual dictionaries of the main deposit.

---

## Citation

> Melo, Jairo. *Network Analysis of the Trayectorias Afro PersonaRelaciones Dataset* [Dataset]. Harvard Dataverse, 2026. <https://doi.org/10.7910/DVN/JIASJN>

---

## Contact

Project website: <https://www.trayectoriasafro.org>
