import { allocateBudget } from "@/lib/stores/scheme-budget-store"
import { recordBeneficiary, recordOutcome } from "@/lib/stores/scheme-outcome-store"
import { SCHEME_SEEDS, seedSchemeMemory, saveSchemeRecord } from "@/lib/stores/scheme-store"

async function main(): Promise<void> {
  seedSchemeMemory()
  for (const scheme of SCHEME_SEEDS) {
    await saveSchemeRecord(scheme)
    if (scheme.status === "active" || scheme.status === "approved") {
      await allocateBudget(scheme.id, scheme.budget, scheme.fiscalYear)
      await recordBeneficiary(scheme.id, {
        beneficiaryId: `${scheme.id.slice(0, 8)}-BEN-001`,
        beneficiaryName: `${scheme.name} pilot beneficiary`,
        benefitType: scheme.category,
        amount: Math.min(10_000, scheme.budget),
        district: "Chennai",
      })
      await recordOutcome(scheme.id, {
        metricName: "coveragePct",
        value: scheme.status === "active" ? 72 : 18,
        unit: "percent",
        evaluation: `${scheme.name} seeded baseline coverage for immediate dashboard verification.`,
      })
    }
  }
  console.log(`Seeded ${SCHEME_SEEDS.length} schemes with budgets/outcomes where applicable.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
