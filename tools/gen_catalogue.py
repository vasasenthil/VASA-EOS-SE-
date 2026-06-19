#!/usr/bin/env python3
"""CC-SPEC-001 §12 — generate the full 391-module catalogue (329 core + 62 TN-specific).

Single source of truth: emits modules/catalogue.yaml (one entry per module) and a human-readable
modules/CATALOGUE.generated.md. Deterministic. The per-folder modules/M<id>-<slug>/module.yaml layout
(§12) is materialised on demand by tools/expand_modules.py from this catalogue.

Run: python3 tools/gen_catalogue.py
"""
from __future__ import annotations
import os, re

# domain -> (layer, count, [compliance...], [policy_bundles...], [curated names...])
CORE = {
  "identity-access": ("L5", 35, ["DPDP-2023-Sec-6", "IT-Act-2000"], ["access/rbac", "access/abac", "regulatory/dpdp"], [
    "APAAR Learner Identity", "Citizen Identity (official ID)", "Teacher Institutional Identity",
    "Keycloak Realm — T0 Sovereign", "Keycloak Realm — Secretariat", "Keycloak Realm — Directorate",
    "Keycloak Realm — District", "Keycloak Realm — Block", "Keycloak Realm — Cluster", "Keycloak Realm — School",
    "MFA — TOTP", "MFA — WebAuthn/FIDO2", "MFA — SMS-OTP Fallback", "AAL3 Step-Up (governance/finance)",
    "OIDC Federation", "SAML 2.0 Federation", "LDAP Federation", "DigiLocker SSO",
    "Consent Manager (DPDP)", "Data-Principal Portal", "DPO Endpoint", "Consent Receipt (VC)",
    "Session Management", "Refresh-Token Rotation", "Profile Service", "Profile Photo (PII-redacted)",
    "Role Assignment", "ReBAC Relationship Store (SpiceDB)", "Workload Identity (SPIRE)", "Service-Account Registry",
    "Aadhaar e-KYC Wrapper (consent-bound)", "Account Lockout & Anomaly", "Device Binding", "Impersonation Audit",
    "Identity Reconciliation (UDISE+/APAAR)",
  ]),
  "curriculum-content": ("L7", 35, ["RPwD-2016", "NDEAR-S"], ["access/abac"], [
    "NCERT Content Ingest", "SCERT Content Ingest", "NCF Framework Map", "TN Textbook Ingest (TNTBC)",
    "Curriculum Graph (Neo4j)", "Concept Prerequisite Graph", "Learning-Outcome Map", "Competency Framework",
    "Content Authoring Studio", "Content Review Workflow", "Content Versioning", "Content Tagging (future-skills)",
    "Multilingual Translation Pipeline (IndicTrans2)", "Translation Memory", "Language QA (LQA)", "Transliteration",
    "Accessibility Transform (AAA)", "Alt-Text Generation", "Audio Description", "Sign-Language (ISL) Overlay",
    "Captions & Transcripts", "Dyslexia-Friendly Rendering", "DIKSHA Content Read", "DIKSHA Content Contribute",
    "Content Discovery & Search (OpenSearch)", "Content Recommendation", "Lesson-Plan Library", "Question Bank",
    "OER Repository", "Print-Ready PDF Generation", "QR Verifier on Content", "Content Licensing & Rights",
    "Offline Content Pack", "Bagless-Day Activity Bank", "Reading Campaign Content (Ennum Ezhuthum)",
  ]),
  "learner-lifecycle": ("L6", 38, ["RTE-2009-Sec-12-1-c", "RTE-2009-Sec-13", "DPDP-2023-Sec-6", "Article-21A"],
    ["access/abac", "regulatory/rte", "regulatory/dpdp"], [
    "Admission Application", "Admission — RTE 25% EWS/DG Lottery", "Admission Screening Guard (RTE §13)",
    "Enrolment", "Student Information System (SIS)", "Class & Section Allocation", "Roll-Number Issuance",
    "Attendance — Daily", "Attendance — Biometric", "Attendance — Period-wise", "Promotion (no-detention)",
    "Transfer Certificate (TC)", "Inter-School Transfer (APAAR portability)", "Migration Tracking",
    "Retention & Dropout Risk (early-warning)", "Dropout Intervention", "Out-of-School Children (OOSC) Register",
    "Re-Enrolment", "Age-Grade Mapping", "Cohort Tracking", "Pre-KG / Foundational Stage (ICDS link)",
    "Health Screening (RBSK)", "Health Register", "Immunisation Tracking", "Nutrition (MDM) Linkage",
    "CWSN / Special-Needs IEP", "Girl-Child Equity Tracker", "First-Generation Learner Tracker",
    "Scholarship Eligibility (learner)", "Credential Wallet", "Marksheet Issuance", "School-Leaving Certificate",
    "Student Council Elections", "Co-curricular Registration", "Alumni Registry", "Career Guidance",
    "Parent-Linkage (ReBAC)", "Guardian Consent (minor)",
  ]),
  "teacher-lifecycle": ("L6", 33, ["RPwD-2016", "DPDP-2023-Sec-6"], ["access/abac", "access/rebac"], [
    "Teacher Recruitment", "Teacher Placement", "Teacher Transfer (counselling)", "Cadre Rationalisation",
    "PTR Compliance (RTE)", "Vacancy Register", "HRMS Integration (HRMS-TN)", "Payroll Linkage (IFMS/Treasury)",
    "Service Book (digital)", "Leave Management", "Substitute / Cover Arrangement", "Staff Attendance",
    "CPD Catalogue", "CPD Recommendation (Teacher Agent)", "Training Calendar", "DIKSHA Teacher CPD",
    "Performance SUPPORT (not evaluation)", "Mentoring (BRC/CRC)", "Lesson-Plan Assist", "Marking Assist",
    "Grievance (teacher)", "Background Verification (POCSO)", "Non-Teaching Staff Register", "Cook-cum-Helper (MDM)",
    "Guest Lecture Management", "Teacher Workload Analytics", "Subject-Allocation", "Timetable Manager",
    "Transfer Counselling Audit", "Award & Recognition", "Naan Mudhalvan Mentor Pool", "Internship Mentor (MMSN)",
    "Teacher Wellbeing",
  ]),
  "assessment": ("L8", 35, ["RPwD-2016", "OECD-PISA"], ["access/abac", "regulatory/rpwd"], [
    "Formative Assessment", "Summative Assessment", "Diagnostic Assessment", "FLN Assessment (NIPUN)",
    "NAS Instrumentation", "Board-Equivalent Assessment", "PISA-Grade Item Engine", "Item-Response Theory (IRT)",
    "Item Bank", "Question-Paper Generation", "Auto-Marking (objective)", "Essay Grading (LLM + human override)",
    "Handwriting OCR (IndicConformer)", "OMR Scoring", "Rubric Engine", "Accessibility-Accommodated Assessment",
    "Extra-Time / Scribe Accommodation (RPwD)", "Result Computation", "Result Publication", "Re-Evaluation",
    "Grade-Card Generation", "Continuous Comprehensive Evaluation", "Practical / Lab Assessment", "Project Assessment",
    "Peer Assessment", "Self Assessment", "Assessment Calendar", "Seating-Plan Generation", "Exam-Integrity Monitor",
    "Malpractice Workflow", "Question-Paper Security", "Assessment Analytics", "Competency Mastery Tracking",
    "Adaptive Practice", "DGE Board Exam Integration",
  ]),
  "scheme-delivery": ("L6", 33, ["PFMS-GFR-2017", "DPDP-2023-Sec-6"], ["access/abac", "regulatory/pfms_gfr", "regulatory/dpdp"], [
    "Scheme Catalogue (per GO)", "Eligibility Engine", "Entitlement Computation", "Reservation Engine (BC/MBC/SC/ST/DNT)",
    "Scholarship — SC/ST", "Scholarship — OBC/MBC", "Scholarship — EBC", "Scholarship — PwD", "Scholarship — Girl-Child",
    "Scholarship — Migrant", "PFMS Disbursement", "DBT / APBS", "Bank-Account Verification", "Beneficiary Register",
    "Scheme Fund-Flow Ledger", "Fund Sanction Workflow", "Fund Reconciliation (PFMS)", "Leakage Detection",
    "Free Textbook Distribution", "Free Uniform Distribution", "Bicycle Scheme", "Laptop Scheme",
    "Mid-Day-Meal (PM-POSHAN)", "MDM Nutrition Tracking", "MDM Stock & Indent", "Breakfast Scheme (TN)",
    "Transport / Bus Pass", "Hostel Allocation", "Pudhumai Penn Scheme", "Illam Thedi Kalvi",
    "Welfare Grievance (scheme)", "Scheme Audit Trail (GFR)", "Account-Aggregator Eligibility (consent)",
  ]),
  "governance-workflow": ("L11", 30, ["IT-Act-2000", "PFMS-GFR-2017"], ["access/rbac", "access/abac", "regulatory/pfms_gfr"], [
    "Governance Workflow Engine (G1-G7 BPMN)", "Approval Chain — G1 Cabinet", "Approval Chain — G2 Empowered Committee",
    "Approval Chain — G3 Inter-Directorate", "Approval Chain — G4 PMU", "Approval Chain — G5 Tech Architecture Board",
    "Approval Chain — G6 Ethics/Equity/RPwD", "Approval Chain — G7 External Audit", "Circular Drafting (Policy Agent)",
    "GO Publication", "Cabinet Note Generation", "Assembly Briefing", "Change-Advisory-Board (CAB)",
    "Delegation-of-Powers Registry", "Tenancy Management (T0-T6)", "Org-Unit Registry", "Recognition & Affiliation",
    "Inspection Workflow", "Sanction Workflow (block/district)", "Model-Card Registry", "Ethics-Review Case Mgmt",
    "AI Leadership Council Portal", "Sovereignty Console", "Off-Switch Control (M-of-N)", "Source-Code Escrow Tracker",
    "CAG / Auditor Export", "Audit-Log Immutability", "Board-Prep & Coordination", "Launch-Readiness Register",
    "Architecture-Conformance Register",
  ]),
  "grievance-redress": ("L6", 30, ["POCSO-2012", "DPDP-2023-Sec-6", "Article-21A"], ["access/abac", "regulatory/pocso"], [
    "Grievance Intake (multi-channel)", "Grievance Classification (Grievance Agent)", "Grievance Triage",
    "Jurisdiction Routing", "SLA Tracker", "Escalation Engine", "Redress Recommendation", "Resolution Workflow",
    "Satisfaction Survey", "Anonymous Reporting", "POCSO Safety Pipeline", "CSAM Detector (human-in-loop)",
    "Mandatory-Reporting Workflow", "Evidence Chain-of-Custody", "Child-Welfare-Committee (JJ) Link",
    "Anti-Ragging / Safety", "Adult-Minor Channel Guardrail", "Content Safety Scan (upload)",
    "PII Redaction (faces/contacts)", "Age-Appropriate Filter", "Whistle-blower Protection", "Grievance Analytics",
    "RTI Request Intake", "RTI Workflow", "CPGRAMS Bridge", "Constituency Grievance", "Public Grievance Tracker",
    "Disposal Monitoring", "Legal-Case Tracker", "Compliance Reporting (grievance)",
  ]),
  "analytics-reporting": ("L8", 30, ["SDG-4", "ESG"], ["access/abac"], [
    "District Scorecard", "Block Scorecard", "School Scorecard", "TN Quality Index", "Opportunity-Gap Index",
    "Equity-Weighted Resource Allocation", "Equity Index", "Enrolment Dashboard", "Attendance Analytics",
    "Dropout Early-Warning", "Learning-Outcome Analytics", "FLN Analytics", "NAS Dashboard", "Gender-Parity Index",
    "Social-Category Disaggregation", "RPwD Inclusion Dashboard", "SDG 4/5/10/16 Dashboards", "Scheme-Delivery Analytics",
    "Fund-Utilisation Analytics", "Teacher-Deployment Analytics", "Infrastructure Telemetry Analytics",
    "Predictive Outcome Model", "Causal Impact (DoWhy)", "Time-Series Forecast (NeuralProphet)", "Anomaly Detection",
    "VSK / Vidya Samiksha Kendra", "Open-Data Aggregation (suppressed)", "Press / Researcher API", "ESG Indicators",
    "STARS / GovTech Reporting Hooks",
  ]),
  "ai-operations": ("L8", 30, ["ISO-42001", "NIST-AI-RMF"], ["access/abac", "ai/safety", "ai/bias", "ai/drift"], [
    "Model Registry (MLflow)", "Feature Store (Feast)", "Model-Card Service", "Bias Audit (AIF360/FairLearn)",
    "Drift Detector (PSI/KL)", "Canary & Rollback", "Red-Team Gate", "Prompt-Injection Defence", "Jailbreak Classifier",
    "Refusal Taxonomy", "Hallucination Control (citation enforcement)", "RAG Orchestrator (LangGraph)",
    "MCP Tool Catalogue", "Retrieval — Milvus (vector)", "Retrieval — OpenSearch (BM25)", "Reranker",
    "Reasoning Engine", "Personalisation Engine", "Assessment Engine", "Policy Engine (interpretation)",
    "Analytics Engine", "Conversational Engine", "Policy Agent", "Teacher Agent", "Student Agent",
    "Governance Agent", "Grievance Agent", "Compliance Agent", "Eval Harness (held-out benchmarks)",
    "Inference Observability (OpenLLMetry)",
  ]),
}

