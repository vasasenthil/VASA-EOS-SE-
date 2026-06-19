// VASA-EOS(SE) — Twelve-Layer Architecture register (L1 Sovereign Foundation → L12 Citizen & Civic).
//
// The brochure (BRO-TN-002) markets a "twelve-layer architecture". This self-verifying register makes
// that claim concrete and HONEST: it names every one of the twelve layers, states the responsibility
// boundary of each, cites the in-repo modules that deliver it, and carries an unbiased
// built / partial / pending status with a candid note on what is and is NOT delivered.
//
// Honesty contract (asserted by tests/architecture-layers.test.ts):
//   • every layer is present exactly once, L1..L12, in order;
//   • a built/partial layer cites at least one repoRef that exists on disk;
//   • a pending layer cites nothing;
//   • the weighted coverage score is a candid mid-range, never 100%.
//
// By design, the sovereign-compute SUBSTRATE (HSM/state-held key custody, source-code escrow,
// sovereign off-switch, multi-cloud / data-residency topology) is OUT OF SCOPE for this application
// repository — it is deployment/organisational infrastructure, not app code. Those aspects are
// disclosed plainly as the un-built portion of L1/L2 rather than quietly claimed.

import { csvField } from "@/lib/csv"
import { type CapabilityStatus } from "@/lib/governance/role-capabilities"

export type LayerStatus = CapabilityStatus // "built" | "partial" | "pending"

export type LayerId =
  | "L1" | "L2" | "L3" | "L4" | "L5" | "L6"
  | "L7" | "L8" | "L9" | "L10" | "L11" | "L12"

export interface ArchitectureLayer {
  id: LayerId
  /** Canonical layer name. */
  name: string
  /** One-line role of the layer in the stack. */
  tagline: string
  /** What this layer is responsible for. */
  responsibility: string
  status: LayerStatus
  /** Candid note: what is delivered and, plainly, what is not. */
  note: string
  /** Concrete sub-components / capabilities that live in this layer. */
  components: string[]
  /** In-repo evidence (each must exist on disk for built/partial; empty for pending). */
  repoRefs: string[]
  /** Honestly enumerated aspects of this layer that are NOT built in this repo (may be empty). */
  pendingAspects: string[]
}

