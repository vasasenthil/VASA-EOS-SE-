# Complete Functional Module Coverage

Generated: 2026-07-29T05:06:36.129Z

Evidence standard: **canonical-module-definition-of-done**.

## Canonical summary

| Declared | Parsed/listed | Fully built | Partial/scaffold | Yet to build/spec-only |
| ---: | ---: | ---: | ---: | ---: |
| 391 | 391 | 38 | 293 | 60 |

## Reconciliation

- Canonical CC-SPEC catalogue declares 391 modules; 391 were parsed and every ID is listed in this report.
- The legacy attachment crosswalk declares 392 modules but maps 192; its one-module headline variance against the canonical 391 remains a governance discrepancy requiring source-owner resolution.
- Canonical status controls completeness: implemented = fully built, scaffold = partial, spec-only = yet to build. A route or TypeScript file alone does not override this status.
- Previous portal and database delivery requests are preserved as delivery commitments, with external and known implementation limitations stated explicitly.

## Previous delivery commitments

| Delivery | Status | Evidence | Limitation |
| --- | --- | --- | --- |
| Secretary state command centre | fully-built | `app/secretary/dashboard/page.tsx`<br>`lib/secretary/command-centre.ts` | Production data freshness depends on live source adapters. |
| Seven-directorate operations centre | partial | `app/director/dashboard/page.tsx`<br>`lib/director/operations-centre.ts` | NFAE specialist coverage remains partial and state reference evidence is not synthetically apportioned. |
| Principal / Headmaster school operations centre | fully-built | `app/(dashboards)/principal/dashboard/page.tsx`<br>`lib/principal/operations-centre.ts` | Requires authenticated school tenant assignment and live school stores. |
| CEO / DEO district operations centre | partial | `app/deo/dashboard/page.tsx`<br>`lib/deo/district-operations.ts` | Cross-process workflow records still require durable district tagging for strict workflow scoping. |
| Live policy drafting database | externally-gated | `lib/policy/schema.sql`<br>`lib/policy/seed.sql`<br>`app/api/production/policies/readiness/route.ts` | Deployment must supply matching Supabase secrets and a PostgreSQL migration URI, apply migrations, and redeploy. |
| Live Supabase platform connectivity | externally-gated | `lib/db/environment.ts`<br>`lib/supabase/server.ts`<br>`scripts/deploy/migrate.ts` | Credentials, network reachability, schema application and key rotation are external operational controls; secrets are never committed. |

## All canonical functional modules (no omitted IDs)

