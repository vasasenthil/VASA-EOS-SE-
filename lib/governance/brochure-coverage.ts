// VASA-EOS(SE) — Condensed Brochure (BRO-TN-002) coverage map, honestly mapped to the repo.
//
// The seven-page condensed brochure markets a sovereign, national-scale, AI-native education
// operating system. This register takes its HEADLINE structural claims and maps each to the
// in-repo evidence that delivers it — with an unbiased built / partial / pending status and a
// candid note. Its purpose is to prevent overstatement: every built/partial row cites a file
// asserted to exist on disk (see tests/brochure-coverage.test.ts); pending rows cite nothing.
//
// This is a working REFERENCE IMPLEMENTATION, not the provisioned sovereign platform the
// brochure sells. The gaps below (AI engines, live federation, sovereign infrastructure, scale,
// real auth/persistence) are disclosed plainly, in code, so no reader is misled.

import { csvField } from "@/lib/csv"
import { type CapabilityStatus } from "@/lib/governance/role-capabilities"

/** Brochure headline figures (BRO-TN-002), for honest context — claimed, not all delivered. */
export const BROCHURE_CODE = "BRO-TN-002"
export const BROCHURE_HEADLINE = {
  architectureLayers: 12,
  nativeAiPillars: 8,
  aiEngines: 6,
  aiAgents: 6,
  governanceTiers: 7,
  stakeholderPortals: 13,
  functionalModules: 391,
  ndearSBlocks: "29/29",
  indianLanguages: 22,
  tnStudents: "~1.27 crore",
  tnSchools: "~69,000",
} as const

export type BrochureStatus = CapabilityStatus // "built" | "partial" | "pending"

export type BrochureArea =
  | "Architecture & tenancy"
  | "Native-AI"
  | "Federation & interoperability"
  | "Security & sovereignty"
  | "Governance & oversight"
  | "Experience & access"
  | "Scale & assurance"

export interface BrochureClaim {
  id: string
  area: BrochureArea
  /** The brochure's claim, paraphrased. */
  claim: string
  status: BrochureStatus
  /** Candid note on what is and is not delivered. */
  note: string
  /** Repo evidence (must exist for built/partial; empty for pending). */
  repoRef: string
}

