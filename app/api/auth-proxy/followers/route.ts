import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userJwt = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value
    const serverToken = process.env.API_TOKEN

    const token = userJwt || serverToken

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const pageSize = searchParams.get("pageSize") || "25"

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
      "https://nailfeed-backend-production.up.railway.app"

    console.log(`[FollowersProxy] Fetching followers (page: ${page}, pageSize: ${pageSize})`)

    const response = await fetch(
      `${apiUrl}/api/followers?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`[FollowersProxy] Backend error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return NextResponse.json(
        { error: errorData.message || "Failed to fetch followers" },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error("[FollowersProxy] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}