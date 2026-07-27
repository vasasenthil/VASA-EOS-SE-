import { Suspense } from "react"
import { getTeacherDashboardData, type TeacherDashboardData } from "../actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Users, BookOpen, Calendar, Bell } from "lucide-react"

async function TeacherDashboardContent() {
  let data: TeacherDashboardData

  try {
    data = await getTeacherDashboardData()
  } catch (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load dashboard data. Please try again."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-green-600">{data.attendance.present}</div>
              <div className="text-sm text-muted-foreground">Present</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{data.attendance.absent}</div>
              <div className="text-sm text-muted-foreground">Absent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{data.attendance.late}</div>
              <div className="text-sm text-muted-foreground">Late</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{data.attendance.percentage}%</div>
              <div className="text-sm text-muted-foreground">Attendance Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flagged Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Students at Risk ({data.flaggedStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.flaggedStudents.length === 0 ? (
            <p className="text-muted-foreground">No students currently flagged</p>
          ) : (
            <div className="space-y-2">
              {data.flaggedStudents.map((student) => (
                <div key={student.studentId} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="font-medium">{student.studentName}</div>
                    <div className="text-sm text-muted-foreground">{student.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{student.riskScore}%</div>
                    <div className="text-xs text-muted-foreground">Risk Score</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">{data.assignments.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{data.assignments.graded}</div>
              <div className="text-sm text-muted-foreground">Graded</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{data.assignments.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Timetable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.timetable.length === 0 ? (
            <p className="text-muted-foreground">No classes scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {data.timetable.map((slot) => (
                <div key={slot.period} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="font-medium">Period {slot.period}: {slot.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      Class {slot.class} • Room {slot.room}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {slot.startTime} - {slot.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.notices.length === 0 ? (
            <p className="text-muted-foreground">No recent notices</p>
          ) : (
            <div className="space-y-2">
              {data.notices.slice(0, 5).map((notice) => (
                <div key={notice.id} className="rounded border p-3">
                  <div className="flex items-start justify-between">
                    <div className="font-medium">{notice.title}</div>
                    <div className={`rounded px-2 py-1 text-xs ${
                      notice.priority === "high" ? "bg-red-100 text-red-800" :
                      notice.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {notice.priority}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{notice.date}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TeacherDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-8 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function TeacherDashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Teacher Dashboard</h1>
      <Suspense fallback={<TeacherDashboardSkeleton />}>
        <TeacherDashboardContent />
      </Suspense>
    </div>
  )
}
