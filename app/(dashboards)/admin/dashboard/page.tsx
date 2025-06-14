import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header" // Assuming you have this component

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Admin Dashboard" description="Overview of system activities and management tools." />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage users, roles, and permissions.</p>
            {/* Add links or quick stats here */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Policy Oversight</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Review and manage educational policies.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Monitor system status and performance.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
