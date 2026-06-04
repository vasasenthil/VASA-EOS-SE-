# VASA‑EOS (SE) — Full Requirements Traceability Matrix
## All 72 Functional Sections · 312 Core + 50 TN Modules (362) · 10 Flagships · 8 Native‑AI Pillars

**Source:** `VASA_EOS_SE_TN_Unified_Master_Document (5)` v2.5 (Parts XVI, Sec 2D/2E; Sec 8E/8F; Part XI; Section 16).
**Purpose:** One row per functional section/module mapped across the four mandated dimensions — **Technical stack · Compliance framework · Stakeholder workflow · Non‑tech enabler** — plus current **repo status**.
**Legend (status):** 🟢 Good · 🟡 Partial · 🔴 Missing · `[INF]` section name inferred from tier‑count reconciliation (source enumerates modules but not all section labels for tiers 3–5).

**Module distribution (source):** National 45 · State 36 · District 18 · Block 7 · Cluster 4 · School 127 · Cross‑cutting 75 = **312 core** (+ **50 TN‑specific** = **362 total for TN**).

---

## TIER 1 — NATIONAL (Sections 1–9 · 45 modules)

| Sec | Section | Mods | Technical stack | Compliance | Stakeholder workflow | Non‑tech enabler | Repo |
|---|---|---|---|---|---|---|---|
| 1 | APAAR Lifecycle Mgmt | 6 | Keycloak/OIDC, UIDAI Auth, DigiLocker SDK, AI dedup | APAAR/NDEAR Identity BB, DPDP, Aadhaar Act | Provision→auth→federate→transfer→dedup→DigiLocker | School enrolment drives; parental consent | 🔴 |
| 2 | National Curriculum Framework | 5 | Neo4j taxonomy, content service | NCF 2023, NCFSE | Curriculum mapping, competency framework | SCERT contextualisation | 🔴 |
| 3 | DIKSHA Federation | 5 | Sunbird APIs, content federation, MT | NDEAR Content BB | Discovery, rating, authoring, translation | Tamil content prioritisation | 🔴 |
| 4 | National Schemes | 6 | PFMS, scheme engine, DBT | Samagra, PM SHRI, NIPUN, STARS, NMMS | Component‑wise tracking, UC submission | Scheme review forums | 🔴 |
| 5 | National Boards & Exams | 5 | CBSE OASIS, PARAKH API | CBSE/NIOS/PARAKH/NAS | Cross‑board recognition | Board coordination | 🔴 |
| 6 | National Teacher Standards | 4 | NPST competency engine, CPD tracker | NCTE, CTET, NPST | Teacher ID, CPD framework | NPST career ladder | 🔴 |
| 7 | India Stack Integration | 6 | Aadhaar Auth, DigiLocker, UPI, DBT‑APBS, eSign, GeM, PFMS, UMANG | Aadhaar Act, IT Act | Identity/payment/credential rails | — | 🔴 |
| 8 | NETF / NDEAR Architecture | 4 | NDEAR Open APIs, Consent Mgr, EER, VSK, NEAT | NDEAR‑S 29/29, NETF 5/5 | Sandbox onboarding, federation | NETF empanelment | 🔴 |
| 9 | International Interoperability | 4 | W3C VC, LTI 1.3, QTI 3.0, Apostille | ENIC‑NARIC, UNESCO, IMS | Credential portability | Diaspora linkage | 🔴 |

## TIER 2 — STATE / TAMIL NADU (Sections 10–17 · 36 modules)

