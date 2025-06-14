import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

export default function StudentDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Student Dashboard" description="Access your courses, assignments, and grades." />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View your current courses and materials.</p>
            {/* Add links or quick stats here */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Check upcoming assignments and submit your work.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View your grades and feedback.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
