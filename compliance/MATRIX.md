# COMPLIANCE MATRIX · CC-SPEC-001 §3 · VASA-EOS(SE) TN

Every module declares (in its `module.yaml`) which clauses of which instruments it discharges. CI verifies no
module is undeclared (`policies/regulatory/*` + a catalogue linter). This matrix is the canonical instrument
→ obligation → **enforcement locus** register. `Enforcement` names where the obligation is made executable
(a Rego bundle, a schema constraint, a pipeline, a workflow).

## 3.1 Constitutional & Statutory (India)
| Instrument | Platform obligation | Enforcement locus | Phase |
|---|---|---|---|
| Article 21A | Enrolment/attendance/retention/transition instrumented; grievance pipe for denial | `policies/regulatory/rte.rego`; Learner-Lifecycle modules; grievance workflow | 3–5 |
| RTE Act 2009 | 6–14 free & compulsory; 25% EWS lottery audit; PTR norms; no-detention | `rte.rego` (deny expel/detain 6–14, screening, capitation; gate EWS reject); admission-lottery audit | 3–5 |
| RPwD Act 2016 | 21-category accommodation; AAA; reservation | `rpwd.rego`; accessibility CI (Axe AAA); accommodation tracker | 4–7 |
| DPDP Act 2023 | Lawful basis on every PII read; versioned/revocable consent; DPO; 72-hr breach | `dpdp.rego`; consent-manager module; `policies/data/{classification,residency,retention}.rego` | 2–4 |
| POCSO Act 2012 | Safety pipeline on every minor-touching surface; mandatory reporting | `pocso.rego`; child-safety pipeline (§17.5); reporting workflow | 4–6 |
| JJ Act 2015 | Child-welfare integration; institutional-care safeguards | CWC integration module; safeguards in safety pipeline | 5–6 |
| IT Act 2000 | E-records; CCA e-signatures; intermediary safe-harbour | CCA-CA integration; e-sign service; takedown workflow | 3–6 |
| PFMS / GFR 2017 | All scheme money via PFMS; GFR audit trail | `pfms_gfr.rego` (sanction→release; within-allocation; delegated approval); PFMS adapter | 3–6 |
| TN State Acts / GOs | Reservation engine (BC/MBC/SC/ST/DNT); scheme catalogue per GO | Reservation engine; TN scheme modules (M0330–M0391) | 3–5 |

## 3.2 Sectoral standards
| Standard | Application | Enforcement | Phase |
|---|---|---|---|
| NDEAR-S 29/29 | Sunbird ED conformance | L4 conformance suite vs sandbox | 3 |
| APAAR / UDISE+ / DIKSHA | Identity / census / content | L4 adapters + reconciliation reports | 3 |
| WCAG 2.1 AAA | Floor on every surface | Axe-core (zero violations) + manual SR audit | 5–7 |
| AAL2/AAL3 (NIST 800-63) | AAL3 for governance/finance | Keycloak step-up; `abac.rego` env conditions | 2–5 |

## 3.3 International alignments (GLO-TN-001)
SDG 4/5/10/16 · UNESCO TES+4 · UNICEF GenU · WEF Education 4.0 · OECD PISA · World Bank STARS/GovTech · GPAI ·
UNESCO AI Ethics · ESG (TCFD/GRI/IFRS S1+S2) — each → indicators instrumented in L8 Analytics + L12 dashboards;
operational forms tabled in `compliance/INTERNATIONAL.md` (Phase 5–7).

## 3.4 Engineering standards
ISO 27001/27701/27018/25010/42001/23894 · NIST AI RMF · OWASP ASVS L3 + API Top 10 · CIS Benchmarks · PCI DSS
4.0 — each → a control set verified in CI (security stage) and attested under `compliance/` at Phase 7.

## CI rule (authored Phase 0, runs when the toolchain exists)
`compliance` stage: every `modules/*/module.yaml` MUST list ≥1 `compliance:` clause OR be explicitly tagged
`compliance: none` with a reviewer sign-off; Conftest asserts no regulated surface (PII, money, minor) ships
without the matching regulatory bundle referenced. See `.gitlab-ci/templates/compliance.yml`.
