# ==============================================================================
# SDTM Automation Suite - Test Runner
# ==============================================================================
# This script verifies that the R pipeline mappings and validation rules
# run correctly and generate compliant datasets.
# ==============================================================================

message("Running SDTM mapping integration tests...")

# 1. Execute R Pipeline Script to build test output
test_raw_dir <- "mock_data"
test_out_dir <- "test_output"

if (dir.exists(test_out_dir)) {
  unlink(test_out_dir, recursive = TRUE)
}

# Source the processor script which will run the pipeline
# We override args to point to test directories
args <- c("--raw-dir", test_raw_dir, "--out-dir", test_out_dir, "--spec", "sdtm_mapping_spec.json")
source("sdtm_processor.R")

# 2. Begin Assertions
message("\n--- Running Test Assertions ---")

# Check if output files exist
assert_true <- function(expr, msg) {
  if (!expr) {
    stop("TEST FAILED: ", msg)
  } else {
    message("  [PASS] ", msg)
  }
}

# Verify file generation
assert_true(file.exists(file.path(test_out_dir, "dm.csv")), "dm.csv was created")
assert_true(file.exists(file.path(test_out_dir, "dm.xpt")), "dm.xpt was created")
assert_true(file.exists(file.path(test_out_dir, "ae.csv")), "ae.csv was created")
assert_true(file.exists(file.path(test_out_dir, "ae.xpt")), "ae.xpt was created")
assert_true(file.exists(file.path(test_out_dir, "vs.csv")), "vs.csv was created")
assert_true(file.exists(file.path(test_out_dir, "vs.xpt")), "vs.xpt was created")

# Verify DM Data Content
dm <- readr::read_csv(file.path(test_out_dir, "dm.csv"), show_col_types = FALSE)
assert_true(nrow(dm) == 6, "DM has exactly 6 subject rows")
assert_true(all(dm$DOMAIN == "DM"), "DM domain values are all 'DM'")
assert_true(dm$STUDYID[1] == "MYSTUDY-01", "STUDYID is mapped to constant 'MYSTUDY-01'")

# Verify Gender/Sex conversion lookup
subj1 <- dm %>% filter(USUBJID == "SUBJ-001")
subj2 <- dm %>% filter(USUBJID == "SUBJ-002")
subj3 <- dm %>% filter(USUBJID == "SUBJ-003")

assert_true(subj1$SEX == "M", "Gender 'Male' mapped to SEX 'M' for SUBJ-001")
assert_true(subj2$SEX == "F", "Gender 'Female' mapped to SEX 'F' for SUBJ-002")
assert_true(subj3$SEX == "M", "Gender 'M' mapped to SEX 'M' for SUBJ-003")

# Verify ISO Date conversions
assert_true(subj1$BRTHDTC == "1985-04-20", "BRTHDTC '1985-04-20' is mapped correctly")
assert_true(subj1$RFSTDTC == "2025-10-12", "EnrollDate '12-Oct-2025' parsed to '2025-10-12'")
assert_true(subj2$RFSTDTC == "2025-10-15", "EnrollDate '15/10/2025' parsed to '2025-10-15'")

# Verify Age Calculation
assert_true(subj1$AGE == 40, "Age calculated correctly as 40 years for SUBJ-001")

# Verify AE Data Content
ae <- readr::read_csv(file.path(test_out_dir, "ae.csv"), show_col_types = FALSE)
assert_true(nrow(ae) == 6, "AE has 6 records")
assert_true(all(ae$DOMAIN == "AE"), "AE domain values are all 'AE'")

# Verify Sequence Numbers in AE
ae_subj1 <- ae %>% filter(USUBJID == "SUBJ-001")
assert_true(nrow(ae_subj1) == 2, "SUBJ-001 has 2 adverse events")
assert_true(ae_subj1$AESEQ[1] == 1 && ae_subj1$AESEQ[2] == 2, "AESEQ sequence numbers increment correctly (1, 2)")

# Verify VS Data Content (Pivot Transposition)
vs <- readr::read_csv(file.path(test_out_dir, "vs.csv"), show_col_types = FALSE)
assert_true(all(vs$DOMAIN == "VS"), "VS domain values are all 'VS'")

# SUBJ-001 at Baseline had SysBP (120), DiaBP (80), Pulse (72), Temp (36.5), Weight (75.4)
# That should create 5 transposed rows in VS
vs_s1_base <- vs %>% filter(USUBJID == "SUBJ-001", VSDTC == "2025-10-12")
assert_true(nrow(vs_s1_base) == 5, "SUBJ-001 Baseline record pivoted wide-to-long into 5 rows")

# Check test codes and results mapping
sysbp_row <- vs_s1_base %>% filter(VSTESTCD == "SYSBP")
assert_true(sysbp_row$VSORRES == "120" && sysbp_row$VSSTRESN == 120 && sysbp_row$VSORRESU == "mmHg", "SysBP transpose parameters mapped successfully")

# Verify non-numeric validation check (e.g. Pulse = 'abc' in VS raw)
vs_s2_base <- vs %>% filter(USUBJID == "SUBJ-002", VSDTC == "2025-10-15")
pulse_row <- vs_s2_base %>% filter(VSTESTCD == "PULSE")
assert_true(pulse_row$VSORRES == "abc", "VSORRES preserves raw value 'abc' for character checks")
assert_true(is.na(pulse_row$VSSTRESN), "VSSTRESN is set to NA for non-numeric value 'abc'")

message("\n======================================================================")
message(" ALL TESTS PASSED CLEANLY!")
message("======================================================================")
unlink(test_out_dir, recursive = TRUE)
