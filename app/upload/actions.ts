"use server"

import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"

export interface UploadState {
  message: string
  success: boolean
  url?: string
}

export async function uploadFile(prevState: UploadState, formData: FormData): Promise<UploadState> {
  const file = formData.get("file") as File

  if (!file || file.size === 0) {
    return { message: "Please select a file to upload.", success: false }
  }

  try {
    // The `put` function uploads the file to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true, // Prevents overwriting files with the same name
    })

    // Revalidate the path if you want to show the new data immediately
    revalidatePath("/")

    return {
      message: `Upload successful!`,
      success: true,
      url: blob.url,
    }
  } catch (error: any) {
    console.error("Blob upload error:", error)
    return { message: `Upload failed: ${error.message}`, success: false }
  }
}
