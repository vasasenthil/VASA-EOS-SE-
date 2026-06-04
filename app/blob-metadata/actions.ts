"use server"

import { head } from "@vercel/blob"
import type { HeadBlobResult as BlobResult } from "@vercel/blob"

export interface GetBlobMetadataState {
  metadata?: BlobResult | null
  error?: string
  pathname?: string
}

export async function getBlobMetadataAction(
  prevState: GetBlobMetadataState,
  formData: FormData,
): Promise<GetBlobMetadataState> {
  const pathname = formData.get("pathname") as string

  if (!pathname || pathname.trim() === "") {
    return { error: "Pathname is required.", pathname }
  }

  // Use the BLOB_READ_WRITE_TOKEN from your environment variables
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN

  if (!blobToken) {
    console.error("BLOB_READ_WRITE_TOKEN environment variable is not set.")
    return {
      error:
        "Server configuration error: Blob token not found. Please ensure BLOB_READ_WRITE_TOKEN is set in your Vercel project environment variables.",
      pathname,
    }
  }

  try {
    const blobMetadata = await head(pathname, {
      token: blobToken,
    })

    if (!blobMetadata) {
      return { error: `Blob not found at pathname: ${pathname}`, pathname }
    }

    // Successfully fetched metadata
    return { metadata: blobMetadata, pathname }
  } catch (error: any) {
    console.error("Error fetching blob metadata:", error)
    // Handle cases where the API might throw an error for other reasons
    // (e.g., network issues, invalid token format though `head` usually returns null for not found)
    return { error: `Failed to fetch metadata: ${error.message}`, pathname }
  }
}
