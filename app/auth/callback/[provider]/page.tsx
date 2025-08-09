"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function AuthCallback({ params }: { params: { provider: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkAuthStatus } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const idToken = searchParams.get("id_token")
      const error = searchParams.get("error")

      if (error) {
        console.error("Auth error:", error)
        router.push("/auth?error=" + error)
        return
      }

      if (idToken && params.provider === "google") {
        try {
          // Redirect to our API route to handle the token exchange
          window.location.href = `/api/auth/social/google?id_token=${idToken}`
        } catch (error) {
          console.error("Token exchange failed:", error)
          router.push("/auth?error=token_exchange_failed")
        }
      } else {
        // Check if we're already authenticated (cookies might be set)
        await checkAuthStatus()
        router.push("/")
      }
    }

    handleCallback()
  }, [searchParams, params.provider, router, checkAuthStatus])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
