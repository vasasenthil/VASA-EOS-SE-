import { csvField } from "@/lib/csv"
import { BUDGET, financeSummary, type BudgetLine } from "@/lib/finance"

export interface StatutoryReportLine {
  moduleId: "66.3" | "66.4"
  reportName: string
  cadence: string
  budgetHead: string
  allocated: number
  spent: number
  utilisationPct: number
  rtiDisclosure: "public-aggregate" | "officer-audit-pack"
  evidence: string
}

export interface StatutoryReportPack {
  packId: string
  fiscalYear: string
  generatedAt: string
  auditAnchorHash: string
  lines: StatutoryReportLine[]
  totals: ReturnType<typeof financeSummary>
  publicAssurance: string[]
}

const CADENCE_BY_HEAD: Record<string, { reportName: string; cadence: string; disclosure: StatutoryReportLine["rtiDisclosure"] }> = {
  "Samagra Shiksha (composite grant)": { reportName: "Utilisation Certificate (UC)", cadence: "Quarterly", disclosure: "officer-audit-pack" },
  "PM POSHAN / CMBS": { reportName: "PM POSHAN + CMBS expenditure statement", cadence: "Monthly", disclosure: "public-aggregate" },
  "Infrastructure & maintenance": { reportName: "Civil works / maintenance CAG schedule", cadence: "Quarterly", disclosure: "public-aggregate" },
  "Library & TLM": { reportName: "Teaching-learning material grant statement", cadence: "Quarterly", disclosure: "public-aggregate" },
  "Sports & co-curricular": { reportName: "Co-curricular grant statement", cadence: "Quarterly", disclosure: "public-aggregate" },
}

function pct(line: BudgetLine): number {
  return line.allocated ? Math.round((line.spent / line.allocated) * 100) : 0
}

export function generateStatutoryReportPack(input: {
  fiscalYear: string
  generatedAt?: string
  auditAnchorHash: string
  lines?: BudgetLine[]
}): StatutoryReportPack {
  const lines = input.lines ?? BUDGET
  return {
    packId: `STAT-CAG-RTI-${input.fiscalYear}`,
    fiscalYear: input.fiscalYear,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    auditAnchorHash: input.auditAnchorHash,
    totals: financeSummary(lines),
    lines: lines.map((line): StatutoryReportLine => {
      const meta = CADENCE_BY_HEAD[line.head] ?? { reportName: "Budget head expenditure statement", cadence: "Quarterly", disclosure: "public-aggregate" as const }
      return {
        moduleId: meta.disclosure === "officer-audit-pack" ? "66.3" : "66.4",
        reportName: meta.reportName,
        cadence: meta.cadence,
        budgetHead: line.head,
        allocated: line.allocated,
        spent: line.spent,
        utilisationPct: pct(line),
        rtiDisclosure: meta.disclosure,
        evidence: `Budget head '${line.head}' is tied to audit anchor ${input.auditAnchorHash}.`,
      }
    }),
    publicAssurance: [
      "RTI surface is aggregate-first: child-level records, APAAR identifiers, bank accounts and grievance narratives are excluded.",
      "CAG/officer audit packs reference the immutable audit anchor; public disclosures show utilisation by budget head.",
      "Scheme-money evidence remains tied to treasury/PFMS/IFHRMS rails and cannot bypass statutory fund-flow controls.",
    ],
  }
}

export function statutoryReportPackToCSV(pack: StatutoryReportPack): string {
  const header = ["moduleId", "reportName", "cadence", "budgetHead", "allocated", "spent", "utilisationPct", "rtiDisclosure", "auditAnchorHash"]
  const rows = pack.lines.map((line) => [line.moduleId, line.reportName, line.cadence, line.budgetHead, String(line.allocated), String(line.spent), String(line.utilisationPct), line.rtiDisclosure, pack.auditAnchorHash])
  return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n"
}
