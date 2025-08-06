"use server"
import { z } from "zod"
import { AuthService, type AuthResponse } from "@/lib/auth-service"

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
  provider: z.enum(["google", "facebook", "twitter"]),
  redirectUrl: z.string().url().optional(),
})

// Create the social auth action
export const initiateSocialAuthAction = async (data: {
  provider: string
  redirectUrl?: string
}): Promise<{ success: boolean; error?: string; redirectUrl?: string }> => {
  try {
    // Validate form data
    const validatedFields = socialAuthSchema.safeParse(data)

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid provider or redirect URL.",
      }
    }

    // Generate social auth URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const authUrl = `${baseUrl}/auth/social/${data.provider}`

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
