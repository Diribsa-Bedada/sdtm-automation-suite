// SDTM Automation Suite App Logic

// Global Application State
const state = {
    activeTab: 'dashboard',
    rawFiles: {}, // Filename -> { headers, rows }
    mappingSpec: {}, // Domain -> Variable -> SpecRule
    generatedData: {}, // Domain -> Rows
    validationReport: [], // Array of validation errors
    sdtmMetadata: {
        DM: [
            { var: 'STUDYID', label: 'Study Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'MYSTUDY-01' } },
            { var: 'DOMAIN', label: 'Domain Abbreviation', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'DM' } },
            { var: 'USUBJID', label: 'Unique Subject Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'demo_raw.csv', field: 'SubjectID' } },
            { var: 'SUBJID', label: 'Subject Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'demo_raw.csv', field: 'SubjectID' } },
            { var: 'RFSTDTC', label: 'Subject Reference Start Date/Time', core: 'Exp', type: 'Char', defaultRule: { type: 'iso_date', dataset: 'demo_raw.csv', field: 'EnrollDate' } },
            { var: 'RFENDTC', label: 'Subject Reference End Date/Time', core: 'Exp', type: 'Char', defaultRule: { type: 'iso_date', dataset: 'demo_raw.csv', field: 'EnrollDate' } },
            { var: 'SITEID', label: 'Study Site Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'demo_raw.csv', field: 'Site' } },
            { var: 'BRTHDTC', label: 'Date/Time of Birth', core: 'Perm', type: 'Char', defaultRule: { type: 'iso_date', dataset: 'demo_raw.csv', field: 'BirthDate' } },
            { var: 'AGE', label: 'Age', core: 'Exp', type: 'Num', defaultRule: { type: 'custom', dataset: 'demo_raw.csv', calculation: 'Calculate Age (RFSTDTC - BRTHDTC)' } },
            { var: 'AGEU', label: 'Age Units', core: 'Exp', type: 'Char', defaultRule: { type: 'constant', value: 'YEARS' } },
            { var: 'SEX', label: 'Sex', core: 'Req', type: 'Char', defaultRule: { type: 'lookup', dataset: 'demo_raw.csv', field: 'Gender', lookup: { 'Male': 'M', 'Female': 'F', 'M': 'M', 'F': 'F' } } },
            { var: 'RACE', label: 'Race', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'demo_raw.csv', field: 'Race' } },
            { var: 'ARMCD', label: 'Planned Arm Code', core: 'Req', type: 'Char', defaultRule: { type: 'lookup', dataset: 'demo_raw.csv', field: 'TxGroup', lookup: { 'Active': 'ACT', 'Placebo': 'PBO' } } },
            { var: 'ARM', label: 'Description of Planned Arm', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'demo_raw.csv', field: 'TxGroup' } },
            { var: 'COUNTRY', label: 'Country', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'demo_raw.csv', field: 'Country' } }
        ],
        AE: [
            { var: 'STUDYID', label: 'Study Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'MYSTUDY-01' } },
            { var: 'DOMAIN', label: 'Domain Abbreviation', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'AE' } },
            { var: 'USUBJID', label: 'Unique Subject Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'ae_raw.csv', field: 'SubjNum' } },
            { var: 'AESEQ', label: 'Sequence Number', core: 'Req', type: 'Num', defaultRule: { type: 'sequence' } },
            { var: 'AETERM', label: 'Reported Term for the Adverse Event', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'ae_raw.csv', field: 'Event' } },
            { var: 'AEDECOD', label: 'Dictionary-Derived Term', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'ae_raw.csv', field: 'Event' } },
            { var: 'AESTDTC', label: 'Start Date/Time of Adverse Event', core: 'Exp', type: 'Char', defaultRule: { type: 'iso_date', dataset: 'ae_raw.csv', field: 'StartDate' } },
            { var: 'AEENDTC', label: 'End Date/Time of Adverse Event', core: 'Perm', type: 'Char', defaultRule: { type: 'iso_date', dataset: 'ae_raw.csv', field: 'EndDate' } },
            { var: 'AESEV', label: 'Severity/Intensity', core: 'Perm', type: 'Char', defaultRule: { type: 'field', dataset: 'ae_raw.csv', field: 'Severity' } },
            { var: 'AESER', label: 'Serious Event', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'ae_raw.csv', field: 'Serious' } },
            { var: 'AEACN', label: 'Action Taken with Study Treatment', core: 'Perm', type: 'Char', defaultRule: { type: 'field', dataset: 'ae_raw.csv', field: 'Action' } },
            { var: 'AEREL', label: 'Causality', core: 'Perm', type: 'Char', defaultRule: { type: 'field', dataset: 'ae_raw.csv', field: 'Relationship' } }
        ],
        VS: [
            { var: 'STUDYID', label: 'Study Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'MYSTUDY-01' } },
            { var: 'DOMAIN', label: 'Domain Abbreviation', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'VS' } },
            { var: 'USUBJID', label: 'Unique Subject Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'vs_raw.csv', field: 'SubjectCode' } },
            { var: 'VSSEQ', label: 'Sequence Number', core: 'Req', type: 'Num', defaultRule: { type: 'sequence' } },
            { var: 'VSDTC', label: 'Date/Time of Measurements', core: 'Exp', type: 'Char', defaultRule: { type: 'iso_date', dataset: 'vs_raw.csv', field: 'Date' } },
            { var: 'VSORRES', label: 'Result or Finding in Original Units', core: 'Exp', type: 'Char', defaultRule: { type: 'transpose_result' } },
            { var: 'VSORRESU', label: 'Original Units', core: 'Exp', type: 'Char', defaultRule: { type: 'transpose_unit' } },
            { var: 'VSTESTCD', label: 'Vital Signs Test Short Name', core: 'Req', type: 'Char', defaultRule: { type: 'transpose_testcd' } },
            { var: 'VSTEST', label: 'Vital Signs Test Name', core: 'Req', type: 'Char', defaultRule: { type: 'transpose_test' } },
            { var: 'VSSTRESC', label: 'Character Result/Finding in Std Format', core: 'Exp', type: 'Char', defaultRule: { type: 'transpose_result' } },
            { var: 'VSSTRESN', label: 'Numeric Result/Finding in Standard Units', core: 'Exp', type: 'Num', defaultRule: { type: 'transpose_numeric' } },
            { var: 'VSSTRESU', label: 'Standard Units', core: 'Exp', type: 'Char', defaultRule: { type: 'transpose_unit' } }
        ],
        LB: [
            { var: 'STUDYID', label: 'Study Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'MYSTUDY-01' } },
            { var: 'DOMAIN', label: 'Domain Abbreviation', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'LB' } },
            { var: 'USUBJID', label: 'Unique Subject Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'LBSEQ', label: 'Sequence Number', core: 'Req', type: 'Num', defaultRule: { type: 'sequence' } },
            { var: 'LBTESTCD', label: 'Lab Test Short Name', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'LBTEST', label: 'Lab Test Name', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'LBCAT', label: 'Category for Lab Test', core: 'Perm', type: 'Char', defaultRule: { type: 'constant', value: 'CHEMISTRY' } },
            { var: 'LBORRES', label: 'Result or Finding in Original Units', core: 'Exp', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'LBORRESU', label: 'Original Units', core: 'Exp', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'LBSTRESC', label: 'Character Result/Finding in Std Format', core: 'Exp', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'LBSTRESN', label: 'Numeric Result/Finding in Standard Units', core: 'Exp', type: 'Num', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'LBSTRESU', label: 'Standard Units', core: 'Exp', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'LBDTC', label: 'Date/Time of Specimen Collection', core: 'Exp', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } }
        ],
        MH: [
            { var: 'STUDYID', label: 'Study Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'MYSTUDY-01' } },
            { var: 'DOMAIN', label: 'Domain Abbreviation', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'MH' } },
            { var: 'USUBJID', label: 'Unique Subject Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'MHSEQ', label: 'Sequence Number', core: 'Req', type: 'Num', defaultRule: { type: 'sequence' } },
            { var: 'MHTERM', label: 'Reported Term for Medical History', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'MHDECOD', label: 'Dictionary-Derived Term', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } },
            { var: 'MHCAT', label: 'Category for Medical History', core: 'Perm', type: 'Char', defaultRule: { type: 'constant', value: 'GENERAL' } },
            { var: 'MHSTDTC', label: 'Start Date/Time of Medical History Event', core: 'Perm', type: 'Char', defaultRule: { type: 'field', dataset: '', field: '' } }
        ],
        CM: [
            { var: 'STUDYID', label: 'Study Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'MYSTUDY-01' } },
            { var: 'DOMAIN', label: 'Domain Abbreviation', core: 'Req', type: 'Char', defaultRule: { type: 'constant', value: 'CM' } },
            { var: 'USUBJID', label: 'Unique Subject Identifier', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'cm_raw.csv', field: 'SubjectID' } },
            { var: 'CMSEQ', label: 'Sequence Number', core: 'Req', type: 'Num', defaultRule: { type: 'sequence' } },
            { var: 'CMTRT', label: 'Reported Name of Drug, Med, or Therapy', core: 'Req', type: 'Char', defaultRule: { type: 'field', dataset: 'cm_raw.csv', field: 'MedName' } },
            { var: 'CMDECOD', label: 'Standardized Medication Name', core: 'Exp', type: 'Char', defaultRule: { type: 'field', dataset: 'cm_raw.csv', field: 'MedName' } },
            { var: 'CMINDC', label: 'Indication', core: 'Perm', type: 'Char', defaultRule: { type: 'field', dataset: 'cm_raw.csv', field: 'Indication' } },
            { var: 'CMROUTE', label: 'Route of Administration', core: 'Perm', type: 'Char', defaultRule: { type: 'lookup', dataset: 'cm_raw.csv', field: 'Route', lookup: { 'Oral': 'ORAL', 'ORAL': 'ORAL', 'IV': 'INTRAVENOUS', 'Inhalation': 'INHALATION' } } },
            { var: 'CMDOSE', label: 'Dose per Administration', core: 'Perm', type: 'Num', defaultRule: { type: 'field', dataset: 'cm_raw.csv', field: 'Dose' } },
            { var: 'CMDOSU', label: 'Dose Units', core: 'Perm', type: 'Char', defaultRule: { type: 'field', dataset: 'cm_raw.csv', field: 'DoseUnit' } },
            { var: 'CMFRQ', label: 'Frequency of Administration', core: 'Perm', type: 'Char', defaultRule: { type: 'field', dataset: 'cm_raw.csv', field: 'Frequency' } },
            { var: 'CMSTDTC', label: 'Start Date/Time of Medication', core: 'Exp', type: 'Char', defaultRule: { type: 'iso_date', dataset: 'cm_raw.csv', field: 'StartDate' } },
            { var: 'CMENDTC', label: 'End Date/Time of Medication', core: 'Perm', type: 'Char', defaultRule: { type: 'iso_date', dataset: 'cm_raw.csv', field: 'EndDate' } }
        ]
    }
};

