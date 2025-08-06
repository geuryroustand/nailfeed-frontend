"use server"
import { z } from "zod"
import { AuthService, type AuthResponse } from "@/lib/auth-service"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Login schema
const loginSchema = z.object({
  identifier: z.string().min(1, { message: "Email or username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
})

// Create the login action
export const loginAction = async (data: {
  identifier: string
  password: string
  rememberMe?: boolean
}): Promise<{ success: boolean; error?: string; user?: any; jwt?: string }> => {
  try {
    // Validate form data
    const validatedFields = loginSchema.safeParse(data)

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid form data. Please check your inputs.",
      }
    }

    // Log in user
    const result: AuthResponse | { error: string } | null = await AuthService.login(data.identifier, data.password)

    if (!result || result.error) {
      return { success: false, error: result?.error || "Login failed" }
    }

    return {
      success: true,
      user: result.user,
      jwt: result.jwt,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

// Registration schema
const registerSchema = z
  .object({
    username: z.string().min(3, { message: "Username must be at least 3 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// Create the registration action
export const registerAction = async (data: {
  username: string
  email: string
  password: string
  confirmPassword: string
}): Promise<{ success: boolean; error?: string; user?: any; jwt?: string }> => {
  try {
    // Validate form data
    const validatedFields = registerSchema.safeParse(data)

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid form data. Please check your inputs.",
      }
    }

    // Register user
    const result: AuthResponse | { error: string } | null = await AuthService.register(
      data.username,
      data.email,
      data.password,
    )

    if (!result || result.error) {
      return { success: false, error: result?.error || "Registration failed" }
    }

    return {
      success: true,
      user: result.user,
      jwt: result.jwt,
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

// Social auth schema
const socialAuthSchema = z.object({
  provider: z.enum(["google", "facebook", "instagram"]),
  redirectUrl: z.string().url().optional(),
})

// Create the social auth action
export const initiateSocialAuthAction = async (provider: string): Promise<{ 
  success: boolean; 
  error?: string; 
  redirectUrl?: string 
}> => {
  try {
    // Validate provider
    const validatedFields = socialAuthSchema.safeParse({ provider })

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid provider.",
      }
    }

    // Get the appropriate URLs based on environment
    const baseUrl = process.env.NODE_ENV === "development" 
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    
    const apiUrl = process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"

    // Construct the callback URL
    const callbackUrl = `${baseUrl}/auth/callback/${provider}`
    
    // Strapi's social auth endpoint
    const authUrl = `${apiUrl}/api/connect/${provider}?callback=${encodeURIComponent(callbackUrl)}`

    return {
      success: true,
      redirectUrl: authUrl,
    }
  } catch (error) {
    console.error("Social auth error:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

// Handle social auth callback
export const handleSocialAuthCallback = async (
  provider: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const apiUrl = process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"

    // Exchange access token for user data and JWT
    const response = await fetch(`${apiUrl}/api/auth/${provider}/callback?access_token=${accessToken}`)
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.jwt && data.user) {
      const cookieStore = await cookies()
      
      // Set authentication cookies
      cookieStore.set("jwt", data.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      })

      cookieStore.set("user_data", JSON.stringify({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      })

      return { success: true }
    } else {
      return {
        success: false,
        error: "Invalid response from authentication server"
      }
    }
  } catch (error) {
    console.error("Social auth callback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed"
    }
  }
}
