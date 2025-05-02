"use server"

// This file contains server actions that handle API requests requiring authentication tokens
// This keeps sensitive tokens on the server side

const API_URL = "https://nailfeed-backend-production.up.railway.app"

/**
 * Make an authenticated API request using the server-side API token
 */
export async function makeAuthenticatedRequest(endpoint: string, method = "GET", body?: any) {
  try {
    const url = `${API_URL}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    }

    const options: RequestInit = {
      method,
      headers,
      cache: "no-store",
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error in makeAuthenticatedRequest:`, error)
    throw error
  }
}

/**
 * Get a user by username (server-side)
 */
export async function getUserByUsername(username: string) {
  return makeAuthenticatedRequest(
    `/api/users?filters[username][$eq]=${username}&populate[0]=profileImage&populate[1]=coverImage`,
  )
}

/**
 * Get user engagement metrics (server-side)
 */
export async function getUserEngagement(username: string) {
  return makeAuthenticatedRequest(`/api/users/engagement/${username}`)
}

/**
 * Upload a file to the server (server-side)
 * This function will be called from a client component via FormData
 */
export async function uploadFile(formData: FormData) {
  try {
    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}
