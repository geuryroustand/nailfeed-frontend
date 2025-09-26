import { NextResponse } from "next/server"
import { validateSession } from "@/lib/auth/session"

/**
 * GET /api/auth/session
 * Validate current session and return user data
 */
export async function GET() {
  try {
    const { user, session } = await validateSession()

    if (!user || !session) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    return NextResponse.json({
      authenticated: true,
      user,
      session: {
        userId: session.userId,
        email: session.email,
        username: session.username,
        expiresAt: session.expiresAt,
      },
    })
  } catch (error) {
    console.error("Session validation error:", error)
    return NextResponse.json(
      { authenticated: false, user: null, error: "Session validation failed" },
      { status: 500 }
    )
  }
}
