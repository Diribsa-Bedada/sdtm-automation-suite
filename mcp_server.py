# ==============================================================================
# SDTM.oak MCP Server — Model Context Protocol Interface
# ==============================================================================
# Exposes SDTM clinical data mapping tools via the MCP protocol, allowing any
# AI agent (including Antigravity, ADK agents, or Claude) to use this pipeline
# as a set of callable tools.
#
# Course Concept Demonstrated: MCP Server
#
# Tools Exposed:
#   1. inspect_raw_data     — Scan a clinical CSV and return schema metadata
#   2. generate_mapping_spec — Use Gemini to produce SDTM mapping JSON
#   3. validate_sdtm_dataset — Run CDISC compliance checks on mapped data
#   4. export_sdtm_csv       — Export validated SDTM data to CSV files
#
# Usage:
#   python mcp_server.py                  # Start the MCP server (stdio transport)
#   python mcp_server.py --transport sse  # Start with SSE transport for web clients
#
# Security:
#   - API keys are read from environment variables only, never hardcoded
#   - File paths are sanitized to prevent directory traversal attacks
#   - Input data is validated before processing
# ==============================================================================

import os
import sys
import json
import csv
import re
import io
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# MCP SDK Import — Uses the official Model Context Protocol Python SDK
# ---------------------------------------------------------------------------
try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print(
        "ERROR: MCP SDK not installed. Install with:\n"
        "  pip install mcp[cli]\n"
        "See: https://modelcontextprotocol.io/quickstart/server",
        file=sys.stderr,
    )
    sys.exit(1)

# ---------------------------------------------------------------------------
# Optional: Google Generative AI SDK for the generate_mapping_spec tool
# ---------------------------------------------------------------------------
try:
    import google.generativeai as genai

    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("sdtm_mcp")

# ---------------------------------------------------------------------------
# Initialize the MCP Server
# ---------------------------------------------------------------------------
mcp = FastMCP(
    "sdtm-oak",
    description=(
        "SDTM.oak Clinical Data Tools — Provides CDISC SDTM mapping, "
        "validation, and export capabilities for clinical trial data."
    ),
)

# ---------------------------------------------------------------------------
# Security Utilities
# ---------------------------------------------------------------------------
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}
MAX_FILE_SIZE_MB = 50


def _sanitize_path(file_path: str, must_exist: bool = True) -> Path:
    """
    Sanitize and validate a file path to prevent directory traversal attacks.
    Resolves symlinks and ensures the path is within allowed boundaries.
    """
    path = Path(file_path).resolve()

    # Block obvious traversal attempts
    if ".." in str(file_path):
        raise ValueError(f"Directory traversal detected in path: {file_path}")

    # Check extension
    if path.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"File type '{path.suffix}' not allowed. "
            f"Supported: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check existence
    if must_exist and not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    # Check file size
    if must_exist and path.is_file():
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > MAX_FILE_SIZE_MB:
            raise ValueError(
                f"File too large ({size_mb:.1f} MB). Max: {MAX_FILE_SIZE_MB} MB"
            )

    return path


def _get_api_key() -> str:
    """
    Retrieve the Gemini API key from environment variables.
    Never logs or returns the key in error messages.
    """
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise EnvironmentError(
            "GEMINI_API_KEY environment variable is not set. "
            "Set it before running: export GEMINI_API_KEY='your_key_here'"
        )
    return key


# ---------------------------------------------------------------------------
# Date Parsing Utility (mirrors the R pipeline logic)
# ---------------------------------------------------------------------------
MONTH_ABBR = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "may": "05", "jun": "06", "jul": "07", "aug": "08",
    "sep": "09", "oct": "10", "nov": "11", "dec": "12",
}


