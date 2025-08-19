import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Remove this line:
    // console.log("Setting cookie on server side with token:", token.substring(0, 10) + "...")

    // Set the cookie with appropriate options - HttpOnly only in production
    cookies().set({
      name: "authToken",
      value: token,
      httpOnly: process.env.NODE_ENV === "production", // Only HTTP-only in production
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting cookie:", error)
    return NextResponse.json({ error: "Failed to set cookie" }, { status: 500 })
  }
}
