import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, AlertTriangle } from "lucide-react"
import { getHealthAction } from "../actions"
import { DeleteHealthButton } from "../components/health-actions"
import { bmi, bmiBand, isAnaemic, needsReferral, referralReasons } from "@/lib/healthregister"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function HealthDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getHealthAction(id)

  if (!r) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Record not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this health record. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/health-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const ref = needsReferral(r)
  const reasons = referralReasons(r)
  const rows: Array<[string, string]> = [
    ["Class & section", `Class ${r.classLevel} — ${r.section}`],
    ["Gender", r.gender],
    ["Screening date", safeDate(r.screeningDate, "dd MMM yyyy")],
    ["Height", `${r.heightCm} cm`],
    ["Weight", `${r.weightKg} kg`],
    ["BMI", `${bmi(r) || "—"} (${bmiBand(r)})`],
    ["Haemoglobin", r.hemoglobin > 0 ? `${r.hemoglobin} g/dL${isAnaemic(r) ? " (anaemia)" : ""}` : "—"],
    ["Vision", r.vision],
    ["Hearing", r.hearing],
    ["Dental", r.dental],
    ["Immunisation", r.immunisationUpToDate ? "Up to date" : "Overdue"],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{r.student}</PageHeaderHeading>
        <PageHeaderDescription>Class {r.classLevel}-{r.section} · screened {safeDate(r.screeningDate, "dd MMM yyyy")}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/health-register/${r.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteHealthButton id={r.id} name={r.student} redirectTo="/health-register" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/health-register"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{bmiBand(r)}</Badge>
        {ref ? <Badge className="bg-red-100 text-red-700 border-0"><AlertTriangle className="mr-1 h-3 w-3" />Referral recommended</Badge> : <Badge className="bg-green-100 text-green-700 border-0">No referral</Badge>}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Screening</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
            </dl>
            {r.remarks ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Remarks: </span>{r.remarks}</p> : null}
          </CardContent>
        </Card>
        <Card className={ref ? "border-red-200" : undefined}>
          <CardHeader><CardTitle className="text-base">Referral guidance</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {reasons.length === 0 ? (
              <p className="text-muted-foreground">All findings within normal limits — routine follow-up at the next screening.</p>
            ) : (
              <ul className="space-y-1">
                {reasons.map((x) => <li key={x} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" /><span>{x}</span></li>)}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Indicative school-register signal. RBSK provides the age/sex-appropriate clinical screening of record; log a referral in the RBSK Health Referrals flow.</p>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
