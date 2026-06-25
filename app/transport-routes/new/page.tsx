import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RouteForm } from "../components/route-form"

export default function NewRoutePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Transport Route</PageHeaderHeading>
        <PageHeaderDescription>Plan a route — vehicle, driver, capacity, ordered stops with pickup/drop times and the term fare.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/transport-routes"><ArrowLeft className="mr-2 h-4 w-4" />Back to routes</Link></Button></div>
      <RouteForm />
    </Shell>
  )
}
