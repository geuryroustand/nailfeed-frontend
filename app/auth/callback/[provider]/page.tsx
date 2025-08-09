import { redirect } from "next/navigation"
import { cookies } from "next/headers"

interface CallbackPageProps {
  params: {
    provider: string
  }
  searchParams: {
    access_token?: string
    id_token?: string
    error?: string
    code?: string
    state?: string
  }
}

export default async function CallbackPage({ params, searchParams }: CallbackPageProps) {
  const { provider } = params
  const { access_token, id_token, error, code, state } = searchParams

  // Check for errors
  if (error) {
    redirect(`/auth?error=${error}`)
  }

  // Verify CSRF token if state is provided
  if (state) {
    const storedCsrf = cookies().get("social_auth_csrf")?.value
    if (!storedCsrf || storedCsrf !== state) {
      redirect("/auth?error=invalid_state")
    }
  }

  const isProd = process.env.NODE_ENV === "production"
  const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  }

  try {
    let strapiResponse: Response | null = null

    // Handle Google id_token flow (most common for Google OAuth)
    if (provider === "google" && id_token) {
      console.log("Processing Google id_token...")

      // Try to exchange id_token with Strapi
      strapiResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback?id_token=${encodeURIComponent(id_token)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
        },
      )
    }
    // Handle access_token flow
    else if (access_token) {
      console.log("Processing access_token...")

      strapiResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}/callback?access_token=${encodeURIComponent(access_token)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
        },
      )
    }
    // Handle authorization code flow
    else if (code) {
      console.log("Processing authorization code...")

      strapiResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}/callback?code=${encodeURIComponent(code)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
        },
      )
    }

    if (!strapiResponse) {
      console.error("No valid token provided")
      redirect("/auth?error=missing_token")
    }

    if (!strapiResponse.ok) {
      const errorText = await strapiResponse.text()
      console.error("Strapi authentication failed:", strapiResponse.status, errorText)
      redirect("/auth?error=authentication_failed")
    }

    const data = await strapiResponse.json()
    console.log("Strapi response:", data)

    if (!data.jwt) {
      console.error("No JWT received from Strapi")
      redirect("/auth?error=no_token_received")
    }

    // Set authentication cookies
    cookies().set("auth_token", data.jwt, cookieOpts)
    cookies().set("jwt", data.jwt, { ...cookieOpts, httpOnly: false }) // Allow client access
    cookies().set("authToken", data.jwt, { ...cookieOpts, httpOnly: false })

    // Set user ID if available (for client-side convenience)
    if (data?.user?.id) {
      cookies().set("userId", String(data.user.id), {
        ...cookieOpts,
        httpOnly: false, // Allow client-side access
      })
    }

    console.log("Authentication successful, redirecting to home...")

    // Redirect to home page
    redirect("/")
  } catch (error) {
    console.error("Authentication callback error:", error)
    redirect("/auth?error=authentication_failed")
  }
}
