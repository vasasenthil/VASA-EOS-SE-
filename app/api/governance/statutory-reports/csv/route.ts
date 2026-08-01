import { createAuditAnchorProof } from "@/lib/audit/trail"
import { generateStatutoryReportPack, statutoryReportPackToCSV } from "@/lib/finance/statutory-reports"

export async function GET() {
  const anchor = await createAuditAnchorProof("2026-07-21T00:00:00.000Z")
  const pack = generateStatutoryReportPack({ fiscalYear: "2026-27", generatedAt: "2026-07-21T00:00:00.000Z", auditAnchorHash: anchor.anchorHash })
  return new Response(statutoryReportPackToCSV(pack), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${pack.packId.toLowerCase()}-public.csv"`,
    },
  })
}
