import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogIn, ArrowRight } from "lucide-react"
import { PORTALS, type GovernanceTier, type PortalDef } from "@/config/portals"
import { DURABLE_MODULES } from "@/lib/governance/durable-modules"

export const dynamic = "force-dynamic"

// One front door for the whole platform: every stakeholder portal and every deep/durable module, reachable from
// this single URL. The lists are read from the live registers (config/portals.ts + lib/governance/durable-modules.ts)
// so the directory cannot drift from what actually ships.

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

export default function PlatformDirectoryPage() {
  const portalsByTier = TIER_ORDER.map((tier) => ({
    tier,
    portals: (Object.values(PORTALS) as PortalDef[]).filter((p) => p.tier === tier),
  })).filter((g) => g.portals.length > 0)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>VASA-EOS-SE-TN — Platform Directory</PageHeaderHeading>
        <PageHeaderDescription>
          One front door to the entire platform. Below are all <strong>{Object.keys(PORTALS).length} stakeholder
          portals</strong> and all <strong>{DURABLE_MODULES.length} deep / durable modules</strong> — every one
          reachable from this single URL. Choose a portal to sign in, or open any module directly.
        </PageHeaderDescription>
      </PageHeader>

      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Stakeholder portals</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/login/stakeholders">
                <LogIn className="mr-1 h-4 w-4" /> One-click sign-in directory
              </Link>
            </Button>
          </div>
          {portalsByTier.map(({ tier, portals }) => (
            <Card key={tier}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{TIER_LABEL[tier]}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {portals.map((p) => (
                  <Link
                    key={p.role}
                    href={p.home}
                    className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <span>
                      <span className="font-medium">{p.label}</span>
                      <span className="block text-xs text-muted-foreground">{p.description}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Functional modules</h2>
            <Badge variant="secondary">{DURABLE_MODULES.length} deep · backbone-wired</Badge>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Each module is a real workflow whose actions drive the durable Go backbone (platformd + PostgreSQL)
                with an enforced invariant and an audited write path. They are fully functional when the backbone is
                connected; otherwise they show a &ldquo;backbone not connected&rdquo; notice.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {DURABLE_MODULES.map((m, i) => (
                <Link
                  key={m.route}
                  href={`/${m.route}`}
                  className="flex items-start justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted"
                >
                  <span>
                    <span className="font-medium">
                      <span className="mr-1 text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
                      {m.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{m.invariant}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </Shell>
  )
}