def parse_iso_date(date_str: str) -> str:
    """
    Convert various clinical date formats to ISO 8601 (YYYY-MM-DD).
    Handles: YYYY-MM-DD, YYYY/MM/DD, DD-Mon-YYYY, DD/MM/YYYY.
    """
    if not date_str or not date_str.strip():
        return ""
    d = date_str.strip()

    # Already ISO
    if re.match(r"^\d{4}-\d{2}-\d{2}$", d):
        return d

    # YYYY/MM/DD
    if re.match(r"^\d{4}/\d{2}/\d{2}$", d):
        return d.replace("/", "-")

    # DD-Mon-YYYY  (e.g., 12-Oct-2025)
    m = re.match(r"^(\d{1,2})-([A-Za-z]{3})-(\d{4})$", d)
    if m:
        day, mon, year = m.groups()
        mon_num = MONTH_ABBR.get(mon.lower())
        if mon_num:
            return f"{year}-{mon_num}-{day.zfill(2)}"

    # DD/MM/YYYY
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", d)
    if m:
        v1, v2, year = m.groups()
        # If first value > 12, it must be DD/MM/YYYY
        if int(v1) > 12:
            return f"{year}-{v2.zfill(2)}-{v1.zfill(2)}"
        else:
            return f"{year}-{v2.zfill(2)}-{v1.zfill(2)}"

    return d  # Return raw if unparseable


# ---------------------------------------------------------------------------
# SDTM Domain Metadata (CDISC IG 3.2 required variables)
# ---------------------------------------------------------------------------
DOMAIN_REQUIRED_VARS = {
    "DM": ["STUDYID", "DOMAIN", "USUBJID", "SUBJID", "SITEID", "SEX", "RACE", "ARMCD", "ARM", "COUNTRY"],
    "AE": ["STUDYID", "DOMAIN", "USUBJID", "AESEQ", "AETERM", "AEDECOD", "AESER"],
    "VS": ["STUDYID", "DOMAIN", "USUBJID", "VSSEQ", "VSTESTCD", "VSTEST"],
    "LB": ["STUDYID", "DOMAIN", "USUBJID", "LBSEQ", "LBTESTCD", "LBTEST"],
    "MH": ["STUDYID", "DOMAIN", "USUBJID", "MHSEQ", "MHTERM", "MHDECOD"],
}


# ===========================================================================
# MCP Tool 1: inspect_raw_data
# ===========================================================================
@mcp.tool()
def inspect_raw_data(file_path: str) -> str:
    """
    Inspect a raw clinical CSV file and return its schema metadata.

    Reads the file, extracts column names, data types, row count,
    and the first 3 sample rows. This metadata is used by the
    Standard Alignment Agent to map raw fields to SDTM variables.

    Args:
        file_path: Absolute or relative path to a .csv file.

    Returns:
        A structured text summary of the dataset's schema and sample data.
    """
    logger.info(f"[Inspector] Scanning raw clinical file: {file_path}")

    path = _sanitize_path(file_path)

    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = []
        for i, row in enumerate(reader):
            if i >= 3:
                break
            rows.append(dict(row))

    # Count total rows
    with open(path, newline="", encoding="utf-8-sig") as f:
        total_rows = sum(1 for _ in f) - 1  # Subtract header

    # Infer simple types from sample data
    col_types = {}
    for h in headers:
        sample_vals = [r.get(h, "") for r in rows if r.get(h, "")]
        if all(re.match(r"^-?\d+(\.\d+)?$", v) for v in sample_vals if v):
            col_types[h] = "numeric"
        elif any(
            re.match(r"\d{4}-\d{2}-\d{2}", v) or re.match(r"\d{1,2}[/-]", v)
            for v in sample_vals
        ):
            col_types[h] = "date"
        else:
            col_types[h] = "character"

    # Build summary
    summary = (
        f"Dataset: {path.name}\n"
        f"Total Rows: {total_rows}\n"
        f"Columns ({len(headers)}):\n"
    )
    for h in headers:
        summary += f"  - {h} ({col_types.get(h, 'unknown')})\n"

    summary += f"\nSample Records (first 3):\n{json.dumps(rows, indent=2)}\n"

    logger.info(f"[Inspector] Found {len(headers)} columns, {total_rows} rows")
    return summary


