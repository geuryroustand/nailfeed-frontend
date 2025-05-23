"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { ContentType, GalleryLayout } from "@/lib/services/post-service"
import type { BackgroundType } from "@/components/post-background-selector"

export async function createPost(formData: FormData) {
  try {
    console.log("Server Action: Starting post creation process")

    // Check if user is authenticated - try multiple sources
    let token = cookies().get("jwt")?.value || cookies().get("authToken")?.value
    let userId = cookies().get("userId")?.value
    let userDocumentId: string | null = null

    // If no token in cookies, try to get it from the form data
    if (!token) {
      token = formData.get("jwt") as string
      console.log("Server Action: Using token from form data:", token ? "Token found" : "No token")

      // Store the token in cookies for future requests
      if (token) {
        cookies().set("jwt", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 7 * 24 * 60 * 60, // 7 days
        })
        cookies().set("authToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 7 * 24 * 60 * 60, // 7 days
        })
      }
    }

    // Try to get the user documentId from form data (preferred)
    userDocumentId = formData.get("userDocumentId") as string
    if (!userDocumentId) {
      // If no documentId, try to get the regular userId
      if (!userId) {
        userId = formData.get("userId") as string
      }
    }

    // Try to extract documentId from the full user object if available
    const userObjectJson = formData.get("userObject") as string
    if (userObjectJson) {
      try {
        const userObject = JSON.parse(userObjectJson)

        if (userObject && userObject.documentId && !userDocumentId) {
          userDocumentId = userObject.documentId
          console.log("Server Action: Extracted user document ID from user object:", userDocumentId)
        } else if (userObject && userObject.id && !userId) {
          userId = userObject.id.toString()
          console.log("Server Action: Extracted user ID from user object:", userId)
        }
      } catch (e) {
        console.error("Server Action: Error parsing user object:", e)
      }
    }

    // If no token is found, return an error - only authenticated users can post
    if (!token) {
      console.error("Server Action: No authentication token found")
      return {
        success: false,
        error: "Authentication required. Please log in to create posts.",
      }
    }

    // If no user ID is found, return an error
    if (!userDocumentId && !userId) {
      console.error("Server Action: No user ID found")
      return {
        success: false,
        error: "User identification required. Please log in again.",
      }
    }

    console.log("Server Action: Authentication verified, proceeding with post creation")
    console.log(`Server Action: Using user ID: ${userId || userDocumentId}`)

    // Extract data from formData
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const contentType = (formData.get("contentType") as ContentType) || "text"
    const galleryLayout = (formData.get("galleryLayout") as GalleryLayout) || "grid"
    const backgroundJson = formData.get("background") as string
    const tagsJson = formData.get("tags") as string

    // Parse JSON data
    const background = backgroundJson ? (JSON.parse(backgroundJson) as BackgroundType) : undefined

    // Check if tagsJson exists and is not empty before parsing
    let tags: string[] = []
    if (tagsJson) {
      try {
        const parsedTags = JSON.parse(tagsJson)
        if (Array.isArray(parsedTags)) {
          tags = parsedTags
        }
      } catch (e) {
        console.error("Server Action: Error parsing tags JSON:", e)
      }
    }

    console.log("Server Action: Tags from form data:", tags)

    // Prepare API URL and headers
    const apiUrl = process.env.API_URL || "https://nailfeed-backend-production.up.railway.app"
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    }

    // STEP 1: Upload media files first if they exist
    let uploadedMediaItems: any[] = []
    const mediaFilesEntries = formData.getAll("mediaFiles")
    const hasMediaFiles = mediaFilesEntries.length > 0

    if (hasMediaFiles) {
      console.log("Server Action: Uploading media files first...")

      try {
        // Upload files to Strapi upload endpoint
        const uploadFormData = new FormData()

        for (let i = 0; i < mediaFilesEntries.length; i++) {
          const file = mediaFilesEntries[i] as File
          if (file instanceof File) {
            uploadFormData.append("files", file, `${i}-${file.name}`)
          }
        }

        const uploadUrl = `${apiUrl}/api/upload`
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          throw new Error(`File upload failed with status ${uploadResponse.status}: ${errorText}`)
        }

        const uploadedFiles = await uploadResponse.json()
        console.log("Server Action: Files uploaded successfully:", uploadedFiles)

        // Create mediaItems array with uploaded file IDs
        uploadedMediaItems = uploadedFiles.map((file: any, index: number) => ({
          file: file.id, // Use the uploaded file ID
          type: file.mime.startsWith("image/") ? "image" : "video",
          order: index + 1,
        }))

        console.log("Server Action: Prepared media items:", uploadedMediaItems)
      } catch (error) {
        console.error("Server Action: File upload failed:", error)
        return {
          success: false,
          error: `File upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }
      }
    }

    // STEP 2: Create the post with uploaded media items
    const postData: any = {
      data: {
        title: title || "",
        description,
        contentType,
        background,
        galleryLayout,
        user: {
          connect: userDocumentId ? [userDocumentId] : userId ? [userId.toString()] : [],
        },
        tags: tags,
        mediaItems: uploadedMediaItems, // Include uploaded media items directly
      },
    }

    console.log("Server Action: Creating post with data:", JSON.stringify(postData, null, 2))

    const postEndpoint = "/api/posts"
    const postUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${postEndpoint.startsWith("/") ? postEndpoint.substring(1) : postEndpoint}`

    const postResponse = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
      cache: "no-store",
    })

    // Log the response status for debugging
    console.log(`Server Action: Post creation response status: ${postResponse.status}`)

    let responseText
    try {
      responseText = await postResponse.text()
      console.log("Server Action: Raw post creation response:", responseText)
    } catch (e) {
      console.error("Server Action: Failed to get response text:", e)
    }

    if (!postResponse.ok) {
      console.error(`Server Action: Post creation failed with status ${postResponse.status}:`, responseText)
      throw new Error(`Post creation failed with status ${postResponse.status}: ${responseText}`)
    }

    let result
    try {
      result = JSON.parse(responseText || "{}")
      console.log("Server Action: Post creation successful:", result)
    } catch (e) {
      console.error("Server Action: Failed to parse response JSON:", e)
      throw new Error("Failed to parse server response")
    }

    const postId = result.data.id
    const postDocumentId = result.data.documentId || `doc-${postId}`

    // Ensure proper cache invalidation
    revalidatePath("/", "layout")
    revalidatePath("/profile", "layout")
    revalidatePath("/explore", "layout")
    revalidatePath(`/post/${postId}`, "layout")

    console.log("Server Action: Post creation process completed successfully")
    return {
      success: true,
      post: {
        id: postId,
        documentId: postDocumentId,
        title: title || "",
        description,
        contentType,
        background,
        galleryLayout,
        mediaItems: uploadedMediaItems,
        tags,
      },
    }
  } catch (error) {
    console.error("Server Action: Error in createPost:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred during post creation. Please try again.",
    }
  }
}
