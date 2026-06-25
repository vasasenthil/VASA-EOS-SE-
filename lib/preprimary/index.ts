// VASA-EOS(SE) — Anganwadi / pre-primary intake (Sec 33 / ECCE, NEP foundational stage).
// Register 3-6 year-olds into Anganwadi centres with eligibility. Pure helpers.

export const ANGANWADI_CENTRES = ["AWC Egmore-1", "AWC Egmore-2", "AWC Triplicane", "Balwadi Chepauk"]

export interface PrePrimaryChild {
  id: string
  name: string
  age: number
  gender: string
  centre: string
}

/** ECCE eligibility: ages 3 to 6 (foundational stage). */
export function ageEligible(age: number): boolean {
  return age >= 3 && age <= 6
}

export interface PrePrimarySummary {
  total: number
  eligible: number
  girls: number
}

export function preprimarySummary(children: PrePrimaryChild[]): PrePrimarySummary {
  return {
    total: children.length,
    eligible: children.filter((c) => ageEligible(c.age)).length,
    girls: children.filter((c) => c.gender === "female").length,
  }
}
