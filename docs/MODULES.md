# VASA-EOS(SE) — Module Reference

A short entry per `lib/` module: its purpose, key exports, the route that surfaces
it, and whether it persists (has a server-only `store.ts`). Grouped by concern, as in
[ARCHITECTURE.md](ARCHITECTURE.md). Modules with a `store.ts` follow the client-safe
`index.ts` / server-only `store.ts` split.

## Domain & identity

### `domain`
APAAR-centric canonical ER model. **Exports:** `Student`, `School`, `Teacher`,
`Guardian`, `DisabilityRecord`, `SchemeBeneficiary`, `Credential`, `JourneyEvent`,
`ReservationCategory`, `JourneyStatus`, `RPWD_CATEGORIES` (21).

### `sis`
Deepened Student Information System — 360° records with attendance, NIPUN, CWSN,
risk flags. **Exports:** `SisStudent`, `SIS_ROSTER`, `getSisStudent`, `summarise`,
`SisSummary`. **Route:** `/sis`.

### `tenancy`
7-tier sovereign multi-tenancy with hierarchy-scoped access. **Exports:**
`TenantTier`, `TENANT_TIERS`, `DEMO_TENANTS`, `ancestorsOf`, `canAccessTenant`,
`TENANCY_GUARANTEES`. **Route:** `/tenancy`.

## Access & security

### `access`
Unified 5-model Policy Decision Point (RBAC·ReBAC·ABAC·PBAC·CABAC), deny-wins /
fail-closed. **Exports:** `authorize`, `rbacAllows`, `rebacAllows`, `abacAllows`,
`pbacDecision`, `cabacAllows`, `EngineConfig`, `AccessRequest`, `Decision`, `Policy`.
See [SECURITY.md](SECURITY.md).

### `audit` (`trail.ts`)
Tamper-evident, hash-chained audit ledger (FNV-1a), Supabase-backed with in-memory
fallback. **Exports:** `appendAudit`, `getTrail`, `verifyTrail`, `AuditEntry`.
(`audit/log.ts` provides the separate Supabase activity log: `getAuditLogs`.)
**Route:** `/admin/audit-log`.

### `consent` `[+store.ts]`
DPDP consent ledger — explicit, withdrawable, purpose-bound, guardian-given for
under-18s. **Exports:** `CONSENT_PURPOSES`, `ConsentRecord`; store: `grantConsent`,
`withdrawConsent`, `listConsents`, `hasConsent`. **Route:** `/consent`.

### `security`
Zero-trust posture: security headers + documented layers/principles. **Exports:**
`SECURITY_HEADERS`, `ZERO_TRUST_LAYERS`, `ZERO_TRUST_PRINCIPLES`, `INCIDENT_RESPONSE`.
Applied in `middleware.ts`. **Route:** `/security`.

## Integrations

### `integrations`
Typed ports for every external dependency, each with a mock and a real adapter.
**Subtree:** `types` (port interfaces), `config` (env flags + accessors), `mock`,
`live` (real adapters over `http`), `status` (introspection), and the `index.ts`
registry (`integrations`). **Routes:** `/integrations`, `/content`, `/school-registry`,
`/aadhaar`, `/dbt`. See [OPERATIONS.md](OPERATIONS.md).

### `agents`
Orchestration over the `AgentProvider` port for the 8 specialised agents, with
confidence-gating and human-in-the-loop for high-stakes agents. **Exports:** `AGENTS`,
`runAgent`, `AgentRunResult`. **Route:** `/ai-agents`.

## Persistence & data

### `persistence`
The DB seam. **Exports:** `getDb` (service-role client or null), `dbReady`,
`__setTestDb` (test-only injection).

### `data`
Polyglot persistence architecture (reference model). **Exports:** `POLYGLOT_STORES`,
`DATA_TIERS`, `DATA_ZONES`, `DATA_GOVERNANCE`, `Repository`. **Route:** `/data-platform`.

### `supabase`
Server client factory. **Exports:** `createClient`, `supabaseAdmin`,
`isSupabaseAdminConfigured`.

## Learning / AI core