TN = ("tn-specific", "L6", 62, ["TN-State-Acts", "PFMS-GFR-2017"], ["access/abac"], [
  "TN GO Catalogue", "TN Reservation Rules (BC/MBC/SC/ST/DNT)", "TN State Board (DGE) Exam", "TN Textbook Corporation",
  "Pudhumai Penn Scheme", "Naan Mudhalvan Skill Pipeline", "Mudhalvar Makkal Sevai Nanbar Internship",
  "Illam Thedi Kalvi (Education at Doorstep)", "Ennum Ezhuthum (FLN Mission)", "100 Kamarajar Schools Register",
  "500 Creative Schools Register", "Breakfast Scheme (CM)", "Chief Minister's Trophy", "Kalvi TV Integration",
  "Manjappai Awareness (eco-school)", "TN School Education Rules", "TN Private Schools (DPSE) Recognition",
  "Matriculation Schools (DMS)", "Non-Formal Education (DNFE)", "Teacher Education (DTERT/SCERT)",
  "Elementary Education (DEE)", "School Education (DSE)", "TN UDISE+ Reconciliation", "TN APAAR Rollout",
  "TN Treasury / IFMS", "TN Pension & Salary", "TN EPF (staff)", "TN Hostel (Adi Dravidar/BC welfare)",
  "TN Free Bicycle", "TN Free Laptop", "TN Bus Pass", "TN Girl-Child Protection Scheme",
  "TN Differently-Abled Welfare", "TN Migrant-Children Education", "TN Tribal-Residential Schools",
  "TN Adi Dravidar Welfare Schools", "TN Model Schools", "TN Aided-School Management", "TN Anganwadi (ICDS) Bridge",
  "TN Mid-Day-Meal (Variety Meal)", "TN Egg/Nutrition Programme", "TN Sports & Games (CM Trophy)",
  "TN Career Guidance (Naan Mudhalvan)", "TN Digital Classroom", "TN Smart Classroom Rollout",
  "TN Library Movement", "TN Reading Movement", "TN Science Centre Linkage", "TN Cultural Education",
  "TN Tamil-Language Promotion", "TN Heritage Curriculum", "TN Flood/Disaster School Continuity",
  "TN COVID Learning-Recovery", "TN Bridge-Course (learning loss)", "TN Special Coaching (NEET/board)",
  "TN Vocational Education (NSQF)", "TN Apprenticeship Linkage", "TN Alumni Mentorship", "TN Public-School Branding",
  "TN Community Participation (PTA/SMC)", "TN School-Infrastructure Upgrade",
])

