/**
 * Shown on a durable-module page when the Go backbone isn't connected (no PLATFORM_URL) but representative demo
 * data is being displayed so the module is fully viewable. Makes the "this is demo data" state explicit and
 * non-alarming, instead of a blocking error. Deploy the backbone (deploy/backbone) to make the module persist.
 */
export function DemoDataNote() {
  return (
    <div
      role="status"
      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <strong>Demo data</strong> — representative records are shown because the durable backbone isn&rsquo;t connected
      on this deployment. You can browse the full module; actions won&rsquo;t persist until the backbone is deployed
      (<code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">deploy/backbone</code>).
    </div>
  )
}
