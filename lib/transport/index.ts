// VASA-EOS(SE) — School Transport (Sec 35 / welfare).
// Free bus pass (TNSTC/MTC), free cycle (Class 11), and CWSN transport.

export interface BusRoute {
  id: string
  name: string
  operator: "TNSTC" | "MTC"
  students: number
  cwsn: number
}

export const ROUTES: BusRoute[] = [
  { id: "R1", name: "Egmore – Triplicane", operator: "MTC", students: 64, cwsn: 3 },
  { id: "R2", name: "Coimbatore Rural Loop", operator: "TNSTC", students: 88, cwsn: 5 },
  { id: "R3", name: "Nilgiris Hill Route", operator: "TNSTC", students: 41, cwsn: 2 },
  { id: "R4", name: "Madurai City Circuit", operator: "MTC", students: 72, cwsn: 4 },
]

export interface TransportSummary {
  routes: number
  students: number
  cwsn: number
}

export function transportSummary(routes: BusRoute[] = ROUTES): TransportSummary {
  return {
    routes: routes.length,
    students: routes.reduce((s, r) => s + r.students, 0),
    cwsn: routes.reduce((s, r) => s + r.cwsn, 0),
  }
}

export const TRANSPORT_SCHEMES: { label: string; detail: string }[] = [
  { label: "Free Bus Pass", detail: "TNSTC/MTC — auto-issued via APAAR; renewal & replacement" },
  { label: "Free Cycle (Class 11)", detail: "Promotes higher-secondary continuation, esp. rural girls" },
  { label: "CWSN Transport", detail: "Accessible transport for children with special needs" },
]
