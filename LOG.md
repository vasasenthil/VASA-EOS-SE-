# LOG · CC-SPEC-001 working session log (§26.8)

## Phase 0 · session 1
- Read CC-SPEC-001 in full (cover brief + 28-section master spec). Confirmed it is a polyglot, distributed,
  infrastructure-heavy sovereign DPI — a different artefact in kind from the reference implementation.
- Executed Phase 0 (Bootstrap) per §24 + §26, stopping for human review per Cover STEP 3.
- Done: §11 monorepo skeleton with status-bearing layer READMEs; PHASE-0-PLAN; DECISIONS + ADR 0001–0005;
  BLOCKERS (infra/team/compute/network dependencies that gate Phases 1–8); SECURITY baseline; compliance
  MATRIX (§3); modules/CATALOGUE (§12) + 2 real module.yaml; **Rego policy plane** (access + regulatory +
  data/ai stubs + decision composition + opa tests); CI templates scaffold; reference→spec CROSSWALK;
  QUESTION-0001.
- Open: policy execution (needs OPA binary — B-023); everything in BLOCKERS Classes A–D.
- Blocked: Phases 1–8 (require sovereign infra + GPUs + clusters + a multi-disciplinary org + load rig).

## Phase 0 · session 2 (breadth, no infra)
- Built OPA 1.17.1 from source via the Go module proxy (release CDN was blocked) → policy plane now EXECUTES.
- Fixed a rule-conflict in policies/decision.rego; verified composed decisions live (deny/require-approval/permit).
- Generated the FULL 391-module catalogue (329 core + 62 TN) via tools/gen_catalogue.py → modules/catalogue.yaml
  + CATALOGUE.generated.md; 38 modules map to a reference-impl port source.
- Generated 11 OpenAPI 3.1 + 11 AsyncAPI 3.0 contracts (per domain, all 391 modules) via tools/gen_contracts.py.
- Completed the Rego corpus: data (classification/residency/retention) + ai (safety/bias/drift) with tests.
  Full suite: 27/27 opa test PASS; opa check clean.
- Added tools/lint_modules.py (CI gate: 391=329+62, contiguous ids, compliance/owner/layer/bundle, no drift)
  and tools/expand_modules.py (materialise per-folder module.yaml).
- Open: contracts are domain-level scaffolds (operation detail per module is later-phase); everything in
  BLOCKERS Classes A–D remains.

## Phase 1 · Foundation (L1–L2), authorable deliverables (§24)
- Built + tested the **sovereign-foundation services** (Go, stdlib-only):
  - `platform/L1-foundation/off-switch-svc` — M-of-N ed25519 quorum kill-switch, replay-safe, tamper-evident
    audit (ADR-0006). `go test` 7/7 PASS.
  - `platform/L1-foundation/escrow-agent` — deterministic, verifiable source-escrow manifest + Merkle-style
    root, tamper-detection (ADR-0006/§27). `go test` 4/4 PASS.
- Authored the L2 **IaC substrate** (ADR-0007): OpenTofu `infra/modules/{k8s-cluster,vault,istio,
  observability,argo-cd,cert-manager}` composed by per-site `infra/envs/{prod-chennai,prod-coimbatore,
  staging,dev}`; ArgoCD ApplicationSets + Loki PII-redaction values. Security defaults baked in (default-deny
  NetworkPolicy; Vault HSM/Shamir toggle defaulting to mock until B-002).
- Validation note: OpenTofu cannot be `go install`-ed here (replace directives in its go.mod) and there is no
  Docker/cloud substrate → HCL authored to valid syntax; `tofu validate` runs in CI against real providers
  (B-023). **Applying** any IaC is gated on B-001/B-002/B-010/B-012.
- ADRs: 0006 (off-switch M-of-N), 0007 (IaC: OpenTofu + ArgoCD GitOps). Layer READMEs updated honestly.
- **Build stops at the Phase-1 review gate** (Cover STEP 3/4): Phase 2 needs the cluster substrate + State
  PKI/HSM and `tofu validate` green in CI. Reference-impl green bar unaffected (tsc 0 errors).

