"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { usePathname } from "next/navigation"

export default function AuthSync() {
  const { checkAuthStatus } = useAuth()
  const pathname = usePathname()

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
