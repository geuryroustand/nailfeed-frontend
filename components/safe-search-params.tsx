"use client"

import { Suspense, type ReactNode } from "react"

interface SafeSearchParamsProps {
  children: ReactNode
  fallback: ReactNode
}

export function SafeSearchParams({ children, fallback }: SafeSearchParamsProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}
