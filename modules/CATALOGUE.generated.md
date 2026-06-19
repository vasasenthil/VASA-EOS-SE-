# Module Catalogue (GENERATED) — 391 modules · 329 core + 62 TN-specific

Generated from `modules/catalogue.yaml` by `tools/gen_catalogue.py`. Status: **38 implemented · 293 scaffold · 60 spec-only** (`implemented` = a reference-impl port source exists; see `docs/CC-SPEC-001-CROSSWALK.md`).


## identity-access (L5)

| id | module | status | reference source |
|---|---|---|---|
| M0001 | APAAR Learner Identity | scaffold | — |
| M0002 | Citizen Identity (official ID) | scaffold | — |
| M0003 | Teacher Institutional Identity | scaffold | — |
| M0004 | Keycloak Realm — T0 Sovereign | scaffold | — |
| M0005 | Keycloak Realm — Secretariat | scaffold | — |
| M0006 | Keycloak Realm — Directorate | scaffold | — |
| M0007 | Keycloak Realm — District | scaffold | — |
| M0008 | Keycloak Realm — Block | scaffold | — |
| M0009 | Keycloak Realm — Cluster | scaffold | — |
| M0010 | Keycloak Realm — School | scaffold | — |
| M0011 | MFA — TOTP | scaffold | — |
| M0012 | MFA — WebAuthn/FIDO2 | scaffold | — |
| M0013 | MFA — SMS-OTP Fallback | scaffold | — |
| M0014 | AAL3 Step-Up (governance/finance) | scaffold | — |
| M0015 | OIDC Federation | scaffold | — |
| M0016 | SAML 2.0 Federation | scaffold | — |
| M0017 | LDAP Federation | scaffold | — |
| M0018 | DigiLocker SSO | scaffold | — |
| M0019 | Consent Manager (DPDP) | implemented | lib/consent |
| M0020 | Data-Principal Portal | scaffold | — |
| M0021 | DPO Endpoint | scaffold | — |
| M0022 | Consent Receipt (VC) | scaffold | — |
| M0023 | Session Management | scaffold | — |
| M0024 | Refresh-Token Rotation | scaffold | — |
| M0025 | Profile Service | scaffold | — |
| M0026 | Profile Photo (PII-redacted) | scaffold | — |
| M0027 | Role Assignment | scaffold | — |
| M0028 | ReBAC Relationship Store (SpiceDB) | scaffold | — |
| M0029 | Workload Identity (SPIRE) | scaffold | — |
| M0030 | Service-Account Registry | scaffold | — |
| M0031 | Aadhaar e-KYC Wrapper (consent-bound) | scaffold | — |
| M0032 | Account Lockout & Anomaly | scaffold | — |
| M0033 | Device Binding | scaffold | — |
| M0034 | Impersonation Audit | scaffold | — |
| M0035 | Identity Reconciliation (UDISE+/APAAR) | scaffold | — |

## curriculum-content (L7)

