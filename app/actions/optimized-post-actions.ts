"use server"

import { revalidateTag } from "next/cache"
import { validateSession } from "@/lib/auth/session"
import { CACHE_TAGS } from "@/lib/cache-tags"
import { uploadMediaToPost, validateFiles, uploadWithRetry } from "@/lib/services/optimized-media-upload-server"
import type { ContentType, GalleryLayout } from "@/lib/services/post-service"
import type { BackgroundType } from "@/components/post-background-selector"
import { API_URL } from "@/lib/config"

/**
 * Optimized post creation using Strapi v5 native upload approach
 * 1. Create post with basic data only
 * 2. Upload media with direct relations using ref/refId/field
 * 3. Let Strapi handle all media relations automatically
 */
export async function createOptimizedPost(formData: FormData) {
  const startTime = Date.now()

  try {
    console.log("[v1] Optimized Server Action: Starting post creation")

    const { user: authenticatedUser, session } = await validateSession()

    if (!authenticatedUser || !session?.strapiJWT) {
      return {
        success: false,
        error: "Authentication required. Please log in to create posts.",
      }
    }

    const token = session.strapiJWT
    const userDocumentId = authenticatedUser.documentId || String(authenticatedUser.id)

    // Extract data from formData
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const contentType = (formData.get("contentType") as ContentType) || "text"
    const galleryLayout = (formData.get("galleryLayout") as GalleryLayout) || "grid"
    const backgroundJson = formData.get("background") as string
    const tagsJson = formData.get("tags") as string

    // Parse JSON data
    const background = backgroundJson
      ? (JSON.parse(backgroundJson) as BackgroundType)
      : undefined

    let tags: string[] = []
    if (tagsJson) {
      try {
        const parsedTags = JSON.parse(tagsJson)
        if (Array.isArray(parsedTags)) {
          tags = parsedTags
        }
      } catch (e) {
        console.error("[v1] Optimized Server Action: Error parsing tags JSON:", e)
      }
    }

    // Get uploaded files data passed from client (already uploaded)
    const uploadedFilesJson = formData.get("uploadedFiles") as string
    let uploadedFiles: any[] = []

    if (uploadedFilesJson) {
      try {
        uploadedFiles = JSON.parse(uploadedFilesJson)
        console.log("[v1] Optimized Server Action: Using pre-uploaded files:", uploadedFiles.length)
      } catch (error) {
        console.error("[v1] Optimized Server Action: Error parsing uploaded files:", error)
        return {
          success: false,
          error: "Invalid uploaded files data",
        }
      }
    }

    const hasMediaFiles = uploadedFiles.length > 0

    console.log("[v1] Optimized Server Action: Creating post with data:", {
      title,
      contentType,
      hasMediaFiles,
      mediaCount: uploadedFiles.length,
    })

    const apiUrl = process.env.API_URL
    if (!apiUrl) {
      console.error("[v1] Optimized Server Action: API_URL environment variable is not set")
      return {
        success: false,
        error: "Server configuration error: API_URL is not defined.",
      }
    }

    // STEP 1: Create post with basic data only (NO media relations)
    const postData = {
      data: {
        title: title || "",
        description,
        contentType,
        background,
        galleryLayout,
        user: { connect: [userDocumentId] },
        tags: tags,
        postStatus: "published",
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        viewsCount: 0,
        shareCount: 0,
        featured: false,
        isReported: false,
      },
    }

    console.log("[v1] Optimized Server Action: Creating post with basic data")

    const postUrl = `${apiUrl}/api/posts?populate=user.profileImage`
    const postResponse = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
      cache: "no-store",
    })

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      console.error("[v1] Optimized Server Action: Post creation failed:", errorText)
      throw new Error(`Post creation failed with status ${postResponse.status}: ${errorText}`)
    }

    const postResult = await postResponse.json()
    const postDocumentId = postResult.data.documentId
    const postId = postResult.data.id

    console.log("[v1] Optimized Server Action: Post created successfully:", {
      id: postId,
      documentId: postDocumentId,
    })

    // STEP 2: Associate pre-uploaded media with post (if any)
    let uploadedMedia: any[] = []
    if (hasMediaFiles) {
      console.log("[v1] Optimized Server Action: Associating pre-uploaded media with post")

      try {
        // Use the pre-uploaded files data
        uploadedMedia = uploadedFiles

        console.log("[v1] Optimized Server Action: Using pre-uploaded media:", {
          uploadedCount: uploadedMedia.length,
          files: uploadedMedia.map(f => ({ id: f.id, name: f.name, url: f.url }))
        })

        // Update post to include media relations
        const updatePostData = {
          data: {
            media: uploadedFiles.map((file: any) => file.id), // Send only IDs to Strapi
          },
        }

        const updatePostUrl = `${apiUrl}/api/posts/${postDocumentId}`
        const updateResponse = await fetch(updatePostUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatePostData),
        })

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text()
          console.warn("[v1] Optimized Server Action: Media association failed:", errorText)
          // Continue without failing - post is still created
        } else {
          console.log("[v1] Optimized Server Action: Media associated successfully")
        }

      } catch (error) {
        console.error("[v1] Optimized Server Action: Media association failed:", error)
        // Post is already created, so we don't fail the entire operation
        console.log("[v1] Optimized Server Action: Continuing without media association - post created successfully")
      }
    }

    // STEP 3: Fetch complete post data with media relations
    let finalPostData = postResult.data
    if (hasMediaFiles) { // Always fetch if we had media files, regardless of upload response
      try {
        const completePostUrl = `${apiUrl}/api/posts/${postDocumentId}?populate[user][populate]=profileImage&populate=media&populate=tags`
        const completePostResponse = await fetch(completePostUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (completePostResponse.ok) {
          const completePostResult = await completePostResponse.json()
          finalPostData = completePostResult.data
        }
      } catch (error) {
        console.error("[v1] Optimized Server Action: Failed to fetch complete post data:", error)
        // Continue with basic post data
      }
    }

    const endTime = Date.now()
    console.log(`[v1] Optimized Server Action: Post creation completed in ${endTime - startTime}ms`)

    revalidateTag(CACHE_TAGS.posts)
    if (postDocumentId) {
      revalidateTag(CACHE_TAGS.post(postDocumentId))
    }
    if (postId) {
      revalidateTag(CACHE_TAGS.post(postId))
    }


    // Return optimized response
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
        tags,
        user: finalPostData.user || {
          id: authenticatedUser.id,
          documentId: userDocumentId,
          username: authenticatedUser.username,
          displayName: authenticatedUser.displayName || authenticatedUser.username,
        },
        media: finalPostData.media || uploadedMedia || [], // Use populated data first, fallback to uploaded data
        mediaItems: [], // Legacy field for backward compatibility
        createdAt: finalPostData.createdAt || finalPostData.publishedAt || new Date().toISOString(),
        uploadStats: {
          totalFiles: uploadedFiles.length,
          uploadedFiles: uploadedMedia.length,
          uploadTime: uploadedMedia.length > 0 ? endTime - startTime : 0,
        },
      },
    }
  } catch (error) {
    console.error("[v1] Optimized Server Action: Error in createOptimizedPost:", error)
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "An unknown error occurred during post creation. Please try again.",
    }
  }
}

