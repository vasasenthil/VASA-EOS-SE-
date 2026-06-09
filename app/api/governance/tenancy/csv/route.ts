import { toCSV } from "@/lib/tenancy/catalogue"

// Downloadable jurisdiction tier catalogue — the 7 sovereign tenancy tiers with their
// TN scale and the live demo node at each level.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-tenancy-tiers.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
