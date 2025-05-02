"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Only proceed when loading is complete
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to auth page if not authenticated
        router.replace("/auth")
      } else {
        // Mark as ready to render if authenticated
        setIsReady(true)
      }
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading, isReady }
}
