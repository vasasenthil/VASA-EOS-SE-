# quality — the §F data-governance framework

The operational discipline that keeps the catalogue, onboarding, seed and volumes honest (DAT-TN-001 §F).

## §F.1 · data stewards
`Stewards` is the named-steward register per domain (Geography+School → DSE Programme Director + UDISE+ Nodal;
Identity → APAAR Nodal + HRMS-TN + Secretariat; Audit → G7 + CAG liaison; …). `StewardFor` resolves a domain
(including SLA-domain aliases) to its accountable steward.

## §F.2 · data-quality SLAs
`SLAs` encodes the quality objectives: master completeness ≥ 99.9%, identity duplicate-rate < 0.01% and APAAR
coverage ≥ 99%, attendance daily completeness ≥ 95%, marks window completeness ≥ 99%, audit integrity = 100%
(zero gaps), model-card coverage = 100%. `EvaluateSLA(domain, metric, measured)` grades a measurement.

## §F.4 · data-quality checks + quarantine bucket
Great-Expectations-style checks over a `Dataset`: `Completeness`, `Unique`, `ReferentialIntegrity`, `ValueIn`
(value distribution), `Freshness`. `Run` executes them and routes every failing row to the **quarantine
bucket** (`Report.Quarantined`), with an overall pass + completeness percentage.

## Wired into the platform
`Platform.CheckQuality(domain, dataset, checks…)` runs the checks, grades completeness against the domain SLA,
audits the run, and on failure **quarantines the bad rows and alerts the named steward + Compliance Lead**
(notify). `platformd GET /quality` runs a demo over a deliberately-dirty school sample — it fails, breaches
the master SLA, and alerts the steward. Tested: dirty → quarantine + alert; clean → pass + SLA met + no alert.
