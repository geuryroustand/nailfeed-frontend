import type { SuggestionVote } from "./SuggestionVote" // Assuming SuggestionVote is declared in another file

export interface Suggestion {
  id: number
  documentId: string
  title: string
  description: string
  category: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "completed" | "rejected"
  votes: number
  createdAt: string
  updatedAt: string
  user: {
    id: number
    documentId: string
    username: string
    email: string
    displayName?: string
  } | null
  suggestion_votes: SuggestionVote[]
  userHasVoted?: boolean // Added this field
  voteCount?: number
  isCreator?: boolean
}
