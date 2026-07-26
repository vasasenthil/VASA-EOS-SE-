# Scholarship Reconciliation Pilot Plan

This plan converts the scholarship reconciliation discovery wedge into an implementation-ready pilot. It is intentionally narrow: prove a high-trust, end-to-end scholarship reconciliation vertical slice before expanding to the rest of VASA-EOS-SE-TN.

## Pilot Goal

Demonstrate that VASA-EOS-SE-TN can reduce scholarship payment delays, failed-transaction ambiguity, and manual reconciliation work for one district by connecting eligibility verification, payment initiation/status, exception handling, beneficiary notifications, and operator reporting into one auditable workflow.

## Integration Points

| Integration | Pilot responsibility | Evidence required before go-live |
| --- | --- | --- |
| PFMS | Payment initiation, status check, and daily reconciliation against settlement/status files. | Sandbox or production API access, field mapping, retry/error-code matrix, reconciliation file sample. |
| DBT/APBS | Payment disbursement status and settlement callback handling. | Callback contract, settlement status codes, beneficiary/account validation evidence. |
| APAAR | Student ID verification before payment release. | Lookup/provisioning access, duplicate-resolution rules, consent and PII handling approval. |
| DigiLocker | Scholarship certificate issuance after successful disbursement or approval milestone. | Issuer credentials, credential template, callback/token refresh flow. |
| SMS Gateway | Beneficiary/parent notifications for submitted, approved, failed, resolved, and disbursed states. | Approved templates, sender ID, delivery report feed, language requirements. |
| Email Service | Operator notifications, exception digests, and daily/weekly reconciliation reports. | SMTP/API credentials, distribution lists, report templates, archival requirement. |

## Pilot Scope

| Dimension | Target scope | Notes to validate during discovery |
| --- | --- | --- |
| Geography | One district, for example Chennai. | Pick a district with a named DEO owner and accessible PFMS/DBT/APBS reports. |
| Blocks | 2–3 blocks. | Include one high-volume block and one operationally difficult block. |
| Schools | 20–30 schools. | Include government, aided, urban, and edge-case schools if feasible. |
| Students | 1,000–2,000 students. | Large enough to expose failures; small enough for manual safety net. |
| Schemes | 2–3 scholarship schemes. | Choose schemes with clear eligibility and enough transaction volume. |
| Duration | 8–12 weeks. | Include onboarding, data cleanup, live run, reconciliation, and post-pilot review. |

## Success Criteria

| Outcome | Target | Measurement source |
| --- | ---: | --- |
| Payment cycle-time reduction | 50–80% faster from verified application to confirmed disbursement. | Baseline workflow samples vs pilot telemetry. |
| Error-rate reduction | 90% fewer preventable data/validation/payment errors. | Exception queue root-cause codes and PFMS/DBT/APBS statuses. |
| Reconciliation-time reduction | 80% less manual reconciliation effort. | Operator time logs and reconciliation report generation time. |
| User adoption | 95%+ of pilot operators use the workflow for in-scope cases. | Login/action telemetry and weekly operator check-ins. |
| Exception resolution SLA | Critical exceptions resolved in under 48 hours. | Exception queue SLA timestamps. |
| User satisfaction | 80%+ satisfaction from operators and beneficiary-facing users. | End-of-pilot survey and interview synthesis. |

## Risks and Mitigations

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| PFMS integration delays | Without PFMS status/reconciliation access, the pilot cannot prove end-to-end payment visibility. | Start integration approval early, request sample files immediately, and keep a controlled manual import path for pilot reconciliation evidence. |
| Low user adoption | Operators may continue using spreadsheets/WhatsApp if the system adds work. | Train users before launch, phase rollout by block, run weekly feedback loops, and remove duplicate manual reporting where approved. |
| Data quality issues | Bad beneficiary, bank, identity, or school data will look like platform failure. | Run data validation and cleanup before pilot, track root causes, and publish a pre-live data-quality report. |
| Technical bugs | Payment workflows are high-trust; bugs can delay benefits or reduce confidence. | Use extensive automated tests, dry-run rehearsals, rapid incident response, and a controlled manual recovery path during pilot. |


## Module 10x Plan

The module-by-module 10x targets for application, verification, workflow, integration, reconciliation, dashboards, notifications, audit, and reporting are maintained in [`module-10x-value-plan.md`](module-10x-value-plan.md). Use that plan to decide which module capabilities are in-scope for the pilot and which should be deferred.

## Pilot Readiness Checklist

- Named DEO or state-level owner approves pilot scope.
- PFMS/DBT/APBS data access path is approved or a controlled settlement-file import path is available.
- APAAR, DigiLocker, SMS, and email credential paths are known and tracked.
- Baseline metrics are captured before launch.
- Manual fallback process is documented for operational continuity, not as a production code fallback.
- Daily reconciliation report owner and escalation owner are named.
- Post-pilot review date is scheduled before launch.
