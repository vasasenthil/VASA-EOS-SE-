// VASA-EOS(SE) — multi-framework regulatory compliance register ("All Approvals Aligned").
//
// The platform claims alignment with a broad roster of national & international frameworks.
// This makes that claim inspectable: each framework mapped to the in-repo component that
// evidences it, with an honest status — 'aligned' where the mechanism is genuinely in code,
// 'partial' where an EXTERNAL certification or audit (ISO cert, WCAG AAA audit, DPO sign-off,
// live-provider attestation) is still required. Every controlRef is asserted to exist on
// disk (self-verifying). Complements the NDEAR-specific register. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type RegStatus = "aligned" | "partial"

export interface RegFramework {
  id: string
  name: string
  authority: string
  scope: string
  /** In-repo component evidencing alignment (asserted to exist on disk). */
  controlRef: string
  status: RegStatus
  /** External step required to move 'partial' → fully attested. */
  externalStep?: string
}

export const REG_FRAMEWORKS: RegFramework[] = [
  { id: "nep-2020", name: "NEP 2020", authority: "MoE, Govt. of India", scope: "National Education Policy — digital vision, NCF, FLN", controlRef: "lib/governance-framework", status: "aligned" },
  { id: "tn-sep", name: "TN SEP 2022/2025", authority: "School Education Dept, TN", scope: "State Education Policy — Tamil-first, state context", controlRef: "lib/governance-framework", status: "aligned" },
  { id: "ndear-s", name: "NDEAR-S building blocks", authority: "MoE (NDEAR)", scope: "Federated education-architecture building blocks", controlRef: "lib/compliance/ndear.ts", status: "partial", externalStep: "Live-provider attestation per building block" },
  { id: "netf", name: "NETF principles", authority: "National Educational Technology Forum", scope: "Responsible, evidence-based ed-tech governance", controlRef: "lib/agents/guardrails.ts", status: "aligned" },
  { id: "dpdp-2023", name: "DPDP Act 2023", authority: "MeitY, Govt. of India", scope: "Personal-data protection, consent, children's data", controlRef: "lib/consent/gate-server.ts", status: "partial", externalStep: "DPIA completion + DPO sign-off" },
  { id: "rpwd-2016", name: "RPwD Act 2016", authority: "MoSJE, Govt. of India", scope: "21 specified disabilities, accessibility, benchmark", controlRef: "lib/accessibility/rpwd.ts", status: "aligned" },
  { id: "rte-2009", name: "RTE Act 2009", authority: "MoE, Govt. of India", scope: "Right to Education — 25% EWS, norms, entitlements", controlRef: "lib/rte", status: "aligned" },
  { id: "pocso-2012", name: "POCSO Act 2012", authority: "MWCD, Govt. of India", scope: "Child safety — mandatory reporting & protection", controlRef: "lib/safety", status: "aligned" },
  { id: "iso-27001", name: "ISO 27001 / 27701", authority: "ISO/IEC", scope: "Information-security & privacy management", controlRef: "lib/security/threat-model.ts", status: "partial", externalStep: "Accredited ISO certification audit" },
  { id: "wcag-22-aaa", name: "WCAG 2.2 AAA", authority: "W3C", scope: "Highest web-accessibility conformance level", controlRef: "lib/accessibility/audit.ts", status: "partial", externalStep: "Full manual WCAG 2.2 AAA audit" },
  { id: "un-sdg-4", name: "UN SDG 4", authority: "United Nations", scope: "Quality Education targets, equity & inclusion", controlRef: "lib/esg", status: "aligned" },
]

export function frameworkById(id: string): RegFramework | undefined {
  return REG_FRAMEWORKS.find((f) => f.id === id)
}

export function byStatus(status: RegStatus): RegFramework[] {
  return REG_FRAMEWORKS.filter((f) => f.status === status)
}

export interface RegSummary {
  frameworks: number
  aligned: number
  partial: number
  authorities: number
}

export function regSummary(items: RegFramework[] = REG_FRAMEWORKS): RegSummary {
  return {
    frameworks: items.length,
    aligned: items.filter((f) => f.status === "aligned").length,
    partial: items.filter((f) => f.status === "partial").length,
    authorities: new Set(items.map((f) => f.authority)).size,
  }
}


export function toCSV(items: RegFramework[] = REG_FRAMEWORKS): string {
  const header = ["Framework", "Authority", "Scope", "Component", "Status", "External step"]
  const rows = items.map((f) =>
    [f.name, f.authority, f.scope, f.controlRef, f.status, f.externalStep ?? "—"].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
