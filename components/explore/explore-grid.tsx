"use client"
import { motion } from "framer-motion"
import { Heart, MessageCircle } from "lucide-react"
import { Suspense } from "react"
import { getExplorePosts, getUserInteractions } from "@/lib/explore-data"
import ExploreGridClient from "./explore-grid-client"
import ExploreGridSkeleton from "./explore-grid-skeleton"

export default async function ExploreGrid() {
  // Fetch initial data in parallel
  const [postsResponse, userInteractions] = await Promise.all([
    getExplorePosts(12, null), // Initial page with 12 items
    getUserInteractions("current-user"), // In a real app, this would be the actual user ID
  ])

  // Combine posts with user interaction data
  const postsWithInteractions = postsResponse.data.map((post) => ({
    ...post,
    isLiked: userInteractions.likedPostIds.includes(post.id),
    isSaved: userInteractions.savedPostIds.includes(post.id),
  }))

  return (
    <Suspense fallback={<ExploreGridSkeleton />}>
      <ExploreGridClient
        initialPosts={postsWithInteractions}
        initialNextCursor={postsResponse.nextCursor}
        initialHasMore={postsResponse.hasMore}
      />
    </Suspense>
  )
}

interface ExplorePost {
  id: number
  image: string
  likes: number
  comments: number
  username: string
  userImage: string
  description: string
  tags: string[]
}

interface ExploreGridItemProps {
  post: ExplorePost
  index: number
  onClick: () => void
}

function ExploreGridItem({ post, index, onClick }: ExploreGridItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 0.98 }}
      className="relative aspect-square cursor-pointer group"
      onClick={onClick}
    >
      <img
        src={post.image || "/placeholder.svg"}
        alt={`Nail art by ${post.username}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center space-x-4 text-white">
          <div className="flex items-center">
            <Heart className="h-5 w-5 mr-1 fill-white" />
            <span className="text-sm font-medium">{post.likes}</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-1 fill-white" />
            <span className="text-sm font-medium">{post.comments}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const explorePosts: ExplorePost[] = [
  {
    id: 1,
    image: "/glitter-french-elegance.png",
    likes: 234,
    comments: 42,
    username: "nailartist",
    userImage: "/serene-woman-gaze.png",
    description: "French manicure with a twist! ✨ Added some glitter for that extra sparkle. What do you think?",
    tags: ["frenchtwist", "glitternails", "manicure"],
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
  },
]
