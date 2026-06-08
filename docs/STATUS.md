# VASA-EOS(SE) — Completion & Pending Register

A single, omission-free consolidation of everything built for the platform and
everything still pending, mapped to the source **VASA_EOS_SE_TN_Unified_Master_Document (5)**.
This merges the full delivery timeline (every increment/commit) with an honest
completed-vs-pending status per master-document domain.

**Legend:** ✅ Done · 🟡 Partial (functional slice; depth/real-data pending) · ⏳ Pending.

**Scope (current):** Tamil Nadu State only. Roadmap: more Indian states one-by-one,
then National (Central MoE) tier later. See `CLAUDE.md`.

---

## Part 0 — Recent register (governance, scoping & traceability stream)

| Capability | Status | Evidence |
| --- | --- | --- |
| Abbreviations & glossary | ✅ | `lib/glossary` + `/glossary` + JSON/CSV API; `<Abbr>` tooltip |
| Governance Oversight Command Centre | ✅ | `lib/governance/oversight` + `/governance/oversight` (live rollup of all 7 flows) + CSV |
| Forum/Meeting (RACI) workflow (7th flow) | ✅ | `FORUM_RESOLUTION` + `lib/forumflow` + `/governance/forums` (Secretary→Director quorum→Minister) |
| NEP implementation analytics | ✅ | `lib/tracking/analytics` + `/tracking/analytics` (RAG, thrust-area/tier rollups, at-risk) |
| Per-role data scoping (ReBAC) | ✅ (engine) / 🟡 (rollout) | `lib/access/scope` + `scope-server` + `/governance/scope`; **wired on 24 modules**: safety, discipline, cwsn, lost-found, cooks, rte, rti, oosc, water, cctv, drills, competitions, excursions, tc, visitors, circulation, alumni, distribution, certificates, stock, sciencefair, guest-lectures, council, assembly. Remaining store-backed modules pending |
| Requirements traceability matrix | ✅ | `lib/traceability` + `/governance/traceability` + CSV; **26 user stories × 15 roles**, self-verifying (every referenced test asserted to exist) |
| Tenant scoping migration | ✅ | `scripts/018-add-tenant-scoping.sql` (tenant_id + index on 8 tables) |
| Tests / coverage | ✅ | **525 tests**, ~97.1% lines / ~84.9% branches / ~91.3% functions |

**Posture caveat (read first).** The platform is built **mock-by-default on seeded
data**: it runs and demos end-to-end with zero credentials. Every external dependency
has a typed port with a working mock **and** a real HTTP-backed live adapter selected
by an `INTEGRATION_*` flag. "Done" below means *implemented, building green, and
tested where applicable* — not "connected to a live government system" (that needs
credentials/MoUs) and not "full production feature depth in every module."

---

## Part A — Delivery timeline (from the beginning, nothing omitted)

