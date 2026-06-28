# ==============================================================================
# SDTM Automation Suite - Pipeline Runner
# ==============================================================================
# This R script transforms raw clinical database files into SDTM domains
# and exports SAS Transport Version 5 (.xpt) datasets.
# ==============================================================================

# Parse command line arguments (Base R - zero external dependency)
args <- commandArgs(trailingOnly = TRUE)
raw_dir <- "mock_data"
spec_path <- "sdtm_mapping_spec.json"
out_dir <- "output"

# Basic argument parsing loop
i <- 1
while (i <= length(args)) {
  if (args[i] == "--raw-dir" && i + 1 <= length(args)) {
    raw_dir <- args[i+1]
    i <- i + 2
  } else if (args[i] == "--spec" && i + 1 <= length(args)) {
    spec_path <- args[i+1]
    i <- i + 2
  } else if (args[i] == "--out-dir" && i + 1 <= length(args)) {
    out_dir <- args[i+1]
    i <- i + 2
  } else {
    i <- i + 1
  }
}

message("======================================================================")
message(" SDTM.oak Pipeline - R Command Line Engine")
message("======================================================================")
message("Source Directory: ", raw_dir)
message("Mapping Spec:     ", spec_path)
message("Output Directory: ", out_dir)
message("======================================================================")

# Install and load packages
required_packages <- c("jsonlite", "dplyr", "readr", "purrr", "haven", "tidyr")
new_packages <- required_packages[!(required_packages %in% installed.packages()[, "Package"])]
if (length(new_packages) > 0) {
  message("Installing required packages: ", paste(new_packages, collapse = ", "))
  # Note: Standard CRAN repo setup
  install.packages(new_packages, repos = "https://cloud.r-project.org")
}

library(jsonlite)
library(dplyr)
library(readr)
library(purrr)
library(haven)
library(tidyr)

# Helper function to convert raw date formats to ISO 8601
parse_iso_date <- function(date_vec) {
  date_vec <- as.character(date_vec)
  date_vec <- trimws(date_vec)
  
  # Return empty for NA/empty strings
  if (length(date_vec) == 0) return(character(0))
  
  parsed <- sapply(date_vec, function(d) {
    if (is.na(d) || d == "") return("")
    
    # 1. YYYY-MM-DD
    if (grepl("^\\d{4}-\\d{2}-\\d{2}$", d)) {
      return(d)
    }
    
    # 2. YYYY/MM/DD
    if (grepl("^\\d{4}/\\d{2}/\\d{2}$", d)) {
      return(gsub("/", "-", d))
    }
    
    # 3. DD-Mmm-YYYY (e.g. 12-Oct-2025)
    if (grepl("^\\d{1,2}-[a-zA-Z]{3}-\\d{4}$", d)) {
      parsed_date <- tryCatch(
        format(as.Date(d, format = "%d-%b-%Y"), "%Y-%m-%d"),
        error = function(e) ""
      )
      if (!is.na(parsed_date) && parsed_date != "") return(parsed_date)
    }
    
    # 4. DD/MM/YYYY or MM/DD/YYYY
    if (grepl("^\\d{1,2}/\\d{1,2}/\\d{4}$", d)) {
      parts <- as.numeric(strsplit(d, "/")[[1]])
      # Check if first part looks like day (> 12)
      if (parts[1] > 12) {
        parsed_date <- tryCatch(
          format(as.Date(d, format = "%d/%m/%Y"), "%Y-%m-%d"),
          error = function(e) ""
        )
      } else {
        # Assume DD/MM/YYYY but fallback to MM/DD/YYYY if parsing fails
        parsed_date <- tryCatch(
          format(as.Date(d, format = "%d/%m/%Y"), "%Y-%m-%d"),
          error = function(e) {
            format(as.Date(d, format = "%m/%d/%Y"), "%Y-%m-%d")
          }
        )
      }
      if (!is.na(parsed_date) && parsed_date != "") return(parsed_date)
    }
    
    # 5. Fallback using default R parser
    parsed_date <- tryCatch(
      format(as.Date(d), "%Y-%m-%d"),
      error = function(e) ""
    )
    if (is.na(parsed_date)) return("")
    return(parsed_date)
  })
  
  return(unname(parsed))
}

