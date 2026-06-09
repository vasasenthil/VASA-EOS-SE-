// VASA-EOS(SE) — in-app self-test & health checks (server-only).
// Exercises the platform's core invariants on every request: the access-control
// PDP (deny-wins / fail-closed), audit-chain integrity, assessment and
// knowledge-graph logic, verifiable-credential tamper detection, plus persistence
// and integration posture. A government-grade system should be able to prove its
// own guardrails hold — this is that proof, runnable from the UI.

import { authorize, type EngineConfig } from "@/lib/access"
import { ANSWER_KEY, scoreOmr } from "@/lib/omr"
import { bktUpdate, ITEM_BANK, selectNextItem } from "@/lib/adaptive"
import { CONCEPTS, isReady, learningPath } from "@/lib/knowledge-graph"
import { canonicalBody, credentialHash, verifyCredential, type VerifiableCredential } from "@/lib/credentials"
import { verifyTrail } from "@/lib/audit/trail"
import { dbReady } from "@/lib/persistence"
import { integrationSummary } from "@/lib/integrations/status"

export interface Check {
  group: string
  name: string
  pass: boolean
  detail: string
  /** Informational checks report state without implying a failure. */
  info?: boolean
}

function check(group: string, name: string, fn: () => boolean | { pass: boolean; detail: string }, detail = ""): Check {
  try {
    const r = fn()
    if (typeof r === "boolean") return { group, name, pass: r, detail }
    return { group, name, pass: r.pass, detail: r.detail }
  } catch (e) {
    return { group, name, pass: false, detail: e instanceof Error ? e.message : "threw" }
  }
}

// Canary access-control configuration used by the PDP checks.
const ACCESS_CONFIG: EngineConfig = {
  grants: { ADMIN: ["read:student"], CLERK: [] },
  policies: [
    { id: "deny-suspended", effect: "deny", matches: (req) => req.subject.attributes?.suspended === true },
  ],
  cabacElevatedActions: ["override:lockdown"],
}

function accessChecks(): Check[] {
  return [
    check("Access Control (PDP)", "RBAC permit", () => {
      const d = authorize(ACCESS_CONFIG, { subject: { userId: "u", roles: ["ADMIN"] }, action: "read:student", resource: { type: "student" } })
      return { pass: d.permitted, detail: d.reason }
    }),
    check("Access Control (PDP)", "Deny-wins overrides role grant", () => {
      const d = authorize(ACCESS_CONFIG, {
        subject: { userId: "u", roles: ["ADMIN"], attributes: { suspended: true } },
        action: "read:student",
        resource: { type: "student" },
      })
      return { pass: !d.permitted, detail: d.reason }
    }),
    check("Access Control (PDP)", "Fail-closed when no model grants", () => {
      const d = authorize(ACCESS_CONFIG, { subject: { userId: "u", roles: ["CLERK"] }, action: "approve:dbt", resource: { type: "scheme" } })
      return { pass: !d.permitted, detail: d.reason }
    }),
    check("Access Control (PDP)", "CABAC elevates only in emergency", () => {
      const base = { subject: { userId: "u", roles: [] as string[] }, action: "override:lockdown", resource: { type: "school" } }
      const denied = authorize(ACCESS_CONFIG, { ...base, context: { emergency: false } })
      const granted = authorize(ACCESS_CONFIG, { ...base, context: { emergency: true, threatLevel: "low" } })
      return { pass: !denied.permitted && granted.permitted, detail: `normal=${denied.permitted} emergency=${granted.permitted}` }
    }),
  ]
}

function assessmentChecks(): Check[] {
  return [
    check("Assessment", "OMR full-marks scoring", () => {
      const marked = Object.fromEntries(ANSWER_KEY.map((k) => [k.q, k.key]))
      const s = scoreOmr(marked)
      return { pass: s.pct === 100 && s.correct === s.total, detail: `${s.correct}/${s.total} = ${s.pct}%` }
    }),
    check("Assessment", "OMR empty sheet scores zero", () => {
      const s = scoreOmr({})
      return { pass: s.correct === 0 && s.pct === 0, detail: `${s.correct}/${s.total}` }
    }),
    check("Assessment", "BKT rewards correct over incorrect", () => {
      const up = bktUpdate(0.3, true)
      const down = bktUpdate(0.3, false)
      return { pass: up > down, detail: `correct=${up.toFixed(3)} incorrect=${down.toFixed(3)}` }
    }),
    check("Assessment", "ZPD item selection in-band", () => {
      const item = selectNextItem(ITEM_BANK, "frac", 0.3)
      const ok = !!item && item.skillId === "frac" && item.difficulty >= 0.25 && item.difficulty <= 0.85
      return { pass: ok, detail: item ? `difficulty ${item.difficulty}` : "no item" }
    }),
  ]
}

