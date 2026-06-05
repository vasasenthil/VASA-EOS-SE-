# VASA-EOS(SE) — Traceability Matrix

Maps the source dossier's sections / flagships / India-Stack obligations to the
implementing module(s), the route that surfaces each capability, and the tests that
cover it. Dossier references are drawn from each module's header. See
[MODULES.md](MODULES.md) for module detail and [SECURITY.md](SECURITY.md) for the
guardrails.

> Tests legend: files live in `tests/`. Modules without a row in the Tests column are
> presentational/data modules surfaced through a route and validated by
> `next build` + the `/health` self-tests rather than unit tests.

## Identity, data & security foundation

| Capability | Dossier ref | Module(s) | Route | Tests |
| --- | --- | --- | --- | --- |
| APAAR-centric domain model | APAAR / UDISE+ | `domain` | — | (via `portal-data`, `sis`) |
| Student Information System (360°) | Sec 25 / lifecycle | `sis` | `/sis` | `portal-data.test` |
| Sovereign multi-tenancy (7 tiers) | Part XIII | `tenancy` | `/tenancy` | — |
| 5-model access PDP | Div IV | `access` | `/security`, `/governance/roles` | `access.test` |
| Tamper-evident audit ledger | — | `audit` | `/admin/audit-log`, `/health` | `audit.test`, `store-layer.test` |
| DPDP consent ledger | DPDP / InDEA 2.0 | `consent` `[store]` | `/consent` | `store-layer.test` |
| Zero-trust posture + headers | Sec 4C | `security` | `/security` | — |
| Polyglot data architecture | Sec 2A / 4B | `data` | `/data-platform` | — |

## India Stack / NDEAR-S integrations

| Capability | Dossier ref | Module(s) | Route | Tests |
| --- | --- | --- | --- | --- |
| Integration ports + registry | NDEAR-S / India Stack | `integrations` (`types`/`config`/`mock`/`registry`) | `/integrations` | `integration-status.test` |
| Fail-soft HTTP transport | — | `integrations/http` | — | `http.test` |
| APAAR identity (live) | APAAR | `integrations/live/apaar` | `/apaar` | `live-adapters*.test` |
| Aadhaar auth (verify-only) | UIDAI | `integrations/live/aadhaar` | `/aadhaar` | `live-adapters*.test` |
| DigiLocker credential vault | MeitY | `integrations/live/digilocker` | (exam push) | `live-adapters*.test` |
| DBT / APBS disbursement | NPCI | `integrations/live/dbt` | `/dbt` | `live-adapters*.test` |
| UDISE+ school registry | UDISE+ | `integrations/live/udise` | `/school-registry` | `live-adapters*.test` |
| DIKSHA content discovery | DIKSHA | `integrations/live/diksha` | `/content` | `live-adapters*.test` |
| Bhashini language (translate/TTS) | Bhashini | `integrations/live/bhashini` | `/multilingual` | `live-adapters*.test` |
| 8 AI agents (LLM) | Div III | `agents`, `integrations/live/agents` | `/ai-agents` | `live-adapters*.test` |

## Learning / AI core

| Capability | Dossier ref | Module(s) | Route | Tests |
| --- | --- | --- | --- | --- |
| Adaptive learning (BKT + ZPD) | Flagship 07 / Sec 16 | `adaptive` | `/adaptive-learning` | `adaptive.test` |
| Curriculum knowledge graph | Flagship 07 / Sec 16 | `knowledge-graph` | `/knowledge-graph` | `knowledge-graph.test` |
| OCR / OMR scoring | Sec 56 / Flagship 05 | `omr` | `/omr` | `omr.test` |
| Verifiable credentials (NFT/SBT) | Flagship 11 / Sec 24 | `credentials` `[store]` | `/credentials` | `credentials.test`, `store-layer.test` |
| Exam security pipeline | Flagship 05 | `exams` | `/exams` | (via `live-adapters` DigiLocker) |

## Governance, schemes & compliance

| Capability | Dossier ref | Module(s) | Route | Tests |
| --- | --- | --- | --- | --- |
| Governance framework (RACI/forums) | Part VI / XXII | `governance-framework` | `/governance/framework` | — |
| School recognition (TN 1973) | Sec 52 | `recognition` `[store]` | `/recognition` | `store-layer.test` |
| Quality & inspection index | Sec 46 | `quality` | `/quality` | `portal-data.test` (compliance) |
| DAO-style SMC | Part XIV / Sec 40 | `smc` `[store]` | `/smc` | `store-layer.test` |
| Grievance redressal | Sec 48 | `grievance` `[store]` | `/grievance` | `store-layer.test` |

## Welfare, facilities & operations

| Capability | Dossier ref | Module(s) | Route | Tests |
| --- | --- | --- | --- | --- |
| PM POSHAN / CMBS meals | Flagship 02 | `meals` | `/pm-poshan` | — |
| School finance + statutory reports | Sec 44 | `finance` | `/finance` | — |
| Inventory & procurement | Sec 43 | `procurement` | `/procurement` | — |
| Infrastructure + RTE/RPwD gaps | Sec 50 / PM SHRI | `infrastructure` | `/infrastructure` | `portal-data.test` |
| Emergency / disaster (TNSDMA) | Sec 51 / TNSDMA | `emergency` | `/emergency` | — |
| Hostel management | Sec 36 | `hostel` | `/hostel` | — |
| Library | Sec 37 / DPSE | `library` | `/library` | — |
| Transport | Sec 35 | `transport` | `/transport` | — |
| School health (RBSK) | Sec 33 | `health` | `/rbsk` | — |
| Co-curricular & sports | Sec 50 / 51 | `cocurricular` | `/co-curricular` | — |
| Green-school / ESG | Sec 49 / Part XIX | `esg` | `/green-school` | — |

## Access, language & platform UX

| Capability | Dossier ref | Module(s) | Route | Tests |
| --- | --- | --- | --- | --- |
| 21-RPwD accessibility | RPwD | `accessibility` | `/accessibility` | — |
| Multilingual (ta/en/hi) + IVR seam | Bhashini | `i18n`, `integrations/live/bhashini` | `/multilingual` | `live-adapters*.test` |
| Stakeholder-portal KPI aggregation | — | `portal-data` | 9 portals | `portal-data.test` |
| System self-test & health | — | `selftest` | `/health` | (drives all of the above) |

## Cross-cutting verification

| Concern | Mechanism |
| --- | --- |
| Static correctness | `tsc --noEmit`, `next lint`, `next build` (CI matrix, Node 20.x + 22.x) |
| Behavioural invariants | 95 unit tests; enforced coverage (lines 95% / branches 80% / functions 88%) |
| Live guardrail proof | `/health` self-tests (PDP deny-wins/fail-closed, audit chain, assessment, KG, credentials) |
| Config readiness | `/integrations` (per-port mode + required env presence) |
