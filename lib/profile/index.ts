// VASA-EOS(SE) — teacher self-service profile (Sec 16 / HR).
// Editable profile with a completeness score. Pure helpers.

export interface TeacherProfile {
  name: string
  designation: string
  subjects: string
  qualification: string
  experienceYears: number
  phone: string
  email: string
}

export const DEFAULT_PROFILE: TeacherProfile = {
  name: "Mrs. Lakshmi",
  designation: "Graduate Assistant",
  subjects: "Mathematics, Science",
  qualification: "M.Sc, B.Ed",
  experienceYears: 8,
  phone: "",
  email: "",
}

const TEXT_FIELDS: (keyof TeacherProfile)[] = ["name", "designation", "subjects", "qualification", "phone", "email"]

/** Percentage of profile fields that are filled (experienceYears counts when > 0). */
export function profileCompleteness(p: TeacherProfile): number {
  const filledText = TEXT_FIELDS.filter((f) => String(p[f] ?? "").trim().length > 0).length
  const filled = filledText + (p.experienceYears > 0 ? 1 : 0)
  const total = TEXT_FIELDS.length + 1
  return Math.round((filled / total) * 100)
}
