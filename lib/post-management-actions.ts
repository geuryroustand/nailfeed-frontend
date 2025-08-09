"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import config from "@/lib/config"

interface DeletePostResult {
  success: boolean
  message?: string
}

/**
 * Server action to delete a post
 * @param documentId The document ID of the post to delete
 * @returns Result object indicating success or failure
 */
export async function deletePost(documentId: string): Promise<DeletePostResult> {
  try {
    console.log(`Attempting to delete post with documentId: ${documentId}`)

    // Get the API token from cookies or config
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value || config.api.getApiToken()

    if (!token) {
      console.error("No authentication token found")
      return {
        success: false,
        message: "Authentication required. Please log in and try again.",
      }
    }

    // Get the API URL from environment variables
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Construct the API endpoint for Strapi v5
    const endpoint = `${apiUrl}/api/posts/${documentId}`

    console.log(`Sending DELETE request to: ${endpoint}`)

    // Send the DELETE request
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    // Handle different response status codes
    if (response.status === 204) {
      // 204 No Content is the expected success response for DELETE
      console.log(`Successfully deleted post with documentId: ${documentId}`)

      // Revalidate relevant paths to ensure fresh data
      revalidatePath("/profile")
      revalidatePath("/profile/[username]")
      revalidatePath("/")
      revalidatePath("/post/[id]")

      return {
        success: true,
      }
    } else if (response.status === 403) {
      console.error("Permission denied when attempting to delete post")
      return {
        success: false,
        message: "You don't have permission to delete this post.",
      }
    } else if (response.status === 404) {
      console.error("Post not found when attempting to delete")
      return {
        success: false,
        message: "Post not found. It may have already been deleted.",
      }
    } else {
      // Try to get more detailed error information
      let errorMessage = "Failed to delete post. Please try again."
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch (e) {
        // If we can't parse the error response, use the default message
      }

      console.error(`Error deleting post: ${response.status} - ${errorMessage}`)
      return {
        success: false,
        message: errorMessage,
      }
    }
  } catch (error) {
    console.error("Exception when deleting post:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Server action to update a post
 * @param documentId The document ID of the post to update
 * @param updateData The data to update
 * @returns Result object indicating success or failure
 */
export async function updatePost(documentId: string, updateData: any): Promise<DeletePostResult> {
  try {
    console.log(`Attempting to update post with documentId: ${documentId}`)

    // Get the API token from cookies or config
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value || config.api.getApiToken()

    if (!token) {
      console.error("No authentication token found")
      return {
        success: false,
        message: "Authentication required. Please log in and try again.",
      }
    }

    // Get the API URL from environment variables
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Construct the API endpoint for Strapi v5
    const endpoint = `${apiUrl}/api/posts/${documentId}`

    console.log(`Sending PUT request to: ${endpoint}`)

    // Send the PUT request
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: updateData }),
      cache: "no-store",
    })

    // Handle different response status codes
    if (response.ok) {
      console.log(`Successfully updated post with documentId: ${documentId}`)

      // Revalidate relevant paths to ensure fresh data
      revalidatePath("/profile")
      revalidatePath("/profile/[username]")
      revalidatePath("/")
      revalidatePath("/post/[id]")

      return {
        success: true,
      }
    } else if (response.status === 403) {
      console.error("Permission denied when attempting to update post")
      return {
        success: false,
        message: "You don't have permission to update this post.",
      }
    } else if (response.status === 404) {
      console.error("Post not found when attempting to update")
      return {
        success: false,
        message: "Post not found.",
      }
    } else {
      // Try to get more detailed error information
      let errorMessage = "Failed to update post. Please try again."
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch (e) {
        // If we can't parse the error response, use the default message
      }

      console.error(`Error updating post: ${response.status} - ${errorMessage}`)
      return {
        success: false,
        message: errorMessage,
      }
    }
  } catch (error) {
    console.error("Exception when updating post:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
