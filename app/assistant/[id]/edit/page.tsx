import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getArticleAction } from "../../actions"
import { ArticleForm } from "../../components/article-form"
import type { ArticleInput } from "@/lib/knowledgebase"

export const dynamic = "force-dynamic"

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await getArticleAction(id)

  if (!a) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Article not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/assistant"><ArrowLeft className="mr-2 h-4 w-4" />Back to assistant</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: ArticleInput = { title: a.title, category: a.category, content: a.content, source: a.source }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {a.title}</PageHeaderHeading>
        <PageHeaderDescription>Update the grounded fact or its source. The assistant re-grounds on the live canon. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/assistant/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to article</Link></Button></div>
      <ArticleForm id={id} initial={initial} />
    </Shell>
  )
}
