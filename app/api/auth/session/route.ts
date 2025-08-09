import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const authToken =
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("jwt")?.value ||
      request.cookies.get("authToken")?.value

    if (!authToken) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Try to verify with a server secret if available
    const secret = process.env.REVALIDATE_SECRET || process.env.WEBHOOK_SECRET || process.env.API_TOKEN

    if (secret) {
      try {
        const decoded = jwt.verify(authToken, secret) as any
        return NextResponse.json({ user: decoded })
      } catch (error) {
        console.error("JWT verification failed:", error)
      }
    }

    // If no secret or verification failed, return unauthorized
    return NextResponse.json({ user: null }, { status: 401 })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
