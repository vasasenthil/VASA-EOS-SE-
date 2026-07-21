# Credentials Setup Guide

## Overview

This guide explains how to obtain all required API credentials for VASA-EOS-SE-TN. Codex can prepare the code, validation scripts, templates, and deployment automation, but a human operator must obtain credentials, complete government onboarding, sign MoUs where required, and configure the deployment secret manager.

## Prerequisites

Before starting, keep the following ready:

- Active official email address for the implementing organisation.
- Organisation registration documents and authorisation letter.
- Government partnership agreements / MoUs for restricted systems.
- Scheme codes, expected transaction volumes, and data-sharing purpose statements.
- Production domain names and callback URLs.
- A secure secret manager for storing issued credentials.

## 1. Supabase (5 minutes)

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` or `SUPABASE_DB_URL`

Steps:

1. Go to <https://supabase.com>.
2. Sign up with your email and create a new project for the target environment.
3. Go to **Project Settings → API**.
4. Copy the project URL to `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy the `service_role` key to `SUPABASE_SERVICE_ROLE_KEY`. This is server-only and must never be exposed to browser code or logs.
6. Copy the anon key to `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Go to database connection settings and copy the Postgres connection string to `DATABASE_URL` or `SUPABASE_DB_URL`.
8. Run `npm run validate:env -- --env-file .env.production` before migration.
9. Run `npm run migrate` after validation passes.

Official references:

- Supabase API keys: <https://supabase.com/docs/guides/getting-started/api-keys>
- Supabase secrets/environment variables: <https://supabase.com/docs/guides/functions/secrets>

## 2. PFMS (2-4 weeks; requires government MoU / finance approval)

Required environment variables:

- `INTEGRATION_PFMS=live`
- `PFMS_BASE_URL`
- `PFMS_API_KEY`
- `PFMS_API_SECRET`
- `PFMS_HMAC_ALGORITHM=SHA256`
- `PFMS_TIMEOUT_MS=30000`
- `PFMS_MAX_RETRIES=3`

Steps:

1. Contact the department finance/PFMS nodal officer and PFMS helpdesk channel. The public PFMS support channel lists helpdesk contact through the PFMS portal; verify current contact details before sending credentials or documents.
2. Submit an API access request with:
   - Organisation details.
   - Authorised officer details.
   - Use case description.
   - Scheme codes and fund-flow scope.
   - Expected transaction volume.
   - IP allowlist / network information.
   - Sandbox callback or reconciliation endpoint details.
3. Wait for approval. Plan for 2-4 weeks because PFMS access usually depends on finance approval, sponsor-bank/PFMS routing, and MoU/data-sharing review.
4. Receive sandbox and production credentials via a secure channel.
5. Confirm the signing profile with the PFMS gateway owner:
   - HMAC algorithm.
   - Canonical payload format.
   - Required request headers.
   - Replay-window tolerance.
   - Idempotency key requirements.
   - Rate limits and retry rules.
6. Configure `PFMS_BASE_URL`, `PFMS_API_KEY`, `PFMS_API_SECRET`, `PFMS_HMAC_ALGORITHM`, `PFMS_TIMEOUT_MS`, and `PFMS_MAX_RETRIES`.
7. Run contract tests against the sandbox before setting `INTEGRATION_PFMS=live`.

Official references:

- PFMS portal: <https://pfms.nic.in/>
- PFMS toll-free support page: <https://pfms.nic.in/SitePages/Toll-FreeNumber.aspx>
- Controller General of Accounts PFMS page: <https://cga.nic.in/Page/PFMS.aspx>

## 3. DBT/APBS (2-4 weeks; required for scholarship payment settlement)

Required environment variables:

- `INTEGRATION_DBT=live`
- `DBT_BASE_URL`
- `DBT_API_KEY`
- `DBT_TIMEOUT_MS=30000`
- `DBT_MAX_RETRIES=3`

Steps:

1. Confirm whether DBT/APBS access is provided directly, through PFMS, or through a sponsor-bank gateway.
2. Obtain the sponsor-bank onboarding checklist and payment file/API specification.
3. Register the implementing department, schemes, bank account mappings, reconciliation reports, and settlement callbacks.
4. Obtain sandbox credentials, production credentials, rate limits, and reconciliation formats.
5. Configure `DBT_BASE_URL`, `DBT_API_KEY`, `DBT_TIMEOUT_MS`, and `DBT_MAX_RETRIES`.
6. Enable `INTEGRATION_DBT=live` only after disbursement, duplicate-payment prevention, and reconciliation tests pass.

## 4. APAAR (2-6 weeks; required for student ID provisioning)

Required environment variables:

- `INTEGRATION_APAAR=live`
- `APAAR_BASE_URL`
- `APAAR_API_KEY`
- `APAAR_TIMEOUT_MS=30000`

Steps:

1. Confirm the department's APAAR onboarding route through the Ministry of Education / NDEAR / state gateway channel.
2. Prepare organisation details, authorised officer details, use case, consent workflow, expected student volume, and data retention policy.
3. Request sandbox access for duplicate search, learner identity provisioning, learner lookup, and transfer workflows.
4. Obtain API credentials, base URL, rate limits, consent wording, duplicate-match threshold, and audit requirements.
5. Configure `APAAR_BASE_URL`, `APAAR_API_KEY`, and `APAAR_TIMEOUT_MS`.
6. Enable `INTEGRATION_APAAR=live` only after consent capture, tenant scoping, duplicate handling, and rollback procedures are validated.

Official references:

- India.gov.in APAAR overview: <https://india.gov.in/spotlight/details/automated-permanent-academic-account-registry-apaar>
- APAAR registration information: <https://apaar.csc-services.in/>

## 5. DigiLocker (1-3 weeks; required for document issuance)

Required environment variables:

- `INTEGRATION_DIGILOCKER=live`
- `DIGILOCKER_BASE_URL`
- `DIGILOCKER_CLIENT_ID`
- `DIGILOCKER_CLIENT_SECRET`
- `DIGILOCKER_REDIRECT_URI`
- `DIGILOCKER_TIMEOUT_MS=30000`

Steps:

1. Decide whether VASA acts as issuer, requester, or both.
2. Register through the DigiLocker/API Setu partner channel.
3. Submit organisation verification documents, document types, callback URL, and authorised officer information.
4. Configure the production callback URL, for example `https://<platform-domain>/api/integrations/digilocker/callback`.
5. Receive OAuth client ID, client secret, approved scopes, sandbox URL, and production URL.
6. Configure `DIGILOCKER_BASE_URL`, `DIGILOCKER_CLIENT_ID`, `DIGILOCKER_CLIENT_SECRET`, `DIGILOCKER_REDIRECT_URI`, and `DIGILOCKER_TIMEOUT_MS`.
7. Run credential issue/fetch, token refresh, 401, 403, and callback tests before setting `INTEGRATION_DIGILOCKER=live`.