# Load Mapping Specification
if (!file.exists(spec_path)) {
  stop("CRITICAL ERROR: Mapping Spec file not found at: ", spec_path)
}

spec <- tryCatch(
  jsonlite::fromJSON(spec_path, simplifyVector = FALSE),
  error = function(e) {
    stop("CRITICAL ERROR: Failed to parse Mapping Spec JSON file: ", e$message)
  }
)

if (!dir.exists(out_dir)) {
  dir.create(out_dir, recursive = TRUE)
}

# Store output datasets for validation phase
sdtm_datasets <- list()
validation_report <- data.frame(
  Severity = character(0),
  Domain = character(0),
  Variable = character(0),
  Code = character(0),
  Message = character(0),
  stringsAsFactors = FALSE
)

# ------------------------------------------------------------------------------
# 1. Map Demographics (DM)
# ------------------------------------------------------------------------------
if (!is.null(spec$DM)) {
  message("Processing Domain: DM (Demographics)...")
  dm_spec <- spec$DM
  raw_file_name <- dm_spec$USUBJID$dataset
  raw_path <- file.path(raw_dir, raw_file_name)
  
  if (file.exists(raw_path)) {
    raw_dm <- readr::read_csv(raw_path, show_col_types = FALSE)
    
    # Build columns based on spec rules
    dm_out <- raw_dm
    
    # Process each variable rule
    dm_out$STUDYID <- dm_spec$STUDYID$value
    dm_out$DOMAIN  <- "DM"
    dm_out$USUBJID <- raw_dm[[dm_spec$USUBJID$field]]
    dm_out$SUBJID  <- raw_dm[[dm_spec$SUBJID$field]]
    dm_out$SITEID  <- raw_dm[[dm_spec$SITEID$field]]
    dm_out$BRTHDTC <- parse_iso_date(raw_dm[[dm_spec$BRTHDTC$field]])
    dm_out$RFSTDTC <- parse_iso_date(raw_dm[[dm_spec$RFSTDTC$field]])
    dm_out$RFENDTC <- parse_iso_date(raw_dm[[dm_spec$RFENDTC$field]])
    
    # SEX lookup mapping
    gender_field <- dm_spec$SEX$field
    gender_lookup <- dm_spec$SEX$lookup
    dm_out$SEX <- sapply(raw_dm[[gender_field]], function(x) {
      x_str <- as.character(x)
      if (x_str %in% names(gender_lookup)) {
        return(gender_lookup[[x_str]])
      }
      return(x_str)
    })
    
    dm_out$RACE <- raw_dm[[dm_spec$RACE$field]]
    
    # ARMCD / ARM mappings
    armcd_field <- dm_spec$ARMCD$field
    armcd_lookup <- dm_spec$ARMCD$lookup
    dm_out$ARMCD <- sapply(raw_dm[[armcd_field]], function(x) {
      x_str <- as.character(x)
      if (x_str %in% names(armcd_lookup)) {
        return(armcd_lookup[[x_str]])
      }
      return(x_str)
    })
    dm_out$ARM <- raw_dm[[dm_spec$ARM$field]]
    dm_out$COUNTRY <- raw_dm[[dm_spec$COUNTRY$field]]
    
    # Calculate Age
    dm_out$AGE <- as.numeric(difftime(as.Date(dm_out$RFSTDTC), as.Date(dm_out$BRTHDTC), units = "days")) %/% 365
    dm_out$AGEU <- dm_spec$AGEU$value
    
    # Keep only SDTM standard columns
    dm_final <- dm_out %>%
      select(STUDYID, DOMAIN, USUBJID, SUBJID, RFSTDTC, RFENDTC, SITEID, BRTHDTC, AGE, AGEU, SEX, RACE, ARMCD, ARM, COUNTRY)
    
    sdtm_datasets$DM <- dm_final
    
    # Save files
    readr::write_csv(dm_final, file.path(out_dir, "dm.csv"))
    haven::write_xpt(dm_final, file.path(out_dir, "dm.xpt"), version = 5)
    message("  [SUCCESS] Mapped DM domain (", nrow(dm_final), " records)")
  } else {
    warning("  [WARNING] Raw DM data file not found: ", raw_path)
  }
}

