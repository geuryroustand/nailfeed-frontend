import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idToken = searchParams.get("id_token")

    if (!idToken) {
      return NextResponse.redirect(new URL("/auth?error=no_token", request.url))
    }

    // Try to exchange the id_token with Strapi
    const strapiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL

    if (strapiUrl) {
      try {
        const response = await fetch(`${strapiUrl}/api/auth/google/callback?id_token=${idToken}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()

          if (data.jwt) {
            // Set cookies for the JWT
            const cookieStore = cookies()
            cookieStore.set("auth_token", data.jwt, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: "/",
            })
            cookieStore.set("jwt", data.jwt, {
              httpOnly: false, // Allow client access
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7,
              path: "/",
            })
            cookieStore.set("authToken", data.jwt, {
              httpOnly: false,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7,
              path: "/",
            })

            if (data.user?.id) {
              cookieStore.set("userId", String(data.user.id), {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
              })
            }

            return NextResponse.redirect(new URL("/", request.url))
          }
        }
      } catch (error) {
        console.error("Strapi exchange failed:", error)
      }
    }

    // Fallback: create a simple session token
    const secret = process.env.REVALIDATE_SECRET || process.env.WEBHOOK_SECRET || process.env.API_TOKEN

    if (secret) {
      const jwt = require("jsonwebtoken")
      const sessionToken = jwt.sign(
        {
          id: `google_${Date.now()}`,
          email: "user@example.com", // You'd extract this from id_token
          provider: "google",
          loginTime: Date.now(),
        },
        secret,
        { expiresIn: "7d" },
      )

      const cookieStore = cookies()
      cookieStore.set("jwt", sessionToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
      cookieStore.set("authToken", sessionToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
    }

    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("Google auth error:", error)
    return NextResponse.redirect(new URL("/auth?error=auth_failed", request.url))
  }
}
