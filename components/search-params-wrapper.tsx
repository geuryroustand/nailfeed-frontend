"use client"

import { Suspense, type ReactNode } from "react"

interface SearchParamsWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function SearchParamsWrapper({ children, fallback = <div>Loading...</div> }: SearchParamsWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}
