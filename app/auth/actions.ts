"use server"

import { cookies } from "next/headers"
import { AuthService } from "@/lib/auth-service"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"

// Cookie names
const TOKEN_COOKIE = "auth_token"
const USER_COOKIE = "user_data"
const CSRF_COOKIE = "social_auth_csrf"
const COOKIE_EXPIRY = 30 * 24 * 60 * 60 // 30 days in seconds

export async function registerAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const response = await AuthService.register(username, email, password)

    if (response) {
      // Registration successful
      // Send verification email
      await AuthService.sendEmailConfirmation(email, response.jwt)

      revalidatePath("/auth")
      return {
        success: true,
        error: null,
      }
    } else {
      // Registration failed
      return {
        success: false,
        error: "Registration failed",
      }
    }
  } catch (error) {
    console.error("Registration action error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const rememberMe = formData.get("rememberMe") === "on"

  try {
    const response = await AuthService.login(email, password)

    if (response && "jwt" in response) {
      // Set cookies with the JWT token and user data
      const { jwt, user } = response

      // Calculate expiration - 30 days if remember me is checked, session otherwise
      const maxAge = rememberMe ? COOKIE_EXPIRY : undefined

      // Set the auth token cookie
      cookies().set(TOKEN_COOKIE, jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge,
        path: "/",
      })

      // Set the user data cookie
      cookies().set(
        USER_COOKIE,
        JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge,
          path: "/",
        },
      )

      revalidatePath("/auth")
      return {
        success: true,
        error: null,
      }
    } else if (response && "error" in response) {
      // Login failed with specific error
      return {
        success: false,
        error: response.error,
      }
    } else {
      // Generic login failure
      return {
        success: false,
        error: "Invalid email or password",
      }
    }
  } catch (error) {
    console.error("Login action error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function logoutAction() {
  // Clear the auth cookies
  cookies().delete(TOKEN_COOKIE)
  cookies().delete(USER_COOKIE)

  revalidatePath("/")
  return { success: true }
}

export async function initiateSocialAuthAction(provider: string): Promise<{ url: string; error?: string }> {
  try {
    // Generate a CSRF token
    const csrfToken = uuidv4()

    // Store the CSRF token in a cookie
    cookies().set(CSRF_COOKIE, csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 5, // 5 minutes
      path: "/",
    })

    // Get the redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/${provider}`

    // Get the authorization URL from the social auth service
    const authUrl = AuthService.getAuthorizationUrl(provider as any, redirectUri)

    return { url: authUrl }
  } catch (error) {
    console.error(`Failed to initiate ${provider} social auth:`, error)
    return { url: "", error: "Failed to initiate social authentication" }
  }
}