## Phase 2 · Data Fabric & Security (L3 + L5), authorable deliverables (§18, §17, §8)
- Built + tested the **security data-plane** (Go, stdlib-only), operationalising the Phase-0 Rego corpus:
  - `platform/L5-security/pep` — Policy Enforcement Point over `data.vasa.decision`; single source of truth,
    **fail-closed**. Live-OPA integration proves PEP↔policy agreement (teacher-marks permit, expel-9yo deny,
    EWS-reject require-approval, minor-PII-no-consent deny). (ADR-0008)
  - `platform/L5-security/kms` — envelope encryption; HSM-root → per-tenant KEK → per-object DEK; tenant
    isolation, AAD binding, tamper detection, rotation/crypto-shred. (ADR-0008, §17.4)
  - `platform/L5-security/audit` — immutable hash-chain + Merkle root; detects tamper/delete/truncate/reorder
    (anchorable to Besu, B-020). (ADR-0008, §17.6)
- Built + tested the **L3 data fabric**:
  - `platform/L3-data-fabric/dataplane` — classification → store/region routing → retention; residency
    fail-closed. A **policy-parity test** cross-checks the Go router against the live OPA corpus → it caught a
    real gap (residency denied the in-state DR region); fixed `policies/data/residency.rego` to all
    TN-sovereign regions. OPA suite now **28/28**. (ADR-0009)
  - `platform/L3-data-fabric/schema/citus/001_core_oltp.sql` — tenant-sharded OLTP core, `FORCE` RLS,
    append-only `audit_log`, KMS PII envelopes. **Applied to real PostgreSQL 16**; RLS tenant-isolation +
    append-only audit proven functionally as a non-superuser role. `002_distribution.sql` (Citus calls)
    authored, CI-validated against a Citus image (B-013).
- CI: `.gitlab-ci/templates/go.yml` (gofmt · vet · go test w/ OPA · DDL apply). ADRs 0008, 0009. PHASE-2-PLAN.
- **Build stops at the Phase-2 review gate**: Phase 3 (L4 Integration/Federation) needs Citus/cluster
  (B-013/B-010), the State HSM root (B-002), and sovereign-DPI MoUs (B-022). Reference-impl untouched.

## Phase 3 · Integration & Federation (L4), authorable deliverables (§10.6, §20)
- Built + tested the **resilient federation adapter core** (Go, stdlib-only):
  - `platform/L4-integration/resilience` — circuit breaker (closed→open→half-open), bounded retry w/
    exponential backoff + jitter (context-aware, retryable classifier), idempotency dedup. Deterministic
    tests via injected clock/sleep. (ADR-0010)
  - `platform/L4-integration/reconcile` — faithful **PORT** of the reference drift engine: field-level
    (match/drift/missing, identity-critical escalation) + numeric tolerance (counts vs tighter money)
    reconciliation → Reconciled/Review/Flagged, advisory/HITL. (ADR-0010)
  - `platform/L4-integration/adapters` — APAAR anti-corruption adapter on the resilience core; DTO→domain
    transform. Exercised end-to-end against a **simulated upstream** (httptest): transform, retry-on-5xx,
    no-retry-on-4xx, breaker-trips-then-fails-fast, idempotent provision (no double-issue), drift flagged.
    Composes the two modules via monorepo `replace`.
- ADR-0010; PHASE-3-PLAN; L4 README + LOG updated to honest Phase-3 status.
- **Build stops at the Phase-3 review gate**: live upstreams/credentials/MoUs (B-022) and the GPU serving
  fleet for Phase 4 (B-011) remain gated. The remaining ~20 adapters follow the APAAR pattern on the same
  core. Reference-impl untouched; green bar holds (tsc 0 errors).

## Phase 4 · AI Engines & Serving (L8), authorable deliverables (§5, §10.7, §17.6)
- Built + tested the model-agnostic **AI serving + safety stack** (Go, stdlib-only), operationalising the
  Phase-0 `ai/*.rego` gates (which adjudicate signals this layer now produces):
  - `platform/L8-engines/guardrails` — PII detection+redaction (a model never sees raw Aadhaar/phone/email/
    APAAR), prompt-injection detection, safety scoring (Scorer seam). `SafetyGate` enforces
    `data.vasa.ai.safety.deny` via real OPA (fail-closed); 4 live-OPA integration cases pass. (ADR-0011)
  - `platform/L8-engines/evaluation` — PSI distribution drift (rollback > 0.2, matches `ai/drift.rego`) +
    disparate-impact / four-fifths (80%) bias + demographic-parity (feeds `ai/bias.rego`). Deterministic. (§5.1)
  - `platform/L8-engines/serving` — inference gateway: `Backend` seam (vLLM/Triton gated; deterministic
    `OracleBackend` baseline) + resilience (breaker/retry, reused from L4) + guardrails pre/post. Proven:
    PII redacted before serving, injection/age-inappropriate/unsafe refused at the input gate, fail-closed on
    gate error, retry on transient failure, **fallback to the oracle baseline** on sustained failure.
    Composes guardrails + resilience via monorepo `replace`. (ADR-0011)
