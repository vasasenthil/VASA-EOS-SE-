import {
  ShieldCheck,
  Clock,
  User,
  Filter,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/page-header"
import { getAuditLogs } from "@/lib/audit/log"

// Colour-code different action types
const ACTION_COLORS: Record<string, string> = {
  CREATE:  "bg-green-100 text-green-800",
  UPDATE:  "bg-blue-100 text-blue-800",
  DELETE:  "bg-red-100 text-red-800",
  APPROVE: "bg-purple-100 text-purple-800",
  REJECT:  "bg-orange-100 text-orange-800",
  LOGIN:   "bg-slate-100 text-slate-700",
}

function actionBadge(action: string) {
  const cls = ACTION_COLORS[action.toUpperCase()] ?? "bg-slate-100 text-slate-700"
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {action}
    </span>
  )
}

// Fallback static mock data — shown when DB has no data yet
const MOCK_LOGS = [
  { id: "1", user_id: "admin-001", action: "CREATE", resource: "policy", resource_id: "pol-45", changes: null, created_at: "2026-03-30T09:12:00Z" },
  { id: "2", user_id: "admin-001", action: "APPROVE", resource: "policy", resource_id: "pol-45", changes: null, created_at: "2026-03-30T11:34:00Z" },
  { id: "3", user_id: "admin-002", action: "UPDATE", resource: "user", resource_id: "usr-112", changes: { before: { role: "TEACHER" }, after: { role: "PRINCIPAL" } }, created_at: "2026-03-29T14:20:00Z" },
  { id: "4", user_id: "admin-001", action: "CREATE", resource: "milestone", resource_id: "ms-22", changes: null, created_at: "2026-03-28T08:05:00Z" },
  { id: "5", user_id: "inst-head-01", action: "UPDATE", resource: "ou", resource_id: "ou-7", changes: { before: { name: "Block A" }, after: { name: "Block A — Revised" } }, created_at: "2026-03-27T16:45:00Z" },
  { id: "6", user_id: "admin-002", action: "DELETE", resource: "user", resource_id: "usr-089", changes: null, created_at: "2026-03-26T10:00:00Z" },
  { id: "7", user_id: "admin-001", action: "REJECT", resource: "policy", resource_id: "pol-41", changes: null, created_at: "2026-03-25T13:22:00Z" },
  { id: "8", user_id: "teacher-044", action: "UPDATE", resource: "lesson_plan", resource_id: "lp-301", changes: null, created_at: "2026-03-24T09:10:00Z" },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const RESOURCE_COUNTS: Record<string, number> = {}
for (const log of MOCK_LOGS) {
  RESOURCE_COUNTS[log.resource] = (RESOURCE_COUNTS[log.resource] ?? 0) + 1
}

export default async function AuditLogPage() {
  const logs = await getAuditLogs({ limit: 200 })
  const displayLogs = logs.length > 0 ? logs : MOCK_LOGS

  const actionCounts: Record<string, number> = {}
  for (const l of displayLogs) {
    actionCounts[l.action] = (actionCounts[l.action] ?? 0) + 1
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Audit Log</PageHeaderHeading>
          <PageHeaderDescription>
            System-wide record of all create, update, delete, approve, and reject actions
          </PageHeaderDescription>
        </div>
      </PageHeader>

      {/* Action Count Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(ACTION_COLORS).map(([action, cls]) => (
          <Card key={action}>
            <CardContent className="pt-4 text-center">
              <p className={`text-lg font-bold ${cls.split(" ")[1]}`}>
                {actionCounts[action] ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{action}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Showing {displayLogs.length} most recent entries
            {logs.length === 0 && " (sample data — connect Supabase to see live logs)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="font-mono">{log.user_id.slice(0, 12)}…</span>
                    </span>
                  </TableCell>
                  <TableCell>{actionBadge(log.action)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {log.resource}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.resource_id}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    {log.changes ? (
                      <code className="text-xs bg-slate-100 rounded px-1 py-0.5 block truncate">
                        {JSON.stringify(log.changes)}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