Official references:

- DigiLocker requester onboarding: <https://www.digilocker.gov.in/web/partners/requesters>
- DigiLocker issuer onboarding: <https://www.digilocker.gov.in/web/partners/issuers>
- API Setu partner portal: <https://partners.apisetu.gov.in/>

## 6. Bhashini (1-2 weeks; required for translation/TTS)

Required environment variables:

- `INTEGRATION_BHASHINI=live`
- `BHASHINI_INFERENCE_URL`
- `BHASHINI_API_KEY`
- `BHASHINI_USER_ID`
- `BHASHINI_TRANSLATION_SERVICE_ID`
- `BHASHINI_TTS_SERVICE_ID`
- `BHASHINI_ASR_SERVICE_ID`
- `BHASHINI_TIMEOUT_MS=60000`

Steps:

1. Register for Bhashini/ULCA/Dhruva access using the department-approved identity.
2. Request or create the required inference pipeline for translation, text-to-speech, and speech-to-text.
3. Obtain the inference endpoint, API key, user ID, and approved service IDs.
4. Confirm supported language pairs, payload size limits, rate limits, and fallback language policy.
5. Configure `BHASHINI_INFERENCE_URL`, `BHASHINI_API_KEY`, `BHASHINI_USER_ID`, service IDs, and `BHASHINI_TIMEOUT_MS`.
6. Enable `INTEGRATION_BHASHINI=live` only after translation, TTS, ASR, timeout, and rate-limit behavior pass sandbox tests.

