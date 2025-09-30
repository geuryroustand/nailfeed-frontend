import type { ReactNode } from "react"
import { unstable_noStore as noStore } from "next/cache"
import { AuthProvider } from "@/context/auth-context"
import { validateSession } from "@/lib/auth/session"

interface AuthProviderServerProps {
  children: ReactNode
}

export default async function AuthProviderServer({ children }: AuthProviderServerProps) {
  noStore()

  try {
    const { user } = await validateSession()
    return <AuthProvider initialUser={user}>{children}</AuthProvider>
  } catch (error) {
    console.error("[auth-provider-server] Failed to validate session:", error)
    return <AuthProvider initialUser={null}>{children}</AuthProvider>
  }
}
