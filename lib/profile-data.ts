// Server-side data fetching for profile-related data

export type Post = {
  id: number
  image: string
  likes: number
  comments: number
  featured: boolean
  title: string
  createdAt?: string
}

export type Collection = {
  id: number
  name: string
  count: number
  cover: string
}

export async function fetchUserPosts() {
  // In a real app, this would fetch from a database
  return [
    {
      id: 1,
      image: "/glitter-french-elegance.png",
      likes: 234,
      comments: 42,
      featured: true,
      title: "Glitter French",
      createdAt: "2023-04-15T10:30:00Z",
    },
    {
      id: 2,
      image: "/geometric-harmony.png",
      likes: 187,
      comments: 23,
      featured: false,
      title: "Geometric Design",
      createdAt: "2023-04-10T14:20:00Z",
    },
    {
      id: 3,
      image: "/vibrant-floral-nails.png",
      likes: 312,
      comments: 56,
      featured: true,
      title: "Spring Florals",
      createdAt: "2023-04-05T09:15:00Z",
    },
    {
      id: 4,
      image: "/abstract-pastel-swirls.png",
      likes: 156,
      comments: 18,
      featured: false,
      title: "Pastel Swirls",
      createdAt: "2023-03-28T16:45:00Z",
    },
    {
      id: 5,
      image: "/vibrant-abstract-nails.png",
      likes: 278,
      comments: 34,
      featured: true,
      title: "Abstract Art",
      createdAt: "2023-03-22T11:10:00Z",
    },
    {
      id: 6,
      image: "/shimmering-gold-flakes.png",
      likes: 423,
      comments: 67,
      featured: false,
      title: "Gold Flakes",
      createdAt: "2023-03-18T13:25:00Z",
    },
    {
      id: 7,
      image: "/intricate-floral-nails.png",
      likes: 198,
      comments: 29,
      featured: true,
      title: "Intricate Florals",
      createdAt: "2023-03-12T15:30:00Z",
    },
    {
      id: 8,
      image: "/subtle-nude-nails.png",
      likes: 145,
      comments: 12,
      featured: false,
      title: "Nude Elegance",
      createdAt: "2023-03-05T10:45:00Z",
    },
    {
      id: 9,
      image: "/blue-ombre-nails.png",
      likes: 267,
      comments: 31,
      featured: false,
      title: "Blue Ombre",
      createdAt: "2023-02-28T14:20:00Z",
    },
    {
      id: 10,
      image: "/delicate-daisies.png",
      likes: 389,
      comments: 47,
      featured: true,
      title: "Daisy Design",
      createdAt: "2023-02-22T09:15:00Z",
    },
    {
      id: 11,
      image: "/gold-veined-marble-nails.png",
      likes: 211,
      comments: 26,
      featured: false,
      title: "Marble & Gold",
      createdAt: "2023-02-15T16:30:00Z",
    },
    {
      id: 12,
      image: "/electric-angles.png",
      likes: 176,
      comments: 19,
      featured: true,
      title: "Electric Angles",
      createdAt: "2023-02-10T11:40:00Z",
    },
  ]
}

export async function fetchUserCollections() {
  // In a real app, this would fetch from a database
  return [
    { id: 1, name: "Spring Collection", count: 12, cover: "/vibrant-floral-nails.png" },
    { id: 2, name: "Minimalist", count: 8, cover: "/subtle-nude-nails.png" },
    { id: 3, name: "Bold & Bright", count: 15, cover: "/electric-angles.png" },
    { id: 4, name: "Wedding Designs", count: 6, cover: "/glitter-french-elegance.png" },
  ]
}

// Types for server actions
export type LikeActionResult = {
  success: boolean
  postId: number
  newLikeCount: number
  message?: string
}

export type CommentActionResult = {
  success: boolean
  postId: number
  newCommentCount: number
  message?: string
}

export type CollectionActionResult = {
  success: boolean
  collectionId?: number
  message?: string
}
