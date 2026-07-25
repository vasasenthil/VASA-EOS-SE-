import { listDeadLetters } from "@/lib/events/dead-letters"

export default async function DeadLettersPage() {
  const rows = await listDeadLetters({ status: "open" })
  return <main className="space-y-6 p-6">
    <div><h1 className="text-2xl font-semibold">Outbox Dead Letters</h1><p className="text-sm text-muted-foreground">Inspect poison events and use the admin API to retry or discard them.</p></div>
    <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">Event</th><th className="p-3 text-left">Aggregate</th><th className="p-3 text-left">Retries</th><th className="p-3 text-left">Error</th><th className="p-3 text-left">Admin actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b"><td className="p-3 font-mono">{row.event_type}</td><td className="p-3">{row.aggregate_type}:{row.aggregate_id}</td><td className="p-3">{row.retry_count}</td><td className="p-3">{row.last_error}</td><td className="p-3 font-mono text-xs">POST /api/admin/dead-letters/{row.id}/retry<br/>POST /api/admin/dead-letters/{row.id}/discard</td></tr>)}</tbody></table></div>
  </main>
}
