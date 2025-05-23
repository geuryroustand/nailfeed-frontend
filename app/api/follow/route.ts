import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { toggleFollowStatus } from "@/lib/services/user-network-service"

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const cookieStore = cookies()
    const token = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { username, unfollow } = body

    if (!username) {
      return NextResponse.json({ success: false, message: "Username is required" }, { status: 400 })
    }

    // Call the server action to toggle follow status
    const result = await toggleFollowStatus(username, !!unfollow)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Failed to update follow status" },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      isFollowing: result.isFollowing,
    })
  } catch (error) {
    console.error("Error in follow API route:", error)
    return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 })
  }
}
