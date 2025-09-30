import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/auth/session"

interface SocialLoginRequest {
  jwt: string
  user: {
    id: number
    username: string
    email: string
    displayName?: string
    provider?: string
    [key: string]: any
  }
  provider: string
}

/**
 * POST /api/auth/social-login
 * Create secure session after successful social authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body: SocialLoginRequest = await request.json()
    const { jwt, user, provider } = body

    if (!jwt || !user || !provider) {
      return NextResponse.json(
        { error: "Missing required fields for social login" },
        { status: 400 }
      )
    }

    // Create secure session with Strapi JWT and user data
    await createSession(user, jwt, false) // Don't remember social logins by default

    // Return user data (without JWT token for security)
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        provider, // Add provider info
      },
    })

  } catch (error) {
    console.error("Social login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
