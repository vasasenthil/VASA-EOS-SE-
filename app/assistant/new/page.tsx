import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ArticleForm } from "../components/article-form"

export default function NewArticlePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Knowledge Article</PageHeaderHeading>
        <PageHeaderDescription>Add a grounded fact to the canon — title, category, content and a citable source. The assistant may then quote and cite it.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/assistant"><ArrowLeft className="mr-2 h-4 w-4" />Back to assistant</Link></Button></div>
      <ArticleForm />
    </Shell>
  )
}