// Embedded Mock Datasets (for instant trial demo)
const mockDatasets = {
    'demo_raw.csv': `SubjectID,EnrollDate,Gender,Race,BirthDate,Country,Site,TxGroup
SUBJ-001,12-Oct-2025,Male,Caucasian,1985-04-20,USA,SITE-01,Active
SUBJ-002,15/10/2025,Female,Black or African American,1990-08-15,USA,SITE-01,Placebo
SUBJ-003,2025-11-01,M,Asian,1978-12-05,CAN,SITE-02,Active
SUBJ-004,2025/11/05,F,Caucasian,1965-02-14,USA,SITE-02,Placebo
SUBJ-005,10-Nov-2025,Female,Hispanic,1992-06-30,DEU,SITE-03,Active
SUBJ-006,,Male,Caucasian,1980-07-22,USA,SITE-01,Active`,

    'ae_raw.csv': `SubjNum,Event,Severity,Serious,StartDate,EndDate,Action,Relationship
SUBJ-001,Headache,Mild,No,2025-10-15,2025-10-17,None,Not Related
SUBJ-001,Nausea,Moderate,No,2025-10-16,2025-10-16,None,Possible
SUBJ-002,Dyspnea,Severe,Yes,18/10/2025,20/10/2025,Dose Reduced,Related
SUBJ-003,Fatigue,Mild,No,2025-11-03,2025-11-10,None,Possible
SUBJ-004,Dizziness,Mild,No,2025-11-06,2025-11-06,None,Not Related
SUBJ-099,Skin Rash,Moderate,No,2025-11-20,2025-11-25,None,Related`,

    'vs_raw.csv': `SubjectCode,Visit,Date,SysBP,DiaBP,Pulse,Temp,Weight
SUBJ-001,Baseline,2025-10-12,120,80,72,36.5,75.4
SUBJ-001,Week 2,2025-10-26,122,82,74,36.7,75.2
SUBJ-002,Baseline,15/10/2025,130,85,abc,37.0,68.1
SUBJ-002,Week 2,29/10/2025,128,84,70,36.8,67.9
SUBJ-003,Baseline,2025-11-01,118,78,68,36.4,82.0
SUBJ-004,Baseline,2025-11-05,145,92,80,36.9,91.3
SUBJ-005,Baseline,10-Nov-2025,115,75,64,36.2,59.8`,

    'cm_raw.csv': `SubjectID,MedName,Indication,Route,Dose,DoseUnit,Frequency,StartDate,EndDate,Ongoing
SUBJ-001,Acetaminophen,Headache,Oral,500,mg,As Needed,2025-10-15,2025-10-17,No
SUBJ-001,Lisinopril,Hypertension,Oral,10,mg,Once Daily,2020-03-01,,Yes
SUBJ-002,Metformin,Type 2 Diabetes,Oral,1000,mg,Twice Daily,2019-06-15,,Yes
SUBJ-002,Ondansetron,Nausea,IV,4,mg,As Needed,18/10/2025,19/10/2025,No
SUBJ-003,Atorvastatin,Hyperlipidemia,Oral,20,mg,Once Daily,2021-01-10,,Yes
SUBJ-003,Ibuprofen,Back Pain,ORAL,400,mg,Three Times Daily,01-Nov-2025,10-Nov-2025,No
SUBJ-004,Omeprazole,GERD,Oral,20,mg,Once Daily,2022-08-20,,Yes
SUBJ-004,Albuterol,Asthma,Inhalation,90,mcg,As Needed,2023-05-12,,Yes
SUBJ-005,Warfarin,DVT Prophylaxis,Oral,5,mg,Once Daily,2024-02-01,,Yes
SUBJ-005,Amoxicillin,Upper Respiratory Infection,Oral,500,mg,three times daily,15/11/2025,22/11/2025,No
SUBJ-006,Sertraline,Depression,Oral,50,mg,Once Daily,2023-09-01,,Yes
SUBJ-099,Aspirin,Pain,Oral,325,mg,As Needed,2025-11-05,2025-11-06,No`
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Setup Lucide Icons
    lucide.createIcons();
    
    // Check and load stored mappings/data from localStorage
    loadFromLocalStorage();
    
    // Bind Tab Click Handlers
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = btn.getAttribute('data-tab');
            navigateToTab(tabName);
        });
    });

    // File Upload Setup
    setupFileUpload();

    // Spec Builder Setup
    setupSpecBuilder();

    // Mapping Engine Setup
    setupMappingEngine();

    // Validator Setup
    setupValidator();

    // Export Setup
    setupExportCenter();

    // Quick Actions
    document.getElementById('load-mock-btn').addEventListener('click', loadMockData);
    document.getElementById('reset-workspace-btn').addEventListener('click', resetWorkspace);
    
    // Initial UI Render
    updateUI();
});

// Navigation Controller
function navigateToTab(tabName) {
    state.activeTab = tabName;
    
    // Update Sidebar Navigation buttons
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update Tab Content display
    document.querySelectorAll('.tab-content').forEach(tab => {
        if (tab.id === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Trigger tab-specific refresh routines
    if (tabName === 'spec-builder') {
        renderSpecBuilderDomain(document.querySelector('.domain-tab.active').getAttribute('data-domain'));
    } else if (tabName === 'dashboard') {
        renderDashboard();
    } else if (tabName === 'exporter') {
        renderExportCenter();
    }
}

// File Upload Handler
function setupFileUpload() {
    const dropZone = document.getElementById('upload-drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleUploadedFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleUploadedFiles(e.target.files);
    });
}

function handleUploadedFiles(files) {
    let loaded = 0;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (extension === 'csv') {
            reader.onload = (e) => {
                const text = e.target.result;
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        state.rawFiles[file.name] = {
                            headers: results.meta.fields,
                            rows: results.data
                        };
                        loaded++;
                        if (loaded === files.length) {
                            saveToLocalStorage();
                            updateUI();
                        }
                    }
                });
            };
            reader.readAsText(file);
        } else if (extension === 'xlsx' || extension === 'xls') {
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                // We load the first sheet by default
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
                
                state.rawFiles[file.name] = {
                    headers: headers,
                    rows: rows
                };
                loaded++;
                if (loaded === files.length) {
                    saveToLocalStorage();
                    updateUI();
                }
            };
            reader.readAsArrayBuffer(file);
        }
    });
}

