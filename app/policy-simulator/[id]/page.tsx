import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Scale, ShieldCheck } from "lucide-react"
import { getProposalAction } from "../actions"
import { DeleteProposalButton } from "../components/proposal-actions"
import { project, inr } from "@/lib/policysim"

export const dynamic = "force-dynamic"

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProposalAction(id)

  if (!p) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Proposal not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this proposal. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/policy-simulator"><ArrowLeft className="mr-2 h-4 w-4" />Back to simulator</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const proj = project(p)
  const baseline: Array<[string, string]> = [
    ["Scheme", p.scheme],
    ["Scope", p.scope],
    ["Eligible population", p.population.toLocaleString("en-IN")],
    ["Current coverage", `${p.baselineCoveragePct}%`],
    ["Target coverage", `${p.targetCoveragePct}%`],
    ["Unit cost / beneficiary", inr(p.unitCost)],
    ["Equity-weighted", p.equityWeighted ? "Yes" : "No"],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{p.title}</PageHeaderHeading>
        <PageHeaderDescription>{p.scheme} · {p.scope}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/policy-simulator/${p.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit / sanction</Link></Button>
          <DeleteProposalButton id={p.id} label={p.title} redirectTo="/policy-simulator" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/policy-simulator"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{p.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-indigo-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Scale className="h-4 w-4 text-indigo-600" />Policy Engine projection</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-indigo-100 text-indigo-700 border-0">+{proj.newlyCovered.toLocaleString("en-IN")} beneficiaries</Badge>
              <Badge variant="secondary">coverage → {Math.round(proj.projectedCoverage * 100)}%</Badge>
              <Badge variant="secondary">{inr(proj.indicativeCost)} indicative</Badge>
            </div>
            <p className="text-muted-foreground">{proj.explanation}</p>
            <p className="text-muted-foreground">{proj.equityNote}</p>
            <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Human authority · advisory only</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Baseline & sanction</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {baseline.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
              <div className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">Decision</dt><dd className="font-medium">{p.status}</dd></div>
              <div className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">Authority</dt><dd className="font-medium">{p.decidedBy || "—"}</dd></div>
              <div className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">Sanctioned budget</dt><dd className="font-medium">{p.sanctionedBudget > 0 ? inr(p.sanctionedBudget) : "—"}</dd></div>
            </dl>
            {p.notes ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Notes: </span>{p.notes}</p> : null}
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
