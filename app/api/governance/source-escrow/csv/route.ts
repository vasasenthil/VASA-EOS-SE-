import { generateSourceEscrowManifest, sourceEscrowManifestToCSV } from "@/lib/sovereignty/escrow"

export function GET() {
  const manifest = generateSourceEscrowManifest({ release: "2026.07.21", generatedAt: "2026-07-21T00:00:00.000Z" })
  return new Response(sourceEscrowManifestToCSV(manifest), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${manifest.manifestId.toLowerCase()}-public.csv"`,
    },
  })
}
