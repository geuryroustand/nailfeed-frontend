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

    // Get media files from form data for upload after post creation
    const mediaFiles: File[] = []

    // Extract actual File objects from formData
    const fileKeys = Array.from(formData.keys()).filter(key => key.startsWith('mediaFiles'))
    for (const key of fileKeys) {
      const file = formData.get(key) as File
      if (file && file instanceof File) {
        mediaFiles.push(file)
      }
    }

    const hasMediaFiles = mediaFiles.length > 0

    console.log("[v1] Optimized Server Action: Creating post with data:", {
      title,
      contentType,
      hasMediaFiles,
      mediaCount: mediaFiles.length,
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

    // STEP 2: Upload media files using Strapi's native upload endpoint with relations
    let uploadedMedia: any[] = []
    if (hasMediaFiles) {
      console.log("[v1] Optimized Server Action: Uploading media files using native Strapi endpoint")

      try {
        const uploadFormData = new FormData()

        // Add files to upload
        mediaFiles.forEach((file, index) => {
          uploadFormData.append("files", file, `${index}-${file.name}`)
        })

        // Strapi v5 relation parameters for automatic media attachment
        uploadFormData.append("ref", "api::post.post")
        uploadFormData.append("refId", postDocumentId) // Use documentId for Strapi v5
        uploadFormData.append("field", "media")

        console.log("[v1] Optimized Server Action: Upload relation parameters:", {
          ref: "api::post.post",
          refId: postDocumentId,
          field: "media"
        })

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
          console.error("[v1] Optimized Server Action: Media upload failed:", errorText)
          // Don't fail the entire operation - post is already created
          console.log("[v1] Optimized Server Action: Continuing without media - post created successfully")
        } else {
          uploadedMedia = await uploadResponse.json()
          console.log("[v1] Optimized Server Action: Media uploaded successfully:", uploadedMedia.length)
        }

      } catch (error) {
        console.error("[v1] Optimized Server Action: Media upload error:", error)
        // Post is already created, so we don't fail the entire operation
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
          totalFiles: mediaFiles.length,
          uploadedFiles: uploadedMedia.length,
          uploadSuccess: uploadedMedia.length === mediaFiles.length,
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
