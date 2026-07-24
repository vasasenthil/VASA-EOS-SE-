# Production Acceptance Pack

Generated: 2026-07-23T12:05:38.455Z

## Acceptance sections

| ID | Section | Status | Owner | Evidence |
| --- | --- | --- | --- | --- |
| inventory-ledger | Machine inventory ledger | pass | Governance Secretariat | 1374 artefacts inventoried; 473 routes; 104 APIs |
| scheme-e2e | Scheme create/edit/workflow regression | pass | Schemes Directorate | Create and edit routes present; Regression tests present; Durable store path exercised |
| cutover-gate | Production cutover gate | warn | Sovereign Ops | 17 blockers; 3 warnings; Route/RPC/RLS checks included |
| governance-hierarchy | Governance hierarchy | pass | Secretary Office | 7 tenancy tiers; 7 governance tiers; 3 AI Control Tower bodies; 9 role-scope mappings |
| acceptance-pack | Production acceptance pack | pass | CISO Office | Cutover report embedded; Inventory ledger embedded; Governance hierarchy embedded |

## Cutover gates

| Gate | Status | Severity | Detail |
| --- | --- | --- | --- |
| env:durable-persistence | fail | blocker | SUPABASE_SERVICE_ROLE_KEY unset — running in-memory (data is not durable). |
| env:authentication | fail | blocker | Supabase URL/anon key unset — real auth is not active. |
| env:trace-shipping | warn | warning | OTEL_EXPORTER_OTLP_ENDPOINT unset — traces are buffered locally, not shipped. |
| integration:pfms | fail | blocker | INTEGRATION_PFMS=live is required for production cutover. |
| integration:dbt | fail | blocker | INTEGRATION_DBT=live is required for production cutover. |
| integration:apaar | fail | blocker | INTEGRATION_APAAR=live is required for production cutover. |
| integration:digilocker | fail | blocker | INTEGRATION_DIGILOCKER=live is required for production cutover. |
| integration:language | fail | blocker | INTEGRATION_BHASHINI=live is required for production cutover. |
| worker:outbox_worker_enabled | fail | blocker | OUTBOX_WORKER_ENABLED=true is required so durable background processing is active. |
| worker:sla_monitor_worker_enabled | fail | blocker | SLA_MONITOR_WORKER_ENABLED=true is required so durable background processing is active. |
| worker-heartbeat:outbox | fail | blocker | OUTBOX_WORKER_HEARTBEAT_AT must be an ISO timestamp within the last 2 minutes. |
| worker-heartbeat:sla | fail | blocker | SLA_WORKER_HEARTBEAT_AT must be an ISO timestamp within the last 2 minutes. |
| worker-heartbeat:reconciliation | fail | blocker | RECONCILIATION_WORKER_HEARTBEAT_AT must be an ISO timestamp within the last 2 minutes. |
| runtime:database | fail | blocker | requireDb() failed; production must fail closed without a DB. |
| runtime:migrations | fail | blocker | MIGRATIONS_FULLY_APPLIED=true is required after deploy:migrate verification. |
| runtime:secret-manager | fail | blocker | VAULT_ADDR or KMS_KEY_URI is required for sovereign secret management. |
| runtime:audit-sink | fail | blocker | AUDIT_SINK_WRITABLE=true is required before cutover. |
| p0:route-auth-coverage | pass | blocker | Every protected API route is classified and guarded. |
| p0:memory-fallbacks | pass | blocker | Critical runtime memory adapters are guarded from production use. |
| p0:tenant-rls | fail | blocker | TENANT_RLS_VERIFIED=true and clean tenant RLS policy coverage are required before cutover. |
| scheme:routes | pass | blocker | Scheme lifecycle routes and APIs are present. |
| scheme:atomic-rpc | pass | blocker | Scheme outbox RPC files are present. |
| scheme:tenant-rls | pass | blocker | Scheme SQL/RLS coverage is present in migration artefacts. |
| governance:inventory-ledger | pass | blocker | Inventory ledger generator is present. |
| governance:acceptance-pack | pass | blocker | Acceptance pack and hierarchy evidence surfaces are present. |
| observability:otel_exporter_otlp_endpoint | warn | warning | OTEL_EXPORTER_OTLP_ENDPOINT is recommended before production cutover for incident response. |
| observability:sentry_dsn | warn | warning | SENTRY_DSN is recommended before production cutover for incident response. |

---

# Governance Inventory Ledger

Generated: 2026-07-23T12:05:38.455Z

## Summary

