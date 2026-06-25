import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, ExternalLink, Music, Video, FileText, Link2 } from "lucide-react"
import { getLessonPlanAction } from "../actions"
import { DeleteLessonPlanButton } from "../components/delete-lessonplan-button"
import { durationMinutes, type ResourceKind } from "@/lib/lessonplans"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

const KIND_ICON: Record<ResourceKind, typeof Music> = { Audio: Music, Video: Video, Document: FileText, Link: Link2 }

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-sm text-muted-foreground">—</span>
  return <div className="flex flex-wrap gap-1">{items.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}</div>
}

export default async function LessonPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getLessonPlanAction(id)

  if (!p) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Lesson plan not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this lesson plan. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/lesson-plans"><ArrowLeft className="mr-2 h-4 w-4" />Back to lesson plans</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{p.topic}</PageHeaderHeading>
        <PageHeaderDescription>{p.subject} · Class {p.classLevel}-{p.section} · {p.lessonType} · {safeDate(p.date, "dd MMM yyyy")} · Period {p.period} ({durationMinutes(p.startTime, p.endTime)} min)</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/lesson-plans/${p.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteLessonPlanButton id={p.id} topic={p.topic} redirectTo="/lesson-plans" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/lesson-plans"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{p.status}</Badge>
        <Badge variant="secondary">{p.teacher}</Badge>
        <Badge variant="secondary">{p.startTime}–{p.endTime}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Lesson</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><dt className="text-muted-foreground">Objectives</dt><dd className="mt-1">{p.objectives || "—"}</dd></div>
            <div><dt className="text-muted-foreground">Previously studied</dt><dd className="mt-1"><Chips items={p.previousTopics} /></dd></div>
            <div><dt className="text-muted-foreground">Further / upcoming</dt><dd className="mt-1"><Chips items={p.furtherTopics} /></dd></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">For students</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><dt className="text-muted-foreground">Must bring</dt><dd className="mt-1"><Chips items={p.materialsToBring} /></dd></div>
            <div><dt className="text-muted-foreground">Homework</dt><dd className="mt-1">{p.homework || "—"}</dd></div>
            {p.lessonPlannerLink ? (
              <div><dt className="text-muted-foreground">Lesson planner</dt>
                <dd className="mt-1"><a href={p.lessonPlannerLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline">Open planner <ExternalLink className="h-3 w-3" /></a></dd>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Class notes</CardTitle></CardHeader>
        <CardContent>
          {p.classNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No class notes attached.</p>
          ) : (
            <ul className="space-y-2">
              {p.classNotes.map((n, i) => {
                const Icon = KIND_ICON[n.kind] ?? Link2
                return (
                  <li key={i} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{n.kind}</Badge>
                    <span className="font-medium">{n.title}</span>
                    <a href={n.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-primary underline">Open <ExternalLink className="h-3 w-3" /></a>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </Shell>
  )
}
