import { EXAM_INTEGRITY_CONTROLS, toCSV } from "@/lib/exams/integrity"

// Downloadable examination-integrity register — each malpractice/fraud vector mapped to the
// in-repo control that closes it and the exam-lifecycle stage it guards.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(EXAM_INTEGRITY_CONTROLS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-exam-integrity.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
