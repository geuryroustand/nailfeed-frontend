import { Suspense } from "react"
import { getSuggestions } from "@/app/actions/suggestion-actions"
import SuggestionsContent from "./suggestions-content"
import { Lightbulb } from "lucide-react"

export const metadata = {
  title: "Community Ideas - NailFeed",
  description: "Share and vote on feature suggestions for NailFeed",
}

export const dynamic = "force-dynamic"
export const revalidate = 60

function SuggestionsLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200 bg-white animate-pulse">
          <div className="p-4 space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-4xl mx-auto px-4 pt-6 pb-16 md:py-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Community Ideas</h1>
                    <p className="text-gray-600">Share and vote on feature suggestions</p>
                  </div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-16 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

async function SuggestionsPageContent() {
  const suggestions = await getSuggestions()
  return <SuggestionsContent initialSuggestions={suggestions} />
}

export default function SuggestionsPage() {
  return (
    <Suspense fallback={<SuggestionsLoading />}>
      <SuggestionsPageContent />
    </Suspense>
  )
}
