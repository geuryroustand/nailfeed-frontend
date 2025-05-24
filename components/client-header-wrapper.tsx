"use client"

import { Suspense, useEffect } from "react"
import Header from "./header"
import { useAuth } from "@/hooks/use-auth"

export default function ClientHeaderWrapper() {
  const { checkAuthStatus } = useAuth()

  // Check auth status when the component mounts
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  return (
    <Suspense fallback={<HeaderFallback />}>
      <Header />
    </Suspense>
  )
}

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-3">
      <div className="container max-w-5xl mx-auto flex items-center justify-between">
        <div className="h-8"></div>
      </div>
    </header>
  )
}
