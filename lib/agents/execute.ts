// VASA-EOS(SE) — MCP tool executor: routes an approved tool call to a REAL seam.
//
// dispatch.ts validates + HITL-gates a tool call; once cleared, this runs it against
// the actual platform integration (DBT bridge, language service, …). Returns null for
// tools that have no special routing yet (the dispatcher's deterministic handler then
// stands in), so wiring more tools is purely additive. Best-effort: never throws.

import { integrations } from "@/lib/integrations"
import type { AgentName } from "@/lib/integrations"
import type { ToolArgs } from "./dispatch"

export interface ToolExecution {
  tool: string
  output: string
  /** External reference (e.g. APBS id) when the seam returns one. */
  ref?: string
  mode: "mock" | "live"
}

/** Execute a cleared tool call against its real seam, or null if not routed. */
export async function executeTool(
  _agent: AgentName,
  tool: string,
  args: ToolArgs,
): Promise<ToolExecution | null> {
  switch (tool) {
    case "initiate_dbt": {
      const res = await integrations.dbt.disburse({
        beneficiaryApaar: String(args.apaar),
        schemeCode: "AGENT-DBT",
        amountInPaise: Math.round(Number(args.amount) * 100),
        reference: `AG-${String(args.apaar)}`,
      })
      return {
        tool,
        mode: res.mode,
        ref: res.data?.apbsReference,
        output: res.ok
          ? `DBT ${res.data?.status} — APBS ${res.data?.apbsReference}`
          : `DBT failed: ${res.error ?? "unknown"}`,
      }
    }
    case "translate_content": {
      const res = await integrations.language.translate({ text: String(args.text), from: "en", to: String(args.language) })
      return { tool, mode: res.mode, output: res.ok ? (res.data?.text ?? "") : `Translate failed: ${res.error ?? "unknown"}` }
    }
    case "send_ivr": {
      const res = await integrations.language.tts({ text: String(args.message), language: "ta" })
      return { tool, mode: res.mode, output: res.ok ? `IVR queued — audio ${res.data?.audioRef}` : `IVR failed: ${res.error ?? "unknown"}` }
    }
    default:
      return null
  }
}
