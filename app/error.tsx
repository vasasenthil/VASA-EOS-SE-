"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCw } from "lucide-react"
import { Shell } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production this should go to the error-tracking pipeline.
    console.error(error)
  }, [error])

  return (
    <Shell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
            </div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred while rendering this page. You can retry, or return to the dashboard.
            </p>
            {error.digest ? (
              <p className="text-xs text-muted-foreground">
                Reference: <span className="font-mono">{error.digest}</span>
              </p>
            ) : null}
            <div className="flex items-center justify-center gap-2">
              <Button onClick={reset}>
                <RotateCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