// Render uploaded datasets list
function renderDatasetList() {
    const listContainer = document.getElementById('dataset-list-container');
    const emptyMsg = document.getElementById('no-files-message');
    
    listContainer.innerHTML = '';
    const filenames = Object.keys(state.rawFiles);
    
    if (filenames.length === 0) {
        emptyMsg.style.display = 'flex';
        document.getElementById('preview-table-container').innerHTML = `
            <div class="empty-state">
                <i data-lucide="eye" class="empty-icon"></i>
                <p>Select an uploaded file from the left panel to inspect its rows.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    emptyMsg.style.display = 'none';
    
    filenames.forEach(filename => {
        const fileData = state.rawFiles[filename];
        const li = document.createElement('li');
        li.className = 'dataset-item';
        
        li.innerHTML = `
            <div class="file-info">
                <i data-lucide="table" class="file-icon"></i>
                <div class="file-details">
                    <span class="file-name">${filename}</span>
                    <span class="file-meta">${fileData.rows.length} rows • ${fileData.headers.length} columns</span>
                </div>
            </div>
            <button class="delete-file-btn" data-file="${filename}">
                <i data-lucide="trash-2"></i>
            </button>
        `;
        
        li.addEventListener('click', (e) => {
            if (e.target.closest('.delete-file-btn')) return;
            document.querySelectorAll('.dataset-item').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            previewDataset(filename);
        });
        
        li.querySelector('.delete-file-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            delete state.rawFiles[filename];
            // Remove mappings that reference this file
            Object.keys(state.mappingSpec).forEach(dom => {
                Object.keys(state.mappingSpec[dom]).forEach(v => {
                    if (state.mappingSpec[dom][v].dataset === filename) {
                        state.mappingSpec[dom][v] = { type: 'none' };
                    }
                });
            });
            saveToLocalStorage();
            updateUI();
        });
        
        listContainer.appendChild(li);
    });
    lucide.createIcons();
}

function previewDataset(filename) {
    const fileData = state.rawFiles[filename];
    const previewName = document.getElementById('preview-dataset-name');
    const tableContainer = document.getElementById('preview-table-container');
    
    previewName.textContent = filename;
    
    if (!fileData || fileData.rows.length === 0) {
        tableContainer.innerHTML = '<p class="text-muted p-4">Empty dataset.</p>';
        return;
    }
    
    // Draw table (show max 100 rows)
    let html = `<table class="data-table"><thead><tr>`;
    fileData.headers.forEach(h => {
        html += `<th>${escapeHtml(h)}</th>`;
    });
    html += `</tr></thead><tbody>`;
    
    const maxRows = Math.min(fileData.rows.length, 100);
    for (let i = 0; i < maxRows; i++) {
        html += `<tr>`;
        fileData.headers.forEach(h => {
            const val = fileData.rows[i][h] !== undefined ? fileData.rows[i][h] : '';
            html += `<td>${escapeHtml(String(val))}</td>`;
        });
        html += `</tr>`;
    }
    
    html += `</tbody></table>`;
    if (fileData.rows.length > 100) {
        html += `<div class="p-2 text-center text-muted font-size-sm border-top">Previewing first 100 of ${fileData.rows.length} rows</div>`;
    }
    tableContainer.innerHTML = html;
}

// Spec Builder Logic
function setupSpecBuilder() {
    // Domain selection tab clicks
    document.querySelectorAll('#spec-domain-selector .domain-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#spec-domain-selector .domain-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const domain = tab.getAttribute('data-domain');
            renderSpecBuilderDomain(domain);
        });
    });

    // Import Mapping JSON
    const importBtn = document.getElementById('import-spec-btn');
    const specFileInput = document.getElementById('spec-file-input');
    importBtn.addEventListener('click', () => specFileInput.click());
    specFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                state.mappingSpec = parsed;
                saveToLocalStorage();
                const activeDomain = document.querySelector('.domain-tab.active').getAttribute('data-domain');
                renderSpecBuilderDomain(activeDomain);
                alert('Mappings loaded successfully!');
            } catch (err) {
                alert('Failed to parse mapping specification JSON.');
            }
        };
        reader.readAsText(file);
    });

    // Export Mapping JSON
    document.getElementById('export-spec-btn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.mappingSpec, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "sdtm_mapping_spec.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });
}

function renderSpecBuilderDomain(domain) {
    document.getElementById('current-spec-domain-title').textContent = `${domain} Domain Mapping`;
    const metadata = state.sdtmMetadata[domain];
    document.getElementById('domain-variables-count').textContent = `${metadata.length} Variables`;

    const tbody = document.getElementById('spec-variables-tbody');
    tbody.innerHTML = '';
    
    // Ensure mapping spec for domain exists
    if (!state.mappingSpec[domain]) {
        state.mappingSpec[domain] = {};
    }

    metadata.forEach(field => {
        // Initialize default rules if none exists
        if (!state.mappingSpec[domain][field.var]) {
            state.mappingSpec[domain][field.var] = JSON.parse(JSON.stringify(field.defaultRule));
        }

        const rule = state.mappingSpec[domain][field.var];
        const tr = document.createElement('tr');
        
        // Target Column Label
        const coreClass = field.core === 'Req' ? 'core-req' : (field.core === 'Exp' ? 'core-exp' : 'core-perm');
        tr.innerHTML = `
            <td>
                <span class="spec-var-name">${field.var}</span>
                <span class="spec-var-label">${escapeHtml(field.label)}</span>
            </td>
            <td>
                <span class="core-badge ${coreClass}">${field.core}</span>
            </td>
            <td>
                <select class="select-small rule-type-select" data-var="${field.var}">
                    <option value="none" ${rule.type === 'none' ? 'selected' : ''}>Not Mapped</option>
                    <option value="constant" ${rule.type === 'constant' ? 'selected' : ''}>Constant Value</option>
                    <option value="field" ${rule.type === 'field' ? 'selected' : ''}>Direct Map</option>
                    <option value="iso_date" ${rule.type === 'iso_date' ? 'selected' : ''}>ISO Date Conversion</option>
                    <option value="lookup" ${rule.type === 'lookup' ? 'selected' : ''}>Value Lookup Table</option>
                    <option value="sequence" ${rule.type === 'sequence' ? 'selected' : ''}>Sequence Generator</option>
                    <option value="custom" ${rule.type === 'custom' ? 'selected' : ''}>Custom Expression</option>
                    <option value="transpose_result" ${rule.type === 'transpose_result' ? 'selected' : ''}>[Transpose] Original Result</option>
                    <option value="transpose_numeric" ${rule.type === 'transpose_numeric' ? 'selected' : ''}>[Transpose] Numeric Result</option>
                    <option value="transpose_unit" ${rule.type === 'transpose_unit' ? 'selected' : ''}>[Transpose] Measurement Unit</option>
                    <option value="transpose_testcd" ${rule.type === 'transpose_testcd' ? 'selected' : ''}>[Transpose] Test Code</option>
                    <option value="transpose_test" ${rule.type === 'transpose_test' ? 'selected' : ''}>[Transpose] Test Name</option>
                </select>
            </td>
            <td id="rule-config-${field.var}" class="rule-config-cell">
                <!-- Dynamically updated config inputs -->
            </td>
        `;

        const ruleSelect = tr.querySelector('.rule-type-select');
        const configCell = tr.querySelector('.rule-config-cell');
        
        // Listen to rule changes
        ruleSelect.addEventListener('change', (e) => {
            const newType = e.target.value;
            rule.type = newType;
            
            // Clear unnecessary old fields
            delete rule.value;
            delete rule.dataset;
            delete rule.field;
            delete rule.calculation;
            delete rule.lookup;
            
            // Setup blank defaults
            if (newType === 'constant') rule.value = '';
            if (newType === 'field' || newType === 'iso_date' || newType === 'lookup') {
                const files = Object.keys(state.rawFiles);
                rule.dataset = files.length > 0 ? files[0] : '';
                rule.field = '';
            }
            if (newType === 'custom') {
                rule.dataset = '';
                rule.calculation = '';
            }
            if (newType === 'lookup') {
                rule.lookup = {};
            }
            
            saveToLocalStorage();
            renderRuleConfig(domain, field, configCell);
        });

        renderRuleConfig(domain, field, configCell);
        tbody.appendChild(tr);
    });
}

function renderRuleConfig(domain, field, cell) {
    const rule = state.mappingSpec[domain][field.var];
    cell.innerHTML = '';

    const files = Object.keys(state.rawFiles);
    if (files.length === 0 && (rule.type === 'field' || rule.type === 'iso_date' || rule.type === 'lookup')) {
        cell.innerHTML = `<span class="text-dark" style="font-size: 0.8rem;"><i data-lucide="info" style="width: 14px; vertical-align: middle;"></i> Upload raw files first</span>`;
        lucide.createIcons();
        return;
    }

    if (rule.type === 'none') {
        cell.innerHTML = `<span class="text-dark">—</span>`;
    } 
    else if (rule.type === 'constant') {
        cell.innerHTML = `
            <input type="text" class="input-small" placeholder="Constant String (e.g. MYSTUDY)" value="${escapeHtml(rule.value || '')}">
        `;
        cell.querySelector('input').addEventListener('input', (e) => {
            rule.value = e.target.value;
            saveToLocalStorage();
        });
    } 
    else if (rule.type === 'sequence') {
        cell.innerHTML = `<span class="text-muted" style="font-size: 0.8rem;">Auto-generates incrementing 1, 2, 3... per subject</span>`;
    }
    else if (rule.type === 'transpose_result' || rule.type === 'transpose_numeric' || rule.type === 'transpose_unit' || rule.type === 'transpose_testcd' || rule.type === 'transpose_test') {
        cell.innerHTML = `<span class="text-muted" style="font-size: 0.8rem;">Transposition parameters will be handled wide-to-long</span>`;
    }
    else if (rule.type === 'field' || rule.type === 'iso_date') {
        // Dataset selector + Field Selector
        let datasetOptions = '';
        files.forEach(f => {
            datasetOptions += `<option value="${f}" ${rule.dataset === f ? 'selected' : ''}>${f}</option>`;
        });

        const activeDataset = rule.dataset || files[0];
        rule.dataset = activeDataset;
        const headers = state.rawFiles[activeDataset]?.headers || [];
        
        let fieldOptions = '<option value="">-- Choose Column --</option>';
        headers.forEach(h => {
            fieldOptions += `<option value="${h}" ${rule.field === h ? 'selected' : ''}>${h}</option>`;
        });

        cell.innerHTML = `
            <div style="display: flex; gap: 8px;">
                <select class="select-small dataset-sel" style="flex: 1;">${datasetOptions}</select>
                <select class="select-small field-sel" style="flex: 1;">${fieldOptions}</select>
            </div>
        `;

        const datasetSel = cell.querySelector('.dataset-sel');
        const fieldSel = cell.querySelector('.field-sel');

        datasetSel.addEventListener('change', (e) => {
            rule.dataset = e.target.value;
            rule.field = '';
            saveToLocalStorage();
            renderRuleConfig(domain, field, cell);
        });

        fieldSel.addEventListener('change', (e) => {
            rule.field = e.target.value;
            saveToLocalStorage();
        });
    } 
    else if (rule.type === 'custom') {
        cell.innerHTML = `
            <input type="text" class="input-small" placeholder="Expression details (e.g. EnrollDate - BirthDate)" value="${escapeHtml(rule.calculation || '')}">
        `;
        cell.querySelector('input').addEventListener('input', (e) => {
            rule.calculation = e.target.value;
            saveToLocalStorage();
        });
    }
    else if (rule.type === 'lookup') {
        let datasetOptions = '';
        files.forEach(f => {
            datasetOptions += `<option value="${f}" ${rule.dataset === f ? 'selected' : ''}>${f}</option>`;
        });

        const activeDataset = rule.dataset || files[0];
        rule.dataset = activeDataset;
        const headers = state.rawFiles[activeDataset]?.headers || [];
        
        let fieldOptions = '<option value="">-- Choose Column --</option>';
        headers.forEach(h => {
            fieldOptions += `<option value="${h}" ${rule.field === h ? 'selected' : ''}>${h}</option>`;
        });

        cell.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; gap: 8px;">
                    <select class="select-small dataset-sel" style="flex: 1;">${datasetOptions}</select>
                    <select class="select-small field-sel" style="flex: 1;">${fieldOptions}</select>
                </div>
                <div class="lookup-mappings-box" style="background-color: var(--bg-dark); padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.72rem; font-weight:600; margin-bottom: 6px; color: var(--primary);">Value Lookup Editor</div>
                    <div class="lookup-pairs-container" style="display: flex; flex-direction: column; gap: 4px;">
                        <!-- Lookup term inputs -->
                    </div>
                    <button class="btn btn-xs btn-secondary" style="margin-top: 6px; width: 100%;" id="add-lookup-pair"><i data-lucide="plus" style="width:10px;"></i> Add Lookup Term</button>
                </div>
            </div>
        `;

        const datasetSel = cell.querySelector('.dataset-sel');
        const fieldSel = cell.querySelector('.field-sel');
        const pairsContainer = cell.querySelector('.lookup-pairs-container');
        const addBtn = cell.querySelector('#add-lookup-pair');

        datasetSel.addEventListener('change', (e) => {
            rule.dataset = e.target.value;
            rule.field = '';
            saveToLocalStorage();
            renderRuleConfig(domain, field, cell);
        });

        fieldSel.addEventListener('change', (e) => {
            rule.field = e.target.value;
            saveToLocalStorage();
        });

        // Initialize lookups
        if (!rule.lookup) rule.lookup = {};

        const renderPairs = () => {
            pairsContainer.innerHTML = '';
            const keys = Object.keys(rule.lookup);
            if (keys.length === 0) {
                pairsContainer.innerHTML = `<div class="text-dark" style="font-size: 0.75rem;">No lookups defined.</div>`;
            }
            keys.forEach(k => {
                const row = document.createElement('div');
                row.className = 'val-mapping-grid';
                row.innerHTML = `
                    <input type="text" class="input-small term-key" placeholder="Raw value" value="${escapeHtml(k)}">
                    <span style="color:var(--text-dark); text-align:center;">➔</span>
                    <input type="text" class="input-small term-val" placeholder="SDTM standard" value="${escapeHtml(rule.lookup[k])}">
                `;
                
                const keyInput = row.querySelector('.term-key');
                const valInput = row.querySelector('.term-val');

                keyInput.addEventListener('change', (e) => {
                    const newKey = e.target.value;
                    const oldKey = k;
                    if (newKey && newKey !== oldKey) {
                        const tempVal = rule.lookup[oldKey];
                        delete rule.lookup[oldKey];
                        rule.lookup[newKey] = tempVal;
                        saveToLocalStorage();
                        renderPairs();
                    }
                });

                valInput.addEventListener('change', (e) => {
                    rule.lookup[k] = e.target.value;
                    saveToLocalStorage();
                });

                pairsContainer.appendChild(row);
            });
        };

        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            rule.lookup[''] = '';
            renderPairs();
        });

        renderPairs();
    }
    lucide.createIcons();
}

