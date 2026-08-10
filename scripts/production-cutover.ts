import { productionCutoverReport } from "@/lib/production/cutover"

const report = productionCutoverReport()
console.log(JSON.stringify(report, null, 2))
if (!report.ready) process.exit(1)
