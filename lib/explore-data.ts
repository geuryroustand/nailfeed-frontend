export interface ExplorePost {
  id: number
  image: string
  likes: number
  comments: number
  username: string
  userImage: string
  description: string
  tags: string[]
  createdAt: string
}

export interface ExplorePostWithLiked extends ExplorePost {
  isLiked: boolean
  isSaved: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

// This would normally come from a database
export async function getExplorePosts(limit = 12, cursor?: string | null): Promise<PaginatedResponse<ExplorePost>> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real app, this would be a database query with pagination
  const allPosts = [
    {
      id: 1,
      image: "/glitter-french-elegance.png",
      likes: 234,
      comments: 42,
      username: "nailartist",
      userImage: "/serene-woman-gaze.png",
      description: "French manicure with a twist! ✨ Added some glitter for that extra sparkle. What do you think?",
      tags: ["frenchtwist", "glitternails", "manicure"],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      image: "/geometric-harmony.png",
      likes: 187,
      comments: 23,
      username: "trendynails",
      userImage: "/painted-nails-close-up.png",
      description: "Geometric vibes today! 📐 These took forever but I'm so happy with how they turned out.",
      tags: ["geometricnails", "naildesign", "nailart"],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      image: "/vibrant-floral-nails.png",
      likes: 312,
      comments: 56,
      username: "floralnails",
      userImage: "/diverse-avatars.png",
      description: "Spring is in the air! 🌸 Loving these floral designs for the season.",
      tags: ["floralnails", "springnails", "nailinspo"],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      image: "/abstract-pastel-swirls.png",
      likes: 156,
      comments: 18,
      username: "abstractnails",
      userImage: "/serene-woman-gaze.png",
      description: "Abstract art but make it nails 🎨 Pastel swirls are my current obsession!",
      tags: ["abstractnails", "pastelnails", "nailartist"],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      image: "/vibrant-abstract-nails.png",
      likes: 278,
      comments: 34,
      username: "nailpro",
      userImage: "/diverse-avatars.png",
      description: "Bold and bright abstract design for a client today! She loved it! 💅",
      tags: ["boldnails", "abstractart", "nailpro"],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 6,
      image: "/shimmering-gold-flakes.png",
      likes: 423,
      comments: 67,
      username: "luxurynails",
      userImage: "/painted-nails-close-up.png",
      description: "Luxury gold flakes for a touch of elegance ✨ Perfect for special occasions!",
      tags: ["goldnails", "luxurynails", "specialoccasion"],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 7,
      image: "/intricate-floral-nails.png",
      likes: 198,
      comments: 29,
      username: "detailednails",
      userImage: "/serene-woman-gaze.png",
      description: "The details in these floral nails took hours but were so worth it! Zoom in to see! 🔍🌺",
      tags: ["detailednails", "floralnailart", "handpainted"],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 8,
      image: "/subtle-nude-nails.png",
      likes: 145,
      comments: 12,
      username: "minimalistnails",
      userImage: "/diverse-avatars.png",
      description: "Sometimes less is more. Loving this clean minimalist design with a touch of gold.",
      tags: ["minimalistnails", "cleannails", "nudenails"],
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 9,
      image: "/blue-ombre-nails.png",
      likes: 267,
      comments: 31,
      username: "ombrenails",
      userImage: "/painted-nails-close-up.png",
      description: "Blue ombre for summer vibes 🌊 Perfect for beach days!",
      tags: ["ombrenails", "bluenails", "summernails"],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 10,
      image: "/delicate-daisies.png",
      likes: 389,
      comments: 47,
      username: "3dnailart",
      userImage: "/serene-woman-gaze.png",
      description: "3D flower nail art that pops! 🌸 These take skill but the result is amazing!",
      tags: ["3dnails", "flowernails", "dimensionalnails"],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 11,
      image: "/gold-veined-marble-nails.png",
      likes: 211,
      comments: 26,
      username: "marblenails",
      userImage: "/diverse-avatars.png",
      description: "Marble and gold - a classic combination that never goes out of style ✨",
      tags: ["marblenails", "goldaccents", "elegantnails"],
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 12,
      image: "/electric-angles.png",
      likes: 176,
      comments: 19,
      username: "neonnails",
      userImage: "/painted-nails-close-up.png",
      description: "Neon geometrics for those who love to stand out! 💚💗💛",
      tags: ["neonnails", "geometricdesign", "boldnails"],
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // Generate more posts for pagination demo
    ...Array.from({ length: 36 }).map((_, i) => ({
      id: i + 13,
      image: `/placeholder.svg?height=400&width=400&query=nail+art+design+${i + 1}`,
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 100),
      username: `user${i + 1}`,
      userImage: `/placeholder.svg?height=50&width=50&query=profile+${i + 1}`,
      description: `Beautiful nail art design #${i + 1}. What do you think?`,
      tags: ["nailart", `design${i + 1}`, "inspiration"],
      createdAt: new Date(Date.now() - (i + 10) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  ]

  // If cursor is provided, find the index of the post with that ID
  let startIndex = 0
  if (cursor) {
    const cursorId = Number.parseInt(cursor, 10)
    const cursorIndex = allPosts.findIndex((post) => post.id === cursorId)
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1
    }
  }

  // Get the posts for this page
  const paginatedPosts = allPosts.slice(startIndex, startIndex + limit)

  // Determine if there are more posts
  const hasMore = startIndex + limit < allPosts.length

  // Return the paginated response
  return {
    data: paginatedPosts,
    nextCursor: hasMore ? paginatedPosts[paginatedPosts.length - 1].id.toString() : null,
    hasMore,
  }
}

// Get user's liked and saved posts
export async function getUserInteractions(userId: string): Promise<{ likedPostIds: number[]; savedPostIds: number[] }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // This would normally come from a database
  return {
    likedPostIds: [1, 5, 9, 15, 20, 25],
    savedPostIds: [2, 6, 10, 18, 22, 30],
  }
}

// Get post comments
export async function getPostComments(postId: number) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400))

  // Generate 5 sample comments for the post
  return Array.from({ length: 5 }).map((_, i) => ({
    id: i + 1,
    postId,
    username: `user${i + 1}`,
    userImage: `/placeholder.svg?height=32&width=32&query=profile+${i}`,
    text: "This is amazing! Love the design and colors! 😍",
    createdAt: new Date(Date.now() - (i + 1) * 12 * 60 * 60 * 1000).toISOString(),
  }))
}
