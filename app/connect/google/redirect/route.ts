import { type NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/get-api-base-url"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const access_token = searchParams.get("access_token")
    const id_token = searchParams.get("id_token")
    const error = searchParams.get("error")

    console.log("Google redirect callback received:", {
      access_token: !!access_token,
      id_token: !!id_token,
      error,
    })

    if (error) {
      console.error("OAuth error:", error)
      return NextResponse.redirect(new URL(`/auth?error=${error}`, request.url))
    }

    if (!access_token && !id_token) {
      console.error("No token received from Google")
      return NextResponse.redirect(new URL("/auth?error=no_token", request.url))
    }

    // Use unified Strapi URL
    const strapiUrl = getApiBaseUrl()
    console.log("Using Strapi URL:", strapiUrl)

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

      if (response.status === 400) {
        return NextResponse.redirect(new URL("/auth?error=provider_disabled", request.url))
      }
      if (response.status === 401) {
        return NextResponse.redirect(new URL("/auth?error=invalid_token", request.url))
      }
      return NextResponse.redirect(new URL("/auth?error=strapi_auth_failed", request.url))
    }

    const data = await response.json()
    console.log("Strapi authentication successful:", {
      hasJwt: !!data.jwt,
      hasUser: !!data.user,
    })

    if (!data.jwt) {
      console.error("No JWT received from Strapi")
      return NextResponse.redirect(new URL("/auth?error=no_jwt", request.url))
    }

    // Prepare redirect response and SET COOKIES ON THE RESPONSE OBJECT
    const res = NextResponse.redirect(new URL("/", request.url))

    // Shared cookie options
    const baseCookie = {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    // httpOnly auth token for security
    res.cookies.set("auth_token", data.jwt, {
      ...baseCookie,
      httpOnly: true,
    })

    // Client-accessible copies for existing client code paths
    res.cookies.set("jwt", data.jwt, {
      ...baseCookie,
      httpOnly: false,
    })
    res.cookies.set("authToken", data.jwt, {
      ...baseCookie,
      httpOnly: false,
    })

    if (data.user?.id) {
      res.cookies.set("userId", String(data.user.id), {
        ...baseCookie,
        httpOnly: false,
      })
    }

    console.log("Cookies set, redirecting to home")
    return res
  } catch (err) {
    console.error("Google redirect handler error:", err)
    return NextResponse.redirect(new URL("/auth?error=handler_error", request.url))
  }
}
