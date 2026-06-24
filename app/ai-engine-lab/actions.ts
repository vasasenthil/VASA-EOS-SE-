"use server"

import { analyse, type AnalyticsResult } from "@/lib/ai/engines/analytics"
import { converse, type ConversationalResult, type Doc } from "@/lib/ai/engines/conversational"
import { logger } from "@/lib/logger"

export interface AnalyticsState {
  ok: boolean
  message: string
  result?: AnalyticsResult
}

export interface ConverseState {
  ok: boolean
  message: string
  result?: ConversationalResult
}

/** Run the Analytics engine live on a user-supplied numeric series. Pure, deterministic, human-authority. */
export async function runAnalyticsAction(_prev: AnalyticsState, fd: FormData): Promise<AnalyticsState> {
  const raw = String(fd.get("series") ?? "").trim()
  const series = raw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((x) => Number(x))
  if (series.length === 0) return { ok: false, message: "Enter a comma- or space-separated series of numbers." }
  if (series.some((x) => !Number.isFinite(x))) return { ok: false, message: "All values must be numbers." }
  try {
    const result = analyse(series)
    return { ok: true, message: result.explanation, result }
  } catch (e) {
    logger.error("ai.analytics failed", { error: String(e) })
    return { ok: false, message: `Engine error: ${String(e)}` }
  }
}

// The grounded knowledge base the Conversational engine answers from. It answers ONLY from this corpus and
// cites sources — if nothing matches it says so (no hallucination by construction).
const KB: Doc[] = [
  { id: "ptr", text: "Under the RTE Act 2009, the pupil-teacher ratio norm is 30 to 1 at the primary level and 35 to 1 at the upper primary level.", source: "RTE-2009 §25" },
  { id: "rte25", text: "RTE Section 12(1)(c) reserves 25 percent of entry-level seats in private unaided schools for children from economically weaker sections and disadvantaged groups.", source: "RTE-2009 §12" },
  { id: "mdm", text: "The PM-POSHAN mid-day meal scheme provides a hot cooked meal with a primary norm of 100 grams of foodgrain per child per school day.", source: "PM-POSHAN-GO" },
  { id: "cpd", text: "NEP 2020 expects every teacher to complete at least 50 hours of continuous professional development each year.", source: "NEP-2020" },
  { id: "rbsk", text: "RBSK screens children for the four Ds — defects at birth, diseases, deficiencies and developmental delays including disability — and refers them to the District Early Intervention Centre.", source: "RBSK-Guidelines" },
  { id: "attendance", text: "A learner falling below 75 percent attendance over the term is flagged as a chronic absentee for retention follow-up.", source: "TN-Retention-Norm" },
]

/** Run the Conversational engine live — grounded, citation-backed answers over a fixed school-policy corpus. */
export async function runConverseAction(_prev: ConverseState, fd: FormData): Promise<ConverseState> {
  const q = String(fd.get("question") ?? "").trim()
  if (!q) return { ok: false, message: "Ask a question about TN school-education policy." }
  try {
    const result = converse(q, KB)
    return { ok: true, message: result.answer, result }
  } catch (e) {
    logger.error("ai.conversational failed", { error: String(e) })
    return { ok: false, message: `Engine error: ${String(e)}` }
  }
}