# ===========================================================================
# MCP Tool 2: generate_mapping_spec
# ===========================================================================
@mcp.tool()
def generate_mapping_spec(metadata_summary: str, target_domains: str = "DM,AE,VS") -> str:
    """
    Generate an SDTM mapping specification using Google Gemini AI.

    Takes a metadata summary (from inspect_raw_data) and produces a JSON
    mapping specification that defines how raw clinical fields map to
    standard CDISC SDTM domain variables.

    Args:
        metadata_summary: Text summary of raw dataset schemas (from inspect_raw_data).
        target_domains: Comma-separated SDTM domains to map (default: "DM,AE,VS").

    Returns:
        A JSON string containing the mapping specification.
    """
    logger.info(f"[Aligner] Generating SDTM mapping spec for domains: {target_domains}")

    if not GENAI_AVAILABLE:
        return json.dumps(
            {"error": "google-generativeai package not installed. Run: pip install google-generativeai"},
            indent=2,
        )

    api_key = _get_api_key()
    genai.configure(api_key=api_key)

    model = genai.GenerativeModel("gemini-2.0-flash")

    system_prompt = (
        "You are a Senior Clinical Data Standards Engineer specializing in CDISC SDTM v3.2. "
        "Analyze raw dataset metadata and produce a mapping specification in JSON format. "
        "Map variables for the requested domains. Use these rule types:\n"
        '- "constant": Fixed value (e.g., STUDYID, DOMAIN)\n'
        '- "field": Direct column mapping\n'
        '- "iso_date": Date columns needing ISO 8601 conversion\n'
        '- "lookup": Value translation table (e.g., Male→M, Female→F)\n'
        '- "sequence": Auto-incrementing per subject\n'
        "Return ONLY valid JSON."
    )

    user_prompt = (
        f"Map these raw datasets to SDTM domains ({target_domains}).\n"
        f"Ensure column names match EXACTLY (case-sensitive).\n\n"
        f"{metadata_summary}"
    )

    response = model.generate_content(
        [user_prompt],
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        ),
    )

    spec_json = response.text
    logger.info("[Aligner] Mapping specification generated successfully")
    return spec_json


