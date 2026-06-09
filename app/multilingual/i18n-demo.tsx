"use client"

import { useTranslation } from "react-i18next"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function I18nDemo() {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          {t("language")}
          <LanguageSwitcher />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{t("demo.heading")}</p>
        <p className="text-lg font-medium">{t("welcome")}</p>
        <p>
          {t("nav.dashboard")} · {t("nav.attendance")} · {t("nav.fees")} · {t("nav.schemes")}
        </p>
      </CardContent>
    </Card>
  )
}