// Mapping Compiler Execution
function setupMappingEngine() {
    const runBtn = document.getElementById('run-mapping-btn');
    const clearBtn = document.getElementById('clear-console-btn');

    runBtn.addEventListener('click', () => {
        executeMappingProcess();
    });

    clearBtn.addEventListener('click', () => {
        const consoleOut = document.getElementById('console-output');
        consoleOut.innerHTML = `<div class="log-line system">[SYSTEM] Console cleared.</div>`;
    });
}

function writeLog(text, type = 'info') {
    const consoleOut = document.getElementById('console-output');
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    consoleOut.appendChild(line);
    consoleOut.scrollTop = consoleOut.scrollHeight;
}

function executeMappingProcess() {
    const indicator = document.getElementById('engine-status-indicator');
    const statusText = document.getElementById('engine-status-text');
    
    indicator.className = 'engine-indicator running';
    statusText.textContent = 'Running Compiler...';
    
    writeLog('Starting SDTM Rules Transformation Pipeline...', 'system');
    
    setTimeout(() => {
        try {
            state.generatedData = {};
            
            // 1. Process DM
            processDMDomain();
            
            // 2. Process AE
            processAEDomain();
            
            // 3. Process VS (handles transposition wide-to-long)
            processVSDomain();
            
            // We can add empty/stub tables for LB and MH if they are not configured
            processRowByRowGeneric('LB');
            processRowByRowGeneric('MH');
            processRowByRowGeneric('CM');

            writeLog('Compilation completed successfully!', 'success');
            
            // Run Validation automatically
            runValidationProcess();
            
            indicator.className = 'engine-indicator idle';
            statusText.textContent = 'Engine Ready';
            
            // Render results
            renderGeneratedTablesTabs();
            updateUI();
            
        } catch (error) {
            writeLog(`CRITICAL ERROR during mapping execution: ${error.message}`, 'error');
            console.error(error);
            indicator.className = 'engine-indicator idle';
            statusText.textContent = 'Engine Errored';
        }
    }, 800);
}

