import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Cpu, ShieldCheck, CheckCircle2 } from "lucide-react"
import { getCaseAction } from "../actions"
import { DeleteCaseButton } from "../components/eligibility-actions"
import { derive, RULE_SETS } from "@/lib/eligibility"

export const dynamic = "force-dynamic"

export default async function EligibilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getCaseAction(id)

  if (!c) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Case not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this case. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/eligibility"><ArrowLeft className="mr-2 h-4 w-4" />Back to cases</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const r = derive(c.facts, c.category) // engine derivation, recomputed (never stored)
  const set = RULE_SETS[c.category]
  const labelOf = (key: string) => set?.factKeys.find((fk) => fk.key === key)?.label ?? key

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{c.subject}</PageHeaderHeading>
        <PageHeaderDescription>{c.category}{c.reference ? ` · ${c.reference}` : ""}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/eligibility/${c.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit / decide</Link></Button>
          <DeleteCaseButton id={c.id} label={c.subject} redirectTo="/eligibility" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/eligibility"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{c.decision}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-indigo-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-indigo-600" />Reasoning Engine</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {r.conclusions.length === 0 ? <p className="text-sm text-muted-foreground">{r.explanation}</p> : (
              <ul className="space-y-2 text-sm">
                {r.conclusions.map((d) => (
                  <li key={d.ruleId} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 shrink-0" />
                    <span><strong>{d.conclusion}</strong><div className="text-xs text-muted-foreground">{d.because} <Badge variant="outline" className="ml-1">rule {d.ruleId}</Badge></div></span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">{r.explanation}</p>
            <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Human authority · advisory only</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Facts & decision</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3">
              {c.facts.map((fa) => (
                <div key={fa.key} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{labelOf(fa.key)}</dt><dd className="font-medium">{fa.value}</dd></div>
              ))}
              <div className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">Decision</dt><dd className="font-medium">{c.decision}</dd></div>
              <div className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">Decided by</dt><dd className="font-medium">{c.decidedBy || "— (pending)"}</dd></div>
            </dl>
            {c.notes ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Notes: </span>{c.notes}</p> : null}
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
