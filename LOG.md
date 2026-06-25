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

## DAT-TN-001 §B.6 onboarding pipeline · the single chokepoint
- `platform/L3-data-fabric/onboarding` — the **12-step L4→L5 gate** every record passes before entering the
  data fabric (no side doors): schema → authenticity → rate/shape → classification (POCSO-aware) → consent
  (DPDP) → residency (egress-denied) → tenant resolution → policy gate → encrypt-at-rest → persist → audit-log
  → emit. **Any failure quarantines the record (not lost) and alerts the source steward + Compliance Lead.**
  Each step is a seam; 9 module tests.
- Wired into the platform with the **real layers** — dataplane (classify+residency), PEP (policy), KMS
  (encrypt), audit, notify (alert): `Platform.Onboard` + `platformd POST /onboard`. Verified: clean Class-3
  record passes all 12 steps; **Class-1 PII offshore → quarantined at residency + steward alert**; Class-2 PII
  without lawful basis → quarantined at consent; unsigned external record → quarantined at authenticity.
  4 integration + 1 platformd test.
- Status page: **35 modules · 315 tests**. Green bar: 35 Go modules pass, OPA 33/33, tsc 0 errors.

## DAT-TN-001 §F data-governance framework
- `platform/L3-data-fabric/quality` — **§F.1** named-steward register (per domain), **§F.2** data-quality SLAs
  (master completeness ≥99.9%, identity duplicate <0.01% / APAAR ≥99%, attendance ≥95%, marks ≥99%, audit
  integrity =100%, model-card =100%) with `EvaluateSLA`, and **§F.4** Great-Expectations-style checks
  (completeness · uniqueness · referential-integrity · value-distribution · freshness) whose failing rows go
  to a **quarantine bucket**. 6 module tests.
- Wired: `Platform.CheckQuality` runs the checks, grades completeness vs the domain SLA, audits, and on failure
  **quarantines bad rows + alerts the named steward + Compliance Lead** (notify). `platformd GET /quality`
  runs a demo over a dirty school sample → fails, breaches the master SLA, alerts the steward. 2 integration +
  1 platformd test.
- Status page: **36 modules · 322 tests**. Green bar: 36 Go modules pass, OPA 33/33, tsc 0 errors.

## DAT-TN-001 §D volume + scale model
- `platform/L10-surfaces/volumes` — **§D.1** per-entity record counts (~1.27 Cr students, 4.5L teaching +
  1.5L non-teaching teachers, 2.75 Cr parents, 69,000 schools, 6L sections, 6 Cr addressable citizens),
  **§D.2** nine annual transactional streams (attendance ~25–34B · assessment 10–20B · submission 2–5B ·
  communication 10–20B · grievance 1–10L · scheme-delivery 50–100 Cr · ai-agent-interaction 5–50B ·
  iot-event 1–3 trillion · audit-log 100–500B), and **§D.3** the six-tier storage plan (oltp · olap ·
  timeseries · object · vector · graph) with per-node sizing, `ValidateStorage` and a 2× backup/DR total of
  **16,450 TB**. 5 module tests.
- Wired: `Platform.VolumeModel()` surfaces the §D model validated at 500 TB/node; `Readiness` now folds in a
  **StorageOK** check (+ failing tiers + total TB) so go-live readiness reflects the brief's sizing.
  `platformd GET /volumes` returns the live model. 2 integration tests. Verified live: /volumes → 1.27 Cr
  students + 9 streams + 6 tiers; /readiness → StorageOK:true, TotalStorageTB:16450, GoLiveReady:true.
- Status page: **37 modules · 329 tests**. Green bar: 37 Go modules pass, OPA 33/33, tsc 0 errors.

## DAT-TN-001 §F.3 data-lineage / catalogue surface
- `platform/L3-data-fabric/catalogue` — a single queryable **data dictionary** that unifies the seed inventory
  (Section C), loaded lineage (source · version · checksum · load time · amendments), the Section E PII
  classification (with sensitivity labels), and the §F.1/§F.2 governance register (named steward + applicable
  data-quality SLAs) per asset. Queries: `ByCategory`, `ByPIIClass` (e.g. surface every Class-1 asset for an
  audit), `BySteward`, and `Trace` (transitive upstream provenance + downstream impact over the dependency
  graph), plus a `Summary` roll-up. Pure + stdlib-only. 4 module tests.
- Wired: `Platform.Catalogue` is assembled at boot over **every known asset** (production + synthetic dev
  fixtures), enriched with the just-loaded lineage — synthetic seeds show as inventoried-but-not-loaded.
  Accessors `CatalogueSummary/Assets/Asset/Trace`; `platformd GET /catalogue` (summary · `?list=1` ·
  `?asset=ID` · `?trace=ID`). 2 integration tests. Verified live: /catalogue → 37 assets, 32 loaded, 191
  records, 16 stewards, 5 SLAs; /catalogue?trace=SEED-GEOGRAPHY → downstream [SEED-OFFICES, SEED-SCHOOLS].
- Status page: **38 modules · 335 tests**. Green bar: 38 Go modules pass, OPA 33/33, tsc 0 errors.

## DAT-TN-001 §G AI-operational governance — model-card registry
- `platform/L8-engines/modelregistry` — the authoritative register of every model the platform may run, making
  the §F.2 **"no model in production without a signed card"** SLA enforceable. Each entry binds an
  `evaluation.ModelCard` (intended use + bias + drift + signed attestation) to **red-team evidence** and a
  lifecycle state machine (registered → pending-approval → deployed → retired; blocked/rejected). The transition
  into production is **fail-closed** and needs all three: the card-level gate (four-fifths fairness + drift
  under threshold + **signed** attestation), red-team evidence on file, and a **named human approver** (HITL).
  Live drift past threshold on a deployed model trips an **automatic rollback** to blocked (canary discipline);
  `IsServable` is the enforcement point (unregistered/non-deployed ⇒ never servable). 5 module tests.
- Wired: `Platform.Models` boots mirroring what actually runs — the deterministic safety classifier is carried
  through the full gate (red-team → request → human approval) to **deployed**; the GPU-served generative + Indic
  models are **registered but un-deployed**, awaiting their B-011 substrate + independent evidence (honest).
  Accessors `ModelRegistry/Entries/Entry/Servable/CardCoverage` (the last feeds the §F.2 SLA live);
  `platformd GET /models` (summary · `?list=1` · `?model=…`). 2 integration tests. Verified live: /models →
  4 models, 1 deployed, coverage 1.0; the classifier entry shows its full lifecycle history + human approver.
- Status page: **39 modules · 342 tests**. Green bar: 39 Go modules pass, OPA 33/33, tsc 0 errors.

## DAT-TN-001 §E consent, lawful-basis & retention register (DPDP)
- `platform/L3-data-fabric/consent` — the stateful **DPDP-Act-2023 ledger** complementing the dataplane's
  stateless classification. Per data principal + purpose it records a **lawful basis** (consent §6, or a §7
  legitimate use — legal-obligation / court-order / employment / subsidy / emergency) and enforces: **child
  protection (§9)** — a minor's consent needs a named guardian, and a `ChildProhibited` purpose (behavioural
  advertising) is refused for a minor; **withdrawal (§6(4))** — consent is withdrawable, a §7 basis is not;
  the **retention clock (§8(7))** — ending a purpose starts the per-purpose window, `RunRetention` sweeps +
  erases; and **rights** — right-to-access (§11) and right-to-erasure (§12, forced) with a **statutory hold**
  that blocks erasure either way. Immutable per-grant history; `LawfulToProcess` is the enforcement seam.
  6 module tests.
- Wired: `Platform.Consent` is seeded at boot with the standing purposes (enrolment 7y · attendance 5y ·
  assessment 10y · scheme-DBT 7y · AI-tutoring 1y consent-based · + a child-prohibited advertising purpose).
  Accessors `ConsentSummary/Purposes`, `RecordConsent/WithdrawConsent/LawfulToProcess/AccessReport/RunRetention`;
  `platformd GET /consent` (summary · `?purposes=1` · `?access=…`) + `POST /consent` runs the rights flow.
  3 integration tests. Verified live: minor consent under guardian → lawful → withdraw → not lawful (reason
  "consent withdrawn"), with full history + a §11 access report.
- Status page: **40 modules · 351 tests**. Green bar: 40 Go modules pass, OPA 33/33, tsc 0 errors.

## §E consent register threaded into the §B.6 onboarding gate (live lawful-basis enforcement)
- Added `consent.Register.HasLawfulBasis(principal, purpose)` — the live query the ingestion path uses to
  authorise per-principal personal data (DPDP §4). 1 module test.
- Rewired the onboarding `ConsentChecker` (`obConsent`) to consult the **live §E register** instead of a bare
  payload flag: Class-1/2 personal data now passes the consent step only with either a **§7 legitimate use**
  asserted by the source steward (`statutory:true` — UDISE+/APAAR bulk ingestion under legal obligation) or an
  **active per-principal consent grant** in the register (looked up by `principal`+`purpose`). A bare
  `consent:true` flag is no longer sufficient. Updated the existing onboarding tests + platformd demo
  accordingly and added an integration test proving the live path (no grant → quarantine at consent; record a
  grant → all 12 steps pass). Verified live: marks without a grant → quarantine at consent-check with reason
  "no active lawful basis on file for this principal + purpose"; Class-1 with §7 statutory → passes consent,
  blocked at residency.
- Status page: **40 modules · 353 tests**. Green bar: 40 Go modules pass, OPA 33/33, tsc 0 errors.

## §F.2 SLA board measured live (§G registry → §F.2 SLA)
- Added `Platform.SLABoard()` + `SLAStatus` and a `platformd GET /sla` endpoint that grades the §F.2 SLAs the
  platform can measure live **today**, honestly: **model_card/coverage** sourced from the §G model registry
  (the only production model is the signed, deployed safety classifier → 1.0, met) and **audit/integrity**
  sourced from the L5 hash-chain (`Audit.Verify()` → 1.0, met). SLAs that need operational telemetry pending
  their substrate are deliberately left off the live board rather than faked. 1 integration test. Verified
  live: /sla → model_card 1.0/met (source "model-registry (§G)"), audit 1.0/met (source "audit hash-chain").
- Green bar: 40 Go modules pass, OPA 33/33, tsc 0 errors.

## Populate at §D scale — TN institutional estate + synthetic population (honest real/synthetic line)
- `platform/L3-data-fabric/population` — materialises the TN education estate so the platform is **populated
  end-to-end at §D scale without fabricating real personal data**. The institutional tree is **anchored to the
  real 38 districts** (`seed.Districts`) and distributes blocks/clusters/schools to hit **385 / 3,800 / 69,000
  exactly**, with TN-shaped UDISE codes (33…) and a realistic management mix (~65% Government / 15% Aided /
  15% Matriculation / 5% CBSE). People (students/teachers/guardians) are **synthetic by construction** — every
  id `SYN-`-prefixed, `synthetic:true`, anchored to the real estate but never production. The full §D.1 cohort
  (1.27 Cr students etc.) is a validated `ScalePlan`, not materialised. Deterministic. 5 module tests.
- Wired: `Platform.PopulationSummary/SchoolsInDistrict/SyntheticCohort` (tree built lazily once via sync.Once);
  `platformd GET /population` (summary · `?district=NAME` · `?cohort=N`). 2 integration tests. Verified live:
  /population → 38/385/3800/69000 tree_valid:true, mix 44,850 Govt etc., scale 1.27 Cr; ?district=Chennai →
  real-anchored schools with 33… UDISE; ?cohort=1000 → 1000 SYN-APAAR students anchored to real districts.
- **Honest note:** real reference/master data (districts, directorates, 22 languages, 21 RPwD, schemes, NEP)
  was already 100% real and test-enforced; this slice materialises the institutional tree on top of it and adds
  a labelled-synthetic population. Real population PII (actual crores of people) is **deliberately not
  fabricated** — it requires the live federated substrate (APAAR/UDISE+/PFMS) and data-sharing agreements,
  which remain gated/out-of-scope by design.
- Status page: **41 modules · 361 tests**. Green bar: 41 Go modules pass, OPA 33/33, tsc 0 errors.

## Drive the populated estate through the live workflows (end-to-end estate exercise)
- `Platform.ExerciseOnboarding(ctx, n)` + `platformd GET /exercise?n=…` — materialises a synthetic cohort
  spread evenly across the **whole real estate** (all 38 districts) and drives every member through the **live**
  §B.6 twelve-step onboarding gate against the real layers: records a real DPDP **consent grant** per principal
  in the §E register, then classify → consent → residency → policy → encrypt → persist → audit → emit.
  Ingestion is per-source (per originating block, signed by the L4 adapter) so the rate-shape step buckets
  realistically. 1-in-20 records are routed offshore to exercise the fail-closed quarantine path. The counts
  are **observed, not asserted**. 2 integration tests.
- Verified live (n=1000): 1000 grants recorded · **950 onboarded (95%)** · **50 quarantined at residency**
  (the offshore tranche) · **38 districts touched** · 1000 immutable audit-chain records. This is the platform
  actually processing a populated estate end-to-end — real classification, lawful-basis, residency, audit —
  on clearly-synthetic, real-anchored data.
- Status page: **41 modules · 363 tests**. Green bar: 41 Go modules pass, OPA 33/33, tsc 0 errors.

## Estate exercise extended to the full pipeline (onboard → admit → tutor)
- `Platform.ExerciseOnboarding` now drives each onboarded student onward through the **admission** workflow
  (issuing a notarised verifiable credential) and an age-appropriate **AI-tutoring** turn (grounded + safety-
  gated), bounded to a 500-student downstream sub-sample for responsiveness; rate limiting is keyed per
  district. `EstateExercise` gained `Admitted / CredentialsIssued / TutoringServed / TutoringRefused`.
- Verified live (n=600): 600 grants · 570 onboarded · 30 quarantined at residency · **500 admitted · 500
  verifiable credentials issued · 500 grounded tutoring turns served** · 38 districts · 1,600 audit records.
  The populated estate now flows through onboarding + admission + tutoring end-to-end on clearly-synthetic,
  real-anchored data. Strengthened the integration test to assert the admission/credential/tutoring paths.
- Status page: **41 modules · 363 tests**. Green bar: 41 Go modules pass, OPA 33/33, tsc 0 errors.

## Conformance diff — CC-SPEC-001 Cover Brief + SYN-TN-001 Synthesis Brief → the Go build
- Read both briefs in full (Cover Brief CC-SPEC-001, 6pp; Synthesis Brief SYN-TN-001, 10pp) and produced a
  line-by-line conformance diff against the Go service mesh: `docs/CONFORMANCE-CC-SPEC-001.md`. Verdicts are
  evidence-backed (module path or BLOCKERS gate), in the briefs' own "ask for scrutiny" spirit.
- Headline (Go build only): L1–L10 application **logic** = high conformance (every layer has tested Go
  modules; physical substrate gated by design); **6 engines + 6 agents = full**; **8 pillars = 6 built / 2
  partial**; **access-control policy models = 4 of 5** (IAM gated); **Indian statutory = 6 fully tested / 3
  partial**; scale analysis + populated estate = full (physical load proof gated). Honest gaps called out:
  **T0–T6 tenancy hierarchy is partial in Go** (tenant-ids yes, hierarchy in TS); **L11/L12, 13 portals, 391
  functional modules, NDEAR-S 29/29 and the international registers are TS-app, not the Go mesh**; HSM/K8s/8
  datastores/GPU/Besu/IoT/Edge/DAO are gated by design.

## Closed the Go gap — T0–T6 sovereign multi-tenancy as a first-class module
- `platform/L6-platform-services/tenancy` — the seven-tier sovereign hierarchy (T0 Sovereign/off-switch → T1
  Secretariat → T2 Directorate → T3 District → T4 Block → T5 Cluster → T6 School), promoted from tenant-ids-on-
  records to a real Go module mirroring `lib/tenancy`. **Strict-chain invariant** enforced on `Add` (a node's
  tier must be exactly one below its parent; unique T0 root). **Downward governance** (`Governs`) is fail-closed:
  a subject governs itself + descendants only — never an ancestor, never a sibling. `BuildTN` materialises the
  tree over the **real estate** (`seed.Directorates` + `population` tree) → ≈73k nodes with tier counts
  1·1·7·38·385·3,800·69,000. 5 module tests.
- Wired: `Platform.TenancyTiers/TenancySummary/TenancyPath/Governs/TenantNode` (hierarchy built lazily once via
  sync.Once); `platformd GET /tenancy` (summary · `?path=ID` · `?governs=A&over=B`). 2 integration tests.
  Verified live: /tenancy → 73,232 nodes, valid:true; path(Chennai) → "Tamil Nadu (Sovereign) → School
  Education Secretariat → Directorate of School Education → Chennai"; governs(DSE, Chennai)=true;
  governs(Chennai, Madurai)=false. Conformance diff + status page updated to mark the gap closed.
- Status page: **42 modules**. Green bar: 42 Go modules pass, OPA 33/33, tsc 0 errors.

## Closed the TS-only gaps — L11 governance · L12 civic · 13 portals · 391-module catalogue · NDEAR-S · alignments
Promoted six registers that previously lived only in the TS app into first-class, self-verifying Go modules,
wired into the composition root and surfaced on platformd:
- `L11-governance/govtiers` — G1–G7 governance tiers (mandate/composition/authority) + 3 AI Control Tower
  bodies + escalation paths. `GET /governance`. 3 tests.
- `L10-surfaces/portals` — the 13 role-tailored stakeholder portals (role · home · tier · grants). `GET /portals`. 2 tests.
- `L4-integration/ndears` — NDEAR-S 29 building blocks with sovereign/federated/pending posture, headline
  computed (26/29 addressed today). `GET /ndears`. 2 tests.
- `L11-governance/alignments` — GLO-TN-001: 12 international frameworks (SDG·UNESCO·PISA·STARS·GPAI·UNESCO AI
  Ethics·ESG) mapped to in-mesh evidence + posture. `GET /alignments`. 2 tests.