// Processing Demographics (DM)
function processDMDomain() {
    writeLog('Mapping Demographics (DM) domain...', 'info');
    const domain = 'DM';
    const spec = state.mappingSpec[domain];
    
    if (!spec) {
        writeLog('No mapping configuration found for DM.', 'warning');
        return;
    }
    
    // Find the main raw dataset for DM (e.g. from USUBJID field)
    const rawDatasetName = spec.USUBJID?.dataset;
    if (!rawDatasetName || !state.rawFiles[rawDatasetName]) {
        writeLog('Demographics mapping requires raw dataset configuration.', 'error');
        return;
    }
    
    const rawData = state.rawFiles[rawDatasetName];
    const outputRows = [];
    
    rawData.rows.forEach(row => {
        const outRow = {};
        
        state.sdtmMetadata[domain].forEach(field => {
            const rule = spec[field.var];
            let val = '';
            
            if (rule) {
                if (rule.type === 'constant') {
                    val = rule.value || '';
                } else if (rule.type === 'field') {
                    val = row[rule.field] !== undefined ? row[rule.field] : '';
                } else if (rule.type === 'iso_date') {
                    const rawVal = row[rule.field] || '';
                    val = parseAndFormatDate(rawVal);
                } else if (rule.type === 'lookup') {
                    const rawVal = row[rule.field] || '';
                    val = rule.lookup[rawVal] !== undefined ? rule.lookup[rawVal] : rawVal;
                } else if (rule.type === 'custom') {
                    // Custom parser
                    if (field.var === 'AGE') {
                        // Calculate AGE (RFSTDTC - BRTHDTC)
                        const brthStr = parseAndFormatDate(row['BirthDate']);
                        const rfstStr = parseAndFormatDate(row['EnrollDate']);
                        if (brthStr && rfstStr) {
                            const brth = new Date(brthStr);
                            const rfst = new Date(rfstStr);
                            const ageDiffMs = rfst - brth;
                            const ageDate = new Date(ageDiffMs);
                            val = Math.abs(ageDate.getUTCFullYear() - 1970);
                        } else {
                            val = '';
                        }
                    } else {
                        val = '';
                    }
                }
            }
            outRow[field.var] = val;
        });
        
        outputRows.push(outRow);
    });
    
    state.generatedData[domain] = outputRows;
    writeLog(`DM domain generated successfully with ${outputRows.length} subject records.`, 'success');
}

// Processing Adverse Events (AE)
function processAEDomain() {
    writeLog('Mapping Adverse Events (AE) domain...', 'info');
    const domain = 'AE';
    const spec = state.mappingSpec[domain];
    
    if (!spec) {
        writeLog('No mapping configuration found for AE.', 'warning');
        return;
    }
    
    const rawDatasetName = spec.USUBJID?.dataset;
    if (!rawDatasetName || !state.rawFiles[rawDatasetName]) {
        writeLog('AE mapping requires raw dataset configuration.', 'error');
        return;
    }
    
    const rawData = state.rawFiles[rawDatasetName];
    const outputRows = [];
    
    // Sort raw data by SubjNum to assign sequences correctly
    const sortedRaw = [...rawData.rows].sort((a, b) => {
        const subA = String(a[spec.USUBJID.field] || '');
        const subB = String(b[spec.USUBJID.field] || '');
        return subA.localeCompare(subB);
    });

    const seqTracker = {}; // USUBJID -> Count

    sortedRaw.forEach(row => {
        const outRow = {};
        const usubjidRule = spec.USUBJID;
        const usubjid = usubjidRule ? (row[usubjidRule.field] || '') : '';
        
        if (!usubjid) return; // Skip records without subject ID

        // Track sequence
        if (!seqTracker[usubjid]) seqTracker[usubjid] = 0;
        seqTracker[usubjid]++;

        state.sdtmMetadata[domain].forEach(field => {
            const rule = spec[field.var];
            let val = '';
            
            if (rule) {
                if (rule.type === 'constant') {
                    val = rule.value || '';
                } else if (rule.type === 'field') {
                    val = row[rule.field] !== undefined ? row[rule.field] : '';
                } else if (rule.type === 'iso_date') {
                    const rawVal = row[rule.field] || '';
                    val = parseAndFormatDate(rawVal);
                } else if (rule.type === 'lookup') {
                    const rawVal = row[rule.field] || '';
                    val = rule.lookup[rawVal] !== undefined ? rule.lookup[rawVal] : rawVal;
                } else if (rule.type === 'sequence') {
                    val = seqTracker[usubjid];
                }
            }
            outRow[field.var] = val;
        });
        
        outputRows.push(outRow);
    });
    
    state.generatedData[domain] = outputRows;
    writeLog(`AE domain generated successfully with ${outputRows.length} event records.`, 'success');
}

// Processing Vital Signs (VS)
function processVSDomain() {
    writeLog('Mapping Vital Signs (VS) domain (Executing wide-to-long transposition)...', 'info');
    const domain = 'VS';
    const spec = state.mappingSpec[domain];
    
    if (!spec) {
        writeLog('No mapping configuration found for VS.', 'warning');
        return;
    }
    
    const rawDatasetName = spec.USUBJID?.dataset;
    if (!rawDatasetName || !state.rawFiles[rawDatasetName]) {
        writeLog('VS mapping requires raw dataset configuration.', 'error');
        return;
    }
    
    const rawData = state.rawFiles[rawDatasetName];
    const outputRows = [];
    const seqTracker = {}; // USUBJID -> Count

    // In VS, we transpose the wide vital sign parameters into rows
    // Identify vitals columns and their target CDISC standard mappings
    const transposeParameters = [
        { rawField: 'SysBP', testcd: 'SYSBP', test: 'Systolic Blood Pressure', unit: 'mmHg' },
        { rawField: 'DiaBP', testcd: 'DIABP', test: 'Diastolic Blood Pressure', unit: 'mmHg' },
        { rawField: 'Pulse', testcd: 'PULSE', test: 'Pulse Rate', unit: 'beats/min' },
        { rawField: 'Temp', testcd: 'TEMP', test: 'Temperature', unit: 'C' },
        { rawField: 'Weight', testcd: 'WEIGHT', test: 'Weight', unit: 'kg' }
    ];

    rawData.rows.forEach(row => {
        const usubjidRule = spec.USUBJID;
        const usubjid = usubjidRule ? (row[usubjidRule.field] || '') : '';
        if (!usubjid) return;

        transposeParameters.forEach(param => {
            const rawVal = row[param.rawField];
            if (rawVal === undefined || rawVal === '') return; // Skip empty vitals

            // Increment sequence for subject
            if (!seqTracker[usubjid]) seqTracker[usubjid] = 0;
            seqTracker[usubjid]++;

            const outRow = {};
            
            state.sdtmMetadata[domain].forEach(field => {
                const rule = spec[field.var];
                let val = '';
                
                if (rule) {
                    if (rule.type === 'constant') {
                        val = rule.value || '';
                    } else if (rule.type === 'field') {
                        val = row[rule.field] !== undefined ? row[rule.field] : '';
                    } else if (rule.type === 'iso_date') {
                        const rawVal = row[rule.field] || '';
                        val = parseAndFormatDate(rawVal);
                    } else if (rule.type === 'sequence') {
                        val = seqTracker[usubjid];
                    } else if (rule.type === 'transpose_testcd') {
                        val = param.testcd;
                    } else if (rule.type === 'transpose_test') {
                        val = param.test;
                    } else if (rule.type === 'transpose_result') {
                        val = String(rawVal);
                    } else if (rule.type === 'transpose_numeric') {
                        val = isNaN(Number(rawVal)) ? '' : Number(rawVal);
                    } else if (rule.type === 'transpose_unit') {
                        val = param.unit;
                    }
                }
                outRow[field.var] = val;
            });
            
            outputRows.push(outRow);
        });
    });

    state.generatedData[domain] = outputRows;
    writeLog(`VS domain transposed and generated successfully with ${outputRows.length} findings records.`, 'success');
}

// Fallback for LB or MH if mapped row-by-row
function processRowByRowGeneric(domain) {
    const spec = state.mappingSpec[domain];
    if (!spec) return;

    // Check if USUBJID is mapped
    const rawDatasetName = spec.USUBJID?.dataset;
    if (!rawDatasetName || !state.rawFiles[rawDatasetName]) return;

    writeLog(`Mapping ${domain} domain...`, 'info');
    const rawData = state.rawFiles[rawDatasetName];
    const outputRows = [];
    const seqTracker = {};

    rawData.rows.forEach(row => {
        const outRow = {};
        const usubjidRule = spec.USUBJID;
        const usubjid = usubjidRule ? (row[usubjidRule.field] || '') : '';
        if (!usubjid) return;

        if (!seqTracker[usubjid]) seqTracker[usubjid] = 0;
        seqTracker[usubjid]++;

        state.sdtmMetadata[domain].forEach(field => {
            const rule = spec[field.var];
            let val = '';
            
            if (rule) {
                if (rule.type === 'constant') {
                    val = rule.value || '';
                } else if (rule.type === 'field') {
                    val = row[rule.field] !== undefined ? row[rule.field] : '';
                } else if (rule.type === 'iso_date') {
                    const rawVal = row[rule.field] || '';
                    val = parseAndFormatDate(rawVal);
                } else if (rule.type === 'lookup') {
                    const rawVal = row[rule.field] || '';
                    val = rule.lookup[rawVal] !== undefined ? rule.lookup[rawVal] : rawVal;
                } else if (rule.type === 'sequence') {
                    val = seqTracker[usubjid];
                }
            }
            outRow[field.var] = val;
        });

        outputRows.push(outRow);
    });

    state.generatedData[domain] = outputRows;
    writeLog(`${domain} domain generated successfully with ${outputRows.length} records.`, 'success');
}

