import { readFileSync } from "node:fs"
import { buildSbom } from "@/lib/security/sbom"

// Live CycloneDX 1.5 SBOM (Software Bill of Materials) — supply-chain transparency.
// An SCA tool / auditor can ingest this directly.
export const dynamic = "force-dynamic"

export async function GET() {
  let pkg = {}
  try {
    pkg = JSON.parse(readFileSync("package.json", "utf8"))
  } catch {
    // fall through to an empty manifest
  }
  const bom = buildSbom(pkg as Record<string, unknown>, { includeDev: false })
  return Response.json(bom, {
    headers: {
      "content-type": "application/vnd.cyclonedx+json",
      "content-disposition": 'attachment; filename="vasa-eos-sbom.json"',
      "cache-control": "no-store",
    },
  })
}
