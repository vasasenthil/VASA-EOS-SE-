import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DEEP_ACCESSIBILITY } from "@/lib/accessibility"
import { RPWD_CATEGORIES } from "@/lib/domain"
import { A11yPanel } from "./a11y-panel"

export default function AccessibilityPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Accessibility &amp; Inclusion</PageHeaderHeading>
        <PageHeaderDescription>
          WCAG 2.2 AAA from day one, with deep accessibility across the 21 RPwD disability categories — Braille, screen
          readers, ISL, AAC, switch/eye-tracking, cognitive and sensory-friendly modes.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>14 Deep-Accessibility Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {DEEP_ACCESSIBILITY.map((f) => (
                <li key={f.key} className="text-sm">
                  <span className="font-medium">{f.label}</span>
                  <span className="text-muted-foreground"> — {f.beneficiaries}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>21 RPwD Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {RPWD_CATEGORIES.map((c, i) => (
                <Badge key={c} variant="outline" className="text-xs">
                  {i + 1}. {c}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <A11yPanel />
    </Shell>
  )
}
