import { z } from "zod"
import { PfmsClient } from "@/lib/integrations/pfms/client"
import { requireDb } from "@/lib/db/require-db"
import { WorkerBase } from "./worker-base"

export const reconciliationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rows: z.array(z.object({
    referenceId: z.string().min(1).max(200),
    status: z.enum(["accepted", "processing", "settled", "failed"]),
    settlementId: z.string().min(1).max(200).optional(),
  }).refine(row => row.status !== "settled" || !!row.settlementId, "Settled payment needs settlement reference")).max(10000),
}).superRefine((file, ctx) => {
  if (new Set(file.rows.map(row => row.referenceId)).size !== file.rows.length) ctx.addIssue({ code: "custom", message: "Duplicate payment reference" })
})

export async function reconcilePfmsDate(date: string, correlationId: string, client: Pick<PfmsClient, "reconciliationFile">): Promise<number> {
  const db = requireDb()
  const file = reconciliationSchema.parse(await client.reconciliationFile(date, correlationId))
  if (file.date !== date) throw new Error("PFMS reconciliation date mismatch")
  const { error } = await db.rpc("platform_reconcile_pfms", { reconciliation_date: date, payment_rows: file.rows })
  if (error) throw error
  return file.rows.length
}

export class PfmsReconciliationWorker extends WorkerBase {
  private readonly client: PfmsClient
  constructor() {
    super({ name: "pfms-reconciliation", intervalMs: 60_000 })
    const baseUrl = process.env.PFMS_BASE_URL
    const hmacSecret = process.env.PFMS_HMAC_SECRET
    if (process.env.INTEGRATION_PFMS !== "live" || !baseUrl || !hmacSecret) throw new Error("Live PFMS URL and HMAC configuration required")
    if (new URL(baseUrl).protocol !== "https:") throw new Error("PFMS requires HTTPS")
    this.client = new PfmsClient({ baseUrl, hmacSecret, apiKey: process.env.PFMS_API_KEY })
  }
  protected async tick(correlationId: string): Promise<void> {
    // Revisit yesterday for late settlements; the gateway owns the report contract.
    for (const age of [1, 0]) {
      const date = new Date(Date.now() - age * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
      await reconcilePfmsDate(date, correlationId, this.client)
    }
  }
}