- ADR-0011; PHASE-4-PLAN; L8 README + LOG updated to honest Phase-4 status.
- **Build stops at the Phase-4 review gate**: real LLM serving needs the GPU fleet (B-011); RAG/grounding
  needs Milvus (B-013). The `Backend`/`Scorer` seams drop in served models with no gateway change.
  Reference-impl untouched; green bar holds (12 Go modules pass, OPA 28/28, tsc 0 errors).

## Phase 5 · Agents & Orchestration (L9), authorable deliverables (§5, §6, §10.9)
- Built + tested the **agent layer under human authority** (Go, stdlib-only), a production RE-AUTHOR of the
  reference agent/tool-approval pattern:
  - `platform/L9-agents/registry` — the 6 native-AI agent specs (five-part anatomy, high-stakes flag) + an
    MCP-style tool catalogue where each tool declares a risk tier + the governance scope a human must hold;
    high-risk tools cannot register without a scope. (ADR-0012)
  - `platform/L9-agents/hitl` — the role-gated tool-approval queue: a proposed side-effecting call is queued
    pending; a human approves only if they hold the required scope (`*` superscope for apex authorities) →
    the tool executes; reject closes it; a failed execution stays pending for retry; every transition audited.
  - `platform/L9-agents/orchestrator` — the deterministic run state machine: auto-execute only low-risk,
    high-confidence, non-high-stakes proposals; route everything high-risk/high-stakes/low-confidence to HITL.
    Composes registry + hitl via monorepo `replace`. (ADR-0012)
- **Safety invariant proven**: the delegated system approver never holds the high-risk scopes (fund.release /
  compliance.sign / policy.sanction), so those tools — and the policy & compliance agents — ALWAYS require a
  scoped human, regardless of stated confidence.
- ADR-0012; PHASE-5-PLAN; L9 README + LOG updated to honest Phase-5 status.
- **Build stops at the Phase-5 review gate**: LLM-backed planning (LangGraph + MCP) runs on the L8 serving
  gateway once the GPU fleet exists (B-011); durable queue persistence lands in the Citus `agent_tool_requests`
  table on the cluster (B-013). Reference-impl untouched; green bar holds (15 Go modules pass, OPA 28/28,
  tsc 0 errors).

## Phase 6 · Knowledge, Notary & Verifiable Credentials (L7), authorable deliverables (§7.2, §16, §20)
- Built + tested the L7 **verifiability spine** (Go, stdlib-only):
  - `platform/L7-knowledge/graph` — curriculum knowledge graph (PORT): transitive prerequisites, deterministic
    topological learning path, readiness check; rejects unlearnable prerequisite cycles + unknown edges at
    construction. Neo4j is the production store (B-013). (ADR-0013)
  - `platform/L7-knowledge/notary` — Merkle-anchoring hash-chain ledger (the Besu seam, §7.2): each block
    commits to a Merkle root + the prev block hash; anchored roots get inclusion proofs a verifier checks
    against the root without trusting the ledger; `Verify` detects tamper/broken-link; forged proofs fail. (ADR-0013)
  - `platform/L7-knowledge/credentials` — ed25519 verifiable credentials anchored via the notary; end-to-end
    `Verify` confirms issuer signature + that the proof leaf is exactly the credential hash (binds proof to
    credential) + inclusion. Catches tampered claims, wrong issuer key, and substituted/unanchored creds.
    Composes notary via monorepo `replace`. (ADR-0013)
