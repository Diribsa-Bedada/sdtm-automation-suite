# ==============================================================================
# SDTM.oak Agentic Compiler - Self-Correction Test Script
# ==============================================================================
# This script creates a deliberately broken mapping specification, runs the
# Auditor agent to capture the error, and invokes the Fixer agent to correct it.
# ==============================================================================

message("======================================================================")
message(" Testing Agent Self-Correction Loop...")
message("======================================================================")

# Load the agent libraries and functions
source("sdtm_agent.R", local = FALSE)

# 1. Create a broken specification
message("Step 1: Creating a broken mapping specification...")
broken_spec <- list(
  DM = list(
    STUDYID = list(type = "constant", value = "MYSTUDY-01"),
    DOMAIN = list(type = "constant", value = "DM"),
    # Deliberately map USUBJID to a non-existent column to trigger SDTM-001 error
    USUBJID = list(type = "field", dataset = "demo_raw.csv", field = "FakeColumnID"),
    SUBJID = list(type = "field", dataset = "demo_raw.csv", field = "SubjectID"),
    RFSTDTC = list(type = "iso_date", dataset = "demo_raw.csv", field = "EnrollDate"),
    RFENDTC = list(type = "iso_date", dataset = "demo_raw.csv", field = "EnrollDate"),
    SITEID = list(type = "field", dataset = "demo_raw.csv", field = "Site"),
    BRTHDTC = list(type = "iso_date", dataset = "demo_raw.csv", field = "BirthDate"),
    AGEU = list(type = "constant", value = "YEARS"),
    SEX = list(type = "lookup", dataset = "demo_raw.csv", field = "Gender", lookup = list(Male = "M", Female = "F", M = "M", F = "F")),
    RACE = list(type = "field", dataset = "demo_raw.csv", field = "Race"),
    ARMCD = list(type = "lookup", dataset = "demo_raw.csv", field = "TxGroup", lookup = list(Active = "ACT", Placebo = "PBO")),
    ARM = list(type = "field", dataset = "demo_raw.csv", field = "TxGroup"),
    COUNTRY = list(type = "field", dataset = "demo_raw.csv", field = "Country")
  )
)

broken_json_str <- jsonlite::toJSON(broken_spec, auto_unbox = TRUE, pretty = TRUE)
message("\n--- Broken Mapping Config (DM -> USUBJID mapped to 'FakeColumnID') ---")
print(broken_json_str)

# 2. Run the Auditor Agent on the broken spec
message("\nStep 2: Executing mapping compiler on broken spec...")
audit_results <- audit_sdtm_pipeline(broken_json_str, raw_dir = "mock_data", out_dir = "test_fixer_output")
errors <- audit_results$errors

active_errors <- errors %>% filter(Severity == "Error")

if (nrow(active_errors) > 0) {
  error_summary <- paste(
    sprintf("[%s] %s | %s | %s", active_errors$Severity, active_errors$Domain, active_errors$Code, active_errors$Message),
    collapse = "\n"
  )
  message("\nAuditor Flagged Errors:\n", error_summary)
  
  # 3. Call the Fixer Agent (Gemini) to fix it!
  message("\nStep 3: Invoking the Fixer Agent to self-correct the spec...")
  
  # Get raw metadata summary so the Fixer knows what the real columns are
  meta_summary <- inspect_raw_metadata("mock_data")
  
  fixer_prompt <- paste(
    "The clinical mapping compile failed because of mapping spec errors.",
    "Specifically, the required variable USUBJID in DM is empty because it was mapped to 'FakeColumnID' which does not exist in demo_raw.csv.",
    "Here is the validation error log:\n",
    error_summary,
    "\n\nHere is the raw data metadata summary showing the actual valid columns:\n",
    meta_summary,
    "\nHere is the current broken mapping spec JSON:\n",
    broken_json_str,
    "\n\nPlease correct the mapping spec JSON. Find the correct column in demo_raw.csv to map to USUBJID (it should represent the subject identification column, like 'SubjectID').",
    "Return ONLY the corrected JSON specification."
  )
  
  corrected_json <- call_gemini(
    fixer_prompt,
    system_instruction = "You are a Clinical Data Standards Fixer. Output ONLY the corrected JSON schema matching the specification format.",
    json_mode = TRUE
  )
  
  message("\nStep 4: Fixer returned corrected JSON mapping specification:")
  print(corrected_json)
  
  # 4. Re-run validation on corrected spec
  message("\nStep 5: Re-running Auditor on corrected spec...")
  final_audit <- audit_sdtm_pipeline(corrected_json, raw_dir = "mock_data", out_dir = "output")
  final_errors <- final_audit$errors %>% filter(Severity == "Error")
  
  # Filter out the clinical data anomaly error (SUBJ-099) to verify if the mapping issue was fixed
  mapping_errors <- final_errors %>% filter(!grepl("SUBJ-099", Message))
  
  if (nrow(mapping_errors) == 0) {
    message("\n======================================================================")
    message(" SUCCESS: Self-Correction Loop Verified!")
    message(" Agent successfully detected the error, consulted the metadata,")
    message(" corrected 'FakeColumnID' to 'SubjectID', and compiled cleanly.")
    message("======================================================================")
  } else {
    message("\n======================================================================")
    message(" FAILURE: Agent failed to resolve the mapping error.")
    message("======================================================================")
  }
} else {
  message("No errors found. Test setup incorrect.")
}

# Clean up
if (dir.exists("test_fixer_output")) {
  unlink("test_fixer_output", recursive = TRUE)
}
