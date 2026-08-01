import { z } from "zod"

export const schemeStatusSchema = z.enum(["draft", "proposed", "under_review", "approved", "active", "suspended", "closed"])
export const schemeCategorySchema = z.enum(["scholarship", "infrastructure", "teacher_training", "mid_day_meal", "digital_learning", "inclusive_education", "sports", "vocational"])

export const timelineSchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  milestones: z.array(z.object({ name: z.string().min(1), dueDate: z.string().datetime({ offset: true }) })).default([]),
})

export const schemeBudgetSchema = z.object({
  schemeId: z.string().min(1),
  fiscalYear: z.string().regex(/^\d{4}-\d{2}$/),
  allocated: z.number().nonnegative(),
  released: z.number().nonnegative().default(0),
  utilized: z.number().nonnegative().default(0),
  balance: z.number().nonnegative(),
  updatedAt: z.string().datetime({ offset: true }),
})

export const schemeOutcomeSchema = z.object({
  schemeId: z.string().min(1),
  beneficiaries: z.number().int().nonnegative().default(0),
  impactMetrics: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  evaluation: z.string().min(1),
  recordedAt: z.string().datetime({ offset: true }),
})

export const beneficiarySchema = z.object({
  id: z.string().min(1).optional(),
  schemeId: z.string().min(1).optional(),
  beneficiaryId: z.string().min(1),
  beneficiaryName: z.string().min(1),
  benefitType: z.string().min(1),
  amount: z.number().nonnegative().default(0),
  district: z.string().min(1).optional(),
  addedAt: z.string().datetime({ offset: true }).optional(),
})

export const outcomeMetricSchema = z.object({
  metricName: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().min(1).optional(),
  evaluation: z.string().min(1).default("Recorded through scheme outcome tracker"),
})

export const schemeProposalSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  category: schemeCategorySchema,
  eligibility: z.string().min(3),
  budget: z.number().nonnegative(),
  fiscalYear: z.string().regex(/^\d{4}-\d{2}$/).default("2026-27"),
  timeline: timelineSchema.default({ milestones: [] }),
  proposedBy: z.string().min(1).default("system"),
  justification: z.string().min(10),
  expectedOutcomes: z.array(z.string().min(1)).min(1),
})

export const schemeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3),
  description: z.string().min(10),
  category: schemeCategorySchema,
  eligibility: z.string().min(3),
  budget: z.number().nonnegative(),
  fiscalYear: z.string().regex(/^\d{4}-\d{2}$/),
  timeline: timelineSchema,
  status: schemeStatusSchema,
  proposedBy: z.string().min(1),
  approvedBy: z.array(z.string().min(1)).default([]),
  justification: z.string().min(10),
  expectedOutcomes: z.array(z.string().min(1)).default([]),
  workflowId: z.string().min(1).optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
})

export const schemeFiltersSchema = z.object({
  status: z.array(schemeStatusSchema).optional(),
  category: z.array(schemeCategorySchema).optional(),
  query: z.string().optional(),
  minBudget: z.number().nonnegative().optional(),
  maxBudget: z.number().nonnegative().optional(),
}).default({})

export type SchemeStatus = z.infer<typeof schemeStatusSchema>
export type SchemeCategory = z.infer<typeof schemeCategorySchema>
export type Scheme = z.infer<typeof schemeSchema>
export type SchemeProposal = z.infer<typeof schemeProposalSchema>
export type SchemeBudget = z.infer<typeof schemeBudgetSchema>
export type SchemeOutcome = z.infer<typeof schemeOutcomeSchema>
export type SchemeFilters = z.infer<typeof schemeFiltersSchema>
export type Beneficiary = z.infer<typeof beneficiarySchema>
export type OutcomeMetric = z.infer<typeof outcomeMetricSchema>

export interface SchemeOutcomeReport {
  schemeId: string
  beneficiaries: Beneficiary[]
  outcomes: SchemeOutcome[]
  latestMetrics: Record<string, string | number | boolean>
}
