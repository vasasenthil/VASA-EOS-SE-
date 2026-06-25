# L6 · Platform Services

**CC-SPEC-001 layer · status: `core-services-built`**

Identity · Workflow · Notification · Search · Content · Audit · Config · Feature flags · Localisation.

| Component | Status | Verification |
|---|---|---|
| `workflow` — multi-tier approval engine (G1–G7); role + scope gated; PORT of the reference workflow | ✅ built + tested | `go test` |
| `i18n` — code-first localisation + TMS coverage; Tamil first-class, English fallback, `{var}` interpolation | ✅ built + tested | `go test` |
| `notify` — notification dispatch: i18n-rendered, channel-routed (inbox/sms/email), idempotent, audited | ✅ built + tested | `go test` |
| Camunda 8 · OpenSearch · feature-flag service (managed substrate) | ⛔ substrate-gated | B-010/B-013 |

> All three are wired into `platform/integration`: admission outcomes dispatch a **localised Tamil** inbox
> notification; the **G3→G5→G7 scheme-sanction** flow runs on the workflow engine. The heavier managed
> services (Camunda/OpenSearch) are substrate-gated; the workflow/i18n/notify logic is built and tested.
> `platformd` surfaces the inbox at `GET /notifications`.
