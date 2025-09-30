import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()

    if (!session || !session.strapiJWT) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userJwt = session.strapiJWT

    const body = await request.json()
    const { targetUserId } = body

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID is required" },
        { status: 400 }
      )
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
      "https://nailfeed-backend-production.up.railway.app"

    console.log(`[FollowToggle] Toggling follow for user: ${targetUserId}`)

    // Use the backend follows API (the create endpoint handles toggle)
    const response = await fetch(`${apiUrl}/api/follows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      body: JSON.stringify({
        data: {
          following: targetUserId,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`[FollowToggle] Backend error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return NextResponse.json(
        { error: errorData.message || "Failed to toggle follow status" },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log(`[FollowToggle] Backend response:`, result)

    // Transform backend response to match frontend expectations
    const action = result.meta?.action || (result.data ? "followed" : "unfollowed")
    const isFollowing = action === "followed"

    console.log(`[FollowToggle] Success:`, {
      action,
      isFollowing,
    })

    return NextResponse.json({
      action,
      isFollowing,
      message: result.meta?.message || `User ${action} successfully`,
    })

  } catch (error) {
    console.error("[FollowToggle] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