| Phase | What landed | Status |
| --- | --- | --- |
| **P0. Inheritance + CI hardening** | Existing v0 app stabilised: React Server Components CVE fixes; Next 15 `params/searchParams` → Promise migration; ~190 → 0 `tsc` errors (Zod v3 pin, react-day-picker v8, TS 5.9.3 / @types/react 19.2, useActionState wrappers); replaced npm/gulp CI with a green **pnpm install → lint → typecheck → build** gate. | ✅ |
| **P1. Foundation + breadth** | Integration **ports + registry + mocks** (8 deps); APAAR-centric **domain model** (+21 RPwD); **5-model access PDP**; **13 stakeholder portals** (9 net-new). | ✅ |
| **Increment 2** | AI-agents console; APAAR identity flows; DBT scheme engine. | 🟡 |
| **Increment 3** | Multilingual/Tamil + IVR seam; DPDP consent + immutable audit; 21-RPwD accessibility model. | 🟡 |
| **Increment 4** | PM POSHAN/CMBS operations; examination security. | 🟡 |
| **i18n upgrade** | Multilingual moved to **react-i18next** (provider + hook + switcher). | ✅ |
| **Increment 5** | 7-tier multi-tenancy; zero-trust posture; polyglot data architecture; deepened SIS. | 🟡 |
| **Increment 6** | Welfare/operations leaf modules (hostel, library, transport, RBSK, grievance) + governance framework. | 🟡 |
| **Increment 7** | Finance, procurement, SMC-DAO, quality/inspection, ESG, co-curricular. | 🟡 |
| **Increment 8** | Learning/AI core: adaptive learning (BKT+ZPD), OCR/OMR scoring, knowledge graph, verifiable credentials. | 🟡 |
| **Increment 9** | Infrastructure & assets, emergency/disaster (TNSDMA), TN-1973 recognition. | 🟡 |
| **Persistence** | Interactive modules persist to **Supabase** with in-memory fallback (`getDb` seam, migration `015`, RLS). | ✅ |
| **Portal wiring** | Stakeholder-portal KPIs derived from live shared datasets (`portal-data`) incl. live grievance/recognition counts. | ✅ |
| **Live integrations ×8** | Real HTTP-backed adapters flipped on the seam: DIKSHA, UDISE+, AI agents (LLM), Bhashini, DigiLocker, DBT/APBS, Aadhaar, APAAR. | ✅ (seam) / 🟡 (needs creds) |
| **Observability** | `/integrations` status page, `/health` self-test board, `GET /api/health`, `GET /api/integrations`. | ✅ |
| **Testing & CI** | Node-22 built-in test runner (no jest/vitest); **116 tests**; enforced coverage (95/80/88); CI on `claude/**`; PR coverage comment. | ✅ |
| **Accessibility & nav** | App-wide a11y preferences (provider + no-FOUC boot + CSS); header quick-toggle; **⌘K command palette**; skip link; focus-visible pass; breadcrumbs; route announcer; `?` shortcuts help. | ✅ |
| **Resilience** | App-level `error` / `global-error` / `not-found` / `loading` boundaries. | ✅ |
| **Documentation** | README + docs index + ARCHITECTURE, MODULES, SECURITY, OPERATIONS, CONTRIBUTING, TRACEABILITY, ADR, EVALUATION, REQUIREMENTS, CREDENTIALS (+ this register). | ✅ |
| **Access enforcement** | Concrete platform policy (`PLATFORM_ACCESS`) + `requireAccess()` guard threaded through high-stakes actions (DBT, recognition, SMC, consent, exams, PM POSHAN, grievance, credentials); `/governance/access` explorer; user→subject resolver. | ✅ |
| **Government structure & directory** | TN org hierarchy (ministry · 7 directorates · authorities · councils · committees · offices · school) + a user for every role bound to the 5-model IAM; demo credentials seed + `docs/CREDENTIALS.md`. | ✅ |
| **Full-roles login** | The "Sign in as" selector + routing derive from `config/portals` — all 17 roles selectable and routed to their portal home. | ✅ |
| **Interactive functional suite** | ~40 data-enterable school-operations modules so the government can feed its own data and exercise every feature: attendance · staff attendance · fees · timetable+substitution · lesson planning · HPC (scholastic + co-scholastic) · homework · certificates · CPD · postings · communications · notices · PTM · academic calendar · library circulation · career guidance · RBSK screening · MDM register · disciplinary log · inventory · inspections · asset register · maintenance · WASH audit · hostel allocation · transport assignment · bus tracking · scholarships · admissions · pre-primary intake · co-curricular registration · student promotion · visitor management · parent feedback · exam seating · result publication · question bank · teacher profile · alumni registry. | 🟡 (functional slices on seed data) |

Inventory: **~80 `lib/` modules · ~100 route groups · 62 test files (262 tests) · 16 SQL migrations · 11 doc files**.

---

## Part B — Completion register by master-document domain