### `adaptive`
Bayesian Knowledge Tracing + IRT/ZPD next-item selection. **Exports:** `bktUpdate`,
`selectNextItem`, `SKILLS`, `ITEM_BANK`, `MASTERY_THRESHOLD`. **Route:**
`/adaptive-learning`.

### `knowledge-graph`
Concept prerequisite DAG with topological learning paths. **Exports:** `CONCEPTS`,
`learningPath`, `isReady`, `transitivePrerequisites`, `unlocks`, `getConcept`.
**Route:** `/knowledge-graph`.

### `omr`
Smartphone OMR scoring. **Exports:** `ANSWER_KEY`, `OMR_OPTIONS`, `scoreOmr`,
`OmrScore`. **Route:** `/omr`.

### `credentials` `[+store.ts]`
NFT/SBT verifiable credentials, soulbound + audit-anchored. **Exports:**
`credentialHash`, `canonicalBody`, `verifyCredential`, `VerifiableCredential`; store:
`mintCredential`, `listCredentials`, `verifyById`. **Route:** `/credentials`.

## Governance & compliance

### `governance-framework`
Governance tiers, RACI, forums. **Exports:** `GOVERNANCE_TIERS`, `RACI`, `FORUMS`.
**Route:** `/governance/framework`.

### `recognition` `[+store.ts]`
TN 1973 school recognition workflow. **Exports:** `RECOGNITION_STAGES`,
`ELIGIBILITY_CRITERIA`, `RecognitionApplication`, `recognitionSummary`; store:
`fileApplication`, `advanceApplication`, `rejectApplication`, `listApplications`.
**Route:** `/recognition`.

### `quality`
Quality/inspection index + compliance traffic-light. **Exports:** `QUALITY`,
`qualitySummary`, `COMPLIANCE_AREAS`, `Compliance`. **Route:** `/quality`.

### `exams`
Exam security pipeline + subjects. **Exports:** `EXAM_PIPELINE`, `EXAM_SUBJECTS`,
`ExamType`. **Route:** `/exams`.

## Welfare & operations

### `meals`
PM POSHAN / CMBS — menu planning, nutrition, procurement, leakage reconciliation.
**Exports:** `planWeeklyMenu`, `summarizeNutrition`, `reconcile`, `procurementStatus`,
`MOTHER_COMMITTEE_CHECKLIST`. **Route:** `/pm-poshan`.

### `finance`
School budgets + statutory reports. **Exports:** `BUDGET`, `financeSummary`,
`STATUTORY_REPORTS`, `inr`. **Route:** `/finance`.

### `procurement`
Inventory + indents. **Exports:** `INVENTORY`, `INDENTS`, `procurementSummary`,
`IndentStatus`. **Route:** `/procurement`.

### `smc` `[+store.ts]`
DAO-style School Management Committee — quorum voting. **Exports:** `SMC_MEMBERS`,
`SMC_QUORUM`, `proposalStatus`, `Proposal`; store: `createProposal`, `vote`,
`listProposals`. **Route:** `/smc`.

## Student services & facilities

### `hostel`
Hostel management + mess checklist. **Exports:** `HOSTELS`, `hostelSummary`,
`MESS_CHECKLIST`. **Route:** `/hostel`.

### `library`
Library catalogue + features. **Exports:** `CATALOGUE`, `librarySummary`,
`LIBRARY_FEATURES`. **Route:** `/library`.

### `transport`
Bus routes + transport schemes. **Exports:** `ROUTES`, `transportSummary`,
`TRANSPORT_SCHEMES`. **Route:** `/transport`.

### `health`
School health (RBSK) screenings + 4 Ds. **Exports:** `SCREENINGS`, `healthSummary`,
`RBSK_FOUR_DS`. **Route:** `/rbsk`.

### `grievance` `[+store.ts]`
Multi-tier grievance redressal with SLA + CPGRAMS federation. **Exports:**
`ESCALATION_TIERS`, `GRIEVANCE_CATEGORIES`, `Grievance`; store: `fileGrievance`,
`escalateGrievance`, `resolveGrievance`, `listGrievances`. **Route:** `/grievance`.

