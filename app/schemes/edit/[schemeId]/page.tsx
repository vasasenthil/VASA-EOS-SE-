import Link from "next/link"
import { redirect } from "next/navigation"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getScheme, updateScheme } from "@/lib/stores/scheme-store"
import { SCHEME_CREATE_CATEGORIES, schemeCreationErrorMessage, schemeUpdatesFromFormData } from "@/lib/schemes/create-form"

interface EditSchemePageProps {
  params: Promise<{ schemeId: string }>
  searchParams: Promise<{ error?: string }>
}

async function updateSchemeFormAction(schemeId: string, formData: FormData) {
  "use server"
  try {
    await updateScheme(schemeId, schemeUpdatesFromFormData(formData))
  } catch (error) {
    redirect(`/schemes/edit/${schemeId}?error=${encodeURIComponent(schemeCreationErrorMessage(error))}`)
  }
  redirect(`/schemes/${schemeId}`)
}

export default async function EditSchemePage({ params, searchParams }: EditSchemePageProps) {
  const [{ schemeId }, { error }] = await Promise.all([params, searchParams])
  const scheme = await getScheme(schemeId).catch(() => null)

  if (!scheme) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Scheme not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find a durable scheme with this reference. It may have been removed or the scheme database is not configured.</p>
            <Button asChild variant="outline" size="sm"><Link href="/schemes">Back to all schemes</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const updateAction = updateSchemeFormAction.bind(null, scheme.id)
  const firstMilestone = scheme.timeline.milestones[0]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit scheme</PageHeaderHeading>
        <PageHeaderDescription>
          Update the durable scheme proposal. Existing approval decisions remain auditable; substantive changes still require the named human approval workflow.
        </PageHeaderDescription>
      </PageHeader>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Scheme update blocked</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{scheme.name}</CardTitle>
          <CardDescription>Changes are saved through the production scheme lifecycle store.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateAction} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Scheme name</Label>
              <Input id="name" name="name" minLength={3} required defaultValue={scheme.name} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" minLength={10} required defaultValue={scheme.description} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" required defaultValue={scheme.category} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {SCHEME_CREATE_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal year</Label>
              <Input id="fiscalYear" name="fiscalYear" required pattern="\d{4}-\d{2}" defaultValue={scheme.fiscalYear} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input id="budget" name="budget" type="number" min="0" step="1" required defaultValue={scheme.budget} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="milestoneName">First milestone</Label>
              <Input id="milestoneName" name="milestoneName" defaultValue={firstMilestone?.name ?? ""} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="milestoneDueDate">Milestone due date</Label>
              <Input id="milestoneDueDate" name="milestoneDueDate" type="date" defaultValue={firstMilestone?.dueDate.slice(0, 10) ?? ""} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="eligibility">Eligibility criteria</Label>
              <Textarea id="eligibility" name="eligibility" minLength={3} required defaultValue={scheme.eligibility} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="justification">Justification</Label>
              <Textarea id="justification" name="justification" minLength={10} required defaultValue={scheme.justification} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="expectedOutcomes">Expected outcomes</Label>
              <Textarea id="expectedOutcomes" name="expectedOutcomes" required defaultValue={scheme.expectedOutcomes.join("\n")} />
            </div>

            <div className="flex gap-2 md:col-span-2">
              <Button type="submit">Save changes</Button>
              <Button asChild type="button" variant="outline"><Link href={`/schemes/${scheme.id}`}>Cancel</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Shell>
  )
}