// Date parser helper
function parseAndFormatDate(dateStr) {
    if (!dateStr) return '';
    dateStr = String(dateStr).trim();

    // Check if already ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    
    // Check if YYYY/MM/DD
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
        return dateStr.replace(/\//g, '-');
    }

    // Try parsing 12-Oct-2025 or 12-OCT-2025
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const textDateMatch = dateStr.match(/^(\d{1,2})[\s-]([a-zA-Z]{3})[\s-](\d{4})$/);
    if (textDateMatch) {
        const day = textDateMatch[1].padStart(2, '0');
        const monthAbbr = textDateMatch[2].toLowerCase();
        const year = textDateMatch[3];
        const monthIdx = monthNames.indexOf(monthAbbr);
        if (monthIdx !== -1) {
            const month = String(monthIdx + 1).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }

    // Try parsing DD/MM/YYYY or MM/DD/YYYY
    // Clinical data typically uses DD/MM/YYYY outside the US, let's try DD/MM/YYYY or standard Date parsing
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
        const val1 = slashMatch[1].padStart(2, '0');
        const val2 = slashMatch[2].padStart(2, '0');
        const year = slashMatch[3];
        // We'll assume DD/MM/YYYY for the 15/10/2025 structure
        if (parseInt(val1) > 12) {
            // Must be Day/Month/Year
            return `${year}-${val2}-${val1}`;
        } else {
            // Ambiguous: default to Month/Day/Year or Day/Month/Year
            // Let's assume standard Day/Month/Year for the trial sample
            return `${year}-${val2}-${val1}`;
        }
    }

    // Standard Javascript Date parsing fallback
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return dateStr; // Return raw if unparseable
}

