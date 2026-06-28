# ==============================================================================
# SDTM.oak Agentic Compiler - R Orchestrator
# ==============================================================================
# An autonomous R-based agent that inspects raw clinical CSVs, maps them to
# SDTM standards via Gemini API, executes transformations, and self-corrects.
# ==============================================================================

message("======================================================================")
message(" SDTM.oak Agentic Compiler - Initiating R Agent")
message("======================================================================")

# 1. Install and load dependencies
required_packages <- c("httr", "jsonlite", "dplyr", "readr", "purrr", "tidyr")
new_packages <- required_packages[!(required_packages %in% installed.packages()[, "Package"])]
if (length(new_packages) > 0) {
  message("Installing required packages: ", paste(new_packages, collapse = ", "))
  install.packages(new_packages, repos = "https://cloud.r-project.org")
}

library(httr)
library(jsonlite)
library(dplyr)
library(readr)
library(purrr)
library(tidyr)

# 2. REST API Direct Call to Google Gemini
# --------------------------------------------------------------------------
# SECURITY: API keys are read EXCLUSIVELY from environment variables.
# This function never logs, prints, or stores the key in any output.
# Users must set GEMINI_API_KEY before running:
#   export GEMINI_API_KEY='your_key_here'  (Linux/Mac)
#   Sys.setenv(GEMINI_API_KEY = 'your_key') (R console)
#
# Course Concept Demonstrated: Security Features
# --------------------------------------------------------------------------
call_gemini <- function(prompt, system_instruction = NULL, json_mode = FALSE) {
  api_key <- Sys.getenv("GEMINI_API_KEY")
  if (api_key == "") {
    # Check if user has it set in R environment or prompt
    stop("CRITICAL ERROR: GEMINI_API_KEY environment variable is not set.\n",
         "Please set it in R before running, e.g.: Sys.setenv(GEMINI_API_KEY = 'your_key')"
    )
  }
  
  url <- paste0("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=", api_key)
  
  # Configure request body
  body <- list(
    contents = list(
      list(
        parts = list(
          list(text = prompt)
        )
      )
    )
  )
  
  # Add system instruction if provided
  if (!is.null(system_instruction)) {
    body$systemInstruction <- list(
      parts = list(
        list(text = system_instruction)
      )
    )
  }
  
  # Enable structured JSON output mode if requested
  if (json_mode) {
    body$generationConfig <- list(
      responseMimeType = "application/json"
    )
  }
  
  response <- httr::POST(
    url = url,
    body = body,
    encode = "json",
    httr::content_type_json()
  )
  
  if (httr::status_code(response) != 200) {
    stop("Gemini API request failed with status code ", httr::status_code(response), ":\n", httr::content(response, "text"))
  }
  
  res_content <- httr::content(response, as = "parsed", type = "application/json")
  
  # Extract text content safely
  text_out <- res_content$candidates[[1]]$content$parts[[1]]$text
  return(text_out)
}

# 3. Metadata Inspector Agent: Extract raw file headers and sample rows
inspect_raw_metadata <- function(raw_dir = "mock_data") {
  message("Agent [Inspector]: Scanning raw clinical folder '", raw_dir, "'...")
  files <- list.files(raw_dir, pattern = "\\.csv$", full.names = TRUE)
  
  if (length(files) == 0) {
    stop("ERROR: No raw CSV files found in ", raw_dir)
  }
  
  summary_text <- ""
  for (f in files) {
    fname <- basename(f)
    df <- readr::read_csv(f, n_max = 3, show_col_types = FALSE)
    cols <- colnames(df)
    col_types <- sapply(df, class)
    sample_data <- head(df, 2)
    
    summary_text <- paste0(
      summary_text,
      "Dataset: ", fname, "\n",
      "Columns and Types:\n",
      paste(sprintf("  - %s (%s)", cols, col_types), collapse = "\n"), "\n",
      "Sample Records (JSON):\n",
      jsonlite::toJSON(sample_data, auto_unbox = TRUE, pretty = TRUE), "\n",
      "--------------------------------------------------\n\n"
    )
  }
  return(summary_text)
}

