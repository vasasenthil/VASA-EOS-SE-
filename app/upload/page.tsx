"use client"

import { useActionState } from "react"
import { type UploadState, uploadFile } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const initialState: UploadState = {
  message: "",
  success: false,
}

export default function BlobUploadPage() {
  const [state, formAction, isPending] = useActionState(uploadFile, initialState)

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload to Vercel Blob</CardTitle>
          <CardDescription>Select a file and upload it to your Blob store.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="file">File</Label>
              <Input id="file" name="file" type="file" required />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </form>
          {state?.message && (
            <div
              className={`mt-4 p-3 rounded-md text-sm ${
                state.success
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              <p>{state.message}</p>
              {state.success && state.url && (
                <p className="mt-2 break-all">
                  URL:{" "}
                  <a
                    href={state.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline hover:text-blue-500"
                  >
                    {state.url}
                  </a>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