// Ordered L1 (foundation) → L12 (civic). The stack reads bottom-up: each layer depends on the ones
// below it and serves the ones above it.
export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: "L1",
    name: "Sovereign Foundation",
    tagline: "Sovereignty, data residency, tamper-evidence and consent at the root of trust",
    responsibility:
      "Roots the platform in state sovereignty: the immutable audit ledger, DPDP-2023 consent and purpose-binding, the sovereignty/data-residency posture and the human-authority kill-gate that every action ultimately answers to.",
    status: "partial",
    note:
      "App-level sovereignty controls are built — a hash-chained tamper-evident audit ledger, DPDP consent gate with purpose-binding and retention, and the sovereignty register. The sovereign-compute SUBSTRATE (HSM/state-held key custody, source-code escrow, a true off-switch) is organisational/infrastructure, out of scope for this repo, and remains pending by design.",
    components: ["Tamper-evident audit ledger (hash-chained)", "DPDP-2023 consent & purpose-binding", "Sovereignty posture register", "Human-authority approval gate"],
    repoRefs: ["lib/audit/trail.ts", "lib/consent/index.ts", "app/governance/sovereignty/page.tsx"],
    pendingAspects: ["HSM / state-held encryption-key custody", "Source-code escrow", "Sovereign off-switch (true kill-switch)"],
  },
  {
    id: "L2",
    name: "Infrastructure & Observability",
    tagline: "Runtime health, tracing, structured logging and operational telemetry",
    responsibility:
      "Keeps the running platform observable and operable: health/readiness probes, request tracing, structured logging and usage telemetry that operations and assurance rely on.",
    status: "partial",
    note:
      "Observability is built in app code — health/readiness probes, a tracing seam, structured logging and usage analytics. The underlying compute/hosting topology (sovereign / hybrid / multi-cloud, autoscaling) is deployment configuration, not app code, and remains pending by design.",
    components: ["Health & readiness probes", "Request tracing", "Structured logging", "Usage analytics / telemetry"],
    repoRefs: ["lib/health/index.ts", "app/api/health/route.ts", "lib/tracing/index.ts", "lib/logger/index.ts", "lib/tracking/analytics.ts"],
    pendingAspects: ["Sovereign / hybrid / multi-cloud hosting topology", "Provisioned autoscaling & load infrastructure"],
  },
  {
    id: "L3",
    name: "Data & Persistence",
    tagline: "Durable state, schema, migrations and row-level isolation",
    responsibility:
      "Owns durable state: the persistence seam (Supabase service-role or in-memory fallback), the schema, versioned SQL migrations verified against PostgreSQL 16, and deny-by-default row-level security.",
    status: "built",
    note:
      "A single persistence seam backs every module store; the schema and 70+ versioned migrations are verified against PostgreSQL 16 with RLS deny-by-default. Provisioning a live database at state scale is a deployment step, but the data tier itself is built and exercised.",
    components: ["Persistence seam (getDb)", "Schema & versioned migrations", "Row-level security (deny-by-default)", "Per-module durable stores"],
    repoRefs: ["lib/persistence/index.ts", "lib/persistence/schema.ts"],
    pendingAspects: [],
  },
  {
    id: "L4",
    name: "Integration & Federation",
    tagline: "Federate-not-duplicate: DIKSHA · UDISE+ · APAAR · PFMS gateways and the federation console",
    responsibility:
      "Connects to the national digital-public-infrastructure registries through one typed adapter interface, the NDEAR-S building-block alignment and a human-in-the-loop federation reconciliation console.",
    status: "partial",
    note:
      "13 typed adapter ports (incl. dedicated PFMS fund-flow) sit behind one interface, with the federation console, NDEAR-S 29/29 alignment and three drift detectors that compare upstream records against real local masters — APAAR↔student (field-level), state-EMIS↔enrolment (tolerance-aware counts) and PFMS↔scheme fund-flow ledger (tight money tolerance, leakage signal) — each advisory (Reconciled/Review/Flagged, human decides). Adapters are mock by default and live only when env-configured; the platform is not live-federated with the national registries at runtime.",
    components: ["Typed integration gateway (DIKSHA/UDISE+/APAAR/PFMS/DBT)", "NDEAR-S 29/29 alignment", "Drift detectors (APAAR↔student, EMIS↔enrolment, PFMS↔fund-flow)", "Federation reconciliation console (HITL)"],
    repoRefs: ["lib/integrations/index.ts", "lib/integrations/ndear-s.ts", "lib/federation/index.ts", "lib/federation/reconcile.ts"],
    pendingAspects: ["Live runtime federation with the national registries (currently mock-default seams)"],
  },
  {
    id: "L5",
    name: "Security & Access",
    tagline: "Zero-trust RBAC + ABAC + ReBAC, deny-wins, with jurisdictional scoping",
    responsibility:
      "Decides who may do what, where: the unified RBAC/ABAC/ReBAC policy decision point (fail-closed, deny-wins), per-role jurisdictional data scoping, and the zero-trust header/CSP posture.",
    status: "built",
    note:
      "A single fail-closed PDP fuses RBAC, ABAC and ReBAC with deny-wins; the downward-governance scope engine plus DB-layer RLS enforce jurisdiction; security headers and CSP are enforced in middleware. Tested.",
    components: ["Unified access PDP (RBAC+ABAC+ReBAC)", "Jurisdictional scope engine", "Zero-trust headers & CSP"],
    repoRefs: ["lib/access/policy.ts", "lib/access/scope.ts", "lib/security/index.ts"],
    pendingAspects: [],
  },
  {
    id: "L6",
    name: "Platform Services",
    tagline: "Multi-tenancy, workflow engine, audit and consent as shared services",
    responsibility:
      "Provides the cross-cutting services every module composes: the seven-tier multi-tenancy tree, the multi-tier approval workflow engine, the audit trail and the consent service.",
    status: "built",
    note:
      "Seven-tier tenancy (national→school, TN-rooted), a reusable multi-tier workflow engine (form → approvals → store → audit → role-gated inbox), the audit ledger and the consent gate are built and tested as shared platform services.",
    components: ["Seven-tier multi-tenancy", "Multi-tier workflow / approvals engine", "Audit trail service", "Consent service"],
    repoRefs: ["lib/tenancy/index.ts", "lib/workflow/index.ts", "lib/audit/trail.ts", "lib/consent/index.ts"],
    pendingAspects: [],
  },
  {
    id: "L7",
    name: "Knowledge & Content",
    tagline: "Curriculum, lesson plans and the curated knowledge base",
    responsibility:
      "Holds the pedagogical content the platform reasons over: the knowledge base, lesson plans and curriculum-aligned material that the AI engines personalise and assess against.",
    status: "built",
    note:
      "A curated knowledge base and lesson-plan store back the academic and AI layers above. Full statewide curriculum content is an ongoing content-authoring effort, but the knowledge/content tier is built and wired.",
    components: ["Curated knowledge base", "Lesson plans", "Curriculum-aligned content"],
    repoRefs: ["lib/knowledgebase/index.ts", "lib/lessonplans/index.ts"],
    pendingAspects: [],
  },
  {
    id: "L8",
    name: "Native-AI Engine Layer",
    tagline: "Six deterministic, explainable engines — advisory, no side effects",
    responsibility:
      "The reasoning core: six real engines — Reasoning, Personalisation, Assessment, Policy, Analytics, Conversational — each deterministic, explainable and advisory only (an LLM seam may refine, not replace, them).",
    status: "built",
    note:
      "Six tested engines compute explainable, side-effect-free recommendations under human authority. They never act on their own — their output feeds the agent layer and human reviewers above.",
    components: ["Reasoning", "Personalisation", "Assessment", "Policy", "Analytics", "Conversational"],
    repoRefs: ["lib/ai/engines/index.ts"],
    pendingAspects: [],
  },
  {
    id: "L9",
    name: "Native-AI Agent Layer",
    tagline: "Six purpose-built agents composing the engines under HITL",
    responsibility:
      "Composes the engines into purpose-built agents (Policy/Teacher/Student/Governance/Grievance/Compliance) whose every consequential action is queued for human approval before any side effect.",
    status: "built",
    note:
      "Six agents with the full five-part anatomy turn engine output into advisory recommendations; high-stakes or low-confidence actions require human approval via the agent approval queue. Humans decide, AI assists — across every layer.",
    components: ["Six purpose-built agents", "Confidence gating", "Human-in-the-loop approval queue"],
    repoRefs: ["lib/ai/agents/index.ts", "lib/agentflow/store.ts"],
    pendingAspects: [],
  },
  {
    id: "L10",
    name: "Experience & Access",
    tagline: "Thirteen role-tailored portals, accessible by design",
    responsibility:
      "Delivers every stakeholder their own experience: 13 role-tailored portals across ~271 routes, the shared design system, and the accessibility/i18n conformance the platform commits to.",
    status: "partial",
    note:
      "13 portals and the design system are built across the route estate. WCAG 2.1 A/AA is met by automated audit and the design system. Multilingual is real, type-safe code-first AND TMS-ready: a typed MessageKey set (English-complete at compile time, no orphan keys, typo-proof call sites) backs a measured UI-string layer, with a Git-native TMS bridge (deterministic JSON export + import-validation gate) for a self-hostable TMS — sovereign, no cloud SaaS. Tamil (TN-first), English and Hindi complete; Telugu/Malayalam/Kannada/Urdu partial with honest per-locale coverage at /accessibility/languages. AAA criteria needing assistive-tech/manual verification and full 22-language translation remain audit-required / partial.",
    components: ["13 stakeholder portals", "Shared design system / shell", "Accessibility conformance map", "Type-safe multilingual layer + Git-native TMS bridge"],
    repoRefs: ["config/portals.ts", "lib/accessibility/conformance.ts", "lib/i18n/translate.ts", "lib/i18n/tms.ts"],
    pendingAspects: ["WCAG 2.1 AAA criteria requiring assistive-tech / manual verification", "Full 22-language translation coverage across all routes"],
  },
  {
    id: "L11",
    name: "Governance & Oversight",
    tagline: "Self-verifying registers that keep every claim honest",
    responsibility:
      "Governs the platform's own truthfulness: the module catalogue, brochure-coverage map, launch-readiness scorecard and this twelve-layer register — each self-verifying so no claim outruns the code.",
    status: "built",
    note:
      "The oversight registers are built and test-guarded: built/partial rows must cite files that exist on disk, coverage scores are candid mid-ranges, and out-of-scope sovereign items stay disclosed as pending. This layer is what makes the rest auditable.",
    components: ["Module catalogue register", "Brochure-coverage map", "Launch-readiness scorecard", "Twelve-layer architecture register", "AI Control Tower + G1–G7 authority spine"],
    repoRefs: ["lib/governance/module-catalogue.ts", "lib/governance/brochure-coverage.ts", "lib/governance/launch-readiness.ts", "lib/governance/control-tower.ts"],
    pendingAspects: [],
  },
  {
    id: "L12",
    name: "Citizen & Civic Layer",
    tagline: "RTI, grievance redress and public transparency for the citizen",
    responsibility:
      "Faces the citizen: RTI request handling, grievance redress (CPGRAMS-aligned) and public communication — civic transparency as a first-class layer, not an afterthought.",
    status: "built",
    note:
      "RTI and grievance-redress flows plus public-communication surfaces are built, giving citizens transparency and a route to redress. Deep statewide civic-engagement breadth keeps expanding, but the civic layer is built and wired end-to-end.",
    components: ["RTI request handling", "Grievance redress (CPGRAMS-aligned)", "Public communication / transparency"],
    repoRefs: ["lib/rti/index.ts", "lib/grievance/index.ts", "app/governance/cpgrams/page.tsx", "app/governance/public-communication/page.tsx"],
    pendingAspects: [],
  },
]