export const BROCHURE_CLAIMS: BrochureClaim[] = [
  // --- Architecture & tenancy ---
  { id: "portals", area: "Experience & access", claim: "Thirteen role-tailored stakeholder portals", status: "built", note: "13 portal roles + ~271 page routes wired", repoRef: "config/portals.ts" },
  { id: "tenancy", area: "Architecture & tenancy", claim: "Seven-tier multi-tenancy (Sovereign Root → School)", status: "built", note: "national→state→directorate→district→block→cluster→school, TN-rooted; tested", repoRef: "lib/tenancy/index.ts" },
  { id: "layers", area: "Architecture & tenancy", claim: "Twelve-layer architecture (L1 Sovereign → L12 Civic)", status: "partial", note: "self-verifying L1–L12 register (/governance/architecture-layers): 8 layers built, 4 partial (~83% weighted); L1/L2 keep the sovereign-compute substrate — HSM/key custody, escrow, off-switch, multi-cloud — disclosed as out-of-scope pending aspects, not silently claimed", repoRef: "lib/governance/architecture-layers.ts" },

  // --- Security & sovereignty ---
  { id: "access", area: "Security & sovereignty", claim: "RBAC + ABAC + ReBAC least-privilege, deny-wins", status: "built", note: "unified access PDP, fail-closed; tested", repoRef: "lib/access/policy.ts" },
  { id: "rebac-scope", area: "Security & sovereignty", claim: "Per-role jurisdictional data scoping", status: "built", note: "downward-governance scope engine + DB-layer RLS on scoped tables", repoRef: "lib/access/scope.ts" },
  { id: "audit", area: "Security & sovereignty", claim: "Tamper-evident / immutable audit ledger", status: "built", note: "hash-chained append-only trail; health probe verifies the chain", repoRef: "lib/audit/trail.ts" },
  { id: "credentials", area: "Security & sovereignty", claim: "Permissioned-blockchain tamper-evident records + NFT/soulbound credentials", status: "partial", note: "full credential lifecycle (mint → content-hash → audit-ledger anchor → verify → revoke), APAAR-soulbound, DB-migrated, at /credentials; honest in-app analogue — NOT a distributed permissioned blockchain or on-chain ERC-721 mint", repoRef: "lib/credentials/store.ts" },
  { id: "dao", area: "Governance & oversight", claim: "Education DAOs — on-chain accountable SMC / parent-teacher councils", status: "partial", note: "RTE 75%-parent SMC with attributable one-member-one-vote ballots, distinct-voter quorum, a reproducible decision fingerprint and per-ballot audit-ledger anchoring at /smc; honest analogue of accountable collective governance — NOT an on-chain token DAO / smart contract", repoRef: "lib/smc/store.ts" },
  { id: "iot", area: "Scale & assurance", claim: "IoT mesh — biometric attendance, environment, nutrition, infrastructure telemetry", status: "partial", note: "device readings ingest → derived threshold classification (Normal/Warning/Critical) → live alerts across environment/nutrition/infrastructure/attendance, audit-anchored, DB-migrated, at /telemetry; the physical sensor mesh + edge gateway are a deployment seam (mock samples ingested here)", repoRef: "lib/iot/store.ts" },
  { id: "outcomes", area: "Governance & oversight", claim: "Published, disaggregated outcomes — TN Quality Index + Opportunity-Gap Index", status: "built", note: "a cohort-weighted composite Quality Index (FLN/attendance/transition/pass) disaggregated by district/school-category/rural-urban/gender/social-category/disability, plus an Opportunity-Gap Index measuring the best-vs-worst-served spread, computed (not asserted), DB-migrated, at /outcomes", repoRef: "lib/outcomes/store.ts" },
  { id: "zero-trust", area: "Security & sovereignty", claim: "Zero-trust posture, CSP & hardened headers", status: "built", note: "security headers + CSP enforced in middleware", repoRef: "lib/security/index.ts" },
  { id: "dpdp", area: "Security & sovereignty", claim: "DPDP 2023 consent — explicit, withdrawable, purpose-bound", status: "built", note: "consent gate + PII catalogue + retention + DPIA register", repoRef: "lib/consent/index.ts" },
  { id: "keys-hsm", area: "Security & sovereignty", claim: "State-held encryption keys / HSM custody", status: "pending", note: "organisational/infrastructure control; not provisioned and not in app code", repoRef: "" },
  { id: "escrow-offswitch", area: "Security & sovereignty", claim: "Source-code escrow + sovereign off-switch", status: "pending", note: "a true kill-switch and escrow are governance/infra arrangements; the agent approval queue is only an adjacent human-gate, not a sovereign disable", repoRef: "" },
  { id: "multicloud", area: "Security & sovereignty", claim: "Sovereign / hybrid / multi-cloud topology, data residency", status: "pending", note: "deployment topology; not built in this repo", repoRef: "" },

  // --- Native-AI ---
  { id: "agents", area: "Native-AI", claim: "Six purpose-built AI agents under human authority (HITL)", status: "built", note: "six agents (Policy/Teacher/Student/Governance/Grievance/Compliance) with the full five-part anatomy, composing the engines into advisory recommendations; high-stakes/low-confidence require approval; tested, at /ai-fabric", repoRef: "lib/ai/agents/index.ts" },
  { id: "pillars", area: "Native-AI", claim: "Eight Native-AI pillars (NLU/NLG, reasoning, personalisation, …)", status: "partial", note: "8-pillar fabric mapped: 5 built via the engines, language + speech are live-shaped seams, vision/document AI honestly pending", repoRef: "lib/ai/pillars.ts" },
  { id: "engines", area: "Native-AI", claim: "Six AI engines (Reasoning, Personalisation, Assessment, Policy, Analytics, Conversational)", status: "built", note: "six real, deterministic, explainable, tested engines (advisory — no side effects) at /ai-engines; an LLM seam may refine, not replace, them", repoRef: "lib/ai/engines/index.ts" },
  { id: "hitl", area: "Native-AI", claim: "Humans decide, AI assists — human authority across every layer", status: "built", note: "every agent tool call is queued for human approval before any side effect", repoRef: "lib/agentflow/store.ts" },
  { id: "rag-mcp", area: "Native-AI", claim: "RAG + MCP — curriculum-grounded, cited, tool-augmented agents", status: "partial", note: "grounded RAG (answers only from the TN corpus, cites sources, refuses to invent) + an MCP-style typed tool registry (discover → validate → invoke → structured cited result, human authority) at /ai-retrieval; honest analogue — deterministic, not a network MCP server or an LLM", repoRef: "lib/mcp/index.ts" },

  // --- Federation & interoperability ---
  { id: "ndear-s", area: "Federation & interoperability", claim: "NDEAR-S 29/29 building-block alignment", status: "built", note: "all 29 NDEAR-S blocks mapped to a real in-repo component (cite-checked); ~24 built in-repo, 5 are live-ready federation seams", repoRef: "lib/integrations/ndear-s.ts" },
  { id: "federation", area: "Federation & interoperability", claim: "Live federation with DIKSHA, UDISE+, APAAR, PFMS", status: "partial", note: "13 typed adapter ports (incl. dedicated PFMS fund-flow) behind one interface, mock by default and live only when env-configured; not live-federated with the national registries at runtime", repoRef: "lib/integrations/index.ts" },
  { id: "ingestion", area: "Federation & interoperability", claim: "Real-data ingestion (UDISE+ / EMIS / SIS)", status: "partial", note: "schema-driven, idempotent CSV adapters ready to load real exports; not bound to a live feed", repoRef: "lib/ingestion/index.ts" },
  { id: "languages", area: "Experience & access", claim: "22 Indian languages", status: "partial", note: "the 22 Eighth-Schedule languages are catalogued; a measured UI-string layer localises the core navigation/action set — Tamil (TN-first)/English/Hindi complete, Telugu/Malayalam/Kannada/Urdu partial with honest per-locale coverage (/accessibility/languages); full translation across all routes + the remaining languages route via Bhashini and is not complete", repoRef: "lib/i18n/translate.ts" },
  { id: "wcag", area: "Experience & access", claim: "WCAG 2.1 AAA across all routes; RPwD-21", status: "partial", note: "per-criterion conformance map (/governance/wcag): A/AA met by automated audit (CI: 0 HIGH across all routes) + design system; AAA criteria needing AT/manual verification are honestly audit-required, tracked in the assurance register", repoRef: "lib/accessibility/conformance.ts" },

  // --- Governance & oversight ---
  { id: "workflow", area: "Governance & oversight", claim: "Multi-tier governance approvals, end-to-end", status: "built", note: "7 deep verticals: rich form → multi-tier approval → durable store → audit → role-gated inbox", repoRef: "lib/workflow/index.ts" },
  { id: "policy-as-code", area: "Governance & oversight", claim: "Policy-as-Code — Education Acts automate compliance in real time", status: "partial", note: "executable enforcement engine (RTE/RPwD/DPDP/POCSO/GFR as cited rules → permit/deny/require-approval, deny-wins) + live simulator at /governance/policy-engine. The runtime gate (policyGate) is now WIRED into real high-stakes money flows — GeM procurement payment + DBT scholarship disbursement deny-wins on GFR/PFMS rules and audit every decision to the integrity ledger — tracked by a self-verifying register (lib/governance/policy-enforced.ts + tests/policy-enforced.test.ts). Rules are real and tested; extending the gate to the remaining mutating flows across the catalogue is in progress", repoRef: "lib/governance/policy-enforced.ts" },
  { id: "control-tower", area: "Governance & oversight", claim: "AI Control Tower (3 bodies) + seven governance tiers G1–G7", status: "partial", note: "self-verifying authority-spine register (/governance/control-tower): Sovereignty Console · AI Ethics Board · AI Leadership Council + G1 Cabinet→G7 CAG audit, each mapped to an on-disk instrument; 3 built, 7 partial; the sovereign substrate (keys/escrow/off-switch) and the external CAG audit stay disclosed as pending, not claimed", repoRef: "lib/governance/control-tower.ts" },
  { id: "modules", area: "Governance & oversight", claim: "391 functional modules (catalogue: 312) across the tiers", status: "partial", note: "high breadth (~271 routes); 51 are now DEEP-transactional — clickable routes whose server actions drive the durable Go backbone (platformd + PostgreSQL) with real workflows/invariants/audited writes, self-verified by lib/governance/durable-modules.ts (tests/durable-modules.test.ts) plus committed Go invariant tests; the remaining catalogue is reference UI, so not all are deeply built", repoRef: "lib/governance/durable-modules.ts" },
  { id: "readiness", area: "Scale & assurance", claim: "Government-grade go-live readiness", status: "partial", note: "honest launch-readiness scorecard (self-scored ~partial) + schema verification + health/ready probes", repoRef: "lib/governance/launch-readiness.ts" },
  { id: "assurance", area: "Scale & assurance", claim: "Independent assurance, DPIA, ISO 27001 / 9001 audits", status: "partial", note: "self-tests/typecheck/lint/CI are recorded as passed; the independent audits a government must commission are recorded not-started", repoRef: "lib/assurance/index.ts" },

  // --- Scale & assurance ---
  { id: "persistence", area: "Scale & assurance", claim: "Durable persistence at state scale", status: "partial", note: "51 self-migrating PostgreSQL stores behind the Go backbone (each adapter runs CREATE TABLE IF NOT EXISTS on boot) proven durable against PostgreSQL 16 — writes survive restarts; plus the Supabase service-role seam + migrations for the reference app. Falls back to in-memory until a DB is provisioned; a live load test at state scale is still pending", repoRef: "lib/persistence/schema.ts" },
  { id: "auth", area: "Scale & assurance", claim: "Real multi-user identity & authentication", status: "partial", note: "backbone auth gateway in front of every mutating endpoint (bearer token, constant-time check; reads + /healthz open) makes the backend safe to expose, plus Supabase-profile role resolution with a credential-free demo fallback; still a single shared service secret, not per-user SSO/login — real multi-user auth is not the live default", repoRef: "lib/auth/current-role.ts" },
  { id: "scale", area: "Scale & assurance", claim: "Serves ~1.27 crore students / ~69,000 schools", status: "partial", note: "administrative tree validated at true cardinality (69k schools / ~73k nodes) with governance correct at scale, plus a data-tier capacity model (/governance/scale); a live load/performance test of provisioned infrastructure is still pending", repoRef: "lib/scale/index.ts" },
]