| id | module | status | reference source |
|---|---|---|---|
| M0036 | NCERT Content Ingest | scaffold | — |
| M0037 | SCERT Content Ingest | scaffold | — |
| M0038 | NCF Framework Map | scaffold | — |
| M0039 | TN Textbook Ingest (TNTBC) | scaffold | — |
| M0040 | Curriculum Graph (Neo4j) | implemented | lib/knowledge-graph |
| M0041 | Concept Prerequisite Graph | scaffold | — |
| M0042 | Learning-Outcome Map | scaffold | — |
| M0043 | Competency Framework | scaffold | — |
| M0044 | Content Authoring Studio | scaffold | — |
| M0045 | Content Review Workflow | scaffold | — |
| M0046 | Content Versioning | scaffold | — |
| M0047 | Content Tagging (future-skills) | scaffold | — |
| M0048 | Multilingual Translation Pipeline (IndicTrans2) | scaffold | — |
| M0049 | Translation Memory | scaffold | — |
| M0050 | Language QA (LQA) | scaffold | — |
| M0051 | Transliteration | scaffold | — |
| M0052 | Accessibility Transform (AAA) | scaffold | — |
| M0053 | Alt-Text Generation | scaffold | — |
| M0054 | Audio Description | scaffold | — |
| M0055 | Sign-Language (ISL) Overlay | scaffold | — |
| M0056 | Captions & Transcripts | scaffold | — |
| M0057 | Dyslexia-Friendly Rendering | scaffold | — |
| M0058 | DIKSHA Content Read | scaffold | — |
| M0059 | DIKSHA Content Contribute | scaffold | — |
| M0060 | Content Discovery & Search (OpenSearch) | scaffold | — |
| M0061 | Content Recommendation | scaffold | — |
| M0062 | Lesson-Plan Library | scaffold | — |
| M0063 | Question Bank | scaffold | — |
| M0064 | OER Repository | scaffold | — |
| M0065 | Print-Ready PDF Generation | scaffold | — |
| M0066 | QR Verifier on Content | scaffold | — |
| M0067 | Content Licensing & Rights | scaffold | — |
| M0068 | Offline Content Pack | scaffold | — |
| M0069 | Bagless-Day Activity Bank | scaffold | — |
| M0070 | Reading Campaign Content (Ennum Ezhuthum) | implemented | lib/reading |

## learner-lifecycle (L6)

| id | module | status | reference source |
|---|---|---|---|
| M0071 | Admission Application | scaffold | — |
| M0072 | Admission — RTE 25% EWS/DG Lottery | implemented | lib/admissionsflow, app/admissions |
| M0073 | Admission Screening Guard (RTE §13) | scaffold | — |
| M0074 | Enrolment | scaffold | — |
| M0075 | Student Information System (SIS) | scaffold | — |
| M0076 | Class & Section Allocation | scaffold | — |
| M0077 | Roll-Number Issuance | scaffold | — |
| M0078 | Attendance — Daily | scaffold | — |
| M0079 | Attendance — Biometric | scaffold | — |
| M0080 | Attendance — Period-wise | scaffold | — |
| M0081 | Promotion (no-detention) | scaffold | — |
| M0082 | Transfer Certificate (TC) | scaffold | — |
| M0083 | Inter-School Transfer (APAAR portability) | scaffold | — |
| M0084 | Migration Tracking | scaffold | — |
| M0085 | Retention & Dropout Risk (early-warning) | scaffold | — |
| M0086 | Dropout Intervention | scaffold | — |
| M0087 | Out-of-School Children (OOSC) Register | scaffold | — |
| M0088 | Re-Enrolment | scaffold | — |
| M0089 | Age-Grade Mapping | scaffold | — |
| M0090 | Cohort Tracking | scaffold | — |
| M0091 | Pre-KG / Foundational Stage (ICDS link) | scaffold | — |
| M0092 | Health Screening (RBSK) | scaffold | — |
| M0093 | Health Register | implemented | lib/healthregister |
| M0094 | Immunisation Tracking | scaffold | — |
| M0095 | Nutrition (MDM) Linkage | scaffold | — |
| M0096 | CWSN / Special-Needs IEP | scaffold | — |
| M0097 | Girl-Child Equity Tracker | scaffold | — |
| M0098 | First-Generation Learner Tracker | scaffold | — |
| M0099 | Scholarship Eligibility (learner) | scaffold | — |
| M0100 | Credential Wallet | implemented | lib/credentials |
| M0101 | Marksheet Issuance | implemented | lib/credentials |
| M0102 | School-Leaving Certificate | scaffold | — |
| M0103 | Student Council Elections | scaffold | — |
| M0104 | Co-curricular Registration | scaffold | — |
| M0105 | Alumni Registry | scaffold | — |
| M0106 | Career Guidance | scaffold | — |
| M0107 | Parent-Linkage (ReBAC) | scaffold | — |
| M0108 | Guardian Consent (minor) | scaffold | — |

## teacher-lifecycle (L6)

