import { productionCutoverReport } from "@/lib/production/cutover"

const report = await productionCutoverReport()
console.log(JSON.stringify(report, null, 2))
if (!report.ready) process.exit(1)
