import { type NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true"

    if (!analyticsEnabled) {
      return NextResponse.json({ success: true, message: "Analytics disabled" })
    }

    const body = await request.json()
    const { postId, source, timestamp } = body

    if (!process.env.API_URL || !process.env.API_TOKEN) {
      console.error("Missing required environment variables for analytics")
      return NextResponse.json({ error: "Analytics not configured" }, { status: 500 })
    }

    const apiUrl = process.env.API_URL
    const endpoint = `/api/analytics/view`
    const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    console.log("[v0] Tracking view to:", fullUrl)

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify({
        postId,
        source,
        timestamp,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Analytics API error: ${response.status} - ${errorText}`)
      return NextResponse.json({ success: false, error: `Analytics API responded with ${response.status}` })
    }

    // Revalidate analytics data (safe to do in API route)
    revalidateTag(`analytics-${postId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking view:", error)
    return NextResponse.json({ success: false, error: "Failed to track view" })
  }
}
