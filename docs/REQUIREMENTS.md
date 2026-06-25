# VASA-EOS(SE) — What's Needed to Build It All For Real

The platform runs today with **zero credentials** (mock-by-default on seeded data).
This is the one-by-one list of the real credentials, MoUs, and infrastructure required
to take every part to production. Each integration already has a live adapter behind a
typed port — these are the secrets/agreements that turn the flags on. Env-var names
match [OPERATIONS.md](OPERATIONS.md); flip with `INTEGRATION_*=live`.

## A. India Stack / NDEAR-S integrations (per port)

1. **APAAR (lifelong learner ID)** — MoE/NDEAR onboarding; APAAR registry API base URL + API key; data-sharing agreement. → `INTEGRATION_APAAR`, `APAAR_BASE_URL`, `APAAR_API_KEY`.
2. **Aadhaar auth (UIDAI)** — licensed **AUA/KUA** status (UIDAI sub-AUA via a partner), encryption/HSM for the AUA license, gateway URL + key. Verify-only; never store the number. → `INTEGRATION_AADHAAR`, `AADHAAR_BASE_URL`, `AADHAAR_API_KEY`.
3. **DigiLocker (MeitY)** — Issuer/Requester partner registration + MoU, OAuth2 client credentials (client id/secret) → access token, partner gateway URL. → `INTEGRATION_DIGILOCKER`, `DIGILOCKER_BASE_URL`, `DIGILOCKER_API_KEY`.
4. **DBT / APBS (NPCI / PFMS)** — sponsor-bank agreement, PFMS/APBS onboarding, NACH/APBS mandate, gateway URL + API key, scheme codes. → `INTEGRATION_DBT`, `DBT_BASE_URL`, `DBT_API_KEY`.
5. **UDISE+ (school registry)** — state-hosted UDISE+ mirror/federation gateway (no national open API), URL + optional token. → `INTEGRATION_UDISE`, `UDISE_BASE_URL`, `UDISE_API_KEY`.
6. **DIKSHA (content)** — none required for content discovery (public Composite Search API); optionally a state DIKSHA tenant. → `INTEGRATION_DIKSHA` (+ `DIKSHA_BASE_URL`).
7. **Bhashini (ULCA / Dhruva)** — Bhashini/ULCA account, provisioned inference pipeline endpoint + inference API key, service IDs (translation/TTS/ASR). Live ASR also needs the raw-audio pipeline. → `INTEGRATION_BHASHINI`, `BHASHINI_INFERENCE_URL`, `BHASHINI_API_KEY`, `BHASHINI_*_SERVICE_ID`.
8. **AI agents (LLM)** — an LLM provider account + API key (OpenAI-compatible, or a sovereign/Bharat LLM endpoint), model id; for tool-use, an MCP/tooling layer. → `INTEGRATION_AGENTS`, `AGENTS_API_KEY`, `AGENTS_API_URL`, `AGENTS_MODEL`.

## B. Core platform infrastructure

9. **Supabase project (or Postgres)** — project URL, anon key, **service-role key**; run migrations `scripts/001`–`015`; configure RLS. → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
10. **Auth & identity** — Supabase Auth (or SSO/OIDC for officials), the custom `users` table populated with role + school_id so `resolveSubject()` maps real users to the access policy; MFA for officials.
11. **Hosting/CI** — Vercel (or equivalent) project + tokens; GitHub repo secrets for CI; domain + TLS.
12. **Object storage** — S3/Supabase Storage bucket for documents/media/marksheets (credentials/blobs).

## C. Data sources to replace seeds

13. **Master data feeds** — real UDISE+ school list, APAAR/teacher rosters, scheme catalogues, attendance and assessment feeds — to replace the seeded demo datasets across SIS, welfare, facilities and finance modules.
14. **Government systems** — PFMS (finance), GeM (procurement), PM POSHAN MIS, CPGRAMS (grievance federation), SACHET/TNSDMA (disaster alerts), state HRMS (teacher deployment).

## D. Specialist runtime capabilities (beyond app code)

15. **OCR/OMR vision** — on-device/edge vision models + Tamil/English **ICR** for child handwriting (the OMR scoring path is built; the capture/recognition model is not).
16. **Deep accessibility runtimes** — Braille displays/embossing, ISL avatar/overlay service, AAC symbol libraries, switch/eye-tracking device integration (the preferences/UI are built; device runtimes are not).
17. **Voice / IVR** — telephony (SIP/cloud telephony) + Bhashini ASR/TTS for voice-first and IVR flows.
18. **Verifiable credentials chain** — a real ledger/registry (e.g., permissioned chain or a credentialing service) to mint NFT/SBT beyond the in-app hash anchor.
19. **Tamper-evident audit at scale** — HSM-backed signing or a managed ledger to replace the in-app FNV-1a hash chain.
20. **Knowledge graph store** — a property-graph DB (e.g., Neo4j) for the curriculum graph at scale.
21. **Polyglot data tier** — the document/cache/search/time-series/vector stores from the data architecture (MongoDB, Redis, Elasticsearch, TimescaleDB, a vector DB), plus a lake/warehouse + dbt for analytics/VSK.

## E. Zero-trust & compliance infrastructure

22. **Network/security** — WAF, DDoS protection, per-tenant VPC/segmentation, mTLS between services, private endpoints.
23. **Secrets & keys** — a secrets manager / **Vault**, HSM-backed keys, field-level PII encryption/tokenisation.
24. **Monitoring/SOC** — SIEM + 24×7 SOC, UEBA, threat intel, EDR/MDM on endpoints; uptime monitor pointed at `GET /api/health`.
25. **Compliance program** — DPDP registration/DPO, CERT-In coordination, POCSO/POSH processes, security audits (SAST/DAST/pen-test), WCAG 2.2 AAA audit, data-residency/sovereignty controls.

## F. Governance / legal

26. **MoUs & approvals** — agreements with MoE/NDEAR, UIDAI (AUA), MeitY (DigiLocker), NPCI/sponsor bank, NIC/state IT, and the 7 TN directorates; data-sharing and inter-departmental agreements (Part B/F of the master document).

---

> Of the above, only items requiring **no external credentials** are buildable in this
> environment (the app, the seam, mocks, tests, docs, the access policy + guard). The
> live adapters are ready and tested; everything in this list is what flips them — and
> the surrounding systems — from demo to production. See [STATUS.md](STATUS.md) for the
> completed-vs-pending register.