| id | module | status | reference source |
|---|---|---|---|
| M0109 | Teacher Recruitment | scaffold | — |
| M0110 | Teacher Placement | scaffold | — |
| M0111 | Teacher Transfer (counselling) | scaffold | — |
| M0112 | Cadre Rationalisation | scaffold | — |
| M0113 | PTR Compliance (RTE) | scaffold | — |
| M0114 | Vacancy Register | scaffold | — |
| M0115 | HRMS Integration (HRMS-TN) | scaffold | — |
| M0116 | Payroll Linkage (IFMS/Treasury) | scaffold | — |
| M0117 | Service Book (digital) | scaffold | — |
| M0118 | Leave Management | scaffold | — |
| M0119 | Substitute / Cover Arrangement | implemented | lib/coverflow |
| M0120 | Staff Attendance | scaffold | — |
| M0121 | CPD Catalogue | scaffold | — |
| M0122 | CPD Recommendation (Teacher Agent) | implemented | lib/ai/agents |
| M0123 | Training Calendar | scaffold | — |
| M0124 | DIKSHA Teacher CPD | scaffold | — |
| M0125 | Performance SUPPORT (not evaluation) | scaffold | — |
| M0126 | Mentoring (BRC/CRC) | scaffold | — |
| M0127 | Lesson-Plan Assist | scaffold | — |
| M0128 | Marking Assist | scaffold | — |
| M0129 | Grievance (teacher) | scaffold | — |
| M0130 | Background Verification (POCSO) | scaffold | — |
| M0131 | Non-Teaching Staff Register | scaffold | — |
| M0132 | Cook-cum-Helper (MDM) | scaffold | — |
| M0133 | Guest Lecture Management | scaffold | — |
| M0134 | Teacher Workload Analytics | scaffold | — |
| M0135 | Subject-Allocation | scaffold | — |
| M0136 | Timetable Manager | implemented | lib/timetable-manager |
| M0137 | Transfer Counselling Audit | scaffold | — |
| M0138 | Award & Recognition | scaffold | — |
| M0139 | Naan Mudhalvan Mentor Pool | scaffold | — |
| M0140 | Internship Mentor (MMSN) | scaffold | — |
| M0141 | Teacher Wellbeing | scaffold | — |

## assessment (L8)

| id | module | status | reference source |
|---|---|---|---|
| M0142 | Formative Assessment | scaffold | — |
| M0143 | Summative Assessment | scaffold | — |
| M0144 | Diagnostic Assessment | scaffold | — |
| M0145 | FLN Assessment (NIPUN) | scaffold | — |
| M0146 | NAS Instrumentation | scaffold | — |
| M0147 | Board-Equivalent Assessment | scaffold | — |
| M0148 | PISA-Grade Item Engine | scaffold | — |
| M0149 | Item-Response Theory (IRT) | scaffold | — |
| M0150 | Item Bank | scaffold | — |
| M0151 | Question-Paper Generation | scaffold | — |
| M0152 | Auto-Marking (objective) | scaffold | — |
| M0153 | Essay Grading (LLM + human override) | scaffold | — |
| M0154 | Handwriting OCR (IndicConformer) | scaffold | — |
| M0155 | OMR Scoring | scaffold | — |
| M0156 | Rubric Engine | scaffold | — |
| M0157 | Accessibility-Accommodated Assessment | scaffold | — |
| M0158 | Extra-Time / Scribe Accommodation (RPwD) | scaffold | — |
| M0159 | Result Computation | scaffold | — |
| M0160 | Result Publication | scaffold | — |
| M0161 | Re-Evaluation | scaffold | — |
| M0162 | Grade-Card Generation | scaffold | — |
| M0163 | Continuous Comprehensive Evaluation | scaffold | — |
| M0164 | Practical / Lab Assessment | scaffold | — |
| M0165 | Project Assessment | scaffold | — |
| M0166 | Peer Assessment | scaffold | — |
| M0167 | Self Assessment | scaffold | — |
| M0168 | Assessment Calendar | scaffold | — |
| M0169 | Seating-Plan Generation | scaffold | — |
| M0170 | Exam-Integrity Monitor | scaffold | — |
| M0171 | Malpractice Workflow | scaffold | — |
| M0172 | Question-Paper Security | scaffold | — |
| M0173 | Assessment Analytics | scaffold | — |
| M0174 | Competency Mastery Tracking | scaffold | — |
| M0175 | Adaptive Practice | scaffold | — |
| M0176 | DGE Board Exam Integration | scaffold | — |