# ------------------------------------------------------------------------------
# 2. Map Adverse Events (AE)
# ------------------------------------------------------------------------------
if (!is.null(spec$AE)) {
  message("Processing Domain: AE (Adverse Events)...")
  ae_spec <- spec$AE
  raw_file_name <- ae_spec$USUBJID$dataset
  raw_path <- file.path(raw_dir, raw_file_name)
  
  if (file.exists(raw_path)) {
    raw_ae <- readr::read_csv(raw_path, show_col_types = FALSE)
    
    # Filter rows with empty subject IDs and order
    ae_proc <- raw_ae %>%
      filter(!is.na(!!sym(ae_spec$USUBJID$field))) %>%
      arrange(!!sym(ae_spec$USUBJID$field))
    
    # Assign sequence numbers grouped by USUBJID
    ae_proc <- ae_proc %>%
      group_by(!!sym(ae_spec$USUBJID$field)) %>%
      mutate(AESEQ = row_number()) %>%
      ungroup()
    
    # Build AE
    ae_out <- data.frame(
      STUDYID = ae_spec$STUDYID$value,
      DOMAIN  = "AE",
      USUBJID = ae_proc[[ae_spec$USUBJID$field]],
      AESEQ   = ae_proc$AESEQ,
      AETERM  = ae_proc[[ae_spec$AETERM$field]],
      AEDECOD = ae_proc[[ae_spec$AEDECOD$field]],
      AESTDTC = parse_iso_date(ae_proc[[ae_spec$AESTDTC$field]]),
      AEENDTC = parse_iso_date(ae_proc[[ae_spec$AEENDTC$field]]),
      AESEV   = ae_proc[[ae_spec$AESEV$field]],
      AESER   = ae_proc[[ae_spec$AESER$field]],
      AEACN   = ae_proc[[ae_spec$AEACN$field]],
      AEREL   = ae_proc[[ae_spec$AEREL$field]],
      stringsAsFactors = FALSE
    )
    
    sdtm_datasets$AE <- ae_out
    
    # Save files
    readr::write_csv(ae_out, file.path(out_dir, "ae.csv"))
    haven::write_xpt(ae_out, file.path(out_dir, "ae.xpt"), version = 5)
    message("  [SUCCESS] Mapped AE domain (", nrow(ae_out), " records)")
  } else {
    warning("  [WARNING] Raw AE data file not found: ", raw_path)
  }
}

