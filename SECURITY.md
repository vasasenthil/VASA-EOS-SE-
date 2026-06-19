# SECURITY · CC-SPEC-001 §17 · VASA-EOS(SE) TN

Per §17.1 every module maintains a `SECURITY.md` with **STRIDE** (security) and **LINDDUN** (privacy),
updated on every architectural change. This root file is the platform baseline.

## Secret hygiene (Phase-0, enforceable now)
- Zero secrets in code. Secrets via Vault dynamic credentials (§17.4); env only as a last-resort dev seam.
- `.gitignore` excludes `.env*`, `*.pem`, `*.key`, key material; `gitleaks` runs pre-commit and in CI.
- No PII to logs (§2.10): mandatory redaction at the application boundary; PII only in encrypted audit stores.

## Threat model template (STRIDE / LINDDUN) — every module fills this in
| STRIDE | Threat | Control |
|---|---|---|
| Spoofing | identity forgery | Keycloak AAL2/AAL3; mTLS; SPIFFE workload identity |
| Tampering | record/audit alteration | append-only audit + Merkle + Besu notarisation (§17.3) |
| Repudiation | denying an action | signed, time-stamped audit of every consequential write |
| Information disclosure | PII leak | field-level encryption; data-classification + residency Rego; redaction |
| Denial of service | overload | back-pressure, rate budgets, WAF, DDoS mitigation (§10) |
| Elevation of privilege | unauthorised access | layered RBAC→ReBAC→ABAC→PBAC; deny-by-default |

| LINDDUN | Privacy threat | Control |
|---|---|---|
| Linking / Identifying | re-identification | data minimisation; APAAR not Aadhaar as PK; suppression in L12 |
| Non-repudiation (privacy) | forced traceability | consent receipts as VCs; purpose-binding |
| Detecting / Disclosure | inference / leak | classification + residency Rego; egress deny-by-default |
| Unawareness / Non-compliance | lack of consent | DPDP consent manager; data-principal portal; DPO endpoint |

## Hardening (§17.2) — Phase-1+ deliverables
TLS 1.3 / mTLS; LUKS + per-DB TDE; HSM root keys; signed images (Cosign) + admission (Kyverno); CIS L2;
PSS restricted; NetworkPolicy deny-by-default; egress allow-list; WAF/bot/DDoS; vuln SLAs (24h crit / 7d high).

## Reporting
Security issues → security@ (institutional channel). Do not open public issues for vulnerabilities.
