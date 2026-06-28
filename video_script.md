# Video Script — SDTM.oak Agentic Clinical Data Compiler
## Kaggle Capstone | ≤ 5 Minutes | Agents for Business Track

---

## INTRO — The Problem (0:00 – 0:40)

**[Screen: Title slide with SDTM.oak logo]**

> "Every drug that reaches a pharmacy shelf goes through clinical trials — and every clinical trial generates mountains of raw patient data that must be converted into a strict regulatory format called SDTM before the FDA will even look at it."

**[Screen: Show a messy CSV → clean SDTM table side by side]**

> "Today, statistical programmers spend *weeks* manually writing SAS or R scripts to do this conversion. Date formats are inconsistent. Vital signs are in the wrong shape. Subject IDs don't match across datasets. It's tedious, error-prone, and expensive."

> "What if an AI agent could do this autonomously?"

---

## WHY AGENTS? (0:40 – 1:10)

**[Screen: Architecture diagram]**

> "SDTM.oak is a multi-agent system — not just a single prompt. Five specialized agents collaborate in a pipeline:"

> "The **Inspector** reads raw data. The **Aligner** uses Gemini to map fields to CDISC standards. The **Programmer** generates transformation code. The **Auditor** validates everything. And the **Fixer** — this is key — autonomously self-corrects."

> "If a mapping is wrong, it fixes it. If there's a genuine data integrity issue — like a patient appearing in adverse events but not in demographics — it recognizes that's a *data* problem, not a *code* problem, and writes a clinical audit report instead."

---

## ARCHITECTURE (1:10 – 1:55)

**[Screen: Show `sdtm_agent.R` code briefly, then architecture diagram]**

> "The system has three interfaces that all share the same mapping specification format:"

> "A **visual web workspace** for point-and-click configuration in the browser."

> "A **headless R agent pipeline** that runs autonomously from the command line."

> "And an **MCP server** — this is Model Context Protocol — that exposes the tools so *any* AI agent can call them."

**[Screen: Show MCP server code briefly]**

> "Four tools: inspect data, generate mappings, validate compliance, export CSVs. Any MCP-compatible agent can now do clinical data mapping."

---

## LIVE DEMO (1:55 – 3:55)

### Part A: Web Workspace (1:55 – 2:45)

**[Screen: Open http://localhost:8080]**

> "Let's see it in action. Here's the visual workspace."

1. Click "Load Mock Study Data" on the dashboard
2. Show the Data Manager — "6 subjects, adverse events, vital signs"
3. Navigate to Spec Builder — "Each SDTM variable has a mapping rule"
4. Show the VS domain with transpose rules — "Wide vital signs become long CDISC rows"
5. Click "Execute SDTM Mapping" — Show console log output
6. Show the generated tables (DM, AE, VS)
7. Navigate to Validator — Show errors (SUBJ-099 not in DM)
8. Navigate to Export Center — "Download CSVs or a ready-to-run R pipeline"

### Part B: R Agent Pipeline (2:45 – 3:25)

**[Screen: Terminal]**

```bash
export GEMINI_API_KEY='...'
Rscript sdtm_agent.R --run-test
```

> "Watch the agents work. The Inspector scans files... The Aligner calls Gemini for mappings... The Auditor catches the integrity issue with SUBJ-099... and the Fixer writes a clinical audit report."

Show the output files: `dm.xpt`, `ae.csv`, `clinical_audit_report.txt`

### Part C: MCP Server (3:25 – 3:55)

**[Screen: Terminal]**

> "The MCP server exposes these same capabilities as tools. Any AI agent — Claude, ADK, Antigravity — can call `inspect_raw_data` or `validate_sdtm_dataset`."

Show the MCP server starting and the tool definitions.

---

## ANTIGRAVITY + COURSE CONCEPTS (3:55 – 4:35)

**[Screen: Antigravity IDE]**

> "This entire project was built with Antigravity. I also created a custom agent skill..."

Show `.agents/skills/sdtm_mapping/SKILL.md` briefly.

> "Here's how the course concepts map to the submission:"

**[Screen: Course concepts table]**

| Concept | Implementation |
|---|---|
| Multi-Agent System | 5 R agents with self-correction loop |
| MCP Server | 4 clinical data tools via MCP protocol |
| Antigravity | Built the project + custom agent skill |
| Security | API key isolation, input sanitization |
| Deployability | Clear setup instructions, env config |
| Agent Skills | Custom SDTM mapping skill for Antigravity |

---

## WRAP-UP (4:35 – 5:00)

**[Screen: Title slide]**

> "SDTM.oak takes a process that costs pharmaceutical companies weeks of manual programming and turns it into an autonomous, self-correcting AI pipeline."

> "It's built in R — the language clinical programmers actually use — and it's designed to be practical, not just a demo. The MCP server means any agent can extend it."

> "Thank you for watching."

---

## Recording Checklist

- [ ] Title slide with SDTM.oak branding
- [ ] Architecture diagram (use the one from README)
- [ ] Live demo of the web workspace
- [ ] Terminal demo of `Rscript sdtm_agent.R --run-test`
- [ ] MCP server quick demo
- [ ] Antigravity / agent skill screenshot
- [ ] Course concepts table slide
- [ ] Upload to YouTube (unlisted or public)
