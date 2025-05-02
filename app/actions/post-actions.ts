"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { PostService, type ContentType, type GalleryLayout } from "@/lib/services/post-service"
import { MediaUploadService } from "@/lib/services/media-upload-service"
import type { BackgroundType } from "@/components/post-background-selector"

export async function createPost(formData: FormData) {
  try {
    console.log("=== Starting createPost server action ===")

    // Check if user is authenticated
    let token = cookies().get("jwt")?.value
    let userId = cookies().get("userId")?.value
    let userDocumentId: string | null = null

    // If no token in cookies, try to get it from the form data
    if (!token) {
      token = formData.get("jwt") as string
      console.log("Using JWT token from form data:", token ? "Token exists" : "No token")

      // Store the token in a cookie for future requests
      if (token) {
        cookies().set("jwt", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        })
      }
    } else {
      console.log("Using JWT token from cookies:", token ? "Token exists" : "No token")
    }

    // Try to get the user documentId from form data (preferred)
    userDocumentId = formData.get("userDocumentId") as string
    if (userDocumentId) {
      console.log("Using userDocumentId from form data:", userDocumentId)
    } else {
      // If no documentId, try to get the regular userId
      if (!userId) {
        userId = formData.get("userId") as string
        console.log("Using userId from form data:", userId ? "UserId exists" : "No userId")
      }
    }

    // Try to extract documentId from the full user object if available
    const userObjectJson = formData.get("userObject") as string
    if (userObjectJson) {
      try {
        const userObject = JSON.parse(userObjectJson)
        console.log("Full user object:", userObject)

        if (userObject && userObject.documentId && !userDocumentId) {
          userDocumentId = userObject.documentId
          console.log("Extracted documentId from user object:", userDocumentId)
        }
      } catch (e) {
        console.error("Error parsing user object:", e)
      }
    }

    // If no token is found, return an error - only authenticated users can post
    if (!token) {
      console.log("No authentication token found, rejecting post creation")
      return {
        success: false,
        error: "Authentication required. Please log in to create posts.",
      }
    }

    // Extract data from formData
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const contentType = (formData.get("contentType") as ContentType) || "text"
    const galleryLayout = (formData.get("galleryLayout") as GalleryLayout) || "grid,"
    const backgroundJson = formData.get("background") as string
    const mediaItemsJson = formData.get("mediaItems") as string
    const tagsJson = formData.get("tags") as string

    // Parse JSON data
    const background = backgroundJson ? (JSON.parse(backgroundJson) as BackgroundType) : undefined
    const mediaItems = mediaItemsJson ? JSON.parse(mediaItemsJson) : []
    const tags = tagsJson ? JSON.parse(tagsJson) : []

    console.log("Creating post with data:", {
      title,
      description,
      contentType,
      galleryLayout,
      background: background ? "[background data]" : undefined,
      mediaItems: mediaItems.length > 0 ? `[${mediaItems.length} items]` : [],
      userDocumentId: userDocumentId || "Not provided",
      userId: userId || "Not provided",
      tags: tags.length > 0 ? tags : [],
    })

    // Create the post data according to the Strapi model
    // Based on your model, the field is 'user' not 'userId'
    const postData = {
      title: title || "Untitled Post",
      description,
      contentType,
      background,
      galleryLayout,
      user: userDocumentId || userId, // Using 'user' based on your model
    }

    console.log("Sending post creation request with data:", JSON.stringify(postData, null, 2))

    // Use the PostService to create the post
    const postResponse = await PostService.createPost(postData)
    console.log("Complete post creation response:", postResponse)

    const postId = postResponse.data.id
    const postDocumentId = postResponse.data.documentId || postId
    const publicationStatus = postResponse.data.publishedAt ? "published" : "draft"

    console.log(`Post created with ID: ${postId}, Document ID: ${postDocumentId}, Status: ${publicationStatus}`)

    // Add tags if any
    if (tags.length > 0) {
      try {
        console.log(`Attempting to add ${tags.length} tags to post ${postId}`)
        await PostService.addTagsToPost(postId, tags, token)
        console.log(`Added ${tags.length} tags to post ${postId}`)
      } catch (error) {
        console.error("Error adding tags to post:", error)
      }
    }

    // Handle media uploads if there are any
    let mediaResults = []
    const mediaFilesEntries = formData.getAll("mediaFiles")
    if (mediaFilesEntries.length > 0) {
      try {
        const mediaFiles: File[] = []
        for (let i = 0; i < mediaFilesEntries.length; i++) {
          const file = mediaFilesEntries[i] as File
          if (file instanceof File) {
            mediaFiles.push(file)
          }
        }

        if (mediaFiles.length > 0) {
          console.log(`Uploading ${mediaFiles.length} media files for post ${postId}`)

          // STEP 1: Upload the files to get file IDs
          const uploadedFiles = await MediaUploadService.uploadFiles(mediaFiles, token)
          console.log("Files uploaded successfully:", uploadedFiles)

          // Get the IDs of the uploaded files
          const fileIds = uploadedFiles.map((file) => file.id)
          console.log(`Uploaded file IDs:`, fileIds)

          // STEP 2: Create media items with the post relation in parallel
          // This establishes the relationship from the media item side
          console.log(`Creating media items for post ${postId} with file IDs:`, fileIds)
          const mediaItems = await MediaUploadService.createMediaItems(fileIds, postId, postDocumentId, token)
          console.log(`Created ${mediaItems.length} media items for post ${postId}:`, mediaItems)

          // STEP 3: No longer needed - relationship is established in step 2
          // The updatePostWithMediaItems call has been removed as it's redundant

          mediaResults = uploadedFiles
        }
      } catch (error) {
        console.error("Error handling media files:", error)
        // Continue with post creation even if media handling fails
      }
    }

    // Ensure proper cache invalidation
    console.log("Invalidating cache for paths: /, /profile, /explore")

    // Force cache invalidation by using the force option
    revalidatePath("/", "layout")
    revalidatePath("/profile", "layout")
    revalidatePath("/explore", "layout")

    // Also revalidate the specific post page
    revalidatePath(`/post/${postId}`, "layout")

    console.log("=== Completed createPost server action successfully ===")

    return {
      success: true,
      post: {
        id: postId,
        documentId: postDocumentId,
        ...postData,
        mediaItems: mediaResults.length > 0 ? mediaResults : undefined,
        tags,
        publicationStatus,
      },
    }
  } catch (error) {
    console.error("Error in createPost server action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