- `L11-governance/catalogue` — the 391 functional modules as families across the 7 tiers + Platform, counts
  **computed** to 329 core + 62 TN = 391 (self-verified, can't drift). `GET /modules`. 2 tests.
- `L12-civic/civic` — PII-suppressed public dashboard (from the real estate), k-anonymity cell suppression, RTI
  register with the 30-day statutory clock, grievance tracker, open-data (CKAN-style) catalogue. `GET /civic`.
  4 tests. Wired: `Platform.{GovernanceTiers,ControlTower,Portals,NDEAR*,Alignments,ModuleCatalogue,Public
  Dashboard,FileRTI,FileGrievance,CivicSummary,…}` + 3 integration tests.
- Verified live: /modules → 329+62=391 headline_match true; /ndears → 29 blocks (26 addressed); /governance →
  7 tiers + 3 bodies; /portals → 13; /alignments → 12 (6 instrumented); /civic → 69k-school PII-suppressed
  dashboard + 6 open datasets + live RTI/grievance. Conformance diff updated: L11/L12 and all six gaps marked
  closed (per-module Next.js UIs remain in the TS app, by design).
- Status page: **48 modules · 388 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Tenancy made enforcing — jurisdiction-scoped queries over the live estate
- Added `tenancy.Hierarchy.Descendants` + `LeavesUnder(id, level)` (the downward-governance subtree query) and
  `Platform.SchoolsGovernedBy(subjectID)` — the fail-closed ReBAC scope seam over the real estate: a subject
  tenant sees only the T6 schools in its subtree. `platformd GET /tenancy?scope=ID`. 1 module + 1 integration
  test. Verified live: scope=TN → 69,000 schools (sovereign); scope=TN-DIST-Chennai → 2,090 schools (proper
  subset, with a UDISE sample); scope=GHOST → 0 (fail-closed). The T0–T6 module now *enforces* jurisdiction
  over live data, not just describes the hierarchy.
- Status page: **48 modules**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Wired L9 grievance agent → L12 civic tracker → L5 audit (end-to-end grievance routing)
- `Platform.RouteGrievance(ctx, GrievanceInput)` — runs a citizen grievance end-to-end: the **L9 grievance
  agent** recommends a policy-grounded routing (L8 conversational engine over a governing-policy corpus), the
  grievance is **filed into the L12 civic tracker** at the resolved governance tier, and the routing is written
  to the **L5 audit chain**. Tier resolution: child-protection/POCSO → district; scholarship/DBT → directorate;
  field issues (meals/infra/RTE) → block; ungrounded → directorate + flagged for human confirmation (HITL).
  `platformd POST /grievance`. 3 integration tests.
- Made the L12 civic register a **per-Platform field** (`p.Civic`) instead of a package singleton, so RTI +
  grievance state is instance-scoped (fixed cross-test leakage). Verified live: meal-quality → block (cites
  MDM-QUAL); POCSO → district (cites POCSO-MR); both filed in the tracker + audited.
- Status page: **48 modules · 393 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Live /conformance self-check — the headline figures, machine-verified from the running mesh
- `Platform.Conformance()` + `platformd GET /conformance` — computes every CC-SPEC-001/Synthesis headline from
  the **live registers** and compares to the briefs' published figures, so the conformance claim can never
  silently drift: 12 layers · 7 governance tiers · 3 Control Tower bodies · 7 tenancy tiers (T0–T6) · 6 engines ·
  6 agents (live from `agentregistry.Agents`) · 13 portals · 391 modules (329 core + 62 TN, computed) · 29
  NDEAR-S blocks · 12 international alignments · 8 pillars (6 built / 2 partial). `HeadlinesMatch` is asserted
  by the test (which prints exactly which figure drifted on failure). 2 integration tests.
- Verified live: /conformance → headlines_match:true, all 13 rows OK, pillars 6/8 built. The markdown
  conformance diff is now backed by a runtime self-check.
- Status page: **48 modules · 395 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Grievance human-authority loop — ungrounded routings go through the real HITL queue
- An ungrounded / low-confidence grievance routing is no longer auto-filed: `RouteGrievance` now **enqueues a
  HITL request** (`grievance.route`, scope-gated) for a tier officer to confirm; the grievance is filed into the
  L12 civic tracker only when the human approves (the HITL executor's `grievance.route` branch). Policy-grounded
  routings still file directly. Added `Platform.DecideGrievance` + `PendingGrievances`; `platformd GET/POST
  /grievance-queue`. Updated/added integration tests (the ungrounded case now asserts the full queue→approve→
  file loop).
- Verified live: ungrounded grievance → routed:false, pending_approval:true, request_id TR-0001; queue shows it
  pending; officer DEO-Chennai approves → "grievance GRV-9 confirmed + filed at directorate"; civic tracker then
  holds it. AI assists; humans decide.
- Status page: **48 modules · 395 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Resolved roles fetch error + wired govtiers escalation into the scheme-sanction workflow
- **Fix (TS):** `app/governance/roles/actions.ts` — a configured-but-unreachable Supabase (offline preview /
  restricted network / paused project) threw "Failed to fetch roles: TypeError: fetch failed". Added
  `isDbUnreachable()` to detect network/connection failures and degrade to the demo role set in both the
  query-error branch and the catch, so the page renders. tsc 0 / eslint clean.
- **Govtiers → workflow (Go):** the scheme-sanction flow is now **register-driven** — its steps ARE the
  `govtiers.EscalationPath` for the decision's stakes. Added `approver_role` + `required_scope` to each G-tier
  so the register defines who signs; `SanctionDefinitionFor(highStakes)`, `StartSanction(id, highStakes)`,
  `ActSanction(in, highStakes, …)`, `SanctionEscalation(highStakes)`; `platformd GET /sanction?stakes=`.
  High-stakes → **G4→G3→G2→G1** (PMU→Director→Secretary→Cabinet); routine → **G4→G5→G6** (PMU→Architecture→
  Ethics), never the Cabinet. Updated l6 tests (4-step escalation to G1 + routine-path assertion). Verified
  live: /sanction?stakes=high → [(G4,DEO,scheme.recommend),(G3,DIRECTOR,scheme.approve),(G2,SECRETARY,
  fund.release),(G1,MINISTER,policy.sanction)]; routine → [G4,G5,G6].
- Status page: **48 modules · 396 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## /metrics extended — governance · conformance · civic gauges from the live registers
- Extended `platformd /metrics` with Prometheus gauges sourced live from the registers: per-item +
  aggregate **conformance** (`vasa_conformance_headlines_match`, `vasa_conformance_item{area=…}`),
  **functional modules** (391), **model-card coverage** SLA, **tenancy** (`vasa_tenancy_nodes`,
  `vasa_tenancy_valid`), and **civic** (`vasa_grievances_open/resolved`, `vasa_rti_open/overdue`,
  `vasa_grievance_queue_pending`). Extended the metrics test to assert the new gauges. Verified live:
  headlines_match 1 · functional_modules 391 · model_card_coverage 1 · tenancy_nodes 73232 · tenancy_valid 1;
  after filing a grounded + an ungrounded grievance → grievances_open 1, grievance_queue_pending 1 (the
  ungrounded one held in HITL).
- Status page: **48 modules · 396 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## k-anonymity person-level public statistic (L12 privacy guarantee on real population data)
- `Platform.PublicEnrolment(cohort, k)` + `platformd GET /civic?enrolment=1&cohort=&k=` — produces a
  publishable per-class enrolment statistic from a synthetic cohort and applies **k-anonymity small-cell
  suppression** (`civic.SuppressSmallCells`): any class with fewer than k learners is withheld, never
  published, so no open-data figure can single out an identifiable small group (DPDP-safe). 1 integration test.
- Verified live: cohort=1500/k=5 → all 15 classes published, none suppressed; cohort=30/k=5 → 0 published, all
  15 small cells suppressed. The L12 civic layer now demonstrably emits person-level public stats without
  exposing small groups.
- Status page: **48 modules · 397 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## RTI lifecycle (L12) — file → acknowledge → answer under the 30-day statutory clock
- Civic module: added `AcknowledgeRTI` (PIO acknowledgement; clock keeps running), `GetRTI` (status +
  overdue), `RTIRequests` (register list). 1 module test (acknowledge + list + still-overdue-after-ack).
- Integration: `FileRTI/AcknowledgeRTI/AnswerRTI/RTIRequests/RTIStatus` — every transition **audited** to the
  L5 chain; `platformd GET /rti` (list · `?id=` status incl. overdue) + `POST /rti {action:file|acknowledge|
  answer}`. 2 integration tests. Verified live: file → "filed" (clock starts) → acknowledge → "acknowledged"
  → answer → "answered" (overdue:false), each step audited; an answered RTI can't be re-acknowledged.
- Status page: **48 modules · 400 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Open-data CSV exports (CKAN-style downloads from L12 civic)
- Civic module: `SchoolsByDistrictCSV(tree)` (institutional aggregates: schools per district × management) and
  `EnrolmentCSV(dim, published, suppressed)` (k-anonymity person-level stat — suppressed cells rendered as
  "suppressed(<k)", never with a count). RFC-4180 via encoding/csv. 1 module test.
- Integration: `Platform.ExportDataset(id, cohort, k)` — only non-personal datasets are exportable
  (schools-by-district, enrolment-aggregates); unknown/PII datasets refused. `platformd GET
  /civic?download=ID` serves text/csv with a Content-Disposition attachment filename. 1 integration test.
- Verified live: /civic?download=schools-by-district → CSV w/ headers + real per-district mix (e.g.
  Chennai,2090,1362,312,312,104); /civic?download=enrolment-aggregates&cohort=30&k=5 → all small cells
  "suppressed(<k)". The L12 open-data promise is now downloadable + privacy-preserving.
- Status page: **48 modules · 402 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Scheme-DBT delivery workflow end-to-end (lawful basis → G-tier sanction → fund release → receipt)
- `Platform.DeliverDBT(ctx, DBTRequest)` — runs a welfare-scheme benefit end-to-end, **fail-closed** at every
  gate: validates the scheme against the seeded catalogue; requires a **§E DPDP lawful basis** (§7 subsidy) for
  the beneficiary (no money moves without one); **sanctions** the disbursement through the govtiers escalation
  (high-stakes → G4→G3→G2→G1 to the Cabinet, run on the real L6 workflow engine); **releases** funds on the
  local per-scheme `reconcile.FundLedger` (reconciled against PFMS when the adapter is live, B-022); mints a
  **verifiable, notarised BenefitReceipt credential**; and audits each step. Added `RecordSubsidyBasis`,
  `FundLedger`; `platformd POST /dbt`. 2 integration tests.
- Verified live: PUDHUMAI-PENN ₹1000 to a synthetic beneficiary → no-basis refusal first; after recording the
  subsidy basis → delivered:true, sanctioned:true, escalation [G4,G3,G2,G1], released/utilised 1000, receipt
  minted, audited. The §E consent register, G-tier escalation, L4 fund ledger, L7 credentials + notary, and L5
  audit all interlock in one welfare-delivery flow.
- Status page: **48 modules · 404 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## PFMS reconciliation surface (fund-flow leakage detection)
- `Platform.ReconcilePFMS(scheme, upstream)` + `platformd POST /pfms-reconcile` — reconciles a scheme's local
  fund ledger (from DBT deliveries) against the upstream PFMS figures (source of truth) using the L4 reconcile
  comparator: any money-field drift beyond the tight tolerance is **critical** (potential leakage/mis-posting),
  surfaced with a human-readable rationale for a reconciler. Advisory only — mutates nothing; audited. Upstream
  figures are supplied (live PFMS fetch gated B-022). 1 integration test.
- Verified live: after delivering ₹2000, PFMS=2000/2000/2000 → Reconciled (clean, 0 critical drift);
  PFMS utilised=900 vs local 2000 → Flagged, 1 critical drift ("Count drift beyond 1% tolerance on Utilised —
  investigate the local figure against the state master"). This is the brief's "no leakage, no manual
  reconciliation" made operational.
- Status page: **48 modules · 404 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## APAAR student-enrolment flow (federate → reconcile → enrol into the estate)
- `Platform.EnrolViaAPAAR(ctx, APAAREnrolment)` — an APAAR-anchored enrolment end-to-end, fail-closed:
  **reconciles** the upstream APAAR identity (source of truth) against the school's submitted record via the L4
  comparator and **blocks on any identity-critical drift** (no enrolment on a mismatched name/DOB/id — a human
  verifies); requires the **target school to exist in the T0–T6 estate** (UDISE = a real T6 leaf, district
  resolved from its T3 ancestor); records the **§7 legal-obligation lawful basis** (RTE/UDISE+); and issues a
  **verifiable, notarised EnrolmentRecord credential**. Every step audited. `platformd POST /enrol`. 3
  integration tests.
- Verified live: defaults → enrolled:true, reconciled:true, district Chennai, UDISE 33030004181, credential
  minted; name+DOB mismatch → refused, critical_drift 2 ("Identity-critical drift on Name, Date of birth —
  verify before trusting either copy"); unknown UDISE → refused. The L4 APAAR adapter, reconcile drift check,
  L6 tenancy, §E consent, L7 credentials+notary and L5 audit all interlock in one enrolment.
- Status page: **48 modules · 407 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Student 360 / journey view — one identity, one auditable record
- Civic: `GrievancesBy(filer)` query. Integration: `Platform.StudentJourney(apaarID)` assembles a learner's
  complete record across the verticals — the §E **lawful bases** (AccessReport), the **grievances** they raised
  (L12), and the full **audit timeline** of platform actions about them, reconstructed straight from the
  tamper-evident L5 chain (re-verified). Read-only + derived: the record can't show an action the chain doesn't
  contain. `platformd GET /journey?apaar=`. 2 integration + (civic GrievancesBy covered) tests.
- Verified live (after enrol → DBT → grievance for one learner): lawful_bases [enrolment/legal-obligation,
  scheme-dbt/subsidy], 1 grievance (block, open), 8-event timeline (enrol.apaar → 4× G-tier workflow → dbt.
  deliver → grievance.route), audit_chain_verified:true. This is the brief's "every directorate, every district,
  every school answers the same question with the same number" — the learner's single source of truth.
- Status page: **48 modules · 409 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Per-learner verifiable-credential wallet (signature + notary inclusion proof, verified on read)
- The platform now **indexes every issued credential by subject** (admission/enrolment/DBT receipts →
  `recordCredential`, wired into all three issuers). `Platform.Wallet(apaarID)` returns the learner's
  credentials, each **re-verified end-to-end on read** via `credentials.Verify` — the issuer ed25519 signature
  AND the notary Merkle inclusion proof — so any relying party can confirm a credential is genuine + tamper-
  evident, not merely listed. `platformd GET /wallet?apaar=`. 2 integration tests.
- Verified live (enrol + DBT for one learner): wallet count 2 — EnrolmentRecord (udise/class/category) +
  BenefitReceipt (₹1000 disbursed) — both valid:true (signature + inclusion proof), all_valid:true. This is the
  brief's "portable credentials (NFT)" — verifiable, portable, tamper-evident — made real on the notary.
- Status page: **48 modules · 411 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Credential-revocation registry (closes issue → anchor → verify → revoke)
- `Platform.RevokeCredential(credID, by, reason)` + `RevocationStatus` — the NDEAR-S credential revocation
  registry: a revoked credential is recorded (audited) and thereafter fails verification, **even though its
  ed25519 signature + notary inclusion proof remain mathematically valid** (revocation is an authoritative
  status the verifier must consult). The wallet folds it in: a revoked entry is `valid:false, revoked:true`
  with a `REVOKED` failure, and the wallet is no longer all-valid. `platformd POST /revoke`. 2 integration
  tests.
- Verified live: enrolment credential valid:true → revoke (by DEO-Chennai, audited) → wallet shows valid:false,
  revoked:true, failures [REVOKED], all_valid:false. The credential lifecycle (issue → anchor → verify →
  revoke) is now complete and trust-correct.
- Status page: **48 modules · 413 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Student transfer / portability ("a child who moves … does not start over")
- `Platform.TransferStudent(ctx, TransferRequest)` — moves a learner between schools while **preserving their
  journey**: validates the destination is a real T6 school in the estate; **revokes** the prior enrolment
  credential (kept in the wallet, flagged revoked); issues a **fresh enrolment credential at the new school**
  under the same APAAR id (so wallet + journey + lawful basis carry across); resolves both districts; audits
  the move. Enrolment credential ids are now school-specific (`ENR-<apaar>-<udise>`) so transfers produce
  distinct records. `platformd POST /transfer`. 2 integration tests.
- Verified live: Tirunelveli → Tiruvallur — transferred:true, old cred (…-33300053701) revoked, new cred
  (…-33330059101) valid, history_preserved:true; the wallet shows the revoked prior enrolment + the valid new
  one, and the journey grows (does not reset). Exactly the brief's portable-identity promise.
- Status page: **48 modules · 415 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Cohort analytics / early-warning surface (L8 anomaly detection over the estate)
- `Platform.CohortAnomalies(indicator, z)` + `platformd GET /cohort-analytics?indicator=&z=` — runs the L8
  analytics **z-score anomaly detector** (`engines.Anomalies`) over a per-district indicator series across all
  38 real districts, flagging the **early-warning** outliers (district + value + z + high/low direction). The
  district structure is real (seed.Districts); the indicator values are **synthetic/illustrative** (live
  operational telemetry — attendance/dropout/FLN — is gated on the federated substrate, B-022), honestly
  declared `synthetic:true`. Deterministic. 2 integration tests.
- Verified live (dropout-risk, z=2): mean 49.6, flagged Nilgiris (91, z=4.79, high) + Ramanathapuram (22,
  z=-3.19, low). The Governance/early-warning agent surface — "surface risk in an indicator for an officer" —
  is now real over the populated estate.
- Status page: **48 modules · 417 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Policy-lever simulation (Policy agent → projection → human sanction)
- `Platform.SimulatePolicyLever(ctx, req)` — the L9 Policy agent projects a lever's **coverage/cost/equity**
  impact (L8 Policy engine, over the §D.1 1.27 Cr default population) and, because it is **high-stakes, never
  auto-adopts**: the adoption is routed to the HITL queue for a **sanctioning authority** (policy.sanction
  scope). `DecidePolicyLever` records the lever as adopted (HITL executor `policy.adopt` branch) only on human
  approval; rejection stops it. `platformd POST /policy`, GET/POST `/policy-queue`. 2 integration tests.
- Verified live: "Free-cycle scheme expansion to Class 9" (coverage 0.6, +0.25, ₹4500/unit, equity 0.8) →
  projection 60%→85%, +31.75 L newly covered, ₹14,287.5 cr, equity 0.20; requires_approval:true, queued
  TR-0001; MINISTER approves → "policy lever adopted". AI assists; the human authority decides — every decision
  reversible + audited.
- Status page: **48 modules · 419 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Compliance-findings surface (Compliance agent → statute-cited findings → human sign-off)
- `Platform.CheckCompliance(ctx, req)` — the L9 Compliance agent forward-chains a **regulatory rule base**
  (RTE 2009 §12/§16/Schedule · RPwD 2016 §16 · DPDP 2023 §6 · POCSO 2012) over a school's facts (L8 reasoning
  engine), deriving **statute-cited non-compliance findings**. Findings are **high-stakes**: routed to the HITL
  queue for a **compliance officer** (compliance.sign scope) to sign off; a clean school records no findings.
  `SignoffCompliance` records the sign-off (HITL executor `compliance.signoff` branch). `platformd POST
  /compliance` + `/compliance-signoff`. 2 integration tests.
- Verified live: a school with EWS-quota-not-met / no-accessible-infra / no-consent / detention → 4 findings
  citing DPDP §6, RPwD §16, RTE §16, RTE §12; requires_signoff:true, queued; G6-Compliance signs off (audited).
  A fully-compliant school → clean, no sign-off. The 6th agent (Compliance) is now live end-to-end.
- Status page: **48 modules · 421 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Estate-wide compliance sweep (Compliance rule base rolled up by statute + district)
- `Platform.ComplianceSweep(n)` + `platformd GET /compliance-sweep?n=` — runs the regulatory rule base
  (RTE/RPwD/DPDP/POCSO) over a deterministic sample of schools spread across the whole estate and rolls up:
  schools-checked, schools-with-findings, total findings, **by statute**, and **by district** (+
  `TopComplianceDistricts`). Read-only/analytical (the per-school HITL sign-off stays on the single-school
  check). The estate/UDISE/district are real; the compliance facts are **synthetic/illustrative** (live
  inspection data gated, B-022), declared `synthetic:true`. Refactored the finding-derivation into a shared
  `deriveComplianceFindings`. 2 integration tests.
- Verified live (n=2000): 955/2000 schools with findings (1206 total); by statute RPwD §16 (394) > RTE §12
  (290) > RTE Schedule (180) > DPDP §6 (148) > POCSO (100) > RTE §16 (94); top districts Theni/Coimbatore/
  Thoothukudi. The directorate's single compliance operating picture across the State.
- Status page: **48 modules · 423 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## CI status note
- Diagnosed the "some jobs were not successful" report: all four workflows (CI · platform · security · NodeJS-
  with-Gulp) are GREEN on the latest commits. The historical failures were (a) old CI failures on long-
  superseded commits and (b) the default "NodeJS with Gulp" starter, which was already rewritten to run the
  real tsc + next build (Node 20.x/22.x) and now passes. No current failing job.

## Built pending federation — 8 more sovereign-DPI adapters (5 → 13 of 21)
- HONEST NOTE on "build all the pending": most pending items are NOT code (physical substrate — HSM/K8s/8
  datastores/GPU/Besu/IoT/Edge; real population PII; external CAG/UNESCO audits; explicitly out-of-scope states/
  national tier). Those cannot be fabricated. The genuinely-buildable pending slice is the FEDERATION code, so:
- `platform/L4-integration/adapters` — built the 8 remaining named sovereign-DPI anti-corruption adapters
  (HRMS-TN teacher registry · IFMS-TN treasury · PM-POSHAN/CMBS mid-day-meal · ICDS Anganwadi · CBSE
  affiliation · TN State Board/DGE results · BSP/APBS DBT settlement · telco SMS DLR), each on the shared
  resilient `core` (breaker + bounded retry) with a DTO → domain ACL transform. 8 tests (httptest). Live
  endpoints/creds still gated on MoUs (B-022) — the code is ready to plug in.
- NDEAR-S register updated: REG-TEACHER (→HRMS) and FIN-DBT (→BSP/APBS) move from pending to federated →
  **28/29 addressed** (only ID-AUTH/Keycloak pending, infra B-010). Conformance diff updated: L4 adapters
  **13 of 21** (was 5).
- Status page: **48 modules · 431 tests**. Green bar: 48 Go modules pass, OPA 33/33, tsc 0 errors.

## Built the absent tech-fabric seams — Edge CRDT (L2) + IoT mesh (L4) + deployment skeleton
- `platform/L2-infrastructure/edge` — offline-first **CRDT sync** (LWWRegister · GCounter · ORSet add-wins);
  state-based, conflict-free, converges with **no coordinator + no lost writes** (K3s/Pi5 hardware gated B-010).
  4 tests incl. convergence + add-wins. Fills the L2 layer (previously YAML-only).
- `platform/L4-integration/iot` — IoT-mesh **telemetry ingestion**: classify (biometric attendance = Class-1)
  → **residency gate** (offshore Class-1 quarantined, never stored) → timeseries `Sink` seam → audit; plus a
  device `Fleet` with **OTA** roll-out (online devices update; offline reconcile on reconnect). 2 tests.
- Wired: `Platform.IngestTelemetry/TelemetryStored/OTARollout/FirmwareSpread/EdgeConvergenceDemo`; platformd
  `POST /iot`, `GET /iot-ota`, `GET /edge`. 3 integration tests. Verified live: offshore biometric → quarantined
  (Class-1 residency); OTA v2 → BIO-1 (online), spread {v1:2,v2:1}; edge 28+31 → converged 59, consistent,
  add-wins APAAR-2 survives.
- **Deployment skeleton** (one `apply` from the substrate): `platform/deploy/k8s/platformd.yaml` (Namespace +
  Deployment + Service + HPA, non-root/read-only-rootfs/caps-dropped, readiness `/readiness` liveness
  `/healthz`, HPA→240 app replicas per the L10 capacity model) and a Helm chart `deploy/helm/platformd`.
- Status page: **50 modules · 440 tests**. Green bar: 50 Go modules pass, OPA 33/33, tsc 0 errors.

## Built the last absent tech-fabric element — Education DAOs (advisory to statutory authority)
- `platform/L11-governance/dao` — SMC (School Management Committee) councils whose members hold
  **NON-TRANSFERABLE soulbound badges** (TransferBadge always errors), deliberating proposals by
  one-member-one-vote with **quorum + threshold**. The defining rule: a passed proposal is **ADVISORY ONLY**
  (`Advisory=true, NeedsRatify=true`) — the council recommends, the statutory authority decides. Besu/Snapshot
  substrate gated (B-020). 3 module tests (soulbound non-transfer · members-only/one-vote · quorum/threshold).
- Wired: `Platform.DemoCouncilVote` runs a council deliberation and routes a passed (advisory) proposal to the
  **HITL queue** for the head teacher/BEO to **ratify** (`RatifyCouncil`, council.ratify scope; executor
  `council.ratify` branch). `platformd GET /council` + `POST /council-ratify`. 1 integration test. Verified
  live: SMC passes 3-1 (75%), advisory + needs_ratify, queued TR-0001; HEAD_TEACHER ratifies → audited.
- Status page: **51 modules · 444 tests**. Green bar: 51 Go modules pass, OPA 33/33, tsc 0 errors.
- MILESTONE: every advanced-tech-fabric element with an application-code dimension is now built —
  ML(analytics) · DL-seam · IoT mesh · Blockchain-analogue(notary) · NFT-analogue(credentials) · **Education
  DAOs** · Edge compute(CRDT) · RAG+MCP. Remaining pending is purely substrate/procurement/real-data/audits.

## Deepened the school taxonomy — every school classified across 5 TN dimensions
- `seed/schooltypes.go` — canonical TN school-taxonomy master data: **SchoolLevels** (Primary 1–5 · Upper-
  Primary 1–8 · High 1–10 · Higher-Secondary 1–12, grade spans), **SchoolCategories** (8 management forms:
  Government · Aided · Matriculation · Private-CBSE · Private-Unaided · Central(KV/JNV) · Social-Welfare ·
  Municipal), **Mediums** (Tamil-first), **GenderTypes** (Co-ed/Girls/Boys), **ResidentialTypes** (Day/
  Residential/KGBV). 1 test.
- `population` — every one of the 69,000 materialised schools is now stamped on **all five dimensions**
  (management · level+grades · medium · gender · residential) at realistic TN distributions; `Summary` rolls up
  all five mixes; `FilterSchools(SchoolFilter)` queries across them. Tests assert each mix covers all 69,000 +
  realistic shape (Government/Primary/Tamil/Co-ed/Day pluralities, Girls schools + KGBV present).
- Surfaced: `Platform.SchoolsMatching` + enriched `PopulationSummary`; `platformd GET /population?district=&
  management=&level=&medium=&gender=&residential=` (deep filter) and a new open-data `schools-by-type.csv`
  (level × management cross-tab) export. 3 integration tests. Verified live: full 5-dimension mix over 69,000;
  Girls Hr-Sec in Chennai → 104 matches; schools-by-type CSV cross-tab.
- Status page: green. Green bar: 51 Go modules pass, OPA 33/33, tsc 0 errors.

## School 360 / institutional profile (the institution counterpart to the student journey)
- `Platform.SchoolProfile(udise)` — assembles a school's complete auditable record across the layers: the full
  **taxonomy classification** (management · level+grades · medium · gender · residential), its **T0–T6
  governance chain** (`GovernancePath` + owning directorate/district/block/cluster), its **IoT device fleet**
  (`fleet.DevicesAt`), a **compliance snapshot** (rule base over the school's facts → compliant iff no
  findings), and the **count of audit records** concerning it. The estate is indexed by UDISE once (lazy map)
  for O(1) lookup. `SchoolComplianceSignoff` is the actionable variant (findings → HITL officer sign-off).
  Added `iot.Fleet.DevicesAt`; anchored the demo IoT fleet to real estate schools. `platformd GET
  /school?udise=`. 3 integration tests.
- Verified live: Chennai school 33030004181 → Government Primary (1–5), Tamil/Co-ed/Day, governance path
  "TN (Sovereign) → Secretariat → DSE → Chennai → Block → Cluster → School", directorate/district/block/cluster
  resolved; school 33010000001 → 2 IoT devices (BIO-1 biometric + ENV-1 environment).
- Status page: green. Green bar: 51 Go modules pass, OPA 33/33, tsc 0 errors.

## Teacher / staff onboarding via HRMS (the staff counterpart to APAAR student enrolment)
- `Platform.OnboardTeacher(ctx, TeacherOnboarding)` — HRMS-anchored staff onboarding end-to-end, fail-closed:
  **reconciles** the upstream HRMS identity (emp-id + name identity-critical) against the school's submitted
  record via the L4 comparator and **blocks on critical drift**; requires the **posting school to exist in the
  T0–T6 estate** (district resolved from its T3 ancestor); records the **§7 employment lawful basis** (HRMS
  service record, 50y retention); issues a **verifiable, notarised ServiceRecord credential** that lands in the
  staff member's wallet. Added the `staff-hrms` consent purpose. `platformd POST /staff-onboard`. 3 integration
  tests.
- Verified live: clean → onboarded:true, reconciled:true, district Chennai, service credential minted +
  wallet-verifiable; name mismatch → refused, critical_drift 1 ("Identity-critical drift on Name — verify…");
  unknown school → refused. The L4 HRMS adapter, reconcile, L6 tenancy, §E employment basis, L7 credentials +
  notary and L5 audit all interlock — and the platform now onboards BOTH students (APAAR) and staff (HRMS).
- Status page: green. Green bar: 51 Go modules pass, OPA 33/33, tsc 0 errors.

## Teacher 360 / service-record view (completes the student · school · teacher triad of 360 views)
- `Platform.TeacherProfile(empID)` — the staff-360 record assembled across the layers: the §E **employment
  lawful basis**, the **postings** derived from the verifiable ServiceRecord credentials (`CurrentPosting` = the
  non-revoked, verifying one), the full **verifiable wallet**, and the **audit timeline** (reconstructed from
  the L5 chain, re-verified). Read-only + derived. `platformd GET /staff?emp=`. 3 integration tests.
- Verified live (after onboarding E-1001 at a Chennai school): found:true, lawful basis staff-hrms/employment,
  current_posting SVC-E-1001-33030004181 (PG Assistant, teaching, valid), wallet 1 cred all_valid, audit
  timeline [staff.onboard], chain verified. A revoked posting (transfer/retire) leaves the history but no
  current posting — same trust model as the student wallet.
- The platform now has all three 360 views: **student journey** (learner) · **school profile** (institution) ·
  **teacher profile** (staff) — each a single auditable record assembled live across L1–L12.
- Status page: green. Green bar: 51 Go modules pass, OPA 33/33, tsc 0 errors.

## Sovereign Operations Console (super-admin for the entire VASA-EOS-SE-TN platform)
- `Platform.SovereignConsole(actorRole)` — the T0 super-admin operating picture of the WHOLE platform, role-
  gated (SUPERADMIN/SECRETARY/MINISTER): off-switch state · live conformance (12 layers · 7 G-tiers · 6/6
  engines/agents · 13 portals · 391 modules) · tenancy estate (73,232 nodes · 69,000 schools · valid) · NDEAR
  28/29 · model-card SLA · the §F.2 SLA board · civic backlog (grievances/RTI) · audit+notary tamper-evidence
  counters · a computed `go_live_ready`. **Fail-closed**: a non-super-admin gets an unauthorised, empty console
  (nothing disclosed). Plus the T0 **kill-switch** as super-admin-only actions (`SovereignDisable/Enable`,
  audited; non-super-admin denied). `platformd GET /sovereign?role=` (403 if unauthorised) + `POST
  /sovereign-offswitch`. 2 integration tests.
- Verified live: SUPERADMIN → full picture, go_live_ready:true; TEACHER → HTTP 403, authorised:false, 0 nodes;
  off-switch — TEACHER denied, SECRETARY engages → off_switch_engaged:true, go_live_ready:false.
- Status page: green. Green bar: 51 Go modules pass, OPA 33/33, tsc 0 errors.

## Jurisdiction-scoped officer operating dashboard (CRC/BEO/DEO/Director)
- `Platform.OfficerDashboard(nodeID)` — the field-officer counterpart to the sovereign console: the operating
  picture of ONLY the schools a tenant node governs, via the T0–T6 **downward-governance scope**
  (`LeavesUnder(node, 6)`). For each governed school it rolls up the full 5-dimension taxonomy mix
  (management · level · medium · gender · residential), runs the regulatory **compliance sweep**
  (RTE 2009 / RPwD 2016 / DPDP 2023 / POCSO 2012, statute-cited) and counts IoT devices — all scoped to the
  subtree. A district officer sees their district; a block officer sees their block; **nobody sees outside
  their subtree** (an unknown node resolves to nothing — fail-closed). `platformd GET /officer?node=` (404 if
  unknown). 3 integration tests (district scope == governance scope · every mix sums to the governed schools ·
  block strictly narrower than its district · unknown node discloses nothing).
- Verified live: `/officer?node=TN-DIST-Chennai` → tier District, governance_path T0→Secretariat→DSE→Chennai,
  2,090 schools governed, mixes summing to 2,090 (Tamil 1,362 · Govt 1,357 · Primary 1,154 · Co-ed 1,778 …),
  compliance sweep citing all six statutes across 1,032 schools-with-findings; unknown node → HTTP 404.
- Status page: green. Green bar: 51 Go modules pass, OPA 33/33, tsc 0 errors. 463 tests.

## User Directory & unified five-model IAM (Access Explorer + User Management) — Go
- New L5-security module `directory` — the User Directory + a single Policy Decision Point that composes ALL
  FIVE access models over one request, deny-wins / fail-closed, with a full per-model trace:
  - **RBAC** — a 19-role catalogue covering every user category across the governance hierarchy (STUDENT ·
    PARENT · TEACHER · HEAD_TEACHER · CRC_COORDINATOR · BEO · DEO · CEO · DIRECTOR · SECRETARY · MINISTER ·
    SUPERADMIN · AUDITOR · ETHICS_CHAIR · ARCHITECT · PIO · CITIZEN · VENDOR · RESEARCHER), each with action
    grants (SUPERADMIN wildcard).
  - **ABAC** — subject/resource attribute gates: suspended → deny · teaching-cadre gate on marks/attendance ·
    sensitive→public/partner deny · pii→researcher deny.
  - **ReBAC** — jurisdiction gate delegated to the live tenancy `Governs()` (downward governance over the 73k
    tree): a permit on a scoped resource requires the subject's org unit to govern the resource's org unit.
  - **PBAC** — statute routes high-stakes actions (release:fund · sanction:scheme · adopt:policy · sign:audit)
    to **require-approval**, never a silent permit (PFMS/GFR · TN Financial Code · Cabinet rules · CAG).
  - **CABAC** — elevated actions (override:lockdown · declare:emergency) permitted ONLY inside an emergency
    window and never at high threat.
  - `Decision{Effect, DecidingModel, Reason, Trace[]}` — every model's verdict is recorded so the Access
    Explorer can show exactly why a request was permitted / denied / routed to approval.
- Integration wiring (`directory.go`): a per-Platform directory seeded with one synthetic (SYN-) user of every
  category bound to a REAL org unit — the Chennai field chain (district→block→cluster→school) resolved from the
  live tenancy tree. `Platform.DirectorySummary()` (user-management roll-up + role census + catalogue),
  `Platform.AccessExplain(user, action, resource, ctx)` (reverse "why can/can't this person do X" lookup),
  `Platform.DirectoryScopedBy(org)` (the same downward-governance scope applied to the user list).
- `platformd`: `GET /directory` (+ `?scope=<org>` for jurisdiction-scoped user lists) and
  `GET /access-explain?user=&action=&resource_org=&sensitive=&pii=&emergency=&threat=` (404 unknown user).
- Verified live: 19 users / 19 roles / 5 models; DEO read in-district → permit (RBAC, ReBAC governs);
  out-of-district → deny by ReBAC; SECRETARY release:fund → require-approval by PBAC; MINISTER declare:emergency
  → deny by CABAC normally, permit inside the window; CITIZEN + sensitive → deny by ABAC; unknown user → 404.
  Directory scope: TN sees all 19, Chennai district sees a strict subset (never the Secretary above it),
  unknown subject sees nobody.
- Green bar: 52 Go modules pass, OPA 33/33, gofmt clean. 478 tests.

## Events & Academic Calendar with dynamic multi-level approval (Go L6)
- New L6 module `calendar` — plan the academic year as durable, jurisdiction-scoped entries (terms · exams ·
  holidays · PTM · events), CRUD-complete, filterable by type/year, always returned in date order:
  - `Entry{Title,Type,StartDate,EndDate,OrgUnit,AcademicYear,Status,Chain[],CurrentStep,...}` with date
    validation (YYYY-MM-DD, start≤end) and an immutability rule (in-flight/published entries can't be edited).
  - `Store`: Create · Get · Update · Delete · List(Filter{Type,Year,Orgs}) — date-ordered.
  - **Multi-level approval state machine**: `Submit(id, chain)` opens a chain; `Act(id, approve, role, scopes)`
    advances level-by-level, **fail-closed** (actor must hold the level's role AND required scope), publishes on
    the last approval, and a reject stops the chain. An empty chain auto-publishes (zero-stakes local entry).
  - `Summarise()` (dashboard roll-up: by type/status, pending backlog, published, upcoming feed) and
    `PendingFor(role)` (the role-gated approval inbox).
- Integration (`calendar.go`): **dynamic chain sizing** — `chainFor(type, orgUnit)` derives the number of
  approval levels from the entry type AND the tenancy level it applies to, materialising each level from the
  L11 govtiers register (G-code → approver role + required scope):
  - state/board examination (T0–T2) → **G4→G3→G2→G1** (Cabinet); district exam (T3) → G4→G3→G2; school exam →
    G4→G3 · holidays → G4→G3→G2 (wide) / G4→G3 · terms → up to G4→G3→G2 · school PTM → single G4 · school event
    → none (head-teacher authority, auto-publish).
  - `AddCalendarEntry` · `SubmitCalendarEntry` · `DecideCalendarEntry` (all audited) · `CalendarEntries(scope,
    type, year)` (downward-governance scoped + filtered + date-ordered) · `CalendarDashboard(scope, asRole,
    from)` (realtime: totals by type/status, pending approvals, the role's own inbox, upcoming published feed).
  - Seeded AY 2026-2027 anchored to REAL org units: ratified state terms/holidays (published), the SSLC/HSC
    board exams (live in approval), a Chennai district quarterly exam, and a real Chennai school's PTM + events.
- `platformd`: `GET /calendar?scope=&type=&year=&as=&from=` (dashboard; `&list=1` for the raw date-ordered
  list), `POST /calendar` (add; `?submit=1` routes into the dynamic chain), `POST /calendar/decide` (act).
- Verified live: TN dashboard 11 entries / 7 published / by-type+by-status / date-ordered upcoming feed; adding
  a state board exam materialises G4→G3→G2→G1; wrong role at level 1 denied (fail-closed); full G4→G3→G2→G1 walk
  publishes; district scope (4) is a strict subset of state (12).
- Green bar: 53 Go modules pass, OPA 33/33, gofmt clean. 488 tests.

## Examinations & Results with IAM-gated marks entry (Go L6)
- New L6 module `exams` — the lifecycle AFTER an exam is scheduled on the calendar: a marks `Sheet` per exam,
  CRUD-addressable per student, moving open → submitted → published / returned:
  - `Enter` (open/returned only, range-checked) · `Submit` (locks + computes TN grade bands A1..E + pass@35%)
    · `Moderate(approve)` (publish or return for correction) · `Analytics` (entered/pass/fail, pass%, mean,
    highest, grade distribution) · `Register` + `Summarise` for multi-sheet roll-up.
- Integration (`exams.go`): every mutation gated by the SAME unified five-model PDP — so the access models are
  load-bearing, not decorative:
  - `EnterMarks` / `SubmitMarksSheet` → `write:assessment` (teaching-cadre **ABAC** + jurisdiction **ReBAC**).
  - `ModerateMarksSheet` → `write:school` (head-teacher authority) — **separation of duties**: a teacher who can
    enter marks cannot moderate them.
  - `ExamSheet` (single sheet detail + analytics) · `ExamResultsDashboard(scope)` (downward-governance scoped:
    sheets governed, by-status, aggregate pass%, per-subject analytics). Seeded 3 sheets at a real Chennai
    school across the lifecycle (open/submitted/published) with synthetic SYN-STU cohorts + deterministic marks.
- `platformd`: `GET /exams?scope=` (results dashboard) · `GET /exams?exam=<id>` (sheet detail) ·
  `POST /exams/marks` (PDP-gated entry) · `POST /exams/lifecycle` (submit / moderate).
- Verified live: TN dashboard 3 sheets (open/submitted/published), 90 results, overall pass 70%, per-subject
  pass%/mean; teacher allowed to enter marks, **citizen and DEO denied by the ABAC cadre gate**, unknown actor
  denied; moderation — teacher denied by RBAC (no write:school), head teacher publishes; grade distribution
  A1..E surfaced on the published Tamil sheet.
- Green bar: 54 Go modules pass, OPA 33/33, gofmt clean. 498 tests.

## Production-wiring the Academic Calendar: durable PostgreSQL store (no in-memory when configured)
- Answer to "is end-to-end-in-memory avoidable?": YES for code I control — proven here on a real database.
  Refactored the calendar domain into PURE transitions (`ApplySubmit`/`ApplyAct`/`ApplyUpdate` in
  `calendar/transitions.go`) so the in-memory `Store` and a new Postgres adapter apply identical rules.
- New `platform/integration/calendar_pg.go` — a REAL PostgreSQL adapter (`database/sql` + `jackc/pgx/v5`):
  `calendar_entries` table (approval chain as JSONB), full CRUD + Submit/Act, `ensureSchema()` auto-migrate.
  `calStore` interface; `calendarState()` selects the **durable Postgres store when `DATABASE_URL` is set**,
  in-memory only as the credential-free fallback (logged). Idempotent seeding (PK collisions ignored) so data
  survives restarts. Migration of record: `scripts/081-create-calendar-entries-table.sql`.
- Dependency: pinned `jackc/pgx/v5 v5.6.0` (+ x/text v0.14, x/sync v0.6) — max go floor across the graph is
  1.22, so CI's Go 1.22 still builds it; no `toolchain` directive; `go mod verify` clean.
- CI: added a **PostgreSQL 16 service** to `.github/workflows/platform.yml` + a dedicated step
  (`go test -run TestPg` with `DATABASE_URL`) so the durable path runs in CI against a live DB — NOT skipped.
- PROVEN LIVE (raw):
  - `TestPgCalendarDurable` PASSES against live Postgres — CRUD + 4-level approval persist across NEW store
    instances (fresh connection pools), publication + delete durable, edit-after-publish rejected.
  - platformd booted `live-opa(...)` + `DATABASE_URL`; `POST /calendar PERSIST-001` written, confirmed in
    Postgres via independent `psql`; process KILLED; a FRESH platformd served `PERSIST-001` back (12 durable
    entries) — the audit's "in-memory vanishes on restart" failure is fixed for this vertical.
- Green bar: 54 Go modules pass (in-memory sweep), durable PG test passes, OPA 33/33, gofmt clean. 499 tests.
- HONEST scope: this productionises ONE vertical (calendar) as the pattern; the other verticals follow the same
  adapter approach. Still genuinely gated (not buildable by me): live government DPI credentials (APAAR/UDISE+/
  PFMS/DigiLocker), HSM/State Data Centre, real PII — those are wired-and-waiting seams, not mocks of record.

## Production-wiring vertical 2: Examinations & Results → durable PostgreSQL
- New `platform/integration/exams_pg.go` — real PostgreSQL adapter for marks sheets: `exam_sheets` +
  `exam_results` tables (FK + ON DELETE CASCADE), every op rehydrates the sheet via new `exams.LoadSheet`,
  applies the SAME domain method (Enter/Submit/Moderate) as the in-memory store, and saves it back in a
  transaction. `examStore` interface; `examState()` selects the durable Postgres store when `DATABASE_URL` is
  set, in-memory otherwise. Marks entry/submit/moderate still gated by the unified five-model PDP.
  Migration of record: `scripts/082-create-exam-sheets-tables.sql`.
- PROVEN LIVE (raw): `TestPgExamsDurable` passes against live Postgres — marks, the lock+grade on submit, and
  moderation all persist across FOUR fresh store instances; locked-sheet entry rejected durably; analytics
  durable. platformd (live-opa + DATABASE_URL): teacher entered a mark via `POST /exams/marks` → confirmed in
  Postgres via independent psql (marks 91); head teacher `submit` via API → grade A1/pass=t computed and
  persisted in Postgres.
- Green bar: 54 Go modules pass (in-memory sweep), durable PG tests (calendar + exams) pass via the CI
  `TestPg` step against the live PostgreSQL service, OPA 33/33, gofmt clean.

## Production-wiring vertical 3 + the frontend↔backbone connection: Staff Leave & Approval
- Closes the audit's biggest gap ("the Next.js app never calls the Go platformd; two disconnected stacks").
- New L6 `leave` module — file a request → DYNAMIC multi-level approval whose depth is the number of days
  (principal always · +BEO over 5 days · +DEO over 15 days); pure transitions (NewRequest/ApplyDecide) shared
  by both stores. `platform/integration/leave.go` (+ scoped listing + role-gated approval inbox) and
  `leave_pg.go` (durable PostgreSQL adapter, chain as JSONB). platformd: `POST /leave`, `POST /leave/decide`,
  `GET /leave?scope=&status=&as=`. Migration of record: `scripts/083-create-leave-requests-table.sql`.
- THE CONNECTION: new `lib/platform-client.ts` (typed HTTP client to platformd; active when `PLATFORM_URL` is
  set). `app/leave-approvals/actions.ts` now routes file/decide/list through the Go backbone when configured
  (adapting the backbone leave.Request into the board's LeaveFlowRecord), with the existing Supabase/in-memory
  path as the credential-free fallback. So a frontend "Submit leave request" button → Next.js server action →
  HTTP → Go platformd → PostgreSQL, with OPA enforcement and a real audit chain.
- PROVEN LIVE (raw): `TestPgLeaveDurable` passes (20-day request routes principal→BEO→DEO; every decision
  survives fresh store instances; wrong-role fail-closed; list/filter durable). Against platformd
  (live-opa + DATABASE_URL): the EXACT request `platformFileLeave()` sends filed LV-DEMO-1 (16 days → 3-level
  chain) → confirmed in Postgres via psql; walked HEAD_TEACHER→BEO→DEO via `/leave/decide` to approved;
  DEO-first attempt fail-closed; final state durable in Postgres.
- Green bar (both stacks): 55 Go modules pass (in-memory sweep), 3 durable PG tests (calendar+exams+leave)
  pass via the CI TestPg step against the live PostgreSQL service, OPA 33/33, gofmt clean, tsc 0 errors. 505 tests.

## Production-wiring vertical 4: User Directory / IAM → durable PostgreSQL
- New `platform/integration/directory_pg.go` — durable PostgreSQL user store (`directory_users`: role, org unit,
  ABAC attributes as JSONB, suspension). `userDirectory` interface; `iamState()` selects the Postgres store when
  `DATABASE_URL` is set, in-memory otherwise; idempotent seed (upsert) refreshes the synthetic catalogue without
  disturbing real added users. `AccessExplain` now resolves the user from the store and runs the engine over it
  (so the five-model PDP decides over PERSISTED records). New `Platform.AddUser` (durable CRUD) + `POST /directory`.
- PROVEN LIVE (raw): `TestPgDirectoryDurable` passes — users persist across fresh store instances; idempotent
  update; rollups durable; the unified PDP decides over persisted users (in-jurisdiction read permit;
  out-of-jurisdiction ReBAC deny; a durably-suspended user ABAC-denied). Against platformd (live-opa +
  DATABASE_URL): `POST /directory` added a new DEO → confirmed in Postgres via psql → `/access-explain` over the
  persisted user returned permit (RBAC, in-jurisdiction); directory count grew durably.
- Green bar (both stacks): 55 Go modules pass (in-memory sweep), 4 durable PG tests
  (calendar+exams+leave+directory) pass via the CI TestPg step against the live PostgreSQL service, OPA 33/33,
  gofmt clean, tsc 0 errors. 506 tests.
- Durable, restart-surviving, PDP-enforced verticals now: Calendar · Exams · Leave (frontend-wired) · Directory/IAM.

## Production-wiring vertical 5: tamper-evident Audit chain → durable PostgreSQL
- Added an optional `Sink` to the pure L5 `audit` module (interface only — module stays stdlib): `NewWithSink`
  loads + RE-VERIFIES the persisted chain on startup and continues from its head; `Append` persists each sealed
  record before acknowledging and rolls back the in-memory append on a persist failure (memory/storage never
  diverge). Module tests: persist+reload+continue, tamper-on-load rejection, persist-failure rollback.
- New `platform/integration/audit_pg.go` — PostgreSQL audit sink (`audit_chain`: seq PK, UNIQUE hash, prev_hash
  links). `newAuditLog()` wires it into the Platform when `DATABASE_URL` is set; a persisted chain that fails
  verification at startup makes the platform refuse to run (fail-closed). Migration: `scripts/084`.
- PROVEN LIVE (raw): `TestPgAuditDurable` + `TestPgAuditPlatformDurable` pass — the chain survives fresh log
  AND fresh platform instances, re-verifies, continues contiguously, and a directly-tampered persisted row is
  rejected at startup. platformd restart proof: run 1 wrote 2 audited records (leave.file, leave.decide) to
  Postgres; a fresh process reported audit_records=2 / chain_intact=true and a new action continued the SAME
  chain (seq 3, prev_hash = seq 2's hash across the restart boundary); SQL self-join showed 0 broken links.
- Green bar (both stacks): 55 Go modules pass (in-memory sweep), 6 durable PG tests
  (calendar+exams+leave+directory+audit×2) pass via the CI TestPg step against the live PostgreSQL service,
  OPA 33/33, gofmt clean, tsc 0 errors. 511 tests.
- Durable, restart-surviving verticals now: Calendar · Exams · Leave (frontend-wired) · Directory/IAM · Audit chain.

## Unifying the two PDPs: the Next.js access guard delegates to the Go sovereign PDP
- Closes the audit's "TS and Go PDPs are separate code, could diverge" finding, and confirms the ADMIN-default
  is already gated: `resolveSubject()` returns a ROLE-LESS anonymous subject in a configured deployment (canDo
  denies); only the credential-free demo (no DB) falls back to a configurable DEMO_ROLE.
- Go: `Platform.EvaluateAccess(user, action, resource, ctx)` evaluates an EXPLICIT subject (not a pre-seeded
  user) against the unified five-model engine; new `POST /access-decide` endpoint exposes it. Test
  `TestEvaluateAccessExplicitSubject` (head teacher write:school permit · teacher RBAC-deny · role-less deny).
- TS: `lib/platform-client.platformDecideAccess()` calls `/access-decide`; new `lib/access/pdp-bridge.ts` maps
  the app's 17 portal roles + 12 guarded actions onto the Go PDP vocabulary (e.g. PRINCIPAL→HEAD_TEACHER,
  approve:leave→write:school, manage:users→manage:users, resolve:grievance→route:grievance). `lib/access/
  guard.ts canDo()` now consults the sovereign PDP first when `PLATFORM_URL` is set (authoritative for mapped
  actions); unmapped actions / a backbone blip degrade to the local PDP (which uses the real resolved role).
- PROVEN LIVE (raw): `/access-decide` over the mapped vocabulary — PRINCIPAL approve:leave→permit, TEACHER
  approve:leave→deny (RBAC), PUBLIC manage:users→deny, ADMIN manage:users→permit (wildcard), SECRETARY
  manage:users→permit, DEO resolve:grievance→permit, anonymous→deny (fail-closed). The frontend and the
  backbone now share ONE decision engine.
- Green bar (both stacks): 55 Go modules pass (in-memory sweep), 6 durable PG tests pass via the CI TestPg step
  against the live PostgreSQL service, OPA 33/33, gofmt clean, tsc 0 errors.

## Production-wiring vertical 6: Grievance Redressal cases (SLA auto-escalation) → durable PostgreSQL
- New L12 `grievance` module — a citizen grievance becomes a durable case handled by a tier of officers under
  an SLA. DISTINCT feature vs the AI grievance-routing in grievance.go: TIME-DRIVEN escalation. Category drives
  the chain (safety → HEAD_TEACHER·DEO·DIRECTOR, SLA 3d; financial → HEAD_TEACHER·BEO·DEO; others →
  HEAD_TEACHER·BEO, SLA 7d). Pure transitions (NewGrievance/ApplyResolve/ApplyReject/ApplyEscalate/Overdue).
- Integration `grievance_case.go` (named to avoid colliding with the existing routing feature):
  `FileGrievanceCase` · `HandleGrievanceCase` (resolve/reject/escalate, fail-closed handler gating) ·
  `EscalateOverdueCases` (the SLA sweep — every open case past due auto-escalates, "sla" actor) ·
  `GrievanceCaseDashboard` (scoped: by status/category, overdue count, open list) · `GrievanceCasesScopedBy`.
  Durable PG adapter `grievance_case_pg.go` (chain JSONB). platformd: `POST /grievance-case`,
  `POST /grievance-case/act`, `POST /grievance-case/sweep`, `GET /grievance-case?scope=&status=&list=`.
  Migration: `scripts/085-create-grievance-cases-table.sql`.
- PROVEN LIVE (raw): `TestPgGrievanceDurable` (file safety case → 3-tier chain; wrong-handler fail-closed;
  escalate + resolve persist across fresh instances) and `TestSLAAutoEscalation` (an overdue open case is
  auto-escalated, recording the "sla" actor) pass. platformd (durable audit + DATABASE_URL): filed a safety
  grievance (chain HEAD_TEACHER→DEO→DIRECTOR, SLA due +3d) → head teacher resolved at tier 0; a DEO acting at
  tier 0 was fail-closed ("needs HEAD_TEACHER"); both persisted in Postgres.
- Green bar (both stacks): 56 Go modules pass (in-memory sweep), 7 durable PG tests pass via the CI TestPg step
  against the live PostgreSQL service, OPA 33/33, gofmt clean, tsc 0 errors.
- Durable verticals now: Calendar · Exams · Leave (frontend-wired) · Directory/IAM · Audit chain · Grievance cases.

## Automatic SLA enforcement: background grievance sweeper inside platformd
- platformd now runs the grievance SLA sweep on a timer (`GRIEVANCE_SWEEP_SECONDS` > 0 → a background ticker),
  so an overdue case auto-escalates to the next tier WITHOUT an external cron — escalation is genuinely
  time-driven. The banner shows `sla-sweep <interval>` (or `off`); a new metric
  `vasa_grievance_sla_escalations_total` counts auto-escalations; each is written to the durable audit chain.
  Unit test `TestGrievanceSweeperConfig` (off by default / off at zero interval).
- PROVEN LIVE (raw): seeded an overdue open grievance directly in Postgres (due 2026-06-08), started platformd
  with `GRIEVANCE_SWEEP_SECONDS=2` → banner `sla-sweep 2s`; at +2s the log showed "auto-escalated 1 overdue
  grievance case(s): [SWEEP-1]"; the row moved tier 0→1 with `decided_by=sla, decision=escalated` (no manual
  call); `/metrics` reported `vasa_grievance_sla_escalations_total 1`; a `system:sla grievance.case.escalate.sla`
  record was persisted to the audit chain.
- Green bar (both stacks): 56 Go modules pass (in-memory sweep), 7 durable PG tests pass via the CI TestPg step
  against the live PostgreSQL service, OPA 33/33, gofmt clean, tsc 0 errors.

## Second frontend↔backbone flow: the grievance board → durable Go grievance-case service
- Extends the frontend↔backbone connection (after leave) to a second flow. `lib/platform-client.ts` gains
  `platformFileGrievance` / `platformActGrievance` / `platformListGrievance` (calling `/grievance-case`,
  `/grievance-case/act`). `app/grievance-approvals/actions.ts` now routes file/act/list through the Go backbone
  when `PLATFORM_URL` is set — adapting the backbone grievance.Grievance into the board's GrievanceFlowRecord
  (synthesising the workflow instance from the escalation chain), with a category mapper onto the canonical set
  and PRINCIPAL→HEAD_TEACHER role mapping. The existing in-memory/Supabase path remains the demo fallback.
- PROVEN LIVE (raw): the EXACT requests the grievance actions send drove the Go backend — filed a "safety"
  grievance (category mapped → 3-tier chain HEAD_TEACHER→DEO→DIRECTOR) confirmed in Postgres via psql; resolved
  at tier 0 (PRINCIPAL→HEAD_TEACHER) → status resolved; the list endpoint returned it as resolved. So a second
  frontend flow (grievance) now drives the durable, SLA-enforced, audited Go backbone over HTTP.
- Green bar: tsc 0 errors (TS-only change this turn); the Go backbone (56 modules, 7 durable PG tests, OPA
  33/33) is unchanged from the prior green sweep.

## Production-wiring vertical 7: durable Admission applications register (PII-free)
- The admission workflow computed + audited decisions but never persisted the APPLICATION. Added a durable
  applications register: `admission_store.go` (AdmissionApplication + interface + in-memory store + dashboard)
  and `admission_pg.go` (PostgreSQL adapter, upsert). `recordAdmission(req,res)` is called at each terminal
  outcome (admitted/denied/pending-approval/residency) — guarded to never persist an id-less request. NO
  cleartext PII is stored (the name is sealed under the tenant KEK during the workflow; only a pii_sealed flag
  is kept). `Platform.AdmissionApplicationRecord` + `AdmissionDashboard(tenant)`; `GET /admissions`. Migration:
  `scripts/086-create-admission-applications-table.sql`.
- Surfaced + fixed a latent bug: `recordAdmission` guards against an empty applicant id (the endpoint contract
  is camelCase — `applicantId` — which binds case-insensitively; a malformed snake_case body would otherwise
  collide on id="").
- PROVEN LIVE (raw): `TestPgAdmissionDurable` (admitted + pending records persist across fresh instances;
  post-HITL upsert to admitted is durable) and `TestAdmissionPersistsApplication` (the live EWS-reject workflow
  records a pending-approval application with its HITL request id; dashboard rolls it up) pass. platformd
  (live-opa + DATABASE_URL): admitted a GEN applicant (credential ADM-LIVE-A1) and an EWS reject → pending; the
  `admission_applications` table held both with proper ids, effect, credential id and pii_sealed — and NO PII;
  `/admissions?tenant=TN/Chennai` rolled them up by stage/category.
- Green bar (both stacks): 56 Go modules pass (in-memory sweep), 8 durable PG tests
  (calendar·exams·leave·directory·audit×2·grievance·admission) pass via the CI TestPg step against the live
  PostgreSQL service, OPA 33/33, gofmt clean, tsc 0 errors.

## Closing the admission loop: durable HITL finalisation
- `Platform.FinaliseAdmission(ctx, requestID, approve, officer)` resolves a pending-approval admission
  end-to-end: a scoped officer decides the HITL request (admission.decide, fail-closed) and the DURABLE
  application record is flipped to its final stage. Child-protective RTE semantics: requested reject + APPROVE
  → denied (rejection upheld); requested reject + REJECT → admitted (overturned in the child's favour, credential
  minted+anchored); requested admit + APPROVE → admitted; requested admit + REJECT → denied. `POST
  /admissions/finalise`.
- PROVEN LIVE (raw): `TestFinaliseAdmissionUpdatesPersistedRecord` passes (pending → overturn admits + issues
  ADM-credential, record finalised with no dangling request id; upheld rejection denies; unknown request id
  errors). platformd (live-opa + DATABASE_URL): an EWS reject → pending-approval (request TR-0001, persisted);
  the reviewer overturned it (approve=false) → the durable row flipped from pending-approval/TR-0001/no-cred to
  admitted / cleared-request / credential ADM-FE-EWS.
- Green bar (both stacks): 56 Go modules pass (in-memory sweep), 8 durable PG tests pass via the CI TestPg step
  against the live PostgreSQL service, OPA 33/33, gofmt clean, tsc 0 errors.

## Sovereign Console surfaces live durable operations
- The T0 super-admin console now shows the LIVE operating state of the durable workflow verticals, not just
  conformance figures: a new `operations` block rolls up admissions (+pending review), grievance cases
  (+overdue), leave (+pending), exam sheets, calendar entries and directory users — with a `durable` flag
  (true when DATABASE_URL is set, so the counts are persisted). Read-only; role-gated like the rest of the
  console (a non-super-admin sees nothing).
- PROVEN LIVE (raw): `TestSovereignConsoleSurfacesLiveOperations` passes (the driven EWS admission + filed
  grievance + seeded exams/calendar/directory all reflected; a TEACHER sees zero operations). platformd
  (live-opa + DATABASE_URL): after driving a pending EWS admission and a grievance, `/sovereign?role=SUPERADMIN`
  reported operations.durable=true, admissions 6 (pending 2), grievance_cases 5, leave 3, exam_sheets 3,
  calendar 12, directory_users 22 — all from the durable Postgres stores; `role=TEACHER` → HTTP 403.
- Green bar (both stacks): 56 Go modules pass (in-memory sweep), 8 durable PG tests pass via the CI TestPg step
  against the live PostgreSQL service, OPA 33/33, gofmt clean, tsc 0 errors.

## Prometheus gauges for the durable operational backlogs
- `/metrics` now exposes the live operating state of the durable verticals as Prometheus gauges, so ops can
  alert on backlogs: `vasa_store_durable` (1=persisted), `vasa_admissions` + `vasa_admissions_pending_review`,
  `vasa_grievance_cases` + `vasa_grievance_overdue`, `vasa_leave_requests` + `vasa_leave_pending`,
  `vasa_exam_sheets`, `vasa_calendar_entries`, `vasa_directory_users`. Sourced live from the persisted stores
  via a new exported `Platform.Operations()` (aggregate counts only, no PII — `/metrics` is unauthenticated).
- PROVEN LIVE (raw): the endpoint test asserts the new gauges; platformd (live-opa + DATABASE_URL) scrape
  returned `vasa_store_durable 1`, `vasa_admissions 6`, `vasa_admissions_pending_review 2`,
  `vasa_grievance_cases 5`, `vasa_grievance_overdue 0`, `vasa_leave_requests 3`, `vasa_leave_pending 1`,
  `vasa_exam_sheets 3`, `vasa_calendar_entries 12`, `vasa_directory_users 22` — all from the durable stores.
- Green bar (both stacks): 56 Go modules pass (in-memory sweep), 8 durable PG tests pass via the CI TestPg step
  against the live PostgreSQL service, OPA 33/33, gofmt clean, tsc 0 errors.

## Citizen-facing grievance tracker (public, PII-suppressed)
- `Platform.GrievancePublicStatus(id)` + public `GET /track/grievance?id=` — a citizen tracks their grievance
  ticket with no authentication. The view is PII-SUPPRESSED by construction: it returns only the ticket id,
  category, status, the handling tier (role), the SLA filed/due dates and the escalation count — never the
  complainant identity OR the free-text complaint (both of which may carry PII). Unknown ticket → not-found.
- PROVEN LIVE (raw): `TestGrievancePublicStatusSuppressesPII` files a grievance with PII in the complainant +
  subject and asserts none of it (name/phone/child-name/complaint text) appears in the public view. platformd
  (durable + DATABASE_URL): filed PUB-1 with PII (complainant "Mrs. Lakshmi 98xxxxxx21", subject naming a child
  + scholarship); `/track/grievance?id=PUB-1` returned only {category:financial, status:open, with_tier:
  HEAD_TEACHER, filed_on, due_by, escalations:0} — a grep for the PII strings found NONE; unknown ticket → 404.
- Green bar (both stacks): 56 Go modules pass (in-memory sweep), 8 durable PG tests pass via the CI TestPg step
  against the live PostgreSQL service, OPA 33/33, gofmt clean, tsc 0 errors.

## Resolve Governance + User-Management issues (audit-driven)
Fixed the concrete, evidence-backed defects an audit surfaced in Governance and User Management:
- **G-1 / UM-4 (HIGH, runtime bug):** `getAuthUsersForSelectionAction` (`app/governance/user-assignments/
  actions.ts`) selected `raw_user_meta_data` — a Supabase auth.users column that does NOT exist on
  public.users — failing with column-not-found. Now selects `id,email,full_name` and maps `full_name` into the
  `AuthUser.raw_user_meta_data.name` shape the assignment UI expects.
- **G-3 (multi-role gap):** `resolveSubject` only ever resolved the FIRST role. Added `getUserRoles(userId)`
  (`lib/auth/server.ts`) — primary public.users role UNION user_ou_assignments roles — and `resolveSubject`
  (`lib/access/resolve.ts`) now authorises ALL of a user's valid portal roles.
- **G-2 (3 dangling TODOs):** the policy-CRUD "Determine OU context" TODOs (`app/policies/create/actions.ts`)
  are resolved as an explicit DESIGN DECISION: policies are STATE-TIER artifacts (gated by *_NATIONAL
  permissions), deliberately not per-OU — OU-scoping would fragment statutory State policy. 0 TODOs remain in
  governance/policy/access TS.
- **UM-1 / G-4 (the two disconnected identity planes):** new `lib/access/backbone-sync.ts` propagates a
  Next.js-registered user into the Go sovereign directory (the durable identity plane the five-model PDP
  decides over). Correctness-first: org_unit must be a REAL tenancy node — school-tier users → their UDISE
  (a T6 node), state-tier roles → canonical Go nodes (TN/TN-SEC/TN-DIR-DSE); district/block roles with no
  resolvable node are SKIPPED (not mis-anchored, which would break ReBAC). Wired into `register-user-action.ts`
  (best-effort; a sync failure never fails a successful registration). No-op without PLATFORM_URL.
  `platform-client.platformUpsertUser` + exported `backendRoleFor` from the PDP bridge.
- **UM-3 was a FALSE alarm:** `app/admin/governance/users/page.tsx` and the assignments page both exist.
- **Drift fix:** regenerated `scripts/bootstrap.sql` (85 migrations) — it was stale after this session's durable
  migrations (081–086); the bootstrap drift test now passes.
- PROVEN LIVE (raw): POSTing the exact payload `syncUserToBackbone` sends for a registered TEACHER created a
  durable Go directory user (org_unit = real Chennai UDISE 33030004181, cadre=teaching); the unified PDP then
  decided over them correctly — `write:assessment` in own school → permit (RBAC), in another school → deny
  (ReBAC).
- Green bar (both stacks): TS suite 1544/1544 pass, coverage 96.15/81.60/91.58 (≥ 95/80/88 gate), tsc 0, lint
  clean; Go 56 modules + 8 durable PG tests + OPA 33/33, gofmt clean.

## Complete the identity-plane unification (UM-1/G-4) + new ecosystem vertical: Student Attendance
### Identity-plane: district/block officers now anchorable
- Go: exported `tenancy.DistrictNodeID`/`DirectorateNodeID`; `Platform.ResolveTenancyNode(hint)` resolves a
  governance hint (node id / district name / directorate code) to a REAL tenancy node, fail-closed; endpoint
  `GET /tenancy/resolve`. Test `TestResolveTenancyNode` (Chennai→TN-DIST-Chennai, DSE→TN-DIR-DSE, unknown→none).
- TS: `lib/platform-client.platformResolveNode`; `backbone-sync` now anchors DEO/CEO via their district →
  resolved tenancy node (no mis-anchoring). UM-1/G-4 is now complete across ALL tiers (school·state·district).
- PROVEN LIVE: `/tenancy/resolve?district=Chennai` → {node:TN-DIST-Chennai, resolved:true}.
### Student Attendance (new durable L6 vertical, RTE chronic-absentee analytics)
- New L6 `attendance` module — high-volume daily data plane (one record per student per day), NOT a workflow:
  Mark (idempotent on student+date — re-marking corrects), Get, List(filter), `AttendanceRate` (present+late /
  attendable, excused-exempt), `IsChronicAbsentee` (<75% over >=10 days = RTE dropout early-warning), DaySummary.
- Integration `attendance.go` (+ `attendance_pg.go`): per-platform store (mem/pg); `MarkAttendance` (audited),
  `StudentAttendanceProfile` (rate + chronic flag), `AttendanceDashboard(scope, date)` (downward-governance
  scoped: per-school day rates + chronic-absentee roll-up). Seeded ~20 days for a Chennai cohort incl. one
  engineered chronic absentee. platformd: `GET /attendance?scope=&date=` (dashboard), `?student=` (profile),
  `POST /attendance` (mark). Migration `scripts/087`.
- PROVEN LIVE (raw): `TestPgAttendanceDurable` (16-day history persists + correction upsert + chronic flag over
  the durable history) and `TestAttendanceDashboardScoped` pass. platformd (durable): marked LIVE-STU-1
  (confirmed in Postgres); `/attendance?scope=TN-DIST-Chennai&date=` → 1 school, 12 marked, chronic_absentees
  ['SYN-STU-D']; `/attendance?student=SYN-STU-D` → rate 30%, chronic true, 20 days.
- Green bar (both stacks): 57 Go modules pass, 9 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; TS 1544/1544 pass, coverage 96.15/81.60/91.58 (≥ gate), tsc 0, lint clean.
- Durable verticals now: Calendar · Exams · Leave · Directory · Audit · Grievance · Admission · **Attendance**.

## Ecosystem vertical: Scholarship / DBT (Direct Benefit Transfer) — durable, money-grade
- New L6 `scholarship` module — a financial vertical distinct from the others: a scholarship is SANCTIONED
  through an AMOUNT-DRIVEN multi-level fund-approval chain (PFMS/GFR: school+BEO always; +DEO over Rs50,000;
  +directorate over Rs2,00,000), DISBURSED with a payment reference, then RECONCILED against the rail (matched →
  reconciled; unmatched → FLAGGED as a leakage signal). Money in PAISE (int64) — never floats. Pure transitions
  (NewDisbursement/ApplyDecide/ApplyDisburse/ApplyReconcile) shared by the in-memory and Postgres stores.
- Integration `scholarship.go` (+ `scholarship_pg.go`): `FileScholarship`, `SanctionScholarship` (high-stakes
  fund-release, fail-closed per tier), `DisburseScholarship`, `ReconcileScholarship` (all audited),
  `ScholarshipDashboard(scope)` (downward-governance scoped: by status/scheme, pending-sanction backlog, total
  rupees disbursed, leakage count). platformd: `POST /scholarship` (file), `POST /scholarship/act`
  (sanction/disburse/reconcile), `GET /scholarship?scope=&status=&id=`. Migration `scripts/088`.
- PROVEN LIVE (raw): `TestPgScholarshipDurable` (₹60k → 3-tier sanction → disburse → reconcile all persist
  across fresh instances; wrong tier fail-closed) and `TestScholarshipDashboardScoped` pass. platformd (durable
  + DATABASE_URL): filed ₹60,000 post-matric (chain HEAD_TEACHER→BEO→DEO); DEO-first sanction fail-closed;
  walked to sanctioned → disbursed (PFMS-TXN-LIVE-1) → reconcile-unmatched → FLAGGED; Postgres shows
  status=flagged, the audit chain holds the full money trail (sanction×2 / disburse / reconcile).
- Green bar (both stacks): 58 Go modules pass, 10 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (9): Calendar · Exams · Leave · Directory · Audit · Grievance · Admission · Attendance · **Scholarship/DBT**.

## Ecosystem vertical: Teacher CPD (Continuing Professional Development) — durable, NEP-2020 compliance
- New L6 `cpd` module — completes the TEACHER lifecycle (onboarding → service → professional development). A
  data+analytics plane: durable records of in-service training (NISHTHA/SCERT/DIET/DIKSHA) with the NEP 2020
  compliance picture — `HoursFor` (completed/certified hours; enrolled doesn't count) and `IsCompliant` (>= 50
  hours/year). Pure + stdlib.
- Integration `cpd.go` (+ `cpd_pg.go`): `RecordCPD` (audited), `TeacherCPDProfile(teacher, year)` (hours vs the
  50h target + compliant flag), `CPDDashboard(scope, year)` (downward-governance scoped: teachers, compliant
  count, compliance rate, total hours, deficient roster). Seeded 2026 CPD for a Chennai teacher cohort incl. one
  engineered deficient teacher. platformd: `GET /cpd?scope=&year=` (dashboard), `?teacher=&year=` (profile),
  `POST /cpd` (record). Migration `scripts/089`.
- PROVEN LIVE (raw): `TestPgCpdDurable` (records + upsert correction persist across fresh instances; compliance
  computes over durable history) and `TestCPDDashboardScoped` pass. platformd (durable + DATABASE_URL): recorded
  a NISHTHA 20h completion (confirmed in Postgres); `/cpd?scope=TN-DIST-Chennai&year=2026` → 8 teachers, 7
  compliant (87.5%), 435 total hours, deficient ['SYN-T-02']; `/cpd?teacher=SYN-T-02` → 19h vs 50h target, not
  compliant.
- Green bar (both stacks): 59 Go modules pass, 11 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (10): Calendar · Exams · Leave · Directory · Audit · Grievance · Admission · Attendance · Scholarship/DBT · **Teacher CPD**.

## Ecosystem vertical: RBSK Child-Health Screening — durable child-welfare referral pipeline
- New L12 `rbsk` module (Rashtriya Bal Swasthya Karyakram) — completes the student-welfare side alongside
  attendance: every student is screened for the FOUR Ds (defect / disease / deficiency / disability); any
  finding AUTO-refers to the DEIC (District Early Intervention Centre); the referral is tracked through the
  pipeline (referred → under-treatment → closed). Pure transitions (NewScreening/ApplyTreat/ApplyClose).
- Integration `rbsk.go` (+ `rbsk_pg.go`): `RecordScreening` (audited; auto-referral), `AdvanceReferral`
  (treat/close, audited), `RBSKDashboard(scope)` (downward-governance scoped: screened coverage, healthy vs
  with-findings, the 4-D breakdown, active referrals, referral closure rate), `RBSKReferralsScopedBy` (the
  follow-up worklist). Findings stored as JSONB. Health data is sensitive → the dashboard surfaces aggregate
  counts; individual findings are visible only to the governing officer. Seeded a synthetic screening camp at a
  Chennai school (~18% with findings). platformd: `GET /rbsk?scope=&id=&referrals=`, `POST /rbsk`,
  `POST /rbsk/referral`. Migration `scripts/090`.
- PROVEN LIVE (raw): `TestPgRbskDurable` (findings JSONB + the treat→close pipeline persist across fresh
  instances) and `TestRBSKDashboardScoped` pass. platformd (durable + DATABASE_URL): screened a student with
  deficiency+disability → auto-referred to DEIC (confirmed in Postgres); referral walked treat → under-treatment
  → closed with outcome; `/rbsk?scope=TN-DIST-Chennai` → 20 screened, 15 healthy, 5 with findings
  (defect 2·deficiency 1·disease 2), 5 active referrals.
- Green bar (both stacks): 60 Go modules pass, 12 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (11): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·**RBSK Health**.

## Ecosystem vertical: School Timetable — durable, constraint-checked (teacher-clash detection)
- New L6 `timetable` module — the operational scheduling plane that ties together the class roster and the
  teacher roster: assign a class-slot (org · class · day · period → subject + teacher), and the store ENFORCES
  the hard timetabling invariant that a teacher can never be in two classes at the same day+period
  (`teacherClash`). Pure + stdlib: `Slot.Validate` (working day, period 1..8, teacher present), `Store.Set`
  (validate → reject clash → upsert), `List` (day/period/class ordered), `TeacherLoad`.
- Integration `timetable.go` (+ `timetable_pg.go`): `SetTimetableSlot` (audited; audits `timetable.set` /
  `.set.denied`), `ClassTimetable(org,class)` + `TeacherTimetable(teacher)` (grid views), `TimetableDashboard
  (scope)` (downward-governance scoped: slots, distinct classes/teachers, per-teacher weekly load, overloaded
  roster > 30 periods/wk). The durable adapter does the clash check in SQL (targeted existence query on
  teacher_id+day+period) before the ON CONFLICT upsert; index on (teacher_id,day,period). Seeded a clash-free
  Grade 8-A weekly grid (5 days × 6 periods, 3 SYN-T teachers) at a Chennai school. platformd: `GET /timetable
  ?class=&teacher=` (dashboard / grid), `POST /timetable` (assign). Migration `scripts/091`.
- PROVEN LIVE (raw): `TestPgTimetableDurable` (slots + reassign upsert persist across fresh instances; the
  teacher-clash invariant is enforced durably, surviving a fresh store) and `TestTimetableDashboardScoped`
  pass. platformd (durable + DATABASE_URL): assigned free teacher SYN-T-09 to Grade 9-A Mon P1 (confirmed in
  Postgres); a clash (SYN-T-09 in Grade 9-B at the same slot) was REJECTED — "teacher SYN-T-09 is already
  teaching Grade 9-A at monday"; P2 for the same teacher was allowed; psql confirmed a clash-free schedule.
- Green bar (both stacks): 61 Go modules pass, 13 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (12): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·**School Timetable**.

## Ecosystem vertical: School Library — durable, constraint-checked circulation (one-copy-one-borrower)
- New L6 `library` module — the learning-resources circulation plane: issue a physical book copy to a member
  (student/teacher), renew (capped at 2), return, or mark lost. The store enforces the one hard invariant a
  library must hold — a single physical copy can be on loan to at most one member at a time (`copyOnLoan`).
  Pure + stdlib: `NewLoan` (computes the 14-day due date), `Validate`, the `ApplyReturn`/`ApplyRenew`/`ApplyLost`
  transitions, `IsOverdue`/`OverdueCount` analytics.
- Integration `library.go` (+ `library_pg.go`): `IssueBook`/`ReturnBook`/`RenewBook`/`ReportBookLost` (all
  audited; deny paths audit too), `MemberLoans(member)` (history), `LibraryDashboard(scope)` (downward-governance
  scoped: active loans, the overdue roster as-of today, copies lost, distinct members/titles). The durable
  adapter enforces the copy invariant TWICE — a targeted SQL existence check before the insert AND a partial
  unique index `(org_unit, copy_id) WHERE status='on_loan'`; transitions reuse the pure Apply* functions. Seeded
  a circulation set at a real Chennai school library with two engineered-overdue loans. platformd: `GET /library
  ?scope=` (dashboard), `?member=` (history), `POST /library {action: issue|return|renew|lost, …}`. Migration
  `scripts/092`.
- PROVEN LIVE (raw): `TestPgLibraryDurable` (loans + renew + return persist across fresh instances; the copy
  invariant is enforced durably and survives a fresh store; a returned copy is re-issuable; lost persists) and
  `TestLibraryDashboardScoped` pass. platformd (durable + DATABASE_URL): issued copy CP-NEW-1 to SYN-S-900
  (confirmed in Postgres); the SAME copy to SYN-S-901 while out was REJECTED — "copy CP-NEW-1 is already on loan
  (LOAN-…)"; renew extended the due date 2026-07-04→07-18 (renewals=1); return freed the copy; re-issue to
  SYN-S-901 then SUCCEEDED; psql confirmed exactly one active loan per copy throughout. Seeded Chennai dashboard:
  6 active loans, 2 overdue, 6 members, 4 titles.
- Green bar (both stacks): 62 Go modules pass, 14 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (13): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·Timetable·**School Library**.

## Ecosystem vertical: School Transport — durable, route-safety (capacity + fitness/licence gating)
- New L6 `transport` module — the student-transport route-safety plane: register a bus route (vehicle + driver
  with the statutory validity dates that govern whether it may carry children) and seat students on it, with the
  TWO hard safety invariants school transport must hold — (1) a route can never carry more students than the
  vehicle's seating CAPACITY, and (2) no student may be allotted to an UNSERVICEABLE vehicle (one whose fitness
  certificate or whose driver's licence has lapsed). Pure + stdlib: `Route.Serviceable`/`UnserviceableReason`
  (the safety gate), `Occupancy`, `Store.Allot` (validate → serviceability gate → dedupe → capacity check).
- Integration `transport.go` (+ `transport_pg.go`): `RegisterRoute`, `AllotSeat`, `WithdrawSeat` (all audited;
  deny paths too), `RouteRoster(routeID)` (the manifest), `TransportDashboard(scope)` (downward-governance
  scoped: fleet size, total capacity vs seated → utilisation %, and the unserviceable-route SAFETY ROSTER). The
  durable adapter enforces capacity against the live occupancy count and the serviceability gate against the
  stored route before each insert; a partial unique index backstops one-active-seat-per-student-per-route.
  Seeded a Chennai fleet (one full route, one engineered unserviceable route with a lapsed FC). platformd:
  `GET /transport?scope=&roster=`, `POST /transport {action: route|allot|withdraw, …}`. Migration `scripts/093`.
- PROVEN LIVE (raw): `TestPgTransportDurable` (routes + seats persist across fresh instances; capacity ceiling
  and the unserviceable gate are enforced durably; a withdrawn seat frees capacity) and
  `TestTransportDashboardScoped` pass. platformd (durable + DATABASE_URL): a 5th seat on the full capacity-4
  route RT-CHN-01 was REJECTED ("route RT-CHN-01 is at capacity"); allotting a child to RT-CHN-03 (lapsed FC)
  was REJECTED ("cannot allot to an unserviceable route — vehicle fitness certificate expired (2026-03-01)");
  after withdrawing a seat the re-allot SUCCEEDED; psql confirmed exactly 4 active seats (= capacity). Seeded
  Chennai dashboard: 3 routes, 84 capacity, 9 seated (10.7% utilisation), 1 unserviceable route on the safety
  roster.
- Green bar (both stacks): 63 Go modules pass, 15 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (14): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·Timetable·Library·**School Transport**.

## Ecosystem vertical: Mid-Day Meal (PM-POSHAN) — durable, accountability (stock can never go negative)
- New L6 `mdm` module — the PM-POSHAN food-accountability plane: a per-school foodgrain stock ledger (receipts
  in / consumptions out) + the daily meal-service register, with the two invariants the scheme must hold — (1)
  foodgrain stock can never go NEGATIVE (a day's cooking can never consume more grain than is on hand — the core
  leakage gate), and (2) meals served can never exceed enrolment (a data-quality gate). Foodgrain is tracked in
  GRAMS (int64, never floats), mirroring the money-in-paise discipline. Pure + stdlib: `Balance` (receipts minus
  consumptions, with idempotent exclude), `Store.Serve` (validate → enrolment gate → stock gate → write meal +
  matching consumption entry), `CoverageRate`.
- Integration `mdm.go` (+ `mdm_pg.go`): `ReceiveFoodgrain`, `ServeMeal` (both audited; deny paths too),
  `SchoolMealRegister(org)`, `MDMDashboard(scope)` (downward-governance scoped: meal coverage %, total grain
  consumed, and the days-of-cover LOW-STOCK roster at each school's recent burn rate). The durable adapter
  enforces the stock gate against the live balance INSIDE the same transaction that writes the meal + its
  consumption ledger entry, so service and draw-down are atomic. Seeded a fortnight's lifting + five serving days
  at a Chennai school (~93% coverage, driven low so the days-of-cover signal fires). platformd: `GET /mdm?scope=
  &register=`, `POST /mdm {action: receive|serve, …}`. Migration `scripts/094`.
- PROVEN LIVE (raw): `TestPgMdmDurable` (stock + meal register persist across fresh instances; the
  stock-non-negative gate is enforced durably and atomically; a re-serve corrects the balance idempotently
  without double-deducting) and `TestMDMDashboardScoped` pass. platformd (durable + DATABASE_URL): with 50.5kg on
  hand, a day cooking 60kg was REJECTED ("insufficient foodgrain stock — need 60000g, have 50500g"); meals_served
  400 > enrolment 320 was REJECTED; a 30kg serve SUCCEEDED and drew stock to 20.5kg (confirmed in Postgres); a
  100kg receipt restored it to 120.5kg. Seeded Chennai dashboard: 1 school, 5 meal-days, 93.4% coverage,
  149.5kg consumed, low-stock roster fires (1 day of cover).
- Green bar (both stacks): 64 Go modules pass, 16 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (15): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·Timetable·Library·Transport·**Mid-Day Meal**.

## Ecosystem vertical: Infrastructure & Asset Register — durable, constraint-checked maintenance lifecycle
- New L6 `infra` module — the estate-management plane: a school's physical assets/rooms (with a condition grade)
  and the maintenance tickets raised against them, as a constraint-checked state machine. Holds three register
  invariants — (1) a ticket may only be raised against a known, non-decommissioned asset; (2) a ticket walks
  open → in_progress → resolved → closed with no skips (pure ApplyAssign/ApplyResolve/ApplyClose); and (3) an
  asset can NEVER be decommissioned (or returned to service) while it still has open tickets — you cannot retire
  a room mid-repair. A critical ticket auto-flips its asset to under_maintenance. Pure + stdlib.
- Integration `infra.go` (+ `infra_pg.go`): `RegisterAsset`, `RaiseMaintenanceTicket`, `AdvanceTicket`
  (assign/resolve/close), `DecommissionAsset`, `ReturnAssetToService` (all audited; deny paths too),
  `AssetTickets(assetID)`, `InfraDashboard(scope)` (downward-governance scoped: condition/status rollup, open
  backlog by severity, needs-attention roster — unusable, under-maintenance, or critical-open assets). The
  durable adapter enforces the invariants against the live state and writes a critical ticket's auto-flip in the
  same transaction as the ticket; lifecycle transitions reuse the pure Apply* functions. Seeded a Chennai school
  register (5 assets across categories/conditions) with a critical sanitation ticket + a routine ICT ticket.
  platformd: `GET /infra?scope=&tickets=`, `POST /infra {action: asset|ticket|assign|resolve|close|
  decommission|return, …}`. Migration `scripts/095`.
- PROVEN LIVE (raw): `TestPgInfraDurable` (assets + tickets persist across fresh instances; the lifecycle, the
  critical auto-flip, and the no-decommission-with-open-tickets invariant are all enforced durably) and
  `TestInfraDashboardScoped` pass. platformd (durable + DATABASE_URL): decommissioning the toilet block (open
  critical ticket) was REJECTED ("cannot decommission an asset with open maintenance tickets — close them
  first"); the ticket walked assign → resolve → close; return-to-service then SUCCEEDED (in_service/fair),
  confirmed in Postgres. Seeded Chennai dashboard: 5 assets (good 2·fair 2·poor 1), 1 under maintenance, 2 open
  tickets (critical 1·medium 1), needs-attention roster fires.
- Green bar (both stacks): 65 Go modules pass, 17 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (16): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·Timetable·Library·Transport·Mid-Day Meal·**Infrastructure & Asset Register**.

## Ecosystem vertical: Fee & Finance Ledger — durable, money-grade (no overpayment, paise)
- New L6 `fees` module — the school finance plane: fee demands raised against students (exam/hostel/special
  heads — TN government schooling is largely free, but statutory heads remain) and the payments collected, with
  the money-grade invariants a ledger must hold — every amount is in PAISE (int64, never floats), a payment can
  never take the collected total ABOVE the amount demanded (no overpayment), and a fully-paid or waived demand is
  closed to further payment. Pure + stdlib: `PaidSoFar` (with idempotent exclude), `Store.RecordPayment`
  (validate → open gate → overpayment gate → status recompute), `WaiveDemand`, `Outstanding`.
- Integration `fees.go` (+ `fees_pg.go`): `RaiseFeeDemand`, `CollectFeePayment`, `WaiveFeeDemand` (all audited;
  deny paths too), `StudentFeeLedger(org,student)`, `FeeDashboard(scope)` (downward-governance scoped: demanded
  vs collected vs outstanding in paise, collection %, status breakdown, defaulter roster of open demands past
  due). The durable adapter enforces the overpayment gate against the live collected total INSIDE the same
  transaction that writes the payment and recomputes the demand status, so collection + status are atomic.
  Seeded a Chennai exam-fee ledger (6 demands: 2 paid · 1 partial · 2 unpaid defaulters · 1 waived). platformd:
  `GET /fees?scope=&student=&org=`, `POST /fees {action: demand|payment|waive, …}`. Migration `scripts/096`.
- PROVEN LIVE (raw): `TestPgFeesDurable` (demands + payments persist across fresh instances; the no-overpayment
  gate is enforced durably and atomically with the status recompute; a re-recorded payment corrects
  idempotently; waiver closes a demand durably) and `TestFeeDashboardScoped` pass. platformd (durable +
  DATABASE_URL): against demand FEE-CHN-EXAM-003 (25000p demand, 10000p paid) a 20000p payment was REJECTED
  ("would overpay … outstanding 15000p, tendered 20000p"); a payment on a fully-paid demand was REJECTED
  ("demand … is paid and cannot take payment"); the exact 15000p balance SUCCEEDED → status paid; psql confirmed
  the collected total equals 25000p exactly (never more). Seeded Chennai dashboard: 6 demands, Rs1250 demanded,
  48% collected, Rs650 outstanding, 3 defaulters, 1 waived.
- Green bar (both stacks): 66 Go modules pass, 18 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (17): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·Timetable·Library·Transport·Mid-Day Meal·Infrastructure·**Fee & Finance Ledger**.

## Ecosystem vertical: School Health Immunisation — durable, clinical sequence invariant
- New L6 `immunisation` module — the school-health immunisation register: vaccine doses administered to students
  under the school-health schedule (UIP/RBSK school-age vaccines: Td10·Td16·MR·JE·VitaminA·Albendazole), with
  the clinical invariants an immunisation register must hold — a dose may only be recorded in SEQUENCE (dose N
  requires doses 1..N-1 already given), a vaccine can never exceed its scheduled dose count, and a dose cannot be
  future-dated. Immunisation status (complete/partial/due) is derived against the schedule. Pure + stdlib:
  `Schedule`/`RequiredDoses`, `DosesGivenExcluding`, `StatusFor`, `Store.AdministerDose` (validate → sequence →
  no-duplicate-slot).
- Integration `immunisation.go` (+ `immunisation_pg.go`): `RecordImmunisation` (audited; deny paths too),
  `StudentImmunisationCard(student)` (the per-child card — officer-only), `ImmunisationDashboard(scope)`
  (downward-governance scoped: per-vaccine completion across the cohort + the due/partial follow-up worklist).
  Health data is sensitive, so the dashboard headlines aggregate coverage and includes the per-child worklist
  only for the governing officer (mirroring RBSK). The durable adapter enforces the schedule/sequence/no-future
  invariants against the durable doses (reusing the pure helpers) and backstops the no-duplicate-slot rule with
  a partial unique index. Seeded a Chennai immunisation drive (10 children: full single-dose coverage, partial
  MR rollout). platformd: `GET /immunisation?scope=&student=&schedule=`, `POST /immunisation {dose…}`. Migration
  `scripts/097`.
- PROVEN LIVE (raw): `TestPgImmunisationDurable` (doses persist across fresh instances; the sequence and
  no-duplicate-slot invariants are enforced durably; a re-record corrects in place) and
  `TestImmunisationDashboardScoped` pass. platformd (durable + DATABASE_URL): recording MR dose 2 for a child
  with no dose 1 was REJECTED ("out-of-sequence dose — MR dose 2 requires dose 1 first"); an off-schedule vaccine
  (COVID) was REJECTED; a future-dated dose was REJECTED; recording MR dose 1 then dose 2 in order SUCCEEDED →
  status complete; psql confirmed the two doses in sequence. Seeded Chennai dashboard: 10 students, 41 doses,
  single-dose vaccines 100%, MR 40% (4 complete·3 partial·3 due).
- Green bar (both stacks): 67 Go modules pass, 19 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (18): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·Timetable·Library·Transport·Mid-Day Meal·Infrastructure·Fees·**School Health Immunisation**.

## Ecosystem vertical: Parent-Teacher Meeting — durable, capacity-checked booking + attendance lifecycle
- New L6 `ptm` module — the parent-engagement plane: scheduled PTM sessions (with a fixed slot count) and the
  guardian bookings against them, as a capacity-checked booking system with an attendance lifecycle. Holds the
  invariants a meeting register must keep — a session can never be OVERBOOKED beyond its slots, a guardian can
  never double-book the same session, a cancelled session takes no bookings, and a booking walks
  booked → attended | no_show (a cancellation frees its slot). Turnout (attended vs occupied) is derived. Pure +
  stdlib: `Occupied`, `Store.Book` (validate → session-open → no-double-book → capacity), the pure
  ApplyAttend/ApplyNoShow/ApplyCancel transitions.
- Integration `ptm.go` (+ `ptm_pg.go`): `SchedulePTM`, `BookPTM`, `MarkPTMAttendance` (attend/noshow/cancel) (all
  audited; deny paths too), `SessionBookings(sessionID)` (the attendance sheet), `PTMDashboard(scope)`
  (downward-governance scoped: per-session fill % + turnout %, overall turnout, low-turnout roster). The durable
  adapter enforces the overbooking + double-booking invariants against the live bookings and backstops the
  no-double-book rule with a partial unique index; transitions reuse the pure Apply* functions. Seeded a Chennai
  Term-1 PTM (8 slots, 6 booked, 4 attended · 1 no-show · 1 booked). platformd: `GET /ptm?scope=&sheet=`,
  `POST /ptm {action: session|book|attend|noshow|cancel, …}`. Migration `scripts/098`.
- PROVEN LIVE (raw): `TestPgPtmDurable` (sessions + bookings persist across fresh instances; the overbooking and
  double-booking invariants are enforced durably; a cancellation frees a slot; the attendance lifecycle
  persists) and `TestPTMDashboardScoped` pass. platformd (durable + DATABASE_URL): after filling the 8-slot
  session, a 9th booking was REJECTED ("session PTM-CHN-T1 is full (8 slots)"); a double-booking by an
  already-booked student was REJECTED; cancelling an attended slot was REJECTED ("only a booked slot can be
  cancelled"); cancelling a still-booked slot freed it and the 9th booking then SUCCEEDED; psql confirmed
  exactly 8 occupied (non-cancelled) bookings (= slots). Seeded Chennai dashboard: 1 session, 8 slots, 6
  occupied (75% fill), 4 attended (66.7% turnout).
- Green bar (both stacks): 68 Go modules pass, 20 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (19): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·Timetable·Library·Transport·Mid-Day Meal·Infrastructure·Fees·Immunisation·**Parent-Teacher Meeting**.

## Ecosystem vertical: Free-Supply Entitlement Distribution — durable, no over-issue (leakage gate)
- New L6 `entitlement` module — the free-supply distribution plane: each student's entitlement under TN's
  free-supply schemes (textbooks/notebooks/uniforms/shoes/bags/cycles) and the issues distributed against it,
  with the accountability invariant a distribution register must hold — a student can never be issued MORE than
  their entitlement (the over-issue/leakage gate). Quantities are whole units; fulfilment status (pending →
  partial → fulfilled) is derived. Pure + stdlib: `IssuedSoFar` (with idempotent exclude), `Store.IssueSupply`
  (validate → open gate → over-issue gate → status recompute), `Remaining`.
- Integration `entitlement.go` (+ `entitlement_pg.go`): `GrantEntitlement`, `IssueSupply` (both audited; deny
  paths too), `StudentEntitlements(org,student)`, `EntitlementDashboard(scope)` (downward-governance scoped:
  per-item entitled vs issued → fulfilment %, fulfilled-vs-pending student counts, shortfall worklist). The
  durable adapter enforces the over-issue gate against the live issued total INSIDE the same transaction that
  writes the issue and recomputes the entitlement status, so distribution + status are atomic. Seeded a Chennai
  2026 free-supply roll (8 children × textbook/uniform/notebook; most fully supplied, some partial, one
  pending). platformd: `GET /entitlement?scope=&student=&org=`, `POST /entitlement {action: grant|issue, …}`.
  Migration `scripts/099`.
- PROVEN LIVE (raw): `TestPgEntitlementDurable` (entitlements + issues persist across fresh instances; the
  over-issue gate is enforced durably and atomically with the status recompute; a re-issue corrects
  idempotently; a fulfilled entitlement is closed) and `TestEntitlementDashboardScoped` pass. platformd (durable
  + DATABASE_URL): against ENT-CHN-006-uniform (4 entitled, 2 issued) an issue of 3 was REJECTED ("would
  over-issue … remaining 2, tendered 3"); an issue against a fulfilled entitlement was REJECTED; issuing the
  exact remaining 2 SUCCEEDED → status fulfilled; psql confirmed the issued total equals 4 exactly (never more).
  Seeded Chennai dashboard: 8 students, uniform 75% / textbook·notebook 62.5% fulfilment, 9-entry shortfall
  worklist.
- Green bar (both stacks): 69 Go modules pass, 21 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (20): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·Timetable·Library·Transport·Mid-Day Meal·Infrastructure·Fees·Immunisation·PTM·**Free-Supply Entitlement Distribution**.

## Ecosystem vertical: Staff Establishment & Sanctioned-Post Register — durable, no over-appointment
- New L6 `establishment` module — the staffing-control plane: each school's sanctioned posts (by cadre) and the
  appointments made against them, with the accountability invariant an establishment register must hold — the
  FILLED posts of a cadre can never exceed its SANCTIONED strength (the over-appointment gate). A vacated post
  frees its slot; vacancy (sanctioned − filled) is derived. Pure + stdlib: `FilledCount`, `Store.Appoint`
  (validate → open gate → no-double-post → over-appointment gate), `Vacate`, `Vacancies`.
- Integration `establishment.go` (+ `establishment_pg.go`): `SanctionPosts`, `AppointStaff`, `VacatePost` (all
  audited; deny paths too), `EstablishmentRoster(establishmentID)`, `EstablishmentDashboard(scope)`
  (downward-governance scoped: sanctioned vs filled strength across cadres, vacancy %, vacancy roster). The
  durable adapter enforces the over-appointment gate against the live filled count and backstops the
  one-filled-post-per-employee rule with a partial unique index. Seeded a Chennai sanctioned-post register
  (5 cadres, 18 sanctioned, 15 filled, 3 vacancies). platformd: `GET /establishment?scope=&roster=`,
  `POST /establishment {action: sanction|appoint|vacate, …}`. Migration `scripts/100`.
- PROVEN LIVE (raw): `TestPgEstablishmentDurable` (sanctioned posts + appointments persist across fresh
  instances; the over-appointment and no-double-post invariants are enforced durably; a vacate frees a post; a
  frozen establishment refuses appointments) and `TestEstablishmentDashboardScoped` pass. platformd (durable +
  DATABASE_URL): a 7th appointment to the full 6-post SGT cadre was REJECTED ("ESTAB-CHN-03 is at sanctioned
  strength (6)"); once BT reached 8/8 a 9th was REJECTED ("at sanctioned strength (8)"); vacating a BT post then
  re-appointing SUCCEEDED; psql confirmed exactly 8 filled BT posts (= sanctioned). Seeded Chennai dashboard:
  5 cadres, 18 sanctioned, 15 filled, 16.7% vacancy, 3-entry vacancy roster.
- Green bar (both stacks): 70 Go modules pass, 22 durable PG tests pass via the CI TestPg step, OPA 33/33,
  gofmt clean; tsc 0 (TS unchanged this turn).
- Durable verticals now (21): Calendar·Exams·Leave·Directory·Audit·Grievance·Admission·Attendance·Scholarship/DBT·Teacher-CPD·RBSK·Timetable·Library·Transport·Mid-Day Meal·Infrastructure·Fees·Immunisation·PTM·Entitlement·**Staff Establishment**.

## Pilot enablement: one-command single-district deployment (moat lever #1)
- Made the deployment DISTRICT-SELECTABLE: new `pilotDistrict()` (reads `PILOT_DISTRICT`, default
  TN-DIST-Chennai) now backs all 14 vertical seeds via `tenancyLeafUnder(pilotDistrict())`. Default keeps
  every test green; an override relocates the entire seed (proven: under PILOT_DISTRICT=Madurai the
  Chennai-asserting dashboard test fails, i.e. the data genuinely moved).
- New `deploy/pilot/`: `docker-compose.yml` (Postgres 16 + platformd + web console, wired —
  PLATFORM_URL points the web app's server actions at the durable Go backbone), `.env.example`,
  `smoke.sh` (20 scoped dashboards + a durability check), `PILOT.md` (go-live runbook, honest real-vs-gated
  table, the full-Supabase path).
- PROVEN LIVE: against a FRESH EMPTY database, platformd self-migrated (no manual schema step) and seeded
  TN-DIST-Madurai (5 cadres / 18 sanctioned) with Chennai correctly empty (0); smoke 20/20 dashboards 200 with
  district-scoped data; and after a FULL process kill + restart against the same Postgres the data survived —
  a marker sanctioned-post written before the kill (`PILOT-DURABLE-PROOF`, sanctioned 7) was read back intact,
  audit hash-chain re-loaded from Postgres. This is a durable system of record, not a demo.
- Green bar: 69 Go modules pass, durable PG suite passes, OPA 33/33, gofmt clean, tsc 0, `docker compose config`
  validates. No new module (district seam + deploy package only).

## Full-stack milestone: Staff Establishment as a working, clickable end-to-end module
- Established the end-to-end pattern that turns a backbone vertical into a real, clickable application module:
  web form → server action → `lib/platform-client` → durable Go backbone (platformd) → PostgreSQL → realtime
  scoped dashboard. Every button performs a real, persisted, server-enforced operation (not a demo no-op).
- `lib/platform-client.ts`: added the establishment seam — `platformEstablishmentDashboard`,
  `platformEstablishmentRoster`, `platformSanctionPosts`, `platformAppointStaff`, `platformVacatePost` (+ a
  `getJSON` helper). When PLATFORM_URL is set these drive the backbone; otherwise callers degrade gracefully.
- `app/establishment/`: `actions.ts` (role-gated `canDo("manage:staff")` server actions), `page.tsx` (force-
  dynamic; realtime sanctioned/filled/vacant/vacancy% summary + per-cadre roster with working Vacate +
  Sanction/Appoint forms), `establishment-client.tsx` (interactive `useActionState` forms surfacing the
  backbone's exact responses incl. the invariant rejection).
- PROVEN LIVE (real client code against a running platformd + Postgres): READ → 5 cadres / 18 sanctioned / 15
  filled / 3 vacant; the Appoint button to a full 6/6 cadre was REJECTED server-side ("ESTAB-CHN-03 is at
  sanctioned strength (6)") and the over-appointment was NOT recorded (psql: still exactly 6); Sanction+Appoint
  created a new "Lab Assistant" cadre and filled it, persisted in Postgres. District-selectable via
  PILOT_DISTRICT; runs in the deploy/pilot full stack.
- Green: tsc 0, lint clean, next build compiled (establishment page bundle present), 1555 TS tests over the
  95/80/88 coverage gate. This is the template now to roll across the remaining modules, one per turn.

## Full-stack rollout #2: Fee & Finance Ledger module + the local full-stack launcher
- Fee & Finance Ledger as a working, clickable end-to-end module at /fee-ledger (the existing /fees stays a
  static demo). lib/platform-client.ts: fees seam (platformFeeDashboard, platformStudentFees,
  platformRaiseDemand, platformCollectPayment, platformWaiveDemand). app/fee-ledger/: role-gated server actions
  (canDo manage:school), a force-dynamic page (realtime demanded/collected/outstanding/collection% + a
  defaulter roster with a working Waive + Raise/Collect forms), and useActionState client forms. Money is in
  paise end-to-end; the UI shows rupees.
- PROVEN LIVE (real client code → running platformd + Postgres): READ 6 demands / ₹1250 demanded / ₹600
  collected / 48%; the Collect button overpaying FEE-CHN-EXAM-003 was REJECTED server-side ("would overpay …
  outstanding 15000p, tendered 20000p"); Raise+Collect a new hostel demand persisted in full.
- NEW: deploy/pilot/run-local.sh — one command boots the FULL STACK locally (no Docker): builds + starts
  platformd (DATABASE_URL + PILOT_DISTRICT, self-migrates/seeds), then the Next.js app with PLATFORM_URL set so
  every wired module's buttons persist. Prints the URL + demo login. This is the "local full-stack first"
  deliverable.
- Green: tsc 0, lint clean, next build compiled (fee-ledger + establishment bundles present), 1555 TS tests over
  the 95/80/88 coverage gate. Working clickable modules now: Establishment, Fee Ledger (2 of ~20; rolling on).

## Full-stack rollout #3: RTE Admissions — multi-step apply + HITL (BEO/DEO) approval, working end-to-end
- RTE Admissions as a working, clickable module at /rte-admissions (drives the Go backbone's genuine RTE flow;
  the legacy /admissions and /admissions-approvals demos stay intact). lib/platform-client.ts: admission seam
  (platformAdmissionDashboard, platformApplyAdmission, platformFinaliseAdmission). app/rte-admissions/:
  role-gated server actions (canDo manage:students); a force-dynamic page with a realtime register (by
  stage/category, admitted, pending-review), an Apply form, and — the showcase — a HITL approval inbox with
  Uphold/Overturn buttons. The RTE rule is policy-as-code (OPA/Rego): rejecting an EWS/DG applicant while the
  25% quota is unmet is held for BEO/DEO review (RTE §12(1)(c)).
- PROVEN LIVE (real client code → platformd + OPA + Postgres): apply {reject, EWS, quota-unmet} → Stage
  pending-approval (request TR-0002, reason RTE-EWS-QUOTA); the inbox showed pending_review=1; the officer
  Overturn finalised it → admitted; an ordinary GEN admit went straight through. Full multi-step + multi-level
  approval loop, persisted and audited.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61. Working clickable modules now (3):
  Establishment, Fee Ledger, RTE Admissions.

## Full-stack rollout #4: Grievance Redressal — durable, multi-tier SLA escalation, working end-to-end
- Grievance Redressal as a working, clickable module at /grievance-cases driving the Go backbone (the legacy
  local-store /grievance and /grievance-approvals stay intact). Reuses the existing platform-client grievance
  seam (platformListGrievance, platformFileGrievance, platformActGrievance). app/grievance-cases/: a File form
  (open to complainants), an open-cases escalation worklist rendering each case's tiered chain with the current
  tier highlighted + SLA-breach flag, and officer Resolve/Escalate/Reject buttons (canDo manage:governance).
- PROVEN LIVE (real client code → platformd + Postgres): file a financial grievance → chain
  [HEAD_TEACHER, BEO, DEO], tier 0, SLA due; list scoped → 2 cases; escalate at tier 0 (HEAD_TEACHER) → tier 1
  (BEO); resolve at tier 1 → status resolved. (A safety grievance opens the [HEAD_TEACHER, DEO, DIRECTOR]
  chain — category-driven, as designed.) Full multi-tier escalation loop, persisted and audited.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (4): Establishment, Fee Ledger, RTE Admissions, Grievance Redressal.

## Full-stack rollout #5: Scholarship / DBT — amount-driven sanction → disburse → reconcile, working end-to-end
- Scholarship/DBT as a working, clickable module at /dbt-scholarship driving the Go backbone. lib/platform-client.ts:
  scholarship seam (platformScholarshipDashboard, platformScholarshipList, platformFileScholarship,
  platformActScholarship). app/dbt-scholarship/: role-gated server actions (canDo approve:dbt); a force-dynamic
  page with a realtime DBT picture (cases · pending sanction · disbursed ₹ · leakage flags · by-status), a File
  form, a pending-sanction worklist rendering each case's amount-sized chain with the current tier highlighted +
  Approve/Reject, a ready-to-disburse list with a Disburse(payment-ref) action, and a disbursed list with
  Reconcile (rail-matched / unmatched→flag). Money in paise; UI in rupees.
- PROVEN LIVE (real client code → platformd + Postgres): file ₹75,000 post-matric → chain
  [HEAD_TEACHER, BEO, DEO] (DEO added because >₹50k); sanction tier-by-tier → sanctioned; disburse (PFMS ref) →
  disbursed; reconcile UNMATCHED → flagged (leakage); dashboard flagged_leakage=1, disbursed_rupees=75000. The
  full money-grade pipeline, persisted and audited.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (5): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT.

## Full-stack rollout #6: Mid-Day Meal (PM-POSHAN) — stock-non-negative + daily serving, working end-to-end
- MDM as a working, clickable module at /mid-day-meal driving the Go backbone. lib/platform-client.ts: mdm seam
  (platformMdmDashboard, platformReceiveFoodgrain, platformServeMeal). app/mid-day-meal/: role-gated server
  actions (canDo manage:school); a force-dynamic page with a realtime PM-POSHAN picture (schools · meal-days ·
  meals-served · coverage% · grain consumed), a per-school foodgrain stock table with days-of-cover + low-stock
  flags, a Serve form (draws grain from stock) and a Receive form (tops it up). Foodgrain in grams; UI in kg.
- PROVEN LIVE (real client code → platformd + Postgres): school balance 50.5kg / 93.4% coverage; serving 150.5kg
  with 50.5kg on hand was REJECTED ("insufficient foodgrain stock — need 150500g, have 50500g"); meals 400 >
  enrolment 320 was REJECTED; a valid 30kg serve and a 100kg receipt succeeded. Both invariants enforced
  server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (6): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal.

## Full-stack rollout #7: School Transport — route safety (capacity + fitness/licence), working end-to-end
- School Transport as a working, clickable module at /school-transport driving the Go backbone.
  lib/platform-client.ts: transport seam (platformTransportDashboard, platformRouteRoster,
  platformRegisterRoute, platformAllotSeat, platformWithdrawSeat). app/school-transport/: role-gated server
  actions (manage:students for seats, manage:school for routes); a force-dynamic page with a realtime safety
  picture (routes · capacity · seated · utilisation% · unserviceable count), per-route cards showing
  seated/capacity + serviceable/UNSERVICEABLE badge + the safety reason + a roster with working Withdraw, an
  Allot form and a Register-route form.
- PROVEN LIVE (real client code → platformd + Postgres): 3 routes, 9/84 seats, 1 unserviceable; allotting to a
  full route (RT-CHN-01) was REJECTED ("route RT-CHN-01 is at capacity"); allotting to an unserviceable route
  (RT-CHN-03) was REJECTED ("cannot allot to an unserviceable route — vehicle fitness certificate expired
  (2026-03-01)"); withdrawing a seat freed it and the re-allot SUCCEEDED. Both safety invariants enforced
  server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (7): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport.

## Full-stack rollout #8: School Health Immunisation — dose-sequence invariant, working end-to-end
- Immunisation as a working, clickable module at /health-immunisation driving the Go backbone.
  lib/platform-client.ts: immunisation seam (platformImmunisationDashboard, platformImmunisationSchedule,
  platformStudentImmunisationCard, platformRecordDose). app/health-immunisation/: role-gated server actions
  (manage:students); a force-dynamic page with students/doses/vaccines stats, per-vaccine coverage
  (complete/partial/due + %), a Record-dose form (vaccine from the live schedule), and an officer-only follow-up
  worklist. Health data sensitive: aggregate coverage public, per-child worklist officer-only.
- PROVEN LIVE (real client code → platformd + Postgres): schedule [Albendazole, JE, MR, Td10, Td16, VitA];
  10 students / 41 doses; recording MR dose 2 with no dose 1 was REJECTED ("out-of-sequence dose — MR dose 2
  requires dose 1 first"); an off-schedule vaccine (COVID) was REJECTED; recording dose 1 then dose 2 in order
  SUCCEEDED. All gates enforced server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (8): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation.

## Full-stack rollout #9: Free-Supply Entitlement — no over-issue, working end-to-end
- Entitlement Distribution as a working, clickable module at /free-supply driving the Go backbone.
  lib/platform-client.ts: entitlement seam (platformEntitlementDashboard, platformGrantEntitlement,
  platformIssueSupply). app/free-supply/: role-gated server actions (manage:school); a force-dynamic page with
  students/items/shortfall stats, per-item fulfilment (entitled vs issued + %), an Issue form (entitlement
  picked from the shortfall worklist), a Grant form, and a shortfall worklist.
- PROVEN LIVE (real client code → platformd + Postgres): 8 students / 9 shortfall; issuing 3 against
  ENT-CHN-006-uniform (2 remaining) was REJECTED ("issue would over-issue ENT-CHN-006-uniform — remaining 2,
  tendered 3"); issuing exactly 2 SUCCEEDED; grant-a-new-entitlement + issue-within SUCCEEDED. The over-issue
  gate enforced server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (9): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement.

## Full-stack rollout #10: Class Timetable — teacher-clash invariant, working end-to-end
- Timetable as a working, clickable module at /class-timetable driving the Go backbone. lib/platform-client.ts:
  timetable seam (platformTimetableDashboard, platformClassTimetable, platformTeacherTimetable, platformSetSlot).
  app/class-timetable/: role-gated server actions (manage:school); a force-dynamic page with slots/classes/
  teachers/overloaded stats, a rendered weekly grid (day × period) for the seeded class, an Assign-slot form
  (class/day/period/subject/teacher), and a per-teacher weekly-load table with overload flags. The school org +
  classes are discovered from a seeded teacher's slots.
- PROVEN LIVE (real client code → platformd + Postgres): 30 slots / 3 teachers; SYN-T-01 busy friday P1 in
  Grade 8-A; assigning SYN-T-01 to Grade 9-Z at the SAME friday P1 was REJECTED ("teacher SYN-T-01 is already
  teaching Grade 8-A at friday"); assigning to a free period (P8) SUCCEEDED. The clash invariant enforced
  server-side (in SQL).
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (10): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable.

## Full-stack rollout #11: School Library — one-copy-one-borrower, working end-to-end
- Library circulation as a working, clickable module at /school-library driving the Go backbone (the existing
  /library and /library-circulation demos stay intact). lib/platform-client.ts: library seam
  (platformLibraryDashboard, platformMemberLoans, platformIssueBook, platformLibraryAct). app/school-library/:
  role-gated server actions (manage:school); a force-dynamic page with active-loans/overdue/lost/members/titles
  stats, an overdue-loans list with Return/Renew/Lost buttons, and an Issue form. The library org is discovered
  from the seeded overdue loans.
- PROVEN LIVE (real client code → platformd + Postgres): 6 active / 2 overdue; copy CP-SCI-002-1 held by
  SYN-S-002; issuing the same copy to SYN-S-777 was REJECTED ("copy CP-SCI-002-1 is already on loan
  (LOAN-002)"); returning it then re-issuing SUCCEEDED. The one-copy-one-borrower invariant enforced
  server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (11): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable, School Library.

## Full-stack rollout #12: Estate & Asset Register — no-decommission-with-open-ticket, working end-to-end
- The durable infrastructure register as a working, clickable module at /estate-register driving the Go backbone
  (the existing /infrastructure and /maintenance reference demos stay intact; /asset-register is a separate
  lib/assetmgmt reference module — left untouched). lib/platform-client.ts: infra seam (platformInfraDashboard,
  platformAssetTickets, platformRegisterAsset, platformRaiseTicket, platformAdvanceTicket,
  platformDecommissionAsset, platformReturnAsset). app/estate-register/: role-gated server actions
  (manage:school); a force-dynamic page with assets/under-maintenance/decommissioned/open-tickets stats, a
  by-condition breakdown, an open-backlog-by-severity strip, a needs-attention roster that renders each asset's
  full ticket history with lifecycle controls (Assign → Resolve → Close) and per-asset Decommission /
  Return-to-service buttons, plus Register-asset and Raise-ticket forms. School org discovered from the
  needs-attention roster.
- PROVEN LIVE (real client code → platformd + Postgres): 5 seeded assets; the critical sanitation ticket
  MTK-CHN-001 auto-flipped AST-CHN-TOILET-G to under_maintenance (open_by_severity.critical=1). A fresh asset
  with an open high-severity ticket REJECTED decommission ("…open ticket…"); after Assign→Resolve→Close the
  decommission SUCCEEDED (status=decommissioned). Independently, return-to-service was REJECTED while a ticket
  was open and SUCCEEDED once closed (status=in_service, condition=good). Postgres rows verified durable
  (infra_assets=7, infra_tickets=4, 1 decommissioned). The no-decommission-with-open-ticket invariant and the
  critical auto-flip are enforced server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (12): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable, School Library,
  Estate & Asset Register.

## Full-stack rollout #13: Parent–Teacher Meetings — no-overbooking/no-double-booking, working end-to-end
- PTM as a working, clickable module at /parent-teacher-meetings driving the Go backbone's /ptm service (the
  existing /ptm reference demo stays intact). lib/platform-client.ts: ptm seam (platformPtmDashboard,
  platformSessionSheet, platformSchedulePtm, platformBookPtm, platformMarkPtmAttendance). app/parent-teacher-
  meetings/: role-gated server actions (manage:school); a force-dynamic page with sessions/total-slots/occupied/
  attended/turnout stats, a per-session rollup (fill vs slots, turnout vs booked, no-shows) with a low-turnout
  flag, a live attendance sheet for the focus session with Attended / No-show / Cancel controls, plus Schedule-
  session and Book-slot forms. School org + focus session discovered from the rollup.
- PROVEN LIVE (real client code → platformd + Postgres): seeded session PTM-CHN-T1 (8 slots, 6 occupied, 4
  attended). A fresh 2-slot session: booking the SAME student twice was REJECTED ("…already has a booking…");
  a third booking into the full session was REJECTED ("…is full (2 slots)"); attend + no-show persisted and the
  sheet reflected them. Postgres rows verified durable (ptm_sessions=2, ptm_bookings=8, 5 attended, 2 no_show).
  The no-overbooking and no-double-booking invariants are enforced server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (13): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable, School Library,
  Estate & Asset Register, Parent–Teacher Meetings.

## Full-stack rollout #14: RBSK Child-Health Screening — auto-referral + closure pipeline, working end-to-end
- RBSK as a working, clickable module at /health-screening driving the Go backbone's /rbsk service (the existing
  /rbsk, /rbsk-screening, /health-referrals reference modules stay intact). lib/platform-client.ts: rbsk seam
  (platformRbskDashboard, platformRbskReferrals, platformRecordScreening, platformAdvanceReferral).
  app/health-screening/: role-gated server actions (manage:school); a force-dynamic page with screened/healthy/
  with-findings/active-referrals/closure stats, a findings breakdown (the four Ds), an active-referral worklist
  with Accept-&-treat / Close (outcome) controls, and a Record-screening form (the four Ds as checkboxes). School
  org discovered from the referral worklist.
- PROVEN LIVE (real client code → platformd + Postgres): 20 seeded screenings (15 healthy, 5 referred). A healthy
  screening (no findings) raised NO referral (status=healthy); a screening flagging "deficiency" AUTO-REFERRED to
  DEIC (status=referred); treat → under-treatment, a second treat REJECTED ("only a referred screening can enter
  treatment"), close(outcome) → closed, a re-close REJECTED ("only an open referral can be closed"). Postgres rows
  verified durable (rbsk_screenings: 16 healthy, 5 referred, 1 closed). The auto-referral and pipeline transitions
  are enforced server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (14): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable, School Library,
  Estate & Asset Register, Parent–Teacher Meetings, RBSK Health Screening.

## Full-stack rollout #15: Teacher CPD (NEP-2020 50h) — count/compliance pipeline, working end-to-end
- CPD as a working, clickable module at /teacher-cpd driving the Go backbone's /cpd service (the existing /cpd
  reference module stays intact). lib/platform-client.ts: cpd seam (platformCpdDashboard, platformTeacherCpd,
  platformRecordCpd). app/teacher-cpd/: role-gated server actions (manage:staff); a force-dynamic page with
  teachers/compliant/compliance%/total-hours/deficient stats, a deficient-teacher roster with per-teacher hours-
  toward-50 progress bars, and a Record-CPD form (teacher datalist, provider/status selects, hours). The 50-hour
  NEP target is the gate; only completed/certified hours count. School org discovered from the deficient profiles
  (fallback SYN-T-01).
- PROVEN LIVE (real client code → platformd + Postgres): 8 seeded teachers, 7 compliant (87.5%), 435 total hours.
  A brand-new teacher started at 0h/non-compliant; an ENROLLED 40h course added 0 qualifying hours (still
  deficient, on the roster); a CERTIFIED 55h course flipped it to compliant and off the deficient roster; an
  invalid provider ("Udemy") was REJECTED ("invalid provider Udemy"). Postgres rows verified durable (cpd_records
  total 27, incl. the proof teacher's certified 55h + enrolled 40h). The 50-hour rule and provider/status
  validation are enforced server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (15): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable, School Library,
  Estate & Asset Register, Parent–Teacher Meetings, RBSK Health Screening, Teacher CPD.

## Full-stack rollout #16: Student Attendance — upsert marks + RTE chronic-absentee, working end-to-end
- Attendance as a working, clickable module at /student-attendance driving the Go backbone's /attendance service
  (the existing /attendance and /attendance-register reference modules stay intact). lib/platform-client.ts:
  attendance seam (platformAttendanceDashboard, platformStudentAttendance, platformMarkAttendance).
  app/student-attendance/: role-gated server actions (manage:students); a force-dynamic page with schools/marked/
  present-rate/chronic stats, a per-school daily roll-up table (present/absent/late/excused + rate), a chronic-
  absentee roster with each learner's rate + days, and a Mark form (student datalist, status/source selects,
  date). School org discovered from the chronic profiles (fallback per_school roll-up).
- PROVEN LIVE (real client code → platformd + Postgres): 12 seeded marks on 2026-06-10, SYN-STU-D a seeded
  chronic absentee. Invalid status "holiday" REJECTED ("invalid status holiday"); marking a date present then
  re-marking it absent UPSERTED (days_recorded stayed 1, rate 100→0 — a single Postgres row, not a duplicate);
  10 days at 3-present/7-absent (30%) flagged chronic=true, while 10 present (100%) was chronic=false — the RTE
  75% floor over >=10 attendable days. Postgres rows verified durable (1 row for the corrected date, 10 each for
  the chronic/ok learners). The (student,date) upsert key and the chronic-absentee rule are enforced server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (16): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable, School Library,
  Estate & Asset Register, Parent–Teacher Meetings, RBSK Health Screening, Teacher CPD, Student Attendance.

## Full-stack rollout #17: Academic Calendar — dynamic multi-tier approval chain, working end-to-end
- Calendar as a working, clickable module at /events-calendar driving the Go backbone's /calendar + /calendar/
  decide services (the existing /academic-calendar reference module stays intact). lib/platform-client.ts:
  calendar seam (platformCalendarDashboard, platformCalendarEntries, platformAddCalendarEntry,
  platformDecideCalendarEntry). app/events-calendar/: role-gated server actions (manage:school to add,
  manage:governance to decide); a force-dynamic page with entries/published/pending stats, an approval inbox that
  renders each pending entry's FULL governance route (current tier highlighted) with Approve/Reject controls
  carrying that tier's role + required scope, an upcoming-published feed, and an Add-&-submit form. The approval
  depth is sized dynamically from entry type + tenancy level.
- PROVEN LIVE (real client code → platformd + Postgres): 4 seeded entries (AY 2026-2027). A school EVENT
  auto-published (empty chain → approved). A school EXAM entered a 2-level chain G4(DEO/scheme.recommend) →
  G3(DIRECTOR/scheme.approve): a DIRECTOR acting at G4 was REJECTED ("may not act at tier G4"); a DEO without the
  scope was REJECTED ("lacks the required scope scheme.recommend"); DEO+scheme.recommend advanced it to G3;
  DIRECTOR+scheme.approve published it (status=approved, step 2/2). A reject at G4 stopped the chain
  (status=rejected, not published). Postgres rows verified durable (calendar_entries: event→approved,
  exam→approved@step2, reject→rejected). The dynamic chain sizing and fail-closed role+scope gating are enforced
  server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (17): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable, School Library,
  Estate & Asset Register, Parent–Teacher Meetings, RBSK Health Screening, Teacher CPD, Student Attendance,
  Academic Calendar.

## Full-stack rollout #18: Examinations & Results — PDP-gated marks lifecycle, working end-to-end
- Exams as a working, clickable module at /exam-results driving the Go backbone's /exams + /exams/marks +
  /exams/lifecycle services (the existing /exams and /results reference modules stay intact).
  lib/platform-client.ts: exams seam (platformExamDashboard, platformExamSheet, platformEnterMarks,
  platformExamLifecycle). app/exam-results/: role-gated server actions (manage:school); a force-dynamic page with
  sheets/results-recorded/overall-pass/pass% stats, a per-sheet roll-up (status + analytics: pass, mean, highest,
  grade distribution) with stage-appropriate lifecycle controls (Submit / Publish / Return), an Enter-marks form,
  and a PDP acting-identity selector (Teacher SYN-U-TCH vs Head Teacher SYN-U-HM).
- PROVEN LIVE (real client code → platformd + Postgres): 3 seeded sheets (open Maths / submitted Science /
  published Tamil), 90 results, 70% overall pass. A TEACHER entered a mark (persisted); an UNKNOWN actor was
  DENIED ("unknown actor"); separation of duties — a TEACHER moderating the submitted Science sheet was DENIED
  ("not authorised … write:school"), the HEAD TEACHER published it; a published sheet REJECTED further marks; the
  head ran Maths open→submit→publish and SYN-STU-001's 77/100 graded to pass=true. Postgres rows verified durable
  (exam_sheets all published, exam_results persisted). The PDP separation-of-duties gate and submit-locks-grades
  rule are enforced server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (18): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable, School Library,
  Estate & Asset Register, Parent–Teacher Meetings, RBSK Health Screening, Teacher CPD, Student Attendance,
  Academic Calendar, Examinations & Results.

## Full-stack rollout #19: User Directory & IAM — durable users + five-model access-explain, working end-to-end
- Directory as a working, clickable module at /user-directory driving the Go backbone's /directory +
  /access-explain services (the existing /staff-directory reference module stays intact). lib/platform-client.ts:
  directory seam (platformDirectorySummary, platformDirectoryScoped, platformAccessExplain; reuses the existing
  platformUpsertUser). app/user-directory/: role-gated server actions (manage:staff to upsert); a force-dynamic
  page with users/roles/access-models/in-scope stats, the five access models, a downward-scoped user list, an
  Add/Update-user form (role from the canonical catalogue), the canonical role catalogue with census, and an
  interactive ACCESS-EXPLAIN panel that renders the composed effect + the full per-model trace
  (RBAC·ABAC·ReBAC·PBAC·CABAC).
- PROVEN LIVE (real client code → platformd + Postgres): 19 seeded users / 19 roles / 5 access models. Adding a
  user with an unknown role was REJECTED ("unknown role"); a valid TEACHER upserted durably and appeared in the
  school scope (4 users). access-explain: SYN-U-TCH write:assessment @ school → PERMIT (RBAC, with per-model
  trace); SYN-U-TCH write:school → DENY ("role TEACHER does not grant write:school"); an unknown user →
  fail-closed null (no decision). Postgres rows verified durable (directory_users incl. the proof user). Role/
  jurisdiction validation and the five-model PDP are enforced server-side.
- Green: tsc 0, lint clean, coverage gate 1555 tests at 96.16/81.63/91.61, live wiring proven. Working clickable
  modules now (19): Establishment, Fee Ledger, RTE Admissions, Grievance, Scholarship/DBT, Mid-Day Meal,
  School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable, School Library,
  Estate & Asset Register, Parent–Teacher Meetings, RBSK Health Screening, Teacher CPD, Student Attendance,
  Academic Calendar, Examinations & Results, User Directory & IAM.

## Full-stack rollout #20: Audit Trail & Integrity Ledger — the hash-chain capstone, working end-to-end
- Audit was the one durable Postgres store without a web module. Added a NEW backbone read endpoint /audit to
  platformd (GET ?actor=&action=&resource=&effect=&limit= — substring filters, most-recent-first; returns chain
  length, head hash, Merkle root, a live Verify() tamper-evidence check + bad_index, and an effect census) and
  rebuilt platformd (go build + go vet clean). lib/platform-client.ts: audit seam (platformAuditTrail).
  app/audit-trail/: a force-dynamic read+verify console with an integrity banner (intact ✓ / broken at #n),
  length/integrity/showing stats, an effect census, a GET filter form (every field a real query against the
  durable ledger), and a records table (seq · ts · actor · action · resource · effect · linked hash). Append-only
  by construction — surfaced read-only.
- PROVEN LIVE (real client code → platformd + Postgres): 612 durable records accumulated from every prior
  module's operations; the hash-chain VERIFIES intact (bad_index=-1); each record's prev_hash links to the next
  record's hash in an unbroken chain; head + Merkle root are 64-char SHA-256; filtering by effect=deny surfaces
  the real PDP denials (exam separation-of-duties, unknown-actor); the effect census spans permit/executed/
  approved/published/resolved/deny/rejected/… Postgres audit_chain verified durable (612 rows). The tamper-evident
  integrity check is computed server-side.
- Green: tsc 0, lint clean, Go vet clean, build success, 1555 tests at 96.16/81.63/91.61, live wiring proven.
  ALL 21 durable Postgres stores now have a working clickable web module (20 operational verticals + the audit
  ledger). Working clickable modules now (20): Establishment, Fee Ledger, RTE Admissions, Grievance,
  Scholarship/DBT, Mid-Day Meal, School Transport, Health Immunisation, Free-Supply Entitlement, Class Timetable,
  School Library, Estate & Asset Register, Parent–Teacher Meetings, RBSK Health Screening, Teacher CPD,
  Student Attendance, Academic Calendar, Examinations & Results, User Directory & IAM, Audit Trail.

## Rollout #21 (A·B·C): multi-school seed · hosted-backbone package · interactive AI Engine Lab
- A — MULTI-SCHOOL SEED DENSIFICATION (commit 82ac177): pilotDistricts()/pilotSchools(n) round-robin helpers;
  attendance + mdm seeds now spread across 4 schools over 2 districts. Proven live on a fresh Postgres: scope=TN
  aggregates 4 schools / 48 marks / 4 chronic (bottom-up), Chennai + Coimbatore each scope to their own 2 schools
  (top-down). go build/vet/test green; school 0 unchanged so prior proofs hold.
- B — HOSTED-BACKBONE DEPLOY PACKAGE (commit f27e0a5): deploy/backbone/ — a Render blueprint (managed Postgres +
  Dockerised platformd with /healthz), a backbone-only docker-compose + .env.example, and a README wiring guide
  (deploy backbone → set PLATFORM_URL + PLATFORM_DEFAULT_ORG in Vercel → redeploy), incl. managed-DB option and a
  security note. Makes the deployed Vercel site one env var from fully click-to-persist. (Provisioning the host /
  setting Vercel secrets is the one human step I can't do from the sandbox.)
- C — INTERACTIVE AI ENGINE LAB (this commit): app/ai-engine-lab/ runs two of the 6 native AI engines LIVE on
  user input via server actions — the Analytics engine (mean/median/spread/trend/z-score anomaly detection) and
  the Conversational engine (grounded, citation-backed Q&A over a fixed TN school-policy corpus that refuses
  off-corpus questions). Pure/deterministic/explainable/human-authority — and because they run in-app they work on
  the deployed site even without the backbone. Proven: analytics flags the injected anomaly; conversational cites
  RTE-2009 and refuses an off-corpus question.
- Green: tsc 0, lint clean, go vet/test clean, build success, 1555 tests at 96.16/81.63/91.61, all three proven
  live. Working clickable modules now (21): the 20 durable verticals + AI Engine Lab.

## Rollout #22: wider multi-school seeding + two more live AI engines
- CI hygiene: fixed a pre-existing flaky test (commit 0ee56ac) — TestPgDirectoryDurable leaked PGU-* rows (one at
  the out-of-tree node S-CHN-1) into the shared directory_users table, making TestDirectoryScopedByDownwardGov-
  ernance flake "20 of 21" by test order; added a t.Cleanup so the durable test is self-contained. The user-
  reported CI failure was the gofmt issue on 5bd255a, already fixed remotely by ce2c0cc (in tree); platform job is
  green on 6f58609.
- MULTI-SCHOOL SEED, WIDER: fees + immunisation seeds now spread across pilotSchools(4) too (joining attendance +
  mdm). Proven live on a fresh Postgres: fees scope=TN aggregates 12 defaulters / Rs 5,000 demanded across the
  estate, with Chennai and Coimbatore each scoping to their own 6 (2 schools); immunisation scope=TN aggregates
  40 children / 164 doses. go build + gofmt + full go test green.
- AI ENGINE LAB, +2 ENGINES: /ai-engine-lab now runs FOUR of the six native engines live — added Assessment
  (marks -> grade band + per-objective mastery + weak-objective flags) and Reasoning (rule-based RTE-eligibility
  inference where every conclusion cites its rule + clause). Pure/deterministic/explainable/human-authority,
  in-app so they work on the deployed site without the backbone. Proven: assessment flags the weak Geometry
  objective; reasoning fires RTE-25 + neighbourhood with full provenance.
- Green: tsc 0, lint clean, go vet/test clean, build success, 1555 tests at 96.16/81.63/91.61, all increments
  proven live.

## Rollout #23: backbone auth gateway (bearer token in front of the mutating surface)
- platformd now has a built-in auth gateway (cmd/platformd/main.go authGate middleware wrapping the mux). When
  PLATFORM_API_TOKEN is set, every state-changing request (POST/PUT/PATCH/DELETE) must carry
  `Authorization: Bearer <token>`; safe reads (GET/HEAD/OPTIONS) and /healthz stay open so dashboards + health
  checks keep working. Constant-time token compare (crypto/subtle). When the var is unset the gate is a no-op —
  local dev, the test suite and the credential-free demo are unaffected. Startup banner reports "auth on/off".
- Web seam: lib/platform-client.ts postJSON now adds the Authorization header from PLATFORM_API_TOKEN (server-only
  env, never sent to the browser); all writes route through postJSON, reads need no token.
- PROVEN LIVE: a token-protected platformd — GET /attendance -> 200 (open), POST without token -> 401, POST with a
  wrong token -> 401, POST with the correct bearer -> 200 (record persisted), GET /healthz -> 200. Through the real
  web client: a write SUCCEEDS with the correct PLATFORM_API_TOKEN and is rejected (HTTP 401) with a wrong one.
- Deploy package updated: render.yaml generates a PLATFORM_API_TOKEN, docker-compose/.env.example carry it, and
  README documents setting the SAME token on platformd + Vercel (+ a curl verification). This is the prerequisite
  that makes exposing the backend publicly safe.
- Green: tsc 0, lint clean, gofmt + go vet + go test (cmd/platformd + integration) clean, build success, 1555
  tests at 96.16/81.63/91.61, gate proven both server-side and through the web client.

## Rollout #24: all 6 AI engines live + wider multi-school seed; Render Blueprint to repo root
- Render Blueprint moved to repo root (/render.yaml, commit ccfc90a) so the dashboard's "New -> Blueprint" flow
  auto-detects it (a copy under deploy/backbone would not be found). Same content: managed Postgres +
  token-protected platformd via Dockerfile.platformd, /healthz, auto-generated PLATFORM_API_TOKEN.
- AI ENGINE LAB now runs ALL SIX native engines live: added Personalisation (prereq-aware next-objective
  recommendations over a maths learning path) and Policy (coverage-lever impact -> newly-covered beneficiaries +
  indicative cost + equity note), joining Analytics, Conversational, Assessment, Reasoning. Pure/deterministic/
  explainable; in-app so they work on the deployed site without the backbone. Proven: personalisation recommends
  Multiplication (Addition mastered) but not Division (prereq unmet); policy projects 60%->85% of 100k = 25,000
  newly covered at the right cost.
- MULTI-SCHOOL SEED, WIDER: entitlement + rbsk seeds now spread across pilotSchools(4) too (joining attendance,
  mdm, fees, immunisation -> 6 modules). Proven live on a fresh Postgres: entitlement scope=TN aggregates 32
  students (Chennai 16 + Coimbatore 16); rbsk scope=TN aggregates 80 screened / 12 referrals (40 + 40). Scholarship
  has no seed (filed interactively) so nothing to spread there. go build + gofmt + full go test green.
- DEPLOYMENT BOUNDARY (honest): cannot deploy backend+DB to a public host from the sandbox — no cloud account/
  creds (api.render.com 403), Docker Hub image pulls firewall-blocked (403 on the blob CDN, so the production
  image can't be built here), and no public ingress. The native stack (same Go code + real Postgres + auth gate +
  multi-school) is proven repeatedly; the Render Blueprint + deploy/backbone package make it one sign-in away.
- Green: tsc 0, lint clean, gofmt + go test (integration) clean, build success, 1555 tests at 96.16/81.63/91.61,
  all increments proven live.

## Rollout #25: multi-school seeding extended to 7 more modules (13 total)
- Added schoolTag(si) helper: "CHN" for school 0 (so all existing ids + the tests/proofs that reference them are
  unchanged) and "S<n>" otherwise. Extended seven more seeds across pilotSchools(4): establishment, infra,
  timetable, ptm, library, transport, exams. Care taken with the cross-school invariants — timetable teachers and
  library copy ids are globally unique, so both are per-school-suffixed (a teacher can't be shared between schools;
  a physical copy can't exist twice).
- Multi-school now covers 13 modules: attendance, mdm, fees, immunisation, entitlement, rbsk, establishment,
  infra, timetable, ptm, library, transport, exams.
- PROVEN LIVE on a fresh Postgres (scope=TN aggregates, districts scope to their own 2 schools): establishment 72
  sanctioned (Chennai 36 + Coimbatore 36); infra 20 assets / 8 open tickets / 4 under-maintenance; timetable 120
  slots / 12 teachers; ptm 4 sessions / 32 slots / 16 attended; library 24 active loans / 8 overdue; transport 12
  routes; exams 12 sheets / 360 results. go build + gofmt + go vet + full go test green (school-0 ids preserved so
  every existing proof still passes).
- Remaining (next batch): cpd (teachers), grievance + admission (case/approval workflows — multi-school is about
  flow not counts). Scholarship has no seed (filed interactively); calendar is approval-based.
- Green: go build/gofmt/vet/test clean; no TS changed this turn so tsc/lint/coverage/build unchanged from #24 and
  re-confirmed green.

## Rollout #26: multi-school seeding extended to CPD (14 modules; all seeded count-rollups now multi-school)
- cpd seed now spreads across pilotSchools(4): a teacher cohort per school with one engineered deficient teacher
  each. Teachers are per-school-suffixed (a teacher belongs to one school); school 0 keeps SYN-T-0n so existing
  proofs/tests pass.
- Multi-school now covers 14 modules: attendance, mdm, fees, immunisation, entitlement, rbsk, establishment,
  infra, timetable, ptm, library, transport, exams, cpd.
- PROVEN LIVE on a fresh Postgres: cpd scope=TN aggregates 32 teachers / 28 compliant / 4 deficient (1 per
  school) / 1724 hours; Chennai 16 + Coimbatore 16. go build + gofmt + full go test green.
- This completes the multi-school seeding for ALL seeded count-rollup modules. Remaining seeded modules left by
  design: directory (the IAM role plane, not a school count) and calendar (approval workflow). grievance,
  admission and scholarship have NO seed (filed interactively).
- Green: go build/gofmt/test clean; no TS changed, Next build re-confirmed; 1555 tests at 96.16/81.63/91.61.

## Rollout #27: NEW durable vertical — School Inspection & Monitoring (deep-build #23)
- First brand-new durable backbone vertical built this phase (the prior 22 wired existing stores). Built fully
  inline in the integration package (no go.mod change, like admission): platform/integration/inspection.go
  (domain Inspection + file→action→close transitions + no-duplicate-open invariant + in-memory store + Platform
  methods + scoped dashboard + multi-school seed) and inspection_pg.go (durable PostgreSQL adapter, self-
  migrating). New platformd endpoint /inspection (GET dashboard/list/id; POST file|action|close). lib/platform-
  client.ts: inspection seam. app/school-inspection/: role-gated (manage:governance) force-dynamic dashboard
  (inspections/open/closed/avg-compliance/low/by-type), an open worklist with Record-action / Close controls, and
  a File-inspection form.
- INVARIANTS (server-side): a school cannot carry two OPEN inspections of the same type; an inspection can be
  closed only after an action is recorded against its findings; compliance score 0..100; valid type/date.
- PROVEN LIVE (real client code → platformd + a fresh Postgres): 16 seeded visits across 4 schools / 2 districts
  (academic/admin/safety/financial); score>100 rejected; duplicate open safety inspection rejected ("already has
  an open"); close-before-action rejected ("after an action"); action(note)→close succeeded; a fresh inspection
  allowed once the prior closed. TN rollup total 18 / avg compliance 58.8 / 10 low-compliance; districts strict
  subsets. Postgres `inspections` table verified durable.
- Green: go build + gofmt + go vet + full go test clean; tsc 0, lint clean, build success, 1555 tests at
  96.16/81.63/91.61. Durable backbone web modules now 23 (was 22). [(b) brochure pillar + (c) live deploy: queued.]

## Rollout #28 (b): advance the 'modules' brochure pillar — self-verifying durable-module register
- Honest advancement of the partial "391 functional modules" pillar. Its note was stale ("7 deep-transactional");
  this session built 23 deep durable backbone-wired modules. Added lib/governance/durable-modules.ts — a register
  pinning the 23 routes whose server actions drive platformd + PostgreSQL, each with its backbone service +
  enforced invariant — and tests/durable-modules.test.ts which asserts every listed route has an actions.ts that
  imports @/lib/platform-client (i.e. is genuinely durable, not reference UI). The "23 deep modules" claim is now
  TEST-ENFORCED and cannot drift.
- Refreshed brochure-coverage.ts notes honestly (all stay PARTIAL — no overstatement): modules → cites the 23
  deep-transactional modules + the self-verifying register; persistence → cites the 22 self-migrating PostgreSQL
  stores proven durable vs PG16 (state-scale load test still pending); auth → cites the new backbone auth gateway
  (still a single shared secret, not per-user SSO).
- Register integrity preserved: coverage stays a candid mid-range (<100%); keys-hsm/escrow-offswitch/multicloud
  still pending; federation still partial — all enforced by tests/brochure-coverage.test.ts.
- NOTE: the ephemeral container re-cloned stale at #12 again mid-session; all work was safe on origin (6f44cbf) —
  fetched + hard-reset to restore the tree, no loss.
- Green: tsc 0, lint clean, build success, 1557 tests (+2) at 96.17/81.64/91.62; durable-modules.ts 100% covered.

## Rollout #29 (a): NEW durable vertical — Transfer Certificates (deep module #24)
- Second net-new durable backbone vertical, built inline in the integration package: tc.go (domain
  TransferCertificate + request→issue→cancel transitions + one-active-TC-per-student invariant + in-memory store +
  Platform methods + scoped dashboard + multi-school seed) and tc_pg.go (self-migrating PostgreSQL adapter). New
  platformd endpoint /tc (GET dashboard/list/id; POST request|issue|cancel). lib/platform-client.ts: tc seam.
  app/transfer-certificate/: role-gated (manage:students) dashboard (total/issued/pending/cancelled + by-reason),
  a pending worklist with Issue(serial)/Cancel controls, and a Raise-TC form.
- INVARIANTS (server-side): a student can hold at most one ACTIVE TC (requested or issued) per school; issue needs
  a serial number; valid reason/date.
- PROVEN LIVE (real client code → platformd + a fresh Postgres): 12 seeded TCs across 4 schools / 2 districts;
  invalid reason rejected; a SECOND active TC for the same student rejected ("already has an active TC");
  issue-without-serial rejected; request→issue(serial)→cancel succeeded; a fresh TC allowed once the prior was
  cancelled. Postgres transfer_certificates verified durable (8 issued / 5 requested / 1 cancelled).
- Register updated: added transfer-certificate to lib/governance/durable-modules.ts (now 24) — the durable-modules
  test verifies its actions.ts drives platform-client; brochure 'modules' note bumped 23→24 deep-transactional.
- Green: go build/gofmt/vet/test clean; tsc 0, lint clean, build success, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 24.

## Rollout #30 (a): NEW durable vertical — Staff Attendance & Payable Days (deep module #25)
- Third net-new durable backbone vertical (inline in integration): staffattendance.go (domain StaffAttendance +
  payable-days/LWP computation + (employee,date) upsert + in-memory store + Platform methods + scoped dashboard +
  multi-school seed) and staffattendance_pg.go (self-migrating PostgreSQL adapter, PK (employee_id,date)). New
  platformd endpoint /staff-attendance (GET dashboard/employee-profile; POST mark). lib/platform-client.ts: staff
  seam. app/employee-attendance/ (route /staff-attendance was a reference module): role-gated (manage:staff)
  dashboard (schools/marked/present-rate/on-leave/LWP) + an LWP roster with per-employee payable/LWP + a Mark form.
- PURPOSE distinct from student attendance (RTE retention): payroll-grade — present/on_duty/leave = 1 payable day,
  half_day = 0.5, unauthorised absent = 0 and accrues toward leave-without-pay (LWP).
- PROVEN LIVE (real client code → platformd + a fresh Postgres): 24 employees across 4 schools / 2 districts with
  one LWP employee per school; invalid status rejected; a 5-day mix computed payable_days=3.5 + lwp_days=1;
  re-marking the absent day as present UPSERTED (still 5 days, lwp_days→0, payable→4.5). Postgres staff_attendance
  durable. districts strict subsets.
- Register: added employee-attendance to durable-modules.ts (now 25, test-verified backbone-wired); brochure
  'modules' note 24→25.
- Green: go build/gofmt/vet/test clean; tsc 0, lint clean, build success, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 25.

## Rollout #31 (a): NEW durable vertical — School Grant Utilisation (deep module #26)
- Fourth net-new durable backbone vertical (inline in integration), money-grade. grant.go (domain Grant +
  allocate→spend→close + NO-OVER-SPEND invariant + in-memory store + Platform methods + scoped utilisation
  dashboard + multi-school seed) and grant_pg.go (self-migrating PostgreSQL adapter). New platformd endpoint
  /grant (GET dashboard/list/id; POST allocate|spend|close). lib/platform-client.ts: grant seam.
  app/school-grants/: role-gated (manage:governance) dashboard (grants/allocated/spent/balance/utilisation% +
  by-head, ₹ from paise), a low-utilisation roster with Book-expenditure / Close controls, and an Allocate form.
- INVARIANT (server-side): cumulative expenditure can NEVER exceed the allocation; amounts in paise; only an open
  grant can be spent against.
- PROVEN LIVE (real client code → platformd + a fresh Postgres): 12 seeded grants across 4 schools / 2 districts;
  invalid head rejected; allocate ₹1,000 → spend ₹600 ok → spend ₹500 REJECTED (over-spend, ₹400 remaining) →
  spend exactly ₹400 ok (fully utilised) → further ₹0.01 rejected → close ok → spend-after-close rejected.
  Postgres grants durable (13 rows, ₹4.01L allocated / ₹2.65L spent). districts strict subsets.
- Register: added school-grants to durable-modules.ts (now 26, test-verified backbone-wired); brochure 'modules'
  note 25→26.
- Green: go build/gofmt/vet/test clean; tsc 0, lint clean, build success, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 26. CI platform workflow confirmed GREEN on all recent commits (amd64 fix held).

## Rollout #32 (a): NEW durable vertical — Lesson Plans (deep module #27, design-led)
- Per a design consultation (user chose: complementary period model · reference-timetable+snapshot · full
  Lesson-Plan module FIRST), built the durable Lesson Plans vertical (inline in integration). lessonplan.go
  (domain LessonPlan + draft→publish→archive + PUBLISH QUALITY-GATE: cannot publish without learning objectives +
  in-memory store + Platform methods + scoped dashboard + multi-school seed with FLN/NEP tags) and lessonplan_pg.go
  (self-migrating PostgreSQL adapter). New platformd endpoint /lesson-plan (GET dashboard/list/id; POST create|
  publish|archive). lib/platform-client.ts: lesson-plan seam. app/lesson-plan/ (the reference /lesson-plans stays
  intact): role-gated (manage:school) dashboard (plans/published/draft/archived + by-subject), a draft worklist
  with Publish/Archive controls (flagging plans with no objectives), and an authoring form (topic/objectives/
  FLN-NEP tags/resources/periods).
- PROVEN LIVE (real client code → platformd + a fresh Postgres): 12 seeded plans across 4 schools / 2 districts (8
  published, 4 draft — the no-objectives Science plan stays draft per school); missing topic rejected; publishing a
  draft WITHOUT objectives REJECTED ("cannot publish ... without learning objectives"); adding objectives then
  publishing succeeded; re-publish rejected; archive succeeded. Postgres lesson_plans durable (8 published / 4
  draft / 1 archived). districts strict subsets.
- Register: added lesson-plan to durable-modules.ts (now 27, test-verified backbone-wired); brochure 'modules'
  note 26→27.
- NEXT (per the design): a Period-wise Attendance & Lesson-Delivery module that references the Class Timetable slot
  (snapshot subject/teacher), a date, and a PUBLISHED lesson plan — computing subject-wise attendance % + teacher
  engagement. Daily Student/Staff attendance stay as-is (RTE + payroll).
- Green: go build/gofmt/vet/test clean; tsc 0, lint clean, build success, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 27.

## Rollout #33 (a): NEW durable vertical — Period Attendance & Lesson Delivery (deep module #28, design-led step 2)
- Completes the period-attendance design the user approved (complementary module · reference-timetable+snapshot ·
  Lesson-Plan first). Built the durable Period Attendance & Lesson Delivery vertical inline in integration.
  periodattendance.go (domain PeriodAttendance keyed org|class|date|period; MarkPeriod validates the period against
  the Class Timetable slot — rejects "no scheduled period" for that day — and SNAPSHOTS subject + teacher from the
  slot; day derived from the date via Weekday; start/end from a 45-min bell schedule; a delivered period may LINK a
  PUBLISHED lesson plan, validated against the lesson-plan store; present = strength − absentees; (org,class,date,
  period) upsert corrects a mark) + in-memory store + Platform methods + scoped dashboard (delivered/not_held/
  present_rate/by_subject SubjectAttendance/teacher_engagement) + multi-school seed (6 periods/school on 2026-06-01
  Mon, Mathematics period linked to LP-<tag>-01). periodattendance_pg.go (self-migrating PostgreSQL adapter).
  New platformd endpoint /period-attendance (GET dashboard/sheet; POST mark). lib/platform-client.ts: period seam.
  app/period-attendance/ (manage:students gated): live stat strip, subject-wise attendance + teacher-engagement
  cards, the day's period sheet, and a Mark-period form. Cross-module: reads Timetable (#10) + Lesson Plan (#27).
- PROVEN LIVE (real client code → platformd + a fresh Postgres): dashboard rollup 24 delivered with subject-wise
  split and teacher engagement, district subset honoured; integration test — an unscheduled period REJECTED ("no
  scheduled period"); a DRAFT plan (LP-CHN-03) REJECTED ("must be published"); the PUBLISHED LP-CHN-01 accepted with
  subject=Mathematics / teacher=SYN-T-03 / day=monday / present_count=28; upsert correction to 29; a not_held period
  recorded. Postgres period_attendance durable (23 delivered + 1 not_held).
- Register: added period-attendance to durable-modules.ts (now 28, test-verified backbone-wired); brochure 'modules'
  note 27→28 ("28 are now DEEP-transactional").
- Auth gateway (carried): platformd writes pass through authGate (bearer token, constant-time compare; reads + /healthz open).
- Green: go build/gofmt/vet/test clean; tsc 0, lint clean, build success, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 28.

## Rollout #34 (a): NEW durable vertical — SMC Meetings & Resolutions (deep module #29, RTE §21–22)
- Built the durable School Management Committee governance vertical inline in integration. smc.go (domain
  SMCMeeting + embedded Resolution action items; lifecycle scheduled→convened→closed with an open→done resolution
  sub-lifecycle; TWO hard server-side invariants: (1) COMPOSITION — RTE §21(2) three-fourths-parents rule
  (parent_members ≥ ceil(0.75×total), rejected at schedule time), (2) QUORUM — a meeting can only be CONVENED, and
  resolutions only passed, when a majority is present (present ≥ total/2+1); resolutions cannot be passed on a
  non-quorate meeting + in-memory store + Platform methods + scoped dashboard (meetings/by_status/quorate_rate/
  open_actions + open-action worklist) + multi-school seed (a convened Q1 review with one done + one open
  resolution, and a scheduled Q2 review, per school across 2 districts)) and smc_pg.go (self-migrating PostgreSQL
  adapter; resolutions stored as JSON). New platformd endpoint /smc (GET dashboard/list/id; POST schedule|convene|
  resolve|complete|close). lib/platform-client.ts: SMC seam. app/smc-meetings/ (manage:school gated): live stat
  strip, open-action worklist with per-item Mark-done, status mix, the meetings table, and schedule/convene/
  resolve/close forms.
- PROVEN LIVE (real client code → platformd + a fresh Postgres, with the auth gateway enforced): composition reject
  (12 members / 8 parents → "three-fourths parents"); full lifecycle — resolve-before-convene REJECTED ("convened"),
  convene-without-quorum REJECTED (5 of 10 → "quorum not met"), convene with 7/10 accepted, resolution passed +
  embedded id, completed (open→done), meeting closed; durable read-back via the scoped list; downward-governance
  scope (Chennai + Coimbatore subsets ⊆ TN). Auth gate: POST without bearer → 401, with token → 200, GET open.
- Register: added smc-meetings to durable-modules.ts (now 29, test-verified backbone-wired); brochure 'modules'
  note 28→29.
- Green: tsc 0, lint clean, next build success, gofmt/vet/go test clean, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 29.

## Rollout #35 (a): NEW durable vertical — Bonafide Certificate Register (deep module #30, cross-module)
- Built the durable Bonafide / study-certificate registrar vertical inline in integration. bonafide.go (domain
  BonafideCertificate; lifecycle requested→issued→revoked; TWO invariants: (1) CROSS-MODULE — IssueBonafide reads
  the live TC store (studentHasActiveTC) and REJECTS issuing for a student who has an active transfer certificate
  (requested/issued) — they are no longer on rolls here; (2) SERIAL INTEGRITY — each issued certificate is stamped
  with a monotonic per-school serial BNF/<org>/2026/NNNN; a request issues once, only an issued cert revokes +
  in-memory store + Platform methods + scoped dashboard (by_status/by_purpose/issued + pending worklist) +
  multi-school seed (one issued + one pending per school across 2 districts)) and bonafide_pg.go (self-migrating
  PostgreSQL adapter). New platformd endpoint /bonafide (GET dashboard/list/id; POST request|issue|revoke).
  lib/platform-client.ts: bonafide seam. app/bonafide-register/ (manage:students gated): live stat strip, the
  register table, and request/issue/revoke forms.
- Bug found + fixed during live-proof: seedBonafide (runs inside bonafideOnce.Do) called nextBonafideSerial which
  re-entered bonafideState() → sync.Once self-deadlock (first request hung). Fixed by threading the store through
  nextBonafideSerial(s, org) so seeding never re-enters the Once. Caught precisely because the module was proven
  live, not just unit-asserted.
- PROVEN LIVE (real client code → platformd + a fresh Postgres, auth gate enforced): clean issue stamps a serial
  matching ^BNF/33030004181/2026/\d{4}$ and is durably listed; re-issue rejected ("only a requested certificate");
  CROSS-MODULE — after the student is given an active TC (reason transfer), issuing the bonafide is REJECTED
  ("active transfer certificate"); revoke only applies to an issued cert; downward-governance scope (Chennai +
  Coimbatore ⊆ TN). Auth gate: POST without bearer → 401, GET open → 200.
- Register: added bonafide-register to durable-modules.ts (now 30, test-verified backbone-wired); brochure
  'modules' note 29→30.
- Green: tsc 0, lint clean, next build success, gofmt/vet/go test clean, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 30.

## Rollout #36 (a): NEW durable vertical — Teacher Transfer & Posting (deep module #31, cross-module)
- Built the durable Teacher Transfer & Posting HR vertical inline in integration (teachertransfer.go + _pg.go).
  Domain TeacherTransfer; lifecycle requested→approved→posted (or rejected). TWO invariants: (1) SINGLE ACTIVE
  REQUEST — a teacher cannot hold two in-flight transfer requests; (2) CROSS-MODULE VACANCY GATE — ApproveTransfer
  computes cadreVacancy(toOrg, cadre) from the LIVE Establishment register (sanctioned − filled over the school's
  active establishments of that cadre) and REJECTS approval when there is no open post — you cannot post a teacher
  where no sanctioned vacancy exists. Scoped dashboard by DESTINATION school (by_status/by_reason/posted + pending
  worklist); multi-school seed across 2 districts (a posted transfer into a school with a BT vacancy + a pending
  mutual request). Named TeacherTransfer/teacher-transfer to avoid colliding with transfer.go (student APAAR
  portability — an unrelated concern).
- New platformd endpoint /teacher-transfer (GET dashboard/list/id; POST request|approve|post|reject). lib/platform-
  client.ts: teacher-transfer seam. app/teacher-transfer/ (manage:staff gated): live stat strip, the requests table
  (by destination), and request/approve/post/reject forms.
- PROVEN LIVE (real client code → platformd + a fresh Postgres, auth gate enforced): single-active-request reject;
  CROSS-MODULE both ways — a BT transfer (8/7 sanctioned, 1 vacancy) approves+posts, a Secondary-Grade transfer
  (6/6, full) is REJECTED ("no sanctioned vacancy"); post-before-approve rejected; reject only on a requested one,
  durably listed; downward-governance scope by destination (Chennai + Coimbatore ⊆ TN). Auth gate: POST without
  bearer → 401, GET open → 200.
- Register: added teacher-transfer to durable-modules.ts (now 31, test-verified backbone-wired); brochure 'modules'
  note 30→31.
- Green: tsc 0, lint clean, next build success, gofmt/vet/go test clean, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 31.

## Rollout #37 (deploy-identity): one URL "VASA-EOS-SE-TN" front door
- Per request ("make it all under this url VASA-EOS-SE-TN"): the platform is already a single Next.js app / single
  deployment (root → login → any of 17 portals → any of 31 modules), so this turn (a) NAMES the deploy targets and
  (b) adds an explicit single front door so everything is reachable from one URL.
- NAMING: package.json name my-v0-project → vasa-eos-se-tn (this is the slug Vercel defaults the project + URL to on
  import → https://vasa-eos-se-tn.vercel.app). render.yaml services renamed vasa-eos-platformd → vasa-eos-se-tn-
  platformd and vasa-eos-backbone-db → vasa-eos-se-tn-db. DEPLOY.md updated to document the vasa-eos-se-tn URL.
- FRONT DOOR: new app/directory/ (/directory) — a single page listing ALL 17 stakeholder portals (grouped by the 8
  governance tiers, each linked to its home / sign-in) AND ALL 31 deep modules (each linked to its route, with its
  invariant), read live from config/portals.ts + lib/governance/durable-modules.ts so it can never drift. Linked
  from the stakeholders sign-in page ("Browse the full platform directory").
- HONEST: this makes the eventual URL read vasa-eos-se-tn and puts everything under one navigable root; it does NOT
  itself create a live URL — that still needs the user to import to Vercel (or hand a token) and, for the 31 modules
  to be fully functional rather than demo, deploy the backbone (render.yaml) + set PLATFORM_URL in Vercel.
- Green: tsc 0, lint clean, next build success (/directory route added), 1557 tests at 96.17/81.64/91.62.

## Rollout #38 (viewability): demo-data fallback so modules are VIEWABLE without a backend (batch 1/…)
- Requirement: view the 31 deep modules + 17 portals on the hosted Vercel demo (no backend deploy, no tokens). The
  portals already work (demo auth). The modules showed a blocking "Backbone not connected" alert — not viewable.
- Fix pattern: lib/platform-demo.ts holds representative snapshots (TN-DIST-Chennai, synthetic SYN- ids mirroring
  the Go seeds). Each platform-client getter returns the demo snapshot when !platformConfigured() (instead of
  null/[]). Each module page now gates on data presence (!d) not connectivity, and shows components/demo-data-note
  (DemoDataNote) when !connected — so the real dashboard/lists/forms render, marked "Demo data". Writes still no-op
  in this mode; deploying the backbone (deploy/backbone) makes them persist.
- Batch 1 (6 modules wired + viewable): establishment, fee-ledger, student-attendance, smc-meetings,
  bonafide-register, teacher-transfer. Remaining ~23 durable modules to follow in subsequent batches.
- Green: tsc 0, lint clean, next build success, 1557 tests at 96.17/81.64/91.62.

## Rollout #39 (viewability): demo-data fallback batch 2/… (7 more modules viewable)
- Same pattern as batch 1: lib/platform-demo.ts snapshots + platform-client getters return demo when
  !platformConfigured() + pages gate on data presence with the DemoDataNote. Batch 2 modules now viewable on the
  hosted demo: audit-trail (hash-chain intact + records), school-inspection, transfer-certificate,
  employee-attendance, school-grants, lesson-plan, period-attendance. 13/31 modules now viewable.
- Green: tsc 0, lint clean, next build success, 1557 tests at 96.17/81.64/91.62.

## Rollout #40 (viewability): demo-data fallback batch 3/… (7 more modules viewable)
- Batch 3 modules now viewable on the hosted demo: rte-admissions (RTE §12(1)(c) HITL applications),
  grievance-cases (SLA escalation chain), dbt-scholarship, mid-day-meal, school-transport (incl. unserviceable
  route), health-immunisation. grievance-approvals already renders (flow board, no backbone gate). 20/31 modules
  now viewable. Remaining ~11: free-supply, class-timetable, school-library, estate-register,
  parent-teacher-meetings, health-screening, teacher-cpd, events-calendar, exam-results, user-directory,
  leave-approvals.
- Green: tsc 0, lint clean, next build success, 1557 tests at 96.17/81.64/91.62.

## Rollout #41 (viewability): demo-data fallback batch 4/… (7 more modules viewable)
- Batch 4 now viewable: free-supply, class-timetable, school-library, estate-register (with open tickets),
  parent-teacher-meetings, health-screening (RBSK), teacher-cpd. 27/31 modules now viewable. Remaining 4:
  events-calendar, exam-results, user-directory, leave-approvals.
- Green: tsc 0, lint clean, next build success, 1557 tests at 96.17/81.64/91.62.

## Rollout #42 (viewability): demo-data fallback batch 5/5 — ALL 31 modules viewable
- Final batch: events-calendar (multi-tier approval inbox), exam-results (subject sheets + analytics),
  user-directory (5-model IAM census). leave-approvals already renders (flow board, no backbone gate).
- ALL 31 durable modules + 17 portals are now fully VIEWABLE on the hosted Vercel demo with representative data
  (DemoDataNote marks it), with zero backend deploy and zero tokens. Writes persist once the backbone is deployed
  (deploy/backbone). The /directory page links every portal + module.
- Green: tsc 0, lint clean, next build success, 1557 tests at 96.17/81.64/91.62.

## Rollout #42: wire all 31 durable modules into the sidebar navigation
- The left-nav was a curated list pointing at the older reference routes (/fees, /timetable, …), so the 31 deep
  durable modules (SMC, bonafide, teacher-transfer, …) were only reachable via /directory or direct URL.
- config/dashboard-nav.ts: added a shared durableModuleNav[] (a "▸ Durable Modules" link to /directory + all 31
  module links with icons, kept in sync with lib/governance/durable-modules.ts) and spread it into the operational
  roles: ADMIN, PRINCIPAL, BEO, DEO, DIRECTOR, SECRETARY, MINISTER. Now every durable module is clickable from the
  sidebar; pages stay role-gated server-side.
- Green: tsc 0, lint clean, next build success, 1557 tests at 96.17/81.64/91.62.

## Rollout #43: NEW durable vertical — Hostel Allocation & Occupancy (deep module #32) + sidebar to ALL roles
- Built the durable Hostel Allocation & Occupancy welfare vertical inline in integration (hostel.go + _pg.go).
  Domain Hostel with embedded Residents; allot→vacate lifecycle. TWO invariants: (1) CAPACITY — occupancy can never
  exceed capacity (no over-allocation); (2) ONE BED PER STUDENT statewide — AllotBed scans every governed hostel and
  rejects a second active placement. Scoped dashboard (hostels/capacity/occupied/occupancy_pct/by_type + near-full
  ≥90% worklist); multi-school seed (a near-full boys + a girls hostel per school across 2 districts). Route is
  /hostel-occupancy (both /hostel and /hostel-allocation are pre-existing reference pages).
- New platformd endpoint /hostel (GET dashboard/list/id; POST register|allot|vacate|close). lib/platform-client.ts:
  hostel seam (+ demo fallback). app/hostel-occupancy/ (manage:school/students gated). Register now 32; brochure
  'modules' note 31→32.
- PROVEN LIVE (real client → platformd + fresh Postgres, auth gate enforced): register+allot+vacate durable;
  CAPACITY — 3rd allotment into a cap-2 hostel rejected ("full"); ONE-BED — a student already placed cannot be
  placed in a second hostel ("already holds an active bed"), but can after vacating; close-with-residents rejected;
  downward-governance scope (Chennai+Coimbatore ⊆ TN). POST without bearer → 401.
- SIDEBAR: config/dashboard-nav.ts now spreads durableModuleNav into ALL 17 roles (added the remaining TEACHER,
  STUDENT, SUBJECT_INCHARGE, ACADEMIC_HEAD, INSTITUTION_HEAD, PARENT, CRCC, VENDOR, RESEARCHER, PUBLIC); pages stay
  role-gated server-side. Hostel added to the durable-modules nav section.
- Green: tsc 0, lint clean, next build success, gofmt/vet/go test clean, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 32.

## Rollout #44: NEW durable vertical — CIFM Campus Infrastructure & Facilities Management (deep module #33)
- User asked whether "Native AI Language Lab" + "Native AI CIFM" are in the catalogue/repo. Honest answer: CIFM
  was absent (only the Estate & Asset Register existed); Language Lab partial (Bhashini/i18n/multilingual + the
  language Native-AI pillar) but no dedicated module. Built CIFM this turn; Language Lab queued next.
- Built the durable CIFM facilities-operations vertical inline in integration (cifm.go + cifm_pg.go). Domain
  Facility (building/lab/toilet/water/electrical/ground) + AMC + embedded WorkOrders; register → raise → complete →
  set-operational / close. SAFETY invariant: a facility cannot return to operational while an OPEN CRITICAL work
  order remains, and raising a critical WO auto-flips it to under_maintenance. Distinct from estate-register (asset
  register + decommission gate). Scoped dashboard (by category/status/condition + open WOs + critical-open +
  needs-attention worklist); multi-school seed (one critical toilet WO per school). Route /campus-facilities.
- New platformd endpoint /cifm (register|raise|complete|operational|close). lib/platform-client.ts: cifm seam +
  demo fallback. app/campus-facilities/ (manage:school gated). Register now 33; brochure note 32→33. Added to the
  durable-modules sidebar section (all 17 roles).
- PROVEN LIVE (real client → platformd + fresh Postgres, auth gate enforced): register + WO lifecycle durable;
  SAFETY GATE — critical WO auto-flips to under_maintenance, set-operational REJECTED until the WO is completed,
  then succeeds; close-with-open-WO rejected; downward-governance scope (Chennai+Coimbatore ⊆ TN). POST w/o bearer → 401.
- Green: tsc 0, lint clean, next build success, gofmt/vet/go test clean, 1557 tests at 96.17/81.64/91.62.
  Durable backbone web modules now 33.
