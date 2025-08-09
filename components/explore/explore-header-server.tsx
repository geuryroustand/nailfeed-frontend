import { Suspense } from "react"
import ExploreHeaderClient from "./explore-header-client"
import { getExploreCategories } from "@/lib/actions/explore-server-actions"

interface ExploreHeaderServerProps {
  initialQuery: string
  initialCategory: string
}

export default async function ExploreHeaderServer({ initialQuery, initialCategory }: ExploreHeaderServerProps) {
  // Fetch categories on the server
  const categories = await getExploreCategories()

  return (
    <div className="sticky top-0 z-40 bg-gray-50 pt-4 pb-2">
      <Suspense fallback={<div className="h-20 animate-pulse bg-gray-200 rounded" />}>
        <ExploreHeaderClient initialQuery={initialQuery} initialCategory={initialCategory} categories={categories} />
      </Suspense>
    </div>
  )
}
