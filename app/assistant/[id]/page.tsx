import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import { getArticleAction } from "../actions"
import { DeleteArticleButton } from "../components/article-actions"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await getArticleAction(id)

  if (!a) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Article not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this article. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/assistant"><ArrowLeft className="mr-2 h-4 w-4" />Back to assistant</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{a.title}</PageHeaderHeading>
        <PageHeaderDescription>{a.category} · {a.source}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/assistant/${a.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteArticleButton id={a.id} title={a.title} redirectTo="/assistant" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/assistant"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge variant="outline">{a.category}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Content</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{a.content}</p>
          <div className="flex justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>Source: <strong>{a.source}</strong></span>
            <span>Updated {safeDate(a.updatedAt, "dd MMM yyyy")}</span>
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}