| Sec | Section | Mods | Technical stack | Compliance | Stakeholder workflow | Non‑tech enabler | Repo |
|---|---|---|---|---|---|---|---|
| 10 | TN State Education Policy | ~5 | Policy‑as‑code (OPA/Rego) | SEP 2022, Concurrent List E25 | Two‑language default, sovereign override | Political sign‑off of defaults | 🟡 (policy CRUD) |
| 11 | TN Directorate Operations | ~5 | Per‑directorate microservices/tenant | TN service rules | DSE/DEE/DGE/DMS/DTERT/DPSE/DNFE ops | 7‑directorate coordination | 🟡 (governance) |
| 12 | TN State Schemes (Flagship) | ~5 | Scheme engine, DBT‑APBS, lifecycle tracker | DBT, CAG | CMBS, Pudhumai Penn, Naan Mudhalvan, ITK, EE | Scheme programme directors | 🟡 (scheme catalogue) |
| 13 | TN State Schemes (Welfare) | ~5 | Eligibility + APBS + dedup | Reservation Acts, welfare rules | Adi Dravidar/BC‑MBC/Minority, cycles/laptops/bus pass | Welfare departments | 🟡 (catalogue) |
| 14 | TN Recognition & Regulation | ~4 | Workflow engine, e‑Sign/e‑Stamp | TN 1973 Act, Fee Act 2009 | Recognition, fee committee, inspection | Inspection SOP reform | 🟡 (compliance pages) |
| 15 | TN SCERT & Curriculum | ~4 | Content + KG, Tamil literature corpus | NCF align + Tamil primacy | TN curriculum, DIET coordination | SCERT authority | 🟡 (academic‑head curriculum) |
| 16 | TN State Welfare Boards | ~4 | Welfare workflow services | Reservation sub‑categorisation | AD/BC‑MBC/Minority/Diff‑abled/Women | Welfare board coordination | 🔴 |
| 17 | TN Inter‑Departmental Integration | ~4 | ESB connectors | MoUs per dept | Health(RBSK)/Transport/Welfare/TNSDC | Inter‑dept forum | 🔴 |

## TIER 3–5 — DISTRICT / BLOCK / CLUSTER (Sections 18–24 · 29 modules) `[INF]`

| Sec | Section `[INF]` | Mods | Technical stack | Compliance | Stakeholder workflow | Non‑tech enabler | Repo |
|---|---|---|---|---|---|---|---|
| 18 | District Operations & KPIs | ~6 | District dashboards, heat maps, GIS | Statutory district reporting | DEO/CEO ops, resource allocation | District Education Coordination Committee | 🔴 |
| 19 | District Quality & Inspection | ~6 | AI‑prioritised inspection scheduler | Quality monitoring norms | Inspection queue, DIET coordination | Inspection cadre | 🔴 |
| 20 | District Welfare & Inter‑dept | ~6 | Welfare + health federation | Welfare rules | District welfare officers | Collector‑chaired coordination | 🔴 |
| 21 | Block Operations (BEO) | ~4 | Block dashboard, scheme tracking | Block reporting | BEO ops, grievance mgmt | Block Education Review (weekly) | 🔴 |
| 22 | Block Resource & CPD (BRC) | ~3 | CPD coordination service | NPST CPD | BRC faculty, teacher CPD | BRC capacity | 🔴 |
| 23 | Cluster Field Ops (CRCC) | ~2 | Mobile‑first field app, GPS verify, offline | — | GPS‑verified visits, NIPUN cluster tracking | CRCC mentoring | 🔴 |
| 24 | Cluster Mentoring & Community | ~2 | Offline sync, community engagement | — | Teacher mentoring, community outreach | CRC community ties | 🔴 |

## TIER 6 — SCHOOL (Sections 25–51 · 127 modules)