| ID | Module | Layer | Domain | Status | Reference implementation |
| --- | --- | --- | --- | --- | --- |
| M0001 | APAAR Learner Identity | L5 | identity-access | partial | — |
| M0002 | Citizen Identity (official ID) | L5 | identity-access | partial | — |
| M0003 | Teacher Institutional Identity | L5 | identity-access | partial | — |
| M0004 | Keycloak Realm — T0 Sovereign | L5 | identity-access | partial | — |
| M0005 | Keycloak Realm — Secretariat | L5 | identity-access | partial | — |
| M0006 | Keycloak Realm — Directorate | L5 | identity-access | partial | — |
| M0007 | Keycloak Realm — District | L5 | identity-access | partial | — |
| M0008 | Keycloak Realm — Block | L5 | identity-access | partial | — |
| M0009 | Keycloak Realm — Cluster | L5 | identity-access | partial | — |
| M0010 | Keycloak Realm — School | L5 | identity-access | partial | — |
| M0011 | MFA — TOTP | L5 | identity-access | partial | — |
| M0012 | MFA — WebAuthn/FIDO2 | L5 | identity-access | partial | — |
| M0013 | MFA — SMS-OTP Fallback | L5 | identity-access | partial | — |
| M0014 | AAL3 Step-Up (governance/finance) | L5 | identity-access | partial | — |
| M0015 | OIDC Federation | L5 | identity-access | partial | — |
| M0016 | SAML 2.0 Federation | L5 | identity-access | partial | — |
| M0017 | LDAP Federation | L5 | identity-access | partial | — |
| M0018 | DigiLocker SSO | L5 | identity-access | partial | — |
| M0019 | Consent Manager (DPDP) | L5 | identity-access | fully-built | `lib/consent` |
| M0020 | Data-Principal Portal | L5 | identity-access | partial | — |
| M0021 | DPO Endpoint | L5 | identity-access | partial | — |
| M0022 | Consent Receipt (VC) | L5 | identity-access | partial | — |
| M0023 | Session Management | L5 | identity-access | partial | — |
| M0024 | Refresh-Token Rotation | L5 | identity-access | partial | — |
| M0025 | Profile Service | L5 | identity-access | partial | — |
| M0026 | Profile Photo (PII-redacted) | L5 | identity-access | partial | — |
| M0027 | Role Assignment | L5 | identity-access | partial | — |
| M0028 | ReBAC Relationship Store (SpiceDB) | L5 | identity-access | partial | — |
| M0029 | Workload Identity (SPIRE) | L5 | identity-access | partial | — |
| M0030 | Service-Account Registry | L5 | identity-access | partial | — |
| M0031 | Aadhaar e-KYC Wrapper (consent-bound) | L5 | identity-access | partial | — |
| M0032 | Account Lockout & Anomaly | L5 | identity-access | partial | — |
| M0033 | Device Binding | L5 | identity-access | partial | — |
| M0034 | Impersonation Audit | L5 | identity-access | partial | — |
| M0035 | Identity Reconciliation (UDISE+/APAAR) | L5 | identity-access | partial | — |
| M0036 | NCERT Content Ingest | L7 | curriculum-content | partial | — |
| M0037 | SCERT Content Ingest | L7 | curriculum-content | partial | — |
| M0038 | NCF Framework Map | L7 | curriculum-content | partial | — |
| M0039 | TN Textbook Ingest (TNTBC) | L7 | curriculum-content | partial | — |
| M0040 | Curriculum Graph (Neo4j) | L7 | curriculum-content | fully-built | `lib/knowledge-graph` |
| M0041 | Concept Prerequisite Graph | L7 | curriculum-content | partial | — |
| M0042 | Learning-Outcome Map | L7 | curriculum-content | partial | — |
| M0043 | Competency Framework | L7 | curriculum-content | partial | — |
| M0044 | Content Authoring Studio | L7 | curriculum-content | partial | — |
| M0045 | Content Review Workflow | L7 | curriculum-content | partial | — |
| M0046 | Content Versioning | L7 | curriculum-content | partial | — |
| M0047 | Content Tagging (future-skills) | L7 | curriculum-content | partial | — |
| M0048 | Multilingual Translation Pipeline (IndicTrans2) | L7 | curriculum-content | partial | — |
| M0049 | Translation Memory | L7 | curriculum-content | partial | — |
| M0050 | Language QA (LQA) | L7 | curriculum-content | partial | — |
| M0051 | Transliteration | L7 | curriculum-content | partial | — |
| M0052 | Accessibility Transform (AAA) | L7 | curriculum-content | partial | — |
| M0053 | Alt-Text Generation | L7 | curriculum-content | partial | — |
| M0054 | Audio Description | L7 | curriculum-content | partial | — |
| M0055 | Sign-Language (ISL) Overlay | L7 | curriculum-content | partial | — |
| M0056 | Captions & Transcripts | L7 | curriculum-content | partial | — |
| M0057 | Dyslexia-Friendly Rendering | L7 | curriculum-content | partial | — |
| M0058 | DIKSHA Content Read | L7 | curriculum-content | partial | — |
| M0059 | DIKSHA Content Contribute | L7 | curriculum-content | partial | — |
| M0060 | Content Discovery & Search (OpenSearch) | L7 | curriculum-content | partial | — |
| M0061 | Content Recommendation | L7 | curriculum-content | partial | — |
| M0062 | Lesson-Plan Library | L7 | curriculum-content | partial | — |
| M0063 | Question Bank | L7 | curriculum-content | partial | — |
| M0064 | OER Repository | L7 | curriculum-content | partial | — |
| M0065 | Print-Ready PDF Generation | L7 | curriculum-content | partial | — |
| M0066 | QR Verifier on Content | L7 | curriculum-content | partial | — |
| M0067 | Content Licensing & Rights | L7 | curriculum-content | partial | — |
| M0068 | Offline Content Pack | L7 | curriculum-content | partial | — |
| M0069 | Bagless-Day Activity Bank | L7 | curriculum-content | partial | — |
| M0070 | Reading Campaign Content (Ennum Ezhuthum) | L7 | curriculum-content | fully-built | `lib/reading` |
| M0071 | Admission Application | L6 | learner-lifecycle | partial | — |
| M0072 | Admission — RTE 25% EWS/DG Lottery | L6 | learner-lifecycle | fully-built | `lib/admissionsflow, app/admissions` |
| M0073 | Admission Screening Guard (RTE §13) | L6 | learner-lifecycle | partial | — |
| M0074 | Enrolment | L6 | learner-lifecycle | partial | — |
| M0075 | Student Information System (SIS) | L6 | learner-lifecycle | partial | — |
| M0076 | Class & Section Allocation | L6 | learner-lifecycle | partial | — |
| M0077 | Roll-Number Issuance | L6 | learner-lifecycle | partial | — |
| M0078 | Attendance — Daily | L6 | learner-lifecycle | partial | — |
| M0079 | Attendance — Biometric | L6 | learner-lifecycle | partial | — |
| M0080 | Attendance — Period-wise | L6 | learner-lifecycle | partial | — |
| M0081 | Promotion (no-detention) | L6 | learner-lifecycle | partial | — |
| M0082 | Transfer Certificate (TC) | L6 | learner-lifecycle | partial | — |
| M0083 | Inter-School Transfer (APAAR portability) | L6 | learner-lifecycle | partial | — |
| M0084 | Migration Tracking | L6 | learner-lifecycle | partial | — |
| M0085 | Retention & Dropout Risk (early-warning) | L6 | learner-lifecycle | partial | — |
| M0086 | Dropout Intervention | L6 | learner-lifecycle | partial | — |
| M0087 | Out-of-School Children (OOSC) Register | L6 | learner-lifecycle | partial | — |
| M0088 | Re-Enrolment | L6 | learner-lifecycle | partial | — |
| M0089 | Age-Grade Mapping | L6 | learner-lifecycle | partial | — |
| M0090 | Cohort Tracking | L6 | learner-lifecycle | partial | — |
| M0091 | Pre-KG / Foundational Stage (ICDS link) | L6 | learner-lifecycle | partial | — |
| M0092 | Health Screening (RBSK) | L6 | learner-lifecycle | partial | — |
| M0093 | Health Register | L6 | learner-lifecycle | fully-built | `lib/healthregister` |
| M0094 | Immunisation Tracking | L6 | learner-lifecycle | partial | — |
| M0095 | Nutrition (MDM) Linkage | L6 | learner-lifecycle | partial | — |
| M0096 | CWSN / Special-Needs IEP | L6 | learner-lifecycle | partial | — |
| M0097 | Girl-Child Equity Tracker | L6 | learner-lifecycle | partial | — |
| M0098 | First-Generation Learner Tracker | L6 | learner-lifecycle | partial | — |
| M0099 | Scholarship Eligibility (learner) | L6 | learner-lifecycle | partial | — |
| M0100 | Credential Wallet | L6 | learner-lifecycle | fully-built | `lib/credentials` |
| M0101 | Marksheet Issuance | L6 | learner-lifecycle | fully-built | `lib/credentials` |
| M0102 | School-Leaving Certificate | L6 | learner-lifecycle | partial | — |
| M0103 | Student Council Elections | L6 | learner-lifecycle | partial | — |
| M0104 | Co-curricular Registration | L6 | learner-lifecycle | partial | — |
| M0105 | Alumni Registry | L6 | learner-lifecycle | partial | — |
| M0106 | Career Guidance | L6 | learner-lifecycle | partial | — |
| M0107 | Parent-Linkage (ReBAC) | L6 | learner-lifecycle | partial | — |
| M0108 | Guardian Consent (minor) | L6 | learner-lifecycle | partial | — |
| M0109 | Teacher Recruitment | L6 | teacher-lifecycle | partial | — |
| M0110 | Teacher Placement | L6 | teacher-lifecycle | partial | — |
| M0111 | Teacher Transfer (counselling) | L6 | teacher-lifecycle | partial | — |
| M0112 | Cadre Rationalisation | L6 | teacher-lifecycle | partial | — |
| M0113 | PTR Compliance (RTE) | L6 | teacher-lifecycle | partial | — |
| M0114 | Vacancy Register | L6 | teacher-lifecycle | partial | — |
| M0115 | HRMS Integration (HRMS-TN) | L6 | teacher-lifecycle | partial | — |
| M0116 | Payroll Linkage (IFMS/Treasury) | L6 | teacher-lifecycle | partial | — |
| M0117 | Service Book (digital) | L6 | teacher-lifecycle | partial | — |
| M0118 | Leave Management | L6 | teacher-lifecycle | partial | — |
| M0119 | Substitute / Cover Arrangement | L6 | teacher-lifecycle | fully-built | `lib/coverflow` |
| M0120 | Staff Attendance | L6 | teacher-lifecycle | partial | — |
| M0121 | CPD Catalogue | L6 | teacher-lifecycle | partial | — |
| M0122 | CPD Recommendation (Teacher Agent) | L6 | teacher-lifecycle | fully-built | `lib/ai/agents` |
| M0123 | Training Calendar | L6 | teacher-lifecycle | partial | — |
| M0124 | DIKSHA Teacher CPD | L6 | teacher-lifecycle | partial | — |
| M0125 | Performance SUPPORT (not evaluation) | L6 | teacher-lifecycle | partial | — |
| M0126 | Mentoring (BRC/CRC) | L6 | teacher-lifecycle | partial | — |
| M0127 | Lesson-Plan Assist | L6 | teacher-lifecycle | partial | — |
| M0128 | Marking Assist | L6 | teacher-lifecycle | partial | — |
| M0129 | Grievance (teacher) | L6 | teacher-lifecycle | partial | — |
| M0130 | Background Verification (POCSO) | L6 | teacher-lifecycle | partial | — |
| M0131 | Non-Teaching Staff Register | L6 | teacher-lifecycle | partial | — |
| M0132 | Cook-cum-Helper (MDM) | L6 | teacher-lifecycle | partial | — |
| M0133 | Guest Lecture Management | L6 | teacher-lifecycle | partial | — |
| M0134 | Teacher Workload Analytics | L6 | teacher-lifecycle | partial | — |
| M0135 | Subject-Allocation | L6 | teacher-lifecycle | partial | — |
| M0136 | Timetable Manager | L6 | teacher-lifecycle | fully-built | `lib/timetable-manager` |
| M0137 | Transfer Counselling Audit | L6 | teacher-lifecycle | partial | — |
| M0138 | Award & Recognition | L6 | teacher-lifecycle | partial | — |
| M0139 | Naan Mudhalvan Mentor Pool | L6 | teacher-lifecycle | partial | — |
| M0140 | Internship Mentor (MMSN) | L6 | teacher-lifecycle | partial | — |
| M0141 | Teacher Wellbeing | L6 | teacher-lifecycle | partial | — |
| M0142 | Formative Assessment | L8 | assessment | partial | — |
| M0143 | Summative Assessment | L8 | assessment | partial | — |
| M0144 | Diagnostic Assessment | L8 | assessment | partial | — |
| M0145 | FLN Assessment (NIPUN) | L8 | assessment | partial | — |
| M0146 | NAS Instrumentation | L8 | assessment | partial | — |
| M0147 | Board-Equivalent Assessment | L8 | assessment | partial | — |
| M0148 | PISA-Grade Item Engine | L8 | assessment | partial | — |
| M0149 | Item-Response Theory (IRT) | L8 | assessment | partial | — |
| M0150 | Item Bank | L8 | assessment | partial | — |
| M0151 | Question-Paper Generation | L8 | assessment | partial | — |
| M0152 | Auto-Marking (objective) | L8 | assessment | partial | — |
| M0153 | Essay Grading (LLM + human override) | L8 | assessment | partial | — |
| M0154 | Handwriting OCR (IndicConformer) | L8 | assessment | partial | — |
| M0155 | OMR Scoring | L8 | assessment | partial | — |
| M0156 | Rubric Engine | L8 | assessment | partial | — |
| M0157 | Accessibility-Accommodated Assessment | L8 | assessment | partial | — |
| M0158 | Extra-Time / Scribe Accommodation (RPwD) | L8 | assessment | partial | — |
| M0159 | Result Computation | L8 | assessment | partial | — |
| M0160 | Result Publication | L8 | assessment | partial | — |
| M0161 | Re-Evaluation | L8 | assessment | partial | — |
| M0162 | Grade-Card Generation | L8 | assessment | partial | — |
| M0163 | Continuous Comprehensive Evaluation | L8 | assessment | partial | — |
| M0164 | Practical / Lab Assessment | L8 | assessment | partial | — |
| M0165 | Project Assessment | L8 | assessment | partial | — |
| M0166 | Peer Assessment | L8 | assessment | partial | — |
| M0167 | Self Assessment | L8 | assessment | partial | — |
| M0168 | Assessment Calendar | L8 | assessment | partial | — |
| M0169 | Seating-Plan Generation | L8 | assessment | partial | — |
| M0170 | Exam-Integrity Monitor | L8 | assessment | partial | — |
| M0171 | Malpractice Workflow | L8 | assessment | partial | — |
| M0172 | Question-Paper Security | L8 | assessment | partial | — |
| M0173 | Assessment Analytics | L8 | assessment | partial | — |
| M0174 | Competency Mastery Tracking | L8 | assessment | partial | — |
| M0175 | Adaptive Practice | L8 | assessment | partial | — |
| M0176 | DGE Board Exam Integration | L8 | assessment | partial | — |
| M0177 | Scheme Catalogue (per GO) | L6 | scheme-delivery | partial | — |
| M0178 | Eligibility Engine | L6 | scheme-delivery | partial | — |
| M0179 | Entitlement Computation | L6 | scheme-delivery | partial | — |
| M0180 | Reservation Engine (BC/MBC/SC/ST/DNT) | L6 | scheme-delivery | partial | — |
| M0181 | Scholarship — SC/ST | L6 | scheme-delivery | partial | — |
| M0182 | Scholarship — OBC/MBC | L6 | scheme-delivery | partial | — |
| M0183 | Scholarship — EBC | L6 | scheme-delivery | partial | — |
| M0184 | Scholarship — PwD | L6 | scheme-delivery | partial | — |
| M0185 | Scholarship — Girl-Child | L6 | scheme-delivery | partial | — |
| M0186 | Scholarship — Migrant | L6 | scheme-delivery | partial | — |
| M0187 | PFMS Disbursement | L6 | scheme-delivery | partial | — |
| M0188 | DBT / APBS | L6 | scheme-delivery | partial | — |
| M0189 | Bank-Account Verification | L6 | scheme-delivery | partial | — |
| M0190 | Beneficiary Register | L6 | scheme-delivery | partial | — |
| M0191 | Scheme Fund-Flow Ledger | L6 | scheme-delivery | fully-built | `lib/fundledger` |
| M0192 | Fund Sanction Workflow | L6 | scheme-delivery | partial | — |
| M0193 | Fund Reconciliation (PFMS) | L6 | scheme-delivery | fully-built | `lib/federation` |
| M0194 | Leakage Detection | L6 | scheme-delivery | fully-built | `lib/federation` |
| M0195 | Free Textbook Distribution | L6 | scheme-delivery | partial | — |
| M0196 | Free Uniform Distribution | L6 | scheme-delivery | partial | — |
| M0197 | Bicycle Scheme | L6 | scheme-delivery | partial | — |
| M0198 | Laptop Scheme | L6 | scheme-delivery | partial | — |
| M0199 | Mid-Day-Meal (PM-POSHAN) | L6 | scheme-delivery | partial | — |
| M0200 | MDM Nutrition Tracking | L6 | scheme-delivery | partial | — |
| M0201 | MDM Stock & Indent | L6 | scheme-delivery | partial | — |
| M0202 | Breakfast Scheme (TN) | L6 | scheme-delivery | partial | — |
| M0203 | Transport / Bus Pass | L6 | scheme-delivery | partial | — |
| M0204 | Hostel Allocation | L6 | scheme-delivery | partial | — |
| M0205 | Pudhumai Penn Scheme | L6 | scheme-delivery | partial | — |
| M0206 | Illam Thedi Kalvi | L6 | scheme-delivery | partial | — |
| M0207 | Welfare Grievance (scheme) | L6 | scheme-delivery | partial | — |
| M0208 | Scheme Audit Trail (GFR) | L6 | scheme-delivery | partial | — |
| M0209 | Account-Aggregator Eligibility (consent) | L6 | scheme-delivery | partial | — |
| M0210 | Governance Workflow Engine (G1-G7 BPMN) | L11 | governance-workflow | fully-built | `lib/workflow, lib/governance/control-tower` |
| M0211 | Approval Chain — G1 Cabinet | L11 | governance-workflow | partial | — |
| M0212 | Approval Chain — G2 Empowered Committee | L11 | governance-workflow | partial | — |
| M0213 | Approval Chain — G3 Inter-Directorate | L11 | governance-workflow | partial | — |
| M0214 | Approval Chain — G4 PMU | L11 | governance-workflow | partial | — |
| M0215 | Approval Chain — G5 Tech Architecture Board | L11 | governance-workflow | partial | — |
| M0216 | Approval Chain — G6 Ethics/Equity/RPwD | L11 | governance-workflow | partial | — |
| M0217 | Approval Chain — G7 External Audit | L11 | governance-workflow | partial | — |
| M0218 | Circular Drafting (Policy Agent) | L11 | governance-workflow | fully-built | `lib/ai/agents` |
| M0219 | GO Publication | L11 | governance-workflow | partial | — |
| M0220 | Cabinet Note Generation | L11 | governance-workflow | partial | — |
| M0221 | Assembly Briefing | L11 | governance-workflow | partial | — |
| M0222 | Change-Advisory-Board (CAB) | L11 | governance-workflow | partial | — |
| M0223 | Delegation-of-Powers Registry | L11 | governance-workflow | partial | — |
| M0224 | Tenancy Management (T0-T6) | L11 | governance-workflow | partial | — |
| M0225 | Org-Unit Registry | L11 | governance-workflow | partial | — |
| M0226 | Recognition & Affiliation | L11 | governance-workflow | partial | — |
| M0227 | Inspection Workflow | L11 | governance-workflow | partial | — |
| M0228 | Sanction Workflow (block/district) | L11 | governance-workflow | partial | — |
| M0229 | Model-Card Registry | L11 | governance-workflow | partial | — |
| M0230 | Ethics-Review Case Mgmt | L11 | governance-workflow | partial | — |
| M0231 | AI Leadership Council Portal | L11 | governance-workflow | partial | — |
| M0232 | Sovereignty Console | L11 | governance-workflow | partial | — |
| M0233 | Off-Switch Control (M-of-N) | L11 | governance-workflow | partial | — |
| M0234 | Source-Code Escrow Tracker | L11 | governance-workflow | partial | — |
| M0235 | CAG / Auditor Export | L11 | governance-workflow | partial | — |
| M0236 | Audit-Log Immutability | L11 | governance-workflow | fully-built | `lib/audit/trail` |
| M0237 | Board-Prep & Coordination | L11 | governance-workflow | partial | — |
| M0238 | Launch-Readiness Register | L11 | governance-workflow | partial | — |
| M0239 | Architecture-Conformance Register | L11 | governance-workflow | partial | — |
| M0240 | Grievance Intake (multi-channel) | L6 | grievance-redress | fully-built | `lib/grievanceflow` |
| M0241 | Grievance Classification (Grievance Agent) | L6 | grievance-redress | fully-built | `lib/ai/agents` |
| M0242 | Grievance Triage | L6 | grievance-redress | partial | — |
| M0243 | Jurisdiction Routing | L6 | grievance-redress | partial | — |
| M0244 | SLA Tracker | L6 | grievance-redress | partial | — |
| M0245 | Escalation Engine | L6 | grievance-redress | partial | — |
| M0246 | Redress Recommendation | L6 | grievance-redress | partial | — |
| M0247 | Resolution Workflow | L6 | grievance-redress | partial | — |
| M0248 | Satisfaction Survey | L6 | grievance-redress | partial | — |
| M0249 | Anonymous Reporting | L6 | grievance-redress | partial | — |
| M0250 | POCSO Safety Pipeline | L6 | grievance-redress | partial | — |
| M0251 | CSAM Detector (human-in-loop) | L6 | grievance-redress | partial | — |
| M0252 | Mandatory-Reporting Workflow | L6 | grievance-redress | partial | — |
| M0253 | Evidence Chain-of-Custody | L6 | grievance-redress | partial | — |
| M0254 | Child-Welfare-Committee (JJ) Link | L6 | grievance-redress | partial | — |
| M0255 | Anti-Ragging / Safety | L6 | grievance-redress | partial | — |
| M0256 | Adult-Minor Channel Guardrail | L6 | grievance-redress | partial | — |
| M0257 | Content Safety Scan (upload) | L6 | grievance-redress | partial | — |
| M0258 | PII Redaction (faces/contacts) | L6 | grievance-redress | partial | — |
| M0259 | Age-Appropriate Filter | L6 | grievance-redress | partial | — |
| M0260 | Whistle-blower Protection | L6 | grievance-redress | partial | — |
| M0261 | Grievance Analytics | L6 | grievance-redress | partial | — |
| M0262 | RTI Request Intake | L6 | grievance-redress | fully-built | `lib/rti` |
| M0263 | RTI Workflow | L6 | grievance-redress | fully-built | `lib/rtiflow` |
| M0264 | CPGRAMS Bridge | L6 | grievance-redress | partial | — |
| M0265 | Constituency Grievance | L6 | grievance-redress | partial | — |
| M0266 | Public Grievance Tracker | L6 | grievance-redress | partial | — |
| M0267 | Disposal Monitoring | L6 | grievance-redress | partial | — |
| M0268 | Legal-Case Tracker | L6 | grievance-redress | partial | — |
| M0269 | Compliance Reporting (grievance) | L6 | grievance-redress | partial | — |
| M0270 | District Scorecard | L8 | analytics-reporting | partial | — |
| M0271 | Block Scorecard | L8 | analytics-reporting | partial | — |
| M0272 | School Scorecard | L8 | analytics-reporting | partial | — |
| M0273 | TN Quality Index | L8 | analytics-reporting | fully-built | `lib/outcomes` |
| M0274 | Opportunity-Gap Index | L8 | analytics-reporting | fully-built | `lib/outcomes` |
| M0275 | Equity-Weighted Resource Allocation | L8 | analytics-reporting | fully-built | `lib/outcomes/allocation` |
| M0276 | Equity Index | L8 | analytics-reporting | partial | — |
| M0277 | Enrolment Dashboard | L8 | analytics-reporting | partial | — |
| M0278 | Attendance Analytics | L8 | analytics-reporting | partial | — |
| M0279 | Dropout Early-Warning | L8 | analytics-reporting | partial | — |
| M0280 | Learning-Outcome Analytics | L8 | analytics-reporting | partial | — |
| M0281 | FLN Analytics | L8 | analytics-reporting | partial | — |
| M0282 | NAS Dashboard | L8 | analytics-reporting | partial | — |
| M0283 | Gender-Parity Index | L8 | analytics-reporting | partial | — |
| M0284 | Social-Category Disaggregation | L8 | analytics-reporting | partial | — |
| M0285 | RPwD Inclusion Dashboard | L8 | analytics-reporting | partial | — |
| M0286 | SDG 4/5/10/16 Dashboards | L8 | analytics-reporting | partial | — |
| M0287 | Scheme-Delivery Analytics | L8 | analytics-reporting | partial | — |
| M0288 | Fund-Utilisation Analytics | L8 | analytics-reporting | partial | — |
| M0289 | Teacher-Deployment Analytics | L8 | analytics-reporting | partial | — |
| M0290 | Infrastructure Telemetry Analytics | L8 | analytics-reporting | partial | — |
| M0291 | Predictive Outcome Model | L8 | analytics-reporting | partial | — |
| M0292 | Causal Impact (DoWhy) | L8 | analytics-reporting | partial | — |
| M0293 | Time-Series Forecast (NeuralProphet) | L8 | analytics-reporting | partial | — |
| M0294 | Anomaly Detection | L8 | analytics-reporting | partial | — |
| M0295 | VSK / Vidya Samiksha Kendra | L8 | analytics-reporting | partial | — |
| M0296 | Open-Data Aggregation (suppressed) | L8 | analytics-reporting | partial | — |
| M0297 | Press / Researcher API | L8 | analytics-reporting | partial | — |
| M0298 | ESG Indicators | L8 | analytics-reporting | partial | — |
| M0299 | STARS / GovTech Reporting Hooks | L8 | analytics-reporting | partial | — |
| M0300 | Model Registry (MLflow) | L8 | ai-operations | partial | — |
| M0301 | Feature Store (Feast) | L8 | ai-operations | partial | — |
| M0302 | Model-Card Service | L8 | ai-operations | partial | — |
| M0303 | Bias Audit (AIF360/FairLearn) | L8 | ai-operations | partial | — |
| M0304 | Drift Detector (PSI/KL) | L8 | ai-operations | partial | — |
| M0305 | Canary & Rollback | L8 | ai-operations | partial | — |
| M0306 | Red-Team Gate | L8 | ai-operations | partial | — |
| M0307 | Prompt-Injection Defence | L8 | ai-operations | partial | — |
| M0308 | Jailbreak Classifier | L8 | ai-operations | partial | — |
| M0309 | Refusal Taxonomy | L8 | ai-operations | partial | — |
| M0310 | Hallucination Control (citation enforcement) | L8 | ai-operations | partial | — |
| M0311 | RAG Orchestrator (LangGraph) | L8 | ai-operations | partial | — |
| M0312 | MCP Tool Catalogue | L8 | ai-operations | fully-built | `lib/mcp` |
| M0313 | Retrieval — Milvus (vector) | L8 | ai-operations | partial | — |
| M0314 | Retrieval — OpenSearch (BM25) | L8 | ai-operations | partial | — |
| M0315 | Reranker | L8 | ai-operations | partial | — |
| M0316 | Reasoning Engine | L8 | ai-operations | fully-built | `lib/ai/engines` |
| M0317 | Personalisation Engine | L8 | ai-operations | fully-built | `lib/ai/engines` |
| M0318 | Assessment Engine | L8 | ai-operations | fully-built | `lib/ai/engines` |
| M0319 | Policy Engine (interpretation) | L8 | ai-operations | fully-built | `lib/policy-engine` |
| M0320 | Analytics Engine | L8 | ai-operations | fully-built | `lib/ai/engines` |
| M0321 | Conversational Engine | L8 | ai-operations | fully-built | `lib/ai/engines` |
| M0322 | Policy Agent | L8 | ai-operations | fully-built | `lib/ai/agents` |
| M0323 | Teacher Agent | L8 | ai-operations | fully-built | `lib/ai/agents` |
| M0324 | Student Agent | L8 | ai-operations | fully-built | `lib/ai/agents` |
| M0325 | Governance Agent | L8 | ai-operations | fully-built | `lib/ai/agents` |
| M0326 | Grievance Agent | L8 | ai-operations | fully-built | `lib/ai/agents` |
| M0327 | Compliance Agent | L8 | ai-operations | fully-built | `lib/ai/agents` |
| M0328 | Eval Harness (held-out benchmarks) | L8 | ai-operations | partial | — |
| M0329 | Inference Observability (OpenLLMetry) | L8 | ai-operations | partial | — |
| M0330 | TN GO Catalogue | L6 | tn-specific | yet-to-build | — |
| M0331 | TN Reservation Rules (BC/MBC/SC/ST/DNT) | L6 | tn-specific | yet-to-build | — |
| M0332 | TN State Board (DGE) Exam | L6 | tn-specific | yet-to-build | — |
| M0333 | TN Textbook Corporation | L6 | tn-specific | yet-to-build | — |
| M0334 | Pudhumai Penn Scheme | L6 | tn-specific | yet-to-build | — |
| M0335 | Naan Mudhalvan Skill Pipeline | L6 | tn-specific | yet-to-build | — |
| M0336 | Mudhalvar Makkal Sevai Nanbar Internship | L6 | tn-specific | yet-to-build | — |
| M0337 | Illam Thedi Kalvi (Education at Doorstep) | L6 | tn-specific | yet-to-build | — |
| M0338 | Ennum Ezhuthum (FLN Mission) | L6 | tn-specific | fully-built | `lib/reading` |
| M0339 | 100 Kamarajar Schools Register | L6 | tn-specific | yet-to-build | — |
| M0340 | 500 Creative Schools Register | L6 | tn-specific | yet-to-build | — |
| M0341 | Breakfast Scheme (CM) | L6 | tn-specific | yet-to-build | — |
| M0342 | Chief Minister's Trophy | L6 | tn-specific | yet-to-build | — |
| M0343 | Kalvi TV Integration | L6 | tn-specific | yet-to-build | — |
| M0344 | Manjappai Awareness (eco-school) | L6 | tn-specific | yet-to-build | — |
| M0345 | TN School Education Rules | L6 | tn-specific | yet-to-build | — |
| M0346 | TN Private Schools (DPSE) Recognition | L6 | tn-specific | yet-to-build | — |
| M0347 | Matriculation Schools (DMS) | L6 | tn-specific | yet-to-build | — |
| M0348 | Non-Formal Education (DNFE) | L6 | tn-specific | yet-to-build | — |
| M0349 | Teacher Education (DTERT/SCERT) | L6 | tn-specific | yet-to-build | — |
| M0350 | Elementary Education (DEE) | L6 | tn-specific | yet-to-build | — |
| M0351 | School Education (DSE) | L6 | tn-specific | yet-to-build | — |
| M0352 | TN UDISE+ Reconciliation | L6 | tn-specific | yet-to-build | — |
| M0353 | TN APAAR Rollout | L6 | tn-specific | yet-to-build | — |
| M0354 | TN Treasury / IFMS | L6 | tn-specific | yet-to-build | — |
| M0355 | TN Pension & Salary | L6 | tn-specific | yet-to-build | — |
| M0356 | TN EPF (staff) | L6 | tn-specific | yet-to-build | — |
| M0357 | TN Hostel (Adi Dravidar/BC welfare) | L6 | tn-specific | yet-to-build | — |
| M0358 | TN Free Bicycle | L6 | tn-specific | yet-to-build | — |
| M0359 | TN Free Laptop | L6 | tn-specific | yet-to-build | — |
| M0360 | TN Bus Pass | L6 | tn-specific | yet-to-build | — |
| M0361 | TN Girl-Child Protection Scheme | L6 | tn-specific | yet-to-build | — |
| M0362 | TN Differently-Abled Welfare | L6 | tn-specific | yet-to-build | — |
| M0363 | TN Migrant-Children Education | L6 | tn-specific | yet-to-build | — |
| M0364 | TN Tribal-Residential Schools | L6 | tn-specific | yet-to-build | — |
| M0365 | TN Adi Dravidar Welfare Schools | L6 | tn-specific | yet-to-build | — |
| M0366 | TN Model Schools | L6 | tn-specific | yet-to-build | — |
| M0367 | TN Aided-School Management | L6 | tn-specific | yet-to-build | — |
| M0368 | TN Anganwadi (ICDS) Bridge | L6 | tn-specific | yet-to-build | — |
| M0369 | TN Mid-Day-Meal (Variety Meal) | L6 | tn-specific | yet-to-build | — |
| M0370 | TN Egg/Nutrition Programme | L6 | tn-specific | yet-to-build | — |
| M0371 | TN Sports & Games (CM Trophy) | L6 | tn-specific | yet-to-build | — |
| M0372 | TN Career Guidance (Naan Mudhalvan) | L6 | tn-specific | yet-to-build | — |
| M0373 | TN Digital Classroom | L6 | tn-specific | yet-to-build | — |
| M0374 | TN Smart Classroom Rollout | L6 | tn-specific | yet-to-build | — |
| M0375 | TN Library Movement | L6 | tn-specific | yet-to-build | — |
| M0376 | TN Reading Movement | L6 | tn-specific | yet-to-build | — |
| M0377 | TN Science Centre Linkage | L6 | tn-specific | yet-to-build | — |
| M0378 | TN Cultural Education | L6 | tn-specific | yet-to-build | — |
| M0379 | TN Tamil-Language Promotion | L6 | tn-specific | yet-to-build | — |
| M0380 | TN Heritage Curriculum | L6 | tn-specific | yet-to-build | — |
| M0381 | TN Flood/Disaster School Continuity | L6 | tn-specific | yet-to-build | — |
| M0382 | TN COVID Learning-Recovery | L6 | tn-specific | yet-to-build | — |
| M0383 | TN Bridge-Course (learning loss) | L6 | tn-specific | yet-to-build | — |
| M0384 | TN Special Coaching (NEET/board) | L6 | tn-specific | yet-to-build | — |
| M0385 | TN Vocational Education (NSQF) | L6 | tn-specific | yet-to-build | — |
| M0386 | TN Apprenticeship Linkage | L6 | tn-specific | yet-to-build | — |
| M0387 | TN Alumni Mentorship | L6 | tn-specific | yet-to-build | — |
| M0388 | TN Public-School Branding | L6 | tn-specific | yet-to-build | — |
| M0389 | TN Community Participation (PTA/SMC) | L6 | tn-specific | fully-built | `lib/smc` |
| M0390 | TN School-Infrastructure Upgrade | L6 | tn-specific | yet-to-build | — |
| M0391 | Tn Specific — Module 62 | L6 | tn-specific | yet-to-build | — |
