"use client"

import type { ReactNode } from "react"
import { SearchProvider } from "@/context/search-context"

export default function SearchProviderWrapper({ children }: { children: ReactNode }) {
  return <SearchProvider>{children}</SearchProvider>
}
