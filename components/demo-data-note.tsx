/**
 * Shown on a durable-module page when the Go backbone isn't answering — either it's not configured (no
 * PLATFORM_URL) or it's momentarily unreachable (free-tier cold start / mid-redeploy). Representative sample data
 * is rendered so the module stays fully viewable, with this clear, non-alarming note instead of a blocking error.
 * Once the backbone responds, the page shows live data automatically (just reload).
 */
export function DemoDataNote() {
  return (
    <div
      role="status"
      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <strong>Sample data</strong> — the live backbone isn&rsquo;t responding right now (it may be configured-off, or
      waking from sleep / redeploying). You can browse the full module; actions won&rsquo;t persist until it&rsquo;s
      live. If you just deployed or it was idle, <strong>reload in a minute</strong> to get live data.
    </div>
  )
}