## scheme-delivery (L6)

| id | module | status | reference source |
|---|---|---|---|
| M0177 | Scheme Catalogue (per GO) | scaffold | — |
| M0178 | Eligibility Engine | scaffold | — |
| M0179 | Entitlement Computation | scaffold | — |
| M0180 | Reservation Engine (BC/MBC/SC/ST/DNT) | scaffold | — |
| M0181 | Scholarship — SC/ST | scaffold | — |
| M0182 | Scholarship — OBC/MBC | scaffold | — |
| M0183 | Scholarship — EBC | scaffold | — |
| M0184 | Scholarship — PwD | scaffold | — |
| M0185 | Scholarship — Girl-Child | scaffold | — |
| M0186 | Scholarship — Migrant | scaffold | — |
| M0187 | PFMS Disbursement | scaffold | — |
| M0188 | DBT / APBS | scaffold | — |
| M0189 | Bank-Account Verification | scaffold | — |
| M0190 | Beneficiary Register | scaffold | — |
| M0191 | Scheme Fund-Flow Ledger | implemented | lib/fundledger |
| M0192 | Fund Sanction Workflow | scaffold | — |
| M0193 | Fund Reconciliation (PFMS) | implemented | lib/federation |
| M0194 | Leakage Detection | implemented | lib/federation |
| M0195 | Free Textbook Distribution | scaffold | — |
| M0196 | Free Uniform Distribution | scaffold | — |
| M0197 | Bicycle Scheme | scaffold | — |
| M0198 | Laptop Scheme | scaffold | — |
| M0199 | Mid-Day-Meal (PM-POSHAN) | scaffold | — |
| M0200 | MDM Nutrition Tracking | scaffold | — |
| M0201 | MDM Stock & Indent | scaffold | — |
| M0202 | Breakfast Scheme (TN) | scaffold | — |
| M0203 | Transport / Bus Pass | scaffold | — |
| M0204 | Hostel Allocation | scaffold | — |
| M0205 | Pudhumai Penn Scheme | scaffold | — |
| M0206 | Illam Thedi Kalvi | scaffold | — |
| M0207 | Welfare Grievance (scheme) | scaffold | — |
| M0208 | Scheme Audit Trail (GFR) | scaffold | — |
| M0209 | Account-Aggregator Eligibility (consent) | scaffold | — |

## governance-workflow (L11)

| id | module | status | reference source |
|---|---|---|---|
| M0210 | Governance Workflow Engine (G1-G7 BPMN) | implemented | lib/workflow, lib/governance/control-tower |
| M0211 | Approval Chain — G1 Cabinet | scaffold | — |
| M0212 | Approval Chain — G2 Empowered Committee | scaffold | — |
| M0213 | Approval Chain — G3 Inter-Directorate | scaffold | — |
| M0214 | Approval Chain — G4 PMU | scaffold | — |
| M0215 | Approval Chain — G5 Tech Architecture Board | scaffold | — |
| M0216 | Approval Chain — G6 Ethics/Equity/RPwD | scaffold | — |
| M0217 | Approval Chain — G7 External Audit | scaffold | — |
| M0218 | Circular Drafting (Policy Agent) | implemented | lib/ai/agents |
| M0219 | GO Publication | scaffold | — |
| M0220 | Cabinet Note Generation | scaffold | — |
| M0221 | Assembly Briefing | scaffold | — |
| M0222 | Change-Advisory-Board (CAB) | scaffold | — |
| M0223 | Delegation-of-Powers Registry | scaffold | — |
| M0224 | Tenancy Management (T0-T6) | scaffold | — |
| M0225 | Org-Unit Registry | scaffold | — |
| M0226 | Recognition & Affiliation | scaffold | — |
| M0227 | Inspection Workflow | scaffold | — |
| M0228 | Sanction Workflow (block/district) | scaffold | — |
| M0229 | Model-Card Registry | scaffold | — |
| M0230 | Ethics-Review Case Mgmt | scaffold | — |
| M0231 | AI Leadership Council Portal | scaffold | — |
| M0232 | Sovereignty Console | scaffold | — |
| M0233 | Off-Switch Control (M-of-N) | scaffold | — |
| M0234 | Source-Code Escrow Tracker | scaffold | — |
| M0235 | CAG / Auditor Export | scaffold | — |
| M0236 | Audit-Log Immutability | implemented | lib/audit/trail |
| M0237 | Board-Prep & Coordination | scaffold | — |
| M0238 | Launch-Readiness Register | scaffold | — |
| M0239 | Architecture-Conformance Register | scaffold | — |

