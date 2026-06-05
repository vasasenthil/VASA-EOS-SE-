// VASA-EOS(SE) — career guidance (Sec 17 / Counselling Agent · Naan Mudhalvan).
// Maps a learner's interest areas to suggested streams and careers. Pure scoring;
// the UI lets a student pick interests and see ranked recommendations.

export const INTEREST_AREAS = [
  "Science & Tech",
  "Mathematics",
  "Languages & Literature",
  "Arts & Design",
  "Commerce & Business",
  "Social Sciences",
  "Sports & Fitness",
  "Vocational / Skilling",
]

export interface CareerPath {
  stream: string
  careers: string[]
  matches: string[] // interest areas this stream serves
}

export const CAREER_PATHS: CareerPath[] = [
  { stream: "Science (PCM)", careers: ["Engineering", "Architecture", "Data Science"], matches: ["Science & Tech", "Mathematics"] },
  { stream: "Science (PCB)", careers: ["Medicine", "Biotechnology", "Nursing"], matches: ["Science & Tech", "Sports & Fitness"] },
  { stream: "Commerce", careers: ["Chartered Accountancy", "Business Management", "Economics"], matches: ["Commerce & Business", "Mathematics"] },
  { stream: "Humanities", careers: ["Law", "Civil Services", "Journalism", "Psychology"], matches: ["Languages & Literature", "Social Sciences"] },
  { stream: "Fine Arts & Design", careers: ["Design", "Media & Animation", "Architecture"], matches: ["Arts & Design"] },
  { stream: "Vocational / Skilling (Naan Mudhalvan)", careers: ["IT-ITeS", "Healthcare support", "Skilled trades"], matches: ["Vocational / Skilling", "Sports & Fitness"] },
]

export interface CareerRecommendation {
  path: CareerPath
  score: number
}

/** Streams that match any selected interest, ranked by match count. */
export function recommend(interests: string[]): CareerRecommendation[] {
  return CAREER_PATHS.map((path) => ({ path, score: path.matches.filter((m) => interests.includes(m)).length }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
}
