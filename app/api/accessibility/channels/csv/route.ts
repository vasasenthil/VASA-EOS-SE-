import { CHANNELS, toCSV } from "@/lib/accessibility/channels"

// Downloadable multi-channel access catalogue — channels with modality, literacy and
// offline characteristics (the voice/IVR journeys are served on the channels page).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(CHANNELS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-access-channels.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
