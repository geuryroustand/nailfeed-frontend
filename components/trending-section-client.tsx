"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Bookmark, Heart } from "lucide-react"
import Link from "next/link"

// Define types for our props
export type TrendingTag = {
  id: number
  name: string
  count: number
}

export type SuggestedUser = {
  id: number
  username: string
  image: string
  bio: string
}

export type UserCollection = {
  id: number
  name: string
  itemCount: number
  isPrivate: boolean
  icon: string
  color: string
}

interface TrendingSectionClientProps {
  trendingTags: TrendingTag[]
  suggestedUsers: SuggestedUser[]
  userCollections: UserCollection[]
}

export function TrendingSectionClient({ trendingTags, suggestedUsers, userCollections }: TrendingSectionClientProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Trending Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 flex items-center">
          <TrendingUp className="h-5 w-5 text-pink-500 mr-2" />
          <h2 className="text-lg font-semibold">Trending Tags</h2>
        </div>

        <div className="p-4 space-y-3">
          {trendingTags.map((tag, index) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between group"
            >
              <Link
                href={`/explore?tag=${tag.name}`}
                className="flex items-center group-hover:text-pink-500 transition-colors"
              >
                <span className="text-gray-500 mr-2">#{index + 1}</span>
                <span className="font-medium">#{tag.name}</span>
              </Link>
              <span className="text-sm text-gray-500">{formatNumber(tag.count)}</span>
            </motion.div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <Link href="/explore" className="text-sm text-pink-500 font-medium hover:underline">
            See all trending
          </Link>
        </div>
      </motion.div>

      {/* Suggested Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 flex items-center">
          <Users className="h-5 w-5 text-pink-500 mr-2" />
          <h2 className="text-lg font-semibold">Suggested for You</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {suggestedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={user.image || "/placeholder.svg"} alt={user.username} />
                  <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.bio}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 rounded-full">
                Follow
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="p-4">
          <Link href="/explore/users" className="text-sm text-pink-500 font-medium hover:underline">
            See all suggestions
          </Link>
        </div>
      </motion.div>

      {/* Saved Collections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 flex items-center">
          <Bookmark className="h-5 w-5 text-pink-500 mr-2" />
          <h2 className="text-lg font-semibold">Your Collections</h2>
        </div>

        <div className="p-4 space-y-3">
          {userCollections.map((collection) => (
            <div key={collection.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`w-12 h-12 bg-${collection.color}-100 rounded-md flex items-center justify-center mr-3`}
                >
                  {collection.icon === "bookmark" ? (
                    <Bookmark className={`h-5 w-5 text-${collection.color}-500`} />
                  ) : (
                    <Heart className={`h-5 w-5 text-${collection.color}-500`} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{collection.name}</p>
                  <p className="text-xs text-gray-500">{collection.itemCount} items</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {collection.isPrivate ? "Private" : "Public"}
              </Badge>
            </div>
          ))}
        </div>

        <div className="p-4 pt-0">
          <Button variant="outline" className="w-full">
            View All Collections
          </Button>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-xs text-gray-500 space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/contact" className="hover:underline">
            Help
          </Link>
          <Link href="/policies/privacy-policy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/policies/terms-of-service" className="hover:underline">
            Terms
          </Link>
          <Link href="/policies/legal-notice" className="hover:underline">
            Legal
          </Link>
          <Link href="/policies/community-guidelines" className="hover:underline">
            Guidelines
          </Link>
          <Link href="#" className="hover:underline">
            Locations
          </Link>
          <Link href="#" className="hover:underline">
            Language
          </Link>
        </div>
        <p>© 2025 NAILFEED</p>
      </div>
    </div>
  )
}
