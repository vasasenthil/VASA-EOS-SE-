import { offlineReadiness, OFFLINE_ROUTE_POLICIES } from "@/lib/offline/cache-policy"

export default function OfflinePage() {
  const status = offlineReadiness()
  return (
    <section className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Offline mode</h1>
      <p className="mt-3 text-muted-foreground">
        Core read-only school workflows are cached for low-bandwidth access. Writes remain online-only until the
        durable sync queue is enabled, so the platform does not pretend offline writes are safely persisted.
      </p>
      <dl className="mt-6 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-3">
        <div><dt className="text-sm text-muted-foreground">Cached routes</dt><dd className="text-2xl font-semibold">{status.routes}</dd></div>
        <div><dt className="text-sm text-muted-foreground">Fallback page</dt><dd className="text-2xl font-semibold">{status.hasFallback ? "Ready" : "Missing"}</dd></div>
        <div><dt className="text-sm text-muted-foreground">Offline writes</dt><dd className="text-2xl font-semibold">Online-only</dd></div>
      </dl>
      <ul className="mt-6 list-disc pl-6 text-sm text-muted-foreground">
        {OFFLINE_ROUTE_POLICIES.map((policy) => <li key={policy.route}>{policy.route} — {policy.strategy}</li>)}
      </ul>
    </section>
  )
}
