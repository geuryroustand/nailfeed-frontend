"use client"

import type React from "react"

import { SearchProvider } from "@/context/search-context"
import AdvancedSearch from "@/components/search/advanced-search"
import SearchResults from "@/components/search/search-results"
import { Suspense } from "react"

interface SearchProviderWrapperProps {
  children: React.ReactNode
}

export default function SearchProviderWrapper({ children }: SearchProviderWrapperProps) {
  return (
    <SearchProvider>
      <div className="mb-6">
        <Suspense fallback={<div className="animate-pulse h-12 bg-gray-200 rounded-xl" />}>
          <AdvancedSearch
            onSearch={(filters) => {
              console.log("Search filters:", filters)
              // The actual filtering is handled by the SearchContext
            }}
          />
        </Suspense>
      </div>

      <Suspense fallback={<div className="animate-pulse h-32 bg-gray-200 rounded-xl" />}>
        <SearchResults />
      </Suspense>

      {children}
    </SearchProvider>
  )
}