| Kind | Count |
| --- | ---: |
| api | 104 |
| document | 42 |
| migration | 100 |
| module | 208 |
| platform-module | 70 |
| policy | 24 |
| route | 473 |
| test | 353 |

## Readiness

| Built | Partial | Gated | Total |
| ---: | ---: | ---: | ---: |
| 1361 | 4 | 9 | 1374 |

## Critical inventory sample

| Kind | Path | Status | Owner | Data | Tenant scoped |
| --- | --- | --- | --- | --- | --- |
| api | `app/api/accessibility/channels/csv/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/accessibility/delivery/csv/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/accessibility/languages/csv/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/accessibility/rpwd/csv/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/admin/dead-letters/[id]/discard/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/admin/dead-letters/[id]/retry/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/admin/dead-letters/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/ai-agents/catalogue/csv/route.ts` | built | AI Control Tower | internal | yes |
| api | `app/api/architecture/csv/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/data-lineage/csv/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/data-standards/csv/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/export/reports/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/glossary/csv/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/glossary/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/governance/access-matrix/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/ai-guardrails/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/ai-register/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/ai-transparency/bias-audit/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/architecture-layers/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/assembly-briefing/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/assurance/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/background-verification/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/board-prep/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/brochure-coverage/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/budget-priorities/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/budget-sanction/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/cabinet-note/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/cadre-rationalisation/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/compliance/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/constituency-grievance/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/control-tower/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/coordination/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/cpgrams/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/director-capabilities/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/directorates/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/dpia/markdown/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/equity/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/exam-integrity/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/financial-transparency/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/gem-procurement/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/go-live/csv/route.ts` | gated | Governance Secretariat | confidential | yes |
| api | `app/api/governance/grants/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/green-school/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/grievance-disposal/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/hostel-allocation/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/launch-readiness/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/leakage/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/legal-cases/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/mental-health/csv/route.ts` | built | Governance Secretariat | sensitive | yes |
| api | `app/api/governance/minister-capabilities/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/module-catalogue/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/ndear-s/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/ndear/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/npst/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/operations-efficiency/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/oversight/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/parakh/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/pii-catalogue/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/principal-capabilities/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/public-communication/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/recognition-oversight/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/regulatory/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/resource-allocation/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/retention/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/rte-entitlements/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/safeguarding/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/scheme-launch/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/school-self-assessment/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/school-welfare-ops/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/secretary-capabilities/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/source-escrow/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/sovereignty/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/statutory-reports/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/teacher-assistant/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/tech-fabric/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/tenancy/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/threat-model/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/tier-coverage/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/traceability/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/governance/wcag/csv/route.ts` | built | Governance Secretariat | confidential | yes |
| api | `app/api/health/route.ts` | built | Module Owner | sensitive | yes |
| api | `app/api/i18n/messages/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/integrations/phase6/route.ts` | built | Integration Cell | internal | yes |
| api | `app/api/integrations/route.ts` | built | Integration Cell | internal | yes |
| api | `app/api/live/route.ts` | gated | Module Owner | internal | yes |
| api | `app/api/metrics/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/ml/models/[type]/promote/route.ts` | built | AI Control Tower | internal | yes |
| api | `app/api/ml/models/[type]/rollback/route.ts` | built | AI Control Tower | internal | yes |
| api | `app/api/ml/models/[type]/route.ts` | built | AI Control Tower | internal | yes |
| api | `app/api/ml/route.ts` | built | AI Control Tower | internal | yes |
| api | `app/api/notifications/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/ops/runbook/markdown/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/ops/sli/csv/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/production/cutover/route.ts` | built | Sovereign Ops | confidential | yes |
| api | `app/api/ready/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/ready/schema/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/sbom/route.ts` | built | Module Owner | internal | yes |
| api | `app/api/schemes/[id]/approve/route.ts` | built | Schemes Directorate | internal | yes |
| api | `app/api/schemes/[id]/propose/route.ts` | built | Schemes Directorate | internal | yes |
| api | `app/api/schemes/[id]/reject/route.ts` | built | Schemes Directorate | internal | yes |
| api | `app/api/schemes/[id]/route.ts` | built | Schemes Directorate | internal | yes |
| api | `app/api/schemes/route.ts` | built | Schemes Directorate | internal | yes |
| api | `app/api/seed/route.ts` | partial | Module Owner | internal | yes |
| api | `app/api/traces/route.ts` | built | Module Owner | internal | yes |
| migration | `scripts/001-create-policies-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/002-create-tracking-tables.sql` | built | Module Owner | internal | no |
| migration | `scripts/003-create-milestones-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/004-create-challenges-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/005-create-stakeholders-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/006-update-policies-file-storage.sql` | built | Module Owner | internal | no |
| migration | `scripts/007-add-policy-version-history.sql` | built | Module Owner | internal | no |
| migration | `scripts/008-create-governance-rbac-tables.sql` | built | Governance Secretariat | confidential | no |
| migration | `scripts/009-dynamic-stakeholder-attributes.sql` | built | Module Owner | internal | no |
| migration | `scripts/010-define-education-governance-tiers.sql` | built | Governance Secretariat | confidential | no |
| migration | `scripts/011-create-scheme-management-tables.sql` | built | Schemes Directorate | internal | yes |
| migration | `scripts/012-seed-scheme-data.sql` | built | Schemes Directorate | internal | yes |
| migration | `scripts/013-mvp-initial-schema.sql` | built | Module Owner | internal | no |
| migration | `scripts/014-enable-rls-and-policies.sql` | built | Module Owner | internal | yes |
| migration | `scripts/015-persist-interactive-modules.sql` | built | Module Owner | internal | no |
| migration | `scripts/016-seed-org-and-users.sql` | built | Module Owner | internal | no |
| migration | `scripts/017-seed-policies.sql` | built | Module Owner | internal | no |
| migration | `scripts/018-add-tenant-scoping.sql` | built | Module Owner | internal | yes |
| migration | `scripts/019-tenant-rls.sql` | built | Module Owner | internal | yes |
| migration | `scripts/020-agent-tool-requests.sql` | built | Module Owner | internal | no |
| migration | `scripts/021-create-workflow-flow-tables.sql` | built | Module Owner | internal | yes |
| migration | `scripts/022-create-forum-flow-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/023-create-operational-module-tables.sql` | built | Module Owner | internal | no |
| migration | `scripts/024-create-remaining-store-tables.sql` | built | AI Control Tower | internal | yes |
| migration | `scripts/025-create-scholarship-flow-table.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/026-create-health-flow-table.sql` | built | Module Owner | sensitive | no |
| migration | `scripts/027-create-transfer-flow-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/028-create-infra-flow-table.sql` | built | Sovereign Ops | internal | no |
| migration | `scripts/029-create-safety-flow-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/030-create-rti-flow-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/031-create-procurement-flow-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/032-create-budget-flow-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/033-create-tc-flow-table.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/034-create-class-attendance-table.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/035-create-fee-collection-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/036-create-teacher-presence-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/037-create-enrolment-snapshots-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/038-create-dropout-risk-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/039-create-school-compliance-table.sql` | built | Module Owner | internal | yes |
| migration | `scripts/040-create-syllabus-progress-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/041-create-assessment-schedule-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/042-add-tenant-to-health-flows.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/043-add-tenant-to-safety-flows.sql` | built | Module Owner | internal | yes |
| migration | `scripts/044-add-tenant-to-scholarship-flows.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/045-add-tenant-to-admission-flows.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/046-create-courses-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/047-create-grades-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/048-create-assignments-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/049-create-report-cards-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/050-create-students-table.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/051-create-attendance-entries-table.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/052-create-timetable-entries-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/053-create-lesson-plans-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/054-create-holidays-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/055-create-worktime-profiles-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/056-create-student-fees-table.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/057-create-library-loans-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/058-create-transport-routes-table.sql` | built | Module Owner | internal | yes |
| migration | `scripts/059-create-asset-register-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/060-create-staff-master-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/061-create-ews-cases-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/062-create-diagnostics-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/063-create-learning-pathways-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/064-create-policy-proposals-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/065-create-eligibility-cases-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/066-create-kb-articles-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/067-create-agent-tasks-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/068-create-school-kpis-table.sql` | built | Module Owner | internal | yes |
| migration | `scripts/069-create-federation-logs-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/070-create-health-records-table.sql` | built | Module Owner | sensitive | no |
| migration | `scripts/071-create-cover-arrangements-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/072-create-scheme-fund-ledger-table.sql` | built | Schemes Directorate | internal | yes |
| migration | `scripts/073-create-verifiable-credentials-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/074-smc-attributable-ballots.sql` | built | Module Owner | internal | no |
| migration | `scripts/075-create-iot-readings-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/076-create-outcome-records-table.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/077-rls-agent-tool-requests.sql` | built | Module Owner | internal | yes |
| migration | `scripts/078-backfill-tenant-scoping.sql` | built | Module Owner | internal | yes |
| migration | `scripts/079-enable-rls-all-tables.sql` | built | Module Owner | internal | yes |
| migration | `scripts/081-create-calendar-entries-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/082-create-exam-sheets-tables.sql` | built | Module Owner | internal | no |
| migration | `scripts/083-create-leave-requests-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/084-create-audit-chain-table.sql` | built | AI Control Tower | confidential | no |
| migration | `scripts/085-create-grievance-cases-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/086-create-admission-applications-table.sql` | built | Module Owner | sensitive | no |
| migration | `scripts/087-create-attendance-records-table.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/088-create-scholarship-disbursements-table.sql` | built | Module Owner | sensitive | yes |
| migration | `scripts/089-create-cpd-records-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/090-create-rbsk-screenings-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/091-create-timetable-slots-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/092-create-library-loans-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/093-create-transport-tables.sql` | built | Module Owner | internal | no |
| migration | `scripts/094-create-mdm-tables.sql` | built | Module Owner | internal | no |
| migration | `scripts/095-create-infra-tables.sql` | built | Sovereign Ops | internal | no |
| migration | `scripts/096-create-fee-tables.sql` | built | Module Owner | internal | no |
| migration | `scripts/097-create-immunisation-table.sql` | built | Module Owner | internal | no |
| migration | `scripts/098-create-ptm-tables.sql` | built | Module Owner | internal | no |
| migration | `scripts/099-create-entitlement-tables.sql` | built | Module Owner | internal | no |
| migration | `scripts/100-create-establishment-tables.sql` | built | Module Owner | internal | no |
| migration | `scripts/101-enforce-tenant-rls-policies.sql` | built | Module Owner | internal | yes |
| module | `lib/academic` | built | Module Owner | internal | no |
| module | `lib/access` | built | Module Owner | internal | no |
| module | `lib/accessibility` | built | Module Owner | internal | no |
| module | `lib/adaptive` | built | Module Owner | internal | no |
| module | `lib/admissions` | built | Module Owner | sensitive | no |
| module | `lib/admissionsflow` | built | Module Owner | sensitive | no |
| module | `lib/adoption` | built | Module Owner | internal | no |
| module | `lib/agentconsole` | built | Module Owner | sensitive | yes |
| module | `lib/agentflow` | built | Module Owner | internal | no |
| module | `lib/agents` | built | Module Owner | internal | no |
| module | `lib/ai` | built | AI Control Tower | internal | no |
| module | `lib/alumni` | built | Module Owner | internal | no |
| module | `lib/api-gateway` | built | Module Owner | internal | no |
| module | `lib/architecture` | built | Module Owner | internal | no |
| module | `lib/assembly` | built | Module Owner | internal | no |
| module | `lib/assessment-schedule` | built | Module Owner | internal | no |
| module | `lib/assetmgmt` | built | Module Owner | internal | no |
| module | `lib/assets` | built | Module Owner | internal | no |
| module | `lib/assignments` | built | Module Owner | internal | no |
| module | `lib/assurance` | built | Module Owner | internal | no |
| module | `lib/attendance` | built | Module Owner | sensitive | yes |
| module | `lib/attendance-register` | built | Module Owner | sensitive | yes |
| module | `lib/audit` | built | CISO Office | confidential | no |
| module | `lib/auth` | built | CISO Office | confidential | no |
| module | `lib/bagless` | built | Module Owner | internal | no |
| module | `lib/banking` | built | Module Owner | internal | no |
| module | `lib/budgetflow` | built | Module Owner | internal | no |
| module | `lib/bus-tracking` | built | Module Owner | internal | no |
| module | `lib/career` | built | Module Owner | internal | no |
| module | `lib/cctv` | built | Module Owner | internal | no |
| module | `lib/certificates` | built | Module Owner | internal | no |
| module | `lib/circulation` | built | Module Owner | internal | no |
| module | `lib/cocurricular` | built | Module Owner | internal | no |
| module | `lib/command` | built | Module Owner | internal | no |
| module | `lib/comms` | built | Module Owner | internal | no |
| module | `lib/competitions` | built | Module Owner | internal | no |
| module | `lib/compliance` | built | Module Owner | internal | no |
| module | `lib/consent` | built | Module Owner | sensitive | no |
| module | `lib/cooks` | built | Module Owner | internal | no |
| module | `lib/council` | built | Module Owner | internal | no |
| module | `lib/courses` | built | Module Owner | internal | no |
| module | `lib/coverflow` | built | Module Owner | internal | no |
| module | `lib/cpd` | built | Module Owner | internal | no |
| module | `lib/credentials` | built | Module Owner | internal | no |
| module | `lib/cwsn` | built | Module Owner | sensitive | no |
| module | `lib/dashboards` | built | Module Owner | internal | no |