| Sec | Section (category) | Technical stack | Compliance | Stakeholder workflow | Non‑tech enabler | Repo |
|---|---|---|---|---|---|---|
| 25 | Student Lifecycle Mgmt | APAAR‑anchored profile svc | RTE, DPDP | Admission→promotion→transfer→exit | Enrolment drives | 🟡 (SIS) |
| 26 | Teacher Management | HRMS, NPST, IFHRMS | NPST, TN conduct rules | Recruitment→CPD→transfer→retirement | Counselling‑based transfers | 🟡 (staff) |
| 27 | Classroom Operations & Attendance | Multimodal capture (Pillar 1), edge/offline | DPDP, POCSO (no surveillance) | Daily attendance→early‑warning | Biometric‑opt‑in policy | 🔴 |
| 28 | Curriculum Delivery (TN‑aligned) | Content svc + KG | NCF/TN curriculum | Lesson plans, two‑language | Tamil pedagogy | 🟡 (curriculum) |
| 29 | Assessment & Examinations | IRT, OMR(CV), AI eval | CCE, PARAKH | Formative→board→credential | Examiner training | 🟡 (assessment) |
| 30 | Adaptive Learning Engine | Knowledge tracing, RL/DQN, IRT (Pillar 2) | NEP/NCF | Per‑learner paths, gap dashboards | Teacher CPD | 🔴 |
| 31 | NIPUN Bharat / Ennum Ezhuthum | FLN engine (Pillar 7), reading‑aloud ASR | NIPUN | Reading levels, remediation | Ennum Ezhuthum volunteers | 🔴 |
| 32 | PM POSHAN / CMBS Operations | AI menu, GeM, TimescaleDB IoT cold chain | NFSA, FSSAI | Daily reconciliation, mother committee | Cook training, mother committees | 🟡 (health adjacent) |
| 33 | School Health (RBSK) | ABHA/FHIR federation | RBSK, ABHA | Screening, referral | Health‑dept coordination | 🟡 (health) |
| 34 | Inclusive Education (21 RPwD) | WCAG AAA, ISL, AAC, UDID (Flagship 06) | RPwD 2016, UDID, RCI | IEP, specialist booking, home‑based | Special‑educator cadre | 🔴 |
| 35 | School Transport | Route svc, TNSTC/MTC API | — | Bus pass, cycle distribution | Transport coordination | 🔴 |
| 36 | Hostel & Residential Mgmt | Hostel svc | Welfare rules | Allocation, mess, health/safety | Hostel wardens | 🔴 |
| 37 | Library Management | Catalogue + digital library federation | — | Inventory, e‑books, reading tracking | Anna Centenary Library tie | 🔴 |
| 38 | Scheme Operations (per school) | DBT engine, dedup | DBT, CAG | Beneficiary→disbursement→outcome | Grievance desks | 🟡 (schemes view) |
| 39 | Parent Engagement | IVR/WhatsApp/SMS, UPI | DPDP | Notifications, fees, grievance | PTM, low‑literacy support | 🟡 (parent portal) |
| 40 | School Management Committee | DAO‑pattern voting, ledger | RTE (75% parents) | Proposals→voting→treasury | SMC capacity‑building | 🔴 |
| 41 | PTA Operations | Election + meeting svc | RTE | PTA elections, feedback | Parent participation | 🔴 |
| 42 | Infrastructure Management | Asset svc, IoT | RTE infra norms, Swachh Vidyalaya | Maintenance, safety, CWSN infra | Facility staff | 🟡 (principal partial) |
| 43 | Inventory & Procurement | GeM API, demand forecast | GeM rules | Indent→procure→reconcile | Procurement SOP | 🔴 |
| 44 | Financial Management (school) | IFHRMS, ledger | CAG, treasury | Budget→grants→expenditure | Finance literacy | 🟡 (fee mgmt) |
| 45 | Recognition & Compliance | Workflow engine | TN 1973 Act | Recognition, renewal, appeal | Inspection SOP | 🟡 (compliance) |
| 46 | Quality Monitoring & Inspection | AI inspection scheduler | Quality norms | Self‑attestation + targeted visits | Quality cadre | 🟡 (compliance partial) |
| 47 | Communication (multi‑channel) | SMS/WhatsApp/IVR/email, 22 langs | DPDP | Templates, broadcast, dialect IVR | Comms calendar | 🟡 (announcements) |
| 48 | Grievance Redressal | CPGRAMS federation, SLA routing | RTI, CPGRAMS | Multi‑tier escalation, SLA | Grievance officers | 🔴 |
| 49 | Green School Operations | ESG svc, solar/carbon tracking | GRI/TCFD/SASB, ESG | Water/waste/tree/solar tracking | Eco clubs | 🔴 |
| 50 | Co‑curricular Activities | Activity svc | NEP bagless days | Clubs, competitions, arts | Cultural calendar | 🔴 |
| 51 | Sports & Physical Education | Sports svc | Khelo India | PE curriculum, competitions | Sports infra/coaches | 🔴 |