- ADR-0013; PHASE-6-PLAN; L7 README + LOG updated to honest Phase-6 status.
- **Build stops at the Phase-6 review gate**: live anchoring needs the Besu validator network (B-020); the
  graph persists in Neo4j + Milvus RAG (B-013); credentials push to DigiLocker (B-022). Reference-impl
  untouched; green bar holds (18 Go modules pass, OPA 28/28, tsc 0 errors).

## Phase 7 · Surfaces & Scale (L10), authorable deliverables (§10.3, §10.6, §10.8)
- Built + tested the L10 **scale spine** (Go, stdlib-only) — the design-time gate the load rig later confirms:
  - `platform/L10-surfaces/capacity` — analytical planner: sizes a topology (shards by data volume, app nodes
    by surge RPS, DB nodes by shard×replication, 30% headroom) and validates a proposed topology. Canonical TN
    load tested: 1.27 Cr / 69k schools → 17 shards / 207 app nodes / 67 DB nodes at modelled capacities. (ADR-0014)
  - `platform/L10-surfaces/ratelimit` — per-key token-bucket limiter (fair-shares tenants) + admission control
    that sheds load rather than collapsing under surge. Deterministic clock. (ADR-0014)
  - `platform/L10-surfaces/loadmodel` — the §10.8 scenarios (1 Cr × 1h, 2 Cr surge, 72h soak) as staged ramps
    + a deterministic arrival-shape model; the exact scenarios the rig runs. (ADR-0014)
- Scale posture is HONEST: "validated by model, pending the empirical rig run" — model + rig use the same
  numbers. The 13 portal surfaces RE-AUTHOR the reference app's UX (build/host gated on the cluster).
- ADR-0014; PHASE-7-PLAN; L10 README + LOG updated to honest Phase-7 status.
- **Build stops at the Phase-7 review gate**: the empirical 1-crore proof runs `loadmodel` on the dedicated
  rig (B-032) against the cluster (B-010); surfaces build/host need the cluster (B-010) + serving (B-011).
  Reference-impl untouched; green bar holds (21 Go modules pass, OPA 28/28, tsc 0 errors).

## Phase 8 · Cutover & Operations (final build phase), authorable deliverables (§24 Phase 8, §26.8)
- Built + tested the **operational spine** (Go, stdlib-only) — go-live logic the human team executes on real
  infra:
  - `platform/operations/cutover` — ordered, idempotent, reversible go-live runbook engine: each step has a
    precondition + action + verify + rollback; a failure rolls back completed steps in reverse (never
    half-cut-over); a re-run skips already-satisfied steps; every transition audited. (ADR-0015)
  - `platform/operations/dr` — Chennai→Coimbatore failover controller: grades the realised data-loss window
    vs RPO and promotion time vs RTO, refuses an unhealthy standby, and DRILLS non-destructively (no role
    change); failback restores Chennai. Residency holds across failover (both sites TN-sovereign). (ADR-0015)
  - `platform/operations/slo` — SLO + error-budget engine: success rate, budget consumed, burn rate (fast-burn
    alerting), and a deploy-FREEZE gate when the budget is spent. Canonical availability/latency SLOs. (ADR-0015)
  - `platform/operations/runbooks/go-live.md` — the go-live runbook with commissioning preconditions.
- ADR-0015; PHASE-8-PLAN; operations README + LOG updated to honest Phase-8 status.
- **Phase 8 is the final build phase.** On commissioning (BLOCKERS Classes A–D satisfied by the human team),
  the platform runs the go-live runbook under the cutover engine, the DR drill to prove RPO/RTO, and the
  error-budget release gate. The **authorable build is complete**; what remains is commissioning + the
  empirical proofs on real infrastructure. Reference-impl untouched; green bar holds (24 Go modules pass,
  OPA 28/28, tsc 0 errors).