export const BROCHURE_AREAS: BrochureArea[] = [
  "Architecture & tenancy",
  "Native-AI",
  "Federation & interoperability",
  "Security & sovereignty",
  "Governance & oversight",
  "Experience & access",
  "Scale & assurance",
]

export function byArea(area: BrochureArea, items: BrochureClaim[] = BROCHURE_CLAIMS): BrochureClaim[] {
  return items.filter((c) => c.area === area)
}

export function byStatus(status: BrochureStatus, items: BrochureClaim[] = BROCHURE_CLAIMS): BrochureClaim[] {
  return items.filter((c) => c.status === status)
}

export interface BrochureSummary {
  total: number
  built: number
  partial: number
  pending: number
  /** Honest coverage score: built = 1, partial = 0.5, pending = 0. */
  coveragePct: number
}

export function brochureSummary(items: BrochureClaim[] = BROCHURE_CLAIMS): BrochureSummary {
  const built = byStatus("built", items).length
  const partial = byStatus("partial", items).length
  const pending = byStatus("pending", items).length
  const total = items.length
  const coveragePct = total === 0 ? 0 : Math.round(((built + partial * 0.5) / total) * 100)
  return { total, built, partial, pending, coveragePct }
}

export function toCSV(items: BrochureClaim[] = BROCHURE_CLAIMS): string {
  const header = ["Area", "Claim", "Status", "Note", "Evidence"]
  const rows = items.map((c) => [c.area, c.claim, c.status, c.note, c.repoRef].map(csvField).join(","))
  return [header.map(csvField).join(","), ...rows].join("\n")
}
