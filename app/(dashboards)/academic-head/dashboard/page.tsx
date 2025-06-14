import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { BookMarked, ClipboardList, GraduationCap, Target, BarChart3 } from "lucide-react"

export default function AcademicHeadDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Academic Head Dashboard"
        description="Oversee curriculum, assessments, and academic planning."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Curriculum Development</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Lead & Innovate</div>
            <p className="text-xs text-muted-foreground">Guide the development and review of curricula.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessment & Evaluation</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Define & Monitor</div>
            <p className="text-xs text-muted-foreground">Set assessment policies and analyze results.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teacher Development</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Support & Grow</div>
            <p className="text-xs text-muted-foreground">Oversee professional development for teachers.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Planning</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Strategize</div>
            <p className="text-xs text-muted-foreground">Plan timetables and resource allocation.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Analyze Data</div>
            <p className="text-xs text-muted-foreground">View overall and departmental academic reports.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