/**
 * Add media to existing post
 * Useful for uploading additional media to already created posts
 */
export async function addMediaToPost(postDocumentId: string, files: File[]) {
  try {
    const { session } = await validateSession()
    if (!session?.strapiJWT) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Get the numeric ID from documentId for Strapi v5 upload relations
    const postResponse = await fetch(`${API_URL}/api/posts/${postDocumentId}`, {
      headers: {
        "Authorization": `Bearer ${session.strapiJWT}`,
      },
    })

    if (!postResponse.ok) {
      return {
        success: false,
        error: "Post not found",
      }
    }

    const postData = await postResponse.json()
    const postId = postData.data.id

    const { validFiles, errors } = await validateFiles(files)

    if (errors.length > 0) {
      return {
        success: false,
        error: `File validation failed: ${errors.join(", ")}`,
      }
    }

    if (validFiles.length === 0) {
      return {
        success: false,
        error: "No valid files to upload",
      }
    }

    const uploadedMedia = await uploadWithRetry(
      () => uploadMediaToPost(validFiles, String(postId), session.strapiJWT)
    )

    revalidateTag(CACHE_TAGS.posts)
    revalidateTag(CACHE_TAGS.post(postDocumentId))
    revalidateTag(CACHE_TAGS.post(postId))

    return {
      success: true,
      uploadedMedia,
      uploadedCount: uploadedMedia.length,
    }
  } catch (error) {
    console.error("addMediaToPost error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}