## grievance-redress (L6)

| id | module | status | reference source |
|---|---|---|---|
| M0240 | Grievance Intake (multi-channel) | implemented | lib/grievanceflow |
| M0241 | Grievance Classification (Grievance Agent) | implemented | lib/ai/agents |
| M0242 | Grievance Triage | scaffold | — |
| M0243 | Jurisdiction Routing | scaffold | — |
| M0244 | SLA Tracker | scaffold | — |
| M0245 | Escalation Engine | scaffold | — |
| M0246 | Redress Recommendation | scaffold | — |
| M0247 | Resolution Workflow | scaffold | — |
| M0248 | Satisfaction Survey | scaffold | — |
| M0249 | Anonymous Reporting | scaffold | — |
| M0250 | POCSO Safety Pipeline | scaffold | — |
| M0251 | CSAM Detector (human-in-loop) | scaffold | — |
| M0252 | Mandatory-Reporting Workflow | scaffold | — |
| M0253 | Evidence Chain-of-Custody | scaffold | — |
| M0254 | Child-Welfare-Committee (JJ) Link | scaffold | — |
| M0255 | Anti-Ragging / Safety | scaffold | — |
| M0256 | Adult-Minor Channel Guardrail | scaffold | — |
| M0257 | Content Safety Scan (upload) | scaffold | — |
| M0258 | PII Redaction (faces/contacts) | scaffold | — |
| M0259 | Age-Appropriate Filter | scaffold | — |
| M0260 | Whistle-blower Protection | scaffold | — |
| M0261 | Grievance Analytics | scaffold | — |
| M0262 | RTI Request Intake | implemented | lib/rti |
| M0263 | RTI Workflow | implemented | lib/rtiflow |
| M0264 | CPGRAMS Bridge | scaffold | — |
| M0265 | Constituency Grievance | scaffold | — |
| M0266 | Public Grievance Tracker | scaffold | — |
| M0267 | Disposal Monitoring | scaffold | — |
| M0268 | Legal-Case Tracker | scaffold | — |
| M0269 | Compliance Reporting (grievance) | scaffold | — |

## analytics-reporting (L8)

