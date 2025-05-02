import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - NailFeed",
  description: "Sign in or create an account on NailFeed",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div data-auth-layout="true" className="min-h-screen flex flex-col">
      {children}
    </div>
  )
}
