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
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{t("demo.heading")}</p>
        <p className="text-lg font-medium">{t("welcome")}</p>
        <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("nav.dashboard")}</div>
          <p>{t("nav.attendance")} · {t("nav.fees")} · {t("nav.schemes")} · {t("nav.students")} · {t("nav.staff")} · {t("nav.timetable")}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("status")}</div>
          <p>{t("action.save")} · {t("action.cancel")} · {t("action.search")} · {t("action.edit")} · {t("action.delete")} · {t("action.view")}</p>
        </div>
      </CardContent>
    </Card>
  )
}
