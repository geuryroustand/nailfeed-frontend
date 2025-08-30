import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
const SERVER_API_TOKEN = process.env.API_TOKEN || ""

async function getAuthHeaders(): Promise<HeadersInit> {
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

  return headers
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, endpoint, p256dh, auth, userAgent } = body

    if (!userId || !endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing required fields: userId, endpoint, p256dh, auth" }, { status: 400 })
    }

    const headers = await getAuthHeaders()
    const url = `${API_BASE_URL}/api/push-subscriptions`

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          user: {
            connect: [userId], // Use Strapi 5 connect method for relations
          },
          endpoint,
          p256dh,
          auth,
          userAgent: userAgent || "Unknown",
          isActive: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Strapi error response:", errorText)
      return NextResponse.json(
        { error: `Failed to save push subscription: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error saving push subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    const headers = await getAuthHeaders()
    const url = `${API_BASE_URL}/api/push-subscriptions?filters[user][id][$eq]=${userId}&filters[isActive][$eq]=true`

    const response = await fetch(url, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to get push subscriptions: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data.data || [] })
  } catch (error) {
    console.error("Error getting push subscriptions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
