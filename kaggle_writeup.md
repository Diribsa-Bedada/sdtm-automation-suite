# Kaggle Capstone Writeup: SDTM.oak Agentic Compiler

## 1. Project Overview & Clinical Context
In the lifecycle of a clinical trial, raw clinical database records (from Electronic Data Capture, or EDC systems) must be transformed into standard submission-ready datasets before regulatory approval (FDA, PMDA). This standard is defined by CDISC as the **Study Data Tabulation Model (SDTM)**. 

Historically, this process has been a major bottleneck in biostatistics operations. Teams of statistical programmers spend weeks manually writing SAS or R scripts to map, pivot, clean, and format raw records into SDTM domains (e.g. Demographics, Adverse Events, Vital Signs).

**SDTM.oak Agentic Compiler** is a pure R-based autonomous multi-agent system designed to solve this problem. It reads raw clinical CSV files, consults CDISC standards, automatically generates mapping metadata and translation code, executes quality checks, and autonomously self-corrects or logs data integrity reports for biostatistician review.

---

## 2. Multi-Agent System Architecture (R-Based)

Rather than using a single monolithic prompt, we implement a **multi-agent orchestration framework** built completely inside **R** using direct REST integrations to **Google's Gemini 1.5 Flash** model:

```
                  +-----------------------+
                  |  Raw Clinical CSVs    |
                  +-----------+-----------+
                              |
                              v [Introspect Headers & Sample Rows]
                  +-----------+-----------+
                  |  Metadata Inspector   |
                  +-----------+-----------+
                              |
                              v [Raw Data Descriptions]
                  +-----------+-----------+
                  |   Standard Aligner    | <---+ [Refined Specs]
                  +-----------+-----------+     |
                              |                 |
                              v [JSON Mappings] |
                  +-----------+-----------+     |
                  |  Pipeline Programmer  |     | [Self-Correction Loop]
                  +-----------+-----------+     |
                              |                 |
                              v [R Mapping Code]|
                  +-----------+-----------+     |
                  |      GxP Auditor      |-----+ (If syntax/mapping error)
                  +-----------+-----------+
                              |
                              +-----------------> (If data integrity error)
                              |                   logs Clinical Audit Report
                              v
                  +-----------------------+
                  | Compliant SDTM Files  |
                  |   (.xpt & .csv)       |
                  +-----------------------+
```

### The Collaborative Agents:
1. **Metadata Inspector Agent**: Uses R to scan the raw database directory, extract column names, data classes, and sample rows, and creates a concise text summary.
2. **Standard Alignment Agent**: Takes the metadata summary and calls Gemini API (using `httr` in JSON mode) to map raw columns to standard SDTM domain structures (DM, AE, VS).
3. **Pipeline Programmer Agent**: Converts the mapping spec into R mapping commands.
4. **GxP Auditor Agent**: Executes the mapping code and reviews the validation report (uniqueness checks, ISO 8601 date matching, type constraints, and cross-domain subject joins).
5. **Fixer Agent (Self-Correction)**:
   * *Mapping Errors*: If a syntax or format mapping is wrong, the Fixer updates the spec and retries the loop.
   * *Clinical Data Integrity Anomalies*: If a subject ID in Adverse Events is missing in Demographics (e.g., patient `SUBJ-099` in our mock data), the agent recognizes that this is a raw data discrepancy rather than a programming bug, logs a **Clinical Audit Report** highlighting the EDC discrepancy, and exits cleanly.

---

## 3. Key Technical Innovations
* **Pure R Agent Framework**: While most agentic workflows are written in Python, our solution is written in R, the primary standard language of clinical biostatistics and statistical programming.
* **Direct REST API Calls with JSON Mode**: We query Gemini via HTTP POST requests using R's `httr` package and set the `responseMimeType` to `application/json`. This forces Gemini to output structured JSON mapping specs, removing the need for fragile regex parses.
* **Autonomous Pivot Transpositions**: Handles wide-to-long pivots (e.g. transposing raw wide vital signs metrics `SysBP`/`DiaBP`/`Pulse` into standard long SDTM `VS` rows) automatically inside the R mapping code.
* **SAS XPT Binary Outputs**: Compiles transformed dataframes directly into regulatory-compliant SAS V5 Transport format (`.xpt`) files via R's `haven::write_xpt` library.

---

## 4. Kaggle Course Concepts Applied

* **Vibe Coding (Intent-Driven Development)**: We constructed a dual-interface pipeline. The R engine runs headless in pipelines, while a beautiful, client-side visual workspace (`index.html`/`style.css`/`app.js`) allows users to visually mock up, run, and inspect mappings inside the browser.
* **Multi-Agent Evaluation Loop**: The GxP Auditor agent acts as an autonomous evaluation harness. It runs assertions on generated outputs and provides structured feedback to the programmer agent to correct its own code.
* **Task Decomposition & Tool Use**: The agent breaks down the compiler pipeline into step-by-step tasks (schema read -> specification -> translation R run -> validation audit -> export). It uses standard R scripts as tools to perform math and transformations deterministically.

---

## 5. Setup & Execution Instructions

### Pre-requisites
Ensure the `GEMINI_API_KEY` is loaded in your environment.

### Run the Agent Compiler
To start the autonomous metadata scan, mapping creation, validation audit, and export:

```powershell
Rscript sdtm_agent.R --run-test
```

### Inspect Output Datasets
The compiled, regulatory-ready files will be exported to the `output/` directory:
- `dm.xpt`, `ae.xpt`, `vs.xpt` (SAS Transport datasets)
- `dm.csv`, `ae.csv`, `vs.csv` (CSV datasets)
- `clinical_audit_report.txt` (Data anomaly reports for clinical reviewers)
