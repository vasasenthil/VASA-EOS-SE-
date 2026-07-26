import { promoteModel } from "@/lib/ml/registry/promote-model"
import { trainDropoutRisk } from "@/lib/ml/training/train-dropout-risk"
import { trainInspectionPriority } from "@/lib/ml/training/train-inspection-priority"
import { trainSchemeImpact } from "@/lib/ml/training/train-scheme-impact"

async function main(): Promise<void> {
  const dropout = await trainDropoutRisk()
  const inspection = await trainInspectionPriority()
  const scheme = await trainSchemeImpact()
  await promoteModel("inspection-priority", inspection.version, "seed-ml", "Initial low-stakes inspection model")
  await promoteModel("scheme-impact", scheme.version, "seed-ml", "Initial low-stakes scheme impact model")
  console.log(`Seeded ML models: dropout=${dropout.version} candidate, inspection=${inspection.version} active, scheme=${scheme.version} active`)
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
