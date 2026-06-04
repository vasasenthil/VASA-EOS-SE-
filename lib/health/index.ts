// VASA-EOS(SE) — School Health / RBSK (Sec 33).
// Rashtriya Bal Swasthya Karyakram screening (the 4 Ds), BMI/anaemia tracking,
// referrals, and ABHA health-record federation.

export interface ScreeningRecord {
  apaarId: string
  name: string
  bmiStatus: "normal" | "underweight" | "overweight"
  anaemia: boolean
  vision: "normal" | "refer"
  referral?: string
}

export const SCREENINGS: ScreeningRecord[] = [
  { apaarId: "APAAR-100200300401", name: "Aarthi M", bmiStatus: "normal", anaemia: false, vision: "normal" },
  { apaarId: "APAAR-100200300402", name: "Bharath K", bmiStatus: "underweight", anaemia: true, vision: "normal", referral: "Nutrition + iron supplementation" },
  { apaarId: "APAAR-100200300405", name: "Eswari T", bmiStatus: "underweight", anaemia: true, vision: "refer", referral: "Ophthalmology + anaemia management" },
  { apaarId: "APAAR-100200300404", name: "Dinesh S", bmiStatus: "normal", anaemia: false, vision: "normal" },
]

export interface HealthSummary {
  screened: number
  anaemia: number
  referrals: number
  anaemiaPct: number
}

export function healthSummary(records: ScreeningRecord[] = SCREENINGS): HealthSummary {
  const anaemia = records.filter((r) => r.anaemia).length
  const referrals = records.filter((r) => r.referral).length
  return {
    screened: records.length,
    anaemia,
    referrals,
    anaemiaPct: records.length ? Math.round((anaemia / records.length) * 100) : 0,
  }
}

// RBSK screens for the "4 Ds".
export const RBSK_FOUR_DS: string[] = [
  "Defects at birth",
  "Deficiencies (anaemia, vitamin)",
  "Diseases (childhood)",
  "Developmental delays incl. disabilities",
]