# reference_source map: module name substring -> reference impl path (PORT verdicts in CROSSWALK.md)
REF = {
  "RTE 25% EWS/DG Lottery": "lib/admissionsflow, app/admissions", "Governance Workflow Engine": "lib/workflow, lib/governance/control-tower",
  "Substitute / Cover": "lib/coverflow", "Timetable Manager": "lib/timetable-manager", "Scheme Fund-Flow Ledger": "lib/fundledger",
  "Fund Reconciliation": "lib/federation", "Leakage Detection": "lib/federation", "Health Register": "lib/healthregister",
  "TN Quality Index": "lib/outcomes", "Opportunity-Gap Index": "lib/outcomes", "Equity-Weighted Resource Allocation": "lib/outcomes/allocation",
  "RTI Workflow": "lib/rtiflow", "RTI Request Intake": "lib/rti", "Grievance Intake": "lib/grievanceflow", "MCP Tool Catalogue": "lib/mcp",
  "Reasoning Engine": "lib/ai/engines", "Personalisation Engine": "lib/ai/engines", "Assessment Engine": "lib/ai/engines",
  "Policy Engine": "lib/policy-engine", "Analytics Engine": "lib/ai/engines", "Conversational Engine": "lib/ai/engines",
  "Policy Agent": "lib/ai/agents", "Teacher Agent": "lib/ai/agents", "Student Agent": "lib/ai/agents",
  "Governance Agent": "lib/ai/agents", "Grievance Agent": "lib/ai/agents", "Compliance Agent": "lib/ai/agents",
  "Audit-Log Immutability": "lib/audit/trail", "Consent Manager": "lib/consent", "Reading Campaign": "lib/reading",
  "Ennum Ezhuthum": "lib/reading", "IoT": "lib/iot", "Credential Wallet": "lib/credentials", "Marksheet Issuance": "lib/credentials",
  "Curriculum Graph": "lib/knowledge-graph", "SMC": "lib/smc", "Community Participation": "lib/smc",
}

