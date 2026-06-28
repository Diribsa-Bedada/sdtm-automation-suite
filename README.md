<div align="center">

**An autonomous multi-agent system that transforms raw clinical trial data into FDA/PMDA submission-ready SDTM datasets.**

Built with R • Google Gemini • MCP Protocol • Antigravity

[Live Demo](#-quick-start) · [Architecture](#-architecture) · [Video Demo](#-video-demo) · [Course Concepts](#-course-concepts-applied)

</div>

---

## 📋 Problem Statement
In the lifecycle of a clinical trial, raw Electronic Data Capture (EDC) records must be transformed into the **CDISC Study Data Tabulation Model (SDTM)** format before regulatory submission to the FDA or PMDA. This process — known as SDTM mapping — is one of the most labor-intensive bottlenecks in pharmaceutical biostatistics.

**The pain points:**
- Statistical programmers spend **weeks manually writing SAS/R scripts** to map, pivot, clean, and format raw records
- Date formats vary wildly across sites (DD-Mon-YYYY, MM/DD/YYYY, ISO 8601)
- Wide-format vitals data must be transposed to long-format CDISC structure
- Cross-domain referential integrity checks (every AE subject must exist in DM) require tedious manual validation
- Mapping specifications change frequently as protocol amendments arrive

**SDTM.oak solves this** with an autonomous AI agent pipeline that reads raw clinical CSVs, consults CDISC standards via Gemini, generates mapping specifications, executes transformations, validates compliance, and self-corrects errors — all without human intervention.

---

## 🏗 Architecture
SDTM.oak has three execution interfaces, all sharing the same mapping specification format:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SDTM.oak Agentic Compiler                     │
├─────────────────┬──────────────────────┬────────────────────────┤
│   Web Workspace │  R Agent Pipeline    │   MCP Server           │
│   (Browser UI)  │  (Headless/CLI)      │   (Protocol Tools)     │
│                 │                      │                        │
│  Upload CSVs    │  Metadata Inspector  │  inspect_raw_data()    │
│  Spec Builder   │  Standard Aligner    │  generate_mapping()    │
│  Run Mapping    │  Pipeline Programmer │  validate_sdtm()       │
│  Validate       │  GxP Auditor         │  export_sdtm_csv()     │
│  Export CSVs    │  Fixer Agent         │                        │
└─────┬───────────┴──────────┬───────────┴────────────┬───────────┘
      │                      │                        │
      ▼                      ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Mapping Specification (JSON)                        │
│   DM: {USUBJID: {type: "field", dataset: "demo.csv", ...}}     │
│   AE: {AETERM: {type: "field", ...}, AESTDTC: {type: "iso_date"}}│
│   VS: {VSTESTCD: {type: "transpose_testcd"}, ...}              │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  SDTM Compliant Outputs: dm.csv, ae.csv, vs.csv, dm.xpt, ...   │
│  Validation Report  │  Clinical Audit Report                     │
└─────────────────────────────────────────────────────────────────┘
```

```
Raw CSVs ──► Metadata Inspector ──► Standard Aligner (Gemini API)
                                          │
                                          ▼
                                   Pipeline Programmer
                                          │
                                          ▼
                                     GxP Auditor ──► Fixer Agent (loop)
                                          │                │
                                          ▼                ▼
                                   Compliant SDTM    Clinical Audit
                                   (.xpt + .csv)      Report
```

| Agent | Role | Technology |
|---|---|---|
| **Metadata Inspector** | Scans raw CSVs, extracts column names, types, and sample rows | R (`readr`) |
| **Standard Aligner** | Maps raw fields to CDISC SDTM variables via Gemini API | Gemini 2.0 Flash (JSON mode) |
| **Pipeline Programmer** | Converts mapping spec to executable R transformation code | R (`dplyr`, `tidyr`) |
| **GxP Auditor** | Validates outputs against CDISC rules (required vars, dates, types) | R |
| **Fixer Agent** | Self-corrects mapping errors or flags data integrity issues | Gemini API (loop) |

---

### Prerequisites
- **R** (≥ 4.0) with packages: `httr`, `jsonlite`, `dplyr`, `readr`, `haven`, `tidyr`
- **Python** (≥ 3.10) for the MCP server
- **Google Gemini API key** — get one at [AI Studio](https://aistudio.google.com/app/apikey)

### Setup
```bash
# 1. Clone the repository
git clone https://github.com/fikreab-s/sdtm-automation-suite.git
cd sdtm-automation-suite

# 2. Configure your API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Set the environment variable
export GEMINI_API_KEY='your_key_here'
```

### Run the Web Workspace (Visual UI)
```bash
cd public
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

Click **"Load Mock Study Data"** on the dashboard to instantly populate the workspace with sample clinical trial data, then navigate through the tabs to configure mappings, run the compiler, and inspect results.

### Run the R Agent Pipeline (Headless)
```bash
Rscript sdtm_agent.R --run-test
```

This will:
1. Scan `mock_data/` for raw CSVs
2. Call Gemini to generate mapping specifications
3. Execute transformations
4. Validate against CDISC rules
5. Self-correct or log audit reports
6. Export `.xpt` and `.csv` files to `output/`

### Run the MCP Server
```bash
pip install mcp[cli] google-generativeai
python mcp_server.py
```

---

## 📁 Project Structure
```
sdtm-automation-suite/
├── public/                          # Visual web workspace
│   ├── index.html                   # Main application shell (6 tabs)
│   ├── style.css                    # Dark theme design system
│   └── app.js                       # Client-side mapping engine
├── sdtm_agent.R                     # Multi-agent R orchestrator
├── sdtm_processor.R                 # Deterministic R pipeline
├── mcp_server.py                    # MCP server (4 tools)
├── sdtm_mapping_spec.json           # Mapping specification
├── mock_data/                       # Sample clinical CSVs
│   ├── demo_raw.csv                 # Demographics (6 subjects)
│   ├── ae_raw.csv                   # Adverse Events (6 events)
│   └── vs_raw.csv                   # Vital Signs (7 visits)
├── test_sdtm.R                      # Automated test suite
├── test_fixer.R                     # Self-correction tests
├── .agents/skills/sdtm_mapping/     # Antigravity agent skill
│   └── SKILL.md
├── .env.example                     # Environment variable template
├── .gitignore                       # Security-conscious gitignore
├── kaggle_writeup.md                # Kaggle submission writeup
├── video_script.md                  # Video recording outline
└── README.md                        # This file
```

---

## 🎓 Course Concepts Applied
| # | Concept | Where | Description |
|---|---|---|---|
| 1 | **Multi-Agent System** | `sdtm_agent.R` | 5 collaborative agents with autonomous self-correction loop |
| 2 | **MCP Server** | `mcp_server.py` | 4 tools exposed via Model Context Protocol for any AI agent |
| 3 | **Antigravity** | `.agents/skills/` + Video | Built with Antigravity IDE; includes custom agent skill |
| 4 | **Security Features** | `.env.example`, `.gitignore`, code | API key isolation, input sanitization, path traversal prevention |
| 5 | **Deployability** | README + Video | Clear setup instructions, environment configuration, MCP integration |
| 6 | **Agent Skills** | `.agents/skills/sdtm_mapping/SKILL.md` | Custom skill teaching AI agents how to use the SDTM pipeline |

---

## 🔒 Security Considerations
- **API Keys**: Never hardcoded. Read exclusively from environment variables via `Sys.getenv()` (R) and `os.environ` (Python)
- **Input Sanitization**: File paths are validated against directory traversal attacks in the MCP server
- **File Type Restrictions**: Only `.csv`, `.xlsx`, `.xls`, and `.json` files are accepted
- **File Size Limits**: Maximum 50 MB per file upload
- **No PII in Code**: Mock data uses synthetic subject IDs (SUBJ-001 through SUBJ-006)
- **Git Security**: `.gitignore` excludes `.env`, output datasets, and audit reports

> 🚨 **REMINDER**: Do NOT include API keys or passwords in your code or commits.

---

## 🧪 Testing
```bash
# Run the R test suite
Rscript test_sdtm.R

# Run the self-correction test
Rscript test_fixer.R

# Verify MCP server starts
python mcp_server.py --help
```

---

## 📊 Key Technical Innovations
1. **Pure R Agent Framework**: While most agentic workflows are Python-based, our solution is written in R — the primary language of clinical biostatistics
2. **JSON Mode for Structured Output**: We use Gemini's `responseMimeType: application/json` to force structured mapping specs without fragile regex parsing
3. **Autonomous Pivot Transpositions**: Automatically handles wide-to-long data transformations (e.g., vital signs SysBP/DiaBP/Pulse columns → CDISC VS rows)
4. **SAS XPT Binary Exports**: Generates regulatory-compliant SAS V5 Transport files directly from R via `haven::write_xpt`
5. **Self-Correction Loop**: The Fixer Agent distinguishes between mapping bugs (fixable) and data integrity issues (requires clinical audit), preventing infinite retry loops

---

## 🎥 Video Demo
[Watch the 5-minute demo on YouTube →](#)

---

## 📝 License
This project was created for the [Kaggle AI Agents: Intensive Vibe Coding Capstone Project](https://www.kaggle.com/competitions/vibecoding-agents-capstone-project).

---

<div align="center">
Built with ❤️ using R, Google Gemini, and Antigravity
</div>
