"use client"

import { useState, useCallback } from "react"
import { getSuggestions, type Suggestion } from "@/app/actions/suggestion-actions"
import SuggestionsList from "@/components/suggestions/suggestions-list"
import CreateSuggestionModal from "@/components/suggestions/create-suggestion-modal"
import { Button } from "@/components/ui/button"
import { Lightbulb, Plus } from "lucide-react"
import BottomNav from "@/components/bottom-nav"
import Sidebar from "@/components/sidebar"
import React from "react"

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

export default function SuggestionsClientPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  React.useEffect(() => {
    const loadSuggestions = async () => {
      const data = await getSuggestions()
      setSuggestions(data)
      setIsLoading(false)
    }
    loadSuggestions()
  }, [])

  const handleSuggestionCreated = useCallback((newSuggestion: Suggestion) => {
    setSuggestions((prev) => [newSuggestion, ...prev])
  }, [])

  if (isLoading) {
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
              <SuggestionsLoading />
            </div>
          </div>
        </div>
      </main>
    )
  }

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
            <SuggestionsList initialSuggestions={suggestions} />
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
