"use server"

import { cookies } from "next/headers"
import { SignJWT } from "jose"
import {
  SESSION_COOKIE_NAME,
  getSessionSecret,
  verifySessionToken,
  type SessionTokenPayload,
} from "./session-token"

export type SessionPayload = SessionTokenPayload

export interface User {
  id: number
  documentId?: string
  username: string
  email: string
  displayName?: string
  profileImage?: any
  [key: string]: any
}

// Session configuration
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * Create a new session with secure HttpOnly cookie
 */
export async function createSession(
  userData: User,
  strapiJWT: string,
  rememberMe: boolean = false,
): Promise<void> {
  const expiresAtDate = new Date(Date.now() + (rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION))

  const payload: SessionPayload = {
    userId: userData.id,
    email: userData.email,
    username: userData.username,
    strapiJWT,
    expiresAt: expiresAtDate.toISOString(),
  }

  const session = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAtDate)
    .sign(getSessionSecret())

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAtDate,
    path: "/",
  })
}

/**
 * Verify and decrypt the session cookie
 */
export async function verifySession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    const session = await verifySessionToken(sessionCookie.value)
    if (!session) {
      await deleteSession()
      return null
    }

    return session
  } catch (error) {
    console.error("Session verification failed:", error)
    await deleteSession()
    return null
  }
}

/**
 * Delete the session cookie
 */
export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)

    // Also clean up legacy cookies
    const legacyCookies = ["jwt", "authToken", "auth_token", "userId"]
    legacyCookies.forEach(cookieName => {
      cookieStore.delete(cookieName)
    })
  } catch (error) {
    console.error("Error deleting session:", error)
  }
}

/**
 * Get current authenticated user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await verifySession()
    if (!session) {
      return null
    }

    const strapiUrl =
      process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    const response = await fetch(`${strapiUrl}/api/users/me?populate=profileImage`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${session.strapiJWT}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch user from Strapi:", response.status)
      await deleteSession()
      return null
    }

    const strapiUser = await response.json()

    const userData: User = {
      id: strapiUser.id,
      documentId: strapiUser.documentId,
      username: strapiUser.username,
      email: strapiUser.email,
      displayName: strapiUser.displayName || strapiUser.username,
      bio: strapiUser.bio,
      location: strapiUser.location,
      website: strapiUser.website,
      profileImage: strapiUser.profileImage,
      isVerified: strapiUser.isVerified || false,
      followersCount: strapiUser.followersCount || 0,
      followingCount: strapiUser.followingCount || 0,
      postsCount: strapiUser.postsCount || 0,
    }

    return userData
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Refresh session if it's about to expire
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const session = await verifySession()
    if (!session) {
      return false
    }

    const user = await getCurrentUser()
    if (!user) {
      await deleteSession()
      return false
    }

    const expiresAt = new Date(session.expiresAt)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)

    if (expiresAt < oneHourFromNow) {
      await createSession(user, session.strapiJWT, false)
      return true
    }

    return true
  } catch (error) {
    console.error("Error refreshing session:", error)
    return false
  }
}

/**
 * Validate session and return user data (for middleware use)
 */
export async function validateSession(): Promise<{ user: User | null; session: SessionPayload | null }> {
  const session = await verifySession()
  if (!session) {
    return { user: null, session: null }
  }

  const user = await getCurrentUser()
  if (!user) {
    await deleteSession()
    return { user: null, session: null }
  }

  return { user, session }
}