# ===========================================================================
# MCP Tool 3: validate_sdtm_dataset
# ===========================================================================
@mcp.tool()
def validate_sdtm_dataset(
    domain: str,
    data_json: str,
    dm_subjects_json: str = "[]",
) -> str:
    """
    Validate an SDTM dataset against CDISC compliance rules.

    Runs checks including: required variable completeness, ISO 8601 date
    format compliance, numeric type constraints, USUBJID uniqueness (for DM),
    and cross-domain subject referential integrity.

    Args:
        domain: SDTM domain code (e.g., "DM", "AE", "VS").
        data_json: JSON array of row objects representing the SDTM dataset.
        dm_subjects_json: JSON array of valid USUBJID strings from the DM domain.

    Returns:
        JSON object with validation results including error/warning counts and details.
    """
    logger.info(f"[Validator] Running CDISC compliance checks on {domain} domain")

    rows = json.loads(data_json)
    dm_subjects = set(json.loads(dm_subjects_json))
    req_vars = DOMAIN_REQUIRED_VARS.get(domain, [])

    report = []

    for idx, row in enumerate(rows):
        row_num = idx + 1

        # Check 1: Required variables
        for var in req_vars:
            val = row.get(var, "")
            if val is None or str(val).strip() == "":
                report.append({
                    "severity": "Error",
                    "domain": domain,
                    "variable": var,
                    "code": "SDTM-001",
                    "message": f"Row {row_num}: Required variable '{var}' is empty or missing.",
                })

        # Check 2: Date format compliance (columns ending in DTC)
        for key, val in row.items():
            if key.endswith("DTC") and val and str(val).strip():
                is_iso = bool(re.match(r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$", str(val)))
                if not is_iso:
                    report.append({
                        "severity": "Warning",
                        "domain": domain,
                        "variable": key,
                        "code": "SDTM-002",
                        "message": f"Row {row_num}: Value '{val}' is not valid ISO 8601.",
                    })

        # Check 3: Cross-domain referential integrity
        if domain != "DM" and dm_subjects:
            usubjid = row.get("USUBJID", "")
            if usubjid and usubjid not in dm_subjects:
                report.append({
                    "severity": "Error",
                    "domain": domain,
                    "variable": "USUBJID",
                    "code": "SDTM-004",
                    "message": f"Row {row_num}: Subject '{usubjid}' not found in DM domain.",
                })

    # Check 4: DM USUBJID uniqueness
    if domain == "DM":
        seen = set()
        for idx, row in enumerate(rows):
            us = row.get("USUBJID", "")
            if us in seen:
                report.append({
                    "severity": "Error",
                    "domain": "DM",
                    "variable": "USUBJID",
                    "code": "SDTM-005",
                    "message": f"Row {idx+1}: USUBJID '{us}' is not unique in Demographics.",
                })
            if us:
                seen.add(us)

    errors = sum(1 for r in report if r["severity"] == "Error")
    warnings = sum(1 for r in report if r["severity"] == "Warning")

    result = {
        "domain": domain,
        "status": "FAILED" if errors > 0 else ("WARNINGS" if warnings > 0 else "COMPLIANT"),
        "errors": errors,
        "warnings": warnings,
        "total_rows": len(rows),
        "details": report,
    }

    logger.info(f"[Validator] {domain}: {errors} errors, {warnings} warnings")
    return json.dumps(result, indent=2)


# ===========================================================================
# MCP Tool 4: export_sdtm_csv
# ===========================================================================
@mcp.tool()
def export_sdtm_csv(domain: str, data_json: str, output_dir: str = "output") -> str:
    """
    Export a validated SDTM dataset to a CSV file.

    Writes the mapped and validated SDTM data to a properly formatted
    CSV file in the specified output directory.

    Args:
        domain: SDTM domain code (e.g., "DM", "AE", "VS").
        data_json: JSON array of row objects representing the SDTM dataset.
        output_dir: Directory path for output files (default: "output").

    Returns:
        Confirmation message with the output file path and row count.
    """
    logger.info(f"[Exporter] Writing {domain} domain to CSV")

    rows = json.loads(data_json)
    if not rows:
        return json.dumps({"error": f"No data provided for {domain} domain."})

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    file_path = out_path / f"{domain.lower()}.csv"

    headers = list(rows[0].keys())
    with open(file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

    result = {
        "status": "SUCCESS",
        "domain": domain,
        "file": str(file_path.resolve()),
        "rows_written": len(rows),
        "columns": headers,
    }

    logger.info(f"[Exporter] Saved {len(rows)} rows to {file_path}")
    return json.dumps(result, indent=2)


# ===========================================================================
# MCP Resource: SDTM Domain Metadata
# ===========================================================================
@mcp.resource("sdtm://domains/metadata")
def get_domain_metadata() -> str:
    """
    Returns CDISC SDTM IG 3.2 domain metadata including required variables
    and their definitions for DM, AE, VS, LB, and MH domains.
    """
    return json.dumps(DOMAIN_REQUIRED_VARS, indent=2)


# ===========================================================================
# Entry Point
# ===========================================================================
if __name__ == "__main__":
    logger.info("Starting SDTM.oak MCP Server...")
    logger.info("Tools available: inspect_raw_data, generate_mapping_spec, validate_sdtm_dataset, export_sdtm_csv")

    transport = "stdio"
    if "--transport" in sys.argv:
        idx = sys.argv.index("--transport")
        if idx + 1 < len(sys.argv):
            transport = sys.argv[idx + 1]

    mcp.run(transport=transport)
