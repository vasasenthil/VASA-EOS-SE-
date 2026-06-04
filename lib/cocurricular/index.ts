// VASA-EOS(SE) — Co-curricular & Sports (Sec 50 / 51).
// Clubs, competitions, innovation (ATL/Inspire), arts, and sports (Khelo India).

export interface Activity {
  name: string
  category: "Club" | "Competition" | "Innovation" | "Arts" | "Sports"
  participants: number
}

export const ACTIVITIES: Activity[] = [
  { name: "Robotics Club", category: "Club", participants: 28 },
  { name: "Atal Tinkering Lab", category: "Innovation", participants: 45 },
  { name: "Inspire Award MANAK", category: "Innovation", participants: 12 },
  { name: "Tamil Oratory", category: "Arts", participants: 34 },
  { name: "Bharatanatyam & Carnatic", category: "Arts", participants: 22 },
  { name: "Science Exhibition", category: "Competition", participants: 60 },
  { name: "Athletics (Khelo India)", category: "Sports", participants: 88 },
  { name: "Football", category: "Sports", participants: 40 },
]

export interface CoCurricularSummary {
  activities: number
  participants: number
  sports: number
  innovation: number
}

export function coCurricularSummary(a: Activity[] = ACTIVITIES): CoCurricularSummary {
  return {
    activities: a.length,
    participants: a.reduce((s, x) => s + x.participants, 0),
    sports: a.filter((x) => x.category === "Sports").length,
    innovation: a.filter((x) => x.category === "Innovation").length,
  }
}