### Identity, data & security foundation
| Capability | Master ref | Status | Built | Pending |
| --- | --- | --- | --- | --- |
| APAAR domain model | APAAR/UDISE+ | ✅ | ER entities, 21 RPwD, types | Full CRUD + persistence beyond seeds |
| Student Information System | Sec 25 | 🟡 | 360° roster, summaries | Real enrolment/transfer lifecycle, DB-backed |
| Multi-tenancy (7-tier) | Part XIII | 🟡 | Tier model, ancestor access | Physical/row isolation enforcement at data layer |
| 5-model access PDP | Div IV | ✅ | RBAC·ReBAC·ABAC·PBAC·CABAC, deny-wins, tested; **concrete platform policy** (`PLATFORM_ACCESS`) + `can`/`requireAccess` guard + **Access Explorer** (`/governance/access`), tested | Threading the guard into every route/action (needs user→subject resolution) |
| Audit ledger | — | ✅ | Hash chain, verify, persisted, tested | HSM signing / real ledger anchor |
| DPDP consent | DPDP/InDEA | ✅ | Purpose-bound, withdrawable, audited, persisted, tested | Consent enforcement gating every PII read |
| Zero-trust posture | Sec 4C | 🟡 | Security headers (middleware), documented 7 layers | Real WAF/SIEM/mTLS/Vault (infra) |
| Polyglot data | Sec 2A/4B | 🟡 | Reference architecture | Actual multi-store deployment |

### India Stack / NDEAR-S integrations
| Capability | Master ref | Status | Built | Pending |
| --- | --- | --- | --- | --- |
| Adapter seam (all 8 ports) | NDEAR-S | ✅ | Ports, registry, mocks, fail-soft `httpJson`, status, tests | — |
| APAAR · Aadhaar · DigiLocker · DBT · UDISE+ · DIKSHA · Bhashini · Agents | India Stack / Div III | 🟡 | Real live adapters, flag-gated, tested (mocked fetch) | **Credentials / MoUs / sandboxes**; DIKSHA is the only freely-callable one |
| Bhashini ASR (speech-to-text) | Bhashini | ⏳ | Translate + TTS live | Live ASR (port carries audioRef, not raw bytes) |

### Learning / AI core
| Capability | Master ref | Status | Built | Pending |
| --- | --- | --- | --- | --- |
| Adaptive learning | Flagship 07 / Sec 16 | 🟡 | BKT + ZPD engine + live session, tested | Real item bank at scale, per-learner persistence |
| Knowledge graph | Flagship 07 / Sec 16 | 🟡 | Prereq DAG, paths, readiness, tested | Curriculum-scale graph + graph store |
| OCR / OMR | Sec 56 / Flagship 05 | 🟡 | OMR scoring + sheet, tested | On-device vision + Tamil/English ICR |
| Verifiable credentials | Flagship 11 / Sec 24 | 🟡 | Soulbound, audit-anchored, verify, persisted, tested | Real chain/registry mint |
| 8 AI agents | Div III | 🟡 | Orchestration + confidence gating + HITL; live LLM adapter | Real LLM keys + per-agent tools/MCP |
| Exam security | Flagship 05 | 🟡 | Pipeline + DigiLocker result push | Full secure-exam lifecycle |

### Governance, schemes & compliance
| Capability | Master ref | Status | Built | Pending |
| --- | --- | --- | --- | --- |
| Governance framework | Part VI/XXII | 🟡 | Tiers, RACI, forums | Workflow automation |
| NEP/SEP tracking, policies, schemes | — | ✅ (inherited) | Tracking dashboards, policy/scheme CRUD (Supabase) | Deeper analytics |
| School recognition (TN 1973) | Sec 52 | 🟡 | Staged workflow, persisted, tested | DigiLocker/UDISE federation, document AI |
| Quality & inspection | Sec 46 | 🟡 | Index + compliance traffic-light | AI-prioritised inspection engine |
| SMC (DAO) | Part XIV / Sec 40 | 🟡 | Quorum voting, persisted, tested | On-chain/real member identity |
| Grievance redressal | Sec 48 | 🟡 | Multi-tier escalation, persisted, tested | CPGRAMS federation, SLA automation |

### Welfare, facilities & operations
| Capability | Master ref | Status | Built | Pending |
| --- | --- | --- | --- | --- |
| PM POSHAN / CMBS | Flagship 02 | 🟡 | Menu, nutrition, procurement, leakage reconcile | IoT cold-chain, real attendance feeds |
| Finance · Procurement | Sec 44 / 43 | 🟡 | Budgets, statutory reports, inventory, indents | GeM/PFMS integration, approvals |
| Infrastructure & assets | Sec 50 / PM SHRI | 🟡 | Inventory + RTE/RPwD gap analysis, tested | Works pipeline + GIS |
| Emergency / disaster | Sec 51 / TNSDMA | 🟡 | Incidents, drills, safety scores | SACHET alerting federation |
| Hostel · Library · Transport · RBSK · Co-curricular · ESG | Sec 33/35/36/37/49/50 | 🟡 | Functional modules on seed data | Persistence + real ops integrations |