## Platform merge · the composition root (every layer wired into one platform)
- Built `platform/integration` — the composition root that MERGES all 24 layer modules into one `Platform`
  and runs deep, tested, end-to-end workflows top-to-bottom and bottom-to-top (no layer left an island):
  - `New(cfg, decider, gate)` wires L1 off-switch · L10 rate-limit/admission · L5 KMS/audit/PEP · L7
    notary/graph · L9 registry/HITL/orchestrator · L8 serving · ops SLO/DR. The PEP decider + safety gate are
    injected, so the merged platform runs against the **real Rego plane** (CI) or fakes (unit tests).
  - **Admission (top-to-bottom)**: L10 → L1 → L3 residency → L5 KMS(seal PII) → L5 PEP → L5 audit → L9 HITL
    (EWS-quota review to a scoped human) → L7 (issue + anchor a verifiable credential). The platform is itself
    the HITL executor (approval → credential issuance).
  - **AskTutor (bottom-to-top)**: L10 → L8 serving(guardrails+oracle) → L7 knowledge graph (readiness + path)
    → L5 audit.
  - **ReconcileStudent** (L4), **EvaluateModel** (L8 drift/bias gate), **GoLive** (ops cutover audited via L5),
    **Readiness** (merges L10 capacity+loadmodel + ops DR+SLO + L1), **Disable/Enable** (sovereign off-switch).
- Tests: 12 deterministic end-to-end cases + 3 live-OPA composition cases (admit→credential, EWS→HITL→finalise,
  residency block, off-switch, rate-limit, tutor serve/refuse, federation drift, model gate, cutover,
  readiness). Cross-layer invariants proven on the whole: audit chain stays intact across a workflow, a
  high-risk action always needs a scoped human, PII never leaves TN, a disabled platform serves nothing.
- Green bar holds: **25 Go modules pass** (24 layers + integration), OPA 28/28, tsc 0 errors. Reference-impl
  untouched.

## Deepening · the 6 AI engines + 6 agents + closing omissions
- Built `platform/L8-engines/engines` — the **6 deterministic AI engine baselines** (RE-AUTHOR of
  `lib/ai/engines`): Reasoning (forward-chaining), Assessment (rubric scoring + mastery + bands),
  Personalisation (next-best objective), Policy (lever projection: coverage/cost/equity), Analytics (z-score
  anomalies), Conversational (grounded answer with citation; refuses ungrounded). 10 tests.
- Built `platform/L9-agents/agents` — the **6 agents** (Teacher·Student·Governance·Grievance·Policy·
  Compliance) composing the engines into advisory recommendations; Policy + Compliance are high-stakes and
  always require approval; low-confidence (e.g. ungrounded grievance) routes to a human. 5 tests.
- Wired both into the integration platform: `Advise` runs an agent recommendation through the orchestrator
  (engines → agent → orchestrator → auto-execute | HITL), the platform executor now runs any registered tool.
  Closed the two omissions: `EscrowManifest` (L1 source-escrow, verifiable) and `LoadScenarios` (§10.8 suite).
- Green bar holds: **27 Go modules pass** (24 layers + engines + agents + integration), OPA 28/28, tsc 0
  errors. Every brochure AI pillar — 6 engines + 6 agents — is now built, tested, and wired under human
  authority. Reference-impl untouched.

## Runnable · platformd (the merged platform as a live HTTP service)
- Built `platform/integration/cmd/platformd` — a small HTTP harness that mounts the composition root and
  serves the end-to-end workflows so the build can be exercised live: `/healthz`, `/readiness`, `/scenarios`,
  `POST /admission`, `POST /tutor`, and a one-click web console at `/`. Uses the live Rego plane when opa +
  `policies/` are present, else an in-process mirror, so it runs on any host.
- **Proven live**: ran the binary against the real OPA plane and curled the workflows — admit → permitted with
  a notarised verifiable credential (audit seq 1); EWS reject → require-approval routed to a human (TR-0001);
  offshore PII → residency block; tutor injection → refused. 6 httptest cases. Self-verifying status page also
  added at `public/platform-status.html` (27 modules · 213 tests, generated from the tree).
- Reference Next.js app `next build` verified green (exit 0). Reference-impl business logic untouched.

## Deployable · platformd metrics + container
- Added Prometheus `/metrics` to platformd (requests/admission/tutor/refused/errors counters + live
  audit-records, notary-blocks, SLO success-rate, off-switch gauges); 7 httptest cases incl. metrics.
- Authored `Dockerfile.platformd` (multi-stage, stdlib-only, distroless ~6 MB static binary — exact build
  command verified) + `fly.platformd.toml` to give the demo a public URL. Docker daemon itself is unavailable
  here (B-012), so the image isn't built locally; the build step compiles clean. Honest caveat documented:
  the demo host (Mumbai) is not the sovereign TN-SDC; no HSM/real datastores — in-process only.
