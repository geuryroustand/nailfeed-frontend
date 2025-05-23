"use client"
import { useAuth as useAuthContext } from "@/context/auth-context"

export function useAuth() {
  const authContext = useAuthContext()

  return {
    ...authContext,
    refreshUser: authContext.checkAuthStatus,
  }
}