*(Sections 25–51 = 27 categories ≈ 127 modules; statuses summarise the most representative repo pages.)*

## TIER 7 — CROSS‑CUTTING (Sections 52–72 · 75 modules)

| Sec | Section | Technical stack | Compliance | Stakeholder workflow | Non‑tech enabler | Repo |
|---|---|---|---|---|---|---|
| 52 | Identity & Access (IAM) | Keycloak/WSO2, RBAC/ReBAC/ABAC/PBAC/CABAC, SSO, PAM | DPDP, IT Act | All role provisioning | Access governance | 🟡 (RBAC only) |
| 53 | Security Architecture | Zero‑trust, HSM, SIEM, EDR, WAF | CERT‑In, ISO 27001 | SOC ops, incident response | Cyber drills/insurance | 🔴 |
| 54 | Data Architecture | Lake, warehouse, vector, federation | DPDP, ISO 27701 | Data governance, MDM | Data stewardship | 🟡 (PG only) |
| 55 | Integration Architecture | API gateway, ESB, event bus, India Stack | NDEAR Interop | 50+ system federation | Integration governance | 🔴 |
| 56 | OCR/OMR Engine | Tesseract/CV, all 22 scripts, child handwriting | — | Smartphone OMR, ICR | — | 🔴 |
| 57 | AI/ML Platform | 8 agents, model registry, bias monitor | EU AI Act, NIST AI RMF, ISO 42001 | Agent orchestration | AI Ethics Council | 🔴 |
| 58 | NLP for Indian Languages | Bhashini, Anuvadini, 22 langs, Tamil‑first | Art. 350A | Voice/text/translation | Native trainers | 🔴 |
| 59 | Knowledge Graphs | Neo4j, SPARQL, Tamil literature ontology | — | Semantic search, pathways | Curriculum experts | 🔴 |
| 60 | Analytics & Telemetry | Sunbird, NDEAR Anonymiser, VSK, ClickHouse | DPDP anonymisation | Dashboards, predictive | Data‑driven culture | 🟡 (recharts dashboards) |
| 61 | Operations Research | Optimisation, simulation | — | Teacher deployment, routing | OR expertise | 🔴 |
| 62 | Workflow Engine | Temporal/Camunda, BPMN, state machines | — | Approvals, exceptions | Exception governance | 🔴 |
| 63 | Notification & Communication | SMS/WhatsApp/IVR/email, 22 langs | DPDP | Templated multi‑channel | Comms ops | 🟡 (notifications API) |
| 64 | Document Management | e‑Sign, e‑Stamp, versioning, DigiLocker | IT Act, Stamp Act | Digital signatures, workflow | Records mgmt | 🟡 (blob upload) |
| 65 | Privacy & Consent | InDEA 2.0 consent ledger, withdrawal | DPDP | Consent capture/withdraw | DPO governance | 🔴 |
| 66 | Audit & Compliance | Immutable audit, blockchain anchor, statutory reports | CAG, RTI | Audit trail, reporting | Audit committee | 🟡 (audit log) |
| 67 | Enterprise Risk | Risk register, legal mgmt | ISO 31000 | Risk reviews, traffic‑light | Risk owners | 🟡 (tracking/challenges) |
| 68 | Emergency & Disaster | Multi‑channel alerts, NDMA federation | NDMA, TNSDMA | Evacuation, continuity | Disaster drills | 🔴 |
| 69 | Blockchain & NFT | Hyperledger, NFT‑SBT, smart contracts | W3C VC, DID | Credentials, anchoring | — | 🔴 |
| 70 | Federation & Ecosystem | NEAT, LTI, OneRoster, Caliper, sandbox | IMS standards | Vendor onboarding, dev portal | Ecosystem governance | 🔴 |
| 71 | AI Transparency & Ethics | AI register, bias audits, explainability (SHAP/LIME) | UNESCO/OECD AI, ISO 42001 | Model cards, transparency reports | AI Ethics Council | 🔴 |
| 72 | Stakeholder Portals (13) | Next.js/RN/Flutter, AIGUI, IVR, WhatsApp | WCAG AAA | All 13 role portals | 5‑capability‑level design | 🟡 (~5/13) |

