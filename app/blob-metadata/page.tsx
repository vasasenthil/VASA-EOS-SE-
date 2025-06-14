"use client"

import { useActionState, useEffect } from "react"
import { getBlobMetadataAction, type GetBlobMetadataState } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

const initialState: GetBlobMetadataState = {
  metadata: undefined,
  error: undefined,
  pathname: "",
}

export default function BlobMetadataPage() {
  const [state, formAction, isPending] = useActionState(getBlobMetadataAction, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state?.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      })
    } else if (state?.metadata && state.metadata.pathname === state.pathname) {
      // Ensure message is for current request
      toast({
        title: "Success",
        description: `Metadata fetched for ${state.metadata.pathname}`,
      })
    }
  }, [state, toast])

  return (
    <div className="flex justify-center items-start min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Get Blob Metadata</CardTitle>
          <CardDescription>
            Enter the pathname of a blob to retrieve its metadata. This uses the `head` function from `@vercel/blob` and
            requires the `BLOB_READ_WRITE_TOKEN` environment variable to be set on the server.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pathname">Blob Pathname</Label>
              <Input
                id="pathname"
                name="pathname"
                placeholder="e.g., articles/my-article.txt or uploads/image.png"
                required
                defaultValue={state?.pathname}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Fetching..." : "Get Metadata"}
            </Button>
          </CardFooter>
        </form>

        {state?.metadata && state.metadata.pathname === state.pathname && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Blob Metadata Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm break-all">
              <p>
                <strong>Pathname:</strong> {state.metadata.pathname}
              </p>
              <p>
                <strong>URL:</strong>{" "}
                <a
                  href={state.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {state.metadata.url}
                </a>
              </p>
              <p>
                <strong>Size:</strong> {state.metadata.size} bytes
              </p>
              <p>
                <strong>Uploaded At:</strong> {new Date(state.metadata.uploadedAt).toLocaleString()}
              </p>
              {state.metadata.contentType && (
                <p>
                  <strong>Content Type:</strong> {state.metadata.contentType}
                </p>
              )}
              {state.metadata.contentDisposition && (
                <p>
                  <strong>Content Disposition:</strong> {state.metadata.contentDisposition}
                </p>
              )}
              {state.metadata.cacheControl && (
                <p>
                  <strong>Cache Control:</strong> {state.metadata.cacheControl}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </Card>
    </div>
  )
}