### Access, language & platform UX
| Capability | Master ref | Status | Built | Pending |
| --- | --- | --- | --- | --- |
| 21-RPwD accessibility | RPwD / Sec 6B | ✅ | App-wide prefs (contrast/text/motion), boot script, skip link, focus rings, quick-toggle, tested | Runtime Braille/ISL/AAC/switch/eye-tracking, screen-reader QA, WCAG audit |
| Multilingual + IVR | Bhashini | 🟡 | react-i18next (ta/en/hi), translate/TTS via Bhashini | 22-language catalogues, telephony IVR |
| Stakeholder portals (13) | Part on portals | 🟡 | Routed, role-nav, live-derived KPIs | Per-role data scoping + full feature sets |
| Command palette · breadcrumbs · announcer · shortcuts | — | ✅ | All shipped + tested helpers | — |

---

## Part C — Cross-cutting status

- **Build/typecheck/lint:** ✅ green (`tsc` 0, `next lint` clean, `next build` all routes).
- **Tests:** ✅ 262 tests (pure logic, access PDP + platform policy, HTTP transport, all 8 live adapters, audit chain, persisted store path via in-memory DB stub, a11y/nav/command/health helpers, and every functional module's pure logic).
- **Coverage:** ✅ enforced — ~98% lines / ~88% branches / ~94% functions.
- **CI:** ✅ lint/typecheck/build matrix (Node 20/22) + Node-22 unit-test job + PR coverage comment, on `main` and `claude/**`.
- **Deployment:** ✅ Vercel preview Ready.
- **Docs:** ✅ full set (see [docs/](README.md)).

---

## Part D — Consolidated pending / roadmap

1. **Go live on real providers** — supply credentials/MoUs/sandboxes per port and flip `INTEGRATION_*=live` (matrix in [OPERATIONS.md](OPERATIONS.md)). Add live Bhashini ASR (raw-audio pipeline).
2. **Real data, not seeds** — provision Supabase, run migrations `001`–`015`, and wire the remaining modules (SIS, welfare, facilities, finance, etc.) from seed datasets to persisted records with full CRUD.
3. **Enforce the guardrails everywhere** — the concrete platform policy (`PLATFORM_ACCESS`) and the `requireAccess()` guard now exist and are tested (with the `/governance/access` explorer to verify decisions); what remains is resolving the current user into a `Subject` (roles/attributes) and threading `requireAccess` + consent gates through every route/server action.
4. **Feature depth per module** — each module is a working slice; the master document implies deeper workflows (approvals, automation, analytics) within each.
5. **Specialist runtime capabilities** — on-device OCR/ICR vision, runtime Braille/ISL/AAC/switch/eye-tracking, telephony IVR, curriculum-scale knowledge graph + graph store, real NFT/SBT chain, HSM-signed audit, multi-store polyglot deployment, zero-trust infra (WAF/SIEM/mTLS/Vault).
6. **Original blueprint deliverables** — the page-by-page master-document analysis, gap analysis, and full 72-section/362-module traceability matrix were delivered separately (**PR #3**, branch `claude/zen-lamport-IOrhd`); they are not part of this `claude/platform-foundation` branch. A merge/rebase decision is pending.
7. **Quality bar** — screen-reader/WCAG 2.2 AAA audit, load/perf testing, security review (SAST/DAST), and end-to-end tests beyond the current unit suite.

---

## Part E — Branch & PR state

- **This branch:** `claude/platform-foundation` → **PR #5** (base `claude/ci-app-hardening`, the #4 chain; merge order: #4 → #5 toward `main`).
- **Related:** PR #3 (`claude/zen-lamport-IOrhd`) holds the master-document blueprint/gap/traceability deliverables; PR #4 (`claude/ci-app-hardening`) holds the CI/app-hardening base.
- CI is green on PR #5; subscription active for autofix.