### `infrastructure`
Facility inventory + RTE/RPwD gap analysis. **Exports:** `INFRASTRUCTURE`,
`infraSummary`, `schoolReadiness`, `schoolGaps`. **Route:** `/infrastructure`.

### `emergency`
Disaster management (TNSDMA) — incidents, drill compliance, safety scores.
**Exports:** `INCIDENTS`, `SCHOOL_SAFETY`, `emergencySummary`, `safetyScore`,
`MANDATED_DRILLS`. **Route:** `/emergency`.

### `cocurricular`
Co-curricular & sports activities. **Exports:** `ACTIVITIES`, `coCurricularSummary`.
**Route:** `/co-curricular`.

### `esg`
Green-school / ESG metrics + frameworks. **Exports:** `ENVIRONMENTAL`, `SOCIAL`,
`GOVERNANCE`, `ESG_FRAMEWORKS`. **Route:** `/green-school`.

### `accessibility`
21-RPwD accessibility features + user preferences. **Exports:** `DEEP_ACCESSIBILITY`,
`AccessibilityPreferences`, `DEFAULT_A11Y`. **Route:** `/accessibility`.

## Platform & UX

### `i18n`
react-i18next locales (ta/en/hi). **Exports:** `LOCALES`, `DEFAULT_LOCALE`, `Locale`.
**Route:** `/multilingual`.

### `portal-data`
KPI aggregation over the shared datasets for the stakeholder portals. **Exports:**
`stateRollup`, `schemeBeneficiaries`, `nipunOnTrackPct`, `schemeCoveragePct`,
`districts`, `knownSchools`, `complianceLabel`.

### `selftest`
In-app health checks of the core guardrails. **Exports:** `runSelfTests`,
`SelfTestReport`, `Check`. **Route:** `/health`.

### `forumflow` + `tracking/analytics`
**Forum/Meeting (RACI) workflow** — the 7th approval flow. `FORUM_RESOLUTION`
(Secretary convenes → quorum of 2 Directors adopts → Minister ratifies significant
items, dynamic skip for routine business). `lib/forumflow/store.ts` (seeded,
persisted, audited); inbox at `/governance/forums`; flows into the Oversight Command
Centre. **NEP analytics** — `lib/tracking/analytics.ts` (pure, seeded): `ragBand`,
`statusDistribution`, `ragDistribution`, `byThrustArea`, `byRegionType`, `atRisk`,
`analyticsSummary` over NEP-2020 thrust areas/tiers. **Route:** `/tracking/analytics`.

### `governance/oversight`
Cross-process **Governance Oversight Command Centre** — a live rollup over every
approval instance in flight across all six workflow flows (leave · SMC · recognition
· admission · grievance · maintenance). Pure aggregator (no store import).
**Exports:** `summarizeOversight`, `rollupByFlow`, `pendingByRole`, `agingProfile`,
`ageBucketFor`, `oversightToCSV`, `OversightItem`. **Routes:** `/governance/oversight`
(real-time dashboard: by-process, awaiting-which-role, backlog aging, live register)
and `/api/governance/oversight/csv` (downloadable register). Server collector
`app/governance/oversight/collect.ts` projects each flow's records via the engine.

### `glossary`
Abbreviations & Expansions reference for every acronym used across the platform
(NEP, APAAR, RTE, SMC, CRCC, PM POSHAN, …) grouped into eight themes. Pure,
client-safe data + helpers. **Exports:** `GLOSSARY`, `GLOSSARY_CATEGORIES`,
`searchGlossary`, `filterByCategory`, `groupByCategory`, `sortByAbbr`, `lookup`,
`glossarySummary`. **Route:** `/glossary` (searchable, filter-by-category).

### `notifications`
User notifications (Supabase). **Exports:** `createNotification`,
`getUserNotifications`, `markNotificationRead`, `markAllNotificationsRead`.

### `auth`
Supabase auth helpers for server actions. **Exports:** `getSupabaseAuthUser`,
`getUserFromAction`, `getUserRoleAndSchool`, `getUserIdFromAction`.