# ------------------------------------------------------------------------------
# 3. Map Vital Signs (VS - Wide-to-Long Transposition)
# ------------------------------------------------------------------------------
if (!is.null(spec$VS)) {
  message("Processing Domain: VS (Vital Signs - Wide-to-Long Transposition)...")
  vs_spec <- spec$VS
  raw_file_name <- vs_spec$USUBJID$dataset
  raw_path <- file.path(raw_dir, raw_file_name)
  
  if (file.exists(raw_path)) {
    raw_vs <- readr::read_csv(raw_path, show_col_types = FALSE)
    
    # Pivot vital signs columns to rows
    vs_long <- raw_vs %>%
      tidyr::pivot_longer(
        cols = c(SysBP, DiaBP, Pulse, Temp, Weight),
        names_to = "VSTEST_RAW",
        values_to = "VSORRES"
      ) %>%
      filter(!is.na(VSORRES))
    
    # Standardize VSTESTCD/VSTEST/VSORRESU
    vs_long <- vs_long %>%
      mutate(
        VSTESTCD = case_when(
          VSTEST_RAW == "SysBP" ~ "SYSBP",
          VSTEST_RAW == "DiaBP" ~ "DIABP",
          VSTEST_RAW == "Pulse" ~ "PULSE",
          VSTEST_RAW == "Temp" ~ "TEMP",
          VSTEST_RAW == "Weight" ~ "WEIGHT"
        ),
        VSTEST = case_when(
          VSTEST_RAW == "SysBP" ~ "Systolic Blood Pressure",
          VSTEST_RAW == "DiaBP" ~ "Diastolic Blood Pressure",
          VSTEST_RAW == "Pulse" ~ "Pulse Rate",
          VSTEST_RAW == "Temp" ~ "Temperature",
          VSTEST_RAW == "Weight" ~ "Weight"
        ),
        VSORRESU = case_when(
          VSTEST_RAW %in% c("SysBP", "DiaBP") ~ "mmHg",
          VSTEST_RAW == "Pulse" ~ "beats/min",
          VSTEST_RAW == "Temp" ~ "C",
          VSTEST_RAW == "Weight" ~ "kg"
        )
      )
    
    # Order and generate sequence number per subject
    vs_proc <- vs_long %>%
      arrange(!!sym(vs_spec$USUBJID$field)) %>%
      group_by(!!sym(vs_spec$USUBJID$field)) %>%
      mutate(VSSEQ = row_number()) %>%
      ungroup()
    
    # Build VS
    vs_out <- data.frame(
      STUDYID  = vs_spec$STUDYID$value,
      DOMAIN   = "VS",
      USUBJID  = vs_proc[[vs_spec$USUBJID$field]],
      VSSEQ    = vs_proc$VSSEQ,
      VSTESTCD = vs_proc$VSTESTCD,
      VSTEST   = vs_proc$VSTEST,
      VSORRES  = as.character(vs_proc$VSORRES),
      VSORRESU = vs_proc$VSORRESU,
      VSSTRESC = as.character(vs_proc$VSORRES),
      # Safely convert to numeric
      VSSTRESN = suppressWarnings(as.numeric(vs_proc$VSORRES)),
      VSSTRESU = vs_proc$VSORRESU,
      VSDTC    = parse_iso_date(vs_proc[[vs_spec$VSDTC$field]]),
      stringsAsFactors = FALSE
    )
    
    sdtm_datasets$VS <- vs_out
    
    # Save files
    readr::write_csv(vs_out, file.path(out_dir, "vs.csv"))
    haven::write_xpt(vs_out, file.path(out_dir, "vs.xpt"), version = 5)
    message("  [SUCCESS] Mapped VS domain (", nrow(vs_out), " records)")
  } else {
    warning("  [WARNING] Raw VS data file not found: ", raw_path)
  }
}

# ------------------------------------------------------------------------------
# 4. SDTM Quality Validation
# ------------------------------------------------------------------------------
message("\n======================================================================")
message(" Running Quality & Compliance Checks...")
message("======================================================================")

# Gather valid subject IDs from DM
dm_subjects <- character(0)
if (!is.null(sdtm_datasets$DM)) {
  dm_subjects <- unique(sdtm_datasets$DM$USUBJID)
}

# Core metadata for validation (Req/Exp variables and types)
domain_req_vars <- list(
  DM = c("STUDYID", "DOMAIN", "USUBJID", "SUBJID", "SITEID", "SEX", "RACE", "ARMCD", "ARM", "COUNTRY"),
  AE = c("STUDYID", "DOMAIN", "USUBJID", "AESEQ", "AETERM", "AEDECOD", "AESER"),
  VS = c("STUDYID", "DOMAIN", "USUBJID", "VSSEQ", "VSTESTCD", "VSTEST")
)

