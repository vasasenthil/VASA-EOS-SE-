import { redirect } from "next/navigation"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createScheme } from "@/lib/stores/scheme-store"
import { SCHEME_CREATE_CATEGORIES, schemeCreationErrorMessage, schemeProposalFromFormData } from "@/lib/schemes/create-form"

interface CreateSchemePageProps {
  searchParams: Promise<{ error?: string }>
}

async function createSchemeFormAction(formData: FormData) {
  "use server"
  let schemeId: string
  try {
    const proposal = schemeProposalFromFormData(formData, "secretariat")
    const scheme = await createScheme(proposal)
    schemeId = scheme.id
  } catch (error) {
    redirect(`/schemes/create?error=${encodeURIComponent(schemeCreationErrorMessage(error))}`)
  }
  redirect(`/schemes/${schemeId}`)
}

export default async function CreateSchemePage({ searchParams }: CreateSchemePageProps) {
  const { error } = await searchParams

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Create scheme</PageHeaderHeading>
        <PageHeaderDescription>
          Create a durable scheme proposal and route it into the auditable scheme lifecycle. Benefits remain advisory or draft until the named human approval workflow completes.
        </PageHeaderDescription>
      </PageHeader>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Scheme creation blocked</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Scheme proposal details</CardTitle>
          <CardDescription>
            This form writes to the production scheme lifecycle store; it does not create demo-only records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSchemeFormAction} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Scheme name</Label>
              <Input id="name" name="name" minLength={3} required placeholder="e.g. District Digital Learning Labs" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" minLength={10} required placeholder="Describe the policy intent, scope and delivery model." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" required className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {SCHEME_CREATE_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal year</Label>
              <Input id="fiscalYear" name="fiscalYear" required pattern="\d{4}-\d{2}" defaultValue="2026-27" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input id="budget" name="budget" type="number" min="0" step="1" required defaultValue="0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="milestoneName">First milestone</Label>
              <Input id="milestoneName" name="milestoneName" placeholder="Pilot launch" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="milestoneDueDate">Milestone due date</Label>
              <Input id="milestoneDueDate" name="milestoneDueDate" type="date" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="eligibility">Eligibility criteria</Label>
              <Textarea id="eligibility" name="eligibility" minLength={3} required placeholder="Who is eligible and under what conditions?" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="justification">Justification</Label>
              <Textarea id="justification" name="justification" minLength={10} required placeholder="Why this scheme is needed and what evidence supports it." />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="expectedOutcomes">Expected outcomes</Label>
              <Textarea id="expectedOutcomes" name="expectedOutcomes" required placeholder="One outcome per line, e.g. Increase digital lesson usage" />
            </div>

            <div className="md:col-span-2">
              <Button type="submit">Create scheme</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Shell>
  )
}
