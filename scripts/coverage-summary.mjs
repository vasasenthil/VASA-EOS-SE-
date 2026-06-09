// Turns Node's textual coverage report (captured to coverage.txt) into a Markdown
// summary: a shields.io coverage badge + a totals table + the full per-file report.
// Writes it to the GitHub Actions job summary and to coverage-comment.md (which the
// workflow upserts as a sticky PR comment). Safe to run locally too.

import fs from "node:fs"

const txt = fs.existsSync("coverage.txt") ? fs.readFileSync("coverage.txt", "utf8") : ""
const lines = txt.split("\n")

const start = lines.findIndex((l) => l.includes("start of coverage report"))
const end = lines.findIndex((l) => l.includes("end of coverage report"))
const table = start >= 0 && end >= 0 ? lines.slice(start, end + 1).map((l) => l.replace(/^#\s?/, "")).join("\n") : "(no coverage report found)"

const allLine = lines.find((l) => l.includes("all files")) || ""
const m = allLine.match(/all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/)
const linePct = m?.[1] ?? "0"
const branchPct = m?.[2] ?? "0"
const funcPct = m?.[3] ?? "0"

const color = (p) => (parseFloat(p) >= 90 ? "brightgreen" : parseFloat(p) >= 80 ? "green" : parseFloat(p) >= 70 ? "yellow" : "orange")
const badge = `![coverage](https://img.shields.io/badge/coverage-${linePct}%25-${color(linePct)})`

const body = `<!-- coverage-report -->
## 🧪 Unit Test Coverage

${badge}

| Lines | Branches | Functions |
|------:|---------:|----------:|
| ${linePct}% | ${branchPct}% | ${funcPct}% |

<details><summary>Full per-file report</summary>

\`\`\`
${table}
\`\`\`
</details>
`

fs.writeFileSync("coverage-comment.md", body)
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, body + "\n")
}
console.log(`coverage: lines ${linePct}% · branches ${branchPct}% · functions ${funcPct}%`)
