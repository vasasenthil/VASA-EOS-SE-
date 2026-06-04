import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LOCALES } from "@/lib/i18n"
import { TranslateDemo } from "./translate-demo"

export default function MultilingualPage() {
  const tamil = LOCALES.find((l) => l.code === "ta")

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Multilingual &amp; Voice</PageHeaderHeading>
        <PageHeaderDescription>
          22 Indian languages + 150+ dialects, Tamil-first for TN. Content, translation, speech (ASR/TTS) and IVR run
          through Bhashini — enabling voice-first access for low-literacy parents.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map((l) => (
                <Badge key={l.code} variant={l.code === "ta" ? "default" : "outline"}>
                  {l.nativeLabel}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tamil Dialects (IVR / ASR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(tamil?.dialects ?? []).map((d) => (
                <Badge key={d} variant="secondary">
                  {d}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <TranslateDemo />
    </Shell>
  )
}