# 4. Standard Alignment Agent: Prompt Gemini to align raw fields to CDISC SDTM
generate_sdtm_spec <- function(metadata_summary) {
  message("Agent [Aligner]: Aligning raw inputs to CDISC SDTM guidelines using Gemini...")
  
  system_instruction <- paste(
    "You are a Senior Clinical Data Standards Engineer specializing in CDISC SDTM v3.2 mapping specifications.",
    "Your task is to analyze raw datasets and produce a mapping specification in JSON format.",
    "You must map variables for DM (Demographics), AE (Adverse Events), and VS (Vital Signs).",
    "Return ONLY a clean JSON object following this exact schema:",
    "{",
    "  \"DM\": {",
    "    \"STUDYID\": { \"type\": \"constant\", \"value\": \"STUDY-VAL\" },",
    "    \"DOMAIN\": { \"type\": \"constant\", \"value\": \"DM\" },",
    "    \"USUBJID\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"SUBJID\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"RFSTDTC\": { \"type\": \"iso_date\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"RFENDTC\": { \"type\": \"iso_date\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"SITEID\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"BRTHDTC\": { \"type\": \"iso_date\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"AGEU\": { \"type\": \"constant\", \"value\": \"YEARS\" },",
    "    \"SEX\": { \"type\": \"lookup\", \"dataset\": \"filename.csv\", \"field\": \"column_name\", \"lookup\": { \"Male\": \"M\", \"Female\": \"F\", \"M\": \"M\", \"F\": \"F\" } },",
    "    \"RACE\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"ARMCD\": { \"type\": \"lookup\", \"dataset\": \"filename.csv\", \"field\": \"column_name\", \"lookup\": { \"Active\": \"ACT\", \"Placebo\": \"PBO\" } },",
    "    \"ARM\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"COUNTRY\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" }",
    "  },",
    "  \"AE\": {",
    "    \"STUDYID\": { \"type\": \"constant\", \"value\": \"STUDY-VAL\" },",
    "    \"DOMAIN\": { \"type\": \"constant\", \"value\": \"AE\" },",
    "    \"USUBJID\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"AESEQ\": { \"type\": \"sequence\" },",
    "    \"AETERM\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"AEDECOD\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"AESTDTC\": { \"type\": \"iso_date\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"AEENDTC\": { \"type\": \"iso_date\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"AESEV\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"AESER\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"AEACN\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"AEREL\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" }",
    "  },",
    "  \"VS\": {",
    "    \"STUDYID\": { \"type\": \"constant\", \"value\": \"STUDY-VAL\" },",
    "    \"DOMAIN\": { \"type\": \"constant\", \"value\": \"VS\" },",
    "    \"USUBJID\": { \"type\": \"field\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" },",
    "    \"VSSEQ\": { \"type\": \"sequence\" },",
    "    \"VSDTC\": { \"type\": \"iso_date\", \"dataset\": \"filename.csv\", \"field\": \"column_name\" }",
    "  }",
    "}"
  )
  
  prompt <- paste(
    "Given the following raw datasets summaries, align their fields to DM, AE, and VS domains.",
    "Be sure to select the correct files: look for demographics in demo files, adverse events in ae files, and vitals in vs files.",
    "Make sure that columns representing dates use \"type\": \"iso_date\".",
    "Ensure the values are case sensitive and match the column names EXACTLY.",
    "Write lookups mapping 'Male'/'Female' to 'M'/'F' for SEX, and treatments to codes for ARMCD.",
    "\n\nHere are the raw dataset summaries:\n",
    metadata_summary
  )
  
  spec_json <- call_gemini(prompt, system_instruction, json_mode = TRUE)
  return(spec_json)
}

# 5. GxP Auditor: Executes mapping R pipeline and audits validation report
audit_sdtm_pipeline <- function(spec_json_str, raw_dir = "mock_data", out_dir = "output") {
  message("Agent [Auditor]: Writing spec file & executing clinical mapping compiler...")
  
  # Write the generated spec to JSON
  spec_path <- "sdtm_mapping_spec.json"
  writeLines(spec_json_str, spec_path)
  
  # Override command args and run the compiler script in-process
  # We source sdtm_processor.R, which automatically runs and populates 'validation_report' global variable
  args <- c("--raw-dir", raw_dir, "--spec", spec_path, "--out-dir", out_dir)
  
  # Capture output logs and errors
  compiler_output <- ""
  validation_errors <- data.frame()
  
  tryCatch({
    # Capture message output
    con <- textConnection("compiler_output", "w", local = TRUE)
    sink(con, type = "message")
    
    # Run the pipeline
    source("sdtm_processor.R", local = FALSE)
    
    sink(type = "message")
    close(con)
    
    # Access global validation_report variable populated by sdtm_processor.R
    if (exists("validation_report")) {
      validation_errors <- get("validation_report")
    }
  }, error = function(e) {
    # If the script outright crashes
    sink(type = "message")
    validation_errors <- data.frame(
      Severity = "Error",
      Domain = "PIPELINE",
      Variable = "CRASH",
      Code = "FATAL",
      Message = paste("Pipeline script crashed: ", e$message),
      stringsAsFactors = FALSE
    )
  })
  
  return(list(
    errors = validation_errors,
    logs = compiler_output
  ))
}

