import { biasAuditToCSV, generateQuarterlyBiasAuditReport } from "@/lib/ai/transparency"

export function GET() {
  const report = generateQuarterlyBiasAuditReport({ period: "2026-Q3", generatedAt: "2026-07-21T00:00:00.000Z" })
  return new Response(biasAuditToCSV(report), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${report.reportId.toLowerCase()}-public.csv"`,
    },
  })
}