---

## TN‑SPECIFIC MODULES (TN‑001 … TN‑050 · +50 → 362 total)

Condensed; all map primarily to State/School tiers with TN compliance (SEP 2022, TN 1973/Fee Acts, Reservation 69%, PESA) and TN cultural/welfare non‑tech enablers.

| Range | Modules | Theme | Repo |
|---|---|---|---|
| TN‑001–008 | CMBS Breakfast, Pudhumai Penn lifecycle, Naan Mudhalvan Foundation, ITK, Ennum Ezhuthum, Egg Distribution, Free Cycle, Free Laptop | Flagship scheme ops (DBT/APBS, GeM, IoT) | 🟡 catalogue |
| TN‑009–016 | TN 1973 Recognition, Fee Committee, DGE Exam, Matric Board, 7‑Directorate Coordination, DIET, Open School, Cyclone Preparedness | Regulation + exam + coastal resilience | 🟡 partial |
| TN‑017–025 | Tribal Welfare, Adi Dravidar Hostel, BC/MBC Hostel, Minority Welfare, Reservation 69%, SL‑Tamil Refugee, Dialect Recognition, Tamil Literature, Cultural Calendar | Welfare + identity + culture | 🔴 |
| TN‑026–033 | Thirukkural, Diaspora, Public Library Network, Aspirational Block, Coastal District, Border District, Anganwadi Bridge, TNSTC/MTC Bus Pass | Heritage + geography + transport | 🔴 |
| TN‑034–042 | Civil Supplies(PDS), NHM(RBSK), POCSO‑Police, IFHRMS, State Election Commission, Tamil Pudhalvan, Naan Mudhalvan Career, Anna Centenary Library, State Disaster Mgmt | Inter‑dept federation | 🔴 |
| TN‑043–050 | Constituency View, Local Body Schools, KGBV, PM SHRI, Bharati Studies, Madarasa Tracking, Anglo‑Indian School, Climate‑Resilient School | Political accountability + special schools + climate | 🔴 |

---

## 10 FLAGSHIP DEEP‑DIVE MODULES (Sec 2E)