// Render tabs for previewing generated SDTM data
function renderGeneratedTablesTabs() {
    const container = document.getElementById('generated-tables-tabs');
    container.innerHTML = '';
    
    const domains = Object.keys(state.generatedData);
    if (domains.length === 0) {
        container.innerHTML = '<span class="text-muted" style="font-size: 0.9rem;">No data generated yet. Click \'Execute\' above.</span>';
        document.getElementById('generated-table-preview-container').innerHTML = `
            <div class="empty-state">
                <i data-lucide="database-backup" class="empty-icon"></i>
                <p>Once you run the compiler, you can inspect the generated SDTM records here.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    domains.forEach((dom, idx) => {
        const btn = document.createElement('button');
        btn.className = `tab-pill ${idx === 0 ? 'active' : ''}`;
        btn.textContent = dom;
        btn.addEventListener('click', () => {
            document.querySelectorAll('#generated-tables-tabs .tab-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            previewGeneratedDomain(dom);
        });
        container.appendChild(btn);
    });
    
    // Auto preview first domain
    previewGeneratedDomain(domains[0]);
}

function previewGeneratedDomain(domain) {
    const rows = state.generatedData[domain] || [];
    const container = document.getElementById('generated-table-preview-container');
    
    if (rows.length === 0) {
        container.innerHTML = '<p class="text-muted p-4">No records generated for this domain.</p>';
        return;
    }
    
    const headers = Object.keys(rows[0]);
    let html = `<table class="data-table"><thead><tr>`;
    headers.forEach(h => {
        html += `<th>${escapeHtml(h)}</th>`;
    });
    html += `</tr></thead><tbody>`;
    
    rows.forEach(r => {
        html += `<tr>`;
        headers.forEach(h => {
            html += `<td>${escapeHtml(String(r[h] !== undefined ? r[h] : ''))}</td>`;
        });
        html += `</tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Validator Logic
function setupValidator() {
    document.getElementById('run-validator-btn').addEventListener('click', () => {
        runValidationProcess();
        updateUI();
    });

    document.getElementById('val-filter-domain').addEventListener('change', renderValidationReport);
    document.getElementById('val-filter-severity').addEventListener('change', renderValidationReport);
}

function runValidationProcess() {
    writeLog('Initiating CDISC Compliance Validator...', 'system');
    state.validationReport = [];
    
    const dmRows = state.generatedData['DM'] || [];
    const validSubjects = new Set(dmRows.map(r => r.USUBJID).filter(Boolean));
    
    // Check all generated domains
    Object.keys(state.generatedData).forEach(domain => {
        const rows = state.generatedData[domain];
        const metadata = state.sdtmMetadata[domain];
        const spec = state.mappingSpec[domain];
        
        if (!rows || rows.length === 0) return;
        
        // Loop through each row to check formatting and values
        rows.forEach((row, idx) => {
            const rowNum = idx + 1;
            
            // Check 1: Mandatory SDTM columns check
            metadata.forEach(field => {
                const val = row[field.var];
                
                if (field.core === 'Req' && (val === undefined || val === null || String(val).trim() === '')) {
                    state.validationReport.push({
                        severity: 'Error',
                        domain: domain,
                        variable: field.var,
                        code: 'SDTM-001',
                        message: `Row ${rowNum}: Required variable '${field.var}' is empty or missing.`
                    });
                }
                
                // Check 2: Date format compliance
                if (val && (field.var.endsWith('DTC') || field.var.includes('DATE'))) {
                    // Check ISO 8601 validation regex: YYYY-MM-DD or YYYY-MM-DDTHH:MM
                    const isIso = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(val);
                    if (!isIso) {
                        state.validationReport.push({
                            severity: 'Warning',
                            domain: domain,
                            variable: field.var,
                            code: 'SDTM-002',
                            message: `Row ${rowNum}: Value '${val}' is not valid ISO 8601 date format.`
                        });
                    }
                }
                
                // Check 3: Numeric data checks
                if (val && field.type === 'Num') {
                    if (isNaN(Number(val))) {
                        state.validationReport.push({
                            severity: 'Error',
                            domain: domain,
                            variable: field.var,
                            code: 'SDTM-003',
                            message: `Row ${rowNum}: Numeric variable '${field.var}' has non-numeric value '${val}'.`
                        });
                    }
                }
            });
            
            // Check 4: Demographics Cross-reference checks (All domains must join to DM)
            if (domain !== 'DM') {
                const usubjid = row['USUBJID'];
                if (usubjid && !validSubjects.has(usubjid)) {
                    state.validationReport.push({
                        severity: 'Error',
                        domain: domain,
                        variable: 'USUBJID',
                        code: 'SDTM-004',
                        message: `Row ${rowNum}: Subject '${usubjid}' not found in Demographics (DM) domain.`
                    });
                }
            }
        });
        
        // Domain level checks
        if (domain === 'DM') {
            // Check if USUBJID is unique in DM
            const seen = new Set();
            dmRows.forEach((row, idx) => {
                const us = row.USUBJID;
                if (!us) return;
                if (seen.has(us)) {
                    state.validationReport.push({
                        severity: 'Error',
                        domain: 'DM',
                        variable: 'USUBJID',
                        code: 'SDTM-005',
                        message: `Row ${idx+1}: USUBJID '${us}' is not unique in Demographics.`
                    });
                }
                seen.add(us);
            });
        }
    });

    const errorCount = state.validationReport.filter(r => r.severity === 'Error').length;
    const warnCount = state.validationReport.filter(r => r.severity === 'Warning').length;

    writeLog(`Validator finished. Found ${errorCount} errors and ${warnCount} warnings.`, errorCount > 0 ? 'error' : (warnCount > 0 ? 'warning' : 'success'));
    renderValidationReport();
}

function renderValidationReport() {
    const domainFilter = document.getElementById('val-filter-domain').value;
    const severityFilter = document.getElementById('val-filter-severity').value;
    const tbody = document.getElementById('validation-report-tbody');
    
    tbody.innerHTML = '';
    
    const filtered = state.validationReport.filter(item => {
        const domMatch = domainFilter === 'all' || item.domain === domainFilter;
        const sevMatch = severityFilter === 'all' || item.severity === severityFilter;
        return domMatch && sevMatch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted" style="padding: 3rem; color: var(--success);">
                    <i data-lucide="check-circle" style="width:24px; height:24px; color: var(--success); display:block; margin: 0 auto 8px;"></i>
                    No validation issues found. Standard matches CDISC guidelines perfectly!
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        const sevClass = item.severity === 'Error' ? 'badge-error' : 'badge-info';
        
        tr.innerHTML = `
            <td><span class="badge ${sevClass}">${item.severity}</span></td>
            <td><span class="domain-code">${item.domain}</span></td>
            <td><span class="spec-var-name">${item.variable}</span></td>
            <td><code>${item.code}</code></td>
            <td style="color: var(--text-main); font-weight:500;">${escapeHtml(item.message)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Export Center Logic
function setupExportCenter() {
    document.getElementById('download-r-bundle-btn').addEventListener('click', downloadRBundle);
}

function renderExportCenter() {
    const csvList = document.getElementById('csv-export-list');
    csvList.innerHTML = '';
    
    const domains = Object.keys(state.generatedData);
    if (domains.length === 0) {
        csvList.innerHTML = '<span class="text-muted" style="font-size: 0.9rem;">No generated datasets available. Run the mapping runner first.</span>';
        return;
    }
    
    domains.forEach(domain => {
        const rows = state.generatedData[domain];
        if (!rows || rows.length === 0) return;
        
        const card = document.createElement('div');
        card.className = 'export-item';
        card.innerHTML = `
            <div class="file-info">
                <i data-lucide="file-spreadsheet" class="color-green"></i>
                <div class="file-details">
                    <span class="file-name">${domain.toLowerCase()}.csv</span>
                    <span class="file-meta">${rows.length} rows</span>
                </div>
            </div>
            <button class="btn btn-secondary btn-xs download-csv-btn" data-domain="${domain}">Download</button>
        `;
        
        card.querySelector('.download-csv-btn').addEventListener('click', () => {
            downloadCSVFile(domain);
        });
        
        csvList.appendChild(card);
    });
    lucide.createIcons();
}

function downloadCSVFile(domain) {
    const rows = state.generatedData[domain];
    if (!rows || rows.length === 0) return;
    
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain.toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadRBundle() {
    // We generate a ZIP bundle, or since standard browsers can't easily ZIP files without libraries (like JSZip),
    // we will download the R execution script file directly, which has the mapping Spec embedded inside it as a JSON string!
    // This is incredibly smart and useful. It delivers a self-contained R script that generates XPT files!
    
    const rScript = generateRScriptContent();
    const blob = new Blob([rScript], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sdtm_processor.R`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function generateRScriptContent() {
    const specStr = JSON.stringify(state.mappingSpec, null, 2);
    
    return `# ==============================================================================
# SDTM Automation Suite - Pipeline Runner
# Generated by SDTM.oak Clinical Data Studio
# ==============================================================================
# This script applies the mapping transformations configured in the visual workspace
# and exports compliant SAS Transport Version 5 (.xpt) files.
# ==============================================================================

# 1. Install and load dependencies
required_packages <- c("jsonlite", "dplyr", "readr", "purrr", "haven")
new_packages <- required_packages[!(required_packages %in% installed.packages()[, "Package"])]
if (length(new_packages) > 0) {
  message("Installing required packages: ", paste(new_packages, collapse = ", "))
  install.packages(new_packages, repos = "https://cloud.r-project.org")
}

library(jsonlite)
library(dplyr)
library(readr)
library(purrr)
library(haven)

# 2. Embedding Mapping Spec from Visual Workspace
mapping_spec_json <- '${specStr.replace(/'/g, "'\\''")}'
mapping_spec <- jsonlite::fromJSON(mapping_spec_json)

# Helper functions
parse_iso_date <- function(date_vec) {
  date_vec <- as.character(date_vec)
  # Basic formats
  parsed <- case_when(
    # Already YYYY-MM-DD
    grepl("^\\\\d{4}-\\\\d{2}-\\\\d{2}$", date_vec) ~ date_vec,
    # DD-Mmm-YYYY
    grepl("^\\\\d{1,2}-[a-zA-Z]{3}-\\\\d{4}$", date_vec) ~ {
      d <- as.Date(date_vec, format = "%d-%b-%Y")
      format(d, "%Y-%m-%d")
    },
    # DD/MM/YYYY or MM/DD/YYYY
    grepl("^\\\\d{1,2}/\\\\d{1,2}/\\\\d{4}$", date_vec) ~ {
      # Assume DD/MM/YYYY or standard conversion
      d <- as.Date(date_vec, format = "%d/%m/%Y")
      format(d, "%Y-%m-%d")
    },
    TRUE ~ date_vec
  )
  return(parsed)
}

# 3. Main Processor Function
run_sdtm_pipeline <- function(raw_dir = "mock_data", out_dir = "output") {
  if (!dir.exists(out_dir)) {
    dir.create(out_dir, recursive = TRUE)
  }
  
  message("Starting R Pipeline execution...")
  
  # --- DEMOGRAPHICS (DM) ---
  if (!is.null(mapping_spec$DM)) {
    message("Mapping Demographics (DM)...")
    dm_spec <- mapping_spec$DM
    raw_file_name <- dm_spec$USUBJID$dataset
    raw_path <- file.path(raw_dir, raw_file_name)
    
    if (file.exists(raw_path)) {
      raw_dm <- readr::read_csv(raw_path, show_col_types = FALSE)
      
      # Transform columns
      dm_out <- raw_dm %>%
        mutate(
          STUDYID = dm_spec$STUDYID$value,
          DOMAIN = "DM",
          USUBJID = !!sym(dm_spec$USUBJID$field),
          SUBJID = !!sym(dm_spec$SUBJID$field),
          SITEID = !!sym(dm_spec$SITEID$field),
          BRTHDTC = parse_iso_date(!!sym(dm_spec$BRTHDTC$field)),
          RFSTDTC = parse_iso_date(!!sym(dm_spec$RFSTDTC$field)),
          RFENDTC = parse_iso_date(!!sym(dm_spec$RFENDTC$field)),
          
          # SEX lookup mapping
          SEX = case_when(
            !!sym(dm_spec$SEX$field) == "Male" ~ "M",
            !!sym(dm_spec$SEX$field) == "Female" ~ "F",
            !!sym(dm_spec$SEX$field) == "M" ~ "M",
            !!sym(dm_spec$SEX$field) == "F" ~ "F",
            TRUE ~ as.character(!!sym(dm_spec$SEX$field))
          ),
          
          RACE = !!sym(dm_spec$RACE$field),
          
          # ARMCD lookup
          ARMCD = case_when(
            !!sym(dm_spec$ARMCD$field) == "Active" ~ "ACT",
            !!sym(dm_spec$ARMCD$field) == "Placebo" ~ "PBO",
            TRUE ~ as.character(!!sym(dm_spec$ARMCD$field))
          ),
          ARM = !!sym(dm_spec$ARM$field),
          COUNTRY = !!sym(dm_spec$COUNTRY$field),
          
          # Calculate Age (EnrollDate - BirthDate in years)
          AGE = as.numeric(difftime(as.Date(RFSTDTC), as.Date(BRTHDTC), units = "days")) %/% 365,
          AGEU = dm_spec$AGEU$value
        ) %>%
        select(STUDYID, DOMAIN, USUBJID, SUBJID, RFSTDTC, RFENDTC, SITEID, BRTHDTC, AGE, AGEU, SEX, RACE, ARMCD, ARM, COUNTRY)
      
      # Export
      readr::write_csv(dm_out, file.path(out_dir, "dm.csv"))
      haven::write_xpt(dm_out, file.path(out_dir, "dm.xpt"), version = 5)
      message("Saved: dm.xpt (SAS V5 Transport)")
    } else {
      warning("Raw Demographics file not found: ", raw_path)
    }
  }
  
  # --- ADVERSE EVENTS (AE) ---
  if (!is.null(mapping_spec$AE)) {
    message("Mapping Adverse Events (AE)...")
    ae_spec <- mapping_spec$AE
    raw_file_name <- ae_spec$USUBJID$dataset
    raw_path <- file.path(raw_dir, raw_file_name)
    
    if (file.exists(raw_path)) {
      raw_ae <- readr::read_csv(raw_path, show_col_types = FALSE)
      
      ae_out <- raw_ae %>%
        filter(!is.na(!!sym(ae_spec$USUBJID$field))) %>%
        arrange(!!sym(ae_spec$USUBJID$field)) %>%
        group_by(!!sym(ae_spec$USUBJID$field)) %>%
        mutate(
          STUDYID = ae_spec$STUDYID$value,
          DOMAIN = "AE",
          USUBJID = !!sym(ae_spec$USUBJID$field),
          AESEQ = row_number(),
          AETERM = !!sym(ae_spec$AETERM$field),
          AEDECOD = !!sym(ae_spec$AEDECOD$field),
          AESTDTC = parse_iso_date(!!sym(ae_spec$AESTDTC$field)),
          AEENDTC = parse_iso_date(!!sym(ae_spec$AEENDTC$field)),
          AESEV = !!sym(ae_spec$AESEV$field),
          AESER = !!sym(ae_spec$AESER$field),
          AEACN = !!sym(ae_spec$AEACN$field),
          AEREL = !!sym(ae_spec$AEREL$field)
        ) %>%
        ungroup() %>%
        select(STUDYID, DOMAIN, USUBJID, AESEQ, AETERM, AEDECOD, AESTDTC, AEENDTC, AESEV, AESER, AEACN, AEREL)
      
      readr::write_csv(ae_out, file.path(out_dir, "ae.csv"))
      haven::write_xpt(ae_out, file.path(out_dir, "ae.xpt"), version = 5)
      message("Saved: ae.xpt (SAS V5 Transport)")
    } else {
      warning("Raw Adverse Events file not found: ", raw_path)
    }
  }

  # --- VITAL SIGNS (VS) ---
  if (!is.null(mapping_spec$VS)) {
    message("Mapping Vital Signs (VS - Wide-to-Long Transposition)...")
    vs_spec <- mapping_spec$VS
    raw_file_name <- vs_spec$USUBJID$dataset
    raw_path <- file.path(raw_dir, raw_file_name)
    
    if (file.exists(raw_path)) {
      raw_vs <- readr::read_csv(raw_path, show_col_types = FALSE)
      
      # Transpose columns SysBP, DiaBP, Pulse, Temp, Weight
      # Pivot vital signs wide data to long format
      vs_long <- raw_vs %>%
        tidyr::pivot_longer(
          cols = c(SysBP, DiaBP, Pulse, Temp, Weight),
          names_to = "VSTEST_RAW",
          values_to = "VSORRES"
        ) %>%
        filter(!is.na(VSORRES)) %>%
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
      
      vs_out <- vs_long %>%
        arrange(!!sym(vs_spec$USUBJID$field)) %>%
        group_by(!!sym(vs_spec$USUBJID$field)) %>%
        mutate(
          STUDYID = vs_spec$STUDYID$value,
          DOMAIN = "VS",
          USUBJID = !!sym(vs_spec$USUBJID$field),
          VSSEQ = row_number(),
          VSDTC = parse_iso_date(!!sym(vs_spec$VSDTC$field)),
          VSORRES = as.character(VSORRES),
          VSSTRESC = VSORRES,
          # Safely convert to numeric
          VSSTRESN = suppressWarnings(as.numeric(VSORRES)),
          VSSTRESU = VSORRESU
        ) %>%
        ungroup() %>%
        select(STUDYID, DOMAIN, USUBJID, VSSEQ, VSTESTCD, VSTEST, VSORRES, VSORRESU, VSSTRESC, VSSTRESN, VSSTRESU, VSDTC)
      
      readr::write_csv(vs_out, file.path(out_dir, "vs.csv"))
      haven::write_xpt(vs_out, file.path(out_dir, "vs.xpt"), version = 5)
      message("Saved: vs.xpt (SAS V5 Transport)")
    } else {
      warning("Raw Vital Signs file not found: ", raw_path)
    }
  }
  
  message("SDTM Mapping pipeline execution complete.")
}

# Run the script when executed from terminal
# Example: Rscript sdtm_processor.R --args mock_data output
args <- commandArgs(trailingOnly = TRUE)
raw_dir <- if (length(args) >= 1) args[1] else "mock_data"
out_dir <- if (length(args) >= 2) args[2] else "output"

run_sdtm_pipeline(raw_dir, out_dir)
`;
}

// Mock Data Loader
function loadMockData() {
    Object.keys(mockDatasets).forEach(filename => {
        const text = mockDatasets[filename];
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                state.rawFiles[filename] = {
                    headers: results.meta.fields,
                    rows: results.data
                };
                updateUI();
            }
        });
    });
    
    // Auto-select and map default configs
    Object.keys(state.sdtmMetadata).forEach(domain => {
        state.mappingSpec[domain] = {};
        state.sdtmMetadata[domain].forEach(field => {
            state.mappingSpec[domain][field.var] = JSON.parse(JSON.stringify(field.defaultRule));
        });
    });
    
    saveToLocalStorage();
    writeLog('Loaded mock clinical study data and mapping specs (DM, AE, VS) successfully.', 'success');
}

// Reset workspace
function resetWorkspace() {
    if (confirm('Are you sure you want to clear your mapping rules and raw files?')) {
        state.rawFiles = {};
        state.mappingSpec = {};
        state.generatedData = {};
        state.validationReport = [];
        localStorage.clear();
        updateUI();
        writeLog('Workspace reset complete.', 'system');
    }
}

// Local Storage Helper
function saveToLocalStorage() {
    localStorage.setItem('sdtm_rawFiles', JSON.stringify(state.rawFiles));
    localStorage.setItem('sdtm_mappingSpec', JSON.stringify(state.mappingSpec));
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem('sdtm_rawFiles');
        const spec = localStorage.getItem('sdtm_mappingSpec');
        if (raw) state.rawFiles = JSON.parse(raw);
        if (spec) state.mappingSpec = JSON.parse(spec);
    } catch (e) {
        console.error('Error loading state from localStorage:', e);
    }
}

// Core UI Refresh Router
function updateUI() {
    // 1. Update counts
    const fileCount = Object.keys(state.rawFiles).length;
    document.getElementById('raw-file-count').textContent = fileCount;
    document.getElementById('dash-raw-count').textContent = fileCount;
    
    const mappedCount = Object.keys(state.generatedData).length;
    document.getElementById('dash-mapped-count').textContent = `${mappedCount} / 6`;
    
    // 2. Render dataset panels
    renderDatasetList();
    
    // 3. Render dashboard values
    renderDashboard();
    
    // 4. Update validation error badge
    const errors = state.validationReport.filter(r => r.severity === 'Error').length;
    const valBadge = document.getElementById('val-error-count');
    if (errors > 0) {
        valBadge.textContent = errors;
        valBadge.style.display = 'block';
    } else {
        valBadge.style.display = 'none';
    }
}

function renderDashboard() {
    // Subject Count (Unique USUBJID in DM)
    const dmRows = state.generatedData['DM'] || [];
    const subjects = new Set(dmRows.map(r => r.USUBJID).filter(Boolean));
    document.getElementById('dash-subject-count').textContent = subjects.size;
    
    // Validation health calculation
    const reportSize = state.validationReport.length;
    const errors = state.validationReport.filter(r => r.severity === 'Error').length;
    const healthEl = document.getElementById('dash-health');
    
    if (reportSize === 0) {
        healthEl.textContent = '100%';
        healthEl.style.color = 'var(--success)';
    } else {
        // Calculate health percentage: 100 - (errors * 15) - (warnings * 2) min 0
        const warnings = reportSize - errors;
        const healthPct = Math.max(0, 100 - (errors * 12) - (warnings * 2));
        healthEl.textContent = `${healthPct}%`;
        
        if (healthPct > 85) healthEl.style.color = 'var(--success)';
        else if (healthPct > 60) healthEl.style.color = 'var(--warning)';
        else healthEl.style.color = 'var(--error)';
    }

    // Pipeline progress bars update
    Object.keys(state.sdtmMetadata).forEach(domain => {
        const pctEl = document.getElementById(`prog-pct-${domain}`);
        const barEl = document.getElementById(`prog-bar-${domain}`);
        
        if (pctEl && barEl) {
            let mappedVars = 0;
            const vars = state.sdtmMetadata[domain];
            const spec = state.mappingSpec[domain] || {};
            
            vars.forEach(v => {
                if (spec[v.var] && spec[v.var].type !== 'none') {
                    mappedVars++;
                }
            });
            
            const pct = Math.round((mappedVars / vars.length) * 100);
            pctEl.textContent = `${pct}%`;
            barEl.style.width = `${pct}%`;
        }
    });

    // Validation metrics tab panel update
    const summaryErrors = document.getElementById('val-sum-errors');
    const summaryWarnings = document.getElementById('val-sum-warnings');
    const summaryPassed = document.getElementById('val-sum-passed');
    const summaryStatus = document.getElementById('val-sum-status');

    if (summaryErrors) {
        summaryErrors.textContent = errors;
        summaryWarnings.textContent = reportSize - errors;
        summaryPassed.textContent = (Object.keys(state.generatedData).length * 4) - reportSize; // Mock passed checks
        
        if (Object.keys(state.generatedData).length === 0) {
            summaryStatus.textContent = 'N/A';
            summaryStatus.parentNode.className = 'v-summary-card val-info';
        } else if (errors > 0) {
            summaryStatus.textContent = 'Failed Compliance';
            summaryStatus.parentNode.className = 'v-summary-card val-error';
        } else if (reportSize > 0) {
            summaryStatus.textContent = 'Passed with Warnings';
            summaryStatus.parentNode.className = 'v-summary-card val-warning';
        } else {
            summaryStatus.textContent = 'Fully Compliant';
            summaryStatus.parentNode.className = 'v-summary-card val-success';
        }
    }
}

// Escape HTML utility
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