function knowledgeGraphChecks(): Check[] {
  return [
    check("Knowledge Graph", "Learning path is topologically ordered", () => {
      const path = learningPath("pct")
      const seen = new Set<string>()
      for (const c of path) {
        if (!c.prerequisites.every((p) => seen.has(p))) {
          return { pass: false, detail: `prereq of ${c.id} appears late` }
        }
        seen.add(c.id)
      }
      return { pass: path.length > 0, detail: path.map((c) => c.id).join(" → ") }
    }),
    check("Knowledge Graph", "Readiness gates on prerequisites", () => {
      const notReady = isReady("add", new Set<string>())
      const ready = isReady("add", new Set(["count"]))
      return { pass: !notReady && ready, detail: `empty=${notReady} withCount=${ready}` }
    }),
    check("Knowledge Graph", "Graph is acyclic & resolvable", () => {
      const ok = CONCEPTS.every((c) => learningPath(c.id).length > 0)
      return { pass: ok, detail: `${CONCEPTS.length} concepts resolvable` }
    }),
  ]
}

function credentialChecks(): Check[] {
  const base = {
    id: "vc-selftest",
    apaarId: "APAAR-SELFTEST",
    kind: "badge" as const,
    title: "Self-Test Badge",
    issuer: "VASA-EOS(SE)",
    issuedAt: "2026-01-01T00:00:00.000Z",
    soulbound: true as const,
    anchorSeq: 1,
  }
  const credential: VerifiableCredential = { ...base, contentHash: credentialHash(canonicalBody(base)) }
  return [
    check("Verifiable Credentials", "Untampered credential verifies", () => {
      const r = verifyCredential(credential)
      return { pass: r.valid, detail: r.reason }
    }),
    check("Verifiable Credentials", "Tampered credential is rejected", () => {
      const tampered: VerifiableCredential = { ...credential, title: "Forged Title" }
      const r = verifyCredential(tampered)
      return { pass: !r.valid, detail: r.reason }
    }),
  ]
}

export interface SelfTestReport {
  checks: Check[]
  passed: number
  failed: number
  total: number
  generatedAt: string
}

export async function runSelfTests(): Promise<SelfTestReport> {
  const checks: Check[] = [
    ...accessChecks(),
    ...assessmentChecks(),
    ...knowledgeGraphChecks(),
    ...credentialChecks(),
  ]

  // Audit-chain integrity (async — may read the persisted ledger).
  try {
    const ok = await verifyTrail()
    checks.push({ group: "Audit & Integrity", name: "Audit chain verifies", pass: ok, detail: ok ? "hash chain intact" : "chain broken" })
  } catch (e) {
    checks.push({ group: "Audit & Integrity", name: "Audit chain verifies", pass: false, detail: e instanceof Error ? e.message : "threw" })
  }

  // Posture (informational — reports state, never fails the run).
  const durable = dbReady()
  checks.push({
    group: "Posture",
    name: "Persistence mode",
    pass: true,
    info: true,
    detail: durable ? "durable (Supabase service-role)" : "in-memory fallback",
  })
  const s = integrationSummary()
  checks.push({
    group: "Posture",
    name: "Integration adapters",
    pass: true,
    info: true,
    detail: `${s.live}/${s.total} live · ${s.liveReady} ready to go live`,
  })

  const failable = checks.filter((c) => !c.info)
  const passed = failable.filter((c) => c.pass).length
  return {
    checks,
    passed,
    failed: failable.length - passed,
    total: failable.length,
    generatedAt: new Date().toISOString(),
  }
}
