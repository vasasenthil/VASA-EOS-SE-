// VASA-EOS(SE) — Analytics Engine (Engine 5 of 6).
//
// Descriptive analytics + anomaly detection over a numeric series (e.g. weekly attendance,
// scheme disbursement, dropout counts): summary statistics, a trend direction, and the
// indices whose z-score exceeds a threshold (statistical outliers worth a human look).
// Deterministic and explainable. Advisory: it flags; an officer investigates.

export interface AnalyticsResult {
  n: number
  mean: number
  median: number
  min: number
  max: number
  stdev: number
  trend: "up" | "down" | "flat"
  /** Indices of points whose |z-score| exceeds the threshold. */
  anomalies: number[]
  confidence: number
  explanation: string
  humanAuthority: true
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

const DEFAULT_Z = 2

export function analyse(series: number[], zThreshold: number = DEFAULT_Z): AnalyticsResult {
  const n = series.length
  if (n === 0) {
    return { n: 0, mean: 0, median: 0, min: 0, max: 0, stdev: 0, trend: "flat", anomalies: [], confidence: 0, explanation: "Empty series.", humanAuthority: true }
  }
  const mean = series.reduce((a, b) => a + b, 0) / n
  const variance = series.reduce((a, b) => a + (b - mean) ** 2, 0) / n
  const stdev = Math.sqrt(variance)
  const half = Math.floor(n / 2)
  const firstHalf = series.slice(0, half)
  const secondHalf = series.slice(n - half)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
  const drift = n >= 2 ? avg(secondHalf) - avg(firstHalf) : 0
  const trend: "up" | "down" | "flat" = drift > stdev * 0.25 ? "up" : drift < -stdev * 0.25 ? "down" : "flat"
  // Leave-one-out z-score: a single outlier inflates the global stdev so much that its own
  // z is bounded ((n-1)/√n) and can never exceed 2 in a small series. Scoring each point
  // against the OTHERS removes that masking and correctly surfaces true outliers.
  const anomalies =
    n < 3
      ? []
      : series
          .map((x, i) => {
            const others = series.filter((_, j) => j !== i)
            const om = others.reduce((a, b) => a + b, 0) / others.length
            const ostd = Math.sqrt(others.reduce((a, b) => a + (b - om) ** 2, 0) / others.length)
            const z = ostd === 0 ? (x === om ? 0 : Infinity) : Math.abs((x - om) / ostd)
            return z > zThreshold ? i : -1
          })
          .filter((i) => i >= 0)
  const round = (x: number) => Math.round(x * 100) / 100
  const explanation = `n=${n}, mean=${round(mean)}, trend ${trend}, ${anomalies.length} anomaly(ies) beyond ${zThreshold}σ.`
  return {
    n,
    mean: round(mean),
    median: round(median(series)),
    min: Math.min(...series),
    max: Math.max(...series),
    stdev: round(stdev),
    trend,
    anomalies,
    confidence: 1,
    explanation,
    humanAuthority: true,
  }
}
