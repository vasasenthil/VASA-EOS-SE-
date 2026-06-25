// VASA-EOS(SE) — student enrolment snapshot (pure logic).
//
// Backs the Principal dashboard's "Total Students" KPI with live, durable data instead of a
// hardcoded value, and carries a boys/girls split so gender-parity (a real TN/UDISE+ metric) is
// derivable. A snapshot is one school point-in-time: total on roll, boys, girls. Pure +
// client-safe so the same maths runs in tests and on the dashboard.

export interface Enrolment {
  total: number
  boys: number
  girls: number
}

export interface EnrolmentView extends Enrolment {
  girlsPct: number
  /** Gender Parity Index (girls / boys), 2 dp; 0 when no boys on roll. */
  gpi: number
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function viewFor(e: Enrolment): EnrolmentView {
  const girlsPct = e.total === 0 ? 0 : round1((e.girls / e.total) * 100)
  const gpi = e.boys === 0 ? 0 : round2(e.girls / e.boys)
  return { ...e, girlsPct, gpi }
}
