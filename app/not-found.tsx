import Link from "next/link"
import { FileQuestion, Home } from "lucide-react"
import { Shell } from "@/components/shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <Shell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileQuestion className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <CardTitle className="text-2xl">Page not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or may have moved. Press{" "}
              <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">⌘K</kbd> to search, or head back to the
              dashboard.
            </p>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