export function layerById(id: LayerId, items: ArchitectureLayer[] = ARCHITECTURE_LAYERS): ArchitectureLayer | undefined {
  return items.find((l) => l.id === id)
}

export function byLayerStatus(status: LayerStatus, items: ArchitectureLayer[] = ARCHITECTURE_LAYERS): ArchitectureLayer[] {
  return items.filter((l) => l.status === status)
}

export interface LayersSummary {
  total: number
  built: number
  partial: number
  pending: number
  /** Honest weighted coverage: built = 1, partial = 0.5, pending = 0. */
  coveragePct: number
}

export function layersSummary(items: ArchitectureLayer[] = ARCHITECTURE_LAYERS): LayersSummary {
  const built = byLayerStatus("built", items).length
  const partial = byLayerStatus("partial", items).length
  const pending = byLayerStatus("pending", items).length
  const total = items.length
  const coveragePct = total === 0 ? 0 : Math.round(((built + partial * 0.5) / total) * 100)
  return { total, built, partial, pending, coveragePct }
}

export function toLayersCSV(items: ArchitectureLayer[] = ARCHITECTURE_LAYERS): string {
  const header = ["Layer", "Name", "Responsibility", "Status", "Note", "Components", "Evidence", "Pending aspects"]
  const rows = items.map((l) =>
    [l.id, l.name, l.responsibility, l.status, l.note, l.components.join("; "), l.repoRefs.join("; "), l.pendingAspects.join("; ")]
      .map(csvField)
      .join(","),
  )
  return [header.map(csvField).join(","), ...rows].join("\n")
}
