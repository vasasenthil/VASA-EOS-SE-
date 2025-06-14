import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { BookMarked, Folder, Users, BarChart3 } from "lucide-react"

export default function SubjectInchargeDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Subject Incharge Dashboard"
        description="Manage curriculum, resources, and performance for your subject."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Curriculum Management</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Oversee & Refine</div>
            <p className="text-xs text-muted-foreground">Manage subject curriculum and suggest improvements.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Allocation</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View & Request</div>
            <p className="text-xs text-muted-foreground">Manage teaching aids and materials for the subject.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teacher Coordination</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Collaborate</div>
            <p className="text-xs text-muted-foreground">Coordinate with teachers of the subject.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Track & Analyze</div>
            <p className="text-xs text-muted-foreground">Monitor student achievements in the subject.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