- Green bar: 27 Go modules pass, OPA 28/28, tsc 0 errors. Reference-impl untouched.

## CI · gate the Go platform + policy plane + build the image
- Added `.github/workflows/platform.yml` (complements the existing Next.js `ci.yml`): on push/PR to main +
  `claude/**` it (1) checks `gofmt`, (2) `go vet` + `go test` every layer module (OPA on PATH for the live
  integration tests), (3) runs `opa test` + `opa check` on `policies/`, then (4) builds `Dockerfile.platformd`
  (pushing `ghcr.io/<owner>/vasa-platformd:{latest,sha}` on non-PR pushes).
- Verified every step locally as a runner proxy: gofmt clean · vet+test 27/27 · `opa check` ok · `opa test`
  28/28 · the image build command compiles. YAML + embedded shell validated. (GitHub Actions itself can't run
  in this sandbox; the image is built on the runner, which has Docker.)
- **CI confirmed green on GitHub's real infra** at 3b2bf2a (queried via the Actions API): `main` push run —
  job "Go modules + OPA policy plane" success (gofmt · vet+test ×27 · opa test · opa check) AND job "Build
  platformd image" success (built + **pushed `ghcr.io/vasasenthil/vasa-platformd:{latest,sha}` to GHCR**).
  `claude/happy-dirac-l37y0g` (push) and `claude/platform-foundation` (PR #5) runs also green. So the
  container I couldn't build locally (B-012) is a real published artifact, built on a clean external runner.
- Added CI badges + a "Run the merged platform" section (docker pull / go run / console / metrics) to the
  root README so the published image and platform are discoverable.

## L6 Platform Services (workflow · i18n/TMS · notifications), wired in
- Built three Go modules under `platform/L6-platform-services/`:
  - `workflow` — multi-tier approval engine (G1–G7), role + scope gated, reject-terminates, progress; a PORT
    of the reference governance workflow. 5 tests.
  - `i18n` — code-first localisation + TMS: `{var}` interpolation, fallback-to-default-locale, `Missing` +
    `Coverage` (translation gap). **Tamil first-class**, English fallback. 6 tests.
  - `notify` — notification dispatch: i18n-rendered body, channel-routed (inbox/sms/email seams), idempotent
    on an idem key, failed-send-stays-retryable; in-memory `InboxSender`. 6 tests.
- Wired into `platform/integration`: every admission outcome dispatches a **localised Tamil inbox
  notification** (idempotent per applicant/stage); the **G3→G5→G7 scheme-sanction** flow runs on the workflow
  engine (`StartSanction`/`ActSanction`, role+scope gated, audited). `platformd` exposes `GET /notifications`
  (Tamil inbox) + a console button. 7 new integration tests + 1 platformd test.
- CI: added QEMU + `platforms: linux/amd64,linux/arm64` to the image build so `docker pull` is native on
  Apple Silicon too.
- Green bar: **30 Go modules pass** (was 27 + workflow/i18n/notify), OPA 28/28, tsc 0 errors. Reference-impl
  untouched.

## L4 federation breadth · PFMS + UDISE+ adapters on the proven core
- Extracted a shared resilient `core` (breaker + retry + JSON GET) and added two adapters following the APAAR
  pattern: `pfms` (fund-flow: allocation/release/utilisation; tight money tolerance → leakage signal) and
  `udise` (EMIS school counts; roll-vs-EMIS gap → ghost-enrolment signal). DTO→domain transforms; exercised
  against simulated upstreams (transform, reconcile-within-tolerance, drift→Flagged, retry-on-5xx). 5 tests.
- `reconcile` gained `CompareEmisToEnrolment` (+ `EmisSchoolData`) — students critical, teachers/classrooms
  upstream-only context. 2 tests.
- Wired into `platform/integration`: `ReconcileFunds` (PFMS) and `ReconcileSchoolCounts` (UDISE+), audited.
  2 integration tests (fund-flow leakage Flagged + audited; 30% roll gap Flagged).
- Green bar holds: 30 Go modules pass (adapters now apaar+pfms+udise), OPA 28/28, tsc 0 errors. The
  "remaining adapters follow the same core" claim is now demonstrated, not just asserted.

## More breadth · DigiLocker + DIKSHA adapters + RTI civic Rego bundle
- Two more L4 adapters on the shared `core` (fetch-shaped, not reconciliation): `digilocker` (lists a
  learner's credential vault; DTO list → domain) and `diksha` (fetches a learning resource). DTO→domain
  transforms, tested vs simulated upstreams (transform, no-retry-on-404). 3 tests → adapters now 14.
- New **RTI Act 2005** Rego bundle (`policies/regulatory/rti.rego`, L12 civic): §8(1) exempt categories
  denied; §11 third-party info → PIO review; wired into the composed `pbac.rego`. Added a `PIO` RBAC grant.
  Fixed the `not … in …` undefined-field gotcha with an `exempt` helper. OPA suite **28→33** (5 RTI tests).
- Wired into `platform/integration`: `FetchLearnerCredentials` (DigiLocker), `FetchLearningResource` (DIKSHA),
  and `RTIDisclosure` (adjudicates rti.disclose through the PEP), all audited. 5 deterministic + 2 live-OPA
  integration tests (exempt→deny, third-party→PIO review against the real policy).
- Status page regenerated: **30 modules · 255 tests**. Green bar: 30 Go modules pass, OPA 33/33, tsc 0 errors.

## DIKSHA-backed tutor · the learning path cites real content
- Added a decoupled `ContentResolver` seam to the tutor + a `DikshaContentResolver` (concept→DIKSHA-id map
  over the resilient DIKSHA adapter). `AskTutor` now, after the knowledge-graph learning path, cites a real
  DIKSHA resource (title + URL) for the target — connecting L4 (adapter) → L7 (graph) → L8 (serving). Graceful
  degradation: an upstream failure or no-resolver just omits the citation; the tutor still serves. 3 tests.
- Status page: **30 modules · 258 tests**. Green bar holds (OPA 33/33, tsc 0). Reference-impl untouched.

## Token Engineering · the missing 4th discipline (per the native-AI-engineering diagram)
- Honest self-assessment vs the four interlocking disciplines (Spec→Loop→Context→Token): Spec strong;
  Loop+Context partial; **Token Engineering was the genuine gap**. Closed it.
- Built `platform/L8-engines/tokens` — the economics layer: **per-user equity budget** (every user gets the
  same guaranteed budget; a heavy user can't starve others), **prompt + semantic cache** (exact + normalised;
  cache hits cost ~0), **tier routing** (Cached/Standard/Premium by cache-hit + remaining budget), and an
  Indic-weighted token `Estimate`. Observable `Stats`. 6 tests.
- Wired into `AskTutor` (the serving loop): consult the equity budget + cache BEFORE any model call — a cache
  hit short-circuits the model for free; an exhausted budget refuses fairly (EQUITY-BUDGET, audited); a
  low-budget learner routes to the cheaper Standard tier. TutorResult now carries Tier/CacheHit/TokensCharged/
  BudgetRemaining. `platformd` exposes `GET /tokens` (meter stats). 3 integration tests.
- Remaining discipline gaps (next): the **Loop** iterative controller (ReAct/Plan-Execute-Reflect/Critic/
  Tool-Use-Verify) and **policy-bound hybrid retrieval** for Context; plus Spec's BPMN/Protobuf/model-cards.
- Status page: **31 modules · 267 tests**. Green bar: 31 Go modules pass, OPA 33/33, tsc 0 errors.

## All four native-AI disciplines closed (Loop · Context · Token · Spec)
Per the native-AI-engineering diagram (Spec→Loop→Context→Token). Token was done last turn; now the rest:
- **LOOP** — `platform/L9-agents/loop`: bounded **Plan→Execute→Verify→Reflect** controller — planner proposes,
  tool executes, a critic verifies, reflect-on-failure, **HITL checkpoints** pause consequential actions, all
  audited. Wired as `Platform.RunLoop` (audited via the chain; HITL checkpoint tested). 6 tests.
- **CONTEXT** — `platform/L7-knowledge/retrieval`: **policy-bound hybrid retrieval** — keyword (BM25-style) +
  graph expansion, then **tenant-isolation + classification filtering BEFORE grounding** (Milvus leg gated).
  Wired into `AskTutor` (`Sources`); proven the tutor grounds in a public doc and **drops** a class-1 PII doc
  and a cross-tenant doc. 6 tests.
- **SPEC** — `workflow.ToBPMN` (approval flow → BPMN 2.0 XML, well-formed) + `evaluation.ModelCard`
  (fairness + drift + attestation → deploy gate, Markdown). 2 + 5 tests.
- Added `docs/NATIVE-AI-DISCIPLINES.md` mapping each discipline to its modules.
- Status page: **33 modules · 288 tests**. Green bar: 33 Go modules pass, OPA 33/33, tsc 0 errors.
  Reference-impl untouched.

## Deepening the disciplines · 3-leg hybrid retrieval + agent-driven loop
- **Context**: completed the hybrid-retrieval triad — added the **vector leg** (`retrieval.VectorSource`,
  Milvus seam gated on B-013) fused with keyword (BM25) + graph; `NewHybrid(docs, graph, vector)`. The
  policy bound (tenant + classification) applies to the vector leg too — a strong vector hit on a class-1 doc
  is still filtered. Degrades cleanly to keyword+graph when no vector index. 3 new tests (retrieval now 9).
- **Loop**: a concrete **agent-driven remediation loop** — `Platform.TeacherRemediationLoop` wires the L8
  engines (Assessment + Personalisation) as the tool inside the bounded Plan→Execute→Verify→Reflect
  controller: assess → diagnose the weakest objective → plan remediation, audited end-to-end. Proven to
  diagnose `decimals` as the weak objective and complete. 1 integration test.
- Status page: **33 modules · 292 tests**. Green bar: 33 Go modules pass, OPA 33/33, tsc 0 errors.

## Exercisable disciplines · platformd endpoints + Protobuf (Spec triad complete)
- `platformd` now exposes the new disciplines over HTTP: **`POST /retrieve`** (policy-bound hybrid retrieval)
  and **`POST /remediation`** (the agent-driven Plan→Execute→Verify→Reflect loop) + console buttons; seeded
  with a small public demo corpus. Verified **live** against real OPA: `/retrieve` → `[FRAC-1, DEC-1, DIV-1]`
  (cleared docs, fractions first); `/remediation` → `{done:true, next:"decimals", iterations:4}`. 2 httptest
  cases. Added `Platform.RetrieveSources`.
- **Spec triad complete** — added `contracts/protobuf/platform.proto` (gRPC contracts for Admit/AskTutor/
  Retrieve/Remediate; 11 messages, 4 RPCs), alongside the existing OpenAPI 3.1 + AsyncAPI 3.0. CI now runs a
  real `protoc` compile check on every push.
- Green bar: 33 Go modules pass, OPA 33/33, tsc 0 errors; proto compiles. Reference-impl untouched.

## DAT-TN-001 seed data · the State's data at first boot
Read the full Data Architecture Brief (DAT-TN-001) and implemented the seed-data inventory + loader.
- `platform/L3-data-fabric/seed` — the SEED RULE engine: **signed** ed25519 manifest of per-seed SHA-256
  checksums; **idempotent** load with **rollback** (seed-version tags); **lineage** (source/steward/version/
  checksum/loadedAt + amendments); **synthetic never in production** (C.7 egress guard); **dependency-ordered**
  per §C.8 (S0→S4). 8 module tests.
- Real TN reference data seeded: **38 districts · 7 directorates · 22 scheduled languages (Tamil first) ·
  21 RPwD-2016 categories · NEP 5+3+3+4 · classes Pre-KG–12 · scheme catalogue · role catalogue · regulatory
  bundle list · governance/scheme/grievance/POCSO workflows**; large sets (385 blocks/3,800 clusters/69,000
  schools) as counts; Phase-4 Native-AI seeds carry a `Gated` BLOCKERS id (catalogue seeds; weights/vectors
  land with B-011/B-013). Committed `seed-manifest.yaml` (37 seeds) via `cmd/genmanifest`.
- Wired into the platform: it **loads the seed at boot** (productive only when OK), `Platform.SeedStatus/
  SeedManifestYAML/SeedLineage`, and `platformd GET /seed`. **Verified live: 32 production seeds · 191 records
  · ok:true** (5 synthetic seeds correctly excluded). 3 integration + 1 platformd test.
- Status page: **34 modules · 302 tests**. Green bar: 34 Go modules pass, OPA 33/33, tsc 0 errors.
