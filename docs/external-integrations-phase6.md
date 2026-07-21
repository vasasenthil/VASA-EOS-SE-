# Phase 6 External Integrations

Phase 6 wires the five major ecosystem integrations through typed ports and production-safe orchestration helpers:

1. **PFMS + DBT/APBS** — `automateScholarshipDisbursement` verifies PFMS sanction/release state, checks scheme expenditure, then submits an idempotent DBT/APBS disbursement reference.
2. **APAAR + EMIS** — `provisionApaarAndSyncEmis` performs duplicate screening, provisions APAAR only with consent, then pushes enrolment to EMIS.
3. **DigiLocker** — `issueDigiLockerCredential` issues HTTPS-backed credential payloads into the configured credential vault.
4. **Bhashini** — `translateForBeneficiary` translates beneficiary-facing text and can produce TTS audio when requested.
5. **NDEAR validation** — `validateNdearReadiness` summarizes the NDEAR register and lists live-ready ports for deployment review.

## Runtime configuration

Each adapter remains mock by default for safe local development. Set the relevant flag to `live` and provide gateway credentials to activate production traffic:

- `INTEGRATION_PFMS=live`, `PFMS_BASE_URL`, `PFMS_API_KEY`
- `INTEGRATION_DBT=live`, `DBT_BASE_URL`, `DBT_API_KEY`
- `INTEGRATION_APAAR=live`, `APAAR_BASE_URL`, `APAAR_API_KEY`
- `INTEGRATION_DIGILOCKER=live`, `DIGILOCKER_BASE_URL`, `DIGILOCKER_API_KEY`
- `INTEGRATION_BHASHINI=live`, `BHASHINI_INFERENCE_URL`, `BHASHINI_API_KEY`

## API

Operators can inspect readiness with:

```http
GET /api/integrations/phase6
```

The same endpoint accepts audited operations through `POST` with `action` values:

- `scholarship-disbursement`
- `apaar-provision`
- `digilocker-credential`
- `translate`
- `ndear-validate`

All operations require an education administration role (`SECRETARY`, `DIRECTOR`, `DEO`, or `BEO`).

## Failure handling

Live adapters fail closed with typed errors when a gateway is not configured or returns a non-2xx response. Scholarship disbursement blocks when PFMS has not released funds or when released funds are lower than the disbursement amount.
