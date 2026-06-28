---
name: sdtm_mapping
description: >
  SDTM clinical data mapping skill. Helps the agent understand how to use the
  SDTM Automation Suite to inspect raw clinical trial data, configure CDISC SDTM
  mapping specifications, run the transformation pipeline, validate compliance,
  and export regulatory-ready datasets. Covers both the visual web workspace and
  the R-based headless agent pipeline.
---

# SDTM Mapping Agent Skill

You are assisting a user who is working with the **SDTM Automation Suite** — a
clinical data transformation pipeline that converts raw Electronic Data Capture
(EDC) files into CDISC SDTM-compliant datasets for FDA/PMDA regulatory submissions.

## Project Architecture

The suite has two execution paths:

### 1. Visual Web Workspace (`public/`)
A browser-based UI for interactive mapping configuration:
- **Data Manager**: Upload CSV/Excel raw clinical datasets
- **Spec Builder**: Configure variable mappings between raw fields and SDTM targets
- **Mapping Runner**: Execute the transformation engine in-browser
- **Validator**: Run CDISC compliance checks (SDTM-001 through SDTM-005)
- **Export Center**: Download mapped CSVs or an R pipeline bundle

### 2. Headless R Agent Pipeline (`sdtm_agent.R`)
An autonomous multi-agent system that uses Gemini API to:
1. **Inspect** raw CSV metadata (Metadata Inspector Agent)
2. **Align** fields to SDTM standards (Standard Alignment Agent)
3. **Generate** R transformation code (Pipeline Programmer Agent)
4. **Validate** outputs against CDISC rules (GxP Auditor Agent)
5. **Self-correct** mapping errors or flag data integrity issues (Fixer Agent)

### 3. MCP Server (`mcp_server.py`)
Exposes tools via Model Context Protocol:
- `inspect_raw_data` — Schema extraction from clinical CSVs
- `generate_mapping_spec` — AI-powered SDTM alignment
- `validate_sdtm_dataset` — CDISC compliance validation
- `export_sdtm_csv` — Export to regulatory-ready CSV files

## Key Concepts

### SDTM Domains
- **DM** (Demographics): One row per subject. Required: USUBJID, SEX, RACE, ARM
- **AE** (Adverse Events): One row per event. Required: AETERM, AESEV, AESER
- **VS** (Vital Signs): Wide-to-long transposition. Required: VSTESTCD, VSORRES
- **LB** (Laboratory): Lab test findings
- **MH** (Medical History): Pre-existing conditions

### Mapping Rule Types
- `constant` — Fixed value (e.g., STUDYID = "MYSTUDY-01")
- `field` — Direct column mapping from raw data
- `iso_date` — Date format conversion to ISO 8601 (YYYY-MM-DD)
- `lookup` — Value translation table (e.g., Male → M, Female → F)
- `sequence` — Auto-incrementing number per subject
- `transpose_*` — Wide-to-long transposition for findings domains

### Validation Codes
- **SDTM-001**: Required variable is empty or missing
- **SDTM-002**: Date value is not valid ISO 8601 format
- **SDTM-003**: Numeric variable has non-numeric value
- **SDTM-004**: Subject not found in Demographics (DM) domain
- **SDTM-005**: USUBJID is not unique in Demographics

## How to Run

### Web Workspace
```bash
cd public && python3 -m http.server 8080
# Open http://localhost:8080
```

### R Agent Pipeline
```bash
export GEMINI_API_KEY='your_key_here'
Rscript sdtm_agent.R --run-test
```

### MCP Server
```bash
pip install mcp[cli] google-generativeai
python mcp_server.py
```

## File Structure
```
sdtm-automation-suite/
├── public/              # Visual web workspace
│   ├── index.html       # Main application shell
│   ├── style.css        # Dark theme design system
│   └── app.js           # Client-side mapping engine (1700+ lines)
├── sdtm_agent.R         # Multi-agent orchestrator (Gemini-powered)
├── sdtm_processor.R     # Deterministic R transformation pipeline
├── mcp_server.py        # MCP server exposing SDTM tools
├── sdtm_mapping_spec.json  # Mapping specification (JSON)
├── mock_data/           # Sample clinical trial CSVs
└── test_sdtm.R          # Automated test suite
```
