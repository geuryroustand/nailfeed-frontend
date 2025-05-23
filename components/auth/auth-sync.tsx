"use client"

import { useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { usePathname, useRouter } from "next/navigation"

export default function AuthSync() {
  const { checkAuthStatus, isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Check auth status when the component mounts
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  // Check auth status when the pathname changes
  useEffect(() => {
    checkAuthStatus()
  }, [pathname, checkAuthStatus])

  return null // This component doesn't render anything
}
