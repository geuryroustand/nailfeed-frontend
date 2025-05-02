"use client"

import { useSearch } from "@/context/search-context"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Post from "@/components/post"

export default function SearchResults() {
  const { filteredPosts, isSearching, clearSearch } = useSearch()

  if (!isSearching) return null

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Search Results</h2>
        <Button variant="ghost" size="sm" onClick={clearSearch}>
          <X className="h-4 w-4 mr-1" />
          Clear search
        </Button>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-gray-500">
              Try adjusting your search or filter criteria to find what you're looking for.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          <AnimatePresence>
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Post post={post} viewMode="cards" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
