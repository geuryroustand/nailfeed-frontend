import { Suspense } from "react"
import SuggestionsClientPage from "./suggestions-client-page"

export const metadata = {
  title: "Community Ideas - NailFeed",
  description: "Share and vote on feature suggestions for NailFeed",
}

function SuggestionsLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SuggestionsPage() {
  return (
    <Suspense fallback={<SuggestionsLoading />}>
      <SuggestionsClientPage />
    </Suspense>
  )
}
