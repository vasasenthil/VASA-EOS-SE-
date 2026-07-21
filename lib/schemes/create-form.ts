import { schemeProposalSchema, type SchemeCategory, type SchemeProposal } from "@/lib/schemes/schemas"

export const SCHEME_CREATE_CATEGORIES: { value: SchemeCategory; label: string }[] = [
  { value: "scholarship", label: "Scholarship / beneficiary support" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "teacher_training", label: "Teacher training" },
  { value: "mid_day_meal", label: "Nutrition / meal programme" },
  { value: "digital_learning", label: "Digital learning" },
  { value: "inclusive_education", label: "Inclusive education" },
  { value: "sports", label: "Sports and co-curricular" },
  { value: "vocational", label: "Vocational education" },
]

function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function numberValue(formData: FormData, key: string): number {
  const value = text(formData, key)
  return value ? Number(value) : 0
}

function lines(value: string): string[] {
  return value.split(/\r?\n|;/).map((line) => line.trim()).filter(Boolean)
}

export function schemeProposalFromFormData(formData: FormData, proposedBy = "secretariat"): SchemeProposal {
  const milestones = text(formData, "milestoneName")
    ? [{ name: text(formData, "milestoneName"), dueDate: new Date(text(formData, "milestoneDueDate") || Date.now()).toISOString() }]
    : []

  return schemeProposalSchema.parse({
    name: text(formData, "name"),
    description: text(formData, "description"),
    category: text(formData, "category"),
    eligibility: text(formData, "eligibility"),
    budget: numberValue(formData, "budget"),
    fiscalYear: text(formData, "fiscalYear") || "2026-27",
    timeline: { milestones },
    proposedBy,
    justification: text(formData, "justification"),
    expectedOutcomes: lines(text(formData, "expectedOutcomes")),
  })
}

export function schemeCreationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/Database required/i.test(message)) {
    return "A durable scheme database is required before schemes can be created. Run the scheme migrations and configure the Supabase service-role credentials."
  }
  return message || "Scheme creation failed."
}
