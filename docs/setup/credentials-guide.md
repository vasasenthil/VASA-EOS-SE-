# VASA-EOS-SE-TN Credential Setup Guide

This guide tells the human operator how to obtain the credentials that Codex cannot create. Keep all issued secrets in the deployment secret manager and copy only non-secret placeholders into `.env.example`.

## 1. Supabase project

Required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and either `DATABASE_URL` or `SUPABASE_DB_URL`.

1. Sign in to the Supabase dashboard and create a project for the target environment.
2. In the project settings, copy the project URL and anon key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Copy the service-role key into `SUPABASE_SERVICE_ROLE_KEY` only in server-side secret storage. Supabase documents that service-role/secret keys bypass row-level security, so never expose this key to browser bundles or public logs.
4. Copy the Postgres connection string into `DATABASE_URL` or `SUPABASE_DB_URL`.
5. Run migrations with `npm run migrate`, then verify the cutover gate with `npm run production:cutover`.

Official references:
- Supabase API keys: <https://supabase.com/docs/guides/getting-started/api-keys>
- Supabase secrets/environment variables: <https://supabase.com/docs/guides/functions/secrets>

## 2. PFMS / fund-flow access

Required variables: `INTEGRATION_PFMS=live`, `PFMS_BASE_URL`, `PFMS_API_KEY`. For DBT/APBS disbursement, also configure `INTEGRATION_DBT=live`, `DBT_BASE_URL`, and `DBT_API_KEY`.

1. Identify the sponsoring department, treasury/bank integration owner, and scheme codes that will be used for scholarship/DBT workflows.
2. Start onboarding through the Public Financial Management System (PFMS) channel and the Controller General of Accounts / Department of Expenditure contacts used by the department.
3. Request sandbox and production gateway details for sanction lookup, release status, scheme expenditure, and payment/disbursement reconciliation.
4. Ask the gateway owner for the required signing algorithm, header names, replay-window requirements, idempotency key format, and rate limits. Configure those values in the deployment secret manager if the gateway-specific profile requires them.
5. Set `INTEGRATION_PFMS=live` only after contract tests pass against the PFMS sandbox and reconciliation reports have been verified by finance operations.

Official references:
- PFMS portal: <https://pfms.nic.in/>
- Controller General of Accounts PFMS page: <https://cga.nic.in/Page/Public-Finance-Management-System-PFMS.aspx>

## 3. APAAR registration / learner identity

Required variables: `INTEGRATION_APAAR=live`, `APAAR_BASE_URL`, `APAAR_API_KEY`. If APAAR provisioning also syncs state master data, configure `INTEGRATION_EMIS=live`, `EMIS_BASE_URL`, and `EMIS_API_KEY`.

1. Confirm the department's role in APAAR workflows: school education provisioning, higher education registration, duplicate resolution, or read-only verification.
2. Use the official APAAR / Ministry of Education route for onboarding and confirm whether access is through DigiLocker, UDISE+, Academic Bank of Credits, or a state-hosted gateway.
3. Obtain sandbox endpoints, production endpoints, API credentials, consent wording, duplicate-match thresholds, and audit/retention obligations.
4. Verify that consent capture and tenant-scoped authorization are active before enabling live provisioning.
5. Set `INTEGRATION_APAAR=live` only after duplicate-detection, consent, and rollback procedures are validated.

Official references:
- India.gov.in APAAR overview: <https://india.gov.in/spotlight/details/automated-permanent-academic-account-registry-apaar>
- APAAR registration information: <https://apaar.csc-services.in/>

## 4. DigiLocker OAuth / issuer-requester credentials

Required variables: `INTEGRATION_DIGILOCKER=live`, `DIGILOCKER_BASE_URL`, `DIGILOCKER_API_KEY`.

1. Decide whether VASA is acting as an issuer, requester, or both.
2. Register the department/application on the DigiLocker/API Setu partner portal as the appropriate partner type.
3. Complete organisation verification, redirect URI registration, and document-type approval.
4. Obtain OAuth/client credentials or partner API tokens, sandbox gateway URL, production gateway URL, scopes, token lifetimes, and callback/redirect requirements.
5. Run contract tests for credential issue, credential fetch, token refresh, and 401/403 handling before enabling `INTEGRATION_DIGILOCKER=live`.

Official references:
- DigiLocker requester onboarding: <https://www.digilocker.gov.in/web/partners/requesters>
- DigiLocker issuer onboarding: <https://www.digilocker.gov.in/web/partners/issuers>
- API Setu partner portal: <https://partners.apisetu.gov.in/>

## 5. Bhashini / ULCA / Dhruva language services

Required variables: `INTEGRATION_BHASHINI=live`, `BHASHINI_INFERENCE_URL`, `BHASHINI_API_KEY`. Optional service selectors: `BHASHINI_TRANSLATION_SERVICE_ID`, `BHASHINI_TTS_SERVICE_ID`, `BHASHINI_ASR_SERVICE_ID`.

1. Register for Bhashini/ULCA/Dhruva access using the department-approved identity.
2. Create or request the required inference pipeline for translation, text-to-speech, and speech-to-text.
3. Copy the provisioned inference endpoint into `BHASHINI_INFERENCE_URL` and the API credential into `BHASHINI_API_KEY`.
4. Record the approved service IDs for translation/TTS/ASR if the deployment must pin specific model providers.
5. Validate language-pair coverage, rate limits, payload size limits, and fallback language policy before enabling `INTEGRATION_BHASHINI=live`.

Official references:
- Bhashini portal: <https://bhashini.gov.in/>
- Bhashini API documentation: <https://bhashini.gitbook.io/bhashini-apis>

## 6. NDEAR / education architecture APIs

Required variables depend on the selected NDEAR building block. Use `INTEGRATION_UDISE`, `INTEGRATION_DIKSHA`, `INTEGRATION_RETRIEVAL`, and state gateway credentials as applicable.

1. Map each required VASA workflow to an NDEAR building block: registry, identity, content, credential, analytics, or interoperability layer.
2. Confirm whether the endpoint is national, state-hosted, or department-hosted. NDEAR is federated, so many production APIs are issued by the responsible registry owner rather than one central endpoint.
3. Obtain gateway URL, API key/OAuth details, data-sharing agreement, rate limits, and schema version for each selected building block.
4. Run contract tests against the sandbox or state-hosted mirror and record the approved schema version in the deployment runbook.
5. Enable the corresponding `INTEGRATION_*` flag only after tenant scoping and audit logging are verified.

Official references:
- NDEAR FAQs: <https://www.ndear.gov.in/faq.html>
- PIB NDEAR overview: <https://www.pib.gov.in/PressReleasePage.aspx?PRID=1826484>

## 7. Final operator checklist

1. Copy `.env.example` to the target environment secret manager.
2. Replace every placeholder (`<...>`) with the issued sandbox or production value.
3. Keep all `INTEGRATION_*` flags as `mock` until the corresponding contract tests and legal approvals are complete.
4. Run `npm run validate:env -- --env-file .env.production` before deployment.
5. Run `npm run migrate`, `npm run deploy:verify`, and `npm run production:cutover`.
