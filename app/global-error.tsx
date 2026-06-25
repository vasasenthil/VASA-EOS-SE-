"use client"

import { useEffect } from "react"

// Catches errors thrown in the root layout itself. It replaces the entire document,
// so it must render <html>/<body> and cannot rely on app chrome or global CSS —
// hence inline styles.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
            A critical error occurred. Please try again.
          </p>
          {error.digest ? (
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Reference: {error.digest}</p>
          ) : null}
          <button
            onClick={reset}
            style={{
              cursor: "pointer",
              borderRadius: 8,
              border: "1px solid #0f172a",
              background: "#0f172a",
              color: "#fff",
              padding: "8px 16px",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