| # | Flagship | Primary stack | Compliance | Stakeholders | Non‑tech | Repo |
|---|---|---|---|---|---|---|
| 1 | APAAR Lifecycle | OIDC, UIDAI, DigiLocker, AI dedup | APAAR, DPDP | Student/Parent | Consent process | 🔴 |
| 2 | PM POSHAN/CMBS | AI menu, GeM, IoT cold chain | NFSA, FSSAI | Cook/Mother‑committee | Mother committees | 🟡 |
| 3 | Pudhumai Penn | APAAR/Aadhaar dedup, DBT‑APBS, blockchain | DPDP, CAG | Girl students/HE | Bank seeding | 🟡 |
| 4 | Naan Mudhalvan | NSDC/TNSDC, career graph | NSQF/NCVET | Class 9–12 | Industry partners | 🟡 |
| 5 | Examination Security | AI paper‑gen, OMR, AI eval, Hyperledger | IT Act, CERT‑In | DGE/DMS | Invigilator training | 🟡 |
| 6 | Inclusive Ed (21 RPwD) | WCAG AAA, ISL, AAC, UDID | RPwD, RCI | CWSN/Special educators | Specialist cadre | 🔴 |
| 7 | Adaptive Learning | Knowledge tracing, RL, IRT | NEP/NCF/NIPUN | Students/Teachers | Pedagogy CPD | 🔴 |
| 8 | TN 1973 Recognition | Workflow, e‑Sign | TN 1973/Fee Acts | DSE/DMS | Inspection SOP | 🟡 |
| 9 | 13 Stakeholder Portals | Next.js/RN/Flutter, AIGUI | WCAG AAA | All roles | Capability‑level design | 🟡 |
| 10 | AI Agent Orchestration | LangGraph+MCP, Bharat LLM, RLHF | UNESCO/OECD/EU AI | Teachers (augment) | AI Ethics Council | 🔴 |

---

## 8 NATIVE‑AI PILLARS (Section 16)

| Pillar | Capability | Stack | Compliance / ethics | Non‑tech | Repo |
|---|---|---|---|---|---|
| 1 | AI Attendance (Trust Foundation) | Face CNN + voiceprint + gait + QR/NFC; edge/offline; on‑device | DPDP, POCSO, "no surveillance"; **DPIA needed** | Biometric opt‑in policy | 🔴 |
| 2 | Adaptive Question Bank | NLP/LLM/GenAI gen + DQN/bandit/ZPD sequencing | Bias filters, curriculum validation | Teacher‑in‑loop approval | 🔴 |
| 3 | Multimodal Grading | OCR/CV/STT/video; GenAI feedback; misconception library | Fairness guards, demographic parity | Teacher override; transparent rubrics | 🔴 |
| 4 | Agentic Teacher Assistant | Multi‑agent (Plan/Instruct/Assess/Comm/Profile/Early‑Warn/Compliance/Coach) | HITL, reasoning traces | Teacher‑centric (augment) | 🔴 |
| 5 | Hybrid Recommendation + ULP | Collaborative+content+GNN+context ensemble; cold‑start | Privacy, federated | Onboarding survey seeds | 🔴 |
| 6 | Holistic Parenting Platform | Multilingual app, beyond‑marks insights | Privacy‑first, no ads | Whole‑family engagement | 🟡 (basic parent) |
| 7 | AI‑driven FLN | Reading‑aloud ASR, numeracy diagnostics, remediation | NIPUN, bilingual readiness | Ennum Ezhuthum, parent involvement | 🔴 |
| 8 | Self‑Improving Knowledge Base | Feedback loops, federated learning, open‑weights | No raw‑data export, sovereignty | Teacher contributions credited | 🔴 |

---

## Coverage summary

| Tier | Sections | Target modules | Repo coverage (weighted) |
|---|---|---|---|
| National (1–9) | 9 | 45 | 🔴 ~0% |
| State/TN (10–17) | 8 | 36 | 🟡 ~15% |
| District/Block/Cluster (18–24) | 7 | 29 | 🔴 ~0% |
| School (25–51) | 27 | 127 | 🟡 ~20% |
| Cross‑cutting (52–72) | 21 | 75 | 🟡 ~10% |
| **Core total** | **72** | **312** | **~10%** |
| TN‑specific | — | 50 | 🟡 ~8% |
| **TN grand total** | | **362** | **~9%** |

> Maintain this matrix as the single source of truth. Each 🔴/🟡 cell should become an epic with the four‑dimension mapping carried into its acceptance criteria, prioritised via the Gap‑Analysis MoSCoW × phase plan.

---
*Companion to `VASA-EOS-SE-Implementation-Blueprint.md` and `VASA-EOS-SE-Gap-Analysis.md`.*
