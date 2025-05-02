"use client"

import { Suspense } from "react"
import Header from "./header"

export default function ClientHeaderWrapper() {
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
