import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/auth/session"

interface LoginCredentials {
  identifier: string
  password: string
  rememberMe?: boolean
}

interface StrapiAuthResponse {
  jwt: string
  user: {
    id: number
    username: string
    email: string
    displayName?: string
    profileImage?: any
    [key: string]: any
  }
}

/**
 * POST /api/auth/login
 * Authenticate user with Strapi and create secure session
 */
export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json()
    const { identifier, password, rememberMe = false } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      )
    }

    // Get Strapi URL from environment
    const strapiUrl = process.env.API_URL ||
                     process.env.NEXT_PUBLIC_API_URL ||
                     "https://api.nailfeed.com"

    // Authenticate with Strapi
    const authResponse = await fetch(`${strapiUrl}/api/auth/local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        password,
      }),
    })

    if (!authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || "Invalid credentials"

      return NextResponse.json(
        { error: errorMessage },
        { status: authResponse.status }
      )
    }

    const authData: StrapiAuthResponse = await authResponse.json()

    if (!authData.jwt || !authData.user) {
      return NextResponse.json(
        { error: "Invalid response from authentication server" },
        { status: 500 }
      )
    }

    // Create secure session with Strapi JWT
    await createSession(authData.user, authData.jwt, rememberMe)

    // Return user data (without JWT token for security)
    return NextResponse.json({
      success: true,
      user: authData.user,
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}