import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nailfeed.com"
const SERVER_API_TOKEN = process.env.API_TOKEN || ""

/**
 * GET /api/push-subscriptions - Get user's push subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const cookieStore = await cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    } else if (SERVER_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
    }

    // Determine if userId is a documentId (string) or regular ID (number)
    const isDocumentId = isNaN(Number(userId)) || userId.length > 10

    let filterQuery
    if (isDocumentId) {
      filterQuery = `filters[user][documentId][$eq]=${userId}`
    } else {
      filterQuery = `filters[user][id][$eq]=${userId}`
    }

    const response = await fetch(`${API_BASE_URL}/api/push-subscriptions?${filterQuery}&populate=user`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to get push subscriptions: ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json({ data: result.data || [] })
  } catch (error) {
    console.error("Error getting push subscriptions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get subscriptions" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/push-subscriptions - Save a new push subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, endpoint, p256dh, auth, userAgent } = body

    if (!userId || !endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const cookieStore = await cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    } else if (SERVER_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
    }

    // First check if subscription already exists
    const existingResponse = await fetch(
      `${API_BASE_URL}/api/push-subscriptions?filters[endpoint][$eq]=${encodeURIComponent(endpoint)}`,
      {
        method: "GET",
        headers,
      }
    )

    if (existingResponse.ok) {
      const existingData = await existingResponse.json()
      if (existingData.data && existingData.data.length > 0) {
        return NextResponse.json({
          success: true,
          message: "Subscription already exists",
          data: existingData.data[0],
        })
      }
    }

    // Determine if userId is a documentId (string) or regular ID (number)
    const isDocumentId = isNaN(Number(userId)) || userId.length > 10

    let userRelation
    if (isDocumentId) {
      // Use documentId for Strapi v5 relation syntax
      userRelation = { connect: [{ documentId: userId }] }
    } else {
      // Use regular ID for Strapi v5 relation syntax
      userRelation = { connect: [{ id: Number.parseInt(userId) }] }
    }

    // Create new subscription with proper Strapi v5 relation syntax
    const response = await fetch(`${API_BASE_URL}/api/push-subscriptions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          endpoint,
          p256dh,
          auth,
          userAgent: userAgent || "Unknown",
          isActive: true,
          user: userRelation,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Full error response:", JSON.stringify(errorData, null, 2))

      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        errorData.error ||
        `Failed to save push subscription: ${response.status}`

      throw new Error(errorMessage)
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to notifications",
      data: data.data,
    })
  } catch (error) {
    console.error("Error saving push subscription:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save subscription",
      },
      { status: 500 }
    )
  }
}
