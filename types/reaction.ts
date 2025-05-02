export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry"

export interface Reaction {
  id: number | string
  type: ReactionType
  user: {
    id: number | string
    username: string
  }
  post: {
    id: number | string
  }
  createdAt: string
  updatedAt: string
}

export interface ReactionCounts {
  like: number
  love: number
  haha: number
  wow: number
  sad: number
  angry: number
  total: number
}