Official references:

- Bhashini portal: <https://bhashini.gov.in/>
- Bhashini API documentation: <https://bhashini.gitbook.io/bhashini-apis>

## 7. NDEAR (1-4 weeks; required for standards compliance / selected building blocks)

Required environment variables:

- `INTEGRATION_NDEAR=live`
- `NDEAR_BASE_URL`
- `NDEAR_API_KEY`
- `NDEAR_TIMEOUT_MS=30000`

Steps:

1. Map every VASA workflow to the relevant NDEAR building block: identity, registry, content, credentials, analytics, or interoperability.
2. Confirm whether access is provided by a national endpoint, state gateway, registry owner, or department-hosted mirror.
3. Request sandbox endpoint, production endpoint, schema version, API key/OAuth details, data-sharing terms, and rate limits.
4. Configure `NDEAR_BASE_URL`, `NDEAR_API_KEY`, and `NDEAR_TIMEOUT_MS`.
5. Run schema/version conformance tests before setting `INTEGRATION_NDEAR=live`.

Official references:

- NDEAR FAQs: <https://www.ndear.gov.in/faq.html>
- PIB NDEAR overview: <https://www.pib.gov.in/PressReleasePage.aspx?PRID=1826484>

## 8. Additional integrations

Configure these only when the corresponding live workflow is in scope:

- Aadhaar gateway: `INTEGRATION_AADHAAR`, `AADHAAR_BASE_URL`, `AADHAAR_API_KEY`.
- UDISE+: `INTEGRATION_UDISE`, `UDISE_BASE_URL`, `UDISE_API_KEY`.
- DIKSHA: `INTEGRATION_DIKSHA`, `DIKSHA_BASE_URL`.
- Tamil Nadu EMIS: `INTEGRATION_EMIS`, `EMIS_BASE_URL`, `EMIS_API_KEY`.
- TN Schools Portal: `INTEGRATION_TNPORTAL`, `TNPORTAL_BASE_URL`, `TNPORTAL_API_KEY`.
- DGE / exam systems: `INTEGRATION_EXAMS`, `EXAMS_BASE_URL`, `EXAMS_API_KEY`.
- Retrieval / vector search: `INTEGRATION_RETRIEVAL`, `RETRIEVAL_BASE_URL`, `RETRIEVAL_API_KEY`.
- LLM / agent gateway: `INTEGRATION_AGENTS`, `AGENTS_API_URL`, `AGENTS_API_KEY`, `AGENTS_MODEL`.

## 9. Worker enablement

Required production variables:

- `ENABLE_OUTBOX_DISPATCHER_WORKER=true`
- `ENABLE_SLA_MONITOR_WORKER=true`
- `ENABLE_DRIFT_MONITOR_WORKER=true`
- `ENABLE_RETRAINING_ORCHESTRATOR_WORKER=true`
- `ENABLE_PFMS_RECONCILIATION_WORKER=true`
- `OUTBOX_WORKER_ENABLED=true`
- `SLA_MONITOR_WORKER_ENABLED=true`
- `DRIFT_MONITOR_WORKER_ENABLED=true`

Verify worker deployment with:

```bash
npm run production:cutover
```

## Verification

After configuring all credentials, run:

```bash
npm run validate:env -- --env-file .env.production
npm run migrate
npm run production:cutover
```

The production cutover gate should fail until every required credential, worker flag, migration, and live integration prerequisite is satisfied. That failure is expected during setup and protects the platform from unsafe go-live.
