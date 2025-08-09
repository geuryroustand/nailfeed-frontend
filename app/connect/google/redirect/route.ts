import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const access_token = searchParams.get("access_token")
    const id_token = searchParams.get("id_token")
    const error = searchParams.get("error")

    console.log("Google redirect callback received:", { access_token: !!access_token, id_token: !!id_token, error })

    if (error) {
      console.error("OAuth error:", error)
      return NextResponse.redirect(new URL(`/auth?error=${error}`, request.url))
    }

    if (!access_token && !id_token) {
      console.error("No token received from Google")
      return NextResponse.redirect(new URL("/auth?error=no_token", request.url))
    }

    const strapiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL

    if (!strapiUrl) {
      console.error("No Strapi URL configured")
      return NextResponse.redirect(new URL("/auth?error=config_error", request.url))
    }

    try {
      // Build the callback URL for Strapi
      let callbackUrl = `${strapiUrl}/api/auth/google/callback`

      if (access_token) {
        callbackUrl += `?access_token=${encodeURIComponent(access_token)}`
      } else if (id_token) {
        callbackUrl += `?id_token=${encodeURIComponent(id_token)}`
      }

      console.log("Calling Strapi callback:", callbackUrl.replace(/(token=)[^&]+/, "$1***"))

      const response = await fetch(callbackUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Strapi callback failed:", response.status, errorText)
        return NextResponse.redirect(new URL("/auth?error=strapi_auth_failed", request.url))
      }

      const data = await response.json()
      console.log("Strapi authentication successful:", { hasJwt: !!data.jwt, hasUser: !!data.user })

      if (!data.jwt) {
        console.error("No JWT received from Strapi")
        return NextResponse.redirect(new URL("/auth?error=no_jwt", request.url))
      }

      // Set cookies for authentication
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      }

      const cookieStore = cookies()

      // Set the main auth token (httpOnly for security)
      cookieStore.set("auth_token", data.jwt, cookieOptions)

      // Set client-accessible tokens for compatibility
      cookieStore.set("jwt", data.jwt, {
        ...cookieOptions,
        httpOnly: false, // Allow client access
      })

      cookieStore.set("authToken", data.jwt, {
        ...cookieOptions,
        httpOnly: false, // Allow client access
      })

      // Store user ID if available
      if (data.user?.id) {
        cookieStore.set("userId", String(data.user.id), {
          ...cookieOptions,
          httpOnly: false, // Allow client access
        })
      }

      console.log("Cookies set, redirecting to home")
      return NextResponse.redirect(new URL("/", request.url))
    } catch (fetchError) {
      console.error("Error calling Strapi:", fetchError)
      return NextResponse.redirect(new URL("/auth?error=network_error", request.url))
    }
  } catch (error) {
    console.error("Google redirect handler error:", error)
    return NextResponse.redirect(new URL("/auth?error=handler_error", request.url))
  }
}