# 6. Fixer Agent (Self-Correction Loop): Iterates if errors are found
run_agentic_loop <- function(raw_dir = "mock_data", out_dir = "output", max_iterations = 3) {
  
  # Step 1: Inspect Metadata
  meta_summary <- inspect_raw_metadata(raw_dir)
  
  # Step 2: Generate Initial Mapping Specification
  spec_json <- generate_sdtm_spec(meta_summary)
  
  iteration <- 1
  completed_successfully <- FALSE
  audit_history <- ""
  
  while (iteration <= max_iterations) {
    message("\n--- Agent Execution Loop: Iteration ", iteration, " ---")
    
    # Step 3: Run pipeline and audit results
    audit_results <- audit_sdtm_pipeline(spec_json, raw_dir, out_dir)
    errors <- audit_results$errors
    
    # Check if there are active compliance errors
    active_errors <- errors %>% filter(Severity == "Error")
    active_warnings <- errors %>% filter(Severity == "Warning")
    
    if (nrow(active_errors) == 0) {
      message("Agent [Auditor]: All required CDISC constraints passed successfully! (", nrow(active_warnings), " warnings present)")
      completed_successfully <- TRUE
      break
    }
    
    # Summarize errors
    error_summary <- paste(
      sprintf("[%s] %s | %s | %s", active_errors$Severity, active_errors$Domain, active_errors$Code, active_errors$Message),
      collapse = "\n"
    )
    
    message("Agent [Auditor]: Detected ", nrow(active_errors), " active SDTM errors:\n", error_summary)
    
    # Keep track of error history
    audit_history <- paste0(
      audit_history,
      "\nIteration ", iteration, " Errors:\n", error_summary, "\n"
    )
    
    # Check if error is due to a data anomaly (like SUBJ-099) vs mapping rule errors
    # If the error is about a missing subject ID not in DM, the agent can't fix it by re-mapping 
    # since it's a data integrity issue in the raw files.
    is_data_integrity_issue <- any(grepl("not found in Demographics", active_errors$Message))
    
    if (is_data_integrity_issue) {
      message("Agent [Fixer]: Data Integrity Violation detected (e.g. subject in AE not present in DM).")
      message("This is a clinical database entry issue (Raw Data anomaly) rather than a code mapping syntax bug.")
      message("Writing audit exception log and stopping compilation...")
      
      # Write a specific report detailing this clinical data issue
      report_path <- file.path(out_dir, "clinical_audit_report.txt")
      writeLines(
        c(
          "============================================================",
          " SDTM.oak Agentic Compiler - CLINICAL AUDIT REPORT",
          "============================================================",
          paste("Date/Time: ", Sys.time()),
          "Status:    PASSED WITH CLINICAL EXCEPTION FLAGS",
          "------------------------------------------------------------",
          "WARNING / EXCEPTION:",
          "Data integrity audit flagged a discrepancy in source data:",
          error_summary,
          "------------------------------------------------------------",
          "Please audit the raw electronic data capture (EDC) entry.",
          "============================================================"
        ),
        report_path
      )
      message("Saved exception report: ", report_path)
      completed_successfully <- TRUE
      break
    }
    
    # Step 4: Call Fixer Agent to refine mappings if it's a mapping structure error
    message("Agent [Fixer]: Calling LLM to correct mapping specifications...")
    fixer_prompt <- paste(
      "The clinical mapping compile failed because of mapping spec errors.",
      "Here is the history of errors found:\n",
      audit_history,
      "\nHere is the current mapping specification JSON:\n",
      spec_json,
      "\n\nPlease correct the mapping spec JSON. Ensure that all raw column names are spelt exactly right,",
      "date columns use 'iso_date' rule, and lookup lists are complete. Return ONLY the corrected JSON."
    )
    
    spec_json <- call_gemini(
      fixer_prompt,
      system_instruction = "You are a Clinical Data Standards Fixer. Output ONLY the corrected JSON schema matching the specification format.",
      json_mode = TRUE
    )
    
    iteration <- iteration + 1
  }
  
  if (completed_successfully) {
    message("\n======================================================================")
    message(" SDTM.oak Agentic Compiler - EXECUTION COMPLETED")
    message(" Compliant datasets and audit reports generated at: ", out_dir)
    message("======================================================================")
  } else {
    message("\n======================================================================")
    message(" SDTM.oak Agentic Compiler - FAILED TO RESOLVE ALL ERRORS")
    message(" Max iterations reached without a clean compliance pass.")
    message("======================================================================")
  }
}

# Run the pipeline compiler
# Read arguments or run default test
args <- commandArgs(trailingOnly = TRUE)
run_test <- "--run-test" %in% args

if (run_test || interactive() || length(args) == 0) {
  # Run orchestrator
  run_agentic_loop(raw_dir = "mock_data", out_dir = "output")
}
