import type { Post } from "@/lib/post-data"

// Sample post data for development and testing
const samplePosts: Post[] = [
  {
    id: 1,
    documentId: "post-1",
    username: "nailartist",
    userImage: "/serene-woman-gaze.png",
    image: "/intricate-nail-art.png",
    description: "Loving these intricate floral designs! #nailart #florals",
    likes: 120,
    comments: [],
    timestamp: "2 hours ago",
    tags: ["nailart", "florals", "design"],
    mediaItems: [
      {
        id: "media-1",
        type: "image",
        url: "/intricate-nail-art.png",
      },
    ],
    contentType: "image",
    galleryLayout: "featured",
  },
  {
    id: 2,
    documentId: "post-2",
    username: "naildesigner",
    userImage: "/vibrant-artist-portrait.png",
    image: "/geometric-harmony.png",
    description: "Geometric patterns are trending this season! #geometric #minimal",
    likes: 85,
    comments: [],
    timestamp: "5 hours ago",
    tags: ["geometric", "minimal", "nailart"],
    mediaItems: [
      {
        id: "media-2",
        type: "image",
        url: "/geometric-harmony.png",
      },
    ],
    contentType: "image",
    galleryLayout: "featured",
  },
  {
    id: 3,
    documentId: "post-3",
    username: "nailpro",
    userImage: "/vibrant-beauty-vlogger.png",
    image: "/marble-gold-nails.png",
    description: "Marble and gold - a timeless combination #marble #gold #luxury",
    likes: 210,
    comments: [],
    timestamp: "1 day ago",
    tags: ["marble", "gold", "luxury", "nailart"],
    mediaItems: [
      {
        id: "media-3",
        type: "image",
        url: "/marble-gold-nails.png",
      },
    ],
    contentType: "image",
    galleryLayout: "featured",
  },
  {
    id: 4,
    documentId: "post-4",
    username: "nailtrends",
    userImage: "/abstract-user-icon.png",
    image: "/neon-geometric-nails.png",
    description: "Neon vibes for summer! #neon #summer #bright",
    likes: 150,
    comments: [],
    timestamp: "2 days ago",
    tags: ["neon", "summer", "bright", "nailart"],
    mediaItems: [
      {
        id: "media-4",
        type: "image",
        url: "/neon-geometric-nails.png",
      },
    ],
    contentType: "image",
    galleryLayout: "featured",
  },
]

// Function to get a sample post by ID
export function getSamplePost(id: string): Post | null {
  const numericId = Number.parseInt(id.replace("post-", ""))
  const post = samplePosts.find((p) => p.id === numericId || p.documentId === id)
  return post || null
}

// Function to get related sample posts
export function getRelatedPosts(postId: string, limit = 4): Post[] {
  const id = postId.replace("post-", "")
  const numericId = Number.parseInt(id)

  // Filter out the current post and return up to the limit
  return samplePosts.filter((p) => p.id !== numericId && p.documentId !== postId).slice(0, limit)
}

// Function to get all sample posts
export function getAllSamplePosts(): Post[] {
  return [...samplePosts]
}
