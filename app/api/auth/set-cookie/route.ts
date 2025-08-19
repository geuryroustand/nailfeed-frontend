import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    console.log("[v0] Setting JWT cookie on server side...")

    const cookieStore = await cookies()

    const cookieOptions = {
      httpOnly: false, // Allow client-side access for debugging
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax" as const,
    }

    // Set primary cookie names
    cookieStore.set("authToken", token, cookieOptions)
    cookieStore.set("jwt", token, cookieOptions)

    console.log("[v0] JWT cookies set successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error setting cookie:", error)
    return NextResponse.json({ error: "Failed to set cookie" }, { status: 500 })
  }
}