| id | module | status | reference source |
|---|---|---|---|
| M0270 | District Scorecard | scaffold | — |
| M0271 | Block Scorecard | scaffold | — |
| M0272 | School Scorecard | scaffold | — |
| M0273 | TN Quality Index | implemented | lib/outcomes |
| M0274 | Opportunity-Gap Index | implemented | lib/outcomes |
| M0275 | Equity-Weighted Resource Allocation | implemented | lib/outcomes/allocation |
| M0276 | Equity Index | scaffold | — |
| M0277 | Enrolment Dashboard | scaffold | — |
| M0278 | Attendance Analytics | scaffold | — |
| M0279 | Dropout Early-Warning | scaffold | — |
| M0280 | Learning-Outcome Analytics | scaffold | — |
| M0281 | FLN Analytics | scaffold | — |
| M0282 | NAS Dashboard | scaffold | — |
| M0283 | Gender-Parity Index | scaffold | — |
| M0284 | Social-Category Disaggregation | scaffold | — |
| M0285 | RPwD Inclusion Dashboard | scaffold | — |
| M0286 | SDG 4/5/10/16 Dashboards | scaffold | — |
| M0287 | Scheme-Delivery Analytics | scaffold | — |
| M0288 | Fund-Utilisation Analytics | scaffold | — |
| M0289 | Teacher-Deployment Analytics | scaffold | — |
| M0290 | Infrastructure Telemetry Analytics | scaffold | — |
| M0291 | Predictive Outcome Model | scaffold | — |
| M0292 | Causal Impact (DoWhy) | scaffold | — |
| M0293 | Time-Series Forecast (NeuralProphet) | scaffold | — |
| M0294 | Anomaly Detection | scaffold | — |
| M0295 | VSK / Vidya Samiksha Kendra | scaffold | — |
| M0296 | Open-Data Aggregation (suppressed) | scaffold | — |
| M0297 | Press / Researcher API | scaffold | — |
| M0298 | ESG Indicators | scaffold | — |
| M0299 | STARS / GovTech Reporting Hooks | scaffold | — |

## ai-operations (L8)

| id | module | status | reference source |
|---|---|---|---|
| M0300 | Model Registry (MLflow) | scaffold | — |
| M0301 | Feature Store (Feast) | scaffold | — |
| M0302 | Model-Card Service | scaffold | — |
| M0303 | Bias Audit (AIF360/FairLearn) | scaffold | — |
| M0304 | Drift Detector (PSI/KL) | scaffold | — |
| M0305 | Canary & Rollback | scaffold | — |
| M0306 | Red-Team Gate | scaffold | — |
| M0307 | Prompt-Injection Defence | scaffold | — |
| M0308 | Jailbreak Classifier | scaffold | — |
| M0309 | Refusal Taxonomy | scaffold | — |
| M0310 | Hallucination Control (citation enforcement) | scaffold | — |
| M0311 | RAG Orchestrator (LangGraph) | scaffold | — |
| M0312 | MCP Tool Catalogue | implemented | lib/mcp |
| M0313 | Retrieval — Milvus (vector) | scaffold | — |
| M0314 | Retrieval — OpenSearch (BM25) | scaffold | — |
| M0315 | Reranker | scaffold | — |
| M0316 | Reasoning Engine | implemented | lib/ai/engines |
| M0317 | Personalisation Engine | implemented | lib/ai/engines |
| M0318 | Assessment Engine | implemented | lib/ai/engines |
| M0319 | Policy Engine (interpretation) | implemented | lib/policy-engine |
| M0320 | Analytics Engine | implemented | lib/ai/engines |
| M0321 | Conversational Engine | implemented | lib/ai/engines |
| M0322 | Policy Agent | implemented | lib/ai/agents |
| M0323 | Teacher Agent | implemented | lib/ai/agents |
| M0324 | Student Agent | implemented | lib/ai/agents |
| M0325 | Governance Agent | implemented | lib/ai/agents |
| M0326 | Grievance Agent | implemented | lib/ai/agents |
| M0327 | Compliance Agent | implemented | lib/ai/agents |
| M0328 | Eval Harness (held-out benchmarks) | scaffold | — |
| M0329 | Inference Observability (OpenLLMetry) | scaffold | — |

## tn-specific (L6)

