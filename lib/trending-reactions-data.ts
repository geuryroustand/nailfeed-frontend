// Types for trending reactions
export type ReactionTrend = {
  emoji: string
  count: number
  percentChange: number // Percentage change from previous period
  posts: number[] // Post IDs where this reaction appears
}

export type TrendingReactionsResponse = {
  daily: ReactionTrend[]
  weekly: ReactionTrend[]
  mostUsed: ReactionTrend[]
}

// Sample trending reactions data - in a real app, this would come from a database
const trendingReactionsData: TrendingReactionsResponse = {
  daily: [
    { emoji: "❤️", count: 342, percentChange: 15, posts: [1, 5, 8, 12] },
    { emoji: "👍", count: 287, percentChange: 8, posts: [2, 3, 7, 9] },
    { emoji: "😂", count: 198, percentChange: 23, posts: [4, 6, 10] },
    { emoji: "😮", count: 124, percentChange: -5, posts: [11, 13] },
    { emoji: "😢", count: 87, percentChange: 12, posts: [14, 15] },
  ],
  weekly: [
    { emoji: "👍", count: 1245, percentChange: 5, posts: [1, 2, 3, 5, 7, 9, 11] },
    { emoji: "❤️", count: 1102, percentChange: 18, posts: [4, 6, 8, 10, 12, 14] },
    { emoji: "😂", count: 876, percentChange: 9, posts: [1, 3, 5, 7, 9, 11, 13, 15] },
    { emoji: "😮", count: 543, percentChange: 2, posts: [2, 4, 6, 8, 10, 12, 14] },
    { emoji: "😡", count: 321, percentChange: -8, posts: [1, 5, 9, 13] },
  ],
  mostUsed: [
    { emoji: "👍", count: 5432, percentChange: 0, posts: [] },
    { emoji: "❤️", count: 4987, percentChange: 0, posts: [] },
    { emoji: "😂", count: 3654, percentChange: 0, posts: [] },
    { emoji: "😮", count: 2321, percentChange: 0, posts: [] },
    { emoji: "😢", count: 1876, percentChange: 0, posts: [] },
  ],
}

// Function to get trending reactions
export async function getTrendingReactions(): Promise<TrendingReactionsResponse> {
  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return trendingReactionsData
}

// Function to update trending reactions when a user reacts
export async function updateTrendingReaction(
  emoji: string,
  postId: number,
  isAdding: boolean,
): Promise<{ success: boolean }> {
  // In a real app, this would update a database
  console.log(`${isAdding ? "Adding" : "Removing"} ${emoji} reaction to trending data for post ${postId}`)

  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Return success response
  return { success: true }
}
