"use client"

import { useState, useCallback, useOptimistic } from "react"
import type { Suggestion } from "@/app/actions/suggestion-actions"
import SuggestionsList from "@/components/suggestions/suggestions-list"
import CreateSuggestionModal from "@/components/suggestions/create-suggestion-modal"
import { Button } from "@/components/ui/button"
import { Lightbulb, Plus } from "lucide-react"
import BottomNav from "@/components/bottom-nav"
import Sidebar from "@/components/sidebar"

interface SuggestionsContentProps {
  initialSuggestions: Suggestion[]
}

export default function SuggestionsContent({ initialSuggestions }: SuggestionsContentProps) {
  const [optimisticSuggestions, addOptimisticSuggestion] = useOptimistic(
    initialSuggestions,
    (state, newSuggestion: Suggestion) => [newSuggestion, ...state],
  )

  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions)

  if (initialSuggestions !== suggestions && initialSuggestions.length !== suggestions.length) {
    setSuggestions(initialSuggestions)
  }

  const handleSuggestionCreated = useCallback(
    (newSuggestion: Suggestion) => {
      addOptimisticSuggestion(newSuggestion)
      setSuggestions((prev) => [newSuggestion, ...prev])
    },
    [addOptimisticSuggestion],
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
          <Sidebar activeItem="suggestions" />
        </div>

        {/* Main Content */}
        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-4xl mx-auto px-4 pt-6 pb-16 md:py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Community Ideas</h1>
                    <p className="text-gray-600">Share your ideas and vote on features you'd like to see</p>
                  </div>
                </div>
                <CreateSuggestionModal onSuggestionCreated={handleSuggestionCreated}>
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Suggest Feature
                  </Button>
                </CreateSuggestionModal>
              </div>
            </div>

            {/* Suggestions List */}
            <SuggestionsList initialSuggestions={optimisticSuggestions} />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomNav activeTab="suggestions" />
      </div>
    </main>
  )
}
