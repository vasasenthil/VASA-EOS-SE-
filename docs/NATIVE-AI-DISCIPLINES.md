# The four interlocking disciplines of native-AI engineering — implementation map

Spec → Loop → Context → Token → back to Spec, at scale, under continuous human authority. How each maps to
built, tested Go modules in this platform.

## SPEC ENGINEERING · the North · *what is true*
Declarative ground truth.
- **Rego policy plane** — `policies/` (33 `opa test`): RBAC/ReBAC/ABAC/PBAC + RTE/DPDP/RPwD/POCSO/PFMS/RTI +
  AI safety/bias/drift + data classification/residency/retention; composed in `decision.rego`.
- **391-module catalogue** — `modules/catalogue.yaml` (+ linter), OpenAPI 3.1 / AsyncAPI 3.0 contracts.
- **BPMN** — `platform/L6-platform-services/workflow.ToBPMN` exports the approval flow as BPMN 2.0 XML.
- **Model cards** — `platform/L8-engines/evaluation.ModelCard` (fairness + drift + attestation → deploy gate).
- CC-SPEC-001 crosswalk + phase plans + ADRs 0001–0015.

## LOOP ENGINEERING · the Wheel · *what runs*
Audited iteration under bounded human authority.
- **Plan-Execute-Verify-Reflect controller** — `platform/L9-agents/loop`: bounded iterations, a critic that
  verifies each step, reflection on failure, and **HITL checkpoints** that pause consequential actions.
- **6 agents at L9** — `platform/L9-agents/agents` composing the engines; **MCP tool registry** +
  **role-gated HITL queue** + **orchestrator** (auto vs route-to-human). Wired via `Platform.RunLoop` /
  `Advise`, every step audited.

## CONTEXT ENGINEERING · the Fuel · *what informs*
Grounded · sovereign · policy-bound.
- **L7 knowledge graph** — `platform/L7-knowledge/graph` (prerequisites · learning path · readiness).
- **Policy-bound hybrid retrieval** — `platform/L7-knowledge/retrieval`: keyword (BM25-style) + graph
  expansion, **filtered by tenant isolation (T0–T6) and data classification BEFORE grounding** (Milvus vector
  leg gated on B-013). Wired into the tutor (`Sources`).
- **Tenant isolation** — `dataplane` residency + Citus RLS + `lib/access/scope`.

## TOKEN ENGINEERING · the Economics · *what scales*
Equity-bound · observable.
- **Token economics** — `platform/L8-engines/tokens`: **per-user equity budget** (no user starves others),
  **prompt + semantic cache** (hits cost ~0), **tier routing** (Cached/Standard/Premium), Indic-weighted
  estimate. Wired into the serving loop (`AskTutor`): cache short-circuit, fair refusal on exhaustion, tier
  drop when low; observable at `platformd /tokens`.
- Request-tier scaling — `ratelimit` (per-key bucket + admission/load-shed) + `capacity` (1.27 Cr sizing).

## The cycle, under human authority
`platformd` runs the merged platform; every workflow is audited; consequential actions require a scoped human
(HITL). The 1-crore proof is **modelled** (`capacity` + `loadmodel`) and runs on the dedicated rig (B-032);
real LLM serving, Milvus, Besu, HSM and the cluster remain honestly **gated**.