| id | module | status | reference source |
|---|---|---|---|
| M0330 | TN GO Catalogue | spec-only | — |
| M0331 | TN Reservation Rules (BC/MBC/SC/ST/DNT) | spec-only | — |
| M0332 | TN State Board (DGE) Exam | spec-only | — |
| M0333 | TN Textbook Corporation | spec-only | — |
| M0334 | Pudhumai Penn Scheme | spec-only | — |
| M0335 | Naan Mudhalvan Skill Pipeline | spec-only | — |
| M0336 | Mudhalvar Makkal Sevai Nanbar Internship | spec-only | — |
| M0337 | Illam Thedi Kalvi (Education at Doorstep) | spec-only | — |
| M0338 | Ennum Ezhuthum (FLN Mission) | implemented | lib/reading |
| M0339 | 100 Kamarajar Schools Register | spec-only | — |
| M0340 | 500 Creative Schools Register | spec-only | — |
| M0341 | Breakfast Scheme (CM) | spec-only | — |
| M0342 | Chief Minister's Trophy | spec-only | — |
| M0343 | Kalvi TV Integration | spec-only | — |
| M0344 | Manjappai Awareness (eco-school) | spec-only | — |
| M0345 | TN School Education Rules | spec-only | — |
| M0346 | TN Private Schools (DPSE) Recognition | spec-only | — |
| M0347 | Matriculation Schools (DMS) | spec-only | — |
| M0348 | Non-Formal Education (DNFE) | spec-only | — |
| M0349 | Teacher Education (DTERT/SCERT) | spec-only | — |
| M0350 | Elementary Education (DEE) | spec-only | — |
| M0351 | School Education (DSE) | spec-only | — |
| M0352 | TN UDISE+ Reconciliation | spec-only | — |
| M0353 | TN APAAR Rollout | spec-only | — |
| M0354 | TN Treasury / IFMS | spec-only | — |
| M0355 | TN Pension & Salary | spec-only | — |
| M0356 | TN EPF (staff) | spec-only | — |
| M0357 | TN Hostel (Adi Dravidar/BC welfare) | spec-only | — |
| M0358 | TN Free Bicycle | spec-only | — |
| M0359 | TN Free Laptop | spec-only | — |
| M0360 | TN Bus Pass | spec-only | — |
| M0361 | TN Girl-Child Protection Scheme | spec-only | — |
| M0362 | TN Differently-Abled Welfare | spec-only | — |
| M0363 | TN Migrant-Children Education | spec-only | — |
| M0364 | TN Tribal-Residential Schools | spec-only | — |
| M0365 | TN Adi Dravidar Welfare Schools | spec-only | — |
| M0366 | TN Model Schools | spec-only | — |
| M0367 | TN Aided-School Management | spec-only | — |
| M0368 | TN Anganwadi (ICDS) Bridge | spec-only | — |
| M0369 | TN Mid-Day-Meal (Variety Meal) | spec-only | — |
| M0370 | TN Egg/Nutrition Programme | spec-only | — |
| M0371 | TN Sports & Games (CM Trophy) | spec-only | — |
| M0372 | TN Career Guidance (Naan Mudhalvan) | spec-only | — |
| M0373 | TN Digital Classroom | spec-only | — |
| M0374 | TN Smart Classroom Rollout | spec-only | — |
| M0375 | TN Library Movement | spec-only | — |
| M0376 | TN Reading Movement | spec-only | — |
| M0377 | TN Science Centre Linkage | spec-only | — |
| M0378 | TN Cultural Education | spec-only | — |
| M0379 | TN Tamil-Language Promotion | spec-only | — |
| M0380 | TN Heritage Curriculum | spec-only | — |
| M0381 | TN Flood/Disaster School Continuity | spec-only | — |
| M0382 | TN COVID Learning-Recovery | spec-only | — |
| M0383 | TN Bridge-Course (learning loss) | spec-only | — |
| M0384 | TN Special Coaching (NEET/board) | spec-only | — |
| M0385 | TN Vocational Education (NSQF) | spec-only | — |
| M0386 | TN Apprenticeship Linkage | spec-only | — |
| M0387 | TN Alumni Mentorship | spec-only | — |
| M0388 | TN Public-School Branding | spec-only | — |
| M0389 | TN Community Participation (PTA/SMC) | implemented | lib/smc |
| M0390 | TN School-Infrastructure Upgrade | spec-only | — |
| M0391 | Tn Specific — Module 62 | spec-only | — |
