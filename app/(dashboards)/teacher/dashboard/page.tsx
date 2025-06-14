import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

export default function TeacherDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Teacher Dashboard" description="Manage your courses, students, and assignments." />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Access and manage your courses.</p>
            {/* Add links or quick stats here */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View pending assignments and deadlines.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Track student performance and engagement.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
