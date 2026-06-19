// VASA-EOS(SE) — IoT telemetry register (school environment · nutrition · infrastructure · attendance).
//
// The brief commits to "an IoT mesh for biometric attendance, school environment, nutrition and
// infrastructure telemetry". This is the ingest-and-alert core: device samples land as readings, each
// metric carries safe-operating bounds, and a reading is classified Normal / Warning / Critical so a
// head teacher or BEO sees a breach (a hot classroom, a spoiling mid-day-meal store, an empty water
// tank) the moment it happens — not at the next inspection. Pure + client-safe model/classification;
// the device transport/edge gateway sits behind the action/store seam (mock samples here).

export const SENSOR_CATEGORIES = ["Environment", "Nutrition", "Infrastructure", "Attendance"] as const
export type SensorCategory = (typeof SENSOR_CATEGORIES)[number]

export const SEVERITIES = ["Normal", "Warning", "Critical"] as const
export type Severity = (typeof SEVERITIES)[number]

export interface SensorMetric {
  key: string
  label: string
  unit: string
  category: SensorCategory
  /** A value below warnLow or above warnHigh is a Warning. */
  warnLow?: number
  warnHigh?: number
  /** A value below critLow or above critHigh is Critical (checked first). */
  critLow?: number
  critHigh?: number
  /** Informational metrics (e.g. attendance count) never alert. */
  informational?: boolean
}

// The metric catalogue with safe-operating bounds. Bounds are illustrative, school-safety-shaped.
export const SENSOR_METRICS: SensorMetric[] = [
  { key: "classroom_temp", label: "Classroom Temperature", unit: "°C", category: "Environment", warnLow: 16, warnHigh: 34, critLow: 12, critHigh: 38 },
  { key: "air_co2", label: "Air Quality (CO₂)", unit: "ppm", category: "Environment", warnHigh: 1000, critHigh: 1500 },
  { key: "water_ph", label: "Drinking Water pH", unit: "pH", category: "Environment", warnLow: 6.5, warnHigh: 8.5, critLow: 6, critHigh: 9 },
  { key: "mdm_storage_temp", label: "Mid-Day Meal Storage Temp", unit: "°C", category: "Nutrition", warnHigh: 8, critHigh: 12 },
  { key: "water_tank_level", label: "Water Tank Level", unit: "%", category: "Infrastructure", warnLow: 30, critLow: 15 },
  { key: "power_voltage", label: "Power Supply Voltage", unit: "V", category: "Infrastructure", warnLow: 210, warnHigh: 240, critLow: 200, critHigh: 250 },
  { key: "attendance_count", label: "Biometric Attendance", unit: "present", category: "Attendance", informational: true },
]

const metricByKey = new Map(SENSOR_METRICS.map((m) => [m.key, m]))

export function metricFor(key: string): SensorMetric | undefined {
  return metricByKey.get(key)
}

/** Classify a value against a metric's bounds: Critical (outermost) → Warning → Normal. Pure. */
export function classify(value: number, metric: SensorMetric): Severity {
  if (metric.informational) return "Normal"
  if ((metric.critLow !== undefined && value < metric.critLow) || (metric.critHigh !== undefined && value > metric.critHigh)) return "Critical"
  if ((metric.warnLow !== undefined && value < metric.warnLow) || (metric.warnHigh !== undefined && value > metric.warnHigh)) return "Warning"
  return "Normal"
}

export interface IotReading {
  id: string
  deviceId: string
  deviceLabel: string
  schoolUdise: string
  metricKey: string
  value: number
  capturedAt: string
  tenantId: string
}

export interface IotReadingView extends IotReading {
  metricLabel: string
  unit: string
  category: SensorCategory
  severity: Severity
}

export function readingSeverity(r: IotReading): Severity {
  const m = metricFor(r.metricKey)
  return m ? classify(r.value, m) : "Normal"
}

export function view(r: IotReading): IotReadingView {
  const m = metricFor(r.metricKey)
  return {
    ...r,
    metricLabel: m?.label ?? r.metricKey,
    unit: m?.unit ?? "",
    category: m?.category ?? "Environment",
    severity: m ? classify(r.value, m) : "Normal",
  }
}

export interface IotReadingInput {
  deviceId: string
  deviceLabel: string
  schoolUdise: string
  metricKey: string
  value: number
  capturedAt: string
}

export function emptyReading(): IotReadingInput {
  return { deviceId: "", deviceLabel: "", schoolUdise: "33010100101", metricKey: "classroom_temp", value: 0, capturedAt: new Date().toISOString().slice(0, 16) }
}

export type IotReadingErrors = Partial<Record<keyof IotReadingInput, string>>

export function validateReading(f: IotReadingInput): { ok: boolean; errors: IotReadingErrors } {
  const e: IotReadingErrors = {}
  if (!f.deviceId.trim()) e.deviceId = "Device id is required"
  if (!f.deviceLabel.trim()) e.deviceLabel = "Device label is required"
  if (!f.schoolUdise.trim()) e.schoolUdise = "School UDISE is required"
  if (!metricFor(f.metricKey)) e.metricKey = "Select a known metric"
  if (!Number.isFinite(f.value)) e.value = "Reading value must be a number"
  if (!f.capturedAt.trim()) e.capturedAt = "Capture time is required"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface IotFilters {
  query?: string
  category?: string
  severity?: string
  schoolUdise?: string
  page?: number
  pageSize?: number
}

export interface IotSummary {
  total: number
  devices: number
  normal: number
  warning: number
  critical: number
}

export interface IotPage {
  readings: IotReadingView[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: IotSummary
}

const DEFAULT_PAGE_SIZE = 12

export function telemetrySummary(all: IotReading[]): IotSummary {
  const v = all.map(view)
  return {
    total: all.length,
    devices: new Set(all.map((r) => r.deviceId)).size,
    normal: v.filter((r) => r.severity === "Normal").length,
    warning: v.filter((r) => r.severity === "Warning").length,
    critical: v.filter((r) => r.severity === "Critical").length,
  }
}

/** Readings currently breaching a threshold (Critical first, then Warning), newest first. */
export function alerts(all: IotReading[]): IotReadingView[] {
  const order: Record<Severity, number> = { Critical: 0, Warning: 1, Normal: 2 }
  return all
    .map(view)
    .filter((r) => r.severity !== "Normal")
    .sort((a, b) => order[a.severity] - order[b.severity] || (a.capturedAt < b.capturedAt ? 1 : -1))
}

export function queryReadings(all: IotReading[], f: IotFilters = {}): IotPage {
  const q = (f.query ?? "").trim().toLowerCase()
  const sevOrder: Record<Severity, number> = { Critical: 0, Warning: 1, Normal: 2 }
  let rows = all.map(view).filter((r) => {
    if (q && !(`${r.deviceLabel} ${r.deviceId} ${r.metricLabel}`.toLowerCase().includes(q))) return false
    if (f.category && r.category !== f.category) return false
    if (f.severity && r.severity !== f.severity) return false
    if (f.schoolUdise && r.schoolUdise !== f.schoolUdise) return false
    return true
  })
  const summary = telemetrySummary(rows)
  // Most-severe first, then newest.
  rows = [...rows].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || (a.capturedAt < b.capturedAt ? 1 : -1))
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { readings: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
