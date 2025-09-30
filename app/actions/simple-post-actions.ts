"use server"

import { validateSession } from "@/lib/auth/session"
import type { ContentType, GalleryLayout } from "@/lib/services/post-service"
import type { BackgroundType } from "@/components/post-background-selector"

/**
 * Create post following optimized backend flow:
 * 1. Create post with basic data only (no media)
 * 2. Return post data for frontend to upload media with refs
 */
export async function createPostBasic(formData: FormData) {
  try {
    console.log("[SimplePost] Starting post creation")

    // Validate authentication
    const { user: authenticatedUser, session } = await validateSession()

    if (!authenticatedUser || !session?.strapiJWT) {
      return {
        success: false,
        error: "Authentication required. Please log in to create posts.",
      }
    }

    const token = session.strapiJWT
    const userDocumentId = authenticatedUser.documentId || String(authenticatedUser.id)

    // Extract post data from form
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const contentType = (formData.get("contentType") as ContentType) || "text"
    const galleryLayout = (formData.get("galleryLayout") as GalleryLayout) || "grid"
    const backgroundJson = formData.get("background") as string
    const tagsJson = formData.get("tags") as string

    // Parse JSON fields
    const background = backgroundJson ? JSON.parse(backgroundJson) as BackgroundType : undefined
    let tags: string[] = []
    if (tagsJson) {
      try {
        const parsedTags = JSON.parse(tagsJson)
        if (Array.isArray(parsedTags)) {
          tags = parsedTags
        }
      } catch (e) {
        console.error("[SimplePost] Error parsing tags:", e)
      }
    }

    // Note: Media files are NOT included in initial post creation
    // They will be uploaded separately with post references

    const apiUrl = process.env.API_URL
    if (!apiUrl) {
      return {
        success: false,
        error: "Server configuration error: API_URL not defined",
      }
    }

    // Create post with basic data only (NO media)
    const postData = {
      data: {
        title: title || "",
        description,
        contentType,
        background,
        galleryLayout,
        user: { connect: [userDocumentId] },
        tags,
        // NO media field - will be added later via upload
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

    console.log("[SimplePost] Creating post with basic data:", {
      title,
      contentType,
      userDocumentId
    })

    // Create post with populated user and media data
    const postUrl = `${apiUrl}/api/posts?populate[user][populate]=profileImage&populate=media`
    const postResponse = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    })

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      console.error("[SimplePost] Post creation failed:", errorText)
      throw new Error(`Post creation failed with status ${postResponse.status}: ${errorText}`)
    }

    const postResult = await postResponse.json()
    const createdPost = postResult.data

    console.log("[SimplePost] Post created successfully:", {
      id: createdPost.id,
      documentId: createdPost.documentId,
      status: "ready for media upload"
    })

    // Return formatted response
    return {
      success: true,
      post: {
        id: createdPost.id,
        documentId: createdPost.documentId,
        title: title || "",
        description,
        contentType,
        background,
        galleryLayout,
        tags,
        media: createdPost.media || [],
        user: createdPost.user || {
          id: authenticatedUser.id,
          documentId: userDocumentId,
          username: authenticatedUser.username,
          displayName: authenticatedUser.displayName || authenticatedUser.username,
          profileImage: authenticatedUser.profileImage,
        },
        createdAt: createdPost.createdAt || createdPost.publishedAt || new Date().toISOString(),
      },
    }

  } catch (error) {
    console.error("[SimplePost] Error creating post:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Post creation failed",
    }
  }
}
