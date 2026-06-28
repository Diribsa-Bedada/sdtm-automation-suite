# SDTM.oak — An Agentic Clinical Data Compiler

## Subtitle
A multi-agent R pipeline that autonomously transforms raw clinical trial data into CDISC SDTM-compliant regulatory datasets using Google Gemini, with a visual web workspace, MCP server, and self-correcting validation loop.

---

## The Problem: A $2B Industry Bottleneck

Every drug that reaches a pharmacy shelf passes through clinical trials generating thousands of patient records. Before the FDA or PMDA will review a submission, this raw data must be converted into a strict regulatory format: the **CDISC Study Data Tabulation Model (SDTM)**.

Today, teams of statistical programmers spend 3–6 weeks per study manually writing SAS or R scripts to map raw Electronic Data Capture (EDC) records into SDTM domains. The work is repetitive but treacherous: date formats vary by clinical site (DD-Mon-YYYY vs. MM/DD/YYYY vs. ISO 8601), vital signs arrive in wide format but must be transposed to long format, and every subject in an adverse event table must exist in the demographics domain — a cross-reference that's easy to miss.

This is exactly the kind of structured, rule-heavy, multi-step workflow where AI agents excel.

## Why Agents?

A single LLM prompt can't solve this problem. The task requires a coordinated sequence: reading file schemas, consulting domain standards, generating transformation code, validating outputs against regulatory rules, and — critically — distinguishing between code bugs and genuine data quality issues.

SDTM.oak uses a **five-agent collaborative pipeline**, where each agent has a specialized role and the system can autonomously self-correct without human intervention.

## Multi-Agent Architecture

The system is built entirely in R — the primary language of clinical biostatistics — with direct REST calls to Google Gemini's API in JSON-structured output mode.

### Agent 1: Metadata Inspector
Scans raw clinical CSV files using R's `readr` package. Extracts column names, data types, and sample rows to create a concise schema summary.

### Agent 2: Standard Aligner
Takes the metadata summary and calls Gemini API with `responseMimeType: application/json` to produce a structured mapping specification. This forces the model to output valid JSON without fragile regex parsing — a technique covered in the course.

### Agent 3: Pipeline Programmer
Converts the JSON mapping spec into executable R transformation code using `dplyr` and `tidyr`. Handles date normalization, value lookups (Male → M), sequence generation, and wide-to-long transpositions for vital signs data.

### Agent 4: GxP Auditor
Validates generated SDTM datasets against CDISC Implementation Guide 3.2 rules:
- **SDTM-001**: Required variables must not be empty
- **SDTM-002**: Date columns must be ISO 8601 format
- **SDTM-003**: Numeric variables must contain numeric values
- **SDTM-004**: All subjects must exist in the Demographics domain
- **SDTM-005**: USUBJID must be unique in Demographics

### Agent 5: Fixer (Self-Correction Loop)
This is the most interesting agent. When the Auditor detects errors, the Fixer must classify them:
- **Mapping errors** (wrong column name, missing lookup): The Fixer calls Gemini again with the error history and the current spec, asking it to produce a corrected version. The loop retries up to 3 iterations.
- **Data integrity issues** (e.g., SUBJ-099 appears in Adverse Events but not in Demographics): The Fixer recognizes this is a problem in the *source data*, not the mapping code. It writes a **Clinical Audit Report** for human review and exits cleanly rather than looping forever.

This distinction between fixable bugs and unfixable data issues is critical in regulated environments.

## Three Interfaces, One Specification

### Visual Web Workspace
A browser-based UI (HTML/CSS/JS) with six tabs: Dashboard, Data Manager, Spec Builder, Mapping Runner, Validator, and Export Center. Users can upload CSVs, configure mappings visually, execute the transformation engine client-side, inspect CDISC validation results, and download mapped datasets or a self-contained R pipeline script.

### Headless R Agent Pipeline
The autonomous CLI pipeline (`sdtm_agent.R`) runs the full agent loop without any UI. Ideal for batch processing or CI/CD integration in pharmaceutical programming environments.

### MCP Server
A Python-based Model Context Protocol server (`mcp_server.py`) exposes four tools: `inspect_raw_data`, `generate_mapping_spec`, `validate_sdtm_dataset`, and `export_sdtm_csv`. This allows any MCP-compatible AI agent — Claude, ADK agents, or Antigravity — to call the SDTM pipeline as external tools.

## Course Concepts Applied

| Concept | Implementation |
|---|---|
| **Multi-Agent System** | 5 R agents with autonomous self-correction (sdtm_agent.R) |
| **MCP Server** | 4 clinical data tools via Model Context Protocol (mcp_server.py) |
| **Antigravity** | Built with Antigravity IDE; includes custom agent skill |
| **Security Features** | API key isolation via env vars, input path sanitization, file type restrictions |
| **Deployability** | Comprehensive setup instructions, .env.example template, cross-platform |
| **Agent Skills** | Custom Antigravity skill teaching agents to use the SDTM pipeline |

## Technical Highlights

- **Pure R agent framework**: Deliberately built in R rather than Python because R is the standard language in clinical biostatistics teams
- **JSON mode for structured output**: Gemini's `responseMimeType: application/json` eliminates parsing fragility
- **Autonomous pivot transpositions**: Wide-format vital signs (SysBP, DiaBP, Pulse columns) automatically become CDISC-compliant long-format VS rows
- **SAS XPT binary exports**: Generates regulatory-compliant SAS Transport Version 5 files via `haven::write_xpt`
- **Smart self-correction**: Distinguishes between code bugs and data integrity issues to prevent infinite loops

## Security Design

API keys are never hardcoded — they're read exclusively from environment variables. The MCP server validates all file paths against directory traversal attacks, restricts file types to clinical data formats (.csv, .xlsx, .json), and enforces a 50 MB size limit. Mock data uses synthetic subject IDs with no real patient information. The `.gitignore` excludes `.env` files, output datasets, and audit reports that could contain identifiers.

## Setup Instructions

```bash
git clone https://github.com/YOUR_USERNAME/sdtm-automation-suite.git
cd sdtm-automation-suite
cp .env.example .env  # Add your GEMINI_API_KEY
export GEMINI_API_KEY='your_key'

# Visual workspace
cd public && python3 -m http.server 8080

# R agent pipeline
Rscript sdtm_agent.R --run-test

# MCP server
pip install mcp[cli] google-generativeai
python mcp_server.py
```

## What I Learned

Building this project reinforced that agents aren't about replacing humans — they're about automating the tedious 80% so that clinical data managers can focus on the critical 20%: reviewing audit reports, handling edge cases, and making judgment calls about data quality. The self-correction loop was the hardest part to get right, but it's also what makes this more than a demo — it's a system that behaves responsibly in a regulated domain.
