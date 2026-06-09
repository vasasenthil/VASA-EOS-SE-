// VASA-EOS(SE) — adoption & retention metrics (the "do users want it?" curve).
// Pure analytics over a daily usage series — DAU, WAU, stickiness, day-7 retention,
// and daily-loop completion — the numbers a pilot would put in front of an investor.
// Seeded here; in production this reads the event stream.

export interface UsageDay {
  date: string
  activeUsers: number // distinct users active that day
  loopCompletedPct: number // share who finished their daily loop
}

// Illustrative 14-day series (most recent last) showing healthy week-over-week growth.
export const USAGE_SERIES: UsageDay[] = [
  { date: "2026-05-23", activeUsers: 41, loopCompletedPct: 52 },
  { date: "2026-05-24", activeUsers: 38, loopCompletedPct: 55 },
  { date: "2026-05-25", activeUsers: 47, loopCompletedPct: 58 },
  { date: "2026-05-26", activeUsers: 59, loopCompletedPct: 61 },
  { date: "2026-05-27", activeUsers: 64, loopCompletedPct: 63 },
  { date: "2026-05-28", activeUsers: 71, loopCompletedPct: 66 },
  { date: "2026-05-29", activeUsers: 68, loopCompletedPct: 67 },
  { date: "2026-05-30", activeUsers: 77, loopCompletedPct: 69 },
  { date: "2026-05-31", activeUsers: 83, loopCompletedPct: 71 },
  { date: "2026-06-01", activeUsers: 91, loopCompletedPct: 72 },
  { date: "2026-06-02", activeUsers: 98, loopCompletedPct: 74 },
  { date: "2026-06-03", activeUsers: 104, loopCompletedPct: 76 },
  { date: "2026-06-04", activeUsers: 112, loopCompletedPct: 77 },
  { date: "2026-06-05", activeUsers: 121, loopCompletedPct: 79 },
]

export interface AdoptionSummary {
  dau: number // latest day's active users
  wau: number // distinct-ish active over the last 7 days (peak as a proxy on this series)
  stickiness: number // dau/wau %
  weekOverWeekGrowthPct: number // last 7d avg vs prior 7d avg
  loopCompletionPct: number // latest daily-loop completion
}

function avg(ns: number[]): number {
  return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0
}

export function adoptionSummary(series: UsageDay[] = USAGE_SERIES): AdoptionSummary {
  if (series.length === 0) {
    return { dau: 0, wau: 0, stickiness: 0, weekOverWeekGrowthPct: 0, loopCompletionPct: 0 }
  }
  const last = series[series.length - 1]
  const last7 = series.slice(-7)
  const prev7 = series.slice(-14, -7)
  const wau = Math.max(...last7.map((d) => d.activeUsers))
  const lastAvg = avg(last7.map((d) => d.activeUsers))
  const prevAvg = avg(prev7.map((d) => d.activeUsers))
  const wow = prevAvg === 0 ? 0 : Math.round(((lastAvg - prevAvg) / prevAvg) * 100)
  return {
    dau: last.activeUsers,
    wau,
    stickiness: wau === 0 ? 0 : Math.round((last.activeUsers / wau) * 100),
    weekOverWeekGrowthPct: wow,
    loopCompletionPct: last.loopCompletedPct,
  }
}
