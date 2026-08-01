import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Shell } from "@/components/shell"
import { getSession } from "@/lib/auth/session"
import { listConfigurationProposals } from "@/lib/configuration/store"
import { ConfigurationConsole } from "./configuration-console"

export const dynamic = "force-dynamic"

export default async function PlatformConfigurationPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!session.roles.some((role) => ["ADMIN", "SECRETARY"].includes(role))) redirect("/settings")
  const proposals = await listConfigurationProposals()

  return <Shell>
    <PageHeader><PageHeaderHeading>Governed Platform Configuration</PageHeaderHeading><PageHeaderDescription>Non-secret operational controls with immutable versions, segregation of duties, scheduled activation, and rollback-by-proposal.</PageHeaderDescription></PageHeader>
    <Card><CardHeader><CardTitle className="text-base">Control-plane boundary</CardTitle><CardDescription>Secrets, endpoints, connection strings, and integration-mode switches remain deployment controlled and cannot be edited here.</CardDescription></CardHeader>
      <CardContent className="flex gap-2"><Badge variant="secondary">Two-person control</Badge><Badge variant="secondary">No self-approval</Badge><Badge variant="secondary">Audit chained</Badge></CardContent>
    </Card>
    <ConfigurationConsole proposals={proposals} roles={session.roles} />
    <div className="mt-6"><Button asChild variant="outline"><Link href="/settings">Back to personal settings</Link></Button></div>
  </Shell>
}
