import { NextResponse } from "next/server"
import { getWorkerHealth } from "@/lib/observability/health"
import { listOutboxEvents } from "@/lib/events/outbox-publisher"

export async function GET() {
  const rows = await listOutboxEvents()
  return NextResponse.json({ ...getWorkerHealth("outbox-dispatcher"), queueDepth: rows.filter((row) => row.status === "pending").length })
}