def slug(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s[:48]

def ref_for(name: str):
    for k, v in REF.items():
        if k.lower() in name.lower():
            return v
    return None

def emit():
    entries = []
    n = 0
    order = list(CORE.items()) + [(TN[0], (TN[1], TN[2], TN[3], TN[4], TN[5]))]
    for domain, (layer, count, comp, bundles, names) in order:
        for i in range(count):
            n += 1
            name = names[i] if i < len(names) else f"{domain.replace('-', ' ').title()} — Module {i+1}"
            mid = f"M{n:04d}"
            entries.append({
                "id": mid, "name": name, "layer": layer, "domain": domain,
                "owner": f"team-{domain}", "compliance": comp, "policy_bundles": bundles,
                "reference_source": ref_for(name),
                "status": "implemented" if ref_for(name) else ("scaffold" if domain != "tn-specific" else "spec-only"),
                "slug": slug(name),
            })
    return entries

def yaml_dump(entries):
    out = ["# CC-SPEC-001 §12 — full module catalogue (GENERATED by tools/gen_catalogue.py; do not hand-edit).",
           f"# {len(entries)} modules. Edit the generator, then re-run.", "modules:"]
    for e in entries:
        out.append(f"  - id: {e['id']}")
        out.append(f"    name: \"{e['name']}\"")
        out.append(f"    layer: {e['layer']}")
        out.append(f"    domain: {e['domain']}")
        out.append(f"    owner: {e['owner']}")
        out.append(f"    compliance: [{', '.join(e['compliance'])}]")
        out.append(f"    policy_bundles: [{', '.join(e['policy_bundles'])}]")
        rs = e['reference_source']
        rs_val = '"' + rs + '"' if rs else 'null'
        out.append(f"    reference_source: {rs_val}")
        out.append(f"    status: {e['status']}")
    return "\n".join(out) + "\n"

def md_dump(entries):
    core = [e for e in entries if e["domain"] != "tn-specific"]
    tn = [e for e in entries if e["domain"] == "tn-specific"]
    impl = sum(1 for e in entries if e["status"] == "implemented")
    scaf = sum(1 for e in entries if e["status"] == "scaffold")
    spec = sum(1 for e in entries if e["status"] == "spec-only")
    lines = [f"# Module Catalogue (GENERATED) — {len(entries)} modules · {len(core)} core + {len(tn)} TN-specific",
             "",
             f"Generated from `modules/catalogue.yaml` by `tools/gen_catalogue.py`. Status: **{impl} implemented · {scaf} scaffold · {spec} spec-only** "
             "(`implemented` = a reference-impl port source exists; see `docs/CC-SPEC-001-CROSSWALK.md`).",
             ""]
    cur = None
    for e in entries:
        if e["domain"] != cur:
            cur = e["domain"]
            lines += ["", f"## {cur} ({e['layer']})", "", "| id | module | status | reference source |", "|---|---|---|---|"]
        lines.append(f"| {e['id']} | {e['name']} | {e['status']} | {e['reference_source'] or '—'} |")
    return "\n".join(lines) + "\n"

if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    entries = emit()
    open(os.path.join(root, "modules", "catalogue.yaml"), "w").write(yaml_dump(entries))
    open(os.path.join(root, "modules", "CATALOGUE.generated.md"), "w").write(md_dump(entries))
    print(f"generated {len(entries)} modules "
          f"({sum(1 for e in entries if e['domain']!='tn-specific')} core + {sum(1 for e in entries if e['domain']=='tn-specific')} TN)")
