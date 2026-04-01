import { NextRequest, NextResponse } from "next/server"

/**
 * Report Export API
 * GET /api/export/reports?reportId=<id>&format=csv|html
 *
 * format=csv   → returns a CSV file download
 * format=html  → returns a printable HTML page (user can File → Print → Save as PDF)
 */

// Static report data — matches the reports shown on the tracking/reports page
const REPORT_DATA: Record<string, { title: string; headers: string[]; rows: string[][] }> = {
  "annual-education-performance": {
    title: "Annual Education Performance Report 2025–26",
    headers: ["State", "NER %", "Attendance %", "Outcome Index", "Teachers Trained %"],
    rows: [
      ["Rajasthan", "96.2", "87.4", "72.1", "78.3"],
      ["Maharashtra", "97.8", "89.1", "74.6", "82.1"],
      ["Uttar Pradesh", "94.3", "84.2", "68.9", "71.4"],
      ["Gujarat", "98.1", "91.3", "76.2", "85.7"],
      ["Tamil Nadu", "99.2", "93.7", "81.4", "91.2"],
      ["Karnataka", "98.4", "92.1", "79.8", "88.6"],
      ["Madhya Pradesh", "93.1", "83.6", "67.3", "69.8"],
      ["West Bengal", "95.7", "86.4", "71.2", "74.3"],
    ],
  },
  "quarterly-scheme-implementation": {
    title: "Quarterly Scheme Implementation Report Q4 2025–26",
    headers: ["Scheme", "Budget (₹Cr)", "Released (₹Cr)", "Utilised (₹Cr)", "Utilisation %"],
    rows: [
      ["PM POSHAN", "2400", "2200", "1980", "90.0"],
      ["SAMGRAHA SHIKSHA", "3600", "3200", "2880", "90.0"],
      ["NEP Implementation Fund", "1200", "900", "720", "80.0"],
      ["Digital Infrastructure", "800", "600", "480", "80.0"],
      ["Teacher Training", "500", "450", "360", "80.0"],
      ["Mid-Day Meal Expansion", "1800", "1600", "1440", "90.0"],
    ],
  },
  "milestone-progress": {
    title: "NEP Milestone Progress Report",
    headers: ["Milestone", "Target Date", "Status", "Completion %", "Responsible"],
    rows: [
      ["Foundational Literacy & Numeracy", "Mar 2026", "Completed", "100", "Academic Division"],
      ["FLN Assessment Framework", "Jun 2026", "In Progress", "72", "NCF Team"],
      ["Digital Infrastructure Setup", "Dec 2025", "Completed", "100", "IT Division"],
      ["Teacher Training — NEP", "Sep 2026", "In Progress", "58", "NCTE"],
      ["Vocational Education Integration", "Mar 2027", "Not Started", "0", "State Boards"],
      ["Mother Tongue Based MLE", "Jun 2026", "In Progress", "45", "State Education Depts"],
    ],
  },
  "stakeholder-report": {
    title: "Stakeholder Engagement Report",
    headers: ["Stakeholder Type", "Count", "Engaged", "Engagement %", "Last Activity"],
    rows: [
      ["State Education Departments", "36", "34", "94.4", "28 Mar 2026"],
      ["District Officers", "748", "712", "95.2", "30 Mar 2026"],
      ["School Principals", "12480", "11832", "94.8", "31 Mar 2026"],
      ["Teachers", "142000", "128000", "90.1", "30 Mar 2026"],
      ["Parent Associations", "24600", "18900", "76.8", "25 Mar 2026"],
      ["Civil Society Orgs", "320", "287", "89.7", "22 Mar 2026"],
    ],
  },
}

const DEFAULT_REPORT = {
  title: "VASA-EOS Report",
  headers: ["Field", "Value"],
  rows: [["Status", "No data available for this report"]],
}

function toCSV(title: string, headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [
    escape(title),
    "",
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ]
  return lines.join("\n")
}

function toHTML(title: string, headers: string[], rows: string[][]): string {
  const headerCells = headers.map((h) => `<th style="padding:8px 12px;background:#1e40af;color:white;text-align:left">${h}</th>`).join("")
  const bodyRows = rows
    .map(
      (r, i) =>
        `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "white"}">${r.map((c) => `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${c}</td>`).join("")}</tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #1e40af; font-size: 20px; margin-bottom: 8px; }
    p  { color: #64748b; font-size: 13px; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; font-size: 14px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} · VASA-EOS-SE Platform</p>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reportId = searchParams.get("reportId") ?? "annual-education-performance"
  const format = searchParams.get("format") ?? "csv"

  const report = REPORT_DATA[reportId] ?? DEFAULT_REPORT
  const { title, headers, rows } = report

  if (format === "html") {
    return new NextResponse(toHTML(title, headers, rows), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  }

  // Default: CSV
  const csv = toCSV(title, headers, rows)
  const filename = `${reportId}-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