for (domain in names(sdtm_datasets)) {
  df <- sdtm_datasets[[domain]]
  req_vars <- domain_req_vars[[domain]]
  
  # Row-by-row checks
  for (r in 1:nrow(df)) {
    # Check 1: Required columns missing or null
    for (v in req_vars) {
      val <- df[r, v]
      if (is.null(val) || is.na(val) || trimws(as.character(val)) == "") {
        validation_report <- rbind(validation_report, data.frame(
          Severity = "Error",
          Domain = domain,
          Variable = v,
          Code = "SDTM-001",
          Message = paste("Row", r, ": Required variable", v, "is empty or missing."),
          stringsAsFactors = FALSE
        ))
      }
    }
    
    # Check 2: Dates are ISO 8601
    dtc_cols <- names(df)[grepl("DTC$", names(df))]
    for (dc in dtc_cols) {
      val <- df[r, dc]
      if (!is.na(val) && val != "") {
        is_iso <- grepl("^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}(:\\d{2})?)?$", val)
        if (!is_iso) {
          validation_report <- rbind(validation_report, data.frame(
            Severity = "Warning",
            Domain = domain,
            Variable = dc,
            Code = "SDTM-002",
            Message = paste("Row", r, ": Date value '", val, "' is not valid ISO 8601."),
            stringsAsFactors = FALSE
          ))
        }
      }
    }
    
    # Check 3: Numeric standard variables are numeric (e.g. VSSTRESN)
    num_cols <- c("AGE", "AESEQ", "VSSEQ", "VSSTRESN")
    for (nc in num_cols) {
      if (nc %in% names(df)) {
        val <- df[r, nc]
        # In R, non-numeric strings parsed to numeric become NA, but check if original string (VSSTRESC) is non-numeric
        if (nc == "VSSTRESN") {
          orig_val <- df[r, "VSSTRESC"]
          if (!is.na(orig_val) && orig_val != "" && is.na(val)) {
            validation_report <- rbind(validation_report, data.frame(
              Severity = "Error",
              Domain = domain,
              Variable = nc,
              Code = "SDTM-003",
              Message = paste("Row", r, ": Numeric variable", nc, "has non-numeric value '", orig_val, "'."),
              stringsAsFactors = FALSE
            ))
          }
        }
      }
    }
    
    # Check 4: Demographics cross-check (subject must exist in DM)
    if (domain != "DM" && length(dm_subjects) > 0) {
      subid <- df[r, "USUBJID"]
      if (!is.na(subid) && subid != "" && !(subid %in% dm_subjects)) {
        validation_report <- rbind(validation_report, data.frame(
          Severity = "Error",
          Domain = domain,
          Variable = "USUBJID",
          Code = "SDTM-004",
          Message = paste("Row", r, ": Subject", subid, "not found in Demographics (DM)."),
          stringsAsFactors = FALSE
        ))
    }
  }
  
  # Check 6: Case-insensitivity inconsistency checks for terminology fields
  char_cols <- names(df)[sapply(df, is.character)]
  for (col in char_cols) {
    vals <- df[[col]]
    vals <- vals[!is.na(vals) & vals != ""]
    if (length(vals) > 0) {
      lower_vals <- tolower(trimws(vals))
      val_map <- list()
      flagged <- c()
      for (k in 1:length(vals)) {
        v <- vals[k]
        lv <- lower_vals[k]
        if (!is.null(val_map[[lv]]) && val_map[[lv]] != v && !(lv %in% flagged)) {
          validation_report <- rbind(validation_report, data.frame(
            Severity = "Warning",
            Domain = domain,
            Variable = col,
            Code = "SDTM-006",
            Message = paste("Inconsistent capitalization detected in variable '", col, "': both '", val_map[[lv]], "' and '", v, "' exist in output.", sep=""),
            stringsAsFactors = FALSE
          ))
          flagged <- c(flagged, lv)
        } else {
          val_map[[lv]] <- v
        }
      }
    }
  }
  
  # Check 5: DM uniqueness
  if (domain == "DM") {
    dupes <- df$USUBJID[duplicated(df$USUBJID)]
    if (length(dupes) > 0) {
      for (dp in dupes) {
        validation_report <- rbind(validation_report, data.frame(
          Severity = "Error",
          Domain = "DM",
          Variable = "USUBJID",
          Code = "SDTM-005",
          Message = paste("USUBJID '", dp, "' is not unique in Demographics domain."),
          stringsAsFactors = FALSE
        ))
      }
    }
  }
}

# Print validation results
errs <- validation_report %>% filter(Severity == "Error")
warns <- validation_report %>% filter(Severity == "Warning")

message("Validation Status: ", ifelse(nrow(errs) > 0, "FAILED COMPLIANCE", ifelse(nrow(warns) > 0, "PASSED WITH WARNINGS", "FULLY COMPLIANT")))
message("Errors Detected:   ", nrow(errs))
message("Warnings Detected: ", nrow(warns))
message("----------------------------------------------------------------------")

if (nrow(validation_report) > 0) {
  for (k in 1:nrow(validation_report)) {
    item <- validation_report[k, ]
    message(sprintf("[%s] %s | %s | %s", item$Severity, item$Domain, item$Code, item$Message))
  }
} else {
  message("[SUCCESS] All checks passed cleanly. Compliant SDTM files generated.")
}

message("======================================================================")
message(" R Pipeline Engine Execution Complete.")
message("======================================================================")
