import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import { PORTALS, type GovernanceTier, type PortalRole, type PortalDef } from "@/config/portals"
import { DEMO_USERS, DEMO_PASSWORD } from "@/lib/demo-auth"
import { demoLoginAction } from "../actions"

// One representative demo email per role (several Directorates share the DIRECTOR role).
const EMAIL_BY_ROLE: Partial<Record<string, string>> = (() => {
  const m: Partial<Record<string, string>> = {}
  for (const [email, role] of Object.entries(DEMO_USERS)) if (!m[role]) m[role] = email
  return m
})()

const TIER_ORDER: GovernanceTier[] = ["state", "directorate", "district", "block", "cluster", "school", "national", "public"]
const TIER_LABEL: Record<GovernanceTier, string> = {
  state: "State / Secretariat (Executive)",
  directorate: "Directorate (7 directorates)",
  district: "District (CEO / DEO)",
  block: "Block (BEO)",
  cluster: "Cluster (BRC / CRC)",
  school: "School",
  national: "National / Partner",
  public: "Citizen / Civic",
}

export default function StakeholderDirectoryPage() {
  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    portals: (Object.values(PORTALS) as PortalDef[]).filter((p) => p.tier === tier),
  })).filter((g) => g.portals.length > 0)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Stakeholder Sign-in Directory</PageHeaderHeading>
        <PageHeaderDescription>
          Every stakeholder category across the Tamil Nadu school-education governance hierarchy. In the credential-free
          walkthrough, tap <strong>Sign in</strong> to enter any portal directly. For manual sign-in use the listed
          email and the shared demo password <code className="rounded bg-muted px-1">{DEMO_PASSWORD}</code>. When a real
          database is configured, these one-click buttons defer to proper authentication.
        </PageHeaderDescription>
      </PageHeader>

      <div className="space-y-5">
        {byTier.map(({ tier, portals }) => (
          <Card key={tier}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{TIER_LABEL[tier]}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {portals.map((p) => (
                  <div key={p.role} className="flex flex-col justify-between rounded-md border p-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{p.label}</span>
                        <Badge variant="outline" className="text-[10px]">{p.role}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                      {EMAIL_BY_ROLE[p.role] ? (
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{EMAIL_BY_ROLE[p.role]}</p>
                      ) : null}
                    </div>
                    <form action={demoLoginAction} className="mt-2">
                      <input type="hidden" name="role" value={p.role} />
                      <Button type="submit" size="sm" variant="secondary" className="w-full">
                        <LogIn className="mr-2 h-3.5 w-3.5" />Sign in as {p.label}
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <p className="pt-1 text-center text-sm text-muted-foreground">
          Looking for a feature instead of a role?{" "}
          <a href="/directory" className="font-medium underline underline-offset-2">
            Browse the full platform directory
          </a>{" "}
          — all portals and {""}
          functional modules under one roof.
        </p>
      </div>
    </Shell>
  )
}
