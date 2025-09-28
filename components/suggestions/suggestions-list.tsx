"use client"

import { useState, useTransition, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronUp, Clock, CheckCircle, Wrench, Rocket, Heart, Info, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { voteSuggestion, type Suggestion } from "@/app/actions/suggestion-actions"

// Extend the interface for backwards compatibility
interface ExtendedSuggestion extends Suggestion {
  suggestionStatus?: "in-review" | "planned" | "in-development" | "released";
}
import { EditSuggestionModal } from "./edit-suggestion-modal"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

interface SuggestionsListProps {
  initialSuggestions: ExtendedSuggestion[]
  onAddSuggestion?: (suggestion: ExtendedSuggestion) => void
}

export default function SuggestionsList({ initialSuggestions, onAddSuggestion }: SuggestionsListProps) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [isPending, startTransition] = useTransition()
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null)
  const { toast } = useToast()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (onAddSuggestion) {
      onAddSuggestion((newSuggestion: Suggestion) => {
        setSuggestions((prev) => [newSuggestion, ...prev])
      })
    }
  }, [onAddSuggestion])

  useEffect(() => {
    setSuggestions(initialSuggestions)
  }, [initialSuggestions])

  const handleVote = async (suggestionId: string, hasVoted: boolean) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on suggestions.",
        variant: "destructive",
      })
      return
    }

    const action = hasVoted ? "unvote" : "vote"

    setSuggestions((prev) =>
      prev.map((suggestion) => {
        if (suggestion.documentId === suggestionId) {
          const currentCount = suggestion.voteCount || 0
          return {
            ...suggestion,
            voteCount: hasVoted ? currentCount - 1 : currentCount + 1,
            userHasVoted: !hasVoted,
          }
        }
        return suggestion
      }),
    )

    startTransition(async () => {
      const result = await voteSuggestion(suggestionId, action)

      if (!result.success) {
        setSuggestions((prev) =>
          prev.map((suggestion) => {
            if (suggestion.documentId === suggestionId) {
              const currentCount = suggestion.voteCount || 0
              return {
                ...suggestion,
                voteCount: hasVoted ? currentCount + 1 : currentCount - 1,
                userHasVoted: hasVoted,
              }
            }
            return suggestion
          }),
        )

        toast({
          title: "Error",
          description: result.error || "Failed to vote on suggestion",
          variant: "destructive",
        })
      } else {
        toast({
          title: hasVoted ? "Vote removed" : "Vote added",
          description: hasVoted ? "Your vote has been removed." : "Thank you for supporting this suggestion!",
        })
      }
    })
  }

  const handleSuggestionUpdated = (updatedSuggestion: Suggestion) => {
    setSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.documentId === updatedSuggestion.documentId ? { ...suggestion, ...updatedSuggestion } : suggestion,
      ),
    )

    toast({
      title: "Suggestion updated",
      description: "Your suggestion has been successfully updated.",
    })
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions yet</h3>
        <p className="text-gray-600">Be the first to suggest a new feature!</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">How voting works</h3>
              <p className="text-sm text-blue-700">
                Vote for suggestions you'd like to see implemented. Your votes help us prioritize which features to
                build next.
                {!user && " You'll need to log in to vote on suggestions."}
              </p>
            </div>
          </div>
        </div>

        {suggestions.filter(suggestion => suggestion && (suggestion.status || suggestion.suggestionStatus)).map((suggestion, index) => {
          const status = suggestion.status || suggestion.suggestionStatus || "in-review"
          const statusInfo = getStatusConfig(status)
          const StatusIcon = statusInfo.icon
          const hasVoted = suggestion.userHasVoted || false
          const voteCount = suggestion.voteCount || 0
          const isCreator = suggestion.isCreator || false

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={hasVoted ? "default" : "outline"}
                        size="lg"
                        className={cn(
                          "flex flex-col h-auto py-3 px-4 min-w-[80px] transition-all duration-200",
                          "focus:ring-2 focus:ring-pink-500 focus:ring-offset-2",
                          hasVoted
                            ? "bg-pink-500 hover:bg-pink-600 text-white shadow-md"
                            : "hover:bg-pink-50 hover:border-pink-300",
                          !user && "opacity-60 cursor-not-allowed",
                          isPending && "opacity-50",
                        )}
                        onClick={() => handleVote(suggestion.documentId, hasVoted)}
                        disabled={isPending || !user}
                        aria-label={
                          !user
                            ? "Log in to vote on this suggestion"
                            : hasVoted
                              ? `Remove your vote from "${suggestion.title}". Currently has ${voteCount} votes.`
                              : `Vote for "${suggestion.title}". Currently has ${voteCount} votes.`
                        }
                        aria-pressed={hasVoted}
                        role="button"
                      >
                        {hasVoted ? (
                          <Heart className="h-5 w-5 mb-1 fill-current" />
                        ) : (
                          <ChevronUp className="h-5 w-5 mb-1" />
                        )}
                        <span className="text-sm font-bold">{voteCount}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-sm">
                        {!user
                          ? "Log in to vote on suggestions"
                          : hasVoted
                            ? "Click to remove your vote"
                            : "Click to vote for this suggestion"}
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-medium">
                      {voteCount === 1 ? "1 vote" : `${voteCount} votes`}
                    </p>
                    {hasVoted && (
                      <p className="text-xs text-pink-600 font-medium mt-1">
                        <span className="sr-only">You voted for this suggestion</span>
                        Your vote
                      </p>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight pr-4">{suggestion.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isCreator && user && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              onClick={() => setEditingSuggestion(suggestion)}
                              aria-label={`Edit suggestion "${suggestion.title}"`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Edit your suggestion</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Badge className={cn(statusInfo.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 leading-relaxed">{suggestion.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Suggested by {suggestion.user?.username || "Anonymous"}
                      {isCreator && <span className="text-blue-600 font-medium ml-1">(You)</span>}
                    </span>
                    <time dateTime={suggestion.createdAt}>{new Date(suggestion.createdAt).toLocaleDateString()}</time>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}

        {editingSuggestion && (
          <EditSuggestionModal
            isOpen={!!editingSuggestion}
            onClose={() => setEditingSuggestion(null)}
            suggestion={editingSuggestion}
            onSuggestionUpdated={handleSuggestionUpdated}
          />
        )}
      </div>
    </TooltipProvider>
  )
}

const statusConfig = {
  "in-review": { label: "In Review", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  planned: { label: "Planned", icon: CheckCircle, color: "bg-blue-100 text-blue-800" },
  "in-development": { label: "In Development", icon: Wrench, color: "bg-purple-100 text-purple-800" },
  released: { label: "Released", icon: Rocket, color: "bg-green-100 text-green-800" },
} as const

const getStatusConfig = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig] || statusConfig["in-review"]
}
